const express = require("express");
const PaymentInstrument = require("../models/PaymentInstrument");
const DepositSlip = require("../models/DepositSlip");
const Company = require("../models/Company");
const Customer = require("../models/Customer");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { has } = require("../services/permissionService");
const { isId, bad } = require("../utils/salesHelpers");
const { customerScope } = require("../services/salesFlowService");
const portfolio = require("../services/portfolioService");
const { generateDepositSlipPdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * PORTEFEUILLE CHÈQUES & LCN — /api/portfolio
 * ============================================================
 * GET  /?companyId=&status=&kind=&dueFrom=&dueTo=&customer=&search=
 * GET  /deposits?companyId=                bordereaux de remise
 * POST /deposits  { companyId, instruments, date, mode, bankAccount }   (sales.portfolio.deposit)
 * GET  /deposits/:id/pdf
 * POST /deposits/:id/clear { date }        every item of the slip cleared  (sales.portfolio.settle)
 * POST /:id/clear  { date }                                                (sales.portfolio.settle)
 * POST /:id/unpaid { date, reason, fees, block }                           (sales.portfolio.settle)
 * A rep without sales.customers.viewAll sees only their customers' items.
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.portfolio));

const fail = (res, e, what) => {
  if (e.status && e.status < 500) return bad(res, e.message, e.status);
  console.error(`${what} error:`, e);
  return res.status(500).json({ success: false, message: e.message });
};
async function repCustomers(req, companyId) {
  const scope = customerScope(req);
  if (!scope.salesRep) return null;
  return (await Customer.find({ company: companyId, ...scope }).select("_id").lean()).map((c) => c._id);
}

router.get("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const mine = await repCustomers(req, req.query.companyId);
    const data = await portfolio.list(req.query.companyId, { ...req.query, customer: isId(req.query.customer) ? req.query.customer : undefined, customerIn: mine || undefined });
    res.json({ success: true, data });
  } catch (e) { fail(res, e, "GET portfolio"); }
});

router.get("/deposits", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const rows = await DepositSlip.find({ company: req.query.companyId }).sort({ date: -1, number: -1 }).limit(300).populate("by", "firstName lastName").lean();
    res.json({ success: true, data: rows });
  } catch (e) { fail(res, e, "GET deposits"); }
});

router.post("/deposits", async (req, res) => {
  try {
    if (!isId(req.body?.companyId)) return bad(res, "companyId is required");
    const slip = await portfolio.deposit(req.body.companyId, req.body, req.user.id);
    await logAudit(req, { company: req.body.companyId, action: "create", resourceType: "DepositSlip", resourceId: slip._id, resourceLabel: `${slip.number} — ${slip.count} valeur(s), ${slip.total.toFixed(2)} MAD` });
    res.status(201).json({ success: true, data: slip });
  } catch (e) { fail(res, e, "POST deposit"); }
});

router.get("/deposits/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const slip = await DepositSlip.findById(req.params.id).lean();
    if (!slip) return bad(res, "Deposit slip not found", 404);
    const instruments = await PaymentInstrument.find({ _id: { $in: slip.instruments } }).populate("customer", "name").sort({ dueDate: 1 }).lean();
    const company = await Company.findById(slip.company);
    const doc = generateDepositSlipPdf({ slip, instruments, company, logoBuffer: await fetchLogoBuffer(company) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${slip.number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (e) { fail(res, e, "GET deposit pdf"); }
});

router.post("/deposits/:id/clear", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const slip = await DepositSlip.findById(req.params.id).lean();
    if (!slip) return bad(res, "Deposit slip not found", 404);
    const items = await PaymentInstrument.find({ _id: { $in: slip.instruments }, status: "deposited" });
    for (const i of items) await portfolio.clear(i, req.body || {}, req.user.id);
    res.json({ success: true, data: { cleared: items.length } });
  } catch (e) { fail(res, e, "POST deposit clear"); }
});

async function loadOne(req, res) {
  if (!isId(req.params.id)) { bad(res, "Invalid ID"); return null; }
  const ins = await PaymentInstrument.findById(req.params.id);
  if (!ins) { bad(res, "Item not found", 404); return null; }
  return ins;
}

router.post("/:id/clear", async (req, res) => {
  try {
    const ins = await loadOne(req, res);
    if (!ins) return;
    res.json({ success: true, data: await portfolio.clear(ins, req.body || {}, req.user.id) });
  } catch (e) { fail(res, e, "POST clear"); }
});

router.post("/:id/unpaid", async (req, res) => {
  try {
    const ins = await loadOne(req, res);
    if (!ins) return;
    const block = req.body?.block === true && has(req.user, "sales.customers.credit");
    const out = await portfolio.unpaid(ins, { ...req.body, block }, req.user.id);
    await logAudit(req, { company: ins.company, action: "update", resourceType: "PaymentInstrument", resourceId: ins._id, resourceLabel: `Impayé ${ins.kind === "lcn" ? "LCN" : "chèque"} ${ins.number || ""} — ${ins.amount.toFixed(2)} MAD (${ins.invoiceNumber})` });
    try {
      await require("../services/businessNotifications").onUnpaidInstrument?.(out, req.user.id);
    } catch (err) { console.error("unpaid notification failed:", err.message); }
    res.json({ success: true, data: out, blocked: block });
  } catch (e) { fail(res, e, "POST unpaid"); }
});

module.exports = router;
