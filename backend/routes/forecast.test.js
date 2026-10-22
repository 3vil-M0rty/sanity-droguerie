import { describe, it, expect, beforeAll } from "vitest";

/** Stockout forecast → one click → draft purchase orders per cheapest supplier. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "forecast-secret";
const PurchaseOrder = require("../models/PurchaseOrder");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/purchase-orders", require("./purchaseOrders"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

describe("purchase forecast", () => {
  it("lists articles that will run out before a delivery could arrive, with the cheapest supplier", async () => {
    const r = await request(app).get(`/api/purchase-orders/reports/forecast?companyId=${demo.company._id}`).set(h("admin"));
    expect(r.status).toBe(200);
    const { rows, suppliers } = r.body.data;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.quantity).toBeGreaterThan(0);
      if (row.pack) expect(row.quantity % row.pack.factor).toBe(0);
      if (row.offers.length > 1) expect(row.unitPrice).toBeLessThanOrEqual(Math.max(...row.offers.map((o) => o.price)));
    }
    expect(suppliers.reduce((s, g) => s + g.count, 0)).toBe(rows.length);
    // sorted: articles running out first
    const firstWithDays = rows.filter((x) => x.priority === 0);
    if (firstWithDays.length > 1) expect(firstWithDays[0].daysLeft).toBeLessThanOrEqual(firstWithDays[1].daysLeft);
  });

  it("turns the selection into one draft purchase order per supplier, then those quantities count as incoming", async () => {
    const before = (await request(app).get(`/api/purchase-orders/reports/forecast?companyId=${demo.company._id}`).set(h("admin"))).body.data.rows.filter((x) => x.supplier);
    expect(before.length).toBeGreaterThan(0);
    const pick = before.slice(0, 6);
    const r = await request(app).post("/api/purchase-orders/from-forecast").set(h("admin")).send({ companyId: demo.company._id, lines: pick.map((x) => ({ product: x.product._id, quantity: x.quantity, supplier: x.supplier._id })) });
    expect(r.status).toBe(201);
    const suppliers = new Set(pick.map((x) => x.supplier._id));
    expect(r.body.data).toHaveLength(suppliers.size);
    const po = await tenantScope.runAsSystem(() => PurchaseOrder.findById(r.body.data[0]._id).lean());
    expect(po.status).toBe("draft");
    expect(po.number).toMatch(/^BC-/);
    expect(po.lines[0].unitPrice).toBeGreaterThan(0);
    const after = (await request(app).get(`/api/purchase-orders/reports/forecast?companyId=${demo.company._id}`).set(h("admin"))).body.data.rows;
    for (const x of pick) {
      const again = after.find((y) => y.product._id === x.product._id);
      if (again) expect(again.incoming).toBeGreaterThanOrEqual(x.quantity);
    }
    await request(app).post("/api/purchase-orders/from-forecast").set(h("admin")).send({ companyId: demo.company._id, lines: [] }).expect(400);
    await request(app).post("/api/purchase-orders/from-forecast").set(h("rep1")).send({ companyId: demo.company._id, lines: [] }).expect(403);
  });
});
