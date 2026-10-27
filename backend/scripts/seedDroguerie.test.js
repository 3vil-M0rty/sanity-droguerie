import { describe, it, expect, beforeAll } from "vitest";

/** The droguerie demo seed runs end to end (through the real API) on the in-memory database. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const os = require("os");
const fs = require("fs");
const path = require("path");

process.env.STORAGE_LOCAL_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "seed-droguerie-"));
delete process.env.CLOUDINARY_URL;
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.R2_ACCOUNT_ID;

process.env.JWT_SECRET = process.env.JWT_SECRET || "seed-droguerie-secret";
const { seedDroguerieClient } = require("./seedDroguerie");

let out;
beforeAll(async () => {
  fake.connect();
  tenantScope.enableStrictMode(true);
  out = await tenantScope.runAsSystem(() => seedDroguerieClient({ log: () => {} }));
}, 120000);

describe("Sanity Droguerie demo seed", () => {
  it("creates a shop in the droguerie edition, outside VAT", async () => {
    expect(out.tenant.edition).toBe("droguerie");
    const SalesSettings = require("../models/SalesSettings");
    const s = await tenantScope.runAsSystem(() => SalesSettings.findOne({ company: out.company._id }).lean());
    expect(s.vatRegistered).toBe(false);
  });

  it("fills the shop home: sales, carnet, supplier debts, reorders", () => {
    expect(out.home.today.tickets).toBeGreaterThan(0);
    expect(out.home.session).toBeTruthy();
    expect(out.home.carnet.total).toBeGreaterThan(0);
    expect(out.home.carnet.customers).toBeGreaterThan(1);
    expect(out.home.suppliers.total).toBeGreaterThan(0);
    expect(out.home.lowStock.length).toBeGreaterThan(0);
  });

  it("spreads the counter sales over two weeks", async () => {
    const PosSale = require("../models/PosSale");
    const dates = await tenantScope.runAsSystem(() => PosSale.find({ company: out.company._id }).select("date").lean());
    const days = new Set(dates.map((d) => new Date(d.date).toDateString()));
    expect(days.size).toBeGreaterThan(10);
  });

  it("gives every article a picture and the shop a logo", async () => {
    const Product = require("../models/Product");
    const Company = require("../models/Company");
    const products = await tenantScope.runAsSystem(() => Product.find({ company: out.company._id }).select("image").lean());
    expect(products.length).toBeGreaterThan(50);
    expect(products.every((p) => p.image?.url && p.image?.thumbUrl && p.image?.publicId)).toBe(true);
    const shop = await tenantScope.runAsSystem(() => Company.findById(out.company._id).select("logo").lean());
    expect(shop.logo.url).toBeTruthy();
  });

  it("refuses to run twice", async () => {
    await expect(tenantScope.runAsSystem(() => seedDroguerieClient({ log: () => {} }))).rejects.toThrow(/already exists/);
  });
});
