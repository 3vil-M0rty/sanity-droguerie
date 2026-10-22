const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Product = require("../models/Product");
const Brand = require("../models/Brand");
const StockLevel = require("../models/StockLevel");
const StockLot = require("../models/StockLot");
const InventoryMovement = require("../models/InventoryMovement");
const InventoryCategory = require("../models/InventoryCategory");
const Customer = require("../models/Customer");
const stock = require("../services/stockService");
const pricing = require("../services/pricingService");

const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const upload = require("../middleware/uploadMiddleware");
const { hideMoney, dropMoneyInput } = require("../middleware/hideMoney");
const { canManageStock, canSeeFinancials } = require("../permissions/permissions");
const { uploadImage, deleteImage } = require("../services/storageService");
const { logAudit } = require("../services/auditLogger");
const { attachTranslationRoutes } = require("../utils/translationRoutes");
const { withDescendants } = require("../services/categoryTree");
const { searchFilter } = require("../utils/searchTokens");

/**
 * ============================================================
 * ARTICLES (catalogue négoce) — /api/products
 * ============================================================
 * GET    /?companyId=&search=&category=&brand=&supplier=&unit=&warehouse=&status=active|inactive
 *          &stockStatus=in|low|out&tracking=&parent=&variants=&page=&limit=
 *                                              ONE PAGE of the catalogue (≤ 100), list fields only,
 *                                              filtered, searched and counted by MongoDB
 * GET    /suggestions?companyId=&q=&limit=   autocomplete for pickers (≤ 20)
 * GET    /brief?companyId=&ids=a,b           the same light fields for known ids (≤ 100)
 * GET    /lookup?companyId=&code=            barcode scan → { product, unit, unitFactor }
 * GET    /:id                                 + stock per warehouse, lots, level prices
 * GET    /:id/price?customer=&unit=           price proposed for a customer
 * GET    /:id/supplier-prices                 every supplier's price: catalogue, purchase history, quotes
 * GET    /:id/movements?warehouse=
 * GET    /:id/lots?warehouse=
 * POST   /                                     create (packagings, priceLevels, variants…)
 * POST   /:id/variants   { combos: [[{name,value}…]…] }  creates variants of a model
 * PUT    /:id
 * PATCH  /:id/supplier-info                    purchasing: supplier prices / missing ref
 * POST   /:id/adjust     { type in|out, warehouse, quantity, unitCost?, lots?, reason }
 * POST   /:id/photo · DELETE /:id · translations
 * Cost fields (CMUP, purchase prices) are hidden from logins without
 * "finance.amounts.view".
 * ============================================================
 */
router.use(auth, guard(ROUTE_PERMISSIONS.products));
router.use(hideMoney(["avgCost", "lastPurchasePrice", "prices", "unitCost", "avgCostAfter", "stockValue"]));
router.use(dropMoneyInput(["avgCost", "prices"]));

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });
const esc = (s) => String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const num = (v, fallback = null) => (v === undefined || v === null || v === "" ? fallback : Number(v));

async function withStock(products, companyId, warehouse) {
  const ids = products.map((p) => p._id);
  const levels = await stock.levelsByProduct(companyId, ids);
  return products.map((p) => {
    const o = p.toObject ? p.toObject() : p;
    const byWh = levels[String(o._id)] || {};
    const reserved = Object.values(byWh).reduce((s, l) => s + (l.reserved || 0), 0);
    const here = warehouse ? byWh[String(warehouse)] || { quantity: 0, reserved: 0, available: 0 } : null;
    return {
      ...o,
      reserved: stock.round(reserved),
      available: stock.round((o.quantity || 0) - reserved),
      warehouseStock: here,
      stockValue: Math.round((o.quantity || 0) * (o.avgCost || 0) * 100) / 100,
    };
  });
}

// ---------------------------------------------------------------- list
//
// With 100 000+ articles the browser must only ever get one page: the
// filters, the search (indexed tokens, see utils/searchTokens.js), the
// sort and the count all run in MongoDB, and only the fields a list row
// or a card shows travel — no supplier prices, translations, notes, full
// pictures… (GET /:id has everything).

