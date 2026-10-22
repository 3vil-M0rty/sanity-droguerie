// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * ============================================================
 * PLATFORM INVOICE — the platform invoicing one of its clients
 * ============================================================
 * Carries `tenant`, so the isolation plugin lets a client see its own
 * invoices only ("Mon abonnement"); the platform operator works on
 * them with runAsSystem (routes/billing.js).
 *
 * A draft has no number. Issuing gives the next number of the year
 * (SAN-2026-0001…, no gaps) and freezes the seller / buyer details. An
 * issued invoice is never deleted: it is cancelled by a credit note
 * (type "credit_note", negative amounts, creditFor = the invoice).
 * ============================================================
 */

const lineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    unitPriceHT: { type: Number, required: true },
    totalHT: { type: Number, required: true },
  },
  { _id: false }
);

const partySchema = new mongoose.Schema(
  {
    legalName: String, legalForm: String, capital: String, address: String, city: String,
    ice: String, taxId: String, rc: String, patente: String, cnss: String,
    email: String, phone: String, bankName: String, rib: String,
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ["virement", "cheque", "effet", "especes", "carte", "autre"], default: "virement" },
    reference: { type: String, trim: true, maxlength: 80 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const platformInvoiceSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    type: { type: String, enum: ["invoice", "credit_note"], default: "invoice" },
    number: { type: String, trim: true, default: null },
    status: { type: String, enum: ["draft", "issued", "paid", "cancelled"], default: "draft", index: true },
    periodFrom: Date,
    periodTo: Date,
    issueDate: Date,
    dueDate: Date,
    lines: { type: [lineSchema], default: [] },
    totalHT: { type: Number, default: 0 },
    vatRate: { type: Number, default: 20 },
    vatAmount: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    payments: { type: [paymentSchema], default: [] },
    paidAmount: { type: Number, default: 0 },
    paidAt: Date,
    seller: partySchema,
    buyer: partySchema,
    creditFor: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInvoice", default: null },
    source: { type: String, enum: ["subscription", "manual"], default: "manual" },
    notes: { type: String, trim: true, maxlength: 1000 },
    emailedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One number per invoice; drafts have none.
platformInvoiceSchema.index({ number: 1 }, { unique: true, partialFilterExpression: { number: { $type: "string" } } });
// One subscription invoice per client and period.
platformInvoiceSchema.index({ tenant: 1, periodFrom: 1, source: 1 });

module.exports = mongoose.model("PlatformInvoice", platformInvoiceSchema);
