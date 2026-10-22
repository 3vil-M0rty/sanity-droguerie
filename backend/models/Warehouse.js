// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * WAREHOUSE (dépôt / magasin) — where stock physically sits.
 *   kind: "warehouse" (dépôt, entrepôt) | "store" (magasin / showroom with a counter)
 * Every stock quantity is per (article, warehouse) — see StockLevel.
 * Exactly one warehouse per company is the default: the one used when a
 * document doesn't say (purchase receptions, counter sales of a store
 * without its own register…). services/stockService.js creates
 * "Dépôt principal" the first time a company moves stock without one.
 */
const warehouseSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    code: { type: String, required: [true, "Warehouse code is required"], trim: true, uppercase: true, maxlength: 12 },
    name: { type: String, required: [true, "Warehouse name is required"], trim: true, maxlength: 120 },
    kind: { type: String, enum: ["warehouse", "store"], default: "warehouse" },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 50 },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    isDefault: { type: Boolean, default: false },
    // Counter sales allowed from this site (a store / showroom).
    hasCounter: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

warehouseSchema.index({ company: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Warehouse", warehouseSchema);
