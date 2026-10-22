const mongoose = require("mongoose");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const StockLevel = require("../models/StockLevel");
const StockLot = require("../models/StockLot");
const InventoryMovement = require("../models/InventoryMovement");

/**
 * ============================================================
 * STOCK ENGINE — the only code that changes stock
 * ============================================================
 * Every document that moves goods (purchase reception, BL, counter
 * ticket, transfer, stock count, manual in/out) calls one of:
 *
 *   receive({ product, warehouse, quantity, unitCost, lots, ... })
 *        IN. With a unitCost the CMUP is recomputed:
 *          CMUP = (stock × CMUP + qty × cost) / (stock + qty)
 *        (stock = every warehouse; a negative stock counts as 0).
 *   issue({ product, warehouse, quantity, lots?, ... })
 *        OUT at the current CMUP — returns { unitCost, lots } so the
 *        document can keep its cost of goods sold (margin). Lot-tracked
 *        articles leave FEFO (first expiry first) unless lots are named.
 *   transfer({ product, from, to, quantity, ... })
 *        OUT of one warehouse, IN another, CMUP unchanged.
 *   setCount({ product, warehouse, counted, ... })
 *        stock count: brings the warehouse to the counted quantity.
 *   reserve / release({ product, warehouse, quantity })
 *        confirmed sales orders hold stock (StockLevel.reserved).
 *
 * Product.quantity (total), StockLevel (per warehouse), StockLot and
 * InventoryMovement are always updated together. Quantities are in the
 * article's base unit. Services (Product.isService) never move stock.
 * ============================================================
 */

const EPS = 1e-9;
const round = (n, d = 4) => Math.round((Number(n) || 0) * 10 ** d) / 10 ** d;

function stockError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

const idOf = (v) => (v && v._id ? v._id : v);

/** The company's default warehouse — created ("Dépôt principal") if it has none. */
async function defaultWarehouse(companyId) {
  let w = await Warehouse.findOne({ company: companyId, isDefault: true, isActive: true });
  if (w) return w;
  w = await Warehouse.findOne({ company: companyId, isActive: true }).sort({ createdAt: 1 });
  if (w) {
    w.isDefault = true;
    await w.save();
    return w;
  }
  return Warehouse.create({ company: companyId, code: "DEP1", name: "Dépôt principal", kind: "warehouse", isDefault: true, hasCounter: true });
}

async function resolveWarehouse(companyId, warehouse) {
  if (!warehouse) return defaultWarehouse(companyId);
  const w = warehouse._id ? warehouse : await Warehouse.findOne({ _id: warehouse, company: companyId });
  if (!w) throw stockError("Warehouse not found in this company", 404);
  if (w.isActive === false) throw stockError(`The warehouse "${w.name}" is closed`);
  return w;
}

async function loadProduct(product) {
  const p = product && product.save ? product : await Product.findById(idOf(product));
  if (!p) throw stockError("Article not found", 404);
  if (p.isVariantParent) throw stockError(`"${p.name}" is a model with variants — choose a variant`);
  return p;
}

async function levelOf(product, warehouse) {
  const filter = { product: product._id, warehouse: warehouse._id };
  let level = await StockLevel.findOne(filter);
  if (!level) level = await StockLevel.create({ ...filter, company: product.company, quantity: 0, reserved: 0 });
  return level;
}

async function record({ product, warehouse, type, quantity, warehouseQuantity, unitCost, lots, reason, source, actorId, customer, supplier }) {
  return InventoryMovement.create({
    company: product.company,
    product: product._id,
    warehouse: warehouse?._id || null,
    type,
    quantity: round(quantity),
    resultingQuantity: round(product.quantity),
    warehouseQuantity: warehouseQuantity === undefined ? null : round(warehouseQuantity),
    unitCost: unitCost === null || unitCost === undefined ? null : round(unitCost),
    avgCostAfter: round(product.avgCost || 0),
    lots: lots || [],
    reason,
    source: source || { kind: "manual" },
    customer: customer || null,
    supplier: supplier || null,
    performedBy: actorId,
  });
}

async function afterChange(product, previousQuantity, actorId) {
  try {
    await require("./businessNotifications").onStockChanged(product, previousQuantity, actorId);
  } catch (err) {
    console.error("stock alert failed:", err.message);
  }
}

// ---------------------------------------------------------------- lots
const tracked = (product) => !!product.tracking && product.tracking !== "none";

