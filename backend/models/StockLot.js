// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * STOCK LOT — what is left of one lot (batch) or one serial number of
 * an article, in one warehouse.
 *   Product.tracking "lot"    → a lot has a number, maybe an expiry date
 *                               (paints, glues, silicones, sealants…)
 *   Product.tracking "serial" → one record per serial number, quantity 0/1
 *                               (water heaters, pumps, power tools…)
 * Outgoing stock picks lots FEFO (first expiry, first out) unless the
 * document names the lot — services/stockService.js.
 */
const stockLotSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    number: { type: String, required: true, trim: true, maxlength: 60 },
    kind: { type: String, enum: ["lot", "serial"], default: "lot" },
    expiryDate: { type: Date, default: null, index: true },
    quantity: { type: Number, default: 0, min: 0 },
    receivedAt: { type: Date, default: Date.now },
    unitCost: { type: Number, default: null, min: 0 },
    expiryNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

stockLotSchema.index({ product: 1, warehouse: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("StockLot", stockLotSchema);
