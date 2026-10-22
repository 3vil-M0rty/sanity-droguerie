const express = require("express");
const Customer = require("../models/Customer");
const Quote = require("../models/Quote");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const SalesInvoice = require("../models/SalesInvoice");
const Company = require("../models/Company");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad, validationMessage } = require("../utils/salesHelpers");
const { amountDue, round2 } = require("../services/salesCalc");
const { logAudit } = require("../services/auditLogger");
const { has } = require("../services/permissionService");
const { customerScope, canSeeCustomer, exposure } = require("../services/salesFlowService");
const pricing = require("../services/pricingService");
const { buildStatement } = require("../services/statementService");
const { generateStatementPdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");

/**
 * CUSTOMERS (clients) — /api/customers
 *   GET  /?companyId=&search=&type=&salesRep=&zone=&active=   list (+ what each owes)
 *   GET  /walk-in?companyId=           the anonymous counter customer (created if missing)
 *   GET  /:id                          file + documents + exposure / credit
 *   GET  /:id/statement?from=&to=      relevé de compte (invoices, credit notes, payments)
 *   GET  /:id/statement/pdf?from=&to=  the same as a PDF
 *   POST /  · PUT /:id  · DELETE /:id (only if unused, else deactivate)
 *   PATCH /:id/block  { blocked, reason }       (sales.customers.credit)
 * A rep without "sales.customers.viewAll" only sees their own customers.
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.customers));

const FIELDS = ["name", "kind", "ice", "identifiantFiscal", "rc", "email", "phone", "address", "city", "paymentDays", "notes", "isActive",
  "whatsapp", "autoReminders", "code", "type", "priceLevel", "discountPercent", "documentFlow", "deliveryAddress", "zone", "deliveryDays", "gps"];
function pick(body, req) {
  const out = {};
  for (const f of FIELDS) if (body[f] !== undefined) out[f] = body[f];
  if (out.priceLevel === "") out.priceLevel = null;
  if (out.code !== undefined) out.code = String(out.code || "").trim().toUpperCase() || undefined;
  if (body.defaultWarehouse !== undefined) out.defaultWarehouse = isId(body.defaultWarehouse) ? body.defaultWarehouse : null;
  // Only who may assign customers / manage credit changes these.
  if (body.salesRep !== undefined && has(req.user, "sales.customers.viewAll")) out.salesRep = isId(body.salesRep) ? body.salesRep : null;
  if (body.creditLimit !== undefined && has(req.user, "sales.customers.credit")) out.creditLimit = body.creditLimit === "" || body.creditLimit === null ? null : Math.max(Number(body.creditLimit) || 0, 0);
  if (Array.isArray(body.contacts)) {
    out.contacts = body.contacts
      .filter((c) => c && (c.name || c.phone || c.email))
      .map((c) => ({ name: c.name, role: c.role, phone: c.phone, email: c.email }));
  }
  return out;
}

async function nextCode(companyId) {
  const last = await Customer.findOne({ company: companyId, code: /^CL-\d+$/ }).sort({ code: -1 }).select("code").lean();
  const n = last ? Number(last.code.slice(3)) + 1 : 1;
  return `CL-${String(n).padStart(4, "0")}`;
}

router.get("/", async (req, res) => {
  try {
    const { companyId, search, active, type, salesRep, zone } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const filter = { company: companyId, type: { $ne: "walk_in" }, ...customerScope(req) };
    if (active === "true") filter.isActive = true;
    if (type) filter.type = type;
    if (zone) filter.zone = zone;
    if (isId(salesRep) && !filter.salesRep) filter.salesRep = salesRep;
    if (salesRep === "none" && !filter.salesRep) filter.salesRep = null;
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { code: rx }, { ice: rx }, { city: rx }, { email: rx }, { phone: rx }];
    }
    const customers = await Customer.find(filter).populate("salesRep", "firstName lastName").sort({ name: 1 }).lean();
    const invoices = await SalesInvoice.find({ company: companyId, status: { $in: ["issued", "partially_paid"] }, type: { $ne: "credit_note" } })
      .select("customer status type totalTTC amountPaid dueDate").lean();
    const now = new Date();
    const due = new Map();
    for (const inv of invoices) {
      const k = String(inv.customer);
      const cur = due.get(k) || { due: 0, overdue: 0 };
      const d = amountDue(inv);
      cur.due = round2(cur.due + d);
      if (inv.dueDate && new Date(inv.dueDate) < now) cur.overdue = round2(cur.overdue + d);
      due.set(k, cur);
    }
    res.json({ success: true, data: customers.map((c) => ({ ...c, ...(due.get(String(c._id)) || { due: 0, overdue: 0 }) })) });
  } catch (error) {
    console.error("GET customers error:", error);
    res.status(500).json({ success: false, message: "Error loading customers", error: error.message });
  }
});

/** The anonymous counter customer ("Client comptoir"). */
async function walkIn(companyId) {
  let c = await Customer.findOne({ company: companyId, type: "walk_in" });
  if (!c) {
    const settings = await pricing.getSettings(companyId);
    c = await Customer.create({ company: companyId, name: "Client comptoir", kind: "individual", type: "walk_in", code: "CL-COMPTOIR", priceLevel: settings.posPriceLevel, paymentDays: 0, documentFlow: "direct" });
  }
  return c;
}
router.get("/walk-in", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "A valid companyId is required");
    res.json({ success: true, data: await walkIn(req.query.companyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading the counter customer", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id).populate("salesRep", "firstName lastName email").populate("defaultWarehouse", "code name").lean();
    if (!customer) return bad(res, "Customer not found", 404);
    if (!canSeeCustomer(req, { salesRep: customer.salesRep?._id })) return bad(res, "This customer is assigned to another sales rep", 403);
    const [quotes, orders, notes, invoices, exp] = await Promise.all([
      Quote.find({ customer: customer._id }).select("number date status totalTTC subject").sort({ date: -1 }).limit(30).lean(),
      SalesOrder.find({ customer: customer._id }).select("number date status totalTTC").sort({ date: -1 }).limit(30).lean(),
      DeliveryNote.find({ customer: customer._id }).select("number type date status totalTTC invoice").sort({ date: -1 }).limit(30).lean(),
      SalesInvoice.find({ customer: customer._id, status: { $ne: "cancelled" } })
        .select("number type date dueDate status totalTTC amountPaid").sort({ date: -1 }).limit(100).lean(),
      exposure(customer._id),
    ]);
    const due = round2(invoices.reduce((s, i) => s + amountDue(i), 0));
    const invoiced = round2(invoices.filter((i) => i.status !== "draft").reduce((s, i) => s + (i.type === "credit_note" ? -1 : 1) * i.totalTTC, 0));
    const creditLeft = customer.creditLimit > 0 ? round2(customer.creditLimit - exp.total) : null;
    res.json({ success: true, data: { ...customer, quotes, orders, deliveryNotes: notes, invoices, stats: { due, invoiced, exposure: exp, creditLeft } } });
  } catch (error) {
    console.error("GET customer error:", error);
    res.status(500).json({ success: false, message: "Error loading the customer", error: error.message });
  }
});

router.get("/:id/statement/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return bad(res, "Customer not found", 404);
    if (!canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), 0, 1);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);
    const company = await Company.findById(customer.company);
    const doc = generateStatementPdf({ statement: await buildStatement(customer, from, to), company, customer, logoBuffer: await fetchLogoBuffer(company) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="releve-${customer.code || "client"}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("GET statement pdf error:", error);
    res.status(500).json({ success: false, message: "Error generating the statement", error: error.message });
  }
});

