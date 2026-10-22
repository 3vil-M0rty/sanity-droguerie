// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * SALES SETTINGS — one per company: price levels, counter (POS) and
 * commission defaults. Created with sensible négoce defaults the first
 * time it's read (services/pricingService.js → getSettings).
 *
 * Price levels: "P1 Revendeur", "P2 Gros", "P3 Détail", "P4 Comptoir"…
 * Each customer has one (Customer.priceLevel). An article's price for a
 * level is its own price for that level, else CMUP × (1 + markup %),
 * else its public price (Product.sellingPrice).
 */
const priceLevelSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 10 },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    markupPercent: { type: Number, default: null, min: 0, max: 1000 }, // on CMUP when the article has no price for this level
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const salesSettingsSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, unique: true, index: true },
    priceLevels: { type: [priceLevelSchema], default: [] },
    defaultPriceLevel: { type: String, trim: true, uppercase: true, default: "P3" }, // new customers
    posPriceLevel: { type: String, trim: true, uppercase: true, default: "P4" }, // walk-in counter customers
    // Refuse to confirm an order / validate a BL above the customer's credit limit
    // (a "sales.customers.credit" login can override).
    blockOverCreditLimit: { type: Boolean, default: true },
    // Selling below minSellingPrice / below CMUP needs "sales.pricing.edit".
    blockBelowCost: { type: Boolean, default: true },
    // false = the shop isn't subject to VAT (small droguerie): new
    // articles and quick purchases carry 0 % VAT.
    vatRegistered: { type: Boolean, default: true },
    // Commissions: on what, at which default rate (per rep: SalesTarget.commissionRate).
    commissionBase: { type: String, enum: ["invoiced", "collected", "margin"], default: "collected" },
    defaultCommissionRate: { type: Number, default: 2, min: 0, max: 100 },
    // Ticket (counter receipt)
    ticketHeader: { type: String, trim: true, maxlength: 500, default: "" },
    ticketFooter: { type: String, trim: true, maxlength: 500, default: "Merci de votre visite — les articles ne sont ni repris ni échangés sans ticket." },
    // Counter sales above this amount (TTC) need a named customer (invoice).
    posMaxAnonymousAmount: { type: Number, default: 5000, min: 0 },
    // ---- accounting export (Plan Comptable Marocain defaults; the
    // accountant adapts the numbers to their own chart)
    accounting: {
      customers: { type: String, trim: true, default: "3421" }, // Clients
      suppliers: { type: String, trim: true, default: "4411" }, // Fournisseurs
      sales: { type: String, trim: true, default: "7111" }, // Ventes de marchandises
      purchases: { type: String, trim: true, default: "6111" }, // Achats de marchandises
      vatCollected: { type: String, trim: true, default: "4455" }, // État, TVA facturée
      vatDeductible: { type: String, trim: true, default: "34552" }, // État, TVA récupérable sur charges
      bank: { type: String, trim: true, default: "5141" }, // Banques
      cash: { type: String, trim: true, default: "5161" }, // Caisses
      valuesToCollect: { type: String, trim: true, default: "5111" }, // Chèques et valeurs à encaisser
      cardClearing: { type: String, trim: true, default: "5141" }, // carte: bank by default
      rebates: { type: String, trim: true, default: "7119" }, // RRR accordés
      salesByRate: { type: Map, of: String, default: {} }, // { "20": "71110020", … } optional
      journals: {
        sales: { type: String, trim: true, default: "VT" },
        purchases: { type: String, trim: true, default: "HA" },
        bank: { type: String, trim: true, default: "BQ" },
        cash: { type: String, trim: true, default: "CA" },
      },
      customerAccountMode: { type: String, enum: ["single", "auxiliary"], default: "auxiliary" }, // auxiliary = tiers code per customer
      vatRegime: { type: String, enum: ["encaissement", "debit"], default: "encaissement" },
    },
    // ---- e-invoicing (DGI clearance)
    einvoicing: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, enum: ["simulation", "http"], default: "simulation" },
      autoSubmit: { type: Boolean, default: false }, // submit as soon as an invoice is issued
    },
    // ---- reseller ordering portal (/portail)
    portal: {
      enabled: { type: Boolean, default: false },
      showStock: { type: String, enum: ["exact", "level", "none"], default: "level" }, // level = en stock / stock limité / sur commande
      minOrderAmount: { type: Number, default: 0, min: 0 }, // HT
      message: { type: String, trim: true, maxlength: 500, default: "" }, // banner on the portal home
    },
    // ---- WhatsApp payment reminders
    whatsapp: {
      autoReminders: { type: Boolean, default: false }, // daily job, Business API only
      reminderDays: { type: [Number], default: [3, 15, 30] }, // days after the due date
      signature: { type: String, trim: true, maxlength: 200, default: "" },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesSettings", salesSettingsSchema);