const MAX_PAGE = 100;
const LIST_FIELDS = "name internalReference barcode unit quantity threshold maxQuantity sellingPrice vatRate avgCost category brand tracking isService isVariantParent isActive parent attributes image.thumbUrl";
// Pickers also need the packagings (units) and the supplier prices (purchase orders).
const BRIEF_FIELDS = `${LIST_FIELDS} packagings prices`;

/** A lean product → what the list / pickers send (thumbnail, never the full picture). */
const light = ({ image, ...p }) => ({ ...p, thumbnail: image?.thumbUrl || "" });

async function listFilter(q) {
  const companyId = q.companyId;
  const filter = { company: new mongoose.Types.ObjectId(companyId) };
  const and = [];
  if (q.category) {
    if (!isId(q.category)) throw Object.assign(new Error("Invalid category"), { status: 400 });
    const ids = await withDescendants(companyId, q.category);
    filter.category = { $in: (ids.length ? ids : [q.category]).map((id) => new mongoose.Types.ObjectId(String(id))) };
  }
  if (isId(q.brand)) filter.brand = new mongoose.Types.ObjectId(q.brand);
  if (isId(q.supplier)) filter["prices.supplier"] = new mongoose.Types.ObjectId(q.supplier);
  if (q.unit) filter.unit = String(q.unit);
  if (q.tracking) filter.tracking = String(q.tracking);
  if (isId(q.parent)) filter.parent = new mongoose.Types.ObjectId(q.parent);
  // By default the stocked articles are listed (variants, not their models).
  if (q.variants === "models") filter.parent = null;
  else if (q.variants === "stock") filter.isVariantParent = { $ne: true };
  const status = q.status || (q.active === "true" ? "active" : q.active === "false" ? "inactive" : "");
  if (status === "active") filter.isActive = { $ne: false };
  if (status === "inactive") filter.isActive = false;
  const stockStatus = q.stockStatus || (q.lowStockOnly === "true" ? "low" : "");
  if (stockStatus) {
    filter.isService = { $ne: true };
    filter.isVariantParent = { $ne: true };
    if (stockStatus === "in") filter.quantity = { $gt: 0 };
    if (stockStatus === "out") filter.quantity = { $lte: 0 };
    // "below minimum" only for articles that have a minimum
    if (stockStatus === "low") filter.$expr = { $and: [{ $gt: ["$threshold", 0] }, { $lte: ["$quantity", "$threshold"] }] };
  }
  const search = searchFilter(q.search);
  if (search) and.push(search);
  if (and.length) filter.$and = and;
  return filter;
}

router.get("/", async (req, res) => {
  try {
    const { companyId, warehouse } = req.query;
    if (!isId(companyId)) return bad(res, "companyId is required");
    const page = Math.max(Math.floor(Number(req.query.page)) || 1, 1);
    const limit = Math.min(Math.max(Math.floor(Number(req.query.limit)) || 50, 1), MAX_PAGE);
    const filter = await listFilter(req.query);
    const [products, total] = await Promise.all([
      Product.find(filter).select(LIST_FIELDS)
        .populate("category", "name icon color parent").populate("brand", "name")
        .sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / limit) || 1;
    res.json({
      success: true,
      data: (await withStock(products, companyId, isId(warehouse) ? warehouse : null)).map(light),
      pagination: { total, page, limit, pages, hasNext: page < pages, hasPrevious: page > 1 },
    });
  } catch (error) {
    if (error.status) return bad(res, error.message, error.status);
    console.error("GET products error:", error);
    res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
  }
});

/** Autocomplete of the article pickers (lines of orders, BL, transfers…): a handful, never the catalogue. */
router.get("/suggestions", async (req, res) => {
  try {
    const { companyId, q } = req.query;
    const search = searchFilter(q);
    if (!isId(companyId) || !search) return res.json({ success: true, data: [] });
    const limit = Math.min(Math.max(Math.floor(Number(req.query.limit)) || 15, 1), 20);
    const products = await Product.find({
      company: new mongoose.Types.ObjectId(companyId),
      isVariantParent: { $ne: true },
      isActive: { $ne: false },
      ...search,
    }).select(BRIEF_FIELDS).sort({ name: 1 }).limit(limit).lean();
    res.json({ success: true, data: (await withStock(products, companyId, null)).map(light) });
  } catch (error) {
    console.error("GET product suggestions error:", error);
    res.status(500).json({ success: false, message: "Error fetching suggestions", error: error.message });
  }
});

/** The light fields of articles already on a document (editing a commande, a BL…). */
router.get("/brief", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!isId(companyId)) return bad(res, "companyId is required");
    const ids = [...new Set(String(req.query.ids || "").split(",").filter(isId))].slice(0, MAX_PAGE);
    if (!ids.length) return res.json({ success: true, data: [] });
    const products = await Product.find({ company: new mongoose.Types.ObjectId(companyId), _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select(BRIEF_FIELDS).lean();
    res.json({ success: true, data: (await withStock(products, companyId, null)).map(light) });
  } catch (error) {
    console.error("GET product brief error:", error);
    res.status(500).json({ success: false, message: "Error fetching articles", error: error.message });
  }
});

