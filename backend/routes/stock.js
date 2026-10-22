const express = require("express");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const Product = require("../models/Product");
const StockLevel = require("../models/StockLevel");
const StockLot = require("../models/StockLot");
const InventoryMovement = require("../models/InventoryMovement");
const StockTransfer = require("../models/StockTransfer");
const StockCount = require("../models/StockCount");
const Warehouse = require("../models/Warehouse");
require("../models/Supplier"); // populated on movements
require("../models/Customer");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { hideMoney } = require("../middleware/hideMoney");
const { createWithNumber } = require("../services/documentNumberService");
const { withDescendants } = require("../services/categoryTree");
const { searchFilter } = require("../utils/searchTokens");
const { logAudit } = require("../services/auditLogger");
const stock = require("../services/stockService");

/**
 * ============================================================
 * STOCK — /api/stock
 * ============================================================
 * GET  /levels?companyId=&warehouse=&category=&search=&lowOnly=   stock per warehouse
 * GET  /valuation?companyId=&warehouse=&format=xlsx                value at CMUP
 * GET  /movements?companyId=&warehouse=&product=&kind=&from=&to=&page=
 * GET  /expiring?companyId=&days=60                                lots expiring soon
 * PATCH /levels/:productId/:warehouseId { location, minQuantity }
 *
 * Transfers (TF-…):   GET /transfers · GET /transfers/:id · POST /transfers
 *                     POST /transfers/:id/send · POST /transfers/:id/receive { lines:[{lineId, receivedQuantity}] }
 *                     POST /transfers/:id/cancel
 * Counts (INV-…):     GET /counts · GET /counts/:id · POST /counts { warehouse, category?, products? }
 *                     PUT /counts/:id { lines:[{lineId, counted, note}] } · POST /counts/:id/validate · POST /counts/:id/cancel
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.stock));
router.use(hideMoney(["avgCost", "unitCost", "value", "gapValue", "totalValue", "avgCostAfter"]));

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const fail = (res, error, message) => {
  if (error.status) return bad(res, error.message, error.status);
  console.error(message, error);
  return res.status(500).json({ success: false, message, error: error.message });
};
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function productFilter(q) {
  const filter = { company: oid(q.companyId), isVariantParent: { $ne: true }, isService: { $ne: true } };
  if (q.category && isId(q.category)) {
    const ids = await withDescendants(q.companyId, q.category);
    filter.category = { $in: (ids.length ? ids : [q.category]).map(oid) };
  }
  if (q.brand && isId(q.brand)) filter.brand = oid(q.brand);
  const search = searchFilter(q.search);
  if (search) Object.assign(filter, search);
  return filter;
}

// ---------------------------------------------------------------- levels
//
// One page of articles with their stock per warehouse. The "low" / "in
// stock" filters, the paging, the count and the total value are computed
// by MongoDB — the articles of other pages are never loaded. For a
// warehouse, its own quantity (StockLevel) is joined in the database.
//
// "Below minimum" only concerns articles that HAVE a minimum: overall, the
// article's threshold (company-wide); in a warehouse, that warehouse's own
// minimum (StockLevel.minQuantity) — a showroom shelf isn't held to the
// whole company's minimum.
const LEVEL_FIELDS = { name: 1, internalReference: 1, barcode: 1, unit: 1, quantity: 1, threshold: 1, maxQuantity: 1, avgCost: 1, category: 1, brand: 1, tracking: 1, "image.thumbUrl": 1 };

router.get("/levels", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const page = Math.max(Math.floor(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(Math.floor(Number(req.query.limit)) || 50, 1), 100);
    const filter = await productFilter(req.query);
    const wh = isId(req.query.warehouse) ? oid(req.query.warehouse) : null;
    const lowOnly = req.query.lowOnly === "true";
    const inStockOnly = req.query.inStockOnly === "true";

    const pipeline = [{ $match: filter }];
    if (wh) {
      pipeline.push(
        { $lookup: { from: StockLevel.collection.name, localField: "_id", foreignField: "product", as: "lv" } },
        { $addFields: { here: { $first: { $filter: { input: "$lv", as: "l", cond: { $eq: ["$$l.warehouse", wh] } } } } } },
        { $addFields: { shownQuantity: { $ifNull: ["$here.quantity", 0] }, minHere: { $ifNull: ["$here.minQuantity", 0] } } },
        { $project: { lv: 0, here: 0 } },
      );
      if (lowOnly) pipeline.push({ $match: { $expr: { $and: [{ $gt: ["$minHere", 0] }, { $lte: ["$shownQuantity", "$minHere"] }] } } });
    } else {
      pipeline.push({ $addFields: { shownQuantity: { $ifNull: ["$quantity", 0] }, minHere: { $ifNull: ["$threshold", 0] } } });
      if (lowOnly) pipeline.push({ $match: { $expr: { $and: [{ $gt: ["$minHere", 0] }, { $lte: ["$shownQuantity", "$minHere"] }] } } });
    }
    if (inStockOnly) pipeline.push({ $match: { shownQuantity: { $gt: 0 } } });
    pipeline.push({
      $facet: {
        rows: [{ $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: { ...LEVEL_FIELDS, shownQuantity: 1, minHere: 1 } }],
        total: [{ $count: "n" }],
        value: [{ $group: { _id: null, v: { $sum: { $multiply: ["$shownQuantity", { $ifNull: ["$avgCost", 0] }] } } } }],
      },
    });
    const [result] = await Product.aggregate(pipeline);
    const pageRows = await Product.populate(result?.rows || [], [{ path: "category", select: "name icon color parent" }, { path: "brand", select: "name" }]);
    const total = result?.total?.[0]?.n || 0;
    const totalValue = r2(result?.value?.[0]?.v || 0);

    const [warehouses, levels] = await Promise.all([
      Warehouse.find({ company: req.query.companyId, isActive: true }).select("code name kind isDefault").sort({ isDefault: -1, code: 1 }).lean(),
      stock.levelsByProduct(req.query.companyId, pageRows.map((p) => p._id)),
    ]);
    const rows = pageRows.map(({ image, minHere, ...p }) => {
      const byWh = levels[String(p._id)] || {};
      const reserved = Object.values(byWh).reduce((s, l) => s + (l.reserved || 0), 0);
      const here = wh ? byWh[String(wh)] || { quantity: 0, reserved: 0, available: 0 } : null;
      const qty = p.shownQuantity;
      return {
        ...p,
        thumbnail: image?.thumbUrl || "",
        minimum: minHere || 0,
        byWarehouse: byWh,
        reserved: stock.round(here ? here.reserved : reserved),
        available: stock.round(here ? here.available : (p.quantity || 0) - reserved),
        value: r2(qty * (p.avgCost || 0)),
        low: minHere > 0 && qty <= minHere,
      };
    });
    const pages = Math.ceil(total / limit) || 1;
    res.json({ success: true, data: { warehouses, rows, totalValue }, pagination: { total, page, limit, pages, hasNext: page < pages, hasPrevious: page > 1 } });
  } catch (error) {
    fail(res, error, "Error fetching stock levels");
  }
});

// ---------------------------------------------------------------- summary
//
// The warehouse cards: per warehouse, how many articles are in stock, how
// many are at or below their minimum, units and value — plus the same for
// the whole company. A handful of numbers, grouped by MongoDB.
router.get("/summary", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const company = oid(req.query.companyId);
    const [warehouses, perWarehouse, overall] = await Promise.all([
      Warehouse.find({ company, isActive: true }).select("code name kind city isDefault hasCounter").sort({ isDefault: -1, code: 1 }).lean(),
      StockLevel.aggregate([
        { $match: { company } },
        { $lookup: { from: Product.collection.name, localField: "product", foreignField: "_id", as: "p" } },
        { $unwind: "$p" },
        { $match: { "p.isService": { $ne: true }, "p.isVariantParent": { $ne: true } } },
        { $addFields: { min: { $ifNull: ["$minQuantity", 0] } } },
        {
          $group: {
            _id: "$warehouse",
            inStock: { $sum: { $cond: [{ $gt: ["$quantity", 0] }, 1, 0] } },
            low: { $sum: { $cond: [{ $and: [{ $gt: ["$min", 0] }, { $lte: ["$quantity", "$min"] }] }, 1, 0] } },
            reserved: { $sum: { $cond: [{ $gt: ["$reserved", 0] }, 1, 0] } },
            value: { $sum: { $multiply: ["$quantity", { $ifNull: ["$p.avgCost", 0] }] } },
          },
        },
      ]),
      Product.aggregate([
        { $match: { company, isService: { $ne: true }, isVariantParent: { $ne: true } } },
        {
          $group: {
            _id: null,
            articles: { $sum: 1 },
            inStock: { $sum: { $cond: [{ $gt: ["$quantity", 0] }, 1, 0] } },
            out: { $sum: { $cond: [{ $lte: ["$quantity", 0] }, 1, 0] } },
            low: { $sum: { $cond: [{ $and: [{ $gt: ["$threshold", 0] }, { $lte: ["$quantity", "$threshold"] }] }, 1, 0] } },
            value: { $sum: { $multiply: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$avgCost", 0] }] } },
          },
        },
      ]),
    ]);
    const byWh = new Map(perWarehouse.map((g) => [String(g._id), g]));
    const all = overall[0] || { articles: 0, inStock: 0, out: 0, low: 0, value: 0 };
    res.json({
      success: true,
      data: {
        overall: { articles: all.articles, inStock: all.inStock, out: all.out, low: all.low, value: r2(all.value) },
        warehouses: warehouses.map((w) => {
          const g = byWh.get(String(w._id)) || {};
          return { ...w, inStock: g.inStock || 0, low: g.low || 0, reserved: g.reserved || 0, value: r2(g.value || 0) };
        }),
      },
    });
  } catch (error) {
    fail(res, error, "Error fetching the stock summary");
  }
});

router.patch("/levels/:productId/:warehouseId", async (req, res) => {
  try {
    const { productId, warehouseId } = req.params;
    if (!isId(productId) || !isId(warehouseId)) return bad(res, "Invalid IDs");
    const product = await Product.findById(productId).select("company").lean();
    if (!product) return bad(res, "Article not found", 404);
    let level = await StockLevel.findOne({ product: productId, warehouse: warehouseId });
    if (!level) level = new StockLevel({ company: product.company, product: productId, warehouse: warehouseId });
    if (req.body.location !== undefined) level.location = String(req.body.location || "").trim().slice(0, 40);
    if (req.body.minQuantity !== undefined) level.minQuantity = req.body.minQuantity === "" || req.body.minQuantity === null ? null : Math.max(Number(req.body.minQuantity) || 0, 0);
    await level.save();
    res.json({ success: true, data: level });
  } catch (error) {
    fail(res, error, "Error updating the stock level");
  }
});

// ---------------------------------------------------------------- valuation
router.get("/valuation", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const products = await Product.find(await productFilter(req.query)).select("name internalReference unit quantity avgCost category").populate("category", "name").lean();
    let rows;
    if (isId(req.query.warehouse)) {
      const levels = await StockLevel.find({ warehouse: req.query.warehouse }).lean();
      const byP = new Map(levels.map((l) => [String(l.product), l.quantity]));
      rows = products.map((p) => ({ ...p, quantity: byP.get(String(p._id)) || 0 }));
    } else rows = products;
    rows = rows.filter((p) => Math.abs(p.quantity || 0) > 1e-9).map((p) => ({ _id: p._id, name: p.name, internalReference: p.internalReference, category: p.category?.name || "", unit: p.unit, quantity: p.quantity, avgCost: p.avgCost || 0, value: r2((p.quantity || 0) * (p.avgCost || 0)) }));
    const byCategory = {};
    rows.forEach((r) => { byCategory[r.category || "—"] = r2((byCategory[r.category || "—"] || 0) + r.value); });
    const totalValue = r2(rows.reduce((s, r) => s + r.value, 0));
    if (req.query.format !== "xlsx") return res.json({ success: true, data: { rows, byCategory, totalValue } });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Valorisation CMUP");
    ws.addRow([`Valorisation du stock au CMUP — ${new Date().toLocaleDateString("fr-FR")}`]).font = { bold: true };
    ws.addRow(["Référence", "Article", "Famille", "Unité", "Quantité", "CMUP HT", "Valeur HT"]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.internalReference || "", r.name, r.category, r.unit, r.quantity, r.avgCost, r.value]));
    ws.addRow([]);
    ws.addRow(["", "", "", "", "", "Total", totalValue]).font = { bold: true };
    [6, 7].forEach((c) => { ws.getColumn(c).numFmt = "#,##0.00"; ws.getColumn(c).width = 14; });
    ws.getColumn(2).width = 40;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="valorisation-stock.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    fail(res, error, "Error computing the valuation");
  }
});

// ---------------------------------------------------------------- movements
router.get("/movements", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const filter = { company: req.query.companyId };
    if (isId(req.query.warehouse)) filter.warehouse = req.query.warehouse;
    if (isId(req.query.product)) filter.product = req.query.product;
    if (req.query.kind) filter["source.kind"] = req.query.kind;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) { const to = new Date(req.query.to); to.setHours(23, 59, 59, 999); filter.createdAt.$lte = to; }
    }
    const [rows, total] = await Promise.all([
      InventoryMovement.find(filter).populate("product", "name internalReference unit").populate("warehouse", "code name").populate("performedBy", "firstName lastName").populate("customer", "name").populate("supplier", "name")
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      InventoryMovement.countDocuments(filter),
    ]);
    res.json({ success: true, data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 } });
  } catch (error) {
    fail(res, error, "Error fetching movements");
  }
});

router.get("/expiring", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const days = Math.min(Math.max(Number(req.query.days) || 60, 1), 730);
    const limitDate = new Date(Date.now() + days * 86400000);
    const lots = await StockLot.find({ company: req.query.companyId, quantity: { $gt: 0 }, expiryDate: { $ne: null, $lte: limitDate } })
      .populate("product", "name internalReference unit").populate("warehouse", "code name").sort({ expiryDate: 1 }).lean();
    res.json({ success: true, data: lots.map((l) => ({ ...l, expired: new Date(l.expiryDate) < new Date() })) });
  } catch (error) {
    fail(res, error, "Error fetching expiring lots");
  }
});

// ---------------------------------------------------------------- transfers
const TRANSFER_POPULATE = [
  { path: "from", select: "code name" }, { path: "to", select: "code name" },
  { path: "lines.product", select: "name internalReference unit tracking" },
  { path: "sentBy", select: "firstName lastName" }, { path: "receivedBy", select: "firstName lastName" },
];

router.get("/transfers", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const filter = { company: req.query.companyId };
    if (req.query.status) filter.status = req.query.status;
    if (isId(req.query.warehouse)) filter.$or = [{ from: req.query.warehouse }, { to: req.query.warehouse }];
    res.json({ success: true, data: await StockTransfer.find(filter).populate(TRANSFER_POPULATE).sort({ createdAt: -1 }).limit(200).lean() });
  } catch (error) {
    fail(res, error, "Error fetching transfers");
  }
});

router.get("/transfers/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const t = await StockTransfer.findById(req.params.id).populate(TRANSFER_POPULATE).lean();
    if (!t) return bad(res, "Transfer not found", 404);
    res.json({ success: true, data: t });
  } catch (error) {
    fail(res, error, "Error fetching the transfer");
  }
});

router.post("/transfers", async (req, res) => {
  try {
    const { company, from, to, notes } = req.body;
    if (!isId(company) || !isId(from) || !isId(to)) return bad(res, "Company, origin and destination are required");
    if (String(from) === String(to)) return bad(res, "Choose two different warehouses");
    const n = await Warehouse.countDocuments({ company, _id: { $in: [from, to] } });
    if (n !== 2) return bad(res, "Warehouse not found in this company");
    const lines = [];
    for (const l of Array.isArray(req.body.lines) ? req.body.lines : []) {
      if (!isId(l.product) || !(Number(l.quantity) > 0)) continue;
      // eslint-disable-next-line no-await-in-loop
      if (!(await Product.exists({ _id: l.product, company }))) return bad(res, "Article not found");
      lines.push({ product: l.product, quantity: Number(l.quantity), lots: Array.isArray(l.lots) ? l.lots : [] });
    }
    if (!lines.length) return bad(res, "Add at least one article");
    const t = await createWithNumber(StockTransfer, { company, from, to, lines, notes, createdBy: req.user.id }, "TF");
    if (req.body.send) await sendTransfer(t, req.user.id);
    res.status(201).json({ success: true, data: await StockTransfer.findById(t._id).populate(TRANSFER_POPULATE) });
  } catch (error) {
    fail(res, error, "Error creating the transfer");
  }
});

/** Goods leave `from` → in transit (the destination receives them later). */
async function sendTransfer(t, actorId) {
  if (t.status !== "draft") throw stock.stockError("Only a draft transfer can be sent");
  // Check everything first so a transfer never half-leaves.
  for (const l of t.lines) {
    // eslint-disable-next-line no-await-in-loop
    const lvl = await StockLevel.findOne({ product: l.product, warehouse: t.from }).lean();
    // eslint-disable-next-line no-await-in-loop
    const p = await Product.findById(l.product).select("name").lean();
    if (!lvl || lvl.quantity + 1e-9 < l.quantity) throw stock.stockError(`"${p?.name}": only ${lvl ? lvl.quantity : 0} in the origin warehouse`);
  }
  for (const l of t.lines) {
    // eslint-disable-next-line no-await-in-loop
    const out = await stock.issue({ product: l.product, warehouse: t.from, quantity: l.quantity, lots: l.lots, reason: `Transfert ${t.number} (envoi)`, source: { kind: "transfer", id: t._id, number: t.number }, actorId });
    l.lots = out.lots;
  }
  t.status = "sent";
  t.sentAt = new Date();
  t.sentBy = actorId;
  await t.save();
}