function normalizeLots(input, product) {
  if (!tracked(product)) return [];
  const list = (Array.isArray(input) ? input : []).map((l) => ({
    number: String(l?.number || "").trim(),
    quantity: Number(l?.quantity),
    expiryDate: l?.expiryDate ? new Date(l.expiryDate) : null,
  }));
  for (const l of list) {
    if (!l.number) throw stockError(`"${product.name}": every lot / serial needs a number`);
    if (!(l.quantity > 0)) throw stockError(`"${product.name}": invalid quantity for lot ${l.number}`);
    if (product.tracking === "serial" && Math.abs(l.quantity - 1) > EPS) throw stockError(`"${product.name}": a serial number is one unit (${l.number})`);
  }
  return list;
}

async function addLots(product, warehouse, lots, unitCost) {
  if (!tracked(product)) return;
  for (const l of lots) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await StockLot.findOne({ product: product._id, warehouse: warehouse._id, number: l.number });
    if (existing) {
      if (product.tracking === "serial" && existing.quantity > 0) throw stockError(`Serial number ${l.number} is already in stock`);
      existing.quantity = round(existing.quantity + l.quantity);
      if (l.expiryDate) existing.expiryDate = l.expiryDate;
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
    } else {
      // eslint-disable-next-line no-await-in-loop
      await StockLot.create({
        company: product.company, product: product._id, warehouse: warehouse._id, number: l.number,
        kind: product.tracking === "serial" ? "serial" : "lot",
        expiryDate: l.expiryDate || (product.shelfLifeDays ? new Date(Date.now() + product.shelfLifeDays * 86400000) : null),
        quantity: l.quantity, unitCost,
      });
    }
  }
}

/** Takes `quantity` out of the lots: the named ones, else FEFO. Returns what was taken. */
async function takeLots(product, warehouse, quantity, named) {
  if (!tracked(product)) return [];
  const taken = [];
  if (named.length) {
    const total = named.reduce((s, l) => s + l.quantity, 0);
    if (Math.abs(total - quantity) > EPS) throw stockError(`"${product.name}": the lots add up to ${total}, not ${quantity}`);
    for (const l of named) {
      // eslint-disable-next-line no-await-in-loop
      const lot = await StockLot.findOne({ product: product._id, warehouse: warehouse._id, number: l.number });
      if (!lot || lot.quantity + EPS < l.quantity) throw stockError(`"${product.name}": lot ${l.number} has only ${lot ? lot.quantity : 0}`);
      lot.quantity = round(lot.quantity - l.quantity);
      // eslint-disable-next-line no-await-in-loop
      await lot.save();
      taken.push({ number: lot.number, quantity: l.quantity, expiryDate: lot.expiryDate });
    }
    return taken;
  }
  const lots = await StockLot.find({ product: product._id, warehouse: warehouse._id, quantity: { $gt: 0 } }).lean();
  // FEFO: expiring first (no expiry last), then oldest received.
  lots.sort((a, b) => {
    const ea = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
    const eb = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
    if (ea !== eb) return ea - eb;
    return new Date(a.receivedAt || a.createdAt) - new Date(b.receivedAt || b.createdAt);
  });
  let left = quantity;
  for (const lot of lots) {
    if (left <= EPS) break;
    const q = Math.min(lot.quantity, left);
    // eslint-disable-next-line no-await-in-loop
    await StockLot.updateOne({ _id: lot._id }, { $set: { quantity: round(lot.quantity - q) } });
    taken.push({ number: lot.number, quantity: round(q), expiryDate: lot.expiryDate });
    left = round(left - q);
  }
  if (left > EPS) throw stockError(`"${product.name}": not enough in the lots (${round(quantity - left)} of ${quantity})`);
  return taken;
}

// ---------------------------------------------------------------- moves
/**
 * IN: purchase reception, customer return, opening stock, manual entry.
 * unitCost (HT, base unit) null → the CMUP doesn't change.
 */
