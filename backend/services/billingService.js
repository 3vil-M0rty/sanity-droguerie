const PDFDocument = require("pdfkit");
const tenantScope = require("./tenantScope");
const { amountToFrenchWords } = require("./frenchNumberWords");

/**
 * ============================================================
 * BILLING THE PLATFORM'S CLIENTS
 * ============================================================
 *  - Plans (models/Plan.js) and each client's subscription
 *    (Tenant.subscription: plan, monthly / yearly, negotiated price,
 *    discount, trial).
 *  - generateForPeriod("2026-11"): one DRAFT invoice per client due
 *    that month (monthly plans every month, yearly plans in their
 *    anniversary month; nothing while the trial runs). Idempotent.
 *  - issueInvoice: number SAN-2026-0001 (no gaps: drafts have none),
 *    due date, seller/buyer frozen, e-mailed with its PDF.
 *  - recordPayment: paid when the total is covered; an account
 *    suspended for non-payment reopens at once.
 *  - creditNote: an issued, unpaid invoice is cancelled by a credit
 *    note (an issued invoice is never deleted).
 *  - refreshStanding / runDaily: overdue → subscription "past_due";
 *    with autoSuspend, the account is suspended `graceDays` after the
 *    due date (reason "unpaid", never confused with a manual
 *    suspension).
 * Every function runs as system: the platform's own data.
 * ============================================================
 */

const DAY = 86400000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const sys = (fn) => tenantScope.runAsSystem(fn);
const models = () => ({
  Tenant: require("../models/Tenant"),
  Plan: require("../models/Plan"),
  PlatformInvoice: require("../models/PlatformInvoice"),
  PlatformSettings: require("../models/PlatformSettings"),
});

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Next number of the year for a prefix: SAN-2026-0001 (invoices), SAN-AV-2026-0001 (credit notes). */
async function nextPlatformNumber(prefix, when) {
  const { PlatformInvoice } = models();
  const year = new Date(when).getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const last = await PlatformInvoice.findOne({ number: { $regex: pattern } }).sort({ number: -1 }).select("number").lean();
  const next = last ? Number(last.number.match(pattern)[1]) + 1 : 1;
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}

async function getSettings() {
  const { PlatformSettings } = models();
  return sys(async () => (await PlatformSettings.findOne({ key: "billing" })) || PlatformSettings.create({ key: "billing" }));
}

function parsePeriod(period) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(period || ""));
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/** The billed period starting in `year`/`month` for a cycle. */
function periodOf(cycle, year, month) {
  const from = new Date(year, month - 1, 1);
  const to = cycle === "yearly" ? new Date(year + 1, month - 1, 0, 23, 59, 59, 999) : new Date(year, month, 0, 23, 59, 59, 999);
  return { from, to };
}

/** Price HT of one cycle for a client: negotiated price, else the plan's; minus the discount. */
function cyclePriceHT(subscription, plan) {
  if (!plan) return 0;
  const yearly = subscription.cycle === "yearly";
  const base = subscription.priceHT ?? (yearly ? plan.yearlyPriceHT ?? plan.monthlyPriceHT * 12 : plan.monthlyPriceHT);
  return round2(base * (1 - (subscription.discountPct || 0) / 100));
}

function totals(lines, vatRate) {
  const totalHT = round2(lines.reduce((t, l) => t + l.totalHT, 0));
  const vatAmount = round2((totalHT * vatRate) / 100);
  return { totalHT, vatRate, vatAmount, totalTTC: round2(totalHT + vatAmount) };
}

function cleanLines(lines = []) {
  return lines
    .map((l) => ({
      label: String(l.label || "").trim().slice(0, 200),
      quantity: round2(l.quantity ?? 1),
      unitPriceHT: round2(l.unitPriceHT),
    }))
    .filter((l) => l.label && l.quantity > 0)
    .map((l) => ({ ...l, totalHT: round2(l.quantity * l.unitPriceHT) }));
}

/** Is this client billed for the period starting year/month? */
function isDue(tenant, year, month) {
  const sub = tenant.subscription || {};
  if (!sub.plan || ["none", "cancelled"].includes(sub.status)) return false;
  const { from, to } = periodOf(sub.cycle, year, month);
  if (sub.startedAt && new Date(sub.startedAt) > to) return false;
  if (sub.trialEndsAt && new Date(sub.trialEndsAt) > to) return false;
  if (sub.cycle === "yearly") {
    const start = sub.startedAt ? new Date(sub.startedAt) : null;
    if (!start || start.getMonth() !== month - 1) return false;
  }
  return from <= to;
}