router.post("/transfers/:id/send", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const t = await StockTransfer.findById(req.params.id);
    if (!t) return bad(res, "Transfer not found", 404);
    await sendTransfer(t, req.user.id);
    res.json({ success: true, data: await StockTransfer.findById(t._id).populate(TRANSFER_POPULATE) });
  } catch (error) {
    fail(res, error, "Error sending the transfer");
  }
});

router.post("/transfers/:id/receive", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const t = await StockTransfer.findById(req.params.id);
    if (!t) return bad(res, "Transfer not found", 404);
    if (t.status !== "sent") return bad(res, "Only a sent transfer can be received");
    const given = new Map((Array.isArray(req.body.lines) ? req.body.lines : []).map((l) => [String(l.lineId), Number(l.receivedQuantity)]));
    for (const l of t.lines) {
      const got = given.has(String(l._id)) ? given.get(String(l._id)) : l.quantity;
      if (!Number.isFinite(got) || got < 0 || got > l.quantity + 1e-9) throw stock.stockError("Received quantity must be between 0 and the quantity sent");
      l.receivedQuantity = got;
    }
    for (const l of t.lines) {
      const src = { kind: "transfer", id: t._id, number: t.number };
      // Lots follow the goods: the lots taken at sending fill the received
      // quantity first; what's left of them goes back to the origin.
      const lotsIn = [];
      const lotsBack = [];
      let left = l.receivedQuantity;
      for (const lot of l.lots || []) {
        const q = Math.min(lot.quantity, Math.max(left, 0));
        if (q > 1e-9) lotsIn.push({ number: lot.number, quantity: q, expiryDate: lot.expiryDate });
        if (lot.quantity - q > 1e-9) lotsBack.push({ number: lot.number, quantity: stock.round(lot.quantity - q), expiryDate: lot.expiryDate });
        left -= q;
      }
      if (l.receivedQuantity > 0) {
        // eslint-disable-next-line no-await-in-loop
        await stock.receive({ product: l.product, warehouse: t.to, quantity: l.receivedQuantity, lots: lotsIn, reason: `Transfert ${t.number} (réception)`, source: src, actorId: req.user.id });
      }
      const gap = stock.round(l.quantity - l.receivedQuantity);
      if (gap > 1e-9) {
        // eslint-disable-next-line no-await-in-loop
        await stock.receive({ product: l.product, warehouse: t.from, quantity: gap, lots: lotsBack, reason: `Transfert ${t.number} : écart retourné`, source: src, actorId: req.user.id });
      }
    }
    t.status = "received";
    t.receivedAt = new Date();
    t.receivedBy = req.user.id;
    await t.save();
    res.json({ success: true, data: await StockTransfer.findById(t._id).populate(TRANSFER_POPULATE) });
  } catch (error) {
    fail(res, error, "Error receiving the transfer");
  }
});

