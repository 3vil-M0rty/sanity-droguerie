// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const lineSchema = require("./salesLineSchema");

/**
 * DELIVERY NOTE (bon de livraison, BL-YYYY-NNNN) — goods leaving a
 * warehouse for a customer (or coming back: type "return", BR-…).
 *
 *   draft → validated   stock leaves the warehouse (at the CMUP, which
 *                        each line keeps as unitCost) — "préparé / sorti"
 *         → delivered   signed by the customer (in a round or picked up)
 *   validated|delivered → cancelled  stock goes back in
 *
 * Priced like the order (lines carry prices) so it can be invoiced:
 * one invoice for one BL, or one invoice grouping every BL of the month
 * (`invoice` is set when invoiced).
 */
const deliveryNoteSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    type: { type: String, enum: ["delivery", "return"], default: "delivery" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", default: null, index: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    date: { type: Date, default: Date.now },
    deliveryMode: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
    address: { type: String, trim: true, maxlength: 400 },
    contactName: { type: String, trim: true, maxlength: 120 },
    contactPhone: { type: String, trim: true, maxlength: 40 },
    round: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryRound", default: null, index: true },
    roundOrder: { type: Number, default: 0 }, // stop number in the round
    driver: { type: String, trim: true, maxlength: 120, default: "" },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, "A delivery note needs at least one line"] },
    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    costTotal: { type: Number, default: 0 }, // CMUP × quantities, once validated
    weightKg: { type: Number, default: 0 },
    packages: { type: Number, default: null, min: 0 },
    status: { type: String, enum: ["draft", "validated", "delivered", "cancelled"], default: "draft", index: true },
    validatedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    receivedBy: { type: String, trim: true, maxlength: 120, default: "" },
    // Proof of delivery taken on the driver's phone (signature, photo, GPS): models/DeliveryProof.js
    proof: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryProof", default: null },
    reserves: { type: String, trim: true, maxlength: 2000, default: "" }, // remarks at reception
    // Cash on delivery collected by the driver (recorded on the invoice later).
    cashCollected: { type: Number, default: 0, min: 0 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice", default: null, index: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    cancelReason: { type: String, trim: true, maxlength: 500, default: "" },
    history: [{ status: String, note: String, at: { type: Date, default: Date.now }, by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, _id: false }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
deliveryNoteSchema.index({ company: 1, number: 1 }, { unique: true });
deliveryNoteSchema.index({ company: 1, date: 1 });

deliveryNoteSchema.pre("validate", function computeTotals() {
  const { computeLineTotals, round2 } = require("../services/salesCalc");
  Object.assign(this, computeLineTotals(this.lines));
  this.costTotal = round2((this.lines || []).reduce((s, l) => s + (l.unitCost || 0) * l.quantity * (l.unitFactor || 1), 0));
});

module.exports = mongoose.model("DeliveryNote", deliveryNoteSchema);
