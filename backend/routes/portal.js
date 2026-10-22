const express = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const PortalUser = require("../models/PortalUser");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const Product = require("../models/Product");
const SalesOrder = require("../models/SalesOrder");
const SalesInvoice = require("../models/SalesInvoice");
const SalesSettings = require("../models/SalesSettings");
const InventoryCategory = require("../models/InventoryCategory");
const tenantScope = require("../services/tenantScope");
const pricing = require("../services/pricingService");
const promotions = require("../services/promotionService");
const flow = require("../services/salesFlowService");
const { buildStatement } = require("../services/statementService");
const { generateInvoicePdf, generateStatementPdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");
const { searchFilter } = require("../utils/searchTokens");
const { isId, bad, normalizeSalesLines } = require("../utils/salesHelpers");
const { createWithNumber } = require("../services/documentNumberService");
const { amountDue, round2 } = require("../services/salesCalc");

/**
 * ============================================================
 * RESELLER PORTAL — /api/portal   (the web page /portail)
 * ============================================================
 * The customer's own staff order online, at THEIR price level (and
 * the promotions they're entitled to), see their orders, invoices and
 * balance. Orders arrive in Ventes › Commandes as drafts from source
 * "online", for the sales team to confirm.
 *
 * Isolation: a portal login has its own token (purpose "portal",
 * refused by the internal API), and every request runs in a tenant
 * context limited to its company AND is filtered on its customer here.
 *
 * POST /login { email, password }         → { token }
 * GET  /me · POST /password { current, next }
 * GET  /families · GET /catalogue?search=&family=&page=
 * POST /orders { lines: [{ product, quantity, unit }], customerReference, notes, deliveryMode }   (buyer)
 * GET  /orders · GET /orders/:id
 * GET  /invoices · GET /invoices/:id/pdf · GET /statement/pdf
 * ============================================================
 */
const router = express.Router();
const TOKEN_DAYS = 14;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `portal-login:${ipKeyGenerator(req.ip || "")}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: "Trop de tentatives — réessayez dans quelques minutes." }),
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const pu = await tenantScope.runAsSystem(() => PortalUser.findOne({ email }).select("+password"));
    const fail = () => res.status(401).json({ success: false, message: "E-mail ou mot de passe incorrect" });
    if (!pu || !pu.active) return fail();
    if (pu.lockedUntil && pu.lockedUntil > new Date()) return res.status(423).json({ success: false, message: "Compte bloqué quelques minutes après plusieurs erreurs." });
    const ok = await pu.matches(req.body?.password);
    await tenantScope.runAsSystem(async () => {
      if (!ok) {
        pu.failedLogins += 1;
        if (pu.failedLogins >= 8) { pu.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); pu.failedLogins = 0; }
      } else {
        pu.failedLogins = 0;
        pu.lockedUntil = null;
        pu.lastLoginAt = new Date();
      }
      await pu.save();
    });
    if (!ok) return fail();
    const settings = await tenantScope.runAsSystem(() => SalesSettings.findOne({ company: pu.company }).select("portal").lean());
    if (!settings?.portal?.enabled) return res.status(403).json({ success: false, message: "Le portail de commande n'est pas ouvert par votre fournisseur." });
    const token = portalToken(pu);
    res.json({ success: true, data: { token, mustChangePassword: pu.mustChangePassword } });
  } catch (e) {
    console.error("portal login error:", e);
    res.status(500).json({ success: false, message: "Erreur" });
  }
});

function portalToken(pu) {
  return jwt.sign({ pid: String(pu._id), purpose: "portal", tv: pu.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn: `${TOKEN_DAYS}d`, algorithm: "HS256" });
}

// With a temporary password, only these work until it is changed.
const BEFORE_PASSWORD_CHANGE = new Set(["GET /me", "POST /password"]);

/** Portal session: the token's portal user, scoped to its company and customer. */
async function portalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Connectez-vous" });
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }); } catch { return res.status(401).json({ success: false, message: "Session expirée" }); }
    if (decoded.purpose !== "portal" || !isId(decoded.pid)) return res.status(401).json({ success: false, message: "Session invalide" });
    const pu = await tenantScope.runAsSystem(() => PortalUser.findById(decoded.pid).lean());
    if (!pu || !pu.active) return res.status(401).json({ success: false, message: "Accès désactivé" });
    if ((decoded.tv || 0) !== (pu.tokenVersion || 0)) return res.status(401).json({ success: false, message: "Session expirée" });
    if (pu.mustChangePassword && !BEFORE_PASSWORD_CHANGE.has(`${req.method} ${req.path}`)) {
      return res.status(403).json({ success: false, code: "MUST_CHANGE_PASSWORD", message: "Choisissez votre mot de passe avant de continuer." });
    }
    const company = await tenantScope.runAsSystem(() => Company.findById(pu.company).select("tenant").lean());
    const settings = await tenantScope.runAsSystem(() => SalesSettings.findOne({ company: pu.company }).select("portal").lean());
    if (!company || !settings?.portal?.enabled) return res.status(403).json({ success: false, message: "Portail fermé" });
    req.portal = { user: pu, companyId: String(pu.company), customerId: String(pu.customer), settings: settings.portal };
    return tenantScope.bindRequest(req, tenantScope.tenantContext({ tenantId: company.tenant, companyIds: [pu.company], userId: null }), next);
  } catch (e) {
    console.error("portal auth error:", e);
    return res.status(500).json({ success: false, message: "Erreur" });
  }
}
router.use(portalAuth);

const fail = (res, e, what) => {
  if (e.status && e.status < 500) return bad(res, e.message, e.status);
  console.error(`portal ${what} error:`, e);
  return res.status(500).json({ success: false, message: "Erreur" });
};
const me = (req) => Customer.findOne({ _id: req.portal.customerId, company: req.portal.companyId });

router.get("/me", async (req, res) => {
  try {
    const c = await me(req).select("name code city priceLevel creditLimit blocked blockedReason discountPercent paymentDays").lean();
    const company = await Company.findById(req.portal.companyId).select("name logo phone email address").lean();
    const open = await SalesInvoice.find({ customer: c._id, type: { $ne: "credit_note" }, status: { $in: ["issued", "partially_paid"] } }).select("totalTTC amountPaid dueDate status type").lean();
    const balance = round2(open.reduce((s, i) => s + amountDue(i), 0));
    const overdue = round2(open.filter((i) => i.dueDate && new Date(i.dueDate) < new Date()).reduce((s, i) => s + amountDue(i), 0));
    res.json({
      success: true,
      data: {
        user: { name: req.portal.user.name, email: req.portal.user.email, role: req.portal.user.role, mustChangePassword: req.portal.user.mustChangePassword },
        customer: { ...c, balance, overdue, available: c.creditLimit ? round2(c.creditLimit - balance) : null },
        company: { name: company?.name, logo: company?.logo?.url || "", phone: company?.phone, email: company?.email },
        portal: { message: req.portal.settings.message, minOrderAmount: req.portal.settings.minOrderAmount, showStock: req.portal.settings.showStock },
      },
    });
  } catch (e) { fail(res, e, "me"); }
});

router.post("/password", async (req, res) => {
  try {
    const next = String(req.body?.next || "");
    if (next.length < 8) return bad(res, "Le nouveau mot de passe doit faire au moins 8 caractères");
    const pu = await PortalUser.findById(req.portal.user._id).select("+password");
    if (!(await pu.matches(req.body?.current))) return bad(res, "Mot de passe actuel incorrect");
    pu.password = next;
    pu.mustChangePassword = false;
    await pu.save();
    res.json({ success: true, token: portalToken(pu) });
  } catch (e) { fail(res, e, "password"); }
});

router.get("/families", async (req, res) => {
  try {
    const rows = await InventoryCategory.find({ company: req.portal.companyId }).select("name parent color").sort({ name: 1 }).lean();
    res.json({ success: true, data: rows });
  } catch (e) { fail(res, e, "families"); }
});

const stockLabel = (mode, p) => {
  if (p.isService || mode === "none") return null;
  const q = Math.max(p.quantity || 0, 0);
  if (mode === "exact") return { quantity: q };
  return { level: q <= 0 ? "on_order" : q <= (p.threshold || 0) ? "limited" : "in_stock" };
};

router.get("/catalogue", async (req, res) => {
  try {
    const customer = await me(req).lean();
    const settings = await pricing.getSettings(req.portal.companyId);
    const promos = await promotions.activeFor(req.portal.companyId);
    const filter = { company: req.portal.companyId, isVariantParent: { $ne: true }, isActive: { $ne: false } };
    const s = searchFilter(req.query.search || "");
    if (s) Object.assign(filter, s);
    if (isId(req.query.family)) {
      const kids = await InventoryCategory.find({ company: req.portal.companyId, parent: req.query.family }).select("_id").lean();
      filter.category = { $in: [req.query.family, ...kids.map((k) => k._id)] };
    }
    if (req.query.promo === "1") filter._id = { $in: promos.flatMap((p) => p.products || []) };
    const page = Math.max(Number(req.query.page) || 1, 1);
    const size = 24;
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).select("name internalReference barcode unit packagings vatRate priceLevels sellingPrice avgCost quantity threshold category brand image isService").sort({ name: 1 }).skip((page - 1) * size).limit(size).lean(),
    ]);
    const rows = products.map((p) => {
      const q = pricing.quoteLine(p, customer, settings, null, { promotions: promos, quantity: 1 });
      const free = promos.find((x) => x.type === "free_goods" && promotions.matches(x, p, customer, "sales", q.level));
      return {
        _id: p._id, name: p.name, ref: p.internalReference, unit: p.unit, vatRate: p.vatRate ?? 20,
        packagings: (p.packagings || []).map((x) => ({ unit: x.unit, factor: x.factor })),
        image: p.image?.url || "", thumb: p.image?.thumbUrl || p.image?.url || "",
        price: q.unitPrice, discount: q.discount, net: q.unitPrice === null ? null : round2(q.unitPrice * (1 - (q.discount || 0) / 100)),
        promotion: q.promotion ? { name: q.promotion.name, endDate: q.promotion.endDate } : free ? { name: free.name, endDate: free.endDate, freeGoods: `${free.buyQuantity} + ${free.freeQuantity}` } : null,
        stock: stockLabel(req.portal.settings.showStock, p),
      };
    });
    res.json({ success: true, data: { rows, total, page, pages: Math.ceil(total / size) } });
  } catch (e) { fail(res, e, "catalogue"); }
});

router.post("/orders", async (req, res) => {
  try {
    if (req.portal.user.role !== "buyer") return bad(res, "Votre accès permet de consulter, pas de commander", 403);
    const customer = await me(req);
    if (customer.blocked) return bad(res, "Votre compte est bloqué — contactez votre commercial", 403);
    const raw = (Array.isArray(req.body?.lines) ? req.body.lines : []).slice(0, 200)
      .filter((l) => isId(l.product) && Number(l.quantity) > 0)
      .map((l) => ({ product: l.product, quantity: Number(l.quantity), unit: l.unit ? String(l.unit) : undefined })); // prices are never taken from the portal
    if (!raw.length) return bad(res, "Votre panier est vide");
    const { lines, error } = await normalizeSalesLines(await flow.priceLines(raw, customer, req.portal.companyId), req.portal.companyId);
    if (error) return bad(res, error);
    const order = await createWithNumber(SalesOrder, {
      company: req.portal.companyId, customer: customer._id, salesRep: customer.salesRep || null, priceLevel: customer.priceLevel,
      warehouse: customer.defaultWarehouse || null, source: "online", customerReference: String(req.body?.customerReference || "").slice(0, 80),
      date: new Date(), deliveryMode: req.body?.deliveryMode === "pickup" ? "pickup" : "delivery",
      deliveryAddress: customer.deliveryAddress || customer.address, lines: lines.map((l) => ({ ...l, deliveredQuantity: 0 })),
      notes: `Commande portail — ${req.portal.user.name}${req.body?.notes ? ` : ${String(req.body.notes).slice(0, 1500)}` : ""}`,
    }, "CC");
    const min = req.portal.settings.minOrderAmount || 0;
    if (min > 0 && order.totalHT < min) {
      await SalesOrder.deleteOne({ _id: order._id });
      return bad(res, `Minimum de commande : ${min.toFixed(2)} MAD HT`);
    }
    try { await require("../services/businessNotifications").onPortalOrder?.(order, customer); } catch (err) { console.error("portal order notification:", err.message); }
    res.status(201).json({ success: true, data: { _id: order._id, number: order.number, totalHT: order.totalHT, totalTTC: order.totalTTC, status: order.status } });
  } catch (e) { fail(res, e, "order"); }
});

const ORDER_STATUS = { draft: "à confirmer", confirmed: "confirmée", partially_delivered: "livrée en partie", delivered: "livrée", invoiced: "facturée", cancelled: "annulée" };
router.get("/orders", async (req, res) => {
  try {
    const rows = await SalesOrder.find({ company: req.portal.companyId, customer: req.portal.customerId }).select("number date status totalHT totalTTC source customerReference lines.description lines.quantity").sort({ date: -1 }).limit(100).lean();
    res.json({ success: true, data: rows.map((o) => ({ ...o, statusLabel: ORDER_STATUS[o.status] || o.status, lines: (o.lines || []).length })) });
  } catch (e) { fail(res, e, "orders"); }
});

router.get("/orders/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Commande introuvable", 404);
    const o = await SalesOrder.findOne({ _id: req.params.id, company: req.portal.companyId, customer: req.portal.customerId }).select("-costTotal -lines.unitCost -creditOverride").lean();
    if (!o) return bad(res, "Commande introuvable", 404);
    res.json({ success: true, data: { ...o, statusLabel: ORDER_STATUS[o.status] || o.status } });
  } catch (e) { fail(res, e, "order"); }
});

router.get("/invoices", async (req, res) => {
  try {
    const rows = await SalesInvoice.find({ company: req.portal.companyId, customer: req.portal.customerId, status: { $in: ["issued", "partially_paid", "paid"] } })
      .select("number type date dueDate totalTTC amountPaid status").sort({ date: -1 }).limit(200).lean();
    res.json({ success: true, data: rows.map((i) => ({ ...i, due: i.type === "credit_note" ? 0 : amountDue(i) })) });
  } catch (e) { fail(res, e, "invoices"); }
});

router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Facture introuvable", 404);
    const invoice = await SalesInvoice.findOne({ _id: req.params.id, company: req.portal.companyId, customer: req.portal.customerId, status: { $in: ["issued", "partially_paid", "paid"] } })
      .populate(["customer", { path: "quote", select: "number" }, { path: "creditedInvoice", select: "number" }, { path: "deliveryNotes", select: "number" }]);
    if (!invoice) return bad(res, "Facture introuvable", 404);
    const company = await Company.findById(invoice.company);
    const doc = generateInvoicePdf({ invoice, company, customer: invoice.customer, quote: invoice.quote, creditedInvoice: invoice.creditedInvoice, logoBuffer: await fetchLogoBuffer(company), deliveryNotes: invoice.deliveryNotes || [] });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (e) { fail(res, e, "invoice pdf"); }
});

router.get("/statement/pdf", async (req, res) => {
  try {
    const customer = await me(req).lean();
    const to = new Date();
    const from = new Date(to.getFullYear(), 0, 1);
    const company = await Company.findById(req.portal.companyId);
    const doc = generateStatementPdf({ statement: await buildStatement(customer, from, to), company, customer, logoBuffer: await fetchLogoBuffer(company) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="releve-${customer.code || "compte"}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (e) { fail(res, e, "statement"); }
});

module.exports = router;