router.post("/transfers/:id/cancel", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const t = await StockTransfer.findById(req.params.id);
    if (!t) return bad(res, "Transfer not found", 404);
    if (t.status === "sent") {
      // Goods come back to the origin.
      for (const l of t.lines) {
        // eslint-disable-next-line no-await-in-loop
        await stock.receive({ product: l.product, warehouse: t.from, quantity: l.quantity, lots: l.lots, reason: `Transfert ${t.number} annulé`, source: { kind: "transfer", id: t._id, number: t.number }, actorId: req.user.id });
      }
    } else if (t.status !== "draft") return bad(res, "This transfer can no longer be cancelled");
    t.status = "cancelled";
    await t.save();
    res.json({ success: true, data: t });
  } catch (error) {
    fail(res, error, "Error cancelling the transfer");
  }
});

// ---------------------------------------------------------------- counts
const COUNT_POPULATE = [{ path: "warehouse", select: "code name" }, { path: "category", select: "name" }, { path: "lines.product", select: "name internalReference unit barcode" }, { path: "validatedBy", select: "firstName lastName" }];

router.get("/counts", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const filter = { company: req.query.companyId };
    if (req.query.status) filter.status = req.query.status;
    const counts = await StockCount.find(filter).populate("warehouse", "code name").populate("category", "name").select("-lines.note").sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: counts.map((c) => ({ ...c, lineCount: c.lines.length, countedLines: c.lines.filter((l) => l.counted !== null && l.counted !== undefined).length, lines: undefined })) });
  } catch (error) {
    fail(res, error, "Error fetching counts");
  }
});

