const Customer = require("../models/Customer");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const SalesInvoice = require("../models/SalesInvoice");
const Product = require("../models/Product");
const stock = require("./stockService");
const pricing = require("./pricingService");
const { amountDue, round2 } = require("./salesCalc");
const { has } = require("./permissionService");
const { seesAllCustomers } = require("../permissions/permissions");

/**
 * ============================================================
 * SALES FLOW (négoce) — rules shared by orders, BLs and invoices
 * ============================================================
 *   repFilter(req)            "chacun ses clients": a rep without
 *                             sales.customers.viewAll only sees the
 *                             customers (and documents) assigned to them
 *   exposure(customer)        what the customer owes or will owe (TTC):
 *                             open invoices + validated BLs not invoiced
 *                             + confirmed orders not delivered yet
 *   checkCredit(...)          refuses beyond the credit limit / a blocked
 *                             account, unless the login may override
 *   priceLines(...)           fills the price of article lines left empty
 *                             with the customer's price level
 *   validateNote / cancelNote stock out / back for a BL; order follow-up
 *   invoiceDraftFromNotes     one invoice for one or several BLs
 * ============================================================
 */

const httpError = (message, status = 400, extra = {}) => Object.assign(new Error(message), { status, ...extra });

/** Filter on `customer` for the documents a login may see ({} = all). */
async function repFilter(req, companyId) {
  if (seesAllCustomers(req.user)) return {};
  const mine = await Customer.find({ company: companyId, salesRep: req.user.id }).select("_id").lean();
  return { customer: { $in: mine.map((c) => c._id) } };
}

/** Customer filter itself (for the customers list). */
function customerScope(req) {
  return seesAllCustomers(req.user) ? {} : { salesRep: req.user.id };
}

function canSeeCustomer(req, customer) {
  return seesAllCustomers(req.user) || String(customer?.salesRep || "") === String(req.user.id);
}

async function exposure(customerId) {
  const [invoices, notes, orders] = await Promise.all([
    SalesInvoice.find({ customer: customerId, status: { $in: ["issued", "partially_paid"] }, type: { $ne: "credit_note" } }).select("status type totalTTC amountPaid").lean(),
    DeliveryNote.find({ customer: customerId, type: "delivery", status: { $in: ["validated", "delivered"] }, invoice: null }).select("totalTTC").lean(),
    SalesOrder.find({ customer: customerId, status: { $in: ["confirmed", "partially_delivered"] } }).select("lines totalTTC").lean(),
  ]);
  const openInvoices = round2(invoices.reduce((s, i) => s + amountDue(i), 0));
  const uninvoicedNotes = round2(notes.reduce((s, n) => s + (n.totalTTC || 0), 0));
  // Part of each order not delivered yet (pro rata of the quantities).
  const undelivered = round2(orders.reduce((s, o) => {
    const q = o.lines.reduce((a, l) => a + l.quantity, 0);
    const d = o.lines.reduce((a, l) => a + Math.min(l.deliveredQuantity || 0, l.quantity), 0);
    return s + (q > 0 ? o.totalTTC * (1 - d / q) : 0);
  }, 0));
  return { openInvoices, uninvoicedNotes, undeliveredOrders: undelivered, total: round2(openInvoices + uninvoicedNotes + undelivered) };
}

/**
 * Throws 409 CREDIT_LIMIT when `extra` TTC would take the customer over
 * its limit (or the account is blocked). `override` (with the
 * "sales.customers.credit" permission) lets it through.
 */
async function checkCredit(req, customer, extra, { override = false, settings = null } = {}) {
  const s = settings || (await pricing.getSettings(customer.company));
  const canOverride = has(req.user, "sales.customers.credit");
  if (customer.blocked && !(override && canOverride)) {
    throw httpError(`Le compte de ${customer.name} est bloqué${customer.blockedReason ? ` : ${customer.blockedReason}` : ""}`, 409, { code: "CUSTOMER_BLOCKED" });
  }
  if (!s.blockOverCreditLimit || !(customer.creditLimit > 0)) return null;
  const exp = await exposure(customer._id);
  const after = round2(exp.total + (Number(extra) || 0));
  if (after > customer.creditLimit + 0.005) {
    if (override && canOverride) return { overridden: true, exposure: exp, after };
    throw httpError(`Plafond de crédit dépassé pour ${customer.name} : encours ${after} MAD pour un plafond de ${customer.creditLimit} MAD`, 409, { code: "CREDIT_LIMIT", exposure: exp, creditLimit: customer.creditLimit, after });
  }
  return { overridden: false, exposure: exp, after };
}

