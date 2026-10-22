const express = require("express");
const crypto = require("crypto");
const PortalUser = require("../models/PortalUser");
const Customer = require("../models/Customer");
const SalesSettings = require("../models/SalesSettings");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad } = require("../utils/salesHelpers");
const { logAudit } = require("../services/auditLogger");
const tenantScope = require("../services/tenantScope");

/**
 * ============================================================
 * PORTAL ACCESS (office side) — /api/portal-admin   (sales.portal.manage)
 * ============================================================
 * GET /settings?companyId= · PUT /settings   open / close the portal, stock display, minimum order
 * GET /accounts?companyId=&customer=
 * POST /accounts { companyId, customer, name, email, phone, role }  → temporary password (shown once)
 * PUT /accounts/:id { name, phone, role, active, resetPassword }
 * DELETE /accounts/:id
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.portalAdmin));

const tempPassword = () => `${crypto.randomBytes(4).toString("hex")}-${crypto.randomInt(1000, 9999)}`;
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));
const view = (u) => ({ _id: u._id, customer: u.customer, name: u.name, email: u.email, phone: u.phone, role: u.role, active: u.active, lastLoginAt: u.lastLoginAt, mustChangePassword: u.mustChangePassword, createdAt: u.createdAt });

router.get("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("portal").lean();
    res.json({ success: true, data: s?.portal || { enabled: false, showStock: "level", minOrderAmount: 0, message: "" } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const p = req.body?.portal || {};
    const set = {};
    if (p.enabled !== undefined) set["portal.enabled"] = p.enabled === true;
    if (["exact", "level", "none"].includes(p.showStock)) set["portal.showStock"] = p.showStock;
    if (p.minOrderAmount !== undefined) set["portal.minOrderAmount"] = Math.max(Number(p.minOrderAmount) || 0, 0);
    if (p.message !== undefined) set["portal.message"] = String(p.message || "").slice(0, 500);
    await SalesSettings.updateOne({ company: req.query.companyId }, { $set: { ...set, updatedBy: req.user.id } }, { upsert: true });
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("portal").lean();
    await logAudit(req, { company: req.query.companyId, action: "update", resourceType: "SalesSettings", resourceId: s._id, resourceLabel: `Portail revendeurs ${s.portal.enabled ? "ouvert" : "fermé"}` });
    res.json({ success: true, data: s.portal });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get("/accounts", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const q = { company: req.query.companyId };
    if (isId(req.query.customer)) q.customer = req.query.customer;
    const rows = await PortalUser.find(q).populate("customer", "name code").sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: rows.map((u) => ({ ...view(u), customer: u.customer })) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post("/accounts", async (req, res) => {
  try {
    const { companyId, customer } = req.body || {};
    if (!isId(companyId) || !isId(customer)) return bad(res, "Choose the customer");
    const c = await Customer.findOne({ _id: customer, company: companyId }).select("name").lean();
    if (!c) return bad(res, "Customer not found", 404);
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!isEmail(email)) return bad(res, "Enter a valid e-mail");
    if (!String(req.body.name || "").trim()) return bad(res, "Enter the person's name");
    // e-mails are unique across the whole platform (login)
    const taken = await tenantScope.runAsSystem(() => PortalUser.exists({ email }));
    if (taken) return bad(res, "This e-mail already has a portal access");
    const password = tempPassword();
    const u = await PortalUser.create({ company: companyId, customer, name: String(req.body.name).trim(), email, phone: req.body.phone, role: req.body.role === "viewer" ? "viewer" : "buyer", password, createdBy: req.user.id });
    await logAudit(req, { company: companyId, action: "create", resourceType: "PortalUser", resourceId: u._id, resourceLabel: `Accès portail ${email} — ${c.name}` });
    res.status(201).json({ success: true, data: { account: view(u), temporaryPassword: password } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put("/accounts/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const u = await PortalUser.findById(req.params.id);
    if (!u) return bad(res, "Access not found", 404);
    if (req.body.name !== undefined) u.name = String(req.body.name).trim().slice(0, 120) || u.name;
    if (req.body.phone !== undefined) u.phone = req.body.phone;
    if (["buyer", "viewer"].includes(req.body.role)) u.role = req.body.role;
    if (req.body.active !== undefined) u.active = req.body.active === true;
    let password = null;
    if (req.body.resetPassword) { password = tempPassword(); u.password = password; u.mustChangePassword = true; u.failedLogins = 0; u.lockedUntil = null; }
    await u.save();
    await logAudit(req, { company: u.company, action: "update", resourceType: "PortalUser", resourceId: u._id, resourceLabel: `Accès portail ${u.email}${password ? " — mot de passe réinitialisé" : ""}` });
    res.json({ success: true, data: { account: view(u), temporaryPassword: password } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete("/accounts/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const u = await PortalUser.findById(req.params.id);
    if (!u) return bad(res, "Access not found", 404);
    await u.deleteOne();
    await logAudit(req, { company: u.company, action: "delete", resourceType: "PortalUser", resourceId: u._id, resourceLabel: `Accès portail ${u.email}` });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