router.get("/counts/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const c = await StockCount.findById(req.params.id).populate(COUNT_POPULATE).lean();
    if (!c) return bad(res, "Count not found", 404);
    res.json({ success: true, data: c });
  } catch (error) {
    fail(res, error, "Error fetching the count");
  }
});

router.post("/counts", async (req, res) => {
  try {
    const { company, warehouse, category, title } = req.body;
    if (!isId(company) || !isId(warehouse)) return bad(res, "Company and warehouse are required");
    if (!(await Warehouse.exists({ _id: warehouse, company }))) return bad(res, "Warehouse not found");
    const filter = await productFilter({ companyId: company, category });
    if (Array.isArray(req.body.products) && req.body.products.length) filter._id = { $in: req.body.products.filter(isId).map(oid) };
    const products = await Product.find(filter).select("_id avgCost").sort({ name: 1 }).lean();
    if (!products.length) return bad(res, "No article to count");
    const levels = await StockLevel.find({ warehouse, product: { $in: products.map((p) => p._id) } }).lean();
    const byP = new Map(levels.map((l) => [String(l.product), l.quantity]));
    const c = await createWithNumber(StockCount, {
      company, warehouse, category: isId(category) ? category : null, title: title || "",
      lines: products.map((p) => ({ product: p._id, expected: byP.get(String(p._id)) || 0, counted: null, unitCost: p.avgCost || 0 })),
      createdBy: req.user.id,
    }, "INV");
    res.status(201).json({ success: true, data: await StockCount.findById(c._id).populate(COUNT_POPULATE) });
  } catch (error) {
    fail(res, error, "Error creating the count");
  }
});

