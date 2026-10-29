import { describe, it, expect, beforeAll } from "vitest";

/**
 * Sanity — the négoce flow end to end, through the real routes:
 * dépôts → articles (carton, price levels) → purchase receptions (CMUP)
 * → devis → commande (reservation, credit limit) → BL partiels → facture
 * groupée (margin) · direct invoice · lots FEFO · transfer · inventory
 * count · counter sale (mixed payments, change, Z) · rep scoping ·
 * commissions · delivery round.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "negoce-flow-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const stock = require("../services/stockService");

let app;
let admin;
let rep;
let repId;
let companyId;
const ids = {};
const h = (t = admin) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  for (const [path, file] of [["warehouses", "warehouses"], ["brands", "brands"], ["stock", "stock"], ["products", "products"], ["inventory-categories", "inventoryCategories"],
    ["customers", "customers"], ["sales-settings", "salesSettings"], ["quotes", "quotes"], ["sales-orders", "salesOrders"], ["sales-invoices", "salesInvoices"],
    ["logistics", "logistics"], ["pos", "pos"], ["sales-reps", "salesReps"], ["dashboard", "dashboard"]]) {
    app.use(`/api/${path}`, require(`./${file}`));
  }
  tenantScope.enableStrictMode(true);
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "Smart Way" });
    const a = await User.create({ firstName: "Admin", lastName: "SW", email: "admin@sw.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const company = await Company.create({ name: "Smart Way", tenant: tenant._id, owner: a._id, industry: "Négoce", legalForm: "SARL" });
    companyId = String(company._id);
    const r = await User.create({ firstName: "Karim", lastName: "Rep", email: "karim@sw.ma", password: "secret12", role: "user", department: "sales", tenant: tenant._id });
    repId = String(r._id);
    admin = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    rep = jwt.sign({ id: repId }, process.env.JWT_SECRET);
  });
});

const post = (url, body, t) => request(app).post(url).set(h(t)).send(body);
const get = (url, t) => request(app).get(url).set(h(t));

describe("négoce flow", () => {
  it("sets up warehouses, families, brands and articles", async () => {
    const list = await get(`/api/warehouses?companyId=${companyId}`);
    expect(list.body.data).toHaveLength(1); // default "Dépôt principal"
    ids.dep = list.body.data[0]._id;
    const store = await post("/api/warehouses", { company: companyId, code: "SHOW", name: "Showroom Casablanca", kind: "store", hasCounter: true });
    expect(store.status).toBe(201);
    ids.store = store.body.data._id;

    const cat = await post("/api/inventory-categories", { company: companyId, name: "Sanitaire" });
    expect(cat.status).toBe(201);
    ids.cat = cat.body.data._id;
    const brand = await post("/api/brands", { company: companyId, name: "Grohe" });
    ids.brand = brand.body.data._id;

    const p = await post("/api/products", {
      company: companyId, category: ids.cat, brand: ids.brand, name: "Mitigeur lavabo Eurosmart", internalReference: "GRO-ES-01", barcode: "4005176000001",
      unit: "pièce", vatRate: 20, sellingPrice: 400, threshold: 5,
      packagings: [{ unit: "Carton", factor: 6, barcode: "4005176000018" }],
      priceLevels: [{ level: "P1", price: 250 }, { level: "P3", price: 350 }],
    });
    expect(p.status).toBe(201);
    ids.mitigeur = p.body.data._id;

    const scan = await get(`/api/products/lookup?companyId=${companyId}&code=4005176000018`);
    expect(scan.body.data.unit).toBe("Carton");
    expect(scan.body.data.unitFactor).toBe(6);

    // A printed QR label of an article with no barcode carries its id.
    const byId = await get(`/api/products/lookup?companyId=${companyId}&code=${ids.mitigeur}`);
    expect(byId.body.data.product.name).toBe("Mitigeur lavabo Eurosmart");
    expect(byId.body.data.unit).toBe("pièce");
    const otherId = "0123456789abcdef01234567";
    expect((await get(`/api/products/lookup?companyId=${companyId}&code=${otherId}`)).status).toBe(404);
  });

  it("purchase receptions recompute the CMUP", async () => {
    await tenantScope.runAsSystem(async () => {
      await stock.receive({ product: ids.mitigeur, warehouse: ids.dep, quantity: 10, unitCost: 200, source: { kind: "purchase" }, isPurchase: true });
      await stock.receive({ product: ids.mitigeur, warehouse: ids.dep, quantity: 30, unitCost: 220, source: { kind: "purchase" }, isPurchase: true });
    });
    const p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(40);
    expect(p.body.data.avgCost).toBe(215); // (10×200 + 30×220) / 40
    expect(p.body.data.lastPurchasePrice).toBe(220);
    const p1 = p.body.data.levelPrices.find((l) => l.code === "P1");
    expect(p1).toMatchObject({ price: 250, origin: "article" });
    const p2 = p.body.data.levelPrices.find((l) => l.code === "P2");
    expect(p2.origin).toBe("markup"); // CMUP × 1.22
    expect(p2.price).toBe(262.3);
  });

  it("compares the buying prices of every supplier and keeps a photo link", async () => {
    const Product = require("../models/Product");
    await tenantScope.runAsSystem(() => Product.updateOne({ _id: ids.mitigeur }, { $set: { prices: [
      { supplierName: "Grohe Maroc", price: 210, supplierReference: "GR-1" },
      { supplierName: "Bati-Import", price: 198 },
      { supplierName: "Comptoir Atlas", price: 230 },
    ] } }));
    const r = await get(`/api/products/${ids.mitigeur}/supplier-prices`);
    expect(r.status).toBe(200);
    expect(r.body.data.suppliers.map((x) => x.supplier.name)).toEqual(["Bati-Import", "Grohe Maroc", "Comptoir Atlas"]);
    expect(r.body.data.suppliers[1]).toMatchObject({ catalogPrice: 210, supplierReference: "GR-1", bestPrice: 210 });
    expect(r.body.data.product.avgCost).toBe(215);

    await request(app).put(`/api/products/${ids.mitigeur}`).set(h()).send({ imageUrl: "javascript:alert(1)" }).expect(400);
    await request(app).put(`/api/products/${ids.mitigeur}`).set(h()).send({ imageUrl: "https://cdn.example.com/mitigeur.jpg" }).expect(200);
    const p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.image.url).toBe("https://cdn.example.com/mitigeur.jpg");
    expect(p.body.data.name).toBeTruthy(); // a photo-only update leaves the rest alone
  });

  it("devis → commande at the customer's level, with the stock reserved", async () => {
    const c = await post("/api/customers", { company: companyId, name: "Quincaillerie Al Amal", type: "reseller", priceLevel: "P1", salesRep: repId, creditLimit: 20000, paymentDays: 30, ice: "001234567000089" });
    expect(c.status).toBe(201);
    expect(c.body.data.code).toBe("CL-0001");
    ids.amal = c.body.data._id;

    const q = await post("/api/quotes", { company: companyId, customer: ids.amal, lines: [{ product: ids.mitigeur, quantity: 2, unit: "Carton" }] });
    expect(q.status).toBe(201);
    expect(q.body.data.lines[0].unitPrice).toBe(1500); // P1 250 × 6
    expect(q.body.data.lines[0].unitFactor).toBe(6);
    expect(q.body.data.totalTTC).toBe(3600);

    const o = await post(`/api/quotes/${q.body.data._id}/order`, {});
    expect(o.status).toBe(201);
    expect(o.body.data.number).toMatch(/^CC-\d{4}-0001$/);
    ids.order = o.body.data._id;
    const conf = await post(`/api/sales-orders/${ids.order}/confirm`, {});
    expect(conf.status).toBe(200);
    expect(conf.body.data.status).toBe("confirmed");

    const p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.reserved).toBe(12);
    expect(p.body.data.available).toBe(28);
  });

  it("refuses an order over the credit limit", async () => {
    const o = await post("/api/sales-orders", { company: companyId, customer: ids.amal, lines: [{ product: ids.mitigeur, quantity: 60 }] });
    expect(o.status).toBe(201); // 60 × 300 TTC + 3 600 already ordered > 20 000
    const conf = await post(`/api/sales-orders/${o.body.data._id}/confirm`, {});
    expect(conf.status).toBe(409);
    expect(conf.body.code).toBe("CREDIT_LIMIT");
    await post(`/api/sales-orders/${o.body.data._id}/cancel`, {}).expect(200);
  });

  it("partial BLs take stock at the CMUP, then one invoice groups them", async () => {
    const order = await get(`/api/sales-orders/${ids.order}`);
    const lineId = order.body.data.lines[0]._id;
    const bl1 = await post(`/api/sales-orders/${ids.order}/deliver`, { lines: [{ lineId, quantity: 1 }], validate: true });
    expect(bl1.status).toBe(201);
    expect(bl1.body.data.status).toBe("validated");
    expect(bl1.body.data.lines[0].unitCost).toBe(215);
    let o = await get(`/api/sales-orders/${ids.order}`);
    expect(o.body.data.status).toBe("partially_delivered");
    let p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(34);
    expect(p.body.data.reserved).toBe(6);

    const bl2 = await post(`/api/sales-orders/${ids.order}/deliver`, { validate: true });
    expect(bl2.status).toBe(201);
    o = await get(`/api/sales-orders/${ids.order}`);
    expect(o.body.data.status).toBe("delivered");
    p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(28);
    expect(p.body.data.reserved).toBe(0);

    const toInvoice = await get(`/api/logistics/delivery-notes?companyId=${companyId}&toInvoice=true`);
    expect(toInvoice.body.data).toHaveLength(2);
    const inv = await post("/api/logistics/delivery-notes/invoice", { ids: toInvoice.body.data.map((n) => n._id) });
    expect(inv.status).toBe(201);
    expect(inv.body.data.totalHT).toBe(3000);
    expect(inv.body.data.costTotal).toBe(2580); // 12 × 215
    const issued = await post(`/api/sales-invoices/${inv.body.data._id}/issue`, {});
    expect(issued.status).toBe(200);
    expect(issued.body.data.number).toMatch(/^FA-\d{4}-0001$/);
    ids.invoice = inv.body.data._id;
    o = await get(`/api/sales-orders/${ids.order}`);
    expect(o.body.data.status).toBe("invoiced");
    // Stock didn't move twice
    p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(28);
  });

  it("a direct invoice moves the stock when issued", async () => {
    const c = await post("/api/customers", { company: companyId, name: "Plomberie Atlas", type: "installer", priceLevel: "P3", documentFlow: "direct" });
    ids.atlas = c.body.data._id;
    const inv = await post("/api/sales-invoices", { company: companyId, customer: ids.atlas, lines: [{ product: ids.mitigeur, quantity: 3 }] });
    expect(inv.status).toBe(201);
    expect(inv.body.data.moveStock).toBe(true);
    expect(inv.body.data.lines[0].unitPrice).toBe(350);
    let p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(28);
    const issued = await post(`/api/sales-invoices/${inv.body.data._id}/issue`, {});
    expect(issued.status).toBe(200);
    p = await get(`/api/products/${ids.mitigeur}`);
    expect(p.body.data.quantity).toBe(25);
    const mv = await get(`/api/stock/movements?companyId=${companyId}&kind=invoice`);
    expect(mv.body.data).toHaveLength(1);
  });

  it("lots leave FEFO, transfers move them, counts adjust", async () => {
    const p = await post("/api/products", { company: companyId, category: ids.cat, name: "Silicone sanitaire blanc 280 ml", unit: "cartouche", tracking: "lot", hasExpiry: true, sellingPrice: 35 });
    ids.silicone = p.body.data._id;
    const soon = new Date(Date.now() + 40 * 86400000).toISOString();
    const later = new Date(Date.now() + 300 * 86400000).toISOString();
    let r = await post(`/api/products/${ids.silicone}/adjust`, { type: "in", warehouse: ids.dep, quantity: 50, unitCost: 18, lots: [{ number: "L-LATE", quantity: 30, expiryDate: later }, { number: "L-SOON", quantity: 20, expiryDate: soon }] });
    expect(r.status).toBe(200);
    // Lot-tracked without lots → refused
    r = await post(`/api/products/${ids.silicone}/adjust`, { type: "in", warehouse: ids.dep, quantity: 5, unitCost: 18 });
    expect(r.status).toBe(400);

    const t = await post("/api/stock/transfers", { company: companyId, from: ids.dep, to: ids.store, lines: [{ product: ids.silicone, quantity: 25 }], send: true });
    expect(t.status).toBe(201);
    expect(t.body.data.status).toBe("sent");
    expect(t.body.data.lines[0].lots.map((l) => [l.number, l.quantity])).toEqual([["L-SOON", 20], ["L-LATE", 5]]); // FEFO
    const rec = await post(`/api/stock/transfers/${t.body.data._id}/receive`, { lines: [{ lineId: t.body.data.lines[0]._id, receivedQuantity: 24 }] });
    expect(rec.status).toBe(200);
    const lots = await get(`/api/products/${ids.silicone}/lots?warehouse=${ids.store}`);
    expect(lots.body.data.map((l) => [l.number, l.quantity])).toEqual([["L-SOON", 20], ["L-LATE", 4]]);
    const prod = await get(`/api/products/${ids.silicone}`);
    expect(prod.body.data.quantity).toBe(50); // 1 came back to the origin
    const exp = await get(`/api/stock/expiring?companyId=${companyId}&days=60`);
    expect(exp.body.data.length).toBeGreaterThan(0);

    const count = await post("/api/stock/counts", { company: companyId, warehouse: ids.dep, category: ids.cat });
    expect(count.status).toBe(201);
    const line = count.body.data.lines.find((l) => String(l.product._id) === String(ids.mitigeur));
    expect(line.expected).toBe(25);
    await request(app).put(`/api/stock/counts/${count.body.data._id}`).set(h()).send({ lines: [{ lineId: line._id, counted: 24 }] }).expect(200);
    const v = await post(`/api/stock/counts/${count.body.data._id}/validate`, {});
    expect(v.status).toBe(200);
    expect(v.body.data.gapValue).toBe(-215);
    const after = await get(`/api/products/${ids.mitigeur}`);
    expect(after.body.data.quantity).toBe(24);
  });

  it("counter sale: mixed payments, change, ticket, Z of the session, refund", async () => {
    // Stock in the showroom
    await post("/api/stock/transfers", { company: companyId, from: ids.dep, to: ids.store, lines: [{ product: ids.mitigeur, quantity: 4 }], send: true })
      .then((t) => post(`/api/stock/transfers/${t.body.data._id}/receive`, {}));
    const s = await post("/api/pos/sessions/open", { company: companyId, warehouse: ids.store, openingFloat: 500 });
    expect(s.status).toBe(201);
    ids.session = s.body.data._id;
    // P4 Comptoir = CMUP × 1.40: mitigeur 301 HT → 361.20 TTC ; silicone 25.20 HT × 2 → 60.48 TTC
    const sale = await post("/api/pos/sales", {
      session: ids.session,
      lines: [{ product: ids.mitigeur, quantity: 1 }, { product: ids.silicone, quantity: 2 }],
      payments: [{ method: "carte", amount: 200 }, { method: "especes", amount: 300 }],
    });
    expect(sale.status).toBe(201);
    expect(sale.body.data.totalTTC).toBe(421.68);
    expect(sale.body.data.change).toBe(78.32);
    expect(sale.body.data.number).toMatch(/^TK-/);
    const ticket = await get(`/api/pos/sales/${sale.body.data._id}`);
    expect(ticket.body.data.ticketFooter).toBeTruthy();
    // Not enough paid
    const short = await post("/api/pos/sales", { session: ids.session, lines: [{ product: ids.mitigeur, quantity: 1 }], payments: [{ method: "especes", amount: 10 }] });
    expect(short.status).toBe(400);

    let cur = await get(`/api/pos/sessions/current?companyId=${companyId}`);
    expect(cur.body.data.expected.especes).toBe(721.68); // 500 + 300 − 78.32
    expect(cur.body.data.expected.carte).toBe(200);

    const refund = await post(`/api/pos/sales/${sale.body.data._id}/refund`, { reason: "erreur" });
    expect(refund.status).toBe(200);
    cur = await get(`/api/pos/sessions/current?companyId=${companyId}`);
    expect(cur.body.data.expected.especes).toBe(500);

    const close = await post(`/api/pos/sessions/${ids.session}/close`, { counted: { especes: 495, carte: 0 } });
    expect(close.status).toBe(200);
    expect(close.body.data.difference).toBe(-5);
  });

  it("a rep only sees their customers; performance and commission", async () => {
    const mine = await get(`/api/customers?companyId=${companyId}`, rep);
    expect(mine.status).toBe(200);
    expect(mine.body.data.map((c) => c.name)).toEqual(["Quincaillerie Al Amal"]);
    const other = await get(`/api/customers/${ids.atlas}`, rep);
    expect(other.status).toBe(403);
    const invs = await get(`/api/sales-invoices?companyId=${companyId}`, rep);
    expect(invs.body.data).toHaveLength(1);

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await request(app).put("/api/sales-reps/targets").set(h()).send({ company: companyId, salesRep: repId, period, revenueTarget: 2500, commissionRate: 3, bonus: 500 }).expect(200);
    await post(`/api/sales-invoices/${ids.invoice}/payments`, { amount: 1200, method: "cheque", reference: "CHQ 1234" }).expect(201);
    const perf = await get(`/api/sales-reps/performance?companyId=${companyId}&period=${period}`, rep);
    expect(perf.status).toBe(200);
    expect(perf.body.data.rows).toHaveLength(1); // a rep only sees their own figures
    const row = perf.body.data.rows[0];
    expect(row.invoicedHT).toBe(3000);
    expect(row.marginHT).toBe(420);
    expect(row.collected).toBe(1200);
    expect(row.achievement).toBe(120);
    // default base "collected": 1000 HT × 3% + bonus 500
    expect(row.commission).toBe(530);

    const coll = await get(`/api/sales-reps/collections?companyId=${companyId}`, rep);
    expect(coll.body.data.totals.total).toBe(2400);
    const act = await post(`/api/sales-reps/collections/${ids.invoice}/actions`, { type: "promise", promiseDate: new Date(Date.now() + 5 * 86400000).toISOString(), promiseAmount: 2400 }, rep);
    expect(act.status).toBe(201);
  });

  it("delivery round: BLs leave with the truck and come back delivered", async () => {
    const bl = await post("/api/logistics/delivery-notes", { company: companyId, customer: ids.atlas, warehouse: ids.dep, lines: [{ product: ids.silicone, quantity: 10 }] });
    expect(bl.status).toBe(201);
    expect(bl.body.data.status).toBe("draft");
    const round = await post("/api/logistics/rounds", { company: companyId, date: new Date().toISOString(), vehicle: "12345-A-6", driver: "Hamid", noteIds: [bl.body.data._id] });
    expect(round.status).toBe(201);
    expect(round.body.data.notes).toHaveLength(1);
    const start = await post(`/api/logistics/rounds/${round.body.data._id}/start`, {});
    expect(start.body.data.notes[0].status).toBe("validated");
    const finish = await post(`/api/logistics/rounds/${round.body.data._id}/finish`, { results: [{ noteId: bl.body.data._id, delivered: true, receivedBy: "M. Atlas", cashCollected: 420 }] });
    expect(finish.status).toBe(200);
    expect(finish.body.data.status).toBe("done");
    expect(finish.body.data.notes[0].status).toBe("delivered");
    expect(finish.body.data.cashCollected).toBe(420);

    const dash = await get(`/api/dashboard?companyId=${companyId}`);
    expect(dash.status).toBe(200);
    expect(dash.body.data.toInvoice).toBe(1);
    expect(dash.body.data.receivables).toBeGreaterThan(0);
  });
});
