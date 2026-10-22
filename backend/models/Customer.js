// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * CUSTOMER (client) — per company. Moroccan B2B invoices must show the
 * customer's ICE, so it's asked for (not required: individuals have none).
 *
 * Négoce (Sanity):
 *   type          reseller (revendeur / quincaillier), installer
 *                 (plombier, électricien, peintre), company (BTP,
 *                 promoteur), retail (particulier), walk_in (client
 *                 comptoir anonyme — one per company, used by the POS)
 *   priceLevel    the price level its prices come from (SalesSettings)
 *   discountPercent  extra % off every line (remise client)
 *   salesRep      the commercial who owns the account ("chacun ses
 *                 clients": reps see only theirs)
 *   creditLimit   max outstanding TTC (open invoices + undelivered
 *                 confirmed orders); 0 / null = no limit
 *   documentFlow  "full": devis → commande → BL → facture (grouped)
 *                 "direct": facture directe (stock leaves at issue) —
 *                 "les deux selon le client"
 *   zone / deliveryDays  for delivery rounds (tournées)
 */
const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 150 },
  role: { type: String, trim: true, maxlength: 100 },
  phone: { type: String, trim: true, maxlength: 50 },
  whatsapp: { type: String, trim: true, maxlength: 50 }, // where invoices / reminders go (else phone)
  // Payment reminders through WhatsApp: false = never send automatic ones
  autoReminders: { type: Boolean, default: true },
  email: { type: String, trim: true, lowercase: true, maxlength: 200 },
});

const customerSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: [true, "Customer name is required"], trim: true, maxlength: 200 },
    kind: { type: String, enum: ["company", "individual"], default: "company" },
    ice: { type: String, trim: true, maxlength: 30 },
    identifiantFiscal: { type: String, trim: true, maxlength: 30 },
    rc: { type: String, trim: true, maxlength: 30 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 50 },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 100 },
    contacts: [contactSchema],
    code: { type: String, trim: true, uppercase: true, maxlength: 20 }, // CL-0001
    type: { type: String, enum: ["reseller", "installer", "company", "retail", "walk_in"], default: "reseller", index: true },
    priceLevel: { type: String, trim: true, uppercase: true, default: null },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    creditLimit: { type: Number, default: null, min: 0 },
    // Account blocked (impayés) — no new order / BL until unblocked.
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String, trim: true, maxlength: 300 },
    documentFlow: { type: String, enum: ["full", "direct"], default: "full" },
    defaultWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    deliveryAddress: { type: String, trim: true, maxlength: 300 },
    zone: { type: String, trim: true, maxlength: 80 }, // secteur / tournée
    deliveryDays: [{ type: Number, min: 0, max: 6 }], // 1 = Monday
    gps: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
    // Days to pay an invoice (due date = invoice date + paymentDays).
    // Loi 69-21: 60 days by default between companies.
    paymentDays: { type: Number, default: 60, min: 0, max: 365 },
    notes: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

customerSchema.index({ company: 1, name: 1 });
customerSchema.index({ company: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $gt: "" } } });

module.exports = mongoose.model("Customer", customerSchema);