async function receive({ product, warehouse, quantity, unitCost = null, lots = [], reason, source, actorId, supplier = null, customer = null, isPurchase = false }) {
  const p = await loadProduct(product);
  if (p.isService) return { product: p, unitCost: null, lots: [] };
  const q = Number(quantity);
  if (!(q > 0)) throw stockError(`"${p.name}": the quantity must be positive`);
  const w = await resolveWarehouse(p.company, warehouse);
  const lotList = normalizeLots(lots, p);
  if (tracked(p)) {
    const total = lotList.reduce((s, l) => s + l.quantity, 0);
    if (Math.abs(total - q) > EPS) throw stockError(`"${p.name}" is tracked by ${p.tracking === "serial" ? "serial number" : "lot"}: enter the ${p.tracking === "serial" ? "serial numbers" : "lots"} (${total} of ${q})`);
  }

  const before = p.quantity || 0;
  if (unitCost !== null && unitCost !== undefined && Number.isFinite(Number(unitCost))) {
    const base = Math.max(before, 0);
    const cost = Number(unitCost);
    p.avgCost = round(base + q > 0 ? (base * (p.avgCost || 0) + q * cost) / (base + q) : cost);
    if (isPurchase) {
      p.lastPurchasePrice = cost;
      p.lastPurchaseAt = new Date();
    }
  }
  await addLots(p, w, lotList, unitCost);
  const level = await levelOf(p, w);
  level.quantity = round(level.quantity + q);
  level.lastMovementAt = new Date();
  await level.save();
  p.quantity = round(before + q);
  p.updatedBy = actorId || p.updatedBy;
  await p.save();
  await record({ product: p, warehouse: w, type: "in", quantity: q, warehouseQuantity: level.quantity, unitCost: unitCost ?? p.avgCost, lots: lotList, reason, source, actorId, supplier, customer });
  await afterChange(p, before, actorId);
  return { product: p, unitCost: unitCost ?? p.avgCost, lots: lotList };
}

/**
 * OUT: BL, counter ticket, supplier return, breakage. At the CMUP.
 * allowNegative is only used by stock counts (never by sales).
 */
async function issue({ product, warehouse, quantity, lots = [], reason, source, actorId, customer = null, supplier = null, releaseReserved = 0 }) {
  const p = await loadProduct(product);
  if (p.isService) return { product: p, unitCost: 0, lots: [] };
  const q = Number(quantity);
  if (!(q > 0)) throw stockError(`"${p.name}": the quantity must be positive`);
  const w = await resolveWarehouse(p.company, warehouse);
  const level = await levelOf(p, w);
  if (level.quantity + EPS < q) {
    throw stockError(`"${p.name}": only ${round(level.quantity, 3)} ${p.unit || ""} in ${w.name}, can't take out ${q}`.replace(/\s+,/, ","));
  }
  const taken = await takeLots(p, w, q, normalizeLots(lots, p));
  const before = p.quantity || 0;
  level.quantity = round(level.quantity - q);
  if (releaseReserved > 0) level.reserved = Math.max(round(level.reserved - releaseReserved), 0);
  level.lastMovementAt = new Date();
  await level.save();
  p.quantity = round(before - q);
  p.updatedBy = actorId || p.updatedBy;
  await p.save();
  const unitCost = p.avgCost || 0;
  await record({ product: p, warehouse: w, type: "out", quantity: q, warehouseQuantity: level.quantity, unitCost, lots: taken, reason, source, actorId, customer, supplier });
  await afterChange(p, before, actorId);
  return { product: p, unitCost, lots: taken };
}

/** Between two warehouses of the company. CMUP unchanged; lots follow. */
async function transfer({ product, from, to, quantity, lots = [], reason, source, actorId }) {
  const p = await loadProduct(product);
  const q = Number(quantity);
  if (!(q > 0)) throw stockError(`"${p.name}": the quantity must be positive`);
  const wFrom = await resolveWarehouse(p.company, from);
  const wTo = await resolveWarehouse(p.company, to);
  if (String(wFrom._id) === String(wTo._id)) throw stockError("Choose two different warehouses");
  const lFrom = await levelOf(p, wFrom);
  if (lFrom.quantity + EPS < q) throw stockError(`"${p.name}": only ${round(lFrom.quantity, 3)} in ${wFrom.name}`);
  const taken = await takeLots(p, wFrom, q, normalizeLots(lots, p));
  await addLots(p, wTo, taken, null);
  lFrom.quantity = round(lFrom.quantity - q);
  lFrom.lastMovementAt = new Date();
  await lFrom.save();
  const lTo = await levelOf(p, wTo);
  lTo.quantity = round(lTo.quantity + q);
  lTo.lastMovementAt = new Date();
  await lTo.save();
  const cost = p.avgCost || 0;
  await record({ product: p, warehouse: wFrom, type: "transfer_out", quantity: q, warehouseQuantity: lFrom.quantity, unitCost: cost, lots: taken, reason: reason || `Transfert vers ${wTo.name}`, source, actorId });
  await record({ product: p, warehouse: wTo, type: "transfer_in", quantity: q, warehouseQuantity: lTo.quantity, unitCost: cost, lots: taken, reason: reason || `Transfert depuis ${wFrom.name}`, source, actorId });
  return { product: p, lots: taken };
}

