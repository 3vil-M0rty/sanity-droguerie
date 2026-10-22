const mongoose = require("mongoose");
const PaymentInstrument = require("../models/PaymentInstrument");
const DepositSlip = require("../models/DepositSlip");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const { createWithNumber } = require("./documentNumberService");
const { round2 } = require("./salesCalc");

/**
 * ============================================================
 * PORTEFEUILLE CHÈQUES & LCN
 * ============================================================
 * Every cheque / effet payment on an invoice becomes an instrument
 * (onPayment, or sync() for payments recorded by other screens).
 * Deposit = bordereau de remise; cleared = on the bank statement;
 * unpaid = refused: the payment leaves the invoice, which reopens.
 * ============================================================
 */
const KIND = { cheque: "cheque", effet: "lcn" };
const err = (message, status = 400) => Object.assign(new Error(message), { status });
const day = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

function fromPayment(invoice, p, extra = {}) {
  return {
    company: invoice.company, kind: KIND[p.method], number: p.reference || "", customer: invoice.customer?._id || invoice.customer,
    invoice: invoice._id, invoiceNumber: invoice.number, paymentId: p._id, amount: p.amount, receivedAt: p.date,
    dueDate: p.dueDate || p.date, collectedBy: p.collectedBy || null,
    bank: extra.bank || "", drawer: extra.drawer || "",
    history: [{ status: "in_portfolio", at: p.date, by: p.by || null, note: "Reçu" }],
  };
}

/** After a payment is recorded on an invoice. */
async function onPayment(invoice, payment, extra = {}) {
  if (!KIND[payment.method]) return null;
  return PaymentInstrument.create(fromPayment(invoice, payment, extra));
}

/** Creates the missing instruments (payments recorded by reps, drivers, imports…). */
async function sync(companyId) {
  const company = new mongoose.Types.ObjectId(String(companyId));
  const invoices = await SalesInvoice.find({ company, "payments.method": { $in: ["cheque", "effet"] } }).select("company number customer payments").lean();
  if (!invoices.length) return 0;
  const known = new Set((await PaymentInstrument.find({ company }).select("paymentId").lean()).map((i) => String(i.paymentId)));
  const docs = [];
  for (const inv of invoices) for (const p of inv.payments || []) if (KIND[p.method] && !known.has(String(p._id))) docs.push(fromPayment(inv, p));
  if (docs.length) await PaymentInstrument.insertMany(docs, { ordered: false }).catch((e) => { if (e.code !== 11000) throw e; });
  return docs.length;
}

/** A payment deleted on the invoice: only while the cheque is still in the safe. */
async function beforePaymentDeleted(invoice, paymentId) {
  const ins = await PaymentInstrument.findOne({ company: invoice.company, invoice: invoice._id, paymentId });
  if (!ins) return;
  if (ins.status !== "in_portfolio") throw err(`This ${ins.kind === "lcn" ? "LCN" : "cheque"} has already been deposited at the bank — record it as unpaid instead`);
  ins.status = "cancelled";
  ins.history.push({ status: "cancelled", at: new Date(), note: "Règlement supprimé" });
  await ins.save();
}

async function list(companyId, q = {}, now = new Date()) {
  await sync(companyId);
  const filter = { company: companyId };
  if (["in_portfolio", "deposited", "cleared", "unpaid", "cancelled"].includes(q.status)) filter.status = q.status;
  else filter.status = { $ne: "cancelled" };
  if (["cheque", "lcn"].includes(q.kind)) filter.kind = q.kind;
  if (q.customer) filter.customer = q.customer;
  if (q.customerIn) filter.customer = { $in: q.customerIn };
  if (q.dueFrom || q.dueTo) filter.dueDate = { ...(q.dueFrom ? { $gte: day(q.dueFrom) } : {}), ...(q.dueTo ? { $lte: new Date(day(q.dueTo).getTime() + 86399999) } : {}) };
  let rows = await PaymentInstrument.find(filter).sort({ dueDate: 1 }).limit(2000).populate("customer", "name code phone").populate("depositSlip", "number date").lean();
  if (q.search) {
    const s = String(q.search).toLowerCase();
    rows = rows.filter((r) => [r.number, r.bank, r.drawer, r.invoiceNumber, r.customer?.name, r.customer?.code].some((v) => String(v || "").toLowerCase().includes(s)));
  }
  // Summary over the whole portfolio (not just the filtered page)
  const all = await PaymentInstrument.find({ company: companyId, status: { $in: ["in_portfolio", "deposited", "unpaid"] }, ...(q.customerIn ? { customer: { $in: q.customerIn } } : {}) }).select("status amount dueDate kind").lean();
  const today = day(now);
  const in7 = new Date(today.getTime() + 7 * 86400000);
  const sum = (arr) => ({ count: arr.length, amount: round2(arr.reduce((s, x) => s + x.amount, 0)) });
  const inPf = all.filter((x) => x.status === "in_portfolio");
  return {
    rows,
    summary: {
      inPortfolio: sum(inPf),
      toDeposit: sum(inPf.filter((x) => new Date(x.dueDate) <= today)), // due: can go to the bank now
      dueThisWeek: sum(inPf.filter((x) => new Date(x.dueDate) > today && new Date(x.dueDate) <= in7)),
      deposited: sum(all.filter((x) => x.status === "deposited")),
      unpaid: sum(all.filter((x) => x.status === "unpaid")),
    },
  };
}

