const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const { runAsSystem } = require("../services/tenantScope");
const billing = require("../services/billingService");
const Tenant = require("../models/Tenant");
const Plan = require("../models/Plan");
const PlatformInvoice = require("../models/PlatformInvoice");
const PlatformSettings = require("../models/PlatformSettings");

/**
 * ============================================================
 * /api/platform/billing — the platform invoicing its clients
 * ============================================================
 * Platform operator (platform_admin) only. Plans, each client's
 * subscription, invoices (generate / issue / pay / credit note / PDF),
 * seller settings. Logic: services/billingService.js.
 * ============================================================
 */
const router = express.Router();

router.use(auth, (req, res, next) => {
  if (req.user?.role !== "platform_admin") return res.status(403).json({ success: false, message: "Platform administrators only" });
  return next();
});

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const fail = (res, error, fallback) => {
  if (error.status && error.status < 500) return res.status(error.status).json({ success: false, message: error.message });
  console.error(`Billing: ${fallback}`, error);
  return res.status(500).json({ success: false, message: fallback });
};
const num = (v, { min = 0, max = Infinity, nullable = false } = {}) => {
  if ((v === null || v === "") && nullable) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 100) / 100 : undefined;
};

// ---------------- settings

const SELLER_FIELDS = ["legalName", "legalForm", "capital", "address", "city", "ice", "taxId", "rc", "patente", "cnss", "email", "phone", "bankName", "rib"];

router.get("/settings", async (req, res) => {
  try {
    res.json({ success: true, data: await billing.getSettings() });
  } catch (error) {
    fail(res, error, "Error loading billing settings");
  }
});

router.put("/settings", async (req, res) => {
  try {
    const b = req.body || {};
    const set = {};
    for (const k of SELLER_FIELDS) if (b.seller?.[k] !== undefined) set[`seller.${k}`] = String(b.seller[k]).trim().slice(0, 200);
    if (b.invoicePrefix !== undefined) {
      if (!/^[A-Za-z]{2,8}$/.test(String(b.invoicePrefix))) return res.status(400).json({ success: false, message: "Prefix: 2 to 8 letters" });
      set.invoicePrefix = String(b.invoicePrefix).toUpperCase();
    }
    for (const [k, max] of [["vatRate", 100], ["paymentTermsDays", 120], ["trialDays", 180], ["graceDays", 180]]) {
      if (b[k] !== undefined) {
        const n = num(b[k], { max });
        if (n === undefined) return res.status(400).json({ success: false, message: `Invalid ${k}` });
        set[k] = n;
      }
    }
    for (const k of ["autoSuspend", "emailInvoices"]) if (b[k] !== undefined) set[k] = !!b[k];
    if (Array.isArray(b.addons)) {
      const addons = [];
      for (const a of b.addons.slice(0, 30)) {
        const name = String(a?.name || "").trim().slice(0, 120);
        if (!name) continue;
        const priceHT = num(a.priceHT ?? 0);
        if (priceHT === undefined || !["month", "one_time", "quote"].includes(a.unit || "month")) return res.status(400).json({ success: false, message: `Invalid option: ${name}` });
        addons.push({ code: String(a.code || name).toUpperCase().replace(/[^A-Z0-9_-]/g, "_").slice(0, 30), name, priceHT, unit: a.unit || "month", note: String(a.note || "").slice(0, 200) });
      }
      set.addons = addons;
    }
    if (b.priceList) {
      if (b.priceList.tagline !== undefined) set["priceList.tagline"] = String(b.priceList.tagline).slice(0, 200);
      if (b.priceList.terms !== undefined) set["priceList.terms"] = String(b.priceList.terms).slice(0, 1500);
      if (b.priceList.validUntil !== undefined) set["priceList.validUntil"] = b.priceList.validUntil ? new Date(b.priceList.validUntil) : null;
    }
    await billing.getSettings();
    const data = await runAsSystem(() => PlatformSettings.findOneAndUpdate({ key: "billing" }, { $set: set }, { new: true }));
    res.json({ success: true, data });
  } catch (error) {
    fail(res, error, "Error saving billing settings");
  }
});

