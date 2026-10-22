const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const PosSale = require("../models/PosSale");
const PurchaseOrder = require("../models/PurchaseOrder");
const SalesSettings = require("../models/SalesSettings");
const PaymentInstrument = require("../models/PaymentInstrument");
const { round2, vatBreakdown, vatCollected } = require("./salesCalc");

/**
 * ============================================================
 * ACCOUNTING — journal entries for the accountant, VAT summary
 * ============================================================
 * Sanity is not the general ledger: it produces the entries of what it
 * knows, for the accountant's software (Sage, Ciel, a fiduciaire's tool…)
 * with the Plan Comptable Marocain accounts set in Ventes › Tarifs ›
 * Comptabilité (SalesSettings.accounting):
 *
 *   VT  sales     invoice: D 3421 client TTC / C 7111 HT per rate / C 4455 VAT
 *                 credit note: the reverse; counter tickets of a day: one
 *                 entry, D cash / bank by payment method
 *   BQ / CA       receipts: D 5141 bank · 5161 cash · 5111 cheques & bills
 *                 to collect / C 3421 client
 *   BQ            cheques / LCN: cleared D 5141 / C 5111; unpaid D 3421 / C 5111
 *   HA  purchases supplier invoice: D 6111 HT / D 34552 VAT / C 4411 supplier
 *   BQ / CA       supplier payments: D 4411 / C bank or cash
 *
 * Every entry balances (rounding goes to the HT line). The VAT summary
 * gives VAT collected and deductible per rate for a period, on payments
 * (encaissement — the default regime in Morocco) and on invoices (débit).
 * ============================================================
 */

const DEFAULTS = {
  customers: "3421", suppliers: "4411", sales: "7111", purchases: "6111", vatCollected: "4455", vatDeductible: "34552",
  bank: "5141", cash: "5161", valuesToCollect: "5111", cardClearing: "5141", rebates: "7119",
  journals: { sales: "VT", purchases: "HA", bank: "BQ", cash: "CA" }, vatRegime: "encaissement",
};

async function accountsOf(companyId) {
  const s = await SalesSettings.findOne({ company: companyId }).select("accounting").lean();
  const a = s?.accounting || {};
  const byRate = a.salesByRate instanceof Map ? Object.fromEntries(a.salesByRate) : a.salesByRate || {};
  return { ...DEFAULTS, ...a, journals: { ...DEFAULTS.journals, ...(a.journals || {}) }, salesByRate: byRate };
}

const inRange = (from, to) => ({ $gte: from, $lte: to });
const salesAccount = (acc, rate) => acc.salesByRate?.[String(rate)] || acc.sales;
const tiersOf = (c) => (c?.code || c?.name || "").toString().slice(0, 30);
const supplierTiers = (s) => (s?.name || "").toString().toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 17);

function payAccount(acc, method) {
  if (method === "especes") return { account: acc.cash, journal: acc.journals.cash };
  if (method === "cheque" || method === "effet") return { account: acc.valuesToCollect, journal: acc.journals.bank };
  if (method === "carte") return { account: acc.cardClearing, journal: acc.journals.bank };
  return { account: acc.bank, journal: acc.journals.bank };
}

/** One balanced entry: rounding difference goes on `fixIndex` line. */
function balance(lines, fixIndex = 1) {
  const d = round2(lines.reduce((s, l) => s + (l.debit || 0), 0));
  const c = round2(lines.reduce((s, l) => s + (l.credit || 0), 0));
  const diff = round2(d - c);
  if (diff !== 0 && lines[fixIndex]) {
    const l = lines[fixIndex];
    if (l.credit) l.credit = round2(l.credit + diff);
    else l.debit = round2(l.debit - diff);
  }
  return lines.filter((l) => (l.debit || 0) !== 0 || (l.credit || 0) !== 0);
}

/** Debit/credit with the sign handled: a negative debit becomes a credit. */
const dc = (amount) => (amount >= 0 ? { debit: round2(amount), credit: 0 } : { debit: 0, credit: round2(-amount) });
const cd = (amount) => (amount >= 0 ? { debit: 0, credit: round2(amount) } : { debit: round2(-amount), credit: 0 });

