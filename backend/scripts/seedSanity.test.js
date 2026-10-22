import { describe, it, expect, beforeAll } from "vitest";

/** The demo seed runs end to end on the in-memory database and leaves a coherent stock. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const { seedSanityClient } = require("./seedSanity");
const Product = require("../models/Product");
const StockLevel = require("../models/StockLevel");
const SalesInvoice = require("../models/SalesInvoice");
const DeliveryNote = require("../models/DeliveryNote");

let out;
beforeAll(async () => {
  fake.connect();
  out = await tenantScope.runAsSystem(() => seedSanityClient({ log: () => {} }));
}, 60000);

describe("Sanity demo seed", () => {
  it("gives the analytics a year to work with", async () => {
    const { analytics } = require("../services/analyticsService");
    const a = await tenantScope.runAsSystem(() => analytics(String(out.company._id), {}));
    expect(a.monthly).toHaveLength(12);
    expect(a.monthly.slice(0, 11).every((m) => m.b2b > 0 && m.counter > 0)).toBe(true);
    expect(a.abc.classes.A.count).toBeGreaterThan(0);
    expect(a.abc.classes.A.count).toBeLessThan(a.abc.articlesWithMargin);
    expect(a.stockAge.buckets.find((b) => b.key === "never").count).toBeGreaterThan(0);
    expect(a.stockouts.length).toBeGreaterThan(0);
    expect(a.aging.some((b) => b.key !== "notDue" && b.amount > 0)).toBe(true);
    expect(a.cashCycle.dso).toBeGreaterThan(0);
    expect(a.cashCycle.dio).toBeGreaterThan(0);
    expect(a.gmroi).toBeGreaterThan(0);
    expect(a.reps.length).toBe(2);
    expect(a.insights.map((i) => i.kind)).toEqual(expect.arrayContaining(["stockout", "receivables", "margin", "abc"]));

    // a rep who only sees their customers: their own sales, no counter, their own target
    const Customer = require("../models/Customer");
    const karim = out.users.rep1._id;
    const scoped = await tenantScope.runAsSystem(async () => {
      const mine = await Customer.find({ company: out.company._id, salesRep: karim }).select("_id").lean();
      return analytics(String(out.company._id), { customer: { $in: mine.map((c) => c._id) } }, { repId: String(karim) });
    });
    expect(scoped.monthly.every((m) => m.counter === 0)).toBe(true);
    expect(scoped.monthly.reduce((x, m) => x + m.b2b, 0)).toBeLessThan(a.monthly.reduce((x, m) => x + m.b2b, 0));
    expect(scoped.reps.map((r) => r._id)).toEqual([String(karim)]);
  });

  it("creates a wholesaler with sites, articles, customers and documents", async () => {
    expect(Object.keys(out.warehouses)).toEqual(["casa", "show", "mrk"]);
    const counts = await tenantScope.runAsSystem(async () => ({
      products: await Product.countDocuments({ company: out.company._id }),
      invoices: await SalesInvoice.countDocuments({ company: out.company._id, status: { $ne: "draft" }, number: { $not: /^FA-H/ } }),
      history: await SalesInvoice.countDocuments({ company: out.company._id, number: /^FA-H/ }),
      notes: await DeliveryNote.countDocuments({ company: out.company._id }),
    }));
    expect(counts.products).toBe(38);
    expect(counts.invoices).toBe(3);
    expect(counts.history).toBeGreaterThan(100); // 11 months of history for the analytics
    expect(counts.notes).toBeGreaterThanOrEqual(3);
  });

  it("keeps Product.quantity equal to the sum of its warehouses, with a CMUP", async () => {
    await tenantScope.runAsSystem(async () => {
      const products = await Product.find({ company: out.company._id }).lean();
      for (const p of products) {
        const levels = await StockLevel.find({ product: p._id }).lean();
        const sum = Math.round(levels.reduce((s, l) => s + l.quantity, 0) * 1e4) / 1e4;
        expect(sum).toBe(p.quantity);
        expect(p.avgCost).toBeGreaterThan(0);
      }
    });
  });

  it("refuses to run twice", async () => {
    await expect(tenantScope.runAsSystem(() => seedSanityClient({ log: () => {} }))).rejects.toThrow(/already exists/);
  });
});

describe("unseed", () => {
  it("removes the demo client entirely", async () => {
    const { unseedSanityClient } = require("./unseed");
    const removed = await tenantScope.runAsSystem(() => unseedSanityClient({ log: () => {} }));
    expect(removed).toBeGreaterThan(100);
    const left = await tenantScope.runAsSystem(() => Product.countDocuments({ company: out.company._id }));
    expect(left).toBe(0);
  });
});