/** Barcode scan: the base unit's code or one of the packagings'. */
router.get("/lookup", async (req, res) => {
  try {
    const { companyId } = req.query;
    const code = String(req.query.code || "").trim();
    if (!isId(companyId) || !code) return bad(res, "companyId and code are required");
    const product = await Product.findOne({
      company: companyId,
      isVariantParent: { $ne: true },
      $or: [{ barcode: code }, { "packagings.barcode": code }, { internalReference: code.toUpperCase() }],
    }).populate("brand", "name");
    if (!product) return bad(res, "No article with this code", 404);
    const pack = (product.packagings || []).find((p) => p.barcode === code);
    res.json({ success: true, data: { product, unit: pack ? pack.unit : product.unit, unitFactor: pack ? pack.factor : 1 } });
  } catch (error) {
    console.error("GET product lookup error:", error);
    res.status(500).json({ success: false, message: "Error looking up the code", error: error.message });
  }
});

// ---------------------------------------------------------------- detail
router.get("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const product = await Product.findById(req.params.id).populate("category", "name icon color").populate("brand", "name").populate("parent", "name internalReference");
    if (!product) return bad(res, "Product not found", 404);
    const [levels, lots, variants, settings] = await Promise.all([
      StockLevel.find({ product: product._id }).populate("warehouse", "code name kind").lean(),
      product.tracking === "none" ? [] : StockLot.find({ product: product._id, quantity: { $gt: 0 } }).populate("warehouse", "code name").sort({ expiryDate: 1 }).lean(),
      product.isVariantParent ? Product.find({ parent: product._id }).select("name internalReference barcode attributes quantity isActive").sort({ name: 1 }).lean() : [],
      pricing.getSettings(product.company),
    ]);
    const [withLevels] = await withStock([product], product.company, null);
    res.json({
      success: true,
      data: {
        ...withLevels,
        stockByWarehouse: levels.map((l) => ({ warehouse: l.warehouse, quantity: l.quantity, reserved: l.reserved, available: stock.round(l.quantity - l.reserved), location: l.location, minQuantity: l.minQuantity })),
        lots,
        variants,
        levelPrices: pricing.allLevelPrices(product, settings),
      },
    });
  } catch (error) {
    console.error("GET product error:", error);
    res.status(500).json({ success: false, message: "Error fetching product", error: error.message });
  }
});

router.get("/:id/price", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const product = await Product.findById(req.params.id).lean();
    if (!product) return bad(res, "Product not found", 404);
    const customer = isId(req.query.customer) ? await Customer.findById(req.query.customer).lean() : null;
    const settings = await pricing.getSettings(product.company);
    const promotions = await require("../services/promotionService").activeFor(product.company);
    res.json({ success: true, data: pricing.quoteLine(product, customer, settings, req.query.unit || null, { quantity: Number(req.query.quantity) || 0, channel: req.query.channel === "pos" ? "pos" : "sales", promotions }) });
  } catch (error) {
    console.error("GET product price error:", error);
    res.status(500).json({ success: false, message: "Error computing the price", error: error.message });
  }
});

