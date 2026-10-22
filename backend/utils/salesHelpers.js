const mongoose = require("mongoose");

/** Shared bits for the sales routes (customers, quotes, invoices). */

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const VAT_RATES = [0, 7, 10, 14, 20];

/**
 * Cleans devis / commande / BL / invoice lines. Returns { lines } or { error }.
 * A line's product (if any) must be an article of the same company; a
 * unit that is one of the article's packagings sets unitFactor (base
 * units in one: "Carton" of 12 → 12).
 */
async function normalizeSalesLines(input, companyId, { allowEmpty = false } = {}) {
  if (!Array.isArray(input) || (input.length === 0 && !allowEmpty)) return { error: "Add at least one line" };
  const Product = require("../models/Product");
  const lines = [];
  for (const [i, raw] of input.entries()) {
    const n = i + 1;
    const quantity = Number(raw?.quantity);
    const unitPrice = Number(raw?.unitPrice);
    const discount = raw?.discount === undefined || raw?.discount === "" ? 0 : Number(raw.discount);
    let vatRate = raw?.vatRate === undefined || raw?.vatRate === "" ? null : Number(raw.vatRate);
    if (!(quantity > 0)) return { error: `Line ${n}: the quantity must be positive` };
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: `Line ${n}: invalid unit price` };
    if (!(discount >= 0 && discount <= 100)) return { error: `Line ${n}: the discount must be between 0 and 100%` };
    let product = null;
    let doc = null;
    if (raw?.product) {
      const pid = raw.product?._id || raw.product;
      if (!isId(pid)) return { error: `Line ${n}: article not found in this company` };
      doc = await Product.findOne({ _id: pid, company: companyId }).select("name internalReference unit packagings vatRate isVariantParent").lean();
      if (!doc) return { error: `Line ${n}: article not found in this company` };
      if (doc.isVariantParent) return { error: `Line ${n}: "${doc.name}" has variants — choose one` };
      product = doc._id;
    }
    if (vatRate === null) vatRate = doc?.vatRate ?? 20;
    if (!VAT_RATES.includes(vatRate)) return { error: `Line ${n}: VAT must be one of ${VAT_RATES.join(", ")}%` };
    const description = String(raw?.description || doc?.name || "").trim();
    if (!description) return { error: `Line ${n}: enter a description` };
    const unit = String(raw?.unit || doc?.unit || "").trim().slice(0, 30);
    let unitFactor = 1;
    if (doc && unit && unit !== doc.unit) {
      const pack = (doc.packagings || []).find((p) => p.unit === unit);
      if (!pack) return { error: `Line ${n}: "${unit}" is not a unit of "${doc.name}"` };
      unitFactor = pack.factor;
    }
    const lots = Array.isArray(raw?.lots) ? raw.lots.filter((l) => l && l.number).map((l) => ({ number: String(l.number).trim(), quantity: Number(l.quantity), expiryDate: l.expiryDate || null })) : [];
    lines.push({
      ...(raw?._id && isId(raw._id) ? { _id: raw._id } : {}),
      product,
      reference: String(raw?.reference || doc?.internalReference || "").trim().slice(0, 60),
      description,
      quantity,
      unit,
      unitFactor,
      unitPrice,
      discount,
      vatRate,
      ...(lots.length ? { lots } : {}),
      ...(raw?.promotion && isId(raw.promotion?._id || raw.promotion) ? { promotion: raw.promotion?._id || raw.promotion } : {}),
      ...(raw?.free === true ? { free: true } : {}),
    });
  }
  return { lines };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + (Number(days) || 0));
  return d;
}

function validationMessage(error, fallback) {
  if (error?.name === "ValidationError") return Object.values(error.errors)[0].message;
  return error?.message || fallback;
}

module.exports = { isId, bad, VAT_RATES, normalizeSalesLines, addDays, validationMessage };