// ---------------- plans

function planBody(b, partial) {
  const out = {};
  if (b.code !== undefined || !partial) {
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(String(b.code || ""))) return { error: "Code: 2 to 30 letters, digits, - or _" };
    out.code = String(b.code).toUpperCase();
  }
  if (b.name !== undefined || !partial) {
    if (!String(b.name || "").trim()) return { error: "Name is required" };
    out.name = String(b.name).trim().slice(0, 80);
  }
  if (b.description !== undefined) out.description = String(b.description).slice(0, 500);
  if (b.monthlyPriceHT !== undefined || !partial) {
    const n = num(b.monthlyPriceHT);
    if (n === undefined) return { error: "Invalid monthly price" };
    out.monthlyPriceHT = n;
  }
  if (b.yearlyPriceHT !== undefined) {
    const n = num(b.yearlyPriceHT, { nullable: true });
    if (n === undefined) return { error: "Invalid yearly price" };
    out.yearlyPriceHT = n;
  }
  for (const k of ["maxCompanies", "maxEmployees"]) {
    if (b.limits?.[k] !== undefined) {
      const n = num(b.limits[k], { nullable: true });
      if (n === undefined) return { error: `Invalid ${k}` };
      out[`limits.${k}`] = n === null ? null : Math.floor(n);
    }
  }
  if (b.setupFeeHT !== undefined) {
    const n = num(b.setupFeeHT);
    if (n === undefined) return { error: "Invalid set-up fee" };
    out.setupFeeHT = n;
  }
  if (b.storageQuotaMB !== undefined) {
    const n = num(b.storageQuotaMB, { nullable: true });
    if (n === undefined) return { error: "Invalid storage quota (MB)" };
    out.storageQuotaMB = n;
  }
  for (const k of ["includedUsers", "includedWarehouses"]) {
    if (b[k] !== undefined) {
      const n = num(b[k], { nullable: true });
      if (n === undefined) return { error: `Invalid ${k}` };
      out[k] = n === null ? null : Math.floor(n);
    }
  }
  if (b.audience !== undefined) out.audience = String(b.audience).slice(0, 160);
  if (b.highlight !== undefined) out.highlight = !!b.highlight;
  if (b.edition !== undefined) {
    if (!["sanity", "droguerie"].includes(b.edition)) return { error: "Invalid edition" };
    out.edition = b.edition;
  }
  if (Array.isArray(b.features)) out.features = b.features.map((f) => String(f).trim().slice(0, 160)).filter(Boolean).slice(0, 20);
  if (b.active !== undefined) out.active = !!b.active;
  if (b.sort !== undefined) out.sort = Number(b.sort) || 0;
  return { data: out };
}

router.get("/plans", async (req, res) => {
  try {
    const plans = await runAsSystem(() => Plan.find().sort({ sort: 1, monthlyPriceHT: 1 }).lean());
    const counts = await runAsSystem(() => Tenant.aggregate([{ $match: { "subscription.plan": { $ne: null } } }, { $group: { _id: "$subscription.plan", n: { $sum: 1 } } }]));
    const byPlan = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json({ success: true, data: plans.map((p) => ({ ...p, clients: byPlan.get(String(p._id)) || 0 })) });
  } catch (error) {
    fail(res, error, "Error loading plans");
  }
});

router.post("/plans", async (req, res) => {
  try {
    const { data, error } = planBody(req.body || {}, false);
    if (error) return res.status(400).json({ success: false, message: error });
    const flat = { ...data, limits: { maxCompanies: data["limits.maxCompanies"] ?? null, maxEmployees: data["limits.maxEmployees"] ?? null } };
    delete flat["limits.maxCompanies"];
    delete flat["limits.maxEmployees"];
    if (await runAsSystem(() => Plan.exists({ code: flat.code }))) return res.status(409).json({ success: false, message: "This code is already used" });
    const plan = await runAsSystem(() => Plan.create(flat));
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "This code is already used" });
    fail(res, error, "Error creating plan");
  }
});