async function journalEntries(companyId, from, to) {
  const acc = await accountsOf(companyId);
  const company = new mongoose.Types.ObjectId(String(companyId));
  const [invoices, paidInvoices, tickets, orders, instruments] = await Promise.all([
    SalesInvoice.find({ company, status: { $in: ["issued", "partially_paid", "paid"] }, date: inRange(from, to) })
      .select("number type date totalTTC totalHT totalVAT vatBreakdown customer").populate("customer", "code name").sort({ date: 1, number: 1 }).lean(),
    SalesInvoice.find({ company, status: { $in: ["issued", "partially_paid", "paid"] }, "payments.date": inRange(from, to) })
      .select("number type payments customer").populate("customer", "code name").lean(),
    PosSale.find({ company, status: "completed", invoice: null, date: inRange(from, to) }).select("date number lines payments totalTTC").lean(),
    PurchaseOrder.find({ company, $or: [{ "invoices.date": inRange(from, to) }, { "payments.date": inRange(from, to) }] })
      .select("number supplier lines invoices payments").populate("supplier", "name").lean(),
    PaymentInstrument.find({ company, $or: [{ clearedAt: inRange(from, to) }, { unpaidAt: inRange(from, to) }, { status: "unpaid", receivedAt: inRange(from, to) }] })
      .populate("customer", "code name").lean(),
  ]);
  const entries = [];
  const push = (journal, date, piece, label, lines) => {
    const ok = balance(lines);
    if (ok.length) entries.push({ journal, date, piece, label, lines: ok });
  };

  // ---- sales (VT)
  for (const inv of invoices) {
    const sign = inv.type === "credit_note" ? -1 : 1;
    const label = `${inv.type === "credit_note" ? "Avoir" : "Facture"} ${inv.number} ${inv.customer?.name || ""}`.trim();
    const lines = [{ account: acc.customers, tiers: tiersOf(inv.customer), label, ...dc(sign * inv.totalTTC) }];
    for (const r of inv.vatBreakdown || []) lines.push({ account: salesAccount(acc, r.rate), tiers: "", label: `${label} HT ${r.rate}%`, ...cd(sign * r.baseHT) });
    for (const r of inv.vatBreakdown || []) if (r.vat) lines.push({ account: acc.vatCollected, tiers: "", label: `${label} TVA ${r.rate}%`, ...cd(sign * r.vat) });
    push(acc.journals.sales, inv.date, inv.number, label, lines);
  }

  // ---- counter tickets (one entry per day)
  const byDay = new Map();
  for (const t of tickets) {
    const key = new Date(t.date).toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(t);
  }
  for (const [d, list] of byDay) {
    const vat = new Map();
    const pay = new Map();
    let ttc = 0;
    for (const t of list) {
      ttc += t.totalTTC || 0;
      for (const r of vatBreakdown(t.lines || [])) {
        const cur = vat.get(r.rate) || { baseHT: 0, vat: 0 };
        cur.baseHT += r.baseHT;
        cur.vat += r.vat;
        vat.set(r.rate, cur);
      }
      for (const p of t.payments || []) {
        const target = p.method === "credit" ? { account: acc.customers, journal: acc.journals.sales } : payAccount(acc, p.method);
        pay.set(target.account, (pay.get(target.account) || 0) + p.amount);
      }
    }
    // payments above the ticket total = change given back in cash
    const paid = [...pay.values()].reduce((s, v) => s + v, 0);
    if (paid > ttc) pay.set(acc.cash, (pay.get(acc.cash) || 0) - (paid - ttc));
    const label = `Ventes comptoir du ${d.split("-").reverse().join("/")} (${list.length} tickets)`;
    const lines = [...pay.entries()].map(([account, amount]) => ({ account, tiers: "", label, ...dc(amount) }));
    const fix = lines.length;
    for (const [rate, r] of vat) lines.push({ account: salesAccount(acc, rate), tiers: "", label: `${label} HT ${rate}%`, ...cd(r.baseHT) });
    for (const [rate, r] of vat) if (r.vat) lines.push({ account: acc.vatCollected, tiers: "", label: `${label} TVA ${rate}%`, ...cd(r.vat) });
    const ok = balance(lines, fix);
    if (ok.length) entries.push({ journal: acc.journals.sales, date: new Date(`${d}T12:00:00`), piece: `TK-${d}`, label, lines: ok });
  }

  // ---- receipts (BQ / CA)
  for (const inv of paidInvoices) {
    for (const p of inv.payments || []) {
      if (!(new Date(p.date) >= from && new Date(p.date) <= to)) continue;
      if (p.method === "autre" || p.method === "compensation") continue; // credit notes applied: both sides on the customer
      const sign = inv.type === "credit_note" ? -1 : 1; // refund of a credit note
      const target = payAccount(acc, p.method);
      const label = `Règlement ${inv.number} ${inv.customer?.name || ""}${p.reference ? ` ${p.reference}` : ""}`.trim();
      push(target.journal, p.date, p.reference || inv.number, label, [
        { account: target.account, tiers: "", label, ...dc(sign * p.amount) },
        { account: acc.customers, tiers: tiersOf(inv.customer), label, ...cd(sign * p.amount) },
      ]);
    }
  }

  // ---- cheques & LCN (portefeuille): cleared = from 5111 to the bank;
  // unpaid = the receipt (taken off the invoice, so not above) and its reversal
  for (const ins of instruments) {
    const what = `${ins.kind === "lcn" ? "LCN" : "Chèque"} ${ins.number || ""} ${ins.customer?.name || ""}`.replace(/\s+/g, " ").trim();
    if (ins.status === "cleared" && ins.clearedAt >= from && ins.clearedAt <= to) {
      push(acc.journals.bank, ins.clearedAt, ins.number || ins.invoiceNumber, `Encaissement ${what}`, [
        { account: acc.bank, tiers: "", label: `Encaissement ${what}`, ...dc(ins.amount) },
        { account: acc.valuesToCollect, tiers: "", label: `Encaissement ${what}`, ...cd(ins.amount) },
      ]);
    }
    if (ins.status === "unpaid") {
      if (ins.receivedAt >= from && ins.receivedAt <= to) {
        const label = `Règlement ${ins.invoiceNumber} ${ins.customer?.name || ""} ${ins.number || ""}`.trim();
        push(acc.journals.bank, ins.receivedAt, ins.number || ins.invoiceNumber, label, [
          { account: acc.valuesToCollect, tiers: "", label, ...dc(ins.amount) },
          { account: acc.customers, tiers: tiersOf(ins.customer), label, ...cd(ins.amount) },
        ]);
      }
      if (ins.unpaidAt >= from && ins.unpaidAt <= to) {
        const label = `Impayé ${what}`;
        push(acc.journals.bank, ins.unpaidAt, ins.number || ins.invoiceNumber, label, [
          { account: acc.customers, tiers: tiersOf(ins.customer), label, ...dc(ins.amount) },
          { account: acc.valuesToCollect, tiers: "", label, ...cd(ins.amount) },
        ]);
      }
    }
  }

  // ---- purchases (HA) and supplier payments
  for (const po of orders) {
    const linesHT = (po.lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const linesTTC = (po.lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0) * (1 + (l.vatRate ?? 20) / 100), 0);
    const ratio = linesTTC ? linesHT / linesTTC : 1 / 1.2;
    for (const fi of po.invoices || []) {
      if (!(new Date(fi.date) >= from && new Date(fi.date) <= to)) continue;
      const sign = fi.type === "credit_note" ? -1 : 1;
      const label = `${fi.type === "credit_note" ? "Avoir fournisseur" : "Facture fournisseur"} ${fi.number} ${po.supplier?.name || ""}`.trim();
      const breakdown = fi.vatBreakdown?.length ? fi.vatBreakdown : [{ rate: 20, baseHT: round2(fi.amountTTC * ratio), vat: round2(fi.amountTTC * (1 - ratio)) }];
      const lines = [];
      for (const r of breakdown) lines.push({ account: acc.purchases, tiers: "", label: `${label} HT ${r.rate}%`, ...dc(sign * r.baseHT) });
      for (const r of breakdown) if (r.vat) lines.push({ account: acc.vatDeductible, tiers: "", label: `${label} TVA ${r.rate}%`, ...dc(sign * r.vat) });
      lines.push({ account: acc.suppliers, tiers: supplierTiers(po.supplier), label, ...cd(sign * fi.amountTTC) });
      push(acc.journals.purchases, fi.date, fi.number, label, lines.length > 1 ? [lines[lines.length - 1], ...lines.slice(0, -1)] : lines);
    }
    for (const p of po.payments || []) {
      if (!(new Date(p.date) >= from && new Date(p.date) <= to)) continue;
      const target = p.method === "especes" ? { account: acc.cash, journal: acc.journals.cash } : { account: acc.bank, journal: acc.journals.bank };
      const label = `Règlement fournisseur ${po.supplier?.name || ""} ${po.number}${p.reference ? ` ${p.reference}` : ""}`.trim();
      push(target.journal, p.date, p.reference || po.number, label, [
        { account: acc.suppliers, tiers: supplierTiers(po.supplier), label, ...dc(p.amount) },
        { account: target.account, tiers: "", label, ...cd(p.amount) },
      ]);
    }
  }

  entries.sort((a, b) => new Date(a.date) - new Date(b.date) || a.journal.localeCompare(b.journal));
  const totals = entries.reduce((t, e) => {
    for (const l of e.lines) { t.debit += l.debit || 0; t.credit += l.credit || 0; }
    return t;
  }, { debit: 0, credit: 0 });
  return { entries, accounts: acc, totals: { debit: round2(totals.debit), credit: round2(totals.credit), count: entries.length } };
}

