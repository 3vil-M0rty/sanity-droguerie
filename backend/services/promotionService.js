const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");
const RebateAgreement = require("../models/RebateAgreement");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const { createWithNumber } = require("./documentNumberService");
const { round2 } = require("./salesCalc");

/**
 * ============================================================
 * PROMOTIONS & REMISES DE FIN D'ANNÉE
 * ============================================================
 * Promotions are read once per pricing call (active today) and passed
 * to pricingService.quoteLine, which picks the best one for the line.
 * "10 + 1" promotions add a free line (freeLines). Rebates: progress of
 * each customer through the tiers, settled as draft credit notes.
 * ============================================================
 */
const ids = (arr) => (arr || []).map((x) => String(x?._id || x));

async function activeFor(companyId, date = new Date()) {
  return Promotion.find({ company: companyId, active: true, startDate: { $lte: date }, endDate: { $gte: date } }).lean();
}

function matches(promo, product, customer, channel, level) {
  if (channel && !(promo.channels || ["sales", "pos"]).includes(channel)) return false;
  const p = ids(promo.products);
  const c = ids(promo.categories);
  const b = ids(promo.brands);
  if (p.length || c.length || b.length) {
    const hit = p.includes(String(product._id)) || (product.category && c.includes(String(product.category?._id || product.category))) || (product.brand && b.includes(String(product.brand?._id || product.brand)));
    if (!hit) return false;
  }
  if ((promo.customers || []).length && !(customer && ids(promo.customers).includes(String(customer._id)))) return false;
  if ((promo.customerTypes || []).length && !(customer && promo.customerTypes.includes(customer.type))) return false;
  if ((promo.priceLevels || []).length && !promo.priceLevels.includes(level)) return false;
  return true;
}

/**
 * Best price promotion for a line. `base` = { unitPrice (per unit), discount, factor }.
 * Returns { unitPrice, discount, promotion } or null when nothing beats the normal price.
 */
function bestPrice(promos, product, customer, { level, channel, baseQuantity = 0, unitPrice, discount, factor = 1 }) {
  const normalNet = unitPrice * (1 - discount / 100);
  let best = null;
  for (const promo of promos) {
    if (promo.type === "free_goods" || !matches(promo, product, customer, channel, level)) continue;
    if (promo.minQuantity && baseQuantity < promo.minQuantity) continue;
    let cand;
    if (promo.type === "percent") {
      const d = promo.stackable ? 100 - (100 - discount) * (100 - promo.value) / 100 : Math.max(discount, promo.value);
      cand = { unitPrice, discount: round2(d) };
    } else {
      cand = { unitPrice: round2(promo.value * factor), discount: 0 };
    }
    const net = cand.unitPrice * (1 - cand.discount / 100);
    if (net + 1e-9 < (best ? best.net : normalNet)) best = { ...cand, net, promotion: { _id: promo._id, name: promo.name, type: promo.type, value: promo.value, endDate: promo.endDate } };
  }
  return best;
}

