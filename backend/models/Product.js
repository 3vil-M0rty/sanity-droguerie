// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const translatable = require("../plugins/translatable");
const { productTokens } = require("../utils/searchTokens");

/**
 * ============================================================
 * PRODUCT (article de négoce)
 * ============================================================
 * One document per article sold: a robinet, a disjoncteur, a pot de
 * peinture 25 kg… Sanity buys and resells — nothing is manufactured.
 *
 *   quantity      CURRENT total stock over every warehouse, in the base
 *                 unit. Per-warehouse quantities live in StockLevel, the
 *                 history in InventoryMovement; only
 *                 services/stockService.js changes any of them.
 *   avgCost       CMUP (coût moyen unitaire pondéré) HT, recomputed at
 *                 every purchase reception — the cost of every sale and
 *                 the value of the stock.
 *   priceLevels   selling prices HT per price level (P1 revendeur, P2
 *                 gros, P3 détail…, defined in SalesSettings). A level
 *                 without a price here falls back to the level's markup
 *                 on CMUP, then to `sellingPrice` (prix public).
 *   packagings    other units the article is bought / sold in ("Carton
 *                 de 12", "Palette de 40 sacs"), each with its own
 *                 barcode; quantities are always stored in the base unit.
 *   parent / attributes
 *                 variants: "Mitigeur lavabo Atlas" (parent, not stocked)
 *                 → "… chromé", "… noir mat" (variants, stocked).
 *   tracking      none | lot (with expiry) | serial.
 * ============================================================
 */

const supplierPriceSchema = new mongoose.Schema(
  {
    supplierName: { type: String, trim: true, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    price: { type: Number, required: true, min: 0 },
    supplierReference: { type: String, trim: true },
  },
  { _id: false }
);

const priceLevelSchema = new mongoose.Schema(
  {
    level: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    price: { type: Number, required: true, min: 0 }, // HT, per base unit
  },
  { _id: false }
);

const packagingSchema = new mongoose.Schema(
  {
    unit: { type: String, required: true, trim: true, maxlength: 30 }, // Carton, Palette, Rouleau…
    factor: { type: Number, required: true, min: 0.0001 }, // base units in one
    barcode: { type: String, trim: true, maxlength: 40, default: "" },
    forSale: { type: Boolean, default: true },
    forPurchase: { type: Boolean, default: true },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    // No single-field index: every compound index below starts with company.
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    // Famille (InventoryCategory tree: Sanitaire › Robinetterie › Mitigeurs)
    category: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory", required: true, index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null, index: true },

    name: { type: String, required: [true, "Product name is required"], trim: true },
    // The company's own article code (unique per company when set).
    internalReference: { type: String, trim: true, uppercase: true },
    // Main EAN-13 / code-barres of the base unit.
    barcode: { type: String, trim: true, maxlength: 40, default: "" },
    // Manufacturer's reference (référence fabricant).
    manufacturerReference: { type: String, trim: true, maxlength: 60, default: "" },

    // url: the full picture (article page only). thumbUrl: a small one for
    // lists and cards — lists never send the full picture.
    image: { url: { type: String, trim: true }, publicId: { type: String, trim: true }, thumbUrl: { type: String, trim: true } },

    // Base unit (pièce, m, kg, L, sac, rouleau…) and its packagings.
    unit: { type: String, trim: true, default: "pièce" },
    packagings: { type: [packagingSchema], default: [] },
    weightKg: { type: Number, default: null, min: 0 }, // per base unit — loads of a delivery round

    quantity: { type: Number, default: 0 }, // every warehouse, base unit
    threshold: { type: Number, min: 0, default: 0 }, // stock minimum (alert)
    maxQuantity: { type: Number, min: 0, default: null }, // reorder up to

    // Purchase side
    prices: [supplierPriceSchema],
    avgCost: { type: Number, default: 0, min: 0 }, // CMUP HT
    lastPurchasePrice: { type: Number, default: null, min: 0 },
    lastPurchaseAt: { type: Date, default: null },

    // Sale side
    vatRate: { type: Number, default: 20, enum: [0, 7, 10, 14, 20] },
    sellingPrice: { type: Number, min: 0, default: null }, // prix public HT (fallback of every level)
    priceLevels: { type: [priceLevelSchema], default: [] },
    // Lowest price a salesperson may sell at without a manager (HT).
    minSellingPrice: { type: Number, min: 0, default: null },

    currency: { type: String, trim: true, default: "MAD" },

    // Variants
    isVariantParent: { type: Boolean, default: false },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null, index: true },
    attributes: [{ _id: false, name: { type: String, trim: true, maxlength: 40 }, value: { type: String, trim: true, maxlength: 60 } }],

    // Traceability
    tracking: { type: String, enum: ["none", "lot", "serial"], default: "none" },
    hasExpiry: { type: Boolean, default: false },
    shelfLifeDays: { type: Number, default: null, min: 0 },

    // Not counted in stock (service, transport, pose…).
    isService: { type: Boolean, default: false },

    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },

    // Last "stock at or below the threshold" alert — cleared when the
    // stock goes back above the threshold, so each drop alerts once.
    lowStockNotifiedAt: { type: Date, default: null },

    // Normalised words / codes the search runs on (utils/searchTokens.js).
    // Kept up to date on every save; never sent to the browser.
    searchTokens: { type: [String], default: undefined, select: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SEARCHED = ["name", "internalReference", "barcode", "manufacturerReference", "packagings", "prices", "attributes"];

productSchema.pre("save", function keepSearchAndThumb(next) {
  if (this.isNew || SEARCHED.some((f) => this.isModified(f)) || !this.searchTokens?.length) {
    this.searchTokens = productTokens(this);
  }
  // A picture given as a web link is its own thumbnail (the browser loads it
  // lazily); an uploaded photo comes with its 320 px thumbnail
  // (services/storageService.js); a data: picture must come with its own
  // small thumbnail (made by the browser).
  const urlChanged = this.isNew ? !!this.image?.url : this.isModified("image.url");
  const thumbGiven = this.isNew ? !!this.image?.thumbUrl : this.isModified("image.thumbUrl");
  if (urlChanged) {
    const url = this.image?.url || "";
    if (!url) this.image.thumbUrl = "";
    else if (!thumbGiven) this.image.thumbUrl = /^https?:\/\//i.test(url) ? url : "";
  }
  next();
});

// Multilingual (fr/en/ar) content layer for `name` and `notes`.
productSchema.plugin(translatable, { fields: ["name", "notes"] });

// Partial: uniqueness only for articles that HAVE a reference / barcode.
productSchema.index(
  { company: 1, internalReference: 1 },
  { unique: true, partialFilterExpression: { internalReference: { $gt: "" } } }
);
productSchema.index({ company: 1, barcode: 1 }, { partialFilterExpression: { barcode: { $gt: "" } } });
productSchema.index({ company: 1, "packagings.barcode": 1 });
// The article list: sorted by name, optionally inside a family.
productSchema.index({ company: 1, name: 1 });
productSchema.index({ company: 1, category: 1, name: 1 });
// Search: anchored prefixes on the tokens (see utils/searchTokens.js).
productSchema.index({ company: 1, searchTokens: 1 });
// "Articles of this supplier" filter.
productSchema.index({ company: 1, "prices.supplier": 1 }, { partialFilterExpression: { "prices.supplier": { $exists: true } } });

module.exports = mongoose.model("Product", productSchema);