router.put("/plans/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const { data, error } = planBody(req.body || {}, true);
    if (error) return res.status(400).json({ success: false, message: error });
    if (data.code && await runAsSystem(() => Plan.exists({ code: data.code, _id: { $ne: req.params.id } }))) {
      return res.status(409).json({ success: false, message: "This code is already used" });
    }
    const plan = await runAsSystem(() => Plan.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true }));
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, data: plan });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "This code is already used" });
    fail(res, error, "Error updating plan");
  }
});

// The default Sanity catalogue (config/defaultCatalog.js): creates the
// plans that don't exist yet (by code) and fills the options and the
// price-list texts when empty. Never overwrites your own prices.
router.post("/plans/defaults", async (req, res) => {
  try {
    res.json({ success: true, data: await billing.loadDefaultCatalog() });
  } catch (error) {
    fail(res, error, "Error loading the catalogue");
  }
});

// Printable price list (A4 PDF) from the current plans and options.
router.get("/price-list.pdf", async (req, res) => {
  try {
    // ?edition=droguerie: the shop edition's own flyer (its plans, options and terms).
    const droguerie = req.query.edition === "droguerie";
    const [allPlans, settings] = await Promise.all([
      runAsSystem(() => Plan.find({ active: true }).sort({ sort: 1, monthlyPriceHT: 1 }).lean()),
      billing.getSettings(),
    ]);
    const plans = allPlans.filter((p) => (p.edition === "droguerie") === droguerie);
    if (!plans.length) return res.status(400).json({ success: false, message: "No active plan: load the Sanity catalogue or create a plan first" });
    const base = settings.toObject ? settings.toObject() : settings;
    const { DROGUERIE_ADDONS, DROGUERIE_PRICE_LIST } = require("../config/defaultCatalog");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Sanity${droguerie ? "-Droguerie" : ""}-grille-tarifaire-${new Date().toISOString().slice(0, 7)}.pdf"`);
    const doc = require("../services/priceListPdf").priceListPdf(droguerie
      ? { plans, addons: DROGUERIE_ADDONS, settings: { ...base, priceList: { ...base.priceList, ...DROGUERIE_PRICE_LIST } }, title: "Sanity Droguerie" }
      : { plans, addons: settings.addons || [], settings: base });
    doc.pipe(res);
    doc.end();
  } catch (error) {
    fail(res, error, "Error generating the price list");
  }
});

// ---------------- subscriptions

router.get("/subscriptions", async (req, res) => {
  try {
    const [tenants, plans, standing] = await Promise.all([
      runAsSystem(() => Tenant.find().sort({ name: 1 }).lean()),
      runAsSystem(() => Plan.find().lean()),
      billing.standingByTenant(),
    ]);
    const planOf = new Map(plans.map((p) => [String(p._id), p]));
    res.json({
      success: true,
      data: tenants.map((t) => {
        const sub = t.subscription || {};
        const plan = sub.plan ? planOf.get(String(sub.plan)) : null;
        return {
          _id: t._id, name: t.name, status: t.status, suspendedReason: t.suspendedReason || null, limits: t.limits,
          subscription: { ...sub, plan: plan ? { _id: plan._id, code: plan.code, name: plan.name } : null },
          cyclePriceHT: plan ? billing.cyclePriceHT(sub, plan) : 0,
          due: standing.get(String(t._id))?.due || 0,
          overdue: standing.get(String(t._id))?.overdue || 0,
        };
      }),
    });
  } catch (error) {
    fail(res, error, "Error loading subscriptions");
  }
});