/** "10 + 1" promotions reached by these paid lines → free lines to add. */
function freeLines(promos, lines, productsById, customer, { level, channel }) {
  const out = [];
  const qtyByProduct = new Map();
  for (const l of lines) {
    if (!l.product || l.free) continue;
    const k = String(l.product);
    qtyByProduct.set(k, (qtyByProduct.get(k) || 0) + (Number(l.quantity) || 0) * (Number(l.unitFactor) || 1));
  }
  for (const [pid, qty] of qtyByProduct) {
    const product = productsById.get(pid);
    if (!product) continue;
    let bestFree = 0;
    let bestPromo = null;
    for (const promo of promos) {
      if (promo.type !== "free_goods" || !promo.buyQuantity || !promo.freeQuantity || !matches(promo, product, customer, channel, level)) continue;
      if (promo.minQuantity && qty < promo.minQuantity) continue;
      const free = Math.floor(qty / promo.buyQuantity) * promo.freeQuantity;
      if (free > bestFree) { bestFree = free; bestPromo = promo; }
    }
    if (bestFree > 0) {
      out.push({
        product: product._id, reference: product.internalReference || "", description: `${product.name} — gratuit (${bestPromo.name})`,
        quantity: bestFree, unit: product.unit, unitFactor: 1, unitPrice: 0, discount: 0, vatRate: product.vatRate ?? 20,
        promotion: bestPromo._id, free: true,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------- rebates
function rebateFor(turnover, tiers, mode = "whole") {
  const sorted = [...(tiers || [])].sort((a, b) => a.threshold - b.threshold);
  const reached = sorted.filter((t) => turnover >= t.threshold);
  const current = reached[reached.length - 1] || null;
  const next = sorted.find((t) => turnover < t.threshold) || null;
  let amount = 0;
  if (mode === "progressive") {
    sorted.forEach((t, i) => {
      const upper = sorted[i + 1]?.threshold ?? Infinity;
      const slice = Math.max(Math.min(turnover, upper) - t.threshold, 0);
      amount += slice * t.percent / 100;
    });
  } else if (current) {
    amount = turnover * current.percent / 100;
  }
  amount = round2(amount);
  return {
    turnover: round2(turnover), percent: current?.percent || 0, amount,
    effectivePercent: turnover > 0 ? round2((amount / turnover) * 100) : 0,
    next: next ? { threshold: next.threshold, percent: next.percent, missing: round2(next.threshold - turnover) } : null,
  };
}

/** Turnover HT per customer (invoices − credit notes, RFA credit notes excluded), split by VAT rate. */
async function turnoverByCustomer(agreement, customerIds = null) {
  const company = new mongoose.Types.ObjectId(String(agreement.company));
  const to = new Date(agreement.to);
  to.setHours(23, 59, 59, 999);
  const filter = { company, status: { $in: ["issued", "partially_paid", "paid"] }, type: { $in: ["invoice", "credit_note"] }, rebateAgreement: null, date: { $gte: new Date(agreement.from), $lte: to } };
  let targets = null;
  if ((agreement.customers || []).length) targets = ids(agreement.customers);
  else if ((agreement.customerTypes || []).length) targets = (await Customer.find({ company, type: { $in: agreement.customerTypes } }).select("_id").lean()).map((c) => String(c._id));
  if (customerIds) targets = (targets || customerIds.map(String)).filter((x) => customerIds.map(String).includes(x));
  if (targets) filter.customer = { $in: targets.map((x) => new mongoose.Types.ObjectId(x)) };
  const invoices = await SalesInvoice.find(filter).select("customer type vatBreakdown totalHT").lean();
  const by = new Map();
  for (const inv of invoices) {
    const k = String(inv.customer);
    if (!by.has(k)) by.set(k, { total: 0, byRate: new Map() });
    const row = by.get(k);
    const sign = inv.type === "credit_note" ? -1 : 1;
    for (const r of inv.vatBreakdown || []) row.byRate.set(r.rate, round2((row.byRate.get(r.rate) || 0) + sign * r.baseHT));
    row.total = round2(row.total + sign * (inv.totalHT || 0));
  }
  if (targets) for (const t of targets) if (!by.has(t)) by.set(t, { total: 0, byRate: new Map() });
  return by;
}

async function progress(agreement, customerIds = null) {
  const by = await turnoverByCustomer(agreement, customerIds);
  const customers = new Map((await Customer.find({ _id: { $in: [...by.keys()] } }).select("name code type salesRep").lean()).map((c) => [String(c._id), c]));
  const settled = new Map((agreement.settlements || []).map((s) => [String(s.customer), s]));
  return [...by.entries()]
    .filter(([k]) => customers.has(k))
    .map(([k, v]) => ({ customer: customers.get(k), ...rebateFor(v.total, agreement.tiers, agreement.mode), settled: settled.get(k) || null }))
    .sort((a, b) => b.turnover - a.turnover);
}

async function settle(agreement, customerIds, actorId) {
  const by = await turnoverByCustomer(agreement, customerIds);
  const done = new Set((agreement.settlements || []).map((s) => String(s.customer)));
  const created = [];
  for (const [cid, v] of by) {
    if (done.has(cid)) continue;
    const r = rebateFor(v.total, agreement.tiers, agreement.mode);
    if (!(r.amount > 0)) continue;
    const customer = await Customer.findById(cid).select("name salesRep paymentDays").lean();
    // one line per VAT rate, in proportion to the turnover at that rate
    const rates = [...v.byRate.entries()].filter(([, base]) => base > 0);
    const totalBase = rates.reduce((s, [, b]) => s + b, 0) || 1;
    let left = r.amount;
    const lines = rates.map(([rate, base], i) => {
      const part = i === rates.length - 1 ? round2(left) : round2(r.amount * base / totalBase);
      left = round2(left - part);
      return { description: `Remise de fin d'année — ${agreement.name}${r.percent ? ` (${r.percent} %)` : ""} — CA HT ${r.turnover.toFixed(2)} MAD`, quantity: 1, unit: "forfait", unitPrice: part, discount: 0, vatRate: rate };
    }).filter((l) => l.unitPrice > 0);
    if (!lines.length) continue;
    const note = new SalesInvoice({
      company: agreement.company, type: "credit_note", customer: cid, salesRep: customer?.salesRep || null, date: new Date(), status: "draft",
      subject: `Remise de fin d'année — ${agreement.name}`, lines, rebateAgreement: agreement._id, createdBy: actorId,
    });
    await note.save();
    agreement.settlements.push({ customer: cid, turnover: r.turnover, percent: r.percent, amount: r.amount, creditNote: note._id, at: new Date(), by: actorId });
    created.push({ customer: { _id: cid, name: customer?.name }, amount: r.amount, creditNote: note._id });
  }
  await agreement.save();
  return created;
}

module.exports = { activeFor, matches, bestPrice, freeLines, rebateFor, turnoverByCustomer, progress, settle };
