const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const Company = require("../models/Company");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const InventoryCategory = require("../models/InventoryCategory");
const SalesInvoice = require("../models/SalesInvoice");
const PosSale = require("../models/PosSale");
const CashSession = require("../models/CashSession");
const PurchaseOrder = require("../models/PurchaseOrder");
const stock = require("../services/stockService");
const pricing = require("../services/pricingService");
const portfolio = require("../services/portfolioService");
const { amountDue } = require("../services/salesCalc");
const { createWithNumber } = require("../services/documentNumberService");
const { derivePaymentStatus, applyReceptionToLines, deriveReceptionStatus } = require("../services/purchaseOrderCalc");
const { logAudit } = require("../services/auditLogger");
const { escapeRegex } = require("../utils/escapeRegex");

/**
 * ============================================================
 * SANITY DROGUERIE — the simplified edition for small shops
 * ============================================================
 * Built on the same engine as Sanity (counter, stock, invoices,
 * purchase orders), with the few things a droguerie does every day in
 * ONE step:
 *   GET  /home                     today's sales, the till, who owes me,
 *                                  what I owe, articles to reorder
 *   GET  /carnet                   customers on credit ("le carnet")
 *   GET  /carnet/:customerId       their open sales and payments
 *   POST /carnet/:customerId/payment   an amount received, settled
 *                                  against their OLDEST debts first
 *   GET  /suppliers                suppliers and what I owe each
 *   POST /suppliers/:id/payment    a payment to a supplier (oldest first)
 *   POST /purchases                one purchase in one go: articles in
 *                                  stock at their cost, the supplier's
 *                                  bill, what was paid now
 *   POST /articles/quick           a new article in a few seconds
 * Every query runs in the caller's client scope (services/tenantScope.js).
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.droguerie));

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const fail = (res, error, what) => {
  if (error.status && error.status < 500) return bad(res, error.message, error.status);
  console.error(`droguerie ${what} error:`, error);
  return res.status(500).json({ success: false, message: `Error: ${what}` });
};
const IN_METHODS = ["especes", "cheque", "virement", "carte", "effet"];
const OUT_METHODS = ["especes", "cheque", "virement", "effet", "carte", "autre"];

async function companyOf(req, res, value) {
  const id = value || req.query.companyId || req.body?.companyId;
  if (!isId(id)) {
    bad(res, "A valid company is required");
    return null;
  }
  const company = await Company.findById(id).select("_id name").lean();
  if (!company) {
    bad(res, "Company not found", 404);
    return null;
  }
  return company;
}

const OPEN_INVOICES = { type: "invoice", status: { $in: ["issued", "partially_paid"] } };

/** Who owes what: { customerId → { due, oldest, count } } from open invoices. */
async function debtsByCustomer(companyId, customerIds = null) {
  const filter = { company: companyId, ...OPEN_INVOICES };
  if (customerIds) filter.customer = { $in: customerIds };
  const invoices = await SalesInvoice.find(filter).select("customer type status totalTTC amountPaid date dueDate").lean();
  const map = new Map();
  for (const inv of invoices) {
    const due = amountDue(inv);
    if (due <= 0.004) continue;
    const k = String(inv.customer);
    const row = map.get(k) || { due: 0, oldest: null, count: 0 };
    row.due = round2(row.due + due);
    row.count += 1;
    if (!row.oldest || new Date(inv.date) < row.oldest) row.oldest = new Date(inv.date);
    map.set(k, row);
  }
  return map;
}

/** What I owe each supplier: { supplierId → { due, count } } from purchases. */
async function debtsBySupplier(companyId) {
  const orders = await PurchaseOrder.find({ company: companyId, status: { $ne: "cancelled" } }).select("supplier lines invoices payments date").lean();
  const map = new Map();
  for (const o of orders) {
    const { amountDue: due } = derivePaymentStatus(o);
    if (!(due > 0.004)) continue;
    const k = String(o.supplier);
    const row = map.get(k) || { due: 0, count: 0 };
    row.due = round2(row.due + due);
    row.count += 1;
    map.set(k, row);
  }
  return map;
}

// ---------------- home

