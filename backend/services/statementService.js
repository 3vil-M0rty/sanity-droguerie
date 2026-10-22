const SalesInvoice = require("../models/SalesInvoice");
const { amountDue, round2 } = require("./salesCalc");

/**
 * Customer statement (relevé de compte): every issued invoice / credit
 * note and every payment, with the running balance, plus the invoices
 * still open (what the customer owes, oldest first).
 */
async function buildStatement(customer, from, to, now = new Date()) {
  const invoices = await SalesInvoice.find({ customer: customer._id, status: { $in: ["issued", "partially_paid", "paid"] } })
    .select("number type date dueDate totalTTC amountPaid payments status").lean();
  const entries = [];
  for (const i of invoices) {
    entries.push({ date: i.date, label: `${i.type === "credit_note" ? "Avoir" : "Facture"} ${i.number}`, debit: i.type === "credit_note" ? 0 : i.totalTTC, credit: i.type === "credit_note" ? i.totalTTC : 0, ref: i._id });
    if (i.type !== "credit_note") for (const p of i.payments || []) entries.push({ date: p.date, label: `Règlement ${p.method}${p.reference ? ` ${p.reference}` : ""} — ${i.number}`, debit: 0, credit: p.amount, ref: i._id });
  }
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  let balance = 0;
  let opening = 0;
  const rows = [];
  for (const e of entries) {
    balance = round2(balance + e.debit - e.credit);
    if (new Date(e.date) < from) { opening = balance; continue; }
    if (new Date(e.date) > to) continue;
    rows.push({ ...e, balance });
  }
  const open = invoices
    .filter((i) => i.type !== "credit_note" && amountDue(i) > 0)
    .map((i) => ({ _id: i._id, number: i.number, date: i.date, dueDate: i.dueDate, totalTTC: i.totalTTC, due: amountDue(i), daysLate: i.dueDate ? Math.max(Math.floor((now - new Date(i.dueDate)) / 86400000), 0) : 0 }))
    .sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
  const overdue = round2(open.filter((i) => i.daysLate > 0).reduce((s, i) => s + i.due, 0));
  return {
    customer: { _id: customer._id, name: customer.name, code: customer.code },
    from, to, opening, rows,
    closing: rows.length ? rows[rows.length - 1].balance : opening,
    open, overdue,
  };
}

module.exports = { buildStatement };
