const mongoose = require("mongoose");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const { createWithNumber } = require("./documentNumberService");
const { lineOutstanding } = require("./purchaseOrderCalc");

/**
 * ============================================================
 * PURCHASE FORECAST → PURCHASE ORDERS
 * ============================================================
 * For each article: what sells per day (90 days of invoices and counter
 * tickets, credit notes deducted — the dashboard's stockout pace), stock on hand, what is already
 * on order, the supplier's lead time. It needs ordering when the stock
 * + incoming won't last the lead time + a safety margin (or is under
 * its minimum). Suggested quantity = enough for lead time + cover days,
 * + the minimum, − on hand − incoming, rounded up to the carton.
 * Supplier = the cheapest of the article's supplier prices.
 * One click makes one draft purchase order per supplier.
 * ============================================================
 */
const DAY = 86400000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function forecast(companyId, { coverDays = 30, safetyDays = 7, defaultLead = 15, now = new Date() } = {}) {
  const company = new mongoose.Types.ObjectId(String(companyId));
  const since = new Date(now.getTime() - 90 * DAY);
  const [products, moves, open, suppliers] = await Promise.all([
    Product.find({ company, isService: { $ne: true }, isVariantParent: { $ne: true }, isActive: { $ne: false } })
      .select("name internalReference unit quantity threshold prices packagings avgCost category").lean(),
    require("./analyticsService").articleSales(companyId, {}, true, since),
    PurchaseOrder.find({ company, status: { $in: ["draft", "pending_approval", "sent", "partially_received"] } }).select("number status lines").lean(),
    Supplier.find({ company, isActive: { $ne: false } }).select("name leadTimeDays").lean(),
  ]);
  const out = new Map([...moves].map(([k, v]) => [k, v.units]));
  const incoming = new Map();
  const onOrders = new Map();
  for (const o of open) {
    for (const l of o.lines || []) {
      if (!l.product) continue;
      const k = String(l.product);
      incoming.set(k, (incoming.get(k) || 0) + lineOutstanding(l));
      if (!onOrders.has(k)) onOrders.set(k, []);
      onOrders.get(k).push(o.number);
    }
  }
  const supplierById = new Map(suppliers.map((s) => [String(s._id), s]));
  const supplierByName = new Map(suppliers.map((s) => [s.name.toLowerCase(), s]));
  const rows = [];
  for (const p of products) {
    const k = String(p._id);
    const perDay = Math.max(out.get(k) || 0, 0) / 90;
    const onHand = Math.max(p.quantity || 0, 0);
    const coming = incoming.get(k) || 0;
    const threshold = Number(p.threshold) || 0;
    if (perDay <= 0 && (threshold <= 0 || onHand + coming > threshold)) continue;
    const offers = (p.prices || [])
      .map((x) => ({ price: x.price, supplierName: x.supplierName, supplierReference: x.supplierReference, supplier: (x.supplier && supplierById.get(String(x.supplier))) || supplierByName.get(String(x.supplierName || "").toLowerCase()) || null }))
      .sort((a, b) => a.price - b.price);
    const best = offers.find((o) => o.supplier) || null;
    const lead = best?.supplier?.leadTimeDays ?? defaultLead;
    const daysLeft = perDay > 0 ? onHand / perDay : null;
    const daysWithIncoming = perDay > 0 ? (onHand + coming) / perDay : null;
    const needed = perDay * (lead + coverDays + safetyDays) + threshold - onHand - coming;
    const urgent = (daysWithIncoming !== null && daysWithIncoming <= lead + safetyDays) || onHand + coming <= threshold;
    if (!urgent || needed <= 0) continue;
    const cartons = (p.packagings || []).filter((x) => x.factor > 1).sort((a, b) => a.factor - b.factor);
    const pack = cartons[0] || null;
    const quantity = pack ? Math.ceil(needed / pack.factor) * pack.factor : Math.ceil(needed);
    rows.push({
      product: { _id: p._id, name: p.name, internalReference: p.internalReference, unit: p.unit },
      onHand, incoming: round2(coming), onOrders: onOrders.get(k) || [], threshold,
      perDay: round2(perDay), daysLeft: daysLeft === null ? null : Math.floor(daysLeft),
      stockoutDate: daysLeft === null ? null : new Date(now.getTime() + Math.floor(daysLeft) * DAY),
      leadTimeDays: lead, quantity, pack: pack ? { unit: pack.unit, factor: pack.factor, count: Math.ceil(needed / pack.factor) } : null,
      supplier: best?.supplier ? { _id: best.supplier._id, name: best.supplier.name } : null,
      unitPrice: best ? best.price : p.avgCost || 0, amount: round2(quantity * (best ? best.price : p.avgCost || 0)),
      offers: offers.slice(0, 4).map((o) => ({ price: o.price, supplierName: o.supplier?.name || o.supplierName, supplier: o.supplier?._id || null })),
      priority: daysLeft === null ? 2 : daysLeft <= lead ? 0 : 1, // 0 = will run out before the goods can arrive
    });
  }
  rows.sort((a, b) => a.priority - b.priority || (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
  const bySupplier = new Map();
  for (const r of rows) {
    const k = r.supplier ? String(r.supplier._id) : "none";
    if (!bySupplier.has(k)) bySupplier.set(k, { supplier: r.supplier, count: 0, amount: 0 });
    const g = bySupplier.get(k);
    g.count += 1;
    g.amount = round2(g.amount + r.amount);
  }
  return { rows, suppliers: [...bySupplier.values()], params: { coverDays, safetyDays, defaultLead } };
}

/** lines: [{ product, quantity, supplier, unitPrice? }] → one draft order per supplier. */
async function createOrders(companyId, lines, { warehouse = null, actorId } = {}) {
  const groups = new Map();
  for (const l of lines || []) {
    if (!l.supplier || !mongoose.Types.ObjectId.isValid(String(l.supplier)) || !(Number(l.quantity) > 0)) continue;
    const k = String(l.supplier);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(l);
  }
  if (!groups.size) throw Object.assign(new Error("Choose the articles to order and their supplier"), { status: 400 });
  const productIds = [...groups.values()].flat().map((l) => l.product);
  const products = new Map((await Product.find({ _id: { $in: productIds }, company: companyId }).select("name unit vatRate prices avgCost").lean()).map((p) => [String(p._id), p]));
  const orders = [];
  for (const [supplierId, list] of groups) {
    const supplier = await Supplier.findOne({ _id: supplierId, company: companyId }).select("name leadTimeDays").lean();
    if (!supplier) throw Object.assign(new Error("Supplier not found in this company"), { status: 400 });
    const orderLines = list.map((l) => {
      const p = products.get(String(l.product));
      if (!p) throw Object.assign(new Error("Article not found in this company"), { status: 400 });
      const offer = (p.prices || []).find((x) => String(x.supplier || "") === supplierId || x.supplierName?.toLowerCase() === supplier.name.toLowerCase());
      const price = l.unitPrice !== undefined && l.unitPrice !== "" && Number(l.unitPrice) >= 0 ? Number(l.unitPrice) : offer?.price ?? p.avgCost ?? 0;
      return { product: p._id, description: offer?.supplierReference ? `${p.name} (réf. ${offer.supplierReference})` : p.name, quantity: Number(l.quantity), unit: p.unit, unitPrice: price, vatRate: p.vatRate ?? 20 };
    });
    const order = await createWithNumber(PurchaseOrder, {
      company: companyId, supplier: supplierId, date: new Date(), lines: orderLines, warehouse: warehouse || null, status: "draft",
      expectedDate: new Date(Date.now() + (supplier.leadTimeDays ?? 15) * DAY),
      notes: "Commande proposée par la prévision de rupture", createdBy: actorId, updatedBy: actorId,
    }, "BC");
    orders.push({ _id: order._id, number: order.number, supplier: { _id: supplier._id, name: supplier.name }, lines: orderLines.length, totalHT: order.totalHT });
  }
  return orders;
}

module.exports = { forecast, createOrders };
