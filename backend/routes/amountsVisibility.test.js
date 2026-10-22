import { describe, it, expect, beforeAll } from "vitest";

/**
 * Warehouse staff handle the goods without seeing money they don't need:
 * no CMUP, purchase prices or stock value on articles; saving an article
 * from their screens doesn't wipe the cost. Admins and sales see them;
 * "Voir les montants" (User.showFinancials) opens them to anyone else.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "amounts-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const InventoryCategory = require("../models/InventoryCategory");

let app;
let admin;
let store;
let storePlusId;
let storePlus;
let companyId;
let productId;
const h = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/products", require("./products"));
  app.use("/api/users", require("./users"));
  tenantScope.enableStrictMode(true);
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "T" });
    const a = await User.create({ firstName: "A", lastName: "A", email: "a@sw.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const company = await Company.create({ name: "Smart", tenant: tenant._id, owner: a._id, industry: "x", legalForm: "SARL" });
    companyId = String(company._id);
    const cat = await InventoryCategory.create({ company: company._id, name: "Sanitaire" });
    const s = await User.create({ firstName: "M", lastName: "M", email: "m@sw.ma", password: "secret12", role: "user", department: "warehouse", tenant: tenant._id });
    const sp = await User.create({ firstName: "N", lastName: "N", email: "n@sw.ma", password: "secret12", role: "user", department: "warehouse", tenant: tenant._id });
    storePlusId = String(sp._id);
    admin = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    store = jwt.sign({ id: String(s._id) }, process.env.JWT_SECRET);
    storePlus = jwt.sign({ id: String(sp._id) }, process.env.JWT_SECRET);
    const p = await request(app).post("/api/products").set(h(admin)).send({ company: companyId, category: String(cat._id), name: "Mitigeur lavabo", sellingPrice: 300, initialQuantity: 10, initialCost: 180 });
    productId = p.body.data._id;
  });
});

describe("amounts visibility", () => {
  it("the warehouse sees stock, not the CMUP", async () => {
    const full = await request(app).get(`/api/products/${productId}`).set(h(admin));
    expect(full.body.data.avgCost).toBe(180);
    expect(full.body.amountsHidden).toBeUndefined();
    const r = await request(app).get(`/api/products/${productId}`).set(h(store));
    expect(r.status).toBe(200);
    expect(r.body.amountsHidden).toBe(true);
    expect(r.body.data.quantity).toBe(10);
    expect(r.body.data.avgCost).toBeUndefined();
    expect(r.body.data.stockValue).toBeUndefined();
  });

  it("saving from the warehouse doesn't wipe the cost", async () => {
    await request(app).put(`/api/products/${productId}`).set(h(store)).send({ name: "Mitigeur lavabo chromé", avgCost: 1 }).expect(200);
    const full = await request(app).get(`/api/products/${productId}`).set(h(admin));
    expect(full.body.data.name).toBe("Mitigeur lavabo chromé");
    expect(full.body.data.avgCost).toBe(180);
  });

  it("'Voir les montants' opens them to a warehouse login", async () => {
    let r = await request(app).get(`/api/products/${productId}`).set(h(storePlus));
    expect(r.body.data.avgCost).toBeUndefined();
    const me = await request(app).get(`/api/users/${storePlusId}`).set(h(admin));
    const u = me.body.data || me.body.user || me.body;
    await request(app).put(`/api/users/${storePlusId}`).set(h(admin)).send({ firstName: u.firstName, lastName: u.lastName, email: u.email, showFinancials: true }).expect(200);
    r = await request(app).get(`/api/products/${productId}`).set(h(storePlus));
    expect(r.body.data.avgCost).toBe(180);
  });
});