/**
 * Stock count: brings (article, warehouse) to `counted`. A gain enters
 * at the CMUP (no revaluation), a loss leaves at the CMUP.
 */
async function setCount({ product, warehouse, counted, reason, source, actorId, lots = [] }) {
  const p = await loadProduct(product);
  const w = await resolveWarehouse(p.company, warehouse);
  const target = Number(counted);
  if (!Number.isFinite(target) || target < 0) throw stockError(`"${p.name}": invalid counted quantity`);
  const level = await levelOf(p, w);
  const diff = round(target - level.quantity);
  if (Math.abs(diff) <= EPS) return { product: p, difference: 0 };
  const before = p.quantity || 0;
  let lotsMoved = [];
  if (tracked(p)) {
    if (diff > 0) {
      lotsMoved = normalizeLots(lots, p);
      if (!lotsMoved.length) lotsMoved = [{ number: `INV-${new Date().toISOString().slice(0, 10)}`, quantity: diff, expiryDate: null }];
      await addLots(p, w, lotsMoved, null);
    } else {
      lotsMoved = await takeLots(p, w, -diff, normalizeLots(lots, p));
    }
  }
  level.quantity = target;
  level.lastMovementAt = new Date();
  await level.save();
  p.quantity = round(before + diff);
  p.updatedBy = actorId || p.updatedBy;
  await p.save();
  await record({ product: p, warehouse: w, type: "adjustment", quantity: Math.abs(diff), warehouseQuantity: target, unitCost: p.avgCost || 0, lots: lotsMoved, reason: reason || (diff > 0 ? "Inventaire : écart positif" : "Inventaire : écart négatif"), source: source || { kind: "count" }, actorId });
  await afterChange(p, before, actorId);
  return { product: p, difference: diff };
}

/** Confirmed order: holds stock in a warehouse (can go beyond what's there — it's a need). */
async function reserve({ product, warehouse, quantity }) {
  const p = await loadProduct(product);
  if (p.isService) return;
  const w = await resolveWarehouse(p.company, warehouse);
  const level = await levelOf(p, w);
  level.reserved = round(level.reserved + Number(quantity));
  await level.save();
}

async function release({ product, warehouse, quantity }) {
  const p = await loadProduct(product);
  if (p.isService) return;
  const w = await resolveWarehouse(p.company, warehouse);
  const level = await levelOf(p, w);
  level.reserved = Math.max(round(level.reserved - Number(quantity)), 0);
  await level.save();
}

/** { warehouseId: { quantity, reserved, available } } for some articles. */
async function levelsByProduct(companyId, productIds) {
  const rows = await StockLevel.find({ company: companyId, product: { $in: productIds.map((id) => new mongoose.Types.ObjectId(String(id))) } }).lean();
  const out = {};
  for (const r of rows) {
    const key = String(r.product);
    out[key] = out[key] || {};
    out[key][String(r.warehouse)] = { quantity: r.quantity, reserved: r.reserved, available: round(r.quantity - r.reserved) };
  }
  return out;
}

async function available(product, warehouse) {
  const level = await StockLevel.findOne({ product: idOf(product), warehouse: idOf(warehouse) }).lean();
  return level ? round(level.quantity - level.reserved) : 0;
}

/**
 * Legacy entry point (xframe): manual +/- from the article page and the
 * purchase module. type in/out/adjustment; adjustment = absolute value
 * in the default warehouse.
 */
async function applyMovement({ product, type, quantity, reason, actorId, unitCost = null, warehouse = null, lots = [], source = null, supplier = null }) {
  if (type === "in") return (await receive({ product, warehouse, quantity, unitCost, lots, reason, source: source || { kind: "manual" }, actorId, supplier, isPurchase: source?.kind === "purchase" })).product;
  if (type === "out") return (await issue({ product, warehouse, quantity, lots, reason, source: source || { kind: "manual" }, actorId, supplier })).product;
  return (await setCount({ product, warehouse, counted: quantity, reason, source: source || { kind: "manual" }, actorId, lots })).product;
}

module.exports = {
  defaultWarehouse,
  resolveWarehouse,
  receive,
  issue,
  transfer,
  setCount,
  reserve,
  release,
  levelsByProduct,
  available,
  applyMovement,
  stockError,
  round,
};