/**
 * Buying prices of an article from every supplier, best first:
 *   catalogue  the price recorded on the article for that supplier
 *   last order the last purchase order line (price, date, number)
 *   quote      the last price request answered by that supplier
 * plus min / count over the purchase history.
 */
router.get("/:id/supplier-prices", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    // Buying prices are amounts: never for logins that don't see money (magasin, caisse…).
    if (!canSeeFinancials(req.user)) return bad(res, "Buying prices are hidden for your account", 403);
    const product = await Product.findById(req.params.id).select("company name unit avgCost lastPurchasePrice prices").lean();
    if (!product) return bad(res, "Product not found", 404);
    const PurchaseOrder = require("../models/PurchaseOrder");
    const PriceRequest = require("../models/PriceRequest");
    const Supplier = require("../models/Supplier");
    const [orders, quotes, suppliers] = await Promise.all([
      PurchaseOrder.find({ company: product.company, "lines.product": product._id, status: { $ne: "cancelled" } }).select("number date supplier status lines").sort({ date: -1 }).limit(200).lean(),
      PriceRequest.find({ company: product.company, "lines.product": product._id, status: { $in: ["answered", "accepted", "rejected"] } }).select("number date supplier status lines").sort({ date: -1 }).limit(100).lean(),
      Supplier.find({ company: product.company, isActive: { $ne: false } }).select("name city phone paymentDays").lean(),
    ]);
    const byName = new Map(suppliers.map((x) => [x.name, x]));
    const rows = new Map();
    const row = (supplierId, name) => {
      const key = supplierId ? String(supplierId) : `name:${name}`;
      if (!rows.has(key)) {
        const sup = supplierId ? suppliers.find((x) => String(x._id) === String(supplierId)) : byName.get(name);
        rows.set(key, { supplier: sup ? { _id: sup._id, name: sup.name, city: sup.city, phone: sup.phone, paymentDays: sup.paymentDays } : { name }, catalogPrice: null, supplierReference: "", lastOrder: null, lastQuote: null, minPrice: null, orders: 0, quantity: 0 });
      }
      return rows.get(key);
    };
    for (const p of product.prices || []) {
      const sup = p.supplier || byName.get(p.supplierName)?._id || null;
      const r = row(sup, p.supplierName);
      r.catalogPrice = p.price;
      r.supplierReference = p.supplierReference || "";
    }
    for (const o of orders) {
      for (const l of o.lines.filter((x) => String(x.product) === String(product._id))) {
        const r = row(o.supplier, "");
        if (!r.lastOrder) r.lastOrder = { price: l.unitPrice, date: o.date, number: o.number, _id: o._id, status: o.status };
        r.minPrice = r.minPrice === null ? l.unitPrice : Math.min(r.minPrice, l.unitPrice);
        r.orders += 1;
        r.quantity += l.quantity;
      }
    }
    for (const q of quotes) {
      for (const l of q.lines.filter((x) => String(x.product) === String(product._id) && x.quotedUnitPrice !== null)) {
        const r = row(q.supplier, "");
        if (!r.lastQuote) r.lastQuote = { price: l.quotedUnitPrice, date: q.date, number: q.number, _id: q._id };
      }
    }
    const best = (r) => [r.lastOrder?.price, r.lastQuote?.price, r.catalogPrice].find((v) => v !== null && v !== undefined) ?? Infinity;
    const list = [...rows.values()].map((r) => ({ ...r, bestPrice: best(r) === Infinity ? null : best(r) })).sort((a, b) => best(a) - best(b));
    res.json({ success: true, data: { product: { _id: product._id, name: product.name, unit: product.unit, avgCost: product.avgCost, lastPurchasePrice: product.lastPurchasePrice }, suppliers: list } });
  } catch (error) {
    console.error("GET supplier prices error:", error);
    res.status(500).json({ success: false, message: "Error fetching supplier prices", error: error.message });
  }
});

