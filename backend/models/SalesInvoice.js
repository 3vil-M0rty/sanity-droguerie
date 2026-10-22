// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const lineSchema = require("./salesLineSchema");

/**
 * SALES INVOICE (facture client).
 *   type: "invoice" | "deposit" (facture d'acompte) | "credit_note" (avoir)
 *   status: draft → issued → partially_paid → paid;  cancelled (drafts only)
 *
 * The NUMBER is given only when the invoice is ISSUED (FA-/AC-/AV-
 * YYYY-NNNN), so invoice numbers follow each other without gaps —
 * a legal requirement. An issued invoice is never edited or deleted:
 * it's corrected with a credit note.
 *
 * A final invoice of a devis lists the devis lines and deducts the
 * deposit invoices already issued (`depositsDeducted`, HT).
 *
 * Négoce: an invoice either groups delivered BLs (`deliveryNotes`, the
 * stock already left with them) or is a direct invoice that moves the
 * stock itself when issued (`moveStock`, from `warehouse`).
 */
const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ["virement", "cheque", "especes", "effet", "carte", "compensation", "autre"], default: "virement" },
  dueDate: { type: Date, default: null }, // chèque / effet (LCN) due date
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // rep / driver who collected
  reference: { type: String, trim: true, maxlength: 100 },
  notes: { type: String, trim: true, maxlength: 500 },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const salesInvoiceSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, trim: true, default: null },
    type: { type: String, enum: ["invoice", "deposit", "credit_note"], default: "invoice" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", default: null, index: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", default: null, index: true },
    // Invoice grouping BLs (stock already out) …
    deliveryNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "DeliveryNote" }],
    // … or a direct invoice: goods leave this warehouse when it's issued
    // (credit note with returnToStock: they come back in).
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    moveStock: { type: Boolean, default: false },
    stockMovedAt: { type: Date, default: null },
    costTotal: { type: Number, default: 0 }, // CMUP × quantities (margin)
    posSale: { type: mongoose.Schema.Types.ObjectId, ref: "PosSale", default: null },
    // credit note → the invoice it corrects
    creditedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice", default: null },
    date: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, default: null },
    subject: { type: String, trim: true, maxlength: 300 },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, "An invoice needs at least one line"] },
    // Deposits already invoiced, deducted from a final invoice, per VAT
    // rate (so the final invoice's VAT per rate stays exact).
    depositBreakdown: [{ _id: false, rate: Number, baseHT: Number, vat: Number }],
    depositInvoices: [{ type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" }],
    depositsDeductedHT: { type: Number, default: 0 },
    depositsDeductedVAT: { type: Number, default: 0 },
    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    vatBreakdown: [{ _id: false, rate: Number, baseHT: Number, vat: Number }],
    paymentTerms: { type: String, trim: true, maxlength: 300 },
    notes: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["draft", "issued", "partially_paid", "paid", "cancelled"],
      default: "draft",
      index: true,
    },
    issuedAt: { type: Date, default: null },
    payments: [paymentSchema],
    // Credit note settling a year-end rebate (RFA)
    rebateAgreement: { type: mongoose.Schema.Types.ObjectId, ref: "RebateAgreement", default: null },
    amountPaid: { type: Number, default: 0 },
    overdueNotifiedAt: { type: Date, default: null }, // "overdue" alert sent once
    // E-invoicing (DGI clearance): the invoice as UBL XML, sent to the
    // tax platform, which validates it and returns its own identifier.
    einvoice: {
      status: { type: String, enum: ["not_sent", "pending", "accepted", "rejected", "error"], default: "not_sent" },
      provider: { type: String, default: null },
      reference: { type: String, default: null }, // id given by the platform
      qr: { type: String, default: null }, // verification payload / URL to print
      xmlHash: { type: String, default: null }, // SHA-256 of the XML sent
      submittedAt: { type: Date, default: null },
      answeredAt: { type: Date, default: null },
      message: { type: String, default: null },
      attempts: { type: Number, default: 0 },
    },
    // Recouvrement: calls, visits, promises of payment.
    collectionActions: [{
      date: { type: Date, default: Date.now },
      type: { type: String, enum: ["call", "visit", "reminder", "promise", "dispute", "note"], default: "note" },
      note: { type: String, trim: true, maxlength: 500 },
      promiseDate: { type: Date, default: null },
      promiseAmount: { type: Number, default: null, min: 0 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Unique only once numbered (drafts have none).
salesInvoiceSchema.index(
  { company: 1, number: 1 },
  { unique: true, partialFilterExpression: { number: { $type: "string" } } }
);
salesInvoiceSchema.index({ company: 1, status: 1, dueDate: 1 });

salesInvoiceSchema.pre("validate", function computeTotals() {
  const { computeInvoiceTotals, paymentStatus } = require("../services/salesCalc");
  Object.assign(this, computeInvoiceTotals(this));
  this.costTotal = Math.round((this.lines || []).reduce((s, l) => s + (l.unitCost || 0) * l.quantity * (l.unitFactor || 1), 0) * 100) / 100;
  this.amountPaid = Math.round((this.payments || []).reduce((s, p) => s + (p.amount || 0), 0) * 100) / 100;
  if (["issued", "partially_paid", "paid"].includes(this.status)) this.status = paymentStatus(this);
});

module.exports = mongoose.model("SalesInvoice", salesInvoiceSchema);