function buyerOf(tenant) {
  const b = tenant.subscription?.billing || {};
  return {
    legalName: b.legalName || tenant.name,
    address: b.address || "",
    city: b.city || "",
    ice: b.ice || "",
    taxId: b.taxId || "",
    rc: b.rc || "",
    email: tenant.subscription?.billingEmail || "",
  };
}

/**
 * Draft subscription invoices for the period ("YYYY-MM"). Skips a client
 * that already has its (non-cancelled) invoice for that period.
 */
async function generateForPeriod(period, { actorId = null, now = new Date() } = {}) {
  const p = parsePeriod(period);
  if (!p) throw Object.assign(new Error("Invalid period (YYYY-MM)"), { status: 400 });
  const { Tenant, Plan, PlatformInvoice } = models();
  const settings = await getSettings();
  return sys(async () => {
    const tenants = await Tenant.find({ "subscription.plan": { $ne: null } }).lean();
    const plans = new Map((await Plan.find().lean()).map((pl) => [String(pl._id), pl]));
    const created = [];
    const skipped = [];
    for (const tenant of tenants) {
      if (!isDue(tenant, p.year, p.month)) continue;
      const sub = tenant.subscription;
      const plan = plans.get(String(sub.plan));
      const { from, to } = periodOf(sub.cycle, p.year, p.month);
      // eslint-disable-next-line no-await-in-loop
      const existing = await PlatformInvoice.findOne({ tenant: tenant._id, periodFrom: from, source: "subscription", type: "invoice", status: { $ne: "cancelled" } }).select("_id number").lean();
      if (existing) {
        skipped.push({ tenant: tenant.name, reason: "exists" });
        continue;
      }
      const price = cyclePriceHT(sub, plan);
      const label = sub.cycle === "yearly"
        ? `Abonnement Sanity ${plan?.name || ""} — annuel, du ${from.toLocaleDateString("fr-MA")} au ${to.toLocaleDateString("fr-MA")}`
        : `Abonnement Sanity ${plan?.name || ""} — ${MONTHS_FR[p.month - 1]} ${p.year}`;
      const lines = cleanLines([{ label: label.replace(/\s+/g, " "), quantity: 1, unitPriceHT: price }]);
      // eslint-disable-next-line no-await-in-loop
      const invoice = await PlatformInvoice.create({
        tenant: tenant._id,
        source: "subscription",
        periodFrom: from,
        periodTo: to,
        lines,
        ...totals(lines, settings.vatRate),
        buyer: buyerOf(tenant),
        createdBy: actorId,
        notes: sub.discountPct ? `Remise accordée : ${sub.discountPct} %` : undefined,
      });
      created.push({ _id: invoice._id, tenant: tenant.name, totalTTC: invoice.totalTTC });
    }
    return { period, created, skipped, now };
  });
}

/** A manual invoice (set-up, training, data migration…), as a draft. */
async function createManualInvoice({ tenantId, lines, notes, actorId }) {
  const { Tenant, PlatformInvoice } = models();
  const settings = await getSettings();
  return sys(async () => {
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) throw Object.assign(new Error("Client not found"), { status: 404 });
    const clean = cleanLines(lines);
    if (!clean.length) throw Object.assign(new Error("At least one line is required"), { status: 400 });
    return PlatformInvoice.create({
      tenant: tenant._id, source: "manual", lines: clean, ...totals(clean, settings.vatRate),
      buyer: buyerOf(tenant), notes, createdBy: actorId,
    });
  });
}

/** Creates the default plans / options / price-list texts that are missing. */
async function loadDefaultCatalog() {
  const { Plan, PlatformSettings } = models();
  const { PLANS: SANITY_PLANS, DROGUERIE_PLANS, ADDONS, PRICE_LIST } = require("../config/defaultCatalog");
  const PLANS = [...SANITY_PLANS, ...DROGUERIE_PLANS];
  const settings = await getSettings();
  return sys(async () => {
    const created = [];
    const kept = [];
    for (const p of PLANS) {
      // eslint-disable-next-line no-await-in-loop
      if (await Plan.exists({ code: p.code })) {
        kept.push(p.code);
        // Plans created before storage quotas existed get the catalogue's quota.
        // eslint-disable-next-line no-await-in-loop
        if (p.storageQuotaMB != null) await Plan.updateOne({ code: p.code, storageQuotaMB: null }, { $set: { storageQuotaMB: p.storageQuotaMB } });
      }
      else {
        // eslint-disable-next-line no-await-in-loop
        await Plan.create(p);
        created.push(p.code);
      }
    }
    const set = {};
    if (!settings.addons?.length) set.addons = ADDONS;
    if (!settings.priceList?.tagline) set["priceList.tagline"] = PRICE_LIST.tagline;
    if (!settings.priceList?.terms) set["priceList.terms"] = PRICE_LIST.terms;
    if (Object.keys(set).length) await PlatformSettings.updateOne({ key: "billing" }, { $set: set });
    return { created, kept, addons: set.addons ? ADDONS.length : 0 };
  });
}