/** Article lines without a price get the customer's level price (and its discount). */
async function priceLines(lines, customer, companyId, { channel = "sales" } = {}) {
  const settings = await pricing.getSettings(companyId);
  const promotions = await require("./promotionService").activeFor(companyId);
  // Free goods are always recomputed here, never taken from the client.
  const paid = lines.filter((l) => !l.free);
  const ids = paid.filter((l) => l.product).map((l) => l.product?._id || l.product);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const priced = paid.map((l) => {
    const p = l.product && byId.get(String(l.product?._id || l.product));
    if (!p || (l.unitPrice !== null && l.unitPrice !== undefined && l.unitPrice !== "" && !Number.isNaN(Number(l.unitPrice)))) return l;
    const q = pricing.quoteLine(p, customer, settings, l.unit, { quantity: l.quantity, channel, promotions });
    return {
      ...l, unitPrice: q.unitPrice ?? 0, discount: l.discount ?? q.discount, vatRate: l.vatRate ?? q.vatRate, unit: l.unit || q.unit, unitFactor: l.unitFactor || q.unitFactor,
      ...(q.promotion ? { promotion: q.promotion._id } : {}),
    };
  });
  if (!promotions.length) return priced;
  const level = pricing.levelFor(settings, customer);
  const withFactor = priced.map((l) => {
    const p = l.product && byId.get(String(l.product?._id || l.product));
    const pack = p && l.unit && l.unit !== p.unit ? (p.packagings || []).find((x) => x.unit === l.unit) : null;
    return { ...l, product: l.product?._id || l.product, unitFactor: pack ? pack.factor : l.unitFactor || 1 };
  });
  return [...priced, ...require("./promotionService").freeLines(promotions, withFactor, byId, customer, { level, channel })];
}

/** Lines below cost / minimum price — refused without "sales.pricing.edit". */
async function checkFloors(req, lines, companyId) {
  const settings = await pricing.getSettings(companyId);
  if (!settings.blockBelowCost || has(req.user, "sales.pricing.edit")) return;
  const products = await Product.find({ _id: { $in: lines.filter((l) => l.product).map((l) => l.product) } }).lean();
  const issues = pricing.belowFloor(lines, new Map(products.map((p) => [String(p._id), p])));
  if (issues.length) {
    const i = issues[0];
    throw httpError(`Ligne ${i.index + 1} (${i.name}) : prix net ${i.net} MAD sous le ${i.reason === "below_cost" ? "prix de revient" : "prix minimum"} (${i.floor} MAD). Un responsable doit valider ce prix.`, 409, { code: "PRICE_FLOOR", issues });
  }
}

// ---------------------------------------------------------------- BL
/** draft → validated: goods leave the warehouse, each line keeps its CMUP. */
async function validateNote(note, actorId) {
  if (note.status !== "draft") throw httpError("Only a draft delivery note can be validated");
  const src = { kind: note.type === "return" ? "delivery_return" : "delivery", id: note._id, number: note.number };
  const order = note.salesOrder ? await SalesOrder.findById(note.salesOrder) : null;
  if (note.type === "return") {
    for (const l of note.lines) {
      if (!l.product) continue;
      // Returned at the cost they left with (if known), else current CMUP.
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(l.product);
      const cost = l.unitCost ?? p?.avgCost ?? 0;
      // eslint-disable-next-line no-await-in-loop
      await stock.receive({ product: p, warehouse: note.warehouse, quantity: l.quantity * (l.unitFactor || 1), unitCost: cost, lots: l.lots, reason: `Retour client ${note.number}`, source: src, actorId, customer: note.customer });
      l.unitCost = cost;
    }
  } else {
    // Check availability first, so a BL never half-leaves.
    for (const l of note.lines) {
      if (!l.product) continue;
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(l.product).select("name isService unit").lean();
      if (!p || p.isService) continue;
      // eslint-disable-next-line no-await-in-loop
      const lvl = await require("../models/StockLevel").findOne({ product: l.product, warehouse: note.warehouse }).lean();
      const need = l.quantity * (l.unitFactor || 1);
      if (!lvl || lvl.quantity + 1e-9 < need) throw httpError(`"${p.name}" : ${lvl ? lvl.quantity : 0} ${p.unit || ""} en stock dans ce dépôt, ${need} demandé(s)`, 409, { code: "OUT_OF_STOCK" });
    }
    for (const l of note.lines) {
      if (!l.product) continue;
      const qty = l.quantity * (l.unitFactor || 1);
      // The order's reservation for this article is released by what leaves.
      const orderLine = order ? order.lines.find((ol) => String(ol.product) === String(l.product)) : null;
      const reserved = orderLine && ["confirmed", "partially_delivered"].includes(order.status) ? Math.min(qty, Math.max(orderLine.quantity * (orderLine.unitFactor || 1) - (orderLine.deliveredQuantity || 0) * (orderLine.unitFactor || 1), 0)) : 0;
      // eslint-disable-next-line no-await-in-loop
      const out = await stock.issue({ product: l.product, warehouse: note.warehouse, quantity: qty, lots: l.lots, reason: `BL ${note.number}`, source: src, actorId, customer: note.customer, releaseReserved: reserved });
      l.unitCost = out.unitCost;
      l.lots = out.lots;
    }
  }
  note.status = "validated";
  note.validatedAt = new Date();
  note.history.push({ status: "validated", by: actorId });
  await note.save();
  if (order && note.type === "delivery") await followOrder(order, note, +1);
  return note;
}

