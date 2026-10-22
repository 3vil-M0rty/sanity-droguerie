const express = require("express");
const mongoose = require("mongoose");
const SalesTarget = require("../models/SalesTarget");
const SalesInvoice = require("../models/SalesInvoice");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { has } = require("../services/permissionService");
const reps = require("../services/salesRepService");
const flow = require("../services/salesFlowService");

/**
 * SALES REPS (commerciaux) — /api/sales-reps
 * GET  /?companyId=                                the reps (for pickers)
 * GET  /performance?companyId=&period=YYYY-MM       CA, marge, encaissé, objectif, commission per rep
 * GET  /targets?companyId=&period=                  · PUT /targets { company, salesRep, period, … }
 * GET  /collections?companyId=&salesRep=            recouvrement: open invoices by customer
 * POST /collections/:invoiceId/actions { type, note, promiseDate, promiseAmount }
 * A rep without "sales.reps.view" only sees their own figures.
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.salesReps));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const periodOk = (p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p || ""));

router.get("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    res.json({ success: true, data: await reps.repsOf(req.query.companyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading reps", error: error.message });
  }
});

router.get("/performance", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const period = periodOk(req.query.period) ? req.query.period : reps.currentPeriod();
    const only = has(req.user, "sales.reps.view") ? (isId(req.query.salesRep) ? req.query.salesRep : null) : req.user.id;
    res.json({ success: true, data: await reps.performance(req.query.companyId, period, only) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error computing performance", error: error.message });
  }
});

router.get("/targets", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const filter = { company: req.query.companyId };
    if (periodOk(req.query.period)) filter.period = req.query.period;
    if (!has(req.user, "sales.reps.view")) filter.salesRep = req.user.id;
    res.json({ success: true, data: await SalesTarget.find(filter).populate("salesRep", "firstName lastName").sort({ period: -1 }).lean() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading targets", error: error.message });
  }
});

router.put("/targets", async (req, res) => {
  try {
    const { company, salesRep, period } = req.body;
    if (!isId(company) || !isId(salesRep) || !periodOk(period)) return bad(res, "Company, rep and period (YYYY-MM) are required");
    if (!(await User.exists({ _id: salesRep }))) return bad(res, "Rep not found");
    const num = (v) => Math.max(Number(v) || 0, 0);
    const update = {
      revenueTarget: num(req.body.revenueTarget), collectionTarget: num(req.body.collectionTarget), newCustomersTarget: num(req.body.newCustomersTarget),
      commissionRate: req.body.commissionRate === "" || req.body.commissionRate === null || req.body.commissionRate === undefined ? null : Math.min(num(req.body.commissionRate), 100),
      bonus: num(req.body.bonus), notes: String(req.body.notes || "").slice(0, 500), updatedBy: req.user.id,
    };
    let t = await SalesTarget.findOne({ company, salesRep, period });
    if (t) Object.assign(t, update);
    else t = new SalesTarget({ company, salesRep, period, ...update });
    await t.save();
    res.json({ success: true, data: t });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving the target", error: error.message });
  }
});

router.get("/collections", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const customerFilter = await flow.repFilter(req, req.query.companyId);
    const salesRep = isId(req.query.salesRep) ? req.query.salesRep : null;
    res.json({ success: true, data: await reps.collections(req.query.companyId, { salesRep, customerFilter }) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading collections", error: error.message });
  }
});

router.post("/collections/:invoiceId/actions", async (req, res) => {
  try {
    if (!isId(req.params.invoiceId)) return bad(res, "Invalid ID");
    const invoice = await SalesInvoice.findById(req.params.invoiceId).populate("customer", "salesRep");
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (!flow.canSeeCustomer(req, invoice.customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const type = ["call", "visit", "reminder", "promise", "dispute", "note"].includes(req.body.type) ? req.body.type : "note";
    if (type === "promise" && !req.body.promiseDate) return bad(res, "Enter the promised payment date");
    invoice.collectionActions.push({
      type, note: String(req.body.note || "").slice(0, 500),
      promiseDate: req.body.promiseDate || null, promiseAmount: req.body.promiseAmount === "" || req.body.promiseAmount === undefined ? null : Math.max(Number(req.body.promiseAmount) || 0, 0),
      by: req.user.id,
    });
    await invoice.save();
    res.status(201).json({ success: true, data: invoice.collectionActions[invoice.collectionActions.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error recording the action", error: error.message });
  }
});

module.exports = router;
