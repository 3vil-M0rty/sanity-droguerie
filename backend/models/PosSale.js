// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const lineSchema = require("./salesLineSchema");

/**
 * POS SALE (ticket de caisse, TK-YYYY-NNNNNN) — a counter sale, paid on
 * the spot, possibly with several payment methods (espèces + carte…).
 * The goods leave the store's warehouse immediately (at the CMUP).
 *   completed → refunded (whole ticket back in stock, money given back)
 * `credit` as a method = put on the account of a known customer
 * (then an invoice is generated to follow the debt).
 */
const posPaymentSchema = new mongoose.Schema({
  method: { type: String, enum: ["especes", "carte", "cheque", "virement", "credit"], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  reference: { type: String, trim: true, maxlength: 80 },
}, { _id: false });

const posSaleSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "CashSession", required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null, index: true },
    customerName: { type: String, trim: true, maxlength: 120 }, // walk-in, optional
    date: { type: Date, default: Date.now },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, "A ticket needs at least one line"] },
    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    costTotal: { type: Number, default: 0 },
    payments: { type: [posPaymentSchema], default: [] },
    amountTendered: { type: Number, default: 0 }, // cash given
    change: { type: Number, default: 0 }, // rendu monnaie
    status: { type: String, enum: ["completed", "refunded"], default: "completed", index: true },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, trim: true, maxlength: 300 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice", default: null },
  },
  { timestamps: true }
);
posSaleSchema.index({ company: 1, number: 1 }, { unique: true });
posSaleSchema.index({ company: 1, date: -1 });

posSaleSchema.pre("validate", function computeTotals() {
  const { computeLineTotals, round2 } = require("../services/salesCalc");
  Object.assign(this, computeLineTotals(this.lines));
  this.costTotal = round2((this.lines || []).reduce((s, l) => s + (l.unitCost || 0) * l.quantity * (l.unitFactor || 1), 0));
});

module.exports = mongoose.model("PosSale", posSaleSchema);
