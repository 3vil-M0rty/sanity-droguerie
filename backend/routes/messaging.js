const express = require("express");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const SalesSettings = require("../models/SalesSettings");
const MessageLog = require("../models/MessageLog");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad } = require("../utils/salesHelpers");
const { canSeeCustomer, customerScope } = require("../services/salesFlowService");
const wa = require("../services/whatsappService");
const messaging = require("../services/messagingService");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * MESSAGING (WhatsApp) — /api/messaging
 * ============================================================
 * GET  /status                                  cloud API or wa.me links, templates
 * GET  /settings?companyId= · PUT /settings     automatic reminders
 * POST /invoices/:id/whatsapp      { to?, message? }
 * POST /customers/:id/statement/whatsapp { to?, from?, until?, message? }
 * GET  /reminders?companyId=&minDays=           who is late, how much, last reminder
 * POST /reminders  { companyId, customers: [ids], minDays?, message? }
 * GET  /log?companyId=&customer=&kind=
 * In link mode the answer carries `url` (wa.me) for the browser to open.
 * A rep only reaches their own customers.
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.messaging));

const fail = (res, err, what) => {
  if (err.status && err.status < 500) return bad(res, err.message, err.status);
  console.error(`${what} error:`, err);
  return res.status(err.status || 500).json({ success: false, message: err.message });
};
const answer = (out) => ({ success: true, data: { log: out.log, url: out.url || null, mode: out.log.provider } });

router.get("/status", (req, res) => res.json({ success: true, data: wa.status() }));

router.get("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("whatsapp").lean();
    res.json({ success: true, data: { whatsapp: s?.whatsapp || { autoReminders: false, reminderDays: [3, 15, 30], signature: "" }, ...wa.status() } });
  } catch (err) { fail(res, err, "GET messaging settings"); }
});

router.put("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const w = req.body?.whatsapp || {};
    const set = {};
    if (w.autoReminders !== undefined) set["whatsapp.autoReminders"] = w.autoReminders === true;
    if (Array.isArray(w.reminderDays)) {
      const days = [...new Set(w.reminderDays.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 365))].sort((a, b) => a - b);
      if (!days.length || days.length > 6) return bad(res, "Give between 1 and 6 reminder days (1 to 365)");
      set["whatsapp.reminderDays"] = days;
    }
    if (w.signature !== undefined) set["whatsapp.signature"] = String(w.signature || "").trim().slice(0, 200);
    await SalesSettings.updateOne({ company: req.query.companyId }, { $set: { ...set, updatedBy: req.user.id } }, { upsert: true });
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("whatsapp").lean();
    await logAudit(req, { company: req.query.companyId, action: "update", resourceType: "SalesSettings", resourceId: s._id, resourceLabel: "Relances WhatsApp" });
    res.json({ success: true, data: { whatsapp: s.whatsapp, ...wa.status() } });
  } catch (err) { fail(res, err, "PUT messaging settings"); }
});

router.post("/invoices/:id/whatsapp", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id).populate("customer");
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (!canSeeCustomer(req, invoice.customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    if (invoice.status === "draft" || invoice.status === "cancelled") return bad(res, "Issue the invoice before sending it");
    const out = await messaging.sendInvoice(invoice, { to: req.body?.to, message: req.body?.message, req, sentBy: req.user.id });
    res.json(answer(out));
  } catch (err) { fail(res, err, "POST invoice whatsapp"); }
});

router.post("/customers/:id/statement/whatsapp", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid customer ID");
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer) return bad(res, "Customer not found", 404);
    if (!canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const from = req.body?.from ? new Date(req.body.from) : new Date(new Date().getFullYear(), 0, 1);
    const until = req.body?.until ? new Date(req.body.until) : new Date();
    until.setHours(23, 59, 59, 999);
    const out = await messaging.sendStatement(customer, { from, to: until, phone: req.body?.to, message: req.body?.message, req, sentBy: req.user.id });
    res.json(answer(out));
  } catch (err) { fail(res, err, "POST statement whatsapp"); }
});

const scopeFilter = (req) => {
  const s = customerScope(req);
  return s.salesRep ? s : null;
};

router.get("/reminders", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    let rows = await messaging.remindersDue(req.query.companyId, { minDays: Math.max(Number(req.query.minDays) || 1, 0) });
    const mine = scopeFilter(req);
    if (mine) rows = rows.filter((r) => String(r.customer.salesRep || "") === String(mine.salesRep));
    rows.forEach((r) => { r.text = undefined; });
    res.json({ success: true, data: { rows, mode: wa.mode() } });
  } catch (err) { fail(res, err, "GET reminders"); }
});

router.post("/reminders", async (req, res) => {
  try {
    const companyId = req.body?.companyId;
    if (!isId(companyId)) return bad(res, "companyId is required");
    const wanted = new Set((req.body?.customers || []).map(String));
    if (!wanted.size) return bad(res, "Choose at least one customer");
    let rows = (await messaging.remindersDue(companyId, { minDays: Math.max(Number(req.body?.minDays) || 1, 0) })).filter((r) => wanted.has(String(r.customer._id)));
    const mine = scopeFilter(req);
    if (mine) rows = rows.filter((r) => String(r.customer.salesRep || "") === String(mine.salesRep));
    const results = [];
    for (const row of rows) {
      try {
        const out = await messaging.sendReminder(row, { req, sentBy: req.user.id, message: req.body?.message });
        results.push({ customer: row.customer, ok: true, url: out.url || null, status: out.log.status });
      } catch (err) {
        results.push({ customer: row.customer, ok: false, error: err.message });
      }
    }
    res.json({ success: true, data: { results, mode: wa.mode() } });
  } catch (err) { fail(res, err, "POST reminders"); }
});

router.get("/log", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const q = { company: req.query.companyId };
    if (isId(req.query.customer)) q.customer = req.query.customer;
    if (["invoice", "statement", "reminder"].includes(req.query.kind)) q.kind = req.query.kind;
    const mine = scopeFilter(req);
    if (mine) q.customer = { $in: (await Customer.find({ company: req.query.companyId, ...mine }).select("_id").lean()).map((c) => c._id).filter((id) => !isId(req.query.customer) || String(id) === String(req.query.customer)) };
    const rows = await MessageLog.find(q).sort({ createdAt: -1 }).limit(200).populate("customer", "name code").populate("sentBy", "firstName lastName").lean();
    res.json({ success: true, data: rows });
  } catch (err) { fail(res, err, "GET message log"); }
});

module.exports = router;
