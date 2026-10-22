import { describe, it, expect, beforeAll } from "vitest";

/** Frais d'approche: spread over the received lines, they enter the CMUP. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { allocate, normalizeCosts } = require("../services/landedCost");

process.env.JWT_SECRET = "landed-secret";

const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const InventoryMovement = require("../models/InventoryMovement");

describe("allocation", () => {
  const lines = [
    { key: "a", quantity: 100, unitPrice: 10, weightKg: 1 }, // 1 000 value, 100 kg
    { key: "b", quantity: 10, unitPrice: 300, weightKg: 30 }, // 3 000 value, 300 kg
  ];
  it("spreads by value, quantity and weight, to the cent", () => {
    const { costs } = normalizeCosts([
      { label: "Droits d'importation", kind: "customs", percent: 10, allocation: "value" }, // 400
      { label: "Fret", kind: "freight", amount: 800, allocation: "weight" }, // a 200 / b 600
      { label: "Manutention", kind: "handling", amount: 110, allocation: "quantity" }, // a 100 / b 10
    ]);
    const out = allocate(lines, costs);
    expect(out.totalGoods).toBe(4000);
    expect(out.totalCosts).toBe(1310);
    const [a, b] = out.lines;
    expect(a.extra).toBe(100 + 200 + 100);
    expect(b.extra).toBe(300 + 600 + 10);
    expect(a.unitCost).toBe(14);
    expect(b.unitCost).toBe(391);
    expect(a.extra + b.extra).toBe(out.totalCosts);
    expect(out.coefficient).toBe(1.3275);
  });
  it("converts a foreign-currency price and falls back to value without weights", () => {
    const { costs } = normalizeCosts([{ label: "Transport", amount: 100, allocation: "weight" }]);
    const out = allocate([{ key: "x", quantity: 3, unitPrice: 1 }, { key: "y", quantity: 3, unitPrice: 2, weightKg: 5 }], costs, { exchangeRate: 10.85 });
    expect(out.lines[0].goodsUnitCost).toBe(10.85);
    expect(out.warnings[0]).toMatch(/poids manquant/);
    expect(out.lines[0].extra).toBeCloseTo(33.33, 2);
    expect(out.lines[0].extra + out.lines[1].extra).toBeCloseTo(100, 2);
  });
  it("refuses incomplete costs", () => {
    expect(normalizeCosts([{ label: "Fret" }]).errors[0]).toMatch(/montant ou pourcentage/);
    expect(normalizeCosts([{ amount: 5 }]).errors[0]).toMatch(/libellé/);
  });
});

describe("reception with landed costs", () => {
  let app;
  let demo;
  let token;
  let order;
  let p1;
  let p2;
  beforeAll(async () => {
    fake.connect();
    app = express();
    app.use(express.json());
    app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
    app.use("/api/purchase-orders", require("./purchaseOrders"));
    demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
    token = jwt.sign({ id: String(demo.users.admin._id) }, process.env.JWT_SECRET);
    await tenantScope.runAsSystem(async () => {
      const sup = await Supplier.create({ company: demo.company._id, name: "Guangzhou Ceramics Ltd" });
      const category = demo.products[Object.keys(demo.products)[0]].category;
      p1 = await Product.create({ company: demo.company._id, category, name: "Carreau 60x60 import", internalReference: "IMP-CAR-60", unit: "m²", weightKg: 20, sellingPrice: 150 });
      p2 = await Product.create({ company: demo.company._id, category, name: "Robinet import", internalReference: "IMP-ROB-1", unit: "pièce", weightKg: 1, sellingPrice: 400 });
      order = await PurchaseOrder.create({
        company: demo.company._id, number: "BC-IMP-001", supplier: sup._id, status: "sent",
        lines: [
          { product: p1._id, description: "Carreau 60x60", quantity: 500, unit: "m²", unitPrice: 5, vatRate: 20 }, // € → 2 500 €
          { product: p2._id, description: "Robinet", quantity: 100, unit: "pièce", unitPrice: 15, vatRate: 20 }, // 1 500 €
        ],
      });
    });
  }, 120000);

  const h = () => ({ Authorization: `Bearer ${token}` });
  const lines = () => order.lines.map((l) => ({ lineId: String(l._id), quantity: l.quantity }));
  const costs = [
    { label: "Fret maritime", kind: "freight", amount: 6000, allocation: "weight" }, // 10 000 kg + 100 kg
    { label: "Droits d'importation 17,5 %", kind: "customs", percent: 17.5, allocation: "value" },
    { label: "Transitaire", kind: "transit", amount: 2000 },
  ];

  it("previews the cost price of each line", async () => {
    const r = await request(app).post(`/api/purchase-orders/${order._id}/receptions/landed-preview`).set(h()).send({ lines: lines(), costs, exchangeRate: 10.8 });
    expect(r.status).toBe(200);
    expect(r.body.data.totalGoods).toBe(43200);
    expect(r.body.data.totalCosts).toBe(6000 + 7560 + 2000);
    expect(r.body.data.lines[0].description).toBe("Carreau 60x60");
    expect(r.body.data.lines[0].unitCost).toBeGreaterThan(54);
  });

  it("receives at landed cost: the CMUP includes freight, duties and transit", async () => {
    const r = await request(app).post(`/api/purchase-orders/${order._id}/receptions`).set(h())
      .send({ type: "reception", reference: "BL-CONT-778", lines: JSON.stringify(lines()), costs: JSON.stringify(costs), exchangeRate: "10.8" });
    expect(r.status).toBe(201);
    const rec = r.body.data.receptions[0];
    expect(rec.landed.totalCosts).toBe(15560);
    const prev = (await request(app).post(`/api/purchase-orders/${order._id}/receptions/landed-preview`).set(h()).send({ lines: lines(), costs, exchangeRate: 10.8 })).body.data;
    const [car, rob] = await tenantScope.runAsSystem(() => Promise.all([Product.findById(p1._id).lean(), Product.findById(p2._id).lean()]));
    expect(car.quantity).toBe(500);
    expect(car.avgCost).toBeCloseTo(prev.lines[0].unitCost, 3);
    expect(rob.avgCost).toBeCloseTo(prev.lines[1].unitCost, 3);
    // value received in stock = goods + every cost
    expect(car.avgCost * 500 + rob.avgCost * 100).toBeCloseTo(43200 + 15560, 0);
    await request(app).post(`/api/purchase-orders/${order._id}/receptions`).set(h())
      .send({ type: "reception", reference: "X", lines: JSON.stringify([]), costs: JSON.stringify([{ label: "Fret" }]) }).expect(400);
  });

  it("adds a late transit invoice: revalues what is still in stock", async () => {
    // 100 m² already sold
    await tenantScope.runAsSystem(() => require("../services/stockService").issue({ product: p1._id, quantity: 100, reason: "test", actorId: demo.users.admin._id }));
    const before = await tenantScope.runAsSystem(() => Product.findById(p1._id).lean());
    const fresh = await tenantScope.runAsSystem(() => PurchaseOrder.findById(order._id).lean());
    const recId = fresh.receptions[0]._id;
    const r = await request(app).post(`/api/purchase-orders/${order._id}/receptions/${recId}/costs`).set(h())
      .send({ costs: [{ label: "Magasinage port", kind: "handling", amount: 1000, allocation: "quantity", supplierName: "Marsa Maroc", reference: "F-889" }] });
    expect(r.status).toBe(200);
    const car = r.body.data.revalued.find((x) => x.name === "Carreau 60x60 import");
    // 1000 × 500/600 = 833.33 for the tiles; 400 of 500 still in stock → 666.67 on stock
    expect(car.extra).toBeCloseTo(833.33, 2);
    expect(car.onStock).toBeCloseTo(666.66, 2);
    const after = await tenantScope.runAsSystem(() => Product.findById(p1._id).lean());
    expect(after.avgCost).toBeCloseTo(before.avgCost + 666.66 / 400, 3);
    expect(r.body.data.order.receptions[0].landed.totalCosts).toBe(16560);
    const mv = await tenantScope.runAsSystem(() => InventoryMovement.findOne({ product: p1._id, "source.kind": "landed_cost" }).lean());
    expect(mv.reason).toMatch(/déjà vendu/);
  });
});