/** validated / delivered → cancelled: goods go back in (at the cost they left with). */
async function cancelNote(note, actorId, reason = "") {
  if (note.status === "cancelled") throw httpError("Already cancelled");
  if (note.invoice) throw httpError("This delivery note is invoiced — make a credit note / return instead");
  if (["validated", "delivered"].includes(note.status)) {
    const src = { kind: note.type === "return" ? "delivery" : "delivery_return", id: note._id, number: note.number };
    for (const l of note.lines) {
      if (!l.product) continue;
      const qty = l.quantity * (l.unitFactor || 1);
      if (note.type === "return") {
        // eslint-disable-next-line no-await-in-loop
        await stock.issue({ product: l.product, warehouse: note.warehouse, quantity: qty, lots: l.lots, reason: `Annulation retour ${note.number}`, source: src, actorId });
      } else {
        // eslint-disable-next-line no-await-in-loop
        await stock.receive({ product: l.product, warehouse: note.warehouse, quantity: qty, unitCost: l.unitCost, lots: l.lots, reason: `Annulation BL ${note.number}`, source: src, actorId, customer: note.customer });
      }
    }
    if (note.salesOrder && note.type === "delivery") {
      const order = await SalesOrder.findById(note.salesOrder);
      if (order) await followOrder(order, note, -1);
    }
  }
  note.status = "cancelled";
  note.cancelReason = reason;
  note.history.push({ status: "cancelled", note: reason, by: actorId });
  await note.save();
  return note;
}

/** Order lines' deliveredQuantity and status after a BL is validated (+1) or cancelled (−1). */
async function followOrder(order, note, sign) {
  for (const nl of note.lines) {
    const ol = order.lines.find((l) => (nl.orderLine && String(l._id) === String(nl.orderLine)) || (l.product && String(l.product) === String(nl.product)));
    if (!ol) continue;
    const inOrderUnits = (nl.quantity * (nl.unitFactor || 1)) / (ol.unitFactor || 1);
    ol.deliveredQuantity = Math.max(round2((ol.deliveredQuantity || 0) + sign * inOrderUnits), 0);
  }
  if (["confirmed", "partially_delivered", "delivered"].includes(order.status)) {
    const all = order.lines.every((l) => (l.deliveredQuantity || 0) + 1e-9 >= l.quantity);
    const any = order.lines.some((l) => (l.deliveredQuantity || 0) > 0);
    order.status = all ? "delivered" : any ? "partially_delivered" : "confirmed";
  }
  await order.save();
}

/** Remaining to deliver of an order, as BL lines (in the order's units). */
function remainingLines(order) {
  return order.lines
    .map((l) => ({ ...(l.toObject ? l.toObject() : l), quantity: round2(l.quantity - (l.deliveredQuantity || 0)), orderLine: l._id }))
    .filter((l) => l.quantity > 1e-9)
    .map(({ _id, deliveredQuantity, ...rest }) => ({ ...rest, deliveredQuantity: 0 }));
}

