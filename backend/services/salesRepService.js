const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const PosSale = require("../models/PosSale");
const Customer = require("../models/Customer");
const SalesTarget = require("../models/SalesTarget");
const User = require("../models/User");
const pricing = require("./pricingService");
const { amountDue, round2 } = require("./salesCalc");

/**
 * ============================================================
 * SALES REPS — targets, achievements, commissions, collections
 * ============================================================
 * For a month (period "YYYY-MM"), per rep (Customer.salesRep, copied on
 * every document as salesRep):
 *   invoicedHT   issued invoices of the month − credit notes (HT)
 *   marginHT     invoicedHT − cost of goods (CMUP at delivery)
 *   collected    payments received in the month on the rep's invoices
 *                (TTC, credit-note imputations excluded)
 *   newCustomers customers created for the rep in the month
 * commission = rate × base, base = SalesSettings.commissionBase
 * (invoiced HT | collected HT-equivalent | margin), + bonus when the
 * revenue target is reached.
 * ============================================================
 */

function monthRange(period) {
  const [y, m] = String(period).split("-").map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59, 999) };
}

const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Logins that are reps: sales department, or owning at least one customer. */
async function repsOf(companyId) {
  const owners = await Customer.distinct("salesRep", { company: companyId, salesRep: { $ne: null } });
  const users = await User.find({ $or: [{ _id: { $in: owners } }, { department: "sales" }], status: { $nin: ["inactive", "suspended"] }, role: { $ne: "platform_admin" } })
    .select("firstName lastName email department").sort({ firstName: 1 }).lean();
  return users;
}

async function performance(companyId, period, onlyRep = null) {
  const { from, to } = monthRange(period);
  const settings = await pricing.getSettings(companyId);
  const reps = (await repsOf(companyId)).filter((u) => !onlyRep || String(u._id) === String(onlyRep));
  const repIds = reps.map((r) => r._id);
  const [invoices, paidInvoices, targets, newCustomers, posSales] = await Promise.all([
    SalesInvoice.find({ company: companyId, salesRep: { $in: repIds }, status: { $in: ["issued", "partially_paid", "paid"] }, date: { $gte: from, $lte: to } }).select("salesRep type totalHT totalTTC costTotal").lean(),
    SalesInvoice.find({ company: companyId, salesRep: { $in: repIds }, type: { $ne: "credit_note" }, "payments.date": { $gte: from, $lte: to } }).select("salesRep totalHT totalTTC payments").lean(),
    SalesTarget.find({ company: companyId, period, salesRep: { $in: repIds } }).lean(),
    Customer.aggregate([{ $match: { company: new mongoose.Types.ObjectId(String(companyId)), salesRep: { $in: repIds }, createdAt: { $gte: from, $lte: to } } }, { $group: { _id: "$salesRep", n: { $sum: 1 } } }]),
    PosSale.countDocuments({ company: companyId, date: { $gte: from, $lte: to } }),
  ]);
  const tByRep = new Map(targets.map((t) => [String(t.salesRep), t]));
  const ncByRep = new Map(newCustomers.map((c) => [String(c._id), c.n]));
  const rows = reps.map((rep) => {
    const id = String(rep._id);
    const mine = invoices.filter((i) => String(i.salesRep) === id);
    const sign = (i) => (i.type === "credit_note" ? -1 : 1);
    const invoicedHT = round2(mine.reduce((s, i) => s + sign(i) * (i.totalHT || 0), 0));
    const costHT = round2(mine.reduce((s, i) => s + sign(i) * (i.costTotal || 0), 0));
    const marginHT = round2(invoicedHT - costHT);
    let collected = 0;
    let collectedHT = 0;
    for (const inv of paidInvoices.filter((i) => String(i.salesRep) === id)) {
      for (const p of inv.payments || []) {
        if (new Date(p.date) < from || new Date(p.date) > to || p.method === "autre") continue;
        collected += p.amount;
        collectedHT += inv.totalTTC ? (p.amount * inv.totalHT) / inv.totalTTC : 0;
      }
    }
    collected = round2(collected);
    collectedHT = round2(collectedHT);
    const target = tByRep.get(id) || null;
    const rate = target?.commissionRate ?? settings.defaultCommissionRate ?? 0;
    const base = settings.commissionBase === "invoiced" ? invoicedHT : settings.commissionBase === "margin" ? marginHT : collectedHT;
    const reached = !!target && target.revenueTarget > 0 && invoicedHT >= target.revenueTarget;
    const commission = round2(Math.max(base, 0) * (rate / 100) + (reached ? target.bonus || 0 : 0));
    return {
      rep: { _id: rep._id, firstName: rep.firstName, lastName: rep.lastName, email: rep.email },
      invoicedHT, marginHT, marginRate: invoicedHT ? round2((marginHT / invoicedHT) * 100) : 0, collected, collectedHT,
      invoices: mine.filter((i) => i.type !== "credit_note").length,
      newCustomers: ncByRep.get(id) || 0,
      target,
      achievement: target?.revenueTarget ? round2((invoicedHT / target.revenueTarget) * 100) : null,
      collectionAchievement: target?.collectionTarget ? round2((collected / target.collectionTarget) * 100) : null,
      commissionBase: settings.commissionBase, commissionRate: rate, commissionBaseAmount: round2(base), bonus: reached ? target.bonus || 0 : 0, commission,
    };
  });
  return { period, from, to, rows, totals: {
    invoicedHT: round2(rows.reduce((s, r) => s + r.invoicedHT, 0)),
    marginHT: round2(rows.reduce((s, r) => s + r.marginHT, 0)),
    collected: round2(rows.reduce((s, r) => s + r.collected, 0)),
    commission: round2(rows.reduce((s, r) => s + r.commission, 0)),
    posTickets: posSales,
  } };
}