async function deposit(companyId, { instruments, date, mode = "encaissement", bankAccount = "" }, actorId) {
  const ids = [...new Set((instruments || []).map(String))];
  if (!ids.length) throw err("Choose the cheques / LCN to deposit");
  const list2 = await PaymentInstrument.find({ _id: { $in: ids }, company: companyId });
  if (list2.length !== ids.length) throw err("Some items were not found", 404);
  const bad = list2.find((i) => i.status !== "in_portfolio");
  if (bad) throw err(`${bad.number || bad.kind} is not in the portfolio any more`);
  const kinds = new Set(list2.map((i) => i.kind));
  if (kinds.size > 1) throw err("A deposit slip holds either cheques or LCN, not both");
  const kind = list2[0].kind;
  if (mode === "escompte" && kind !== "lcn") throw err("Only LCN can be discounted (escompte)");
  const when = date ? new Date(date) : new Date();
  if (kind === "cheque") {
    const early = list2.find((i) => day(i.dueDate) > day(when));
    if (early) throw err(`Cheque ${early.number || ""} is dated ${new Date(early.dueDate).toLocaleDateString("fr-FR")}: it can't be deposited before`);
  }
  const slip = await createWithNumber(DepositSlip, {
    company: companyId, date: when, kind, mode: kind === "lcn" && mode === "escompte" ? "escompte" : "encaissement", bankAccount,
    instruments: list2.map((i) => i._id), count: list2.length, total: round2(list2.reduce((s, i) => s + i.amount, 0)), by: actorId,
  }, "BR");
  for (const i of list2) {
    i.status = "deposited";
    i.depositSlip = slip._id;
    i.depositedAt = when;
    i.history.push({ status: "deposited", at: when, by: actorId, note: `Bordereau ${slip.number}` });
    await i.save();
  }
  return slip;
}

async function clear(instrument, { date }, actorId) {
  if (instrument.status !== "deposited") throw err("Only a deposited item can be marked as cleared");
  instrument.status = "cleared";
  instrument.clearedAt = date ? new Date(date) : new Date();
  instrument.history.push({ status: "cleared", at: instrument.clearedAt, by: actorId, note: "Encaissé" });
  await instrument.save();
  return instrument;
}

/** Impayé: the payment leaves the invoice (it reopens); optionally the customer is blocked. */
async function unpaid(instrument, { date, reason, fees, block }, actorId) {
  if (!["in_portfolio", "deposited"].includes(instrument.status)) throw err("Only an item in the portfolio or at the bank can be unpaid");
  const invoice = await SalesInvoice.findById(instrument.invoice);
  if (invoice) {
    const p = invoice.payments.id(instrument.paymentId);
    if (p) {
      instrument.payment = p.toObject();
      p.deleteOne();
      invoice.updatedBy = actorId;
      await invoice.save();
    }
  }
  instrument.status = "unpaid";
  instrument.unpaidAt = date ? new Date(date) : new Date();
  instrument.unpaidReason = String(reason || "").trim().slice(0, 300) || "Impayé";
  instrument.unpaidFees = Math.max(Number(fees) || 0, 0);
  instrument.history.push({ status: "unpaid", at: instrument.unpaidAt, by: actorId, note: instrument.unpaidReason });
  await instrument.save();
  if (block) {
    await Customer.updateOne({ _id: instrument.customer }, { $set: { blocked: true, blockedReason: `${instrument.kind === "lcn" ? "LCN" : "Chèque"} impayé ${instrument.number || ""} (${instrument.unpaidReason})`.trim() } });
  }
  return instrument;
}

module.exports = { onPayment, sync, beforePaymentDeleted, list, deposit, clear, unpaid, KIND };
