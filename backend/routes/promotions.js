const express = require("express");
const Promotion = require("../models/Promotion");
const RebateAgreement = require("../models/RebateAgreement");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad } = require("../utils/salesHelpers");
const { customerScope } = require("../services/salesFlowService");
const Customer = require("../models/Customer");
const promo = require("../services/promotionService");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * PROMOTIONS & RFA — /api/promotions
 * ============================================================
 * GET  /?companyId=&status=active|upcoming|past     POST /   PUT /:id   DELETE /:id
 * GET  /rebates?companyId=                         POST /rebates   PUT /rebates/:id   DELETE /rebates/:id
 * GET  /rebates/:id/progress     each customer: turnover, tier, what's missing for the next
 * POST /rebates/:id/settle { customers? }   draft credit notes (sales.promotions.manage)
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.promotions));

const fail = (res, e, what) => {
  if (e.name === "ValidationError") return bad(res, Object.values(e.errors)[0].message);
  if (e.status && e.status < 500) return bad(res, e.message, e.status);
  console.error(`${what} error:`, e);
  return res.status(500).json({ success: false, message: e.message });
};
const idList = (v) => (Array.isArray(v) ? v.map((x) => x?._id || x).filter(isId) : []);

function promoFields(b) {
  const out = {};
  for (const k of ["name", "notes", "type"]) if (b[k] !== undefined) out[k] = b[k];
  for (const k of ["value", "buyQuantity", "freeQuantity", "minQuantity"]) if (b[k] !== undefined) out[k] = b[k] === "" || b[k] === null ? null : Number(b[k]);
  for (const k of ["active", "stackable"]) if (b[k] !== undefined) out[k] = b[k] === true;
  for (const k of ["startDate", "endDate"]) if (b[k]) out[k] = new Date(b[k]);
  for (const k of ["products", "categories", "brands", "customers"]) if (b[k] !== undefined) out[k] = idList(b[k]);
  if (Array.isArray(b.customerTypes)) out.customerTypes = b.customerTypes;
  if (Array.isArray(b.priceLevels)) out.priceLevels = b.priceLevels.map((x) => String(x).toUpperCase());
  if (Array.isArray(b.channels)) out.channels = b.channels.filter((c) => ["sales", "pos"].includes(c));
  return out;
}
function checkPromo(p) {
  if (p.endDate && p.startDate && new Date(p.endDate) < new Date(p.startDate)) return "The end date is before the start date";
  if (p.type === "percent" && !(p.value > 0 && p.value <= 100)) return "Enter a discount between 0 and 100 %";
  if (p.type === "price" && !(p.value >= 0)) return "Enter the promotional price";
  if (p.type === "free_goods" && !(p.buyQuantity >= 1 && p.freeQuantity >= 1)) return "Enter how many to buy and how many are free (e.g. 10 + 1)";
  if (p.channels && !p.channels.length) return "Choose at least one channel";
  return null;
}

router.get("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const now = new Date();
    const q = { company: req.query.companyId };
    if (req.query.status === "active") Object.assign(q, { active: true, startDate: { $lte: now }, endDate: { $gte: now } });
    if (req.query.status === "upcoming") Object.assign(q, { startDate: { $gt: now } });
    if (req.query.status === "past") Object.assign(q, { endDate: { $lt: now } });
    const rows = await Promotion.find(q).sort({ startDate: -1 }).populate("products", "name internalReference").populate("categories", "name").populate("brands", "name").populate("customers", "name code").lean();
    res.json({ success: true, data: rows });
  } catch (e) { fail(res, e, "GET promotions"); }
});

router.post("/", async (req, res) => {
  try {
    const companyId = req.body?.company || req.body?.companyId;
    if (!isId(companyId)) return bad(res, "company is required");
    const data = promoFields(req.body || {});
    const problem = checkPromo(data);
    if (problem) return bad(res, problem);
    const p = await Promotion.create({ ...data, company: companyId, createdBy: req.user.id });
    await logAudit(req, { company: companyId, action: "create", resourceType: "Promotion", resourceId: p._id, resourceLabel: p.name });
    res.status(201).json({ success: true, data: p });
  } catch (e) { fail(res, e, "POST promotion"); }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const p = await Promotion.findById(req.params.id);
    if (!p) return bad(res, "Promotion not found", 404);
    p.set(promoFields(req.body || {}));
    const problem = checkPromo(p.toObject());
    if (problem) return bad(res, problem);
    p.updatedBy = req.user.id;
    await p.save();
    await logAudit(req, { company: p.company, action: "update", resourceType: "Promotion", resourceId: p._id, resourceLabel: p.name });
    res.json({ success: true, data: p });
  } catch (e) { fail(res, e, "PUT promotion"); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const p = await Promotion.findById(req.params.id);
    if (!p) return bad(res, "Promotion not found", 404);
    await p.deleteOne();
    await logAudit(req, { company: p.company, action: "delete", resourceType: "Promotion", resourceId: p._id, resourceLabel: p.name });
    res.json({ success: true });
  } catch (e) { fail(res, e, "DELETE promotion"); }
});