router.put("/subscriptions/:tenantId", async (req, res) => {
  try {
    if (!isId(req.params.tenantId)) return res.status(400).json({ success: false, message: "Invalid client id" });
    const b = req.body || {};
    const settings = await billing.getSettings();
    const result = await runAsSystem(async () => {
      const tenant = await Tenant.findById(req.params.tenantId);
      if (!tenant) return { status: 404, message: "Client not found" };
      const sub = tenant.subscription;
      let plan = null;
      if (b.plan !== undefined) {
        if (b.plan === null || b.plan === "") {
          sub.plan = null;
          sub.status = "none";
        } else {
          if (!isId(b.plan)) return { status: 400, message: "Invalid plan" };
          plan = await Plan.findById(b.plan);
          if (!plan) return { status: 404, message: "Plan not found" };
          sub.plan = plan._id;
          // The plan decides the product edition (full ERP or shop).
          tenant.edition = plan.edition || "sanity";
        }
      }
      if (b.cycle !== undefined) {
        if (!["monthly", "yearly"].includes(b.cycle)) return { status: 400, message: "Invalid cycle" };
        sub.cycle = b.cycle;
      }
      if (b.priceHT !== undefined) {
        const n = num(b.priceHT, { nullable: true });
        if (n === undefined) return { status: 400, message: "Invalid price" };
        sub.priceHT = n;
      }
      if (b.discountPct !== undefined) {
        const n = num(b.discountPct, { max: 100 });
        if (n === undefined) return { status: 400, message: "Invalid discount" };
        sub.discountPct = n;
      }
      if (b.billingEmail !== undefined) sub.billingEmail = String(b.billingEmail).trim().toLowerCase();
      if (b.billing) for (const k of ["legalName", "address", "city", "ice", "taxId", "rc"]) if (b.billing[k] !== undefined) sub.billing[k] = String(b.billing[k]).trim().slice(0, 200);
      if (b.startedAt !== undefined) sub.startedAt = b.startedAt ? new Date(b.startedAt) : null;
      // Start (or restart) a trial / activate / cancel.
      if (b.action === "start_trial") {
        if (!sub.plan) return { status: 400, message: "Choose a plan first" };
        const days = num(b.trialDays ?? settings.trialDays, { max: 365 }) ?? settings.trialDays;
        sub.status = "trial";
        sub.trialEndsAt = new Date(Date.now() + days * 86400000);
        sub.startedAt = sub.startedAt || sub.trialEndsAt;
        sub.cancelledAt = null;
      } else if (b.action === "activate") {
        if (!sub.plan) return { status: 400, message: "Choose a plan first" };
        sub.status = "active";
        sub.trialEndsAt = null;
        sub.startedAt = sub.startedAt || new Date();
        sub.cancelledAt = null;
      } else if (b.action === "cancel") {
        sub.status = "cancelled";
        sub.cancelledAt = new Date();
      } else if (b.action !== undefined) {
        return { status: 400, message: "Invalid action" };
      }
      // The plan's quotas become the client's (unless told not to).
      if (plan && b.applyLimits !== false) {
        tenant.limits.maxCompanies = plan.limits?.maxCompanies ?? null;
        tenant.limits.maxEmployees = plan.limits?.maxEmployees ?? null;
      }
      await tenant.save();
      return { tenant };
    });
    if (result.status) return res.status(result.status).json({ success: false, message: result.message });
    res.json({ success: true, data: result.tenant });
  } catch (error) {
    fail(res, error, "Error saving subscription");
  }
});

// The plan's one-time set-up fee as a DRAFT invoice (never twice).
// body: { discountPct? } — e.g. 50 for a launch client.
router.post("/subscriptions/:tenantId/setup-invoice", async (req, res) => {
  try {
    if (!isId(req.params.tenantId)) return res.status(400).json({ success: false, message: "Invalid client id" });
    const discount = num(req.body?.discountPct ?? 0, { max: 100 });
    if (discount === undefined) return res.status(400).json({ success: false, message: "Invalid discount" });
    const invoice = await billing.createSetupInvoice(req.params.tenantId, { discountPct: discount, actorId: req.user.id });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    fail(res, error, "Error creating the set-up invoice");
  }
});

// ---------------- invoices