/** Draft invoice for the plan's set-up fee; one per client unless the previous one was cancelled. */
async function createSetupInvoice(tenantId, { discountPct = 0, actorId } = {}) {
  const { Tenant, Plan, PlatformInvoice } = models();
  const settings = await getSettings();
  return sys(async () => {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw Object.assign(new Error("Client not found"), { status: 404 });
    const sub = tenant.subscription;
    if (!sub?.plan) throw Object.assign(new Error("Choose a plan first"), { status: 400 });
    if (sub.setupInvoice) {
      const prev = await PlatformInvoice.findById(sub.setupInvoice).select("status number").lean();
      if (prev && prev.status !== "cancelled") throw Object.assign(new Error(`The set-up fee is already invoiced${prev.number ? ` (${prev.number})` : " (draft)"}`), { status: 409 });
    }
    const plan = await Plan.findById(sub.plan).lean();
    if (!plan?.setupFeeHT) throw Object.assign(new Error("This plan has no set-up fee"), { status: 400 });
    const lines = cleanLines([{ label: `Mise en service Sanity ${plan.name} : import des données, paramétrage, formation`, quantity: 1, unitPriceHT: plan.setupFeeHT }]);
    if (discountPct > 0) lines.push(...cleanLines([{ label: `Remise de lancement (${discountPct} %)`, quantity: 1, unitPriceHT: -round2((plan.setupFeeHT * discountPct) / 100) }]));
    const invoice = await PlatformInvoice.create({
      tenant: tenant._id, source: "manual", lines, ...totals(lines, settings.vatRate), buyer: buyerOf(tenant.toObject()), createdBy: actorId,
    });
    sub.setupInvoice = invoice._id;
    await tenant.save();
    return invoice;
  });
}

async function issueInvoice(invoiceId, { now = new Date(), send = true } = {}) {
  const { Tenant, PlatformInvoice } = models();
  const settings = await getSettings();
  const issued = await sys(async () => {
    const invoice = await PlatformInvoice.findById(invoiceId);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.status !== "draft") throw Object.assign(new Error("Only a draft can be issued"), { status: 409 });
    const s = settings.seller || {};
    if (!s.legalName || !s.ice) {
      throw Object.assign(new Error("Fill in your company's legal name and ICE (Billing → Settings) before issuing invoices"), { status: 400 });
    }
    const tenant = await Tenant.findById(invoice.tenant).lean();
    invoice.issueDate = now;
    invoice.dueDate = new Date(now.getTime() + (settings.paymentTermsDays || 0) * DAY);
    invoice.seller = settings.seller.toObject ? settings.seller.toObject() : settings.seller;
    if (tenant) invoice.buyer = buyerOf(tenant);
    invoice.status = "issued";
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      invoice.number = await nextPlatformNumber(invoice.type === "credit_note" ? `${settings.invoicePrefix}-AV` : settings.invoicePrefix, now);
      try {
        // eslint-disable-next-line no-await-in-loop
        await invoice.save();
        return invoice;
      } catch (error) {
        if (error.code !== 11000 || i === 4) throw error;
      }
    }
    return invoice;
  });
  if (send && settings.emailInvoices) await emailInvoice(issued, settings).catch(() => {});
  return issued;
}

