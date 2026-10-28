import { describe, it, expect, beforeAll } from "vitest";

/**
 * Barcode labels (POST /api/products/labels): a PDF in both standard formats,
 * in-store EAN-13 codes for articles without one (scannable at the till right
 * after), and nothing from another client.
 */
process.env.JWT_SECRET = "labels-test-secret";
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const InventoryCategory = require("../models/InventoryCategory");
const Product = require("../models/Product");
const { isEan13, ean13CheckDigit } = require("../services/labelPdfService");

let app;
let admin;
let viewer;
let companyId;
let otherCompanyId;
const ids = {};
const sys = (fn) => tenantScope.runAsSystem(fn);
const h = (t) => ({ Authorization: `Bearer ${t}` });
const binary = (res, cb) => { const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => cb(null, Buffer.concat(chunks))); };
const pages = (buf) => (buf.toString("latin1").match(/\/Type \/Page\b/g) || []).length;

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/products", require("./products"));
  tenantScope.enableStrictMode(true);
  await sys(async () => {
    const tenant = await Tenant.create({ name: "Droguerie Labels", edition: "droguerie" });
    const a = await User.create({ firstName: "A", lastName: "B", email: "labels@test.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const v = await User.create({ firstName: "V", lastName: "C", email: "viewer@test.ma", password: "secret12", role: "user", tenant: tenant._id, permissionsMode: "custom", permissions: ["inventory.articles.view"] });
    const c = await Company.create({ name: "Droguerie Labels", tenant: tenant._id, owner: a._id, legalForm: "SARL", industry: "Droguerie" });
    companyId = c._id;
    const cat = await InventoryCategory.create({ company: c._id, name: "Divers" });
    ids.ean = (await Product.create({ company: c._id, category: cat._id, name: "Ampoule LED 9 W E27", unit: "pièce", barcode: "4006381333931", sellingPrice: 15, vatRate: 0 }))._id;
    ids.ref = (await Product.create({ company: c._id, category: cat._id, name: "Clous 60 mm", unit: "kg", internalReference: "QC-060", sellingPrice: 22, vatRate: 0 }))._id;
    ids.none = (await Product.create({ company: c._id, category: cat._id, name: "Plâtre 25 kg", unit: "sac", sellingPrice: 45, vatRate: 0 }))._id;
    ids.none2 = (await Product.create({ company: c._id, category: cat._id, name: "Enduit 25 kg", unit: "sac", sellingPrice: 110, vatRate: 0 }))._id;
    admin = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    viewer = jwt.sign({ id: String(v._id) }, process.env.JWT_SECRET);
    const ot = await Tenant.create({ name: "Autre" });
    const ou = await User.create({ firstName: "O", lastName: "T", email: "o2@test.ma", password: "secret12", role: "admin", tenant: ot._id });
    const oc = await Company.create({ name: "Autre", tenant: ot._id, owner: ou._id, legalForm: "SARL", industry: "Négoce" });
    otherCompanyId = oc._id;
    const ocat = await InventoryCategory.create({ company: oc._id, name: "X" });
    ids.foreign = (await Product.create({ company: oc._id, category: ocat._id, name: "Secret", unit: "pièce", sellingPrice: 1 }))._id;
  });
});

describe("article labels", () => {
  it("EAN-13 check digit", () => {
    expect(ean13CheckDigit("400638133393")).toBe("1");
    expect(isEan13("4006381333931")).toBe(true);
    expect(isEan13("6111250090093")).toBe(false);
  });

  it("roll 40×30: one page per label copy, articles without a code get an in-store EAN-13", async () => {
    const res = await request(app).post("/api/products/labels").set(h(admin)).buffer(true).parse(binary)
      .send({ companyId, format: "roll", items: [{ product: ids.ean, copies: 2 }, { product: ids.ref }, { product: ids.none }, { product: ids.none2 }] });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.slice(0, 4).toString()).toBe("%PDF");
    expect(pages(res.body)).toBe(5);
    const [p1, p2, p3] = await sys(() => Product.find({ _id: { $in: [ids.none, ids.none2, ids.ref] } }).sort({ name: 1 }).lean());
    const codes = [p1, p2, p3].map((p) => p.barcode).filter(Boolean).sort();
    expect(codes).toEqual(["2000000000015", "2000000000022"]); // the two without a code, in sequence
    expect(codes.every(isEan13)).toBe(true);
    // the article with an internal reference keeps it, no barcode added
    expect((await sys(() => Product.findById(ids.ref).lean())).barcode || "").toBe("");
  });

  it("the new code scans at the till", async () => {
    const p = await sys(() => Product.findById(ids.none).lean());
    const res = await request(app).get(`/api/products/lookup?companyId=${companyId}&code=${p.barcode}`).set(h(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe("Plâtre 25 kg");
  });

  it("A4 70×37: 24 per sheet, skipping used positions", async () => {
    const res = await request(app).post("/api/products/labels").set(h(admin)).buffer(true).parse(binary)
      .send({ companyId, format: "a4", skip: 20, items: [{ product: ids.ean, copies: 5 }] });
    expect(res.status).toBe(200);
    expect(pages(res.body)).toBe(2); // 20 skipped + 5 labels = 25 positions
  });

  it("a viewer can print but doesn't assign codes", async () => {
    await sys(() => Product.updateOne({ _id: ids.none2 }, { $set: { barcode: "" } }));
    const res = await request(app).post("/api/products/labels").set(h(viewer)).buffer(true).parse(binary)
      .send({ companyId, items: [{ product: ids.none2 }] });
    expect(res.status).toBe(200);
    expect((await sys(() => Product.findById(ids.none2).lean())).barcode).toBe("");
  });

  it("refuses bad input and never prints another client's articles", async () => {
    expect((await request(app).post("/api/products/labels").set(h(admin)).send({ companyId, items: [] })).status).toBe(400);
    expect((await request(app).post("/api/products/labels").set(h(admin)).send({ companyId, format: "x", items: [{ product: ids.ean }] })).status).toBe(400);
    const res = await request(app).post("/api/products/labels").set(h(admin)).send({ companyId: otherCompanyId, items: [{ product: ids.foreign }] });
    expect(res.status).toBe(404);
  });
});