router.get("/home", async (req, res) => {
  try {
    const company = await companyOf(req, res);
    if (!company) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [sales, session, customerDebts, supplierDebts, low] = await Promise.all([
      PosSale.find({ company: company._id, date: { $gte: start }, status: { $ne: "refunded" } }).select("totalTTC payments change").lean(),
      CashSession.findOne({ company: company._id, cashier: req.user.id, status: "open" }).select("_id number openingFloat openedAt").lean(),
      debtsByCustomer(company._id),
      debtsBySupplier(company._id),
      Product.find({ company: company._id, isService: { $ne: true }, threshold: { $gt: 0 }, $expr: { $lte: ["$quantity", "$threshold"] } }).select("name quantity threshold unit").sort({ quantity: 1 }).limit(8).lean(),
    ]);
    const byMethod = {};
    for (const s of sales) {
      for (const p of s.payments || []) byMethod[p.method] = round2((byMethod[p.method] || 0) + p.amount);
      if (s.change) byMethod.especes = round2((byMethod.especes || 0) - s.change);
    }
    const topIds = [...customerDebts.entries()].sort((a, b) => b[1].due - a[1].due).slice(0, 5);
    const names = new Map((await Customer.find({ _id: { $in: topIds.map(([id]) => id) } }).select("name phone whatsapp").lean()).map((c) => [String(c._id), c]));
    res.json({
      success: true,
      data: {
        today: {
          tickets: sales.length,
          totalTTC: round2(sales.reduce((t, s) => t + (s.totalTTC || 0), 0)),
          cash: byMethod.especes || 0,
          onCredit: byMethod.credit || 0,
          byMethod,
        },
        session,
        carnet: {
          total: round2([...customerDebts.values()].reduce((t, r) => t + r.due, 0)),
          customers: customerDebts.size,
          top: topIds.map(([id, r]) => ({ _id: id, name: names.get(id)?.name || "—", phone: names.get(id)?.whatsapp || names.get(id)?.phone || "", due: r.due, oldest: r.oldest })),
        },
        suppliers: {
          total: round2([...supplierDebts.values()].reduce((t, r) => t + r.due, 0)),
          count: supplierDebts.size,
        },
        lowStock: low,
      },
    });
  } catch (error) {
    fail(res, error, "home");
  }
});

// ---------------- carnet (customers on credit)

router.get("/carnet", async (req, res) => {
  try {
    const company = await companyOf(req, res);
    if (!company) return;
    const debts = await debtsByCustomer(company._id);
    const filter = { company: company._id, type: { $ne: "walk_in" }, isActive: { $ne: false } };
    const search = String(req.query.search || "").trim();
    if (search) filter.$or = [{ name: { $regex: escapeRegex(search), $options: "i" } }, { phone: { $regex: escapeRegex(search), $options: "i" } }];
    const all = req.query.all === "true";
    if (!all && !search) filter._id = { $in: [...debts.keys()] };
    const customers = await Customer.find(filter).select("name phone whatsapp creditLimit blocked city").sort({ name: 1 }).limit(300).lean();
    const now = Date.now();
    const rows = customers.map((c) => {
      const d = debts.get(String(c._id)) || { due: 0, oldest: null, count: 0 };
      return { ...c, due: d.due, open: d.count, oldest: d.oldest, days: d.oldest ? Math.floor((now - d.oldest.getTime()) / 86400000) : null };
    }).sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
    res.json({ success: true, data: { rows, total: round2(rows.reduce((t, r) => t + r.due, 0)) } });
  } catch (error) {
    fail(res, error, "carnet");
  }
});

