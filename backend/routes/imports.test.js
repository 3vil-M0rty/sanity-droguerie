import { describe, it, expect, beforeAll } from "vitest";

/** Excel onboarding: articles, customers and opening stock, with a dry run first. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");

process.env.JWT_SECRET = "imports-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Warehouse = require("../models/Warehouse");
const InventoryCategory = require("../models/InventoryCategory");
const StockLot = require("../models/StockLot");

let app;
let token;
let companyId;
const h = () => ({ Authorization: `Bearer ${token}` });

async function xlsx(headers, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Feuille");
  ws.addRow(headers);
  rows.forEach((r) => ws.addRow(r));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
const send = (kind, step, buf) => request(app).post(`/api/imports/${kind}/${step}?companyId=${companyId}`).set(h()).attach("file", buf, "fichier.xlsx");

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/imports", require("./imports"));
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "Import" });
    const a = await User.create({ firstName: "Admin", lastName: "I", email: "admin@import.ma", password: "secret12", role: "admin", tenant: tenant._id });
    await User.create({ firstName: "Karim", lastName: "Terrain", email: "karim@import.ma", password: "secret12", role: "user", tenant: tenant._id });
    const company = await Company.create({ name: "Import SARL", tenant: tenant._id, owner: a._id, industry: "Négoce", legalForm: "SARL" });
    companyId = String(company._id);
    token = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    await Warehouse.create({ company: companyId, code: "CASA", name: "Dépôt Casablanca", isDefault: true });
    const san = await InventoryCategory.create({ company: companyId, name: "Sanitaire" });
    await InventoryCategory.create({ company: companyId, name: "Robinetterie", parent: san._id });
  });
});

describe("Excel import", () => {
  it("gives a template with the company's price levels", async () => {
    const r = await request(app).get(`/api/imports/articles/template?companyId=${companyId}`).set(h()).buffer(true).parse((res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); });
    expect(r.status).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(r.body);
    const headers = wb.worksheets[0].getRow(1).values.slice(1);
    expect(headers).toEqual(expect.arrayContaining(["Référence", "Désignation", "Famille", "P1", "P4"]));
    expect(wb.worksheets[1].name).toBe("Aide");
  });

  it("previews articles row by row, then creates them (families, brands, cartons, levels, supplier prices)", async () => {
    const buf = await xlsx(
      ["Ref", "Désignation", "Famille", "Marque", "Code barres", "TVA", "Prix public HT", "Stock min", "Traçabilité", "Conditionnement", "Prix d'achat", "Fournisseur", "P1"],
      [
        ["gro-es-lav", "Mitigeur lavabo chromé", "Sanitaire > Robinetterie", "Grohe", "4005176000001", 20, "780,50", 5, "aucune", "Carton:6:4005176000018", 520, "Grohe Maroc", 640],
        ["COL-ACR-4", "Peinture acrylique 4 L", "Peinture > Murale", "Colorado", "", 20, 120, 10, "lot+péremption", "", "", "", ""],
        ["ING-SER-1", "Chauffe-eau 50 L", "Sanitaire > Chauffe-eau", "Ariston", "", 20, 1900, 2, "série", "", "", "", ""],
        ["", "Sans référence", "Sanitaire", "", "", 18, "abc", "", "", "Carton", "", "", ""],
      ],
    );
    const pre = await send("articles", "preview", buf);
    expect(pre.status).toBe(200);
    expect(pre.body.data.summary).toMatchObject({ total: 4, create: 3, update: 0, error: 1 });
    const bad = pre.body.data.rows.find((r) => r.line === 5);
    expect(bad.errors.join(" | ")).toMatch(/Référence manquante.*TVA 18.*Prix public invalide.*Conditionnement/);
    expect(pre.body.data.rows[1].warnings.join(" ")).toMatch(/Famille « Peinture > Murale » créée/);
    expect(await tenantScope.runAsSystem(() => Product.countDocuments({ company: companyId }))).toBe(0); // nothing written

    const done = await send("articles", "commit", buf);
    expect(done.body.data).toMatchObject({ created: 3, updated: 0, skipped: 1 });
    const p = await tenantScope.runAsSystem(() => Product.findOne({ company: companyId, internalReference: "GRO-ES-LAV" }).populate("category brand").lean());
    expect(p).toMatchObject({ name: "Mitigeur lavabo chromé", sellingPrice: 780.5, threshold: 5, tracking: "none" });
    expect(p.category.name).toBe("Robinetterie");
    expect(p.brand.name).toBe("Grohe");
    expect(p.packagings[0]).toMatchObject({ unit: "Carton", factor: 6, barcode: "4005176000018" });
    expect(p.priceLevels).toEqual([{ level: "P1", price: 640 }]);
    expect(p.prices[0]).toMatchObject({ supplierName: "Grohe Maroc", price: 520 });
    const paint = await tenantScope.runAsSystem(() => Product.findOne({ company: companyId, internalReference: "COL-ACR-4" }).lean());
    expect(paint).toMatchObject({ tracking: "lot", hasExpiry: true });

    // a corrected file updates instead of duplicating
    const again = await xlsx(["Référence", "Désignation", "Famille", "Prix public HT"], [["GRO-ES-LAV", "Mitigeur lavabo chromé (nouveau)", "Sanitaire > Robinetterie", 799]]);
    const up = await send("articles", "commit", again);
    expect(up.body.data).toMatchObject({ created: 0, updated: 1 });
    const p2 = await tenantScope.runAsSystem(() => Product.findOne({ company: companyId, internalReference: "GRO-ES-LAV" }).lean());
    expect(p2).toMatchObject({ name: "Mitigeur lavabo chromé (nouveau)", sellingPrice: 799, threshold: 5 });
    expect(p2.packagings).toHaveLength(1); // empty cells keep what was there
  });

  it("imports customers (types, levels, rep by e-mail) and matches them on re-import", async () => {
    const buf = await xlsx(
      ["Code", "Nom", "Type", "Niveau de prix", "ICE", "Téléphone", "Ville", "Commercial", "Plafond de crédit", "Circuit"],
      [
        ["CL-0100", "Quincaillerie Al Amal", "revendeur", "P1", "001534000000012", "0661234567", "Casablanca", "karim@import.ma", 80000, "complet"],
        ["", "Plomberie Benali", "installateur", "p2", "", "", "Rabat", "Inconnu", "", "direct"],
        ["CL-0102", "Client douteux", "grossiste", "P9", "123", "", "", "", "beaucoup", ""],
      ],
    );
    const pre = await send("customers", "preview", buf);
    expect(pre.body.data.summary).toMatchObject({ create: 2, error: 1 });
    expect(pre.body.data.rows[2].errors.join(" ")).toMatch(/Type.*Niveau de prix « P9 ».*ICE.*Plafond/);
    expect(pre.body.data.rows[1].warnings.join(" ")).toMatch(/Commercial « Inconnu » introuvable/);
    const done = await send("customers", "commit", buf);
    expect(done.body.data).toMatchObject({ created: 2, skipped: 1 });
    const c = await tenantScope.runAsSystem(() => Customer.findOne({ company: companyId, code: "CL-0100" }).populate("salesRep", "email").lean());
    expect(c).toMatchObject({ type: "reseller", priceLevel: "P1", creditLimit: 80000, documentFlow: "full" });
    expect(c.salesRep.email).toBe("karim@import.ma");
    const benali = await tenantScope.runAsSystem(() => Customer.findOne({ company: companyId, name: "Plomberie Benali" }).lean());
    expect(benali.code).toMatch(/^CL-\d{4}$/);
    expect(benali).toMatchObject({ type: "installer", priceLevel: "P2", documentFlow: "direct", kind: "company" });
    const again = await send("customers", "preview", await xlsx(["Code", "Nom", "Ville"], [["CL-0100", "Quincaillerie Al Amal", "Mohammedia"]]));
    expect(again.body.data.summary).toMatchObject({ update: 1, create: 0 });
  });

  it("loads opening stock with lots and serial numbers through the stock service", async () => {
    const buf = await xlsx(
      ["Référence", "Code-barres", "Dépôt", "Quantité", "Coût unitaire HT", "Lot", "Péremption", "N° de série"],
      [
        ["GRO-ES-LAV", "", "CASA", 40, 520, "", "", ""],
        ["", "4005176000018", "casa", 2, 530, "", "", ""], // carton barcode → 12 pieces
        ["COL-ACR-4", "", "CASA", 30, 85, "L2026-A", "30/06/2027", ""],
        ["ING-SER-1", "", "CASA", 2, 1400, "", "", "SN-1, SN-2"],
        ["COL-ACR-4", "", "CASA", 5, 85, "", "", ""],
        ["NOPE", "", "MRK", 0, "", "", "", ""],
      ],
    );
    const pre = await send("stock", "preview", buf);
    expect(pre.body.data.summary).toMatchObject({ create: 4, error: 2 });
    expect(pre.body.data.rows[4].errors.join(" ")).toMatch(/n° de lot obligatoire.*péremption obligatoire/i);
    expect(pre.body.data.rows[5].errors.join(" ")).toMatch(/introuvable.*Dépôt « MRK » inconnu.*Quantité/);
    const done = await send("stock", "commit", buf);
    expect(done.body.data).toMatchObject({ created: 4, skipped: 2 });
    const p = await tenantScope.runAsSystem(() => Product.findOne({ company: companyId, internalReference: "GRO-ES-LAV" }).lean());
    expect(p.quantity).toBe(52);
    expect(p.avgCost).toBeCloseTo((40 * 520 + 12 * (530 / 1)) / 52, 1);
    const lots = await tenantScope.runAsSystem(() => StockLot.find({ company: companyId }).lean());
    expect(lots.map((l) => l.number).sort()).toEqual(["L2026-A", "SN-1", "SN-2"]);
  });

  it("refuses what isn't a proper file", async () => {
    const r = await request(app).post(`/api/imports/articles/preview?companyId=${companyId}`).set(h()).attach("file", Buffer.from("hello"), "x.xlsx");
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/illisible/);
    const noCols = await send("articles", "preview", await xlsx(["Nom"], [["x"]]));
    expect(noCols.body.message).toMatch(/Colonnes manquantes/);
  });
});
