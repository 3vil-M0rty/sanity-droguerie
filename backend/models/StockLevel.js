// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * STOCK LEVEL — quantity of one article in one warehouse.
 *   quantity  physically there (base unit of the article)
 *   reserved  promised to confirmed sales orders not delivered yet
 *   available = quantity − reserved
 * Product.quantity is the sum over every warehouse (fast path for lists).
 * Only services/stockService.js writes here.
 */
const stockLevelSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    // Shelf / aisle in this warehouse ("A-12-3").
    location: { type: String, trim: true, maxlength: 40, default: "" },
    // Per-warehouse minimum (falls back to Product.threshold when null).
    minQuantity: { type: Number, default: null, min: 0 },
    lastMovementAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockLevelSchema.index({ product: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model("StockLevel", stockLevelSchema);