router.get("/carnet/:customerId", async (req, res) => {
  try {
    if (!isId(req.params.customerId)) return bad(res, "Invalid customer");
    const customer = await Customer.findById(req.params.customerId).select("company name phone whatsapp creditLimit blocked type").lean();
    if (!customer || customer.type === "walk_in") return bad(res, "Customer not found", 404);
    const invoices = await SalesInvoice.find({ company: customer.company, customer: customer._id, type: "invoice", status: { $in: ["issued", "partially_paid", "paid"] } })
      .select("number type date totalTTC amountPaid status payments posSale subject")
      .populate("posSale", "number")
      .sort({ date: -1 })
      .limit(200)
      .lean();
    const open = invoices.filter((i) => ["issued", "partially_paid"].includes(i.status)).map((i) => ({ _id: i._id, number: i.number, ticket: i.posSale?.number || null, date: i.date, totalTTC: i.totalTTC, due: amountDue(i) }));
    const payments = invoices
      .flatMap((i) => (i.payments || []).map((p) => ({ date: p.date, amount: p.amount, method: p.method, reference: p.reference, invoice: i.number })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);
    const purchases = invoices.slice(0, 30).map((i) => ({ _id: i._id, number: i.number, ticket: i.posSale?.number || null, date: i.date, totalTTC: i.totalTTC, status: i.status }));
    res.json({ success: true, data: { customer, due: round2(open.reduce((t, i) => t + i.due, 0)), open, payments, purchases } });
  } catch (error) {
    fail(res, error, "customer account");
  }
});

/** Money received from a customer: settles their oldest debts first. */
router.post("/carnet/:customerId/payment", async (req, res) => {
  try {
    if (!isId(req.params.customerId)) return bad(res, "Invalid customer");
    const customer = await Customer.findById(req.params.customerId).select("company name type").lean();
    if (!customer || customer.type === "walk_in") return bad(res, "Customer not found", 404);
    let left = round2(req.body?.amount);
    if (!(left > 0)) return bad(res, "Enter the amount received");
    const method = IN_METHODS.includes(req.body?.method) ? req.body.method : "especes";
    const date = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(date.getTime())) return bad(res, "Invalid date");
    const reference = String(req.body?.reference || "").slice(0, 80);
    const invoices = await SalesInvoice.find({ company: customer.company, customer: customer._id, ...OPEN_INVOICES }).sort({ date: 1, number: 1 });
    const totalDue = round2(invoices.reduce((t, i) => t + amountDue(i), 0));
    if (left > totalDue + 0.009) return bad(res, `${customer.name} ne doit que ${totalDue.toFixed(2)} MAD`);
    const settled = [];
    for (const inv of invoices) {
      if (left <= 0.004) break;
      const part = round2(Math.min(left, amountDue(inv)));
      if (part <= 0) continue;
      inv.payments.push({ date, amount: part, method, reference: reference || "Carnet", by: req.user.id });
      inv.updatedBy = req.user.id;
      // eslint-disable-next-line no-await-in-loop
      await inv.save();
      // Cheque / LCN go into the portfolio, as everywhere in Sanity.
      // eslint-disable-next-line no-await-in-loop
      await portfolio.onPayment(inv, inv.payments[inv.payments.length - 1], { bank: req.body?.bank, drawer: req.body?.drawer });
      settled.push({ number: inv.number, amount: part });
      left = round2(left - part);
    }
    await logAudit(req, { company: customer.company, action: "update", resourceType: "Customer", resourceId: customer._id, resourceLabel: `${customer.name} — règlement carnet ${round2(req.body.amount)} MAD (${method})` });
    res.status(201).json({ success: true, data: { settled, remaining: round2(totalDue - round2(req.body.amount)) } });
  } catch (error) {
    fail(res, error, "customer payment");
  }
});

// ---------------- suppliers

router.get("/suppliers", async (req, res) => {
  try {
    const company = await companyOf(req, res);
    if (!company) return;
    const [suppliers, debts] = await Promise.all([
      Supplier.find({ company: company._id, isActive: { $ne: false } }).select("name phone city").sort({ name: 1 }).lean(),
      debtsBySupplier(company._id),
    ]);
    const rows = suppliers.map((s) => ({ ...s, due: debts.get(String(s._id))?.due || 0, open: debts.get(String(s._id))?.count || 0 })).sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));
    res.json({ success: true, data: { rows, total: round2(rows.reduce((t, r) => t + r.due, 0)) } });
  } catch (error) {
    fail(res, error, "suppliers");
  }
});

