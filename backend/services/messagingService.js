const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const SalesSettings = require("../models/SalesSettings");
const MessageLog = require("../models/MessageLog");
const wa = require("./whatsappService");
const links = require("./publicLinks");
const { buildStatement } = require("./statementService");
const { amountDue, round2 } = require("./salesCalc");
const { formatAmount } = require("./pdfHelpers");

/**
 * What the app says on WhatsApp: invoice, statement, payment reminder,
 * and the daily automatic reminders (SalesSettings.whatsapp).
 */
const oid = (id) => new mongoose.Types.ObjectId(String(id)); // aggregate() doesn't cast
const mad = (n) => `${formatAmount(n)} MAD`;
const fr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const phoneOf = (c) => c?.whatsapp || c?.phone || (c?.contacts || []).find((x) => x.phone)?.phone || "";
const sign = (s, company) => (s?.whatsapp?.signature || company.name);

async function ctx(companyId) {
  const [company, settings] = await Promise.all([
    Company.findById(companyId).select("name").lean(),
    SalesSettings.findOne({ company: companyId }).select("whatsapp").lean(),
  ]);
  return { company, settings };
}

async function sendInvoice(invoice, { to, message, req, sentBy }) {
  const customer = invoice.customer?._id ? invoice.customer : await Customer.findById(invoice.customer).lean();
  const { company, settings } = await ctx(invoice.company);
  const kind = invoice.type === "credit_note" ? "notre avoir" : invoice.type === "deposit" ? "notre facture d'acompte" : "notre facture";
  const text = String(message || "").trim()
    || `Bonjour ${customer.name},\nveuillez trouver ${kind} ${invoice.number} d'un montant de ${mad(invoice.totalTTC)} TTC${invoice.dueDate && invoice.type !== "credit_note" ? `, payable avant le ${fr(invoice.dueDate)}` : ""}.\nCordialement,\n${sign(settings, company)}`;
  const link = links.docUrl(req, { k: "inv", id: String(invoice._id) });
  return wa.send({
    company: invoice.company, customer: customer._id, kind: "invoice", invoices: [invoice._id], to: to || phoneOf(customer), text, link,
    filename: `${invoice.number}.pdf`, params: [customer.name, invoice.number, mad(invoice.totalTTC), fr(invoice.dueDate) || "—"], sentBy,
  });
}

async function sendStatement(customer, { from, to: until, phone, message, req, sentBy }) {
  const st = await buildStatement(customer, from, until);
  const { company, settings } = await ctx(customer.company);
  const text = String(message || "").trim()
    || `Bonjour ${customer.name},\nvoici votre relevé de compte au ${fr(until)} : solde ${st.closing >= 0 ? "dû" : "créditeur"} ${mad(Math.abs(st.closing))}${st.overdue > 0 ? `, dont ${mad(st.overdue)} échus` : ""}.\nCordialement,\n${sign(settings, company)}`;
  const link = links.docUrl(req, { k: "st", id: String(customer._id), f: from.toISOString(), t: until.toISOString() });
  return wa.send({
    company: customer.company, customer: customer._id, kind: "statement", to: phone || phoneOf(customer), text, link,
    filename: `releve-${customer.code || "client"}.pdf`, params: [customer.name, mad(st.closing), mad(st.overdue)], sentBy,
  });
}

function reminderText(customer, info, settings, company) {
  const n = info.invoices.length;
  return `Bonjour ${customer.name},\nsauf erreur de notre part, ${n > 1 ? `${n} factures restent impayées` : `la facture ${info.invoices[0].number} reste impayée`} pour un total de ${mad(info.overdue)} (échéance la plus ancienne : ${fr(info.oldestDue)}).\nMerci de bien vouloir procéder au règlement ou de nous contacter. Si vous avez déjà réglé, ne tenez pas compte de ce message.\nCordialement,\n${sign(settings, company)}`;
}