/** Draft invoice grouping BLs of one customer. */
async function invoiceDraftFromNotes(notes, actorId) {
  if (!notes.length) throw httpError("Choose at least one delivery note");
  const customerId = String(notes[0].customer);
  for (const n of notes) {
    if (String(n.customer) !== customerId) throw httpError("Every delivery note must be for the same customer");
    if (n.type !== "delivery") throw httpError(`${n.number} is a return — make a credit note`);
    if (!["validated", "delivered"].includes(n.status)) throw httpError(`${n.number} isn't validated`);
    if (n.invoice) throw httpError(`${n.number} is already invoiced`);
  }
  const customer = await Customer.findById(customerId);
  const lines = notes.flatMap((n) => n.lines.map((l) => {
    const o = l.toObject ? l.toObject() : l;
    const { _id, deliveredQuantity, ...rest } = o;
    return { ...rest, description: notes.length > 1 ? `${rest.description} (${n.number})` : rest.description };
  }));
  const date = new Date();
  const { addDays } = require("../utils/salesHelpers");
  const invoice = await SalesInvoice.create({
    company: customer.company,
    type: "invoice",
    customer: customer._id,
    salesRep: notes[0].salesRep || customer.salesRep || null,
    salesOrder: notes.length === 1 ? notes[0].salesOrder : null,
    deliveryNotes: notes.map((n) => n._id),
    date,
    dueDate: addDays(date, customer.paymentDays ?? 60),
    subject: notes.length === 1 ? `BL ${notes[0].number}` : `BL ${notes.map((n) => n.number).join(", ")}`,
    lines,
    moveStock: false,
    status: "draft",
    createdBy: actorId,
    updatedBy: actorId,
  });
  await DeliveryNote.updateMany({ _id: { $in: notes.map((n) => n._id) } }, { $set: { invoice: invoice._id } });
  const orderIds = [...new Set(notes.map((n) => n.salesOrder && String(n.salesOrder)).filter(Boolean))];
  for (const id of orderIds) {
    // eslint-disable-next-line no-await-in-loop
    const order = await SalesOrder.findById(id);
    if (order && order.status === "delivered") {
      // eslint-disable-next-line no-await-in-loop
      const open = await DeliveryNote.exists({ salesOrder: id, status: { $in: ["validated", "delivered"] }, invoice: null });
      if (!open) { order.status = "invoiced"; await order.save(); } // eslint-disable-line no-await-in-loop
    }
  }
  return invoice;
}

/** Direct invoice (no BL): stock leaves / comes back when it's issued. */
async function moveInvoiceStock(invoice, actorId) {
  if (!invoice.moveStock || invoice.stockMovedAt) return;
  const isCredit = invoice.type === "credit_note";
  const src = { kind: isCredit ? "credit_note" : "invoice", id: invoice._id, number: invoice.number };
  if (!isCredit) {
    for (const l of invoice.lines) {
      if (!l.product) continue;
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(l.product).select("name isService").lean();
      if (!p || p.isService) continue;
      // eslint-disable-next-line no-await-in-loop
      const lvl = await require("../models/StockLevel").findOne({ product: l.product, warehouse: invoice.warehouse || (await stock.defaultWarehouse(invoice.company))._id }).lean();
      const need = l.quantity * (l.unitFactor || 1);
      if (!lvl || lvl.quantity + 1e-9 < need) throw httpError(`"${p.name}" : ${lvl ? lvl.quantity : 0} en stock, ${need} facturé(s)`, 409, { code: "OUT_OF_STOCK" });
    }
  }
  for (const l of invoice.lines) {
    if (!l.product) continue;
    const qty = l.quantity * (l.unitFactor || 1);
    if (isCredit) {
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(l.product);
      // eslint-disable-next-line no-await-in-loop
      await stock.receive({ product: p, warehouse: invoice.warehouse, quantity: qty, unitCost: l.unitCost ?? p.avgCost, lots: l.lots, reason: `Avoir ${invoice.number} (retour)`, source: src, actorId, customer: invoice.customer });
    } else {
      // eslint-disable-next-line no-await-in-loop
      const out = await stock.issue({ product: l.product, warehouse: invoice.warehouse, quantity: qty, lots: l.lots, reason: `Facture ${invoice.number}`, source: src, actorId, customer: invoice.customer });
      l.unitCost = out.unitCost;
      l.lots = out.lots;
    }
  }
  invoice.stockMovedAt = new Date();
}

/** validated → delivered (validates a draft first): who received, reserves, cash collected. */
async function markDelivered(note, body, actorId) {
  const str = (v, n) => String(v ?? "").trim().slice(0, n);
  if (note.status === "draft") await validateNote(note, actorId);
  if (note.status !== "validated") throw httpError("Only a validated delivery note can be marked delivered");
  note.status = "delivered";
  note.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : new Date();
  note.receivedBy = str(body.receivedBy, 120);
  note.reserves = str(body.reserves, 2000);
  if (body.cashCollected !== undefined) note.cashCollected = Math.max(Number(body.cashCollected) || 0, 0);
  note.history.push({ status: "delivered", note: note.reserves, by: actorId });
  await note.save();
}

module.exports = {
  markDelivered,
  httpError, repFilter, customerScope, canSeeCustomer, exposure, checkCredit, priceLines, checkFloors,
  validateNote, cancelNote, followOrder, remainingLines, invoiceDraftFromNotes, moveInvoiceStock,
};