router.put("/counts/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const c = await StockCount.findById(req.params.id);
    if (!c) return bad(res, "Count not found", 404);
    if (c.status !== "draft") return bad(res, "This count is closed");
    for (const u of Array.isArray(req.body.lines) ? req.body.lines : []) {
      const line = c.lines.id(u.lineId);
      if (!line) continue;
      if (u.counted !== undefined) line.counted = u.counted === "" || u.counted === null ? null : Math.max(Number(u.counted) || 0, 0);
      if (u.note !== undefined) line.note = String(u.note || "").slice(0, 200);
    }
    await c.save();
    res.json({ success: true, data: await StockCount.findById(c._id).populate(COUNT_POPULATE) });
  } catch (error) {
    fail(res, error, "Error saving the count");
  }
});

router.post("/counts/:id/validate", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const c = await StockCount.findById(req.params.id);
    if (!c) return bad(res, "Count not found", 404);
    if (c.status !== "draft") return bad(res, "This count is closed");
    // Uncounted lines: kept as expected (not counted = not touched) unless zeroUncounted.
    let gapValue = 0;
    for (const l of c.lines) {
      if (l.counted === null || l.counted === undefined) {
        if (!req.body.zeroUncounted) continue;
        l.counted = 0;
      }
      // Re-read the live quantity: sales may have happened during the count.
      // eslint-disable-next-line no-await-in-loop
      const level = await StockLevel.findOne({ product: l.product, warehouse: c.warehouse }).lean();
      const movedSince = (level?.quantity || 0) - l.expected;
      const target = Math.max(l.counted + movedSince, 0);
      // eslint-disable-next-line no-await-in-loop
      const out = await stock.setCount({ product: l.product, warehouse: c.warehouse, counted: target, reason: `Inventaire ${c.number}`, source: { kind: "count", id: c._id, number: c.number }, actorId: req.user.id });
      gapValue += (out.difference || 0) * (l.unitCost || 0);
    }
    c.status = "validated";
    c.validatedAt = new Date();
    c.validatedBy = req.user.id;
    c.gapValue = r2(gapValue);
    await c.save();
    await logAudit(req, { company: c.company, action: "update", resourceType: "StockCount", resourceId: c._id, resourceLabel: `${c.number} validé (écart ${c.gapValue} MAD)` });
    res.json({ success: true, data: await StockCount.findById(c._id).populate(COUNT_POPULATE) });
  } catch (error) {
    fail(res, error, "Error validating the count");
  }
});

router.post("/counts/:id/cancel", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const c = await StockCount.findById(req.params.id);
    if (!c) return bad(res, "Count not found", 404);
    if (c.status !== "draft") return bad(res, "This count is closed");
    c.status = "cancelled";
    await c.save();
    res.json({ success: true, data: c });
  } catch (error) {
    fail(res, error, "Error cancelling the count");
  }
});

module.exports = router;