router.get("/:id/movements", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const filter = { product: req.params.id };
    if (isId(req.query.warehouse)) filter.warehouse = req.query.warehouse;
    const movements = await InventoryMovement.find(filter)
      .populate("performedBy", "firstName lastName").populate("warehouse", "code name")
      .sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 100, 500));
    res.json({ success: true, data: movements });
  } catch (error) {
    console.error("GET product movements error:", error);
    res.status(500).json({ success: false, message: "Error fetching movement history", error: error.message });
  }
});

router.get("/:id/lots", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const filter = { product: req.params.id, quantity: { $gt: 0 } };
    if (isId(req.query.warehouse)) filter.warehouse = req.query.warehouse;
    const lots = await StockLot.find(filter).populate("warehouse", "code name").sort({ expiryDate: 1, receivedAt: 1 }).lean();
    res.json({ success: true, data: lots });
  } catch (error) {
    console.error("GET product lots error:", error);
    res.status(500).json({ success: false, message: "Error fetching lots", error: error.message });
  }
});

// ---------------------------------------------------------------- write
/** Cleans the editable fields of an article. Returns { data } or { error }. */
async function cleanBody(body, companyId, { partial = false } = {}) {
  const out = {};
  const str = (k, max = 200, upper = false) => {
    if (body[k] === undefined) return;
    const v = String(body[k] ?? "").trim().slice(0, max);
    out[k] = upper ? v.toUpperCase() : v;
  };
  if (!partial || body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) return { error: "The article name is required" };
    out.name = name.slice(0, 200);
  }
  if (!partial || body.category !== undefined) {
    if (!isId(body.category) || !(await InventoryCategory.exists({ _id: body.category, company: companyId }))) return { error: "Choose a family (category) of this company" };
    out.category = body.category;
  }
  if (body.brand !== undefined) {
    if (!body.brand) out.brand = null;
    else if (!isId(body.brand) || !(await Brand.exists({ _id: body.brand, company: companyId }))) return { error: "Brand not found" };
    else out.brand = body.brand;
  }
  str("internalReference", 40, true);
  if (out.internalReference === "") out.internalReference = undefined;
  str("barcode", 40);
  str("manufacturerReference", 60);
  str("unit", 30);
  str("notes", 1000);
  for (const k of ["threshold", "maxQuantity", "sellingPrice", "minSellingPrice", "weightKg", "shelfLifeDays"]) {
    if (body[k] === undefined) continue;
    const v = num(body[k]);
    if (v !== null && (!Number.isFinite(v) || v < 0)) return { error: `Invalid value for ${k}` };
    out[k] = k === "threshold" ? v || 0 : v;
  }
  if (body.vatRate !== undefined) {
    const v = Number(body.vatRate);
    if (![0, 7, 10, 14, 20].includes(v)) return { error: "VAT must be 0, 7, 10, 14 or 20%" };
    out.vatRate = v;
  }
  for (const k of ["isActive", "isService", "hasExpiry", "isVariantParent"]) if (body[k] !== undefined) out[k] = body[k] === true || body[k] === "true";
  if (body.tracking !== undefined) {
    if (!["none", "lot", "serial"].includes(body.tracking)) return { error: "Invalid tracking" };
    out.tracking = body.tracking;
  }
  if (body.priceLevels !== undefined) {
    if (!Array.isArray(body.priceLevels)) return { error: "Invalid price levels" };
    const seen = new Set();
    out.priceLevels = [];
    for (const p of body.priceLevels) {
      const level = String(p?.level || "").trim().toUpperCase();
      if (!level || p?.price === "" || p?.price === null || p?.price === undefined) continue;
      const price = Number(p.price);
      if (!Number.isFinite(price) || price < 0) return { error: `Invalid price for level ${level}` };
      if (seen.has(level)) continue;
      seen.add(level);
      out.priceLevels.push({ level, price });
    }
  }
  if (body.packagings !== undefined) {
    if (!Array.isArray(body.packagings)) return { error: "Invalid packagings" };
    out.packagings = [];
    for (const p of body.packagings) {
      const unit = String(p?.unit || "").trim();
      if (!unit) continue;
      const factor = Number(p.factor);
      if (!(factor > 0)) return { error: `Packaging "${unit}": enter how many base units it holds` };
      out.packagings.push({ unit: unit.slice(0, 30), factor, barcode: String(p.barcode || "").trim().slice(0, 40), forSale: p.forSale !== false, forPurchase: p.forPurchase !== false });
    }
  }
  if (body.imageUrl !== undefined) {
    const url = String(body.imageUrl || "").trim();
    // Photos from the computer or phone are uploaded (POST /:id/photo, counted in
    // the client's storage); here only a web link, or "" to remove the photo.
    if (url && !/^https?:\/\//i.test(url)) return { error: "The image must be an http(s) link — upload a photo from the article page" };
    // A data: picture (made small by the browser) comes with its thumbnail;
    // a web link is its own (models/Product.js).
    const thumb = String(body.imageThumbUrl || "").trim();
    const thumbUrl = /^https?:\/\//i.test(url) ? url : url && /^data:image\//i.test(thumb) && thumb.length < 40000 ? thumb : "";
    out.image = { url, publicId: "", thumbUrl };
  }
  if (body.attributes !== undefined) {
    out.attributes = (Array.isArray(body.attributes) ? body.attributes : [])
      .map((a) => ({ name: String(a?.name || "").trim().slice(0, 40), value: String(a?.value || "").trim().slice(0, 60) }))
      .filter((a) => a.name && a.value);
  }
  if (body.prices !== undefined) {
    if (!Array.isArray(body.prices)) return { error: "Invalid supplier prices" };
    out.prices = body.prices.filter((p) => p?.supplierName).map((p) => ({ supplierName: String(p.supplierName).trim(), supplier: isId(p.supplier) ? p.supplier : null, price: Number(p.price) || 0, supplierReference: String(p.supplierReference || "").trim() || undefined }));
  }
  return { data: out };
}

