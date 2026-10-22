import { describe, it, expect, beforeAll } from "vitest";

/** Phone app: offline rep orders and visits (idempotent sync), driver proof of delivery. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "field-secret";
// Delivery photos go to file storage: keep them in a temp folder.
process.env.STORAGE_LOCAL_DIR = require("fs").mkdtempSync(require("path").join(require("os").tmpdir(), "sanity-field-"));
const SalesOrder = require("../models/SalesOrder");
const Customer = require("../models/Customer");
const DeliveryNote = require("../models/DeliveryNote");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/field", require("./field"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1", "rep2", "driver"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

const mine = (rep) => tenantScope.runAsSystem(() => Customer.find({ company: demo.company._id, salesRep: demo.users[rep]._id }).lean());

describe("rep on the road", () => {
  let boot;
  it("downloads their customers and the catalogue with each level's price", async () => {
    const r = await request(app).get(`/api/field/bootstrap?companyId=${demo.company._id}`).set(h("rep1"));
    expect(r.status).toBe(200);
    boot = r.body.data;
    expect(boot.can).toMatchObject({ orders: true, visits: true });
    const ids = new Set((await mine("rep1")).map((c) => String(c._id)));
    expect(boot.customers.length).toBe(ids.size);
    expect(boot.customers.every((c) => ids.has(String(c._id)))).toBe(true);
    const art = boot.catalogue.find((p) => p.ref === "GRO-ES-LAV");
    expect(Object.keys(art.prices)).toEqual(expect.arrayContaining(["P1", "P2", "P3", "P4"]));
    expect(art).not.toHaveProperty("avgCost");
    // delta: nothing changed since now
    const delta = await request(app).get(`/api/field/bootstrap?companyId=${demo.company._id}&since=${encodeURIComponent(new Date(Date.now() + 1000).toISOString())}`).set(h("rep1"));
    expect(delta.body.data.catalogue).toHaveLength(0);
    expect(delta.body.data.catalogueComplete).toBe(false);
  });

  it("syncs an offline order and its visit once, even when sent twice", async () => {
    const customer = (await mine("rep1")).find((c) => !c.blocked);
    await tenantScope.runAsSystem(() => Customer.updateOne({ _id: customer._id }, { $set: { gps: { lat: null, lng: null } } }));
    const art = boot.catalogue.find((p) => p.ref === "GRO-ES-LAV");
    const payload = {
      companyId: demo.company._id,
      orders: [{ clientRef: "rep1-ord-0001", customer: customer._id, lines: [{ product: art._id, quantity: 4 }], takenAt: new Date().toISOString(), gps: { lat: 33.589, lng: -7.603, accuracy: 12 } }],
      visits: [{ clientRef: "rep1-vis-0001", customer: customer._id, outcome: "order", orderClientRef: "rep1-ord-0001", gps: { lat: 33.589, lng: -7.603, accuracy: 12 }, notes: "Veut le catalogue Grohe 2027" }],
    };
    const first = await request(app).post("/api/field/sync").set(h("rep1")).send(payload);
    expect(first.status).toBe(200);
    expect(first.body.data.orders[0]).toMatchObject({ ok: true, clientRef: "rep1-ord-0001" });
    expect(first.body.data.orders[0].number).toMatch(/^CC-/);
    expect(first.body.data.visits[0].ok).toBe(true);
    const again = await request(app).post("/api/field/sync").set(h("rep1")).send(payload);
    expect(again.body.data.orders[0]).toMatchObject({ ok: true, duplicate: true, number: first.body.data.orders[0].number });
    expect(again.body.data.visits[0]).toMatchObject({ ok: true, duplicate: true });
    expect(await tenantScope.runAsSystem(() => SalesOrder.countDocuments({ clientRef: "rep1-ord-0001" }))).toBe(1);
    const order = await tenantScope.runAsSystem(() => SalesOrder.findOne({ clientRef: "rep1-ord-0001" }).lean());
    expect(order).toMatchObject({ source: "rep", status: "draft" });
    expect(order.lines[0].unitPrice).toBeGreaterThan(0);
    // the customer's location is learned from the first located visit
    const c = await tenantScope.runAsSystem(() => Customer.findById(customer._id).lean());
    expect(c.gps.lat).toBeCloseTo(33.589, 3);
    const v = await request(app).get(`/api/field/visits?companyId=${demo.company._id}`).set(h("rep1"));
    expect(v.body.data.rows[0]).toMatchObject({ outcome: "order" });
    expect(v.body.data.rows[0].order.number).toBe(order.number);
  });

  it("refuses another rep's customer without blocking the rest of the queue", async () => {
    const theirs = (await mine("rep2"))[0];
    const own = (await mine("rep1"))[0];
    const r = await request(app).post("/api/field/sync").set(h("rep1")).send({
      companyId: demo.company._id,
      visits: [{ clientRef: "x-1", customer: theirs._id, outcome: "no_order" }, { clientRef: "x-2", customer: own._id, outcome: "no_order" }],
    });
    expect(r.body.data.visits[0]).toMatchObject({ ok: false, retry: false });
    expect(r.body.data.visits[1].ok).toBe(true);
    await request(app).get(`/api/field/bootstrap?companyId=${demo.company._id}`).set(h("store")).expect(403);
  });
});

describe("driver", () => {
  it("sees tomorrow's round, captures signature + photo: the BL is delivered with its proof", async () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const r = await request(app).get(`/api/field/deliveries?companyId=${demo.company._id}&date=${tomorrow}`).set(h("driver"));
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeGreaterThan(0);
    const note = r.body.data[0].notes.find((n) => n.status === "validated") || r.body.data[0].notes[0];
    expect(note).toBeTruthy();
    const proof = { signature: PNG, photo: PNG.replace("png", "jpeg"), receivedBy: "M. Alami (gérant)", reserves: "1 carton abîmé", gps: { lat: 31.63, lng: -8.0 }, clientRef: "drv-pod-1", cashCollected: 0 };
    await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send({ ...proof, receivedBy: "" }).expect(400);
    await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send({ ...proof, signature: "data:text/html;base64,PHNjcmlwdD4=" }).expect(400);
    const ok = await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send(proof);
    expect(ok.status).toBe(200);
    expect(ok.body.data.status).toBe("delivered");
    const again = await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send(proof);
    expect(again.body.data.duplicate).toBe(true);
    await request(app).post(`/api/field/deliveries/${note._id}/proof`).set(h("driver")).send({ ...proof, clientRef: "other" }).expect(400);
    const bl = await tenantScope.runAsSystem(() => DeliveryNote.findById(note._id).lean());
    expect(bl).toMatchObject({ status: "delivered", receivedBy: "M. Alami (gérant)", reserves: "1 carton abîmé" });
    const seen = await request(app).get(`/api/field/deliveries/${note._id}/proof`).set(h("admin"));
    expect(seen.body.data.signature).toBe(PNG);
    expect(seen.body.data.gps.lat).toBe(31.63);
  });
});