// ---------------------------------------------------------------- RFA
function rebateFields(b) {
  const out = {};
  for (const k of ["name", "notes", "mode", "status"]) if (b[k] !== undefined) out[k] = b[k];
  for (const k of ["from", "to"]) if (b[k]) out[k] = new Date(b[k]);
  if (b.customers !== undefined) out.customers = idList(b.customers);
  if (Array.isArray(b.customerTypes)) out.customerTypes = b.customerTypes;
  if (Array.isArray(b.tiers)) out.tiers = b.tiers.map((t) => ({ threshold: Number(t.threshold), percent: Number(t.percent) })).filter((t) => t.threshold >= 0 && t.percent >= 0).sort((a, b2) => a.threshold - b2.threshold);
  return out;
}
const checkRebate = (r) => (!r.tiers?.length ? "Add at least one tier" : r.to && r.from && new Date(r.to) < new Date(r.from) ? "The end date is before the start date" : null);

async function repCustomerIds(req, companyId) {
  const scope = customerScope(req);
  if (!scope.salesRep) return null;
  return (await Customer.find({ company: companyId, ...scope }).select("_id").lean()).map((c) => String(c._id));
}

router.get("/rebates", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const rows = await RebateAgreement.find({ company: req.query.companyId }).sort({ from: -1 }).populate("customers", "name code").lean();
    res.json({ success: true, data: rows });
  } catch (e) { fail(res, e, "GET rebates"); }
});

router.post("/rebates", async (req, res) => {
  try {
    const companyId = req.body?.company || req.body?.companyId;
    if (!isId(companyId)) return bad(res, "company is required");
    const data = rebateFields(req.body || {});
    const problem = checkRebate(data);
    if (problem) return bad(res, problem);
    const r = await RebateAgreement.create({ ...data, company: companyId, createdBy: req.user.id });
    await logAudit(req, { company: companyId, action: "create", resourceType: "RebateAgreement", resourceId: r._id, resourceLabel: r.name });
    res.status(201).json({ success: true, data: r });
  } catch (e) { fail(res, e, "POST rebate"); }
});

router.put("/rebates/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const r = await RebateAgreement.findById(req.params.id);
    if (!r) return bad(res, "Agreement not found", 404);
    r.set(rebateFields(req.body || {}));
    const problem = checkRebate(r.toObject());
    if (problem) return bad(res, problem);
    await r.save();
    res.json({ success: true, data: r });
  } catch (e) { fail(res, e, "PUT rebate"); }
});

router.delete("/rebates/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const r = await RebateAgreement.findById(req.params.id);
    if (!r) return bad(res, "Agreement not found", 404);
    if (r.settlements.length) return bad(res, "Credit notes were already made from this agreement — close it instead");
    await r.deleteOne();
    res.json({ success: true });
  } catch (e) { fail(res, e, "DELETE rebate"); }
});

router.get("/rebates/:id/progress", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const r = await RebateAgreement.findById(req.params.id).lean();
    if (!r) return bad(res, "Agreement not found", 404);
    const mine = await repCustomerIds(req, r.company);
    const rows = await promo.progress(r, mine);
    const totals = rows.reduce((t, x) => ({ turnover: t.turnover + x.turnover, amount: t.amount + x.amount }), { turnover: 0, amount: 0 });
    res.json({ success: true, data: { agreement: r, rows, totals: { turnover: Math.round(totals.turnover * 100) / 100, amount: Math.round(totals.amount * 100) / 100 } } });
  } catch (e) { fail(res, e, "GET rebate progress"); }
});

router.post("/rebates/:id/settle", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const r = await RebateAgreement.findById(req.params.id);
    if (!r) return bad(res, "Agreement not found", 404);
    const wanted = Array.isArray(req.body?.customers) && req.body.customers.length ? req.body.customers.filter(isId) : null;
    const created = await promo.settle(r, wanted, req.user.id);
    await logAudit(req, { company: r.company, action: "update", resourceType: "RebateAgreement", resourceId: r._id, resourceLabel: `${r.name} — ${created.length} avoir(s) RFA` });
    res.json({ success: true, data: { created } });
  } catch (e) { fail(res, e, "POST rebate settle"); }
});

module.exports = router;
