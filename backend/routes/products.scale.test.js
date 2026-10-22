import { describe, it, expect, beforeAll } from "vitest";

/**
 * The catalogue never travels whole: one page (≤ 100) of light rows,
 * searched / filtered / counted by MongoDB; pickers get a handful;
 * stock per warehouse is paged in the database.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "products-scale-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const InventoryCategory = require("../models/InventoryCategory");
const Supplier = require("../models/Supplier");
const stock = require("../services/stockService");
const { backfillSearchTokens } = require("../services/productSearchIndex");

let app;
let token;
let companyId;
const ids = {};
const get = (url) => request(app).get(url).set({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/products", require("./products"));
  app.use("/api/stock", require("./stock"));
  app.use("/api/inventory-categories", require("./inventoryCategories"));
  tenantScope.enableStrictMode(true);
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "Scale" });
    const a = await User.create({ firstName: "Admin", lastName: "S", email: "admin@scale.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const company = await Company.create({ name: "Scale SARL", tenant: tenant._id, owner: a._id, industry: "Négoce", legalForm: "SARL" });
    companyId = String(company._id);
    token = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    const san = await InventoryCategory.create({ company: companyId, name: "Sanitaire" });
    const elec = await InventoryCategory.create({ company: companyId, name: "Électricité" });
    ids.san = String(san._id);
    ids.elec = String(elec._id);
    const sup = await Supplier.create({ company: companyId, name: "Bati-Import" });
    ids.sup = String(sup._id);
    ids.dep = String((await Warehouse.create({ company: companyId, code: "DEP", name: "Dépôt", isDefault: true }))._id);
    ids.show = String((await Warehouse.create({ company: companyId, code: "SHOW", name: "Showroom", kind: "store" }))._id);

    // 130 cables + a few recognisable articles
    for (let i = 0; i < 130; i += 1) {
      await Product.create({ company: companyId, category: ids.elec, name: `Câble H07 ${String(i).padStart(3, "0")}`, internalReference: `CAB-${i}`, unit: "m", notes: "x".repeat(500) });
    }
    const mit = await Product.create({
      company: companyId, category: ids.san, name: "Mitigeur lavabo chromé", internalReference: "GRO-ES-DCH", barcode: "6111000004570", unit: "pièce", threshold: 10,
      prices: [{ supplierName: "Bati-Import", supplier: sup._id, price: 300, supplierReference: "BX-77" }],
      image: { url: "https://cdn.example.com/mitigeur.jpg" }, sellingPrice: 400,
    });
    ids.mit = String(mit._id);
    ids.wc = String((await Product.create({ company: companyId, category: ids.san, name: "Pack WC Victoria", internalReference: "ROC-VIC", unit: "pièce", threshold: 2 }))._id);
    ids.old = String((await Product.create({ company: companyId, category: ids.san, name: "Robinet ancien modèle", unit: "pièce", isActive: false }))._id);
    await stock.receive({ product: ids.mit, warehouse: ids.dep, quantity: 40, unitCost: 300, source: { kind: "purchase" }, isPurchase: true });
    await stock.receive({ product: ids.mit, warehouse: ids.show, quantity: 3, unitCost: 300, source: { kind: "purchase" }, isPurchase: true });
    await stock.receive({ product: ids.wc, warehouse: ids.dep, quantity: 50, unitCost: 900, source: { kind: "purchase" }, isPurchase: true });
  });
});

describe("article list at scale", () => {
  it("returns one page, never more than 100 rows, with paging flags", async () => {
    const def = await get(`/api/products?companyId=${companyId}`);
    expect(def.status).toBe(200);
    expect(def.body.data).toHaveLength(50);
    expect(def.body.pagination).toMatchObject({ total: 133, page: 1, limit: 50, pages: 3, hasNext: true, hasPrevious: false });

    const big = await get(`/api/products?companyId=${companyId}&limit=100000`);
    expect(big.body.data).toHaveLength(100);
    expect(big.body.pagination.limit).toBe(100);

    const last = await get(`/api/products?companyId=${companyId}&limit=100&page=2`);
    expect(last.body.data).toHaveLength(33);
    expect(last.body.pagination).toMatchObject({ hasNext: false, hasPrevious: true });
  });

  it("sends only the list fields and a thumbnail", async () => {
    const r = await get(`/api/products?companyId=${companyId}&search=mitigeur`);
    const row = r.body.data[0];
    expect(row.name).toBe("Mitigeur lavabo chromé");
    expect(row.thumbnail).toBe("https://cdn.example.com/mitigeur.jpg");
    expect(row.available).toBe(43);
    for (const heavy of ["image", "prices", "priceLevels", "notes", "translations", "searchTokens", "packagings", "lastPurchaseAt"]) expect(row).not.toHaveProperty(heavy);
    const cable = (await get(`/api/products?companyId=${companyId}&limit=1`)).body.data[0];
    expect(cable).not.toHaveProperty("notes");

    // the article page still has everything
    const full = await get(`/api/products/${ids.mit}`);
    expect(full.body.data.image.url).toBe("https://cdn.example.com/mitigeur.jpg");
    expect(full.body.data.prices).toHaveLength(1);
  });

  it("searches by word start, code, barcode end and supplier reference — in the database", async () => {
    const names = async (q) => (await get(`/api/products?companyId=${companyId}&search=${encodeURIComponent(q)}`)).body.data.map((p) => p.name);
    expect(await names("chrom")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("CHROMÉ")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("mitigeur chrome")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("4570")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("gro-es")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("bx-77")).toEqual(["Mitigeur lavabo chromé"]);
    expect(await names("cab-125")).toEqual(["Câble H07 125"]);
    expect(await names("cab-12")).toHaveLength(11); // CAB-12 and CAB-120…129: a prefix
    expect(await names("cable")).toHaveLength(50);
    expect((await get(`/api/products?companyId=${companyId}&search=cable`)).body.pagination.total).toBe(130);
    expect(await names("zzz")).toEqual([]);
  });

  it("filters on the server: family, supplier, unit, status, stock status", async () => {
    const q = async (params) => (await get(`/api/products?companyId=${companyId}&${params}`)).body;
    expect((await q(`category=${ids.san}`)).pagination.total).toBe(3);
    expect((await q(`supplier=${ids.sup}`)).data.map((p) => p.name)).toEqual(["Mitigeur lavabo chromé"]);
    expect((await q("unit=m")).pagination.total).toBe(130);
    expect((await q("status=inactive")).data.map((p) => p.name)).toEqual(["Robinet ancien modèle"]);
    expect((await q(`status=active&category=${ids.san}`)).pagination.total).toBe(2);
    expect((await q("stockStatus=in")).data.map((p) => p.name)).toEqual(["Mitigeur lavabo chromé", "Pack WC Victoria"]);
    expect((await q("stockStatus=out")).pagination.total).toBe(131);
    // low: at or under a minimum that exists (no minimum → never "low")
    expect((await q("stockStatus=low")).pagination.total).toBe(0);
    await tenantScope.runAsSystem(() => Product.updateOne({ _id: ids.wc }, { $set: { threshold: 60 } }));
    expect((await q("stockStatus=low")).data.map((p) => p.name)).toEqual(["Pack WC Victoria"]);
    await tenantScope.runAsSystem(() => Product.updateOne({ _id: ids.wc }, { $set: { threshold: 2 } }));
  });

  it("pickers get a handful of light rows; known ids resolve in one call", async () => {
    const s = await get(`/api/products/suggestions?companyId=${companyId}&q=cable&limit=500`);
    expect(s.body.data).toHaveLength(20);
    expect(s.body.data[0]).toHaveProperty("unit");
    expect(s.body.data[0]).not.toHaveProperty("notes");
    expect((await get(`/api/products/suggestions?companyId=${companyId}&q=`)).body.data).toEqual([]);

    const b = await get(`/api/products/brief?companyId=${companyId}&ids=${ids.mit},${ids.wc},nope`);
    expect(b.body.data.map((p) => p.name).sort()).toEqual(["Mitigeur lavabo chromé", "Pack WC Victoria"]);
    const mit = b.body.data.find((p) => p._id === ids.mit);
    expect(mit.prices[0]).toMatchObject({ supplierName: "Bati-Import", price: 300 });
    expect(mit.available).toBe(43);
  });
});

describe("stock per warehouse, paged in the database", () => {
  it("pages, counts and values without loading other pages", async () => {
    const r = await get(`/api/stock/levels?companyId=${companyId}&limit=1000`);
    expect(r.status).toBe(200);
    expect(r.body.data.rows).toHaveLength(100);
    expect(r.body.pagination).toMatchObject({ total: 133, limit: 100, hasNext: true });
    expect(r.body.data.totalValue).toBe(43 * 300 + 50 * 900);
  });

  it("filters a warehouse's own quantity (in stock / low)", async () => {
    const inShow = await get(`/api/stock/levels?companyId=${companyId}&warehouse=${ids.show}&inStockOnly=true`);
    expect(inShow.body.data.rows.map((x) => x.name)).toEqual(["Mitigeur lavabo chromé"]);
    expect(inShow.body.data.rows[0].shownQuantity).toBe(3);
    expect(inShow.body.data.totalValue).toBe(900);

    // the company-wide minimum (10) doesn't apply to the showroom shelf…
    expect((await get(`/api/stock/levels?companyId=${companyId}&warehouse=${ids.show}&lowOnly=true`)).body.data.rows).toEqual([]);
    // …its own minimum does
    await request(app).patch(`/api/stock/levels/${ids.mit}/${ids.show}`).set({ Authorization: `Bearer ${token}` }).send({ minQuantity: 10 }).expect(200);
    const low = await get(`/api/stock/levels?companyId=${companyId}&warehouse=${ids.show}&lowOnly=true`);
    expect(low.body.data.rows.map((x) => x.name)).toEqual(["Mitigeur lavabo chromé"]);
    expect(low.body.data.rows[0]).toMatchObject({ low: true, minimum: 10, thumbnail: "https://cdn.example.com/mitigeur.jpg" });
    expect(low.body.data.rows[0].category).toMatchObject({ name: "Sanitaire" });

    const dep = await get(`/api/stock/levels?companyId=${companyId}&warehouse=${ids.dep}&search=pack`);
    expect(dep.body.data.rows).toHaveLength(1);
    expect(dep.body.data.rows[0]).toMatchObject({ shownQuantity: 50, value: 45000, low: false });
  });
});

describe("warehouse cards", () => {
  it("sums in-stock / low / value per warehouse and overall, in the database", async () => {
    const r = await get(`/api/stock/summary?companyId=${companyId}`);
    expect(r.status).toBe(200);
    const by = Object.fromEntries(r.body.data.warehouses.map((w) => [w.code, w]));
    expect(by.DEP).toMatchObject({ inStock: 2, low: 0, value: 40 * 300 + 50 * 900 });
    expect(by.SHOW).toMatchObject({ inStock: 1, low: 1, value: 900 });
    expect(r.body.data.overall).toMatchObject({ inStock: 2, low: 0, value: 43 * 300 + 50 * 900 });
    expect(r.body.data.overall.articles).toBeGreaterThanOrEqual(133);
  });
});

describe("families and old data", () => {
  it("counts articles per family in the database", async () => {
    const r = await get(`/api/inventory-categories?companyId=${companyId}`);
    const byName = Object.fromEntries(r.body.data.map((c) => [c.name, c.productCount]));
    expect(byName).toMatchObject({ Sanitaire: 3, "Électricité": 130 });
  });

  it("indexes articles saved before the search tokens existed", async () => {
    await tenantScope.runAsSystem(async () => {
      const old = await Product.create({ company: companyId, category: ids.san, name: "Siphon ancien import", internalReference: "OLD-1" });
      await Product.updateOne({ _id: old._id }, { $unset: { searchTokens: 1 } }); // as saved before the search tokens existed
      expect((await get(`/api/products?companyId=${companyId}&search=siphon`)).body.data).toHaveLength(0);
      expect(await backfillSearchTokens({ batchSize: 50 })).toBe(1);
      expect(await backfillSearchTokens()).toBe(0); // nothing left to do
    });
    expect((await get(`/api/products?companyId=${companyId}&search=siphon`)).body.data.map((p) => p.name)).toEqual(["Siphon ancien import"]);
  });
});
