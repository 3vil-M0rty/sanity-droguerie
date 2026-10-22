import { describe, it, expect, beforeAll } from "vitest";

/** Daily business checks: each alert once, to the right people. */
const tenantScope = require("./tenantScope");
const fake = require("../test/fakeMongo");
const mongoose = require("mongoose");

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Quote = require("../models/Quote");
const SalesInvoice = require("../models/SalesInvoice");
const StockLot = require("../models/StockLot");
const Notification = require("../models/Notification");
const checks = require("./businessNotifications");
const { applyMovement } = require("./inventoryService");

const DAY = 86400000;
const ago = (n) => new Date(Date.now() - n * DAY);
let ids = {};

beforeAll(async () => {
  fake.connect();
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "T" });
    const admin = await User.create({ firstName: "A", lastName: "A", email: "a@x.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const company = await Company.create({ name: "Négoce", tenant: tenant._id, owner: admin._id, industry: "x", legalForm: "SARL" });
    const sales = await User.create({ firstName: "S", lastName: "S", email: "s@x.ma", password: "secret12", role: "user", department: "sales", tenant: tenant._id });
    const rep = await User.create({ firstName: "R", lastName: "R", email: "r@x.ma", password: "secret12", role: "user", department: "sales", tenant: tenant._id });
    const purch = await User.create({ firstName: "P", lastName: "P", email: "p@x.ma", password: "secret12", role: "user", department: "purchasing", tenant: tenant._id });
    const store = await User.create({ firstName: "M", lastName: "M", email: "m@x.ma", password: "secret12", role: "user", department: "warehouse", tenant: tenant._id });
    const customer = await Customer.create({ company: company._id, name: "Quincaillerie Atlas", salesRep: rep._id });
    const quote = await Quote.create({ company: company._id, number: "DV-1", customer: customer._id, date: ago(20), validUntil: new Date(Date.now() + 2 * DAY), status: "sent", lines: [{ description: "x", quantity: 1, unitPrice: 100 }], createdBy: sales._id });
    const invoice = await SalesInvoice.create({ company: company._id, number: "FA-1", type: "invoice", customer: customer._id, date: ago(60), dueDate: ago(5), status: "issued", lines: [{ description: "x", quantity: 1, unitPrice: 100 }], createdBy: sales._id });
    const product = await Product.create({ company: company._id, category: new mongoose.Types.ObjectId(), name: "Silicone blanc", quantity: 0, threshold: 10, unit: "cartouche" });
    await applyMovement({ product, type: "in", quantity: 12, unitCost: 18, actorId: admin._id });
    await StockLot.create({ company: company._id, product: product._id, warehouse: new mongoose.Types.ObjectId(), number: "L-2401", quantity: 5, expiryDate: new Date(Date.now() + 10 * DAY) });
    ids = { admin: String(admin._id), sales: String(sales._id), rep: String(rep._id), purch: String(purch._id), store: String(store._id), quote: quote._id, invoice: invoice._id, product };
  });
});

const notesFor = (userId, key) => tenantScope.runAsSystem(() => Notification.find({ user: userId, ...(key ? { key } : {}) }).lean());

describe("daily business checks", () => {
  it("alerts expiring devis, overdue invoices and expiring lots — once", async () => {
    const r1 = await tenantScope.runAsSystem(() => checks.runDailyBusinessChecks());
    expect(r1).toEqual({ checkQuotesExpiring: 1, checkOverdueInvoices: 1, checkLateDeliveries: 0, checkExpiringLots: 1 });
    expect(await notesFor(ids.sales, "quoteExpiring")).toHaveLength(1); // author
    expect(await notesFor(ids.rep, "quoteExpiring")).toHaveLength(1); // the customer's rep
    expect(await notesFor(ids.rep, "invoiceOverdue")).toHaveLength(1);
    expect(await notesFor(ids.store, "lotExpiring")).toHaveLength(1);
    expect(await notesFor(ids.purch, "invoiceOverdue")).toHaveLength(0);
    const r2 = await tenantScope.runAsSystem(() => checks.runDailyBusinessChecks());
    expect(r2).toEqual({ checkQuotesExpiring: 0, checkOverdueInvoices: 0, checkLateDeliveries: 0, checkExpiringLots: 0 });
  });

  it("alerts low stock once per drop, again after a restock", async () => {
    await tenantScope.runAsSystem(async () => {
      const p = await Product.findById(ids.product._id);
      await applyMovement({ product: p, type: "out", quantity: 1, actorId: ids.admin }); // 11: above threshold
      await applyMovement({ product: p, type: "out", quantity: 2, actorId: ids.admin }); // 9: alert
      await applyMovement({ product: p, type: "out", quantity: 1, actorId: ids.admin }); // 8: no repeat
    });
    expect(await notesFor(ids.purch, "stockLow")).toHaveLength(1);
    expect(await notesFor(ids.store, "stockLow")).toHaveLength(1);
    expect(await notesFor(ids.admin, "stockLow")).toHaveLength(0); // the person who took it out isn't told
    await tenantScope.runAsSystem(async () => {
      const p = await Product.findById(ids.product._id);
      await applyMovement({ product: p, type: "in", quantity: 20, actorId: ids.admin }); // 28: marker cleared
      await applyMovement({ product: p, type: "out", quantity: 19, actorId: ids.admin }); // 9: alert again
    });
    const again = await notesFor(ids.purch, "stockLow");
    expect(again).toHaveLength(2);
    expect(again[1].params).toMatchObject({ article: "Silicone blanc", quantity: 9, threshold: 10 });
  });
});