router.post("/", async (req, res) => {
  try {
    const companyId = req.body.company;
    if (!isId(companyId)) return bad(res, "A valid company is required");
    const { data, error } = await cleanBody(req.body, companyId);
    if (error) return bad(res, error);
    if (req.body.parent) {
      const parent = isId(req.body.parent) ? await Product.findOne({ _id: req.body.parent, company: companyId }) : null;
      if (!parent) return bad(res, "Parent article not found");
      data.parent = parent._id;
      if (!parent.isVariantParent) { parent.isVariantParent = true; await parent.save(); }
    }
    const product = await Product.create({ ...data, company: companyId, quantity: 0, avgCost: 0, createdBy: req.user.id, updatedBy: req.user.id });
    // Opening stock: { initialQuantity, initialCost, warehouse, lots }
    const q = Number(req.body.initialQuantity);
    if (q > 0 && !product.isVariantParent && !product.isService) {
      await stock.receive({ product, warehouse: isId(req.body.warehouse) ? req.body.warehouse : null, quantity: q, unitCost: num(req.body.initialCost, 0), lots: req.body.lots, reason: "Stock initial", source: { kind: "opening" }, actorId: req.user.id });
    }
    await logAudit(req, { company: companyId, action: "create", resourceType: "Product", resourceId: product._id, resourceLabel: product.name });
    res.status(201).json({ success: true, data: await Product.findById(product._id).populate("category", "name").populate("brand", "name") });
  } catch (error) {
    if (error.code === 11000) return bad(res, "Another article already uses this internal reference", 409);
    if (error.status) return bad(res, error.message, error.status);
    console.error("POST product error:", error);
    res.status(500).json({ success: false, message: "Error creating the article", error: error.message });
  }
});

/**
 * Variants of a model: body { combos: [[{ name: "Couleur", value: "Chromé" }], …], priceFromParent: true }
 * Each variant copies the model (family, brand, unit, prices, VAT) and is named "Model — Chromé".
 */
