// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * STOCK COUNT (inventaire, INV-YYYY-NNNN) — a physical count of one
 * warehouse (all of it, or a family / a few articles).
 *   draft (counting: expected quantities frozen at creation, counted
 *   entered as people go) → validated (every gap becomes a stock
 *   adjustment at the CMUP) ; draft → cancelled
 */
const countLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  expected: { type: Number, default: 0 },
  counted: { type: Number, default: null, min: 0 },
  unitCost: { type: Number, default: 0 },
  note: { type: String, trim: true, maxlength: 200 },
});

const stockCountSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryCategory", default: null },
    title: { type: String, trim: true, maxlength: 150 },
    lines: { type: [countLineSchema], default: [] },
    status: { type: String, enum: ["draft", "validated", "cancelled"], default: "draft", index: true },
    validatedAt: { type: Date, default: null },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gapValue: { type: Number, default: 0 }, // Σ (counted − expected) × CMUP, at validation
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
stockCountSchema.index({ company: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("StockCount", stockCountSchema);
