// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * PORTEFEUILLE — one cheque or LCN (lettre de change normalisée,
 * "effet") received from a customer, from the payment on the invoice
 * to the money on the bank account:
 *
 *   in_portfolio → deposited (bordereau de remise) → cleared (encaissé)
 *                                                  ↘ unpaid (impayé)
 *   in_portfolio → unpaid (refused before deposit) · cancelled (payment deleted)
 *
 * Unpaid: the payment is taken off the invoice (it reopens, the
 * customer owes it again) and kept here in `payment`.
 */
const instrumentSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    kind: { type: String, enum: ["cheque", "lcn"], required: true },
    number: { type: String, trim: true, maxlength: 100, default: "" }, // n° du chèque / de l'effet
    bank: { type: String, trim: true, maxlength: 100, default: "" }, // banque tirée
    drawer: { type: String, trim: true, maxlength: 200, default: "" }, // tireur (if not the customer)
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice", required: true },
    invoiceNumber: String,
    paymentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    receivedAt: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true }, // date d'encaissement possible
    status: { type: String, enum: ["in_portfolio", "deposited", "cleared", "unpaid", "cancelled"], default: "in_portfolio", index: true },
    depositSlip: { type: mongoose.Schema.Types.ObjectId, ref: "DepositSlip", default: null },
    depositedAt: Date,
    clearedAt: Date,
    unpaidAt: Date,
    unpaidReason: { type: String, trim: true, maxlength: 300 },
    unpaidFees: { type: Number, default: 0, min: 0 }, // frais bancaires d'impayé
    payment: { type: mongoose.Schema.Types.Mixed, default: null }, // snapshot, kept when taken off the invoice
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    history: [{ _id: false, status: String, at: Date, by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, note: String }],
  },
  { timestamps: true }
);
instrumentSchema.index({ company: 1, invoice: 1, paymentId: 1 }, { unique: true });
instrumentSchema.index({ company: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("PaymentInstrument", instrumentSchema);
