import { describe, it, expect, beforeAll } from "vitest";

/** Dated promotions in pricing, "10 + 1" free goods, year-end rebates by tier. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { rebateFor } = require("../services/promotionService");

process.env.JWT_SECRET = "promo-secret";

const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/promotions", require("./promotions"));
  app.use("/api/products", require("./products"));
  app.use("/api/sales-invoices", require("./salesInvoices"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

const product = (ref) => tenantScope.runAsSystem(() => Product.findOne({ company: demo.company._id, internalReference: ref }).lean());
const reseller = () => Object.values(demo.customers).find((c) => c.type === "reseller");

describe("rebate tiers", () => {
  const tiers = [{ threshold: 100000, percent: 1 }, { threshold: 250000, percent: 2 }, { threshold: 500000, percent: 3 }];
  it("whole: the reached rate on the whole turnover; progressive: per slice", () => {
    expect(rebateFor(300000, tiers, "whole")).toMatchObject({ percent: 2, amount: 6000, next: { threshold: 500000, percent: 3, missing: 200000 } });
    expect(rebateFor(300000, tiers, "progressive").amount).toBe(150000 * 0.01 + 50000 * 0.02);
    expect(rebateFor(50000, tiers)).toMatchObject({ percent: 0, amount: 0, next: { missing: 50000 } });
  });
});

describe("promotions", () => {
  let gro;
  it("prices a line with the best active promotion", async () => {
    gro = await product("GRO-ES-LAV");
    const customer = reseller();
    const base = (await request(app).get(`/api/products/${gro._id}/price?customer=${customer._id}`).set(h("admin"))).body.data;
    expect(base.promotion).toBeNull();
    const r = await request(app).post("/api/promotions").set(h("admin")).send({ company: demo.company._id, name: "Printemps Grohe -15 %", type: "percent", value: 15, startDate: day(-1), endDate: day(30), products: [gro._id] });
    expect(r.status).toBe(201);
    await request(app).post("/api/promotions").set(h("admin")).send({ company: demo.company._id, name: "Future", type: "percent", value: 50, startDate: day(5), endDate: day(30), products: [gro._id] }).expect(201);
    await request(app).post("/api/promotions").set(h("admin")).send({ company: demo.company._id, name: "Comptoir only", type: "percent", value: 40, startDate: day(-1), endDate: day(30), products: [gro._id], channels: ["pos"] }).expect(201);
    const promoted = (await request(app).get(`/api/products/${gro._id}/price?customer=${customer._id}`).set(h("admin"))).body.data;
    expect(promoted.promotion).toMatchObject({ name: "Printemps Grohe -15 %", type: "percent" });
    expect(promoted.discount).toBe(Math.max(15, base.discount));
    const pos = (await request(app).get(`/api/products/${gro._id}/price?customer=${customer._id}&channel=pos`).set(h("admin"))).body.data;
    expect(pos.promotion.name).toBe("Comptoir only");
    await request(app).post("/api/promotions").set(h("admin")).send({ company: demo.company._id, name: "Bad", type: "percent", value: 0, startDate: day(0), endDate: day(1) }).expect(400);
    await request(app).post("/api/promotions").set(h("store")).send({ company: demo.company._id, name: "x", type: "percent", value: 5, startDate: day(0), endDate: day(1) }).expect(403);
  });

  it("adds the free goods of a '10 + 1' and ignores free lines sent by the client", async () => {
    const customer = reseller();
    await request(app).post("/api/promotions").set(h("admin")).send({ company: demo.company._id, name: "Grohe 10 + 1", type: "free_goods", buyQuantity: 10, freeQuantity: 1, startDate: day(-1), endDate: day(30), products: [gro._id] }).expect(201);
    const r = await request(app).post("/api/sales-invoices").set(h("admin")).send({
      company: demo.company._id, customer: customer._id,
      lines: [{ product: gro._id, quantity: 23 }, { product: gro._id, quantity: 50, unitPrice: 0, free: true, description: "cadeau" }],
    });
    expect(r.status).toBe(201);
    const lines = r.body.data.lines;
    expect(lines).toHaveLength(2);
    expect(lines[0].promotion).toBeTruthy();
    expect(lines[1]).toMatchObject({ free: true, quantity: 2, unitPrice: 0 });
    expect(lines[1].description).toMatch(/gratuit \(Grohe 10 \+ 1\)/);
  });
});

describe("year-end rebates", () => {
  it("shows each customer's progress and settles draft credit notes once", async () => {
    const customer = reseller();
    const r = await request(app).post("/api/promotions/rebates").set(h("admin")).send({
      company: demo.company._id, name: "RFA revendeurs", from: day(-400), to: day(0), customerTypes: ["reseller"],
      tiers: [{ threshold: 1000, percent: 1 }, { threshold: 1e12, percent: 5 }],
    });
    expect(r.status).toBe(201);
    const p = await request(app).get(`/api/promotions/rebates/${r.body.data._id}/progress`).set(h("admin"));
    expect(p.status).toBe(200);
    const row = p.body.data.rows.find((x) => x.customer._id === String(customer._id));
    expect(row.turnover).toBeGreaterThan(1000);
    expect(row.percent).toBe(1);
    expect(row.next.percent).toBe(5);
    const s = await request(app).post(`/api/promotions/rebates/${r.body.data._id}/settle`).set(h("admin")).send({ customers: [customer._id] });
    expect(s.body.data.created).toHaveLength(1);
    expect(s.body.data.created[0].amount).toBeCloseTo(row.amount, 2);
    const note = await tenantScope.runAsSystem(() => SalesInvoice.findById(s.body.data.created[0].creditNote).lean());
    expect(note).toMatchObject({ type: "credit_note", status: "draft" });
    expect(note.totalHT).toBeCloseTo(row.amount, 2);
    const again = await request(app).post(`/api/promotions/rebates/${r.body.data._id}/settle`).set(h("admin")).send({ customers: [customer._id] });
    expect(again.body.data.created).toHaveLength(0);
    await request(app).delete(`/api/promotions/rebates/${r.body.data._id}`).set(h("admin")).expect(400);
  });
});