router.post("/:id/variants", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const parent = await Product.findById(req.params.id);
    if (!parent) return bad(res, "Product not found", 404);
    if (parent.parent) return bad(res, "A variant can't have variants");
    if (!parent.isVariantParent && (parent.quantity || 0) !== 0) return bad(res, "This article has stock — move it to a variant first");
    const combos = Array.isArray(req.body.combos) ? req.body.combos : [];
    if (!combos.length) return bad(res, "Give at least one variant");
    const created = [];
    for (const [i, combo] of combos.entries()) {
      const attributes = (Array.isArray(combo) ? combo : []).map((a) => ({ name: String(a?.name || "").trim(), value: String(a?.value || "").trim() })).filter((a) => a.name && a.value);
      if (!attributes.length) continue;
      const suffix = attributes.map((a) => a.value).join(" / ");
      const ref = parent.internalReference ? `${parent.internalReference}-${String(i + 1).padStart(2, "0")}` : undefined;
      // eslint-disable-next-line no-await-in-loop
      const exists = await Product.exists({ parent: parent._id, name: `${parent.name} — ${suffix}` });
      if (exists) continue;
      // eslint-disable-next-line no-await-in-loop
      created.push(await Product.create({
        company: parent.company, category: parent.category, brand: parent.brand, parent: parent._id, attributes,
        name: `${parent.name} — ${suffix}`, internalReference: ref, unit: parent.unit, packagings: parent.packagings,
        vatRate: parent.vatRate, sellingPrice: parent.sellingPrice, priceLevels: parent.priceLevels, minSellingPrice: parent.minSellingPrice,
        threshold: parent.threshold, tracking: parent.tracking, hasExpiry: parent.hasExpiry, prices: parent.prices, weightKg: parent.weightKg,
        quantity: 0, avgCost: 0, createdBy: req.user.id, updatedBy: req.user.id,
      }));
    }
    parent.isVariantParent = true;
    await parent.save();
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.code === 11000) return bad(res, "A variant reference is already used", 409);
    console.error("POST variants error:", error);
    res.status(500).json({ success: false, message: "Error creating the variants", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const product = await Product.findById(req.params.id);
    if (!product) return bad(res, "Product not found", 404);
    const { data, error } = await cleanBody(req.body, product.company, { partial: true });
    if (error) return bad(res, error);
    if (data.isVariantParent && !product.isVariantParent && (product.quantity || 0) !== 0) return bad(res, "An article with stock can't become a model with variants");
    if (data.tracking && data.tracking !== product.tracking && (product.quantity || 0) !== 0) return bad(res, "Change the tracking only when the article has no stock");
    const before = product.toObject();
    const oldPublicId = data.image ? product.image?.publicId : null;
    Object.assign(product, data, { updatedBy: req.user.id });
    await product.save();
    // Photo replaced by a link or removed: its stored file goes, its space is freed.
    if (oldPublicId) await deleteImage(oldPublicId).catch((err) => console.error("product photo delete error:", err.message));
    await logAudit(req, { company: product.company, action: "update", resourceType: "Product", resourceId: product._id, resourceLabel: product.name, before, after: product.toObject() });
    res.json({ success: true, data: await Product.findById(product._id).populate("category", "name").populate("brand", "name") });
  } catch (error) {
    if (error.code === 11000) return bad(res, "Another article already uses this internal reference", 409);
    console.error("PUT product error:", error);
    res.status(500).json({ success: false, message: "Error updating the article", error: error.message });
  }
});

// Purchasing's edit: supplier prices / references, and a MISSING internal reference.
router.patch("/:id/supplier-info", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid article ID");
    const product = await Product.findById(req.params.id);
    if (!product) return bad(res, "Article not found", 404);
    const { prices, internalReference } = req.body;
    if (prices !== undefined) {
      if (!Array.isArray(prices) || prices.length > 50) return bad(res, "Invalid supplier prices");
      const clean = [];
      for (const p of prices) {
        const supplierName = String(p?.supplierName || "").trim();
        const price = Number(p?.price);
        if (!supplierName) return bad(res, "Every supplier price needs a supplier name");
        if (!Number.isFinite(price) || price < 0) return bad(res, `Invalid price for "${supplierName}"`);
        clean.push({ supplierName, ...(isId(p.supplier) ? { supplier: p.supplier } : {}), supplierReference: String(p.supplierReference || "").trim() || undefined, price });
      }
      product.prices = clean;
    }
    if (internalReference !== undefined && String(internalReference).trim()) {
      const ref = String(internalReference).trim().toUpperCase();
      const current = String(product.internalReference || "").trim();
      if (current && current !== ref && !canManageStock(req.user)) return bad(res, "This article already has an internal reference — only the warehouse can change it", 403);
      product.internalReference = ref;
    }
    product.updatedBy = req.user.id;
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) return bad(res, "Another article already uses this internal reference", 409);
    console.error("PATCH product supplier-info error:", error);
    res.status(500).json({ success: false, message: "Error saving supplier prices", error: error.message });
  }
});