/** Open invoices to collect, grouped by customer, with ageing and the last action. */
async function collections(companyId, { salesRep = null, customerFilter = {} } = {}, now = new Date()) {
  const filter = { company: companyId, type: { $ne: "credit_note" }, status: { $in: ["issued", "partially_paid"] }, ...customerFilter };
  if (salesRep) filter.salesRep = salesRep;
  const invoices = await SalesInvoice.find(filter).populate("customer", "name code phone city salesRep creditLimit blocked").populate("salesRep", "firstName lastName")
    .select("number date dueDate totalTTC amountPaid status type customer salesRep collectionActions").sort({ dueDate: 1 }).lean();
  const byCustomer = new Map();
  for (const inv of invoices) {
    const due = amountDue(inv);
    if (!due) continue;
    const days = inv.dueDate ? Math.floor((now - new Date(inv.dueDate)) / 86400000) : 0;
    const key = String(inv.customer?._id);
    if (!byCustomer.has(key)) byCustomer.set(key, { customer: inv.customer, salesRep: inv.salesRep, total: 0, overdue: 0, oldestDays: 0, invoices: [] });
    const row = byCustomer.get(key);
    row.total = round2(row.total + due);
    if (days > 0) row.overdue = round2(row.overdue + due);
    row.oldestDays = Math.max(row.oldestDays, days);
    const actions = inv.collectionActions || [];
    row.invoices.push({ _id: inv._id, number: inv.number, date: inv.date, dueDate: inv.dueDate, totalTTC: inv.totalTTC, due, days, lastAction: actions[actions.length - 1] || null, nextPromise: actions.filter((a) => a.type === "promise" && a.promiseDate && new Date(a.promiseDate) >= new Date(now.toDateString())).sort((a, b) => new Date(a.promiseDate) - new Date(b.promiseDate))[0] || null });
  }
  const rows = [...byCustomer.values()].sort((a, b) => b.overdue - a.overdue || b.total - a.total);
  return { rows, totals: { total: round2(rows.reduce((s, r) => s + r.total, 0)), overdue: round2(rows.reduce((s, r) => s + r.overdue, 0)), customers: rows.length } };
}

module.exports = { monthRange, currentPeriod, repsOf, performance, collections };