/** Money paid to a supplier: settles the oldest purchases first. */
router.post("/suppliers/:supplierId/payment", async (req, res) => {
  try {
    if (!isId(req.params.supplierId)) return bad(res, "Invalid supplier");
    const supplier = await Supplier.findById(req.params.supplierId).select("company name").lean();
    if (!supplier) return bad(res, "Supplier not found", 404);
    let left = round2(req.body?.amount);
    if (!(left > 0)) return bad(res, "Enter the amount paid");
    const method = OUT_METHODS.includes(req.body?.method) ? req.body.method : "especes";
    const date = req.body?.date ? new Date(req.body.date) : new Date();
    const orders = await PurchaseOrder.find({ company: supplier.company, supplier: supplier._id, status: { $ne: "cancelled" } }).sort({ date: 1 });
    const totalDue = round2(orders.reduce((t, o) => t + derivePaymentStatus(o).amountDue, 0));
    if (left > totalDue + 0.009) return bad(res, `Vous ne devez que ${totalDue.toFixed(2)} MAD à ${supplier.name}`);
    for (const order of orders) {
      if (left <= 0.004) break;
      const part = round2(Math.min(left, derivePaymentStatus(order).amountDue));
      if (part <= 0) continue;
      order.payments.push({ date, amount: part, method, reference: String(req.body?.reference || "").slice(0, 80), by: req.user.id });
      order.updatedBy = req.user.id;
      // eslint-disable-next-line no-await-in-loop
      await order.save();
      left = round2(left - part);
    }
    res.status(201).json({ success: true, data: { remaining: round2(totalDue - round2(req.body.amount)) } });
  } catch (error) {
    fail(res, error, "supplier payment");
  }
});

// ---------------- articles

/** The family new articles go to when none is given ("Divers"). */
async function defaultFamily(companyId) {
  const found = await InventoryCategory.findOne({ company: companyId, name: "Divers" }).select("_id").lean();
  if (found) return found._id;
  return (await InventoryCategory.create({ company: companyId, name: "Divers" }))._id;
}

/** Creates an article from a name and a TTC selling price (one price for every customer). */
async function quickArticle(companyId, body, actorId) {
  const name = String(body.name || "").trim().slice(0, 200);
  if (!name) throw Object.assign(new Error("Enter the article name"), { status: 400 });
  const settings = await pricing.getSettings(companyId);
  const vatRate = settings.vatRegistered === false ? 0 : [0, 7, 10, 14, 20].includes(Number(body.vatRate)) ? Number(body.vatRate) : 20;
  const ttc = round2(body.salePriceTTC);
  if (!(ttc >= 0)) throw Object.assign(new Error("Enter the selling price"), { status: 400 });
  const ht = round2(ttc / (1 + vatRate / 100));
  const levels = (settings.priceLevels || []).map((l) => l.code).filter(Boolean);
  const barcode = String(body.barcode || "").trim().slice(0, 40);
  if (barcode && (await Product.exists({ company: companyId, barcode }))) throw Object.assign(new Error("This barcode is already used by another article"), { status: 409 });
  let category = isId(body.category) ? body.category : null;
  if (category && !(await InventoryCategory.exists({ _id: category, company: companyId }))) category = null;
  return Product.create({
    company: companyId,
    category: category || (await defaultFamily(companyId)),
    name,
    barcode,
    unit: String(body.unit || "pièce").slice(0, 30),
    vatRate,
    threshold: Math.max(0, Number(body.threshold) || 0),
    sellingPrice: ht,
    priceLevels: (levels.length ? levels : ["P1"]).map((level) => ({ level, price: ht })),
    createdBy: actorId,
  });
}

router.post("/articles/quick", async (req, res) => {
  try {
    const company = await companyOf(req, res);
    if (!company) return;
    const product = await quickArticle(company._id, req.body || {}, req.user.id);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    fail(res, error, "quick article");
  }
});

// ---------------- purchases (one step)

/**
 * body: { companyId, supplier | supplierName, reference, date?,
 *         lines: [{ product | newArticle: { name, salePriceTTC, unit, barcode }, quantity, unitCost }],
 *         paid: { amount, method } }
 * unitCost = what the shop pays per unit, VAT included when the shop is
 * VAT-registered it is split back to HT for the stock cost (CMUP).
 */