async function emailInvoice(invoice, settings) {
  const to = invoice.buyer?.email;
  if (!to) return null;
  const { sendMail, pdfToBuffer, isConfigured } = require("./mailService");
  if (!isConfigured()) return null;
  const pdf = await pdfToBuffer(invoicePdf(invoice));
  await sys(() => sendMail({
    to,
    subject: `${invoice.type === "credit_note" ? "Avoir" : "Facture"} ${invoice.number} — ${settings.seller?.legalName || "Sanity"}`,
    text: [
      "Bonjour,",
      "",
      `Veuillez trouver ci-joint ${invoice.type === "credit_note" ? "l'avoir" : "la facture"} ${invoice.number} d'un montant de ${invoice.totalTTC.toFixed(2)} MAD TTC${invoice.dueDate && invoice.type === "invoice" ? `, à régler avant le ${new Date(invoice.dueDate).toLocaleDateString("fr-MA")}` : ""}.`,
      settings.seller?.rib ? `RIB : ${settings.seller.rib}${settings.seller.bankName ? ` (${settings.seller.bankName})` : ""}` : "",
      "",
      "Cordialement,",
      settings.seller?.legalName || "",
    ].join("\n"),
    attachments: [{ filename: `${invoice.number}.pdf`, content: pdf }],
  }));
  await sys(() => models().PlatformInvoice.updateOne({ _id: invoice._id }, { $set: { emailedAt: new Date() } }));
  return true;
}

async function recordPayment(invoiceId, { amount, date = new Date(), method = "virement", reference, actorId }) {
  const { PlatformInvoice } = models();
  const value = round2(amount);
  if (!(value > 0)) throw Object.assign(new Error("A positive amount is required"), { status: 400 });
  const invoice = await sys(async () => {
    const inv = await PlatformInvoice.findById(invoiceId);
    if (!inv) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (inv.type !== "invoice" || !["issued", "paid"].includes(inv.status)) {
      throw Object.assign(new Error("Payments go on issued invoices"), { status: 409 });
    }
    const remaining = round2(inv.totalTTC - inv.paidAmount);
    if (value > remaining + 0.005) throw Object.assign(new Error(`The payment exceeds what is left to pay (${remaining.toFixed(2)})`), { status: 400 });
    inv.payments.push({ date: new Date(date), amount: value, method, reference, recordedBy: actorId });
    inv.paidAmount = round2(inv.paidAmount + value);
    if (inv.paidAmount >= inv.totalTTC - 0.005) {
      inv.status = "paid";
      inv.paidAt = new Date(date);
    }
    await inv.save();
    return inv;
  });
  await refreshStanding(invoice.tenant);
  return invoice;
}

/** Cancels an issued, unpaid invoice with a credit note (avoir). */
async function creditNote(invoiceId, { reason = "", actorId, now = new Date() } = {}) {
  const { PlatformInvoice } = models();
  const original = await sys(() => PlatformInvoice.findById(invoiceId));
  if (!original) throw Object.assign(new Error("Invoice not found"), { status: 404 });
  if (original.type !== "invoice" || original.status !== "issued") throw Object.assign(new Error("Only an issued, unpaid invoice can be cancelled"), { status: 409 });
  if (original.paidAmount > 0) throw Object.assign(new Error("This invoice has payments: record a refund instead"), { status: 409 });
  const lines = original.lines.map((l) => ({ label: l.label, quantity: l.quantity, unitPriceHT: -l.unitPriceHT, totalHT: -l.totalHT }));
  const note = await sys(() => PlatformInvoice.create({
    tenant: original.tenant, type: "credit_note", source: original.source, lines,
    totalHT: -original.totalHT, vatRate: original.vatRate, vatAmount: -original.vatAmount, totalTTC: -original.totalTTC,
    periodFrom: original.periodFrom, periodTo: original.periodTo, buyer: original.buyer, creditFor: original._id,
    notes: `Avoir sur la facture ${original.number}${reason ? ` — ${reason}` : ""}`, createdBy: actorId,
  }));
  const issuedNote = await issueInvoice(note._id, { now });
  await sys(() => PlatformInvoice.updateOne({ _id: original._id }, { $set: { status: "cancelled" } }));
  await refreshStanding(original.tenant);
  return issuedNote;
}

/**
 * Re-computes a client's standing from its invoices: overdue →
 * past_due (and suspended for non-payment after the grace period when
 * autoSuspend is on); nothing overdue → active again, and an account
 * suspended for non-payment is reopened. Ends a finished trial.
 */
