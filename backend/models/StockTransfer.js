// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * STOCK TRANSFER (transfert inter-dépôts, TF-YYYY-NNNN).
 *   draft → sent (goods leave `from`, in transit) → received (enter `to`)
 *   draft → cancelled
 * Each line can be received short (receivedQuantity); the gap goes back
 * to the sending warehouse.
 */
const transferLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 0.0001 },
  receivedQuantity: { type: Number, default: null, min: 0 },
  lots: [{ _id: false, number: String, quantity: Number, expiryDate: Date }],
});

const stockTransferSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    lines: { type: [transferLineSchema], validate: [(v) => v.length > 0, "A transfer needs at least one line"] },
    status: { type: String, enum: ["draft", "sent", "received", "cancelled"], default: "draft", index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    sentAt: { type: Date, default: null },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receivedAt: { type: Date, default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
stockTransferSchema.index({ company: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("StockTransfer", stockTransferSchema);
