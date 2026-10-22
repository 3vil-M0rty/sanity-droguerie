import { describe, it, expect, beforeAll } from "vitest";

/** Reseller portal: access given by the office, own prices, online orders, own invoices only. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "portal-secret";
const SalesOrder = require("../models/SalesOrder");
const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
let reseller;
let other;
let portalToken;
const ph = () => ({ Authorization: `Bearer ${portalToken}` });

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/portal-admin", require("./portalAdmin"));
  app.use("/api/portal", require("./portal"));
  app.use("/api/sales-orders", require("./salesOrders"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
  const resellers = Object.values(demo.customers).filter((c) => c.type === "reseller");
  [reseller, other] = resellers;
}, 120000);

describe("portal access", () => {
  let temp;
  it("the office gives a reseller access; nobody can log in while the portal is closed", async () => {
    await request(app).post("/api/portal-admin/accounts").set(h("rep1")).send({ companyId: demo.company._id, customer: reseller._id, name: "Hassan", email: "achat@alamal.ma" }).expect(403);
    const r = await request(app).post("/api/portal-admin/accounts").set(h("admin")).send({ companyId: demo.company._id, customer: reseller._id, name: "Hassan (acheteur)", email: "achat@alamal.ma" });
    expect(r.status).toBe(201);
    temp = r.body.data.temporaryPassword;
    expect(temp).toMatch(/^[0-9a-f]{8}-\d{4}$/);
    await request(app).post("/api/portal-admin/accounts").set(h("admin")).send({ companyId: demo.company._id, customer: other._id, name: "X", email: "achat@alamal.ma" }).expect(400);
    // The demo seed opens the portal; close it to check the gate.
    await request(app).put(`/api/portal-admin/settings?companyId=${demo.company._id}`).set(h("admin")).send({ portal: { enabled: false } }).expect(200);
    const closed = await request(app).post("/api/portal/login").send({ email: "achat@alamal.ma", password: temp });
    expect(closed.status).toBe(403);
    await request(app).put(`/api/portal-admin/settings?companyId=${demo.company._id}`).set(h("admin")).send({ portal: { enabled: true, showStock: "level", message: "Livraison offerte dès 5 000 MAD" } }).expect(200);
    await request(app).post("/api/portal/login").send({ email: "achat@alamal.ma", password: "wrong" }).expect(401);
    const ok = await request(app).post("/api/portal/login").send({ email: "ACHAT@alamal.ma", password: temp });
    expect(ok.status).toBe(200);
    expect(ok.body.data.mustChangePassword).toBe(true);
    portalToken = ok.body.data.token;
    // Temporary password: nothing but /me and /password until it is changed.
    await request(app).get("/api/portal/catalogue").set(ph()).expect(403);
    await request(app).get("/api/portal/me").set(ph()).expect(200);
    const old = portalToken;
    const changed = await request(app).post("/api/portal/password").set(ph()).send({ current: temp, next: "MonNouveau#2026" }).expect(200);
    portalToken = changed.body.token;
    temp = "MonNouveau#2026";
    // The session opened with the temporary password is over.
    await request(app).get("/api/portal/me").set({ Authorization: `Bearer ${old}` }).expect(401);
  });

  it("a portal token never opens the internal API, an internal token never opens the portal", async () => {
    await request(app).get(`/api/sales-orders?companyId=${demo.company._id}`).set(ph()).expect(401);
    await request(app).get("/api/portal/me").set(h("admin")).expect(401);
  });

  it("shows the reseller's own price, balance and the office's message", async () => {
    const me = await request(app).get("/api/portal/me").set(ph());
    expect(me.body.data.customer.name).toBe(reseller.name);
    expect(me.body.data.portal.message).toMatch(/Livraison offerte/);
    const cat = await request(app).get("/api/portal/catalogue?search=GRO-ES-LAV").set(ph());
    expect(cat.status).toBe(200);
    const art = cat.body.data.rows[0];
    expect(art.ref).toBe("GRO-ES-LAV");
    const p = await tenantScope.runAsSystem(() => Product.findOne({ company: demo.company._id, internalReference: "GRO-ES-LAV" }).lean());
    const level = p.priceLevels.find((l) => l.level === reseller.priceLevel);
    if (level) expect(art.price).toBe(level.price);
    expect(art.stock).toHaveProperty("level");
    expect(art.stock).not.toHaveProperty("quantity");
    expect(art).not.toHaveProperty("avgCost");
  });

  it("orders online at server prices; the order waits for the sales team", async () => {
    const art = (await request(app).get("/api/portal/catalogue?search=GRO-ES-LAV").set(ph())).body.data.rows[0];
    const r = await request(app).post("/api/portal/orders").set(ph()).send({ lines: [{ product: art._id, quantity: 6, unitPrice: 0.01 }], customerReference: "BC-AA-778" });
    expect(r.status).toBe(201);
    const order = await tenantScope.runAsSystem(() => SalesOrder.findById(r.body.data._id).lean());
    expect(order).toMatchObject({ source: "online", status: "draft", customerReference: "BC-AA-778" });
    expect(String(order.customer)).toBe(String(reseller._id));
    expect(order.lines[0].unitPrice).toBe(art.price); // the 0.01 sent was ignored
    const list = await request(app).get("/api/portal/orders").set(ph());
    expect(list.body.data[0]).toMatchObject({ number: order.number, statusLabel: "à confirmer" });
  });

  it("sees only its own invoices and orders", async () => {
    const theirs = await tenantScope.runAsSystem(() => SalesOrder.findOne({ customer: other._id }).lean());
    if (theirs) await request(app).get(`/api/portal/orders/${theirs._id}`).set(ph()).expect(404);
    const inv = await request(app).get("/api/portal/invoices").set(ph());
    const own = await tenantScope.runAsSystem(() => SalesInvoice.countDocuments({ customer: reseller._id, status: { $in: ["issued", "partially_paid", "paid"] } }));
    expect(inv.body.data.length).toBe(Math.min(own, 200));
    const foreign = await tenantScope.runAsSystem(() => SalesInvoice.findOne({ customer: other._id, status: "paid" }).lean());
    await request(app).get(`/api/portal/invoices/${foreign._id}/pdf`).set(ph()).expect(404);
  });

  it("a viewer can't order; a disabled access is cut off at once", async () => {
    const list = await request(app).get(`/api/portal-admin/accounts?companyId=${demo.company._id}`).set(h("admin"));
    const acc = list.body.data[0];
    await request(app).put(`/api/portal-admin/accounts/${acc._id}`).set(h("admin")).send({ role: "viewer" }).expect(200);
    await request(app).post("/api/portal/orders").set(ph()).send({ lines: [] }).expect(403);
    await request(app).put(`/api/portal-admin/accounts/${acc._id}`).set(h("admin")).send({ active: false }).expect(200);
    await request(app).get("/api/portal/me").set(ph()).expect(401);
  });
});