async function refreshStanding(tenantId, { now = new Date() } = {}) {
  const { Tenant, PlatformInvoice } = models();
  const settings = await getSettings();
  return sys(async () => {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return null;
    const sub = tenant.subscription;
    const overdue = await PlatformInvoice.find({ tenant: tenant._id, type: "invoice", status: "issued", dueDate: { $lt: now } }).select("dueDate number totalTTC paidAmount").sort({ dueDate: 1 }).lean();
    const changes = [];
    if (sub?.status === "trial" && sub.trialEndsAt && new Date(sub.trialEndsAt) <= now) {
      sub.status = "active";
      changes.push("trial_ended");
    }
    if (overdue.length) {
      const oldest = new Date(overdue[0].dueDate);
      if (settings.autoSuspend && now.getTime() - oldest.getTime() > (settings.graceDays || 0) * DAY && tenant.status === "active") {
        tenant.status = "suspended";
        tenant.suspendedReason = "unpaid";
        sub.status = "suspended";
        changes.push("suspended_unpaid");
      } else if (["active", "trial"].includes(sub?.status)) {
        sub.status = "past_due";
        changes.push("past_due");
      }
    } else {
      if (tenant.status === "suspended" && tenant.suspendedReason === "unpaid") {
        tenant.status = "active";
        tenant.suspendedReason = null;
        changes.push("reactivated");
      }
      if (["past_due", "suspended"].includes(sub?.status) && tenant.status === "active") {
        sub.status = "active";
        changes.push("active");
      }
    }
    if (changes.length) await tenant.save();
    return { tenant: tenant.name, status: tenant.status, subscription: sub?.status, overdue: overdue.length, changes };
  });
}

async function runDaily(now = new Date()) {
  const { Tenant } = models();
  const tenants = await sys(() => Tenant.find({ "subscription.status": { $nin: ["none", "cancelled"] } }).select("_id").lean());
  const results = [];
  for (const t of tenants) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await refreshStanding(t._id, { now }));
  }
  return results.filter((r) => r && r.changes.length);
}

/** Balance and overdue amount per client (platform dashboard). */
async function standingByTenant(now = new Date()) {
  const { PlatformInvoice } = models();
  const open = await sys(() => PlatformInvoice.find({ type: "invoice", status: "issued" }).select("tenant totalTTC paidAmount dueDate").lean());
  const map = new Map();
  for (const inv of open) {
    const k = String(inv.tenant);
    const row = map.get(k) || { due: 0, overdue: 0 };
    const left = round2(inv.totalTTC - inv.paidAmount);
    row.due = round2(row.due + left);
    if (inv.dueDate && new Date(inv.dueDate) < now) row.overdue = round2(row.overdue + left);
    map.set(k, row);
  }
  return map;
}

// ---------------- PDF

const fmt = (n) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ | /g, " ");
const date = (d) => (d ? new Date(d).toLocaleDateString("fr-MA") : "—");