router.get("/invoices", async (req, res) => {
  try {
    const filter = {};
    if (["draft", "issued", "paid", "cancelled"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.status === "overdue") Object.assign(filter, { status: "issued", type: "invoice", dueDate: { $lt: new Date() } });
    if (isId(req.query.tenant)) filter.tenant = req.query.tenant;
    const p = billing.parsePeriod(req.query.period);
    if (p) filter.periodFrom = { $gte: new Date(p.year, p.month - 1, 1), $lt: new Date(p.year, p.month, 1) };
    const [invoices, tenants] = await Promise.all([
      runAsSystem(() => PlatformInvoice.find(filter).sort({ createdAt: -1 }).limit(500).lean()),
      runAsSystem(() => Tenant.find().select("name").lean()),
    ]);
    const names = new Map(tenants.map((t) => [String(t._id), t.name]));
    const now = Date.now();
    res.json({
      success: true,
      data: invoices.map((i) => ({
        ...i,
        tenantName: names.get(String(i.tenant)) || "—",
        overdue: i.type === "invoice" && i.status === "issued" && i.dueDate && new Date(i.dueDate).getTime() < now,
      })),
    });
  } catch (error) {
    fail(res, error, "Error loading invoices");
  }
});

router.post("/invoices/generate", async (req, res) => {
  try {
    const result = await billing.generateForPeriod(req.body?.period, { actorId: req.user.id });
    if (req.body?.issue) {
      for (const c of result.created) {
        // eslint-disable-next-line no-await-in-loop
        await billing.issueInvoice(c._id);
      }
    }
    res.json({ success: true, data: result });
  } catch (error) {
    fail(res, error, "Error generating invoices");
  }
});

router.post("/invoices", async (req, res) => {
  try {
    if (!isId(req.body?.tenant)) return res.status(400).json({ success: false, message: "Choose a client" });
    const invoice = await billing.createManualInvoice({ tenantId: req.body.tenant, lines: req.body.lines, notes: req.body.notes, actorId: req.user.id });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    fail(res, error, "Error creating invoice");
  }
});

router.post("/invoices/:id/issue", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    res.json({ success: true, data: await billing.issueInvoice(req.params.id) });
  } catch (error) {
    fail(res, error, "Error issuing invoice");
  }
});

router.post("/invoices/:id/payments", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const { amount, date, method, reference } = req.body || {};
    if (method !== undefined && !["virement", "cheque", "effet", "especes", "carte", "autre"].includes(method)) {
      return res.status(400).json({ success: false, message: "Invalid method" });
    }
    const when = date ? new Date(date) : new Date();
    if (Number.isNaN(when.getTime())) return res.status(400).json({ success: false, message: "Invalid date" });
    res.json({ success: true, data: await billing.recordPayment(req.params.id, { amount, date: when, method, reference: reference ? String(reference).slice(0, 80) : undefined, actorId: req.user.id }) });
  } catch (error) {
    fail(res, error, "Error recording payment");
  }
});

router.post("/invoices/:id/credit-note", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    res.json({ success: true, data: await billing.creditNote(req.params.id, { reason: String(req.body?.reason || "").slice(0, 200), actorId: req.user.id }) });
  } catch (error) {
    fail(res, error, "Error creating credit note");
  }
});

router.delete("/invoices/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const r = await runAsSystem(async () => {
      const inv = await PlatformInvoice.findById(req.params.id).select("status").lean();
      if (!inv) return 404;
      if (inv.status !== "draft") return 409;
      await PlatformInvoice.deleteOne({ _id: req.params.id });
      return 200;
    });
    if (r === 404) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (r === 409) return res.status(409).json({ success: false, message: "Only a draft can be deleted — cancel an issued invoice with a credit note" });
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Error deleting invoice");
  }
});

router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const inv = await runAsSystem(() => PlatformInvoice.findById(req.params.id).lean());
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.number || "brouillon"}.pdf"`);
    const doc = billing.invoicePdf(inv);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    fail(res, error, "Error generating PDF");
  }
});

// Recompute every client's standing now (normally daily).
router.post("/refresh", async (req, res) => {
  try {
    res.json({ success: true, data: await billing.runDaily() });
  } catch (error) {
    fail(res, error, "Error refreshing standings");
  }
});

module.exports = router;
