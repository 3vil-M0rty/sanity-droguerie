/**
 * ============================================================
 * BUSINESS NOTIFICATIONS — stock, sales, deliveries (Sanity)
 * ============================================================
 * In-app notifications (the bell). Every notification carries a
 * translation `key` + `params` and a French fallback title/message.
 *
 * Event hooks never throw: a failed notification must not undo or fail
 * the business action — errors are only logged.
 *
 * Daily checks (runDailyBusinessChecks, from server.js) send each alert
 * ONCE thanks to a marker on the record (overdueNotifiedAt…).
 * ============================================================
 */
const Quote = require("../models/Quote");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const DeliveryNote = require("../models/DeliveryNote");
const StockLot = require("../models/StockLot");
const { notifyMany, getDepartmentRecipientIds, getPurchasingRecipientIds } = require("./notificationService");

const DAY = 86400000;
const QUOTE_EXPIRY_WARNING_DAYS = 3;
const LOT_EXPIRY_WARNING_DAYS = 30;
const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const money = (n) => `${(Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const uniq = (...lists) => [...new Set(lists.flat().filter(Boolean).map(String))];
const without = (ids, actorId) => ids.filter((id) => id !== String(actorId || ""));

async function safe(label, fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(`Notification (${label}) failed:`, error);
    return null;
  }
}

/** The sales rep of a customer + the document author. */
async function ownerIds(doc) {
  const customer = doc.customer?.salesRep !== undefined ? doc.customer : await Customer.findById(doc.customer).select("salesRep").lean();
  return uniq(doc.salesRep ? [String(doc.salesRep)] : [], customer?.salesRep ? [String(customer.salesRep)] : [], doc.createdBy ? [String(doc.createdBy)] : []);
}

// ------------------------------------------------------------------ stock
/**
 * Called after every stock movement (services/stockService.js): the
 * article just reached its minimum stock → warehouse + purchasing.
 * Alerts once per drop (marker cleared when the stock goes back up).
 */
function onStockChanged(product, previousQuantity, actorId) {
  return safe("stock", async () => {
    const threshold = Number(product.threshold) || 0;
    if (threshold <= 0) return;
    const Product = require("../models/Product");
    if (product.quantity > threshold) {
      if (product.lowStockNotifiedAt) await Product.updateOne({ _id: product._id }, { lowStockNotifiedAt: null });
      return;
    }
    if (previousQuantity <= threshold && product.lowStockNotifiedAt) return;
    await Product.updateOne({ _id: product._id }, { lowStockNotifiedAt: new Date() });
    product.lowStockNotifiedAt = new Date();
    await notifyMany(without(uniq(
      await getDepartmentRecipientIds(product.company, "warehouse"),
      await getPurchasingRecipientIds(product.company),
    ), actorId), {
      type: "stock_low",
      key: "stockLow",
      params: { article: product.name, quantity: product.quantity, unit: product.unit || "", threshold },
      title: `Stock bas : ${product.name}`,
      message: `${product.quantity} ${product.unit || ""} en stock (seuil ${threshold})`,
      link: "/purchasing/restock",
    });
  });
}

// ------------------------------------------------------------------ sales
/** Devis accepted / refused → its rep / author. */
function onQuoteDecided(quote, actorId) {
  return safe("quote decided", async () => {
    const customer = await Customer.findById(quote.customer).select("name salesRep").lean();
    const accepted = quote.status === "accepted";
    let recipients = without(await ownerIds({ ...quote.toObject?.() || quote, customer }), actorId);
    if (!recipients.length) recipients = without(await getDepartmentRecipientIds(quote.company, "sales"), actorId);
    await notifyMany(recipients, {
      type: "sales",
      key: accepted ? "quoteAccepted" : "quoteRefused",
      params: { number: quote.number, customer: customer?.name || "", amount: money(quote.totalHT), reason: quote.refusalReason ? `— ${quote.refusalReason}` : "" },
      title: `Devis ${quote.number} ${accepted ? "accepté" : "refusé"}`,
      message: `${customer?.name || ""} · ${money(quote.totalHT)} HT${!accepted && quote.refusalReason ? ` — ${quote.refusalReason}` : ""}`,
      link: `/sales/quotes/${quote._id}`,
    });
  });
}

/** Confirmed order → the warehouse (to prepare). */
function onOrderConfirmed(order, actorId) {
  return safe("order confirmed", async () => {
    const customer = await Customer.findById(order.customer).select("name").lean();
    await notifyMany(without(await getDepartmentRecipientIds(order.company, "warehouse"), actorId), {
      type: "sales",
      key: "orderToPrepare",
      params: { number: order.number, customer: customer?.name || "" },
      title: `Commande ${order.number} à préparer`,
      message: `${customer?.name || ""} · ${order.lines.length} ligne(s)`,
      link: `/sales/orders/${order._id}`,
    });
  });
}

/** Payment recorded on an invoice → the rep / author. */
function onPaymentRecorded(invoice, amount, actorId) {
  return safe("payment", async () => {
    const customer = await Customer.findById(invoice.customer).select("name salesRep").lean();
    let recipients = without(await ownerIds({ ...invoice.toObject?.() || invoice, customer }), actorId);
    if (!recipients.length) recipients = without(await getDepartmentRecipientIds(invoice.company, "sales"), actorId);
    await notifyMany(recipients, {
      type: "sales",
      key: invoice.status === "paid" ? "invoicePaid" : "paymentReceived",
      params: { number: invoice.number || "", customer: customer?.name || "", amount: money(amount) },
      title: invoice.status === "paid" ? `Facture ${invoice.number} soldée` : `Encaissement sur ${invoice.number}`,
      message: `${customer?.name || ""} · ${money(amount)}`,
      link: `/sales/invoices/${invoice._id}`,
    });
  });
}

/** Order placed on the reseller portal → the customer's rep, else the sales department. */
function onPortalOrder(order, customer) {
  return safe("portalOrder", async () => {
    let recipients = customer?.salesRep ? [String(customer.salesRep)] : [];
    if (!recipients.length) recipients = (await getDepartmentRecipientIds(order.company, "sales")).map(String);
    await notifyMany(recipients, {
      type: "sales",
      key: "portalOrder",
      params: { number: order.number, customer: customer?.name || "", amount: money(order.totalTTC) },
      title: `Commande portail ${order.number} à confirmer`,
      message: `${customer?.name || ""} · ${money(order.totalTTC)} TTC`,
      link: `/sales/orders/${order._id}`,
    });
  });
}

/** Cheque / LCN unpaid → the rep and the sales department. */
function onUnpaidInstrument(ins, actorId) {
  return safe("unpaid", async () => {
    const customer = await Customer.findById(ins.customer).select("name salesRep").lean();
    const recipients = without([...new Set([...(customer?.salesRep ? [String(customer.salesRep)] : []), ...(await getDepartmentRecipientIds(ins.company, "sales")).map(String)])], actorId);
    const what = ins.kind === "lcn" ? "LCN" : "Chèque";
    await notifyMany(recipients, {
      type: "sales",
      key: "instrumentUnpaid",
      params: { kind: what, number: ins.number || "", customer: customer?.name || "", amount: money(ins.amount) },
      title: `${what} impayé — ${customer?.name || ""}`,
      message: `${ins.number || ""} · ${money(ins.amount)} · ${ins.unpaidReason || ""} · facture ${ins.invoiceNumber} rouverte`,
      link: "/sales/portfolio",
    });
  });
}

// ------------------------------------------------------------------ daily
/** Sent devis expiring within 3 days → their rep / author. */
async function checkQuotesExpiring(now = new Date()) {
  const from = startOfDay(now);
  const limit = new Date(from.getTime() + (QUOTE_EXPIRY_WARNING_DAYS + 1) * DAY);
  const quotes = await Quote.find({ status: "sent", validUntil: { $ne: null, $gte: from, $lt: limit }, expiryNotifiedAt: null }).populate("customer", "name salesRep");
  for (const quote of quotes) {
    const owners = await ownerIds(quote);
    await notifyMany(owners.length ? owners : await getDepartmentRecipientIds(quote.company, "sales"), {
      type: "sales",
      key: "quoteExpiring",
      params: { number: quote.number, customer: quote.customer?.name || "", date: fmtDate(quote.validUntil) },
      title: `Devis ${quote.number} expire le ${fmtDate(quote.validUntil)}`,
      message: `${quote.customer?.name || ""} · à relancer`,
      link: `/sales/quotes/${quote._id}`,
    });
    quote.expiryNotifiedAt = now;
    await quote.save();
  }
  return quotes.length;
}

/** Issued invoices past their due date → sales + the rep (recouvrement). */
async function checkOverdueInvoices(now = new Date()) {
  const invoices = await SalesInvoice.find({
    type: { $ne: "credit_note" },
    status: { $in: ["issued", "partially_paid"] },
    dueDate: { $ne: null, $lt: startOfDay(now) },
    overdueNotifiedAt: null,
  }).populate("customer", "name salesRep");
  for (const invoice of invoices) {
    const due = Math.round(((invoice.totalTTC || 0) - (invoice.amountPaid || 0)) * 100) / 100;
    await notifyMany(uniq(await getDepartmentRecipientIds(invoice.company, "sales"), await ownerIds(invoice)), {
      type: "sales",
      key: "invoiceOverdue",
      params: { number: invoice.number || "", customer: invoice.customer?.name || "", amount: money(due), date: fmtDate(invoice.dueDate) },
      title: `Facture ${invoice.number} impayée`,
      message: `${invoice.customer?.name || ""} · ${money(due)} échu le ${fmtDate(invoice.dueDate)}`,
      link: `/sales/invoices/${invoice._id}`,
    });
    invoice.overdueNotifiedAt = now;
    await invoice.save();
  }
  return invoices.length;
}

/** BLs validated (goods out) more than 2 days ago and still not delivered → logistics. */
async function checkLateDeliveries(now = new Date()) {
  const late = await DeliveryNote.find({ type: "delivery", status: "validated", deliveryMode: "delivery", validatedAt: { $lt: new Date(startOfDay(now).getTime() - 2 * DAY) }, "history.status": { $ne: "late_notified" } }).populate("customer", "name");
  for (const note of late) {
    await notifyMany(await getDepartmentRecipientIds(note.company, "logistics"), {
      type: "logistics",
      key: "deliveryLate",
      params: { number: note.number, customer: note.customer?.name || "", date: fmtDate(note.validatedAt) },
      title: `BL ${note.number} non livré`,
      message: `${note.customer?.name || ""} — sorti le ${fmtDate(note.validatedAt)}, à livrer ou à replanifier`,
      link: `/logistics/delivery-notes/${note._id}`,
    });
    note.history.push({ status: "late_notified", at: now });
    await note.save();
  }
  return late.length;
}

/** Lots expiring within 30 days (paints, glues…) → warehouse, once per lot. */
async function checkExpiringLots(now = new Date()) {
  const limit = new Date(startOfDay(now).getTime() + LOT_EXPIRY_WARNING_DAYS * DAY);
  const lots = await StockLot.find({ quantity: { $gt: 0 }, expiryDate: { $ne: null, $lte: limit }, expiryNotifiedAt: null }).populate("product", "name unit").populate("warehouse", "name");
  for (const lot of lots) {
    await notifyMany(await getDepartmentRecipientIds(lot.company, "warehouse"), {
      type: "stock_low",
      key: "lotExpiring",
      params: { article: lot.product?.name || "", lot: lot.number, date: fmtDate(lot.expiryDate), quantity: lot.quantity },
      title: `Lot ${lot.number} expire le ${fmtDate(lot.expiryDate)}`,
      message: `${lot.product?.name || ""} · ${lot.quantity} ${lot.product?.unit || ""} (${lot.warehouse?.name || ""})`,
      link: "/stock/expiring",
    });
    await StockLot.updateOne({ _id: lot._id }, { $set: { expiryNotifiedAt: now } });
  }
  return lots.length;
}

async function runDailyBusinessChecks(now = new Date()) {
  const results = {};
  for (const [name, fn] of Object.entries({ checkQuotesExpiring, checkOverdueInvoices, checkLateDeliveries, checkExpiringLots })) {
    results[name] = await safe(name, () => fn(now));
  }
  return results;
}

module.exports = {
  onStockChanged, onQuoteDecided, onOrderConfirmed, onPaymentRecorded, onUnpaidInstrument, onPortalOrder,
  checkQuotesExpiring, checkOverdueInvoices, checkLateDeliveries, checkExpiringLots, runDailyBusinessChecks,
};