router.post("/purchases", async (req, res) => {
  try {
    const company = await companyOf(req, res);
    if (!company) return;
    const b = req.body || {};
    const settings = await pricing.getSettings(company._id);
    const vatRegistered = settings.vatRegistered !== false;

    let supplier = null;
    if (isId(b.supplier)) supplier = await Supplier.findOne({ _id: b.supplier, company: company._id }).select("_id name").lean();
    else if (String(b.supplierName || "").trim()) {
      const name = String(b.supplierName).trim().slice(0, 200);
      supplier = (await Supplier.findOne({ company: company._id, name }).select("_id name").lean())
        || (await Supplier.create({ company: company._id, name, createdBy: req.user.id })).toObject();
    }
    if (!supplier) return bad(res, "Choose the supplier");
    if (!Array.isArray(b.lines) || !b.lines.length) return bad(res, "Add at least one article");

    const lines = [];
    for (const raw of b.lines.slice(0, 200)) {
      const quantity = Number(raw.quantity);
      const unitCost = round2(raw.unitCost);
      if (!(quantity > 0)) return bad(res, "Every line needs a quantity");
      if (!(unitCost >= 0)) return bad(res, "Every line needs a purchase price");
      let product = null;
      if (isId(raw.product)) {
        // eslint-disable-next-line no-await-in-loop
        product = await Product.findOne({ _id: raw.product, company: company._id }).select("name unit vatRate");
        if (!product) return bad(res, "An article doesn't belong to this shop");
      } else if (raw.newArticle?.name) {
        // eslint-disable-next-line no-await-in-loop
        product = await quickArticle(company._id, raw.newArticle, req.user.id);
      } else return bad(res, "Choose or create the article of every line");
      const vatRate = vatRegistered ? product.vatRate ?? 20 : 0;
      lines.push({ product: product._id, description: product.name, quantity, unit: product.unit, unitPrice: round2(unitCost / (1 + vatRate / 100)), vatRate });
    }

    const reference = String(b.reference || "").trim().slice(0, 100) || `Achat ${new Date().toLocaleDateString("fr-MA")}`;
    const date = b.date ? new Date(b.date) : new Date();
    const warehouse = await stock.defaultWarehouse(company._id);
    const order = await createWithNumber(PurchaseOrder, {
      company: company._id, supplier: supplier._id, warehouse: warehouse?._id || null, date, status: "sent", lines,
      notes: "Achat rapide (Droguerie)", createdBy: req.user.id, updatedBy: req.user.id,
    }, "BC");

    // Into stock at cost, in one reception.
    const entries = order.lines.map((l) => ({ lineId: String(l._id), quantity: l.quantity }));
    for (const l of order.lines) {
      // eslint-disable-next-line no-await-in-loop
      await stock.receive({ product: l.product, warehouse, quantity: l.quantity, unitCost: l.unitPrice, reason: `Achat ${order.number} (${reference})`, source: { kind: "purchase", id: order._id, number: order.number }, actorId: req.user.id, supplier: supplier._id, isPurchase: true });
    }
    applyReceptionToLines(order, "reception", entries);
    order.receptions.push({ type: "reception", reference, date, lines: entries, by: req.user.id });
    order.status = deriveReceptionStatus(order);
    // The supplier's bill = the purchase total; what was paid now.
    order.invoices.push({ type: "invoice", number: reference, date, dueDate: date, amountTTC: order.totalTTC, by: req.user.id });
    const paid = round2(Math.min(round2(b.paid?.amount), order.totalTTC));
    if (paid > 0) order.payments.push({ date, amount: paid, method: OUT_METHODS.includes(b.paid?.method) ? b.paid.method : "especes", reference, by: req.user.id });
    await order.save();
    await logAudit(req, { company: company._id, action: "create", resourceType: "PurchaseOrder", resourceId: order._id, resourceLabel: `${order.number} — achat rapide ${supplier.name} ${order.totalTTC} MAD` });
    res.status(201).json({ success: true, data: { _id: order._id, number: order.number, totalTTC: order.totalTTC, paid, owed: round2(order.totalTTC - paid), supplier: supplier.name } });
  } catch (error) {
    fail(res, error, "purchase");
  }
});

module.exports = router;