/** Relevé de compte: debit (invoices) / credit (credit notes, payments) with running balance. */
router.get("/:id/statement", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return bad(res, "Customer not found", 404);
    if (!canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), 0, 1);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);
    res.json({ success: true, data: await buildStatement(customer, from, to) });
  } catch (error) {
    console.error("GET statement error:", error);
    res.status(500).json({ success: false, message: "Error building the statement", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { company } = req.body;
    if (!isId(company) || !(await Company.exists({ _id: company }))) return bad(res, "A valid company is required");
    const data = pick(req.body, req);
    if (data.type === "walk_in") return bad(res, "The counter customer is created automatically");
    // A rep creating a customer owns it.
    if (!has(req.user, "sales.customers.viewAll")) data.salesRep = req.user.id;
    if (data.salesRep && !(await User.exists({ _id: data.salesRep }))) return bad(res, "Sales rep not found");
    if (!data.code) data.code = await nextCode(company);
    if (!data.priceLevel) data.priceLevel = (await pricing.getSettings(company)).defaultPriceLevel;
    const customer = await Customer.create({ ...data, company, createdBy: req.user.id, updatedBy: req.user.id });
    await logAudit(req, { company, action: "create", resourceType: "Customer", resourceId: customer._id, resourceLabel: customer.name });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This customer code is already used", 409);
    res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: validationMessage(error, "Error creating the customer") });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id);
    if (!customer) return bad(res, "Customer not found", 404);
    if (!canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const data = pick(req.body, req);
    if (customer.type === "walk_in") delete data.type;
    Object.assign(customer, data, { updatedBy: req.user.id });
    await customer.save();
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This customer code is already used", 409);
    res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: validationMessage(error, "Error updating the customer") });
  }
});

router.patch("/:id/block", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id);
    if (!customer) return bad(res, "Customer not found", 404);
    customer.blocked = !!req.body.blocked;
    customer.blockedReason = customer.blocked ? String(req.body.reason || "").slice(0, 300) : "";
    customer.updatedBy = req.user.id;
    await customer.save();
    await logAudit(req, { company: customer.company, action: "update", resourceType: "Customer", resourceId: customer._id, resourceLabel: `${customer.name} — ${customer.blocked ? "bloqué" : "débloqué"}` });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating the customer", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id);
    if (!customer) return bad(res, "Customer not found", 404);
    if (customer.type === "walk_in") return bad(res, "The counter customer can't be deleted");
    if (!canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const used = (await Quote.exists({ customer: customer._id })) || (await SalesInvoice.exists({ customer: customer._id }))
      || (await SalesOrder.exists({ customer: customer._id })) || (await DeliveryNote.exists({ customer: customer._id }));
    if (used) {
      customer.isActive = false;
      customer.updatedBy = req.user.id;
      await customer.save();
      return res.json({ success: true, deactivated: true, message: "This customer has documents: deactivated instead of deleted" });
    }
    await customer.deleteOne();
    await logAudit(req, { company: customer.company, action: "delete", resourceType: "Customer", resourceId: customer._id, resourceLabel: customer.name });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE customer error:", error);
    res.status(500).json({ success: false, message: "Error deleting the customer", error: error.message });
  }
});

module.exports = router;
module.exports.walkIn = walkIn;