/** Flat rows for CSV / Excel. */
function flatRows(entries) {
  const rows = [];
  for (const e of entries) for (const l of e.lines) rows.push({ journal: e.journal, date: e.date, piece: e.piece, account: l.account, tiers: l.tiers || "", label: l.label, debit: l.debit || 0, credit: l.credit || 0 });
  return rows;
}

const { neutralizeFormula } = require("../utils/csvHelpers");
const csvCell = (v) => {
  const s = String(neutralizeFormula(v) ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * CSV for import. format "generic": Journal;Date;Pièce;Compte;Tiers;Libellé;Débit;Crédit
 * (dd/mm/yyyy, decimal comma). format "sage": same order, date ddmmyy, no header —
 * the column layout most Sage 100 Maroc import models are set up for.
 */
function toCsv(entries, format = "generic") {
  const rows = flatRows(entries);
  const num = (n) => (n ? n.toFixed(2).replace(".", ",") : "");
  const date = (d) => {
    const x = new Date(d);
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    return format === "sage" ? `${dd}${mm}${String(x.getFullYear()).slice(2)}` : `${dd}/${mm}/${x.getFullYear()}`;
  };
  const lines = rows.map((r) => [r.journal, date(r.date), r.piece, r.account, r.tiers, r.label, num(r.debit), num(r.credit)].map(csvCell).join(";"));
  if (format !== "sage") lines.unshift("Journal;Date;Pièce;Compte;Tiers;Libellé;Débit;Crédit");
  return `﻿${lines.join("\r\n")}\r\n`;
}

// ---------------------------------------------------------------- VAT
async function vatSummary(companyId, from, to) {
  const company = new mongoose.Types.ObjectId(String(companyId));
  const acc = await accountsOf(companyId);
  const [invoices, tickets, orders] = await Promise.all([
    SalesInvoice.find({ company, status: { $in: ["issued", "partially_paid", "paid"] }, $or: [{ date: inRange(from, to) }, { "payments.date": inRange(from, to) }] })
      .select("number type date totalTTC vatBreakdown payments customer status").populate("customer", "name ice").lean(),
    PosSale.find({ company, status: "completed", invoice: null, date: inRange(from, to) }).select("lines").lean(),
    PurchaseOrder.find({ company, $or: [{ "invoices.date": inRange(from, to) }, { "payments.date": inRange(from, to) }] })
      .select("number supplier lines invoices payments").populate("supplier", "name ice").lean(),
  ]);
  const add = (map, rate, baseHT, vat) => {
    const cur = map.get(rate) || { rate, baseHT: 0, vat: 0 };
    cur.baseHT = round2(cur.baseHT + baseHT);
    cur.vat = round2(cur.vat + vat);
    map.set(rate, cur);
  };
  const collected = vatCollected(invoices, from, to);
  const posMap = new Map();
  for (const t of tickets) for (const r of vatBreakdown(t.lines || [])) add(posMap, r.rate, r.baseHT, r.vat);

  const dedDebit = new Map();
  const dedCash = new Map();
  const purchaseRows = [];
  for (const po of orders) {
    const linesHT = (po.lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);
    const linesTTC = (po.lines || []).reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0) * (1 + (l.vatRate ?? 20) / 100), 0);
    const ratio = linesTTC ? linesHT / linesTTC : 1 / 1.2;
    const invs = (po.invoices || []).map((fi) => ({
      ...fi,
      breakdown: fi.vatBreakdown?.length ? fi.vatBreakdown : [{ rate: 20, baseHT: round2(fi.amountTTC * ratio), vat: round2(fi.amountTTC * (1 - ratio)) }],
    }));
    for (const fi of invs) {
      if (!(new Date(fi.date) >= from && new Date(fi.date) <= to)) continue;
      const sign = fi.type === "credit_note" ? -1 : 1;
      for (const r of fi.breakdown) {
        add(dedDebit, r.rate, sign * r.baseHT, sign * r.vat);
        purchaseRows.push({ supplier: po.supplier?.name, ice: po.supplier?.ice, invoice: fi.number, date: fi.date, rate: r.rate, baseHT: sign * r.baseHT, vat: sign * r.vat });
      }
    }
    // payments: VAT deductible in proportion of what was paid (régime d'encaissement)
    const invTTC = invs.filter((fi) => fi.type !== "credit_note").reduce((s, fi) => s + fi.amountTTC, 0);
    const mix = new Map();
    for (const fi of invs) for (const r of fi.breakdown) add(mix, r.rate, (fi.type === "credit_note" ? -1 : 1) * r.baseHT, (fi.type === "credit_note" ? -1 : 1) * r.vat);
    const mixTTC = [...mix.values()].reduce((s, r) => s + r.baseHT + r.vat, 0) || invTTC;
    for (const p of po.payments || []) {
      if (!(new Date(p.date) >= from && new Date(p.date) <= to) || !mixTTC) continue;
      for (const r of mix.values()) {
        const share = (r.baseHT + r.vat) / mixTTC;
        const paid = p.amount * share;
        const vat = round2((paid * r.rate) / (100 + r.rate));
        add(dedCash, r.rate, round2(paid - vat), vat);
      }
    }
  }
  const list = (m) => [...m.values()].sort((a, b) => b.rate - a.rate);
  const sum = (rows) => round2(rows.reduce((s, r) => s + r.vat, 0));
  const merge = (a, b) => { const m = new Map(); for (const r of [...a, ...b]) add(m, r.rate, r.baseHT, r.vat); return list(m); };
  const pos = list(posMap);
  const regimes = {
    encaissement: { collected: merge(collected.onPayments.byRate, pos), deductible: list(dedCash) },
    debit: { collected: merge(collected.onInvoices.byRate, pos), deductible: list(dedDebit) },
  };
  for (const r of Object.values(regimes)) {
    r.totalCollected = sum(r.collected);
    r.totalDeductible = sum(r.deductible);
    r.net = round2(r.totalCollected - r.totalDeductible); // > 0 to pay, < 0 credit
  }
  return {
    from, to, regime: acc.vatRegime, regimes,
    counter: { byRate: pos, totalVAT: sum(pos) },
    salesRows: { onPayments: collected.onPayments.rows, onInvoices: collected.onInvoices.rows },
    purchaseRows,
  };
}

module.exports = { journalEntries, toCsv, flatRows, vatSummary, accountsOf, DEFAULTS, balance };