function invoicePdf(invoice) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const s = invoice.seller || {};
  const b = invoice.buyer || {};
  const W = doc.page.width - 80;
  const isCredit = invoice.type === "credit_note";

  doc.font("Helvetica-Bold").fontSize(15).fillColor("#0f766e").text(s.legalName || "—", 40, 40);
  doc.font("Helvetica").fontSize(8.5).fillColor("#333");
  doc.text([s.legalForm && s.capital ? `${s.legalForm} au capital de ${s.capital}` : s.legalForm, s.address, s.city].filter(Boolean).join(" — "));
  doc.text([s.email, s.phone].filter(Boolean).join(" · "));

  doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(isCredit ? "FACTURE D'AVOIR" : "FACTURE", 40, 40, { width: W, align: "right" });
  doc.font("Helvetica").fontSize(9.5).text(`N° ${invoice.number || "BROUILLON"}`, { width: W, align: "right" });
  doc.text(`Date : ${date(invoice.issueDate || invoice.createdAt)}`, { width: W, align: "right" });
  if (!isCredit && invoice.dueDate) doc.text(`Échéance : ${date(invoice.dueDate)}`, { width: W, align: "right" });

  const boxY = 120;
  doc.roundedRect(W / 2 + 40, boxY, W / 2, 86, 6).stroke("#ccc");
  doc.font("Helvetica-Bold").fontSize(9).text("Client", W / 2 + 52, boxY + 8);
  doc.font("Helvetica").fontSize(9).text(b.legalName || "—", W / 2 + 52, boxY + 22, { width: W / 2 - 24 });
  doc.fontSize(8.5).text([b.address, b.city].filter(Boolean).join(", ") || " ", { width: W / 2 - 24 });
  doc.text(`ICE : ${b.ice || "—"}${b.taxId ? `   IF : ${b.taxId}` : ""}${b.rc ? `   RC : ${b.rc}` : ""}`, { width: W / 2 - 24 });

  if (invoice.periodFrom) {
    doc.fontSize(9).text(`Période : du ${date(invoice.periodFrom)} au ${date(invoice.periodTo)}`, 40, boxY + 8, { width: W / 2 - 10 });
  }

  let y = boxY + 106;
  const cols = [40, 40 + W * 0.55, 40 + W * 0.67, 40 + W * 0.83];
  doc.rect(40, y, W, 20).fill("#0f766e");
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(8.5);
  doc.text("Désignation", cols[0] + 6, y + 6);
  doc.text("Qté", cols[1], y + 6, { width: W * 0.12 - 6, align: "right" });
  doc.text("P.U. HT", cols[2], y + 6, { width: W * 0.16 - 6, align: "right" });
  doc.text("Total HT", cols[3], y + 6, { width: W * 0.17 - 6, align: "right" });
  doc.fillColor("#111").font("Helvetica").fontSize(9);
  y += 26;
  for (const l of invoice.lines || []) {
    const h = Math.max(doc.heightOfString(l.label, { width: W * 0.55 - 12 }), 12);
    doc.text(l.label, cols[0] + 6, y, { width: W * 0.55 - 12 });
    doc.text(fmt(l.quantity), cols[1], y, { width: W * 0.12 - 6, align: "right" });
    doc.text(fmt(l.unitPriceHT), cols[2], y, { width: W * 0.16 - 6, align: "right" });
    doc.text(fmt(l.totalHT), cols[3], y, { width: W * 0.17 - 6, align: "right" });
    y += h + 8;
    doc.moveTo(40, y - 4).lineTo(40 + W, y - 4).stroke("#e5e7eb");
  }

  y += 8;
  const tx = 40 + W * 0.55;
  const row = (label, value, bold) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10.5 : 9.5);
    doc.text(label, tx, y, { width: W * 0.28 });
    doc.text(`${fmt(value)} MAD`, tx + W * 0.28, y, { width: W * 0.17 - 6, align: "right" });
    y += bold ? 18 : 15;
  };
  row("Total HT", invoice.totalHT);
  row(`TVA ${invoice.vatRate} %`, invoice.vatAmount);
  row(isCredit ? "Total TTC (avoir)" : "Total TTC", invoice.totalTTC, true);
  if (!isCredit && invoice.paidAmount > 0) {
    row("Déjà réglé", invoice.paidAmount);
    row("Reste à payer", round2(invoice.totalTTC - invoice.paidAmount), true);
  }

  y += 10;
  doc.font("Helvetica-Oblique").fontSize(9).text(
    `Arrêtée la présente ${isCredit ? "facture d'avoir" : "facture"} à la somme de : ${amountToFrenchWords(Math.abs(invoice.totalTTC))} TTC.`,
    40, y, { width: W }
  );
  if (invoice.notes) doc.font("Helvetica").fontSize(8.5).text(invoice.notes, { width: W });
  if (!isCredit && s.rib) {
    doc.moveDown(0.6).font("Helvetica-Bold").fontSize(9).text("Règlement par virement :", { width: W });
    doc.font("Helvetica").text(`${s.bankName ? `${s.bankName} — ` : ""}RIB ${s.rib}`, { width: W });
  }

  // Footer inside the bottom margin: no automatic second page.
  doc.page.margins.bottom = 0;
  const fy = doc.page.height - 60;
  doc.font("Helvetica").fontSize(7.5).fillColor("#555").text(
    [s.legalName, s.ice && `ICE ${s.ice}`, s.taxId && `IF ${s.taxId}`, s.rc && `RC ${s.rc}`, s.patente && `Patente ${s.patente}`, s.cnss && `CNSS ${s.cnss}`].filter(Boolean).join(" — "),
    40, fy, { width: W, align: "center" }
  );
  if (!isCredit) {
    doc.text("En cas de retard de paiement, l'accès au service peut être suspendu après mise en demeure, conformément aux conditions générales.", 40, fy + 12, { width: W, align: "center" });
  }
  return doc;
}

module.exports = {
  getSettings, parsePeriod, periodOf, cyclePriceHT, totals, cleanLines, isDue, buyerOf,
  generateForPeriod, createManualInvoice, loadDefaultCatalog, createSetupInvoice, issueInvoice, recordPayment, creditNote,
  refreshStanding, runDaily, standingByTenant, invoicePdf, emailInvoice, round2,
};
