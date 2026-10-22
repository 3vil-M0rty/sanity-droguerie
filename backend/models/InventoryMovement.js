// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * ============================================================
 * INVENTORY MOVEMENT (mouvement de stock)
 * ============================================================
 * Every quantity change writes one of these — purchase receptions,
 * deliveries (BL), counter sales, transfers between warehouses, stock
 * counts, manual in / out. Written only by services/stockService.js.
 *
 *   type          in | out | adjustment | transfer_in | transfer_out
 *   quantity      always positive, base unit (direction = type)
 *   resultingQuantity           article total after (every warehouse) —
 *                               "stock as of date D" is one indexed query
 *   warehouseQuantity           that warehouse's quantity after
 *   unitCost      HT cost of the unit moved: purchase price for a
 *                 reception, CMUP for an exit (= cost of goods sold)
 *   avgCostAfter  the article's CMUP after this movement
 *   source        the document that moved it ({ kind, id, number })
 * ============================================================
 */
const inventoryMovementSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null, index: true },
    type: { type: String, enum: ["in", "out", "adjustment", "transfer_in", "transfer_out"], required: true },
    quantity: { type: Number, required: true, min: 0 },
    resultingQuantity: { type: Number, required: true },
    warehouseQuantity: { type: Number, default: null },
    unitCost: { type: Number, default: null, min: 0 },
    avgCostAfter: { type: Number, default: null, min: 0 },
    lots: [{ _id: false, number: String, quantity: Number, expiryDate: Date }],
    reason: { type: String, trim: true, maxlength: 300 },
    source: {
      kind: { type: String, enum: ["purchase", "purchase_return", "delivery", "delivery_return", "invoice", "credit_note", "pos", "pos_refund", "transfer", "count", "manual", "opening", "landed_cost", null], default: null },
      id: { type: mongoose.Schema.Types.ObjectId, default: null },
      number: { type: String, trim: true, default: "" },
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ company: 1, createdAt: -1 });
inventoryMovementSchema.index({ company: 1, "source.kind": 1, "source.id": 1 });

module.exports = mongoose.model("InventoryMovement", inventoryMovementSchema);