// Manual stock in / out (casse, échantillon, régularisation, stock initial).
router.post("/:id/adjust", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const { type, quantity, reason, warehouse, lots } = req.body;
    if (!["in", "out", "set"].includes(type)) return bad(res, 'type must be "in", "out" or "set"');
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 0 || (type !== "set" && q <= 0)) return bad(res, "A positive quantity is required");
    const product = await Product.findById(req.params.id);
    if (!product) return bad(res, "Product not found", 404);
    const wh = isId(warehouse) ? warehouse : null;
    const common = { product, warehouse: wh, reason: String(reason || "").trim().slice(0, 300) || undefined, source: { kind: "manual" }, actorId: req.user.id, lots };
    if (type === "in") await stock.receive({ ...common, quantity: q, unitCost: num(req.body.unitCost) });
    else if (type === "out") await stock.issue({ ...common, quantity: q });
    else await stock.setCount({ ...common, counted: q });
    const [withLevels] = await withStock([await Product.findById(product._id).populate("category", "name")], product.company, wh);
    res.json({ success: true, data: withLevels });
  } catch (error) {
    if (error.status) return bad(res, error.message, error.status);
    console.error("POST product adjust error:", error);
    res.status(500).json({ success: false, message: "Error adjusting quantity", error: error.message });
  }
});

router.post("/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    if (!req.file) return bad(res, "Please select an image");
    const product = await Product.findById(req.params.id);
    if (!product) return bad(res, "Product not found", 404);
    const oldPublicId = product.image?.publicId;
    const result = await uploadImage(req.file.buffer, `companies/${product.company}/products`, { companyId: product.company });
    product.image = { url: result.secure_url, publicId: result.public_id, thumbUrl: result.thumb_url };
    product.updatedBy = req.user.id;
    await product.save();
    if (oldPublicId) await deleteImage(oldPublicId);
    res.json({ success: true, data: await product.populate("category", "name"), message: "Photo uploaded successfully" });
  } catch (error) {
    if (error.code === "STORAGE_QUOTA" || error.code === "BAD_IMAGE") return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    console.error("POST product photo error:", error);
    res.status(500).json({ success: false, message: "Error uploading photo", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid product ID");
    const product = await Product.findById(req.params.id);
    if (!product) return bad(res, "Product not found", 404);
    if (Math.abs(product.quantity || 0) > 1e-9) return bad(res, "This article still has stock — bring it to zero (or deactivate it) first");
    if (await Product.exists({ parent: product._id })) return bad(res, "Delete or move its variants first");
    if (await InventoryMovement.exists({ product: product._id, "source.kind": { $in: ["delivery", "invoice", "pos", "purchase"] } })) {
      return bad(res, "This article appears on documents — deactivate it instead of deleting it");
    }
    if (product.image?.publicId) await deleteImage(product.image.publicId);
    await InventoryMovement.deleteMany({ product: product._id });
    await StockLevel.deleteMany({ product: product._id });
    await StockLot.deleteMany({ product: product._id });
    await Product.findByIdAndDelete(product._id);
    await logAudit(req, { company: product.company, action: "delete", resourceType: "Product", resourceId: product._id, resourceLabel: product.name, before: product.toObject() });
    res.json({ success: true, message: "Product deleted successfully", productId: product._id });
  } catch (error) {
    console.error("DELETE product error:", error);
    res.status(500).json({ success: false, message: "Error deleting product", error: error.message });
  }
});

attachTranslationRoutes(router, Product, { resourceType: "Product", populate: "category" });

module.exports = router;
