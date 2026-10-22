// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * An offer the platform sells (Essentiel, Pro, Entreprise…). Platform
 * level. Changing a price changes future invoices only; issued
 * invoices keep their own lines.
 */
const planSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    monthlyPriceHT: { type: Number, required: true, min: 0 },
    // Yearly price (usually ~2 months free); null = monthly only.
    yearlyPriceHT: { type: Number, min: 0, default: null },
    // Applied to the client's quotas when the plan is chosen (null = unlimited).
    limits: {
      maxCompanies: { type: Number, min: 0, default: null },
      maxEmployees: { type: Number, min: 0, default: null },
    },
    // One-time set-up fee (import, configuration, training), excl. VAT.
    setupFeeHT: { type: Number, min: 0, default: 0 },
    // Who it is for — shown on the price list.
    audience: { type: String, trim: true, maxlength: 160, default: "" },
    // Contractual allowances printed on the price list (not enforced by the software).
    includedUsers: { type: Number, min: 0, default: null },
    includedWarehouses: { type: Number, min: 0, default: null },
    // Photos and documents a client on this plan may store, in MB
    // (null = STORAGE_DEFAULT_QUOTA_MB). A client's own quota overrides it.
    storageQuotaMB: { type: Number, min: 0, default: null },
    // Product edition a client on this plan gets (see Tenant.edition).
    edition: { type: String, enum: ["sanity", "droguerie"], default: "sanity" },
    // Highlighted as "recommended" on the price list.
    highlight: { type: Boolean, default: false },
    features: [{ type: String, trim: true, maxlength: 160 }],
    active: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