/** Customers with overdue invoices (≥ minDays late), what they owe and when they were last reminded. */
async function remindersDue(companyId, { minDays = 1, now = new Date(), customerFilter = {} } = {}) {
  const limit = new Date(now.getTime() - minDays * 86400000);
  const invoices = await SalesInvoice.find({ company: companyId, type: { $ne: "credit_note" }, status: { $in: ["issued", "partially_paid"] }, dueDate: { $lte: limit }, ...customerFilter })
    .select("number customer date dueDate totalTTC amountPaid status type").lean();
  const by = new Map();
  for (const i of invoices) {
    const due = amountDue(i);
    if (!due) continue;
    const k = String(i.customer);
    if (!by.has(k)) by.set(k, { invoices: [], overdue: 0, oldestDue: null });
    const row = by.get(k);
    row.invoices.push({ _id: i._id, number: i.number, dueDate: i.dueDate, due, daysLate: Math.floor((now - new Date(i.dueDate)) / 86400000) });
    row.overdue = round2(row.overdue + due);
    if (!row.oldestDue || new Date(i.dueDate) < row.oldestDue) row.oldestDue = new Date(i.dueDate);
  }
  if (!by.size) return [];
  const ids = [...by.keys()];
  const [customers, last] = await Promise.all([
    Customer.find({ _id: { $in: ids } }).select("name code phone whatsapp contacts salesRep autoReminders company").lean(),
    MessageLog.aggregate([
      { $match: { company: oid(companyId), kind: "reminder", customer: { $in: ids.map((x) => oid(x)) } } },
      { $group: { _id: "$customer", at: { $max: "$createdAt" }, count: { $sum: 1 } } },
    ]),
  ]);
  const lastBy = new Map(last.map((l) => [String(l._id), l]));
  return customers.map((c) => {
    const info = by.get(String(c._id));
    info.invoices.sort((a, b) => b.daysLate - a.daysLate);
    return {
      customer: { _id: c._id, name: c.name, code: c.code, salesRep: c.salesRep, autoReminders: c.autoReminders !== false },
      phone: phoneOf(c), whatsapp: wa.normalizePhone(phoneOf(c)),
      ...info, daysLate: info.invoices[0].daysLate,
      lastReminderAt: lastBy.get(String(c._id))?.at || null, reminders: lastBy.get(String(c._id))?.count || 0,
    };
  }).sort((a, b) => b.overdue - a.overdue);
}

async function sendReminder(row, { req, sentBy, automatic = false, message }) {
  const customer = await Customer.findById(row.customer._id).lean();
  const { company, settings } = await ctx(customer.company);
  const text = String(message || "").trim() || reminderText(customer, row, settings, company);
  const until = new Date();
  const link = links.docUrl(req, { k: "st", id: String(customer._id), f: new Date(until.getFullYear() - 1, until.getMonth(), 1).toISOString(), t: until.toISOString() });
  return wa.send({
    company: customer.company, customer: customer._id, kind: "reminder", invoices: row.invoices.map((i) => i._id), to: phoneOf(customer), text, link,
    filename: `releve-${customer.code || "client"}.pdf`, params: [customer.name, mad(row.overdue), String(row.invoices.length), fr(row.oldestDue)], sentBy, automatic,
  });
}

/**
 * Daily: companies with automatic reminders on (and the Business API
 * connected) remind each customer whose most overdue invoice reaches
 * exactly one of the reminder days (3, 15, 30 days late by default).
 */
async function runDailyReminders(now = new Date()) {
  if (!wa.isCloud()) return 0;
  const list = await SalesSettings.find({ "whatsapp.autoReminders": true }).select("company whatsapp").lean();
  let sent = 0;
  for (const s of list) {
    const days = new Set((s.whatsapp?.reminderDays || [3, 15, 30]).map(Number));
    for (const row of await remindersDue(s.company, { minDays: 1, now })) {
      if (!row.customer.autoReminders || !row.whatsapp) continue;
      if (!row.invoices.some((i) => days.has(i.daysLate))) continue;
      if (row.lastReminderAt && now - new Date(row.lastReminderAt) < 20 * 3600000) continue;
      try { await sendReminder(row, { automatic: true }); sent += 1; } catch (err) { console.error("WhatsApp reminder failed:", err.message); }
    }
  }
  return sent;
}

module.exports = { sendInvoice, sendStatement, sendReminder, remindersDue, runDailyReminders, phoneOf, reminderText };
