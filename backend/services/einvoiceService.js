const crypto = require("crypto");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const SalesSettings = require("../models/SalesSettings");
const { buildUbl, validateForEInvoice } = require("../utils/ublInvoice");

/**
 * ============================================================
 * E-INVOICING — clearance with the DGI platform
 * ============================================================
 * submit(invoiceId) → legal checks → UBL XML → provider → status on the
 * invoice (einvoice.status / reference / qr). Providers:
 *
 *   simulation  validates and "accepts" locally with a SIM- reference.
 *               For demos, training and until the company is enrolled.
 *   http        POSTs the XML to EINVOICE_API_URL (the DGI platform, or
 *               a certified intermediary / PDP) with EINVOICE_API_KEY.
 *               Expected JSON answer: { status: "accepted"|"rejected"|
 *               "pending", reference, qr, message }. Adapt mapAnswer()
 *               to the official contract when the DGI publishes it.
 *
 * A pending answer is polled later with refresh(invoiceId) (GET
 * EINVOICE_API_URL/{reference}).
 * ============================================================
 */

async function loadAll(invoiceId) {
  const invoice = await SalesInvoice.findById(invoiceId);
  if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
  const [customer, company, settings, credited] = await Promise.all([
    Customer.findById(invoice.customer).lean(),
    Company.findById(invoice.company).lean(),
    SalesSettings.findOne({ company: invoice.company }).lean(),
    invoice.creditedInvoice ? SalesInvoice.findById(invoice.creditedInvoice).select("number date").lean() : null,
  ]);
  return { invoice, customer, company, settings, credited };
}

/** The XML that is (or would be) sent, with the legal check. */
async function preview(invoiceId) {
  const { invoice, customer, company, credited } = await loadAll(invoiceId);
  const check = validateForEInvoice(invoice, company, customer);
  const xml = invoice.number ? buildUbl(invoice.toObject(), company, customer, { credited }) : null;
  return { check, xml, number: invoice.number };
}

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

function mapAnswer(body) {
  const status = ["accepted", "rejected", "pending"].includes(body?.status) ? body.status : "error";
  return { status, reference: body?.reference || body?.id || null, qr: body?.qr || body?.qrCode || null, message: body?.message || null };
}

const PROVIDERS = {
  async simulation({ hash, invoice }) {
    const ref = `SIM-${new Date(invoice.date).getFullYear()}-${hash.slice(0, 12).toUpperCase()}`;
    return { status: "accepted", reference: ref, qr: `https://einvoice.simulation.local/verify/${ref}`, message: "Validée (simulation — aucune transmission réelle)" };
  },
  async http({ xml }) {
    const url = process.env.EINVOICE_API_URL;
    if (!url) throw Object.assign(new Error("EINVOICE_API_URL is not configured"), { status: 503 });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/xml", Accept: "application/json", Authorization: `Bearer ${process.env.EINVOICE_API_KEY || ""}` },
      body: xml,
      signal: AbortSignal.timeout(30000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok && res.status >= 500) return { status: "error", message: body?.message || `Plateforme indisponible (HTTP ${res.status})` };
    return mapAnswer(res.ok ? body : { ...body, status: "rejected" });
  },
};

async function submit(invoiceId, { force = false } = {}) {
  const { invoice, customer, company, settings, credited } = await loadAll(invoiceId);
  if (!invoice.number || invoice.status === "draft" || invoice.status === "cancelled") {
    throw Object.assign(new Error("Only an issued invoice can be submitted"), { status: 400 });
  }
  if (invoice.einvoice?.status === "accepted" && !force) {
    throw Object.assign(new Error("This invoice is already accepted by the platform"), { status: 400 });
  }
  const check = validateForEInvoice(invoice, company, customer);
  if (!check.ok) throw Object.assign(new Error(check.errors.join(" ")), { status: 400, check });
  const xml = buildUbl(invoice.toObject(), company, customer, { credited });
  const hash = sha256(xml);
  const providerName = settings?.einvoicing?.provider || "simulation";
  const provider = PROVIDERS[providerName] || PROVIDERS.simulation;
  let answer;
  try {
    answer = await provider({ xml, hash, invoice });
  } catch (err) {
    if (err.status === 503) throw err;
    answer = { status: "error", message: err.message };
  }
  invoice.einvoice = {
    ...(invoice.einvoice?.toObject?.() || invoice.einvoice || {}),
    status: answer.status,
    provider: providerName,
    reference: answer.reference || invoice.einvoice?.reference || null,
    qr: answer.qr || invoice.einvoice?.qr || null,
    xmlHash: hash,
    submittedAt: new Date(),
    answeredAt: answer.status === "pending" ? null : new Date(),
    message: answer.message || null,
    attempts: (invoice.einvoice?.attempts || 0) + 1,
  };
  await invoice.save();
  return { einvoice: invoice.einvoice, warnings: check.warnings };
}

/** Ask the platform again for a pending invoice. */
async function refresh(invoiceId) {
  const invoice = await SalesInvoice.findById(invoiceId);
  if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
  if (invoice.einvoice?.status !== "pending" || invoice.einvoice.provider !== "http" || !invoice.einvoice.reference) return invoice.einvoice;
  const res = await fetch(`${process.env.EINVOICE_API_URL}/${encodeURIComponent(invoice.einvoice.reference)}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${process.env.EINVOICE_API_KEY || ""}` },
    signal: AbortSignal.timeout(20000),
  });
  const a = mapAnswer(await res.json().catch(() => ({})));
  if (a.status !== "error") {
    invoice.einvoice.status = a.status;
    if (a.qr) invoice.einvoice.qr = a.qr;
    if (a.message) invoice.einvoice.message = a.message;
    if (a.status !== "pending") invoice.einvoice.answeredAt = new Date();
    await invoice.save();
  }
  return invoice.einvoice;
}

/** Called after an invoice is issued: submits it when the company enabled auto-submit. Never throws. */
async function afterIssue(invoice) {
  try {
    const settings = await SalesSettings.findOne({ company: invoice.company }).select("einvoicing").lean();
    if (settings?.einvoicing?.enabled && settings.einvoicing.autoSubmit) return await submit(invoice._id);
  } catch (err) {
    console.error("E-invoice auto-submit failed:", err.message);
  }
  return null;
}

module.exports = { submit, refresh, preview, afterIssue, sha256, PROVIDERS };
