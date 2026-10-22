import { describe, it, expect, beforeAll } from "vitest";

/**
 * Sanity Droguerie — the shop edition's one-step routes, end to end:
 * quick article → quick purchase (stock in at cost, supplier debt) →
 * counter sales on the carnet → payment settled oldest first → supplier
 * payment → the shop home. Plus the "article divers" counter line.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "droguerie-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");

let app;
let admin;
let companyId;
let otherCompanyId;
const ids = {};
const h = () => ({ Authorization: `Bearer ${admin}` });
const post = (url, body) => request(app).post(url).set(h()).send(body);
const get = (url) => request(app).get(url).set(h());

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  for (const [path, file] of [["droguerie", "droguerie"], ["pos", "pos"], ["customers", "customers"], ["sales-settings", "salesSettings"], ["products", "products"], ["users", "users"]]) {
    app.use(`/api/${path}`, require(`./${file}`));
  }
  tenantScope.enableStrictMode(true);
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "Droguerie Al Baraka", edition: "droguerie" });
    const a = await User.create({ firstName: "Hassan", lastName: "B", email: "hassan@baraka.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const company = await Company.create({ name: "Droguerie Al Baraka", tenant: tenant._id, owner: a._id, legalForm: "SARL", industry: "Droguerie" });
    companyId = String(company._id);
    admin = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    const other = await Tenant.create({ name: "Autre" });
    const ou = await User.create({ firstName: "O", lastName: "T", email: "o@t.ma", password: "secret12", role: "admin", tenant: other._id });
    otherCompanyId = String((await Company.create({ name: "Autre", tenant: other._id, owner: ou._id, legalForm: "SARL", industry: "Négoce" }))._id);
  });
});

describe("droguerie edition", () => {
  it("tells the frontend which edition the client uses", async () => {
    const me = await get("/api/users/me");
    expect(me.body.data.edition).toBe("droguerie");
  });

  it("creates an article in one step, one TTC price for everyone", async () => {
    const r = await post("/api/droguerie/articles/quick", { companyId, name: "Peinture Colorado blanc 4L", salePriceTTC: 120, unit: "pot", threshold: 8 });
    expect(r.status).toBe(201);
    ids.paint = r.body.data._id;
    expect(r.body.data.vatRate).toBe(20);
    expect(r.body.data.sellingPrice).toBe(100);
    expect(r.body.data.priceLevels.map((l) => l.price)).toEqual([100, 100, 100, 100]);
    const dup = await post("/api/droguerie/articles/quick", { companyId, name: "X", salePriceTTC: 1, barcode: "611" });
    expect(dup.status).toBe(201);
    expect((await post("/api/droguerie/articles/quick", { companyId, name: "Y", salePriceTTC: 1, barcode: "611" })).status).toBe(409);
    expect((await post("/api/droguerie/articles/quick", { companyId, name: "" })).status).toBe(400);
  });

  it("a shop outside VAT gets 0 % articles", async () => {
    await request(app).put(`/api/sales-settings?companyId=${companyId}`).set(h()).send({ companyId, vatRegistered: false });
    const r = await post("/api/droguerie/articles/quick", { companyId, name: "Javel 1L", salePriceTTC: 8 });
    expect(r.body.data.vatRate).toBe(0);
    expect(r.body.data.sellingPrice).toBe(8);
    await request(app).put(`/api/sales-settings?companyId=${companyId}`).set(h()).send({ companyId, vatRegistered: true });
  });

  it("records a purchase in one step: stock in, supplier bill, part paid", async () => {
    const r = await post("/api/droguerie/purchases", {
      companyId,
      supplierName: "Grossiste Derb Omar",
      reference: "BL 4521",
      lines: [
        { product: ids.paint, quantity: 10, unitCost: 84 }, // 70 HT
        { newArticle: { name: "Rouleau 18 cm", salePriceTTC: 30, unit: "pièce" }, quantity: 5, unitCost: 18 },
      ],
      paid: { amount: 500, method: "especes" },
    });
    expect(r.status).toBe(201);
    expect(r.body.data.totalTTC).toBe(930);
    expect(r.body.data.owed).toBe(430);
    const p = await get(`/api/products/${ids.paint}`);
    expect(p.body.data.quantity).toBe(10);
    expect(p.body.data.avgCost).toBe(70);
    const s = await get(`/api/droguerie/suppliers?companyId=${companyId}`);
    ids.supplier = s.body.data.rows[0]._id;
    expect(s.body.data.rows[0]).toMatchObject({ name: "Grossiste Derb Omar", due: 430 });
    expect((await post("/api/droguerie/purchases", { companyId, lines: [] })).status).toBe(400);
  });

  it("pays a supplier, never more than owed", async () => {
    expect((await post(`/api/droguerie/suppliers/${ids.supplier}/payment`, { amount: 1000 })).status).toBe(400);
    const r = await post(`/api/droguerie/suppliers/${ids.supplier}/payment`, { amount: 130, method: "cheque" });
    expect(r.status).toBe(201);
    expect(r.body.data.remaining).toBe(300);
  });

  it("sells on the carnet, then settles the oldest debt first", async () => {
    const c = await post("/api/customers", { company: companyId, name: "Mustapha le peintre", type: "retail", phone: "0661000000" });
    ids.mustapha = c.body.data._id;
    const s = await post("/api/pos/sessions/open", { company: companyId, openingFloat: 200 });
    expect(s.status).toBe(201);
    ids.session = s.body.data._id;
    for (const qty of [1, 2]) {
      // eslint-disable-next-line no-await-in-loop
      const sale = await post("/api/pos/sales", { session: ids.session, customer: ids.mustapha, lines: [{ product: ids.paint, quantity: qty }], payments: [{ method: "credit", amount: 120 * qty }] });
      expect(sale.status).toBe(201);
    }
    // "article divers": a description and a price, no stock
    const divers = await post("/api/pos/sales", { session: ids.session, lines: [{ description: "Clés reproduites", quantity: 2, unitPrice: 12.5, vatRate: 20 }], payments: [{ method: "especes", amount: 50 }] });
    expect(divers.status).toBe(201);
    expect(divers.body.data.totalTTC).toBe(30);

    let carnet = await get(`/api/droguerie/carnet?companyId=${companyId}`);
    expect(carnet.body.data.rows).toHaveLength(1);
    expect(carnet.body.data.rows[0]).toMatchObject({ name: "Mustapha le peintre", due: 360, open: 2 });

    expect((await post(`/api/droguerie/carnet/${ids.mustapha}/payment`, { amount: 400 })).status).toBe(400);
    const pay = await post(`/api/droguerie/carnet/${ids.mustapha}/payment`, { amount: 200, method: "especes" });
    expect(pay.status).toBe(201);
    expect(pay.body.data.settled.map((x) => x.amount)).toEqual([120, 80]);
    expect(pay.body.data.remaining).toBe(160);

    const account = await get(`/api/droguerie/carnet/${ids.mustapha}`);
    expect(account.body.data.due).toBe(160);
    expect(account.body.data.open).toHaveLength(1);
    expect(account.body.data.payments).toHaveLength(2);
    carnet = await get(`/api/droguerie/carnet?companyId=${companyId}`);
    expect(carnet.body.data.total).toBe(160);
  });

  it("shows the shop home: today, the till, the carnet, suppliers, reorders", async () => {
    const r = await get(`/api/droguerie/home?companyId=${companyId}`);
    expect(r.status).toBe(200);
    expect(r.body.data.today).toMatchObject({ tickets: 3, totalTTC: 390, cash: 30, onCredit: 360 });
    expect(r.body.data.session._id).toBe(ids.session);
    expect(r.body.data.carnet).toMatchObject({ total: 160, customers: 1 });
    expect(r.body.data.carnet.top[0]).toMatchObject({ name: "Mustapha le peintre", due: 160, phone: "0661000000" });
    expect(r.body.data.suppliers).toMatchObject({ total: 300, count: 1 });
    expect(r.body.data.lowStock.map((p) => p.name)).toContain("Peinture Colorado blanc 4L"); // 7 left, threshold 8
  });

  it("stays inside the client", async () => {
    const r = await get(`/api/droguerie/home?companyId=${otherCompanyId}`);
    expect(r.status).toBe(404);
  });
});
