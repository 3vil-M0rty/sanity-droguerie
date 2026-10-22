// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * The platform's own settings (one document, key "billing"): who
 * invoices the clients (legal identity printed on every invoice), VAT,
 * payment terms and what happens to unpaid accounts. Platform level.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "billing" },
    seller: {
      legalName: { type: String, trim: true, default: "" },
      legalForm: { type: String, trim: true, default: "" },
      capital: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      ice: { type: String, trim: true, default: "" },
      taxId: { type: String, trim: true, default: "" }, // IF
      rc: { type: String, trim: true, default: "" },
      patente: { type: String, trim: true, default: "" },
      cnss: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      bankName: { type: String, trim: true, default: "" },
      rib: { type: String, trim: true, default: "" },
    },
    invoicePrefix: { type: String, trim: true, uppercase: true, default: "SAN", maxlength: 8 },
    vatRate: { type: Number, min: 0, max: 100, default: 20 },
    paymentTermsDays: { type: Number, min: 0, max: 120, default: 15 },
    trialDays: { type: Number, min: 0, max: 180, default: 30 },
    // Unpaid: the client's access is suspended `graceDays` after the due
    // date when autoSuspend is on (off by default: suspend by hand).
    autoSuspend: { type: Boolean, default: false },
    graceDays: { type: Number, min: 0, max: 180, default: 15 },
    // E-mail each issued invoice to the client's billing address (SMTP needed).
    emailInvoices: { type: Boolean, default: true },
    // Options sold on top of a plan (price list + manual invoice lines).
    addons: [
      {
        code: { type: String, trim: true, uppercase: true, maxlength: 30 },
        name: { type: String, trim: true, maxlength: 120 },
        priceHT: { type: Number, min: 0, default: 0 },
        unit: { type: String, enum: ["month", "one_time", "quote"], default: "month" },
        note: { type: String, trim: true, maxlength: 200, default: "" },
        _id: false,
      },
    ],
    // Price list (PDF): tagline, validity, commercial terms printed at the bottom.
    priceList: {
      tagline: { type: String, trim: true, maxlength: 200, default: "" },
      validUntil: { type: Date, default: null },
      terms: { type: String, trim: true, maxlength: 1500, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
