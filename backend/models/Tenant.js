const mongoose = require("mongoose");

/**
 * ============================================================
 * TENANT (client)
 * ============================================================
 * One paying client of the platform. A client owns one or more
 * companies (Company.tenant) and user accounts (User.tenant); every
 * business record is tied to one of those companies. Isolation
 * between clients is enforced centrally by services/tenantScope.js.
 *
 * limits: how many companies / employees the client may have.
 *
 * status "suspended" blocks every login and API call of the client's
 * users without deleting anything.
 * ============================================================
 */
const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Client name is required"], trim: true, maxlength: 150 },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    // Quotas set by the platform operator (null = unlimited). The
    // client's admin can create up to maxCompanies companies and keep
    // up to maxEmployees employees (terminated ones don't count) —
    // enforced in services/tenantLimits.js.
    limits: {
      maxCompanies: { type: Number, min: 0, default: null },
      maxEmployees: { type: Number, min: 0, default: null },
    },
    // Why the client is suspended: "manual" (by the operator) or
    // "unpaid" (services/billingService.js, lifted on payment).
    // Which product the client uses: the full ERP ("sanity") or the
    // simplified shop edition ("droguerie", a smaller menu and a shop home).
    edition: { type: String, enum: ["sanity", "droguerie"], default: "sanity" },
    // File storage (photos, logos, documents — services/storageService.js).
    // quotaMB: set by the platform operator for this client; null = the
    // plan's quota (Plan.storageQuotaMB), else STORAGE_DEFAULT_QUOTA_MB.
    // usedBytes: running total, kept by every upload and delete.
    storage: {
      quotaMB: { type: Number, min: 0, default: null },
      usedBytes: { type: Number, min: 0, default: 0 },
    },
    suspendedReason: { type: String, enum: ["manual", "unpaid", null], default: null },
    // What the client pays — services/billingService.js.
    subscription: {
      plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", default: null },
      cycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
      // Negotiated price HT per cycle (null = the plan's price).
      priceHT: { type: Number, min: 0, default: null },
      discountPct: { type: Number, min: 0, max: 100, default: 0 },
      status: { type: String, enum: ["none", "trial", "active", "past_due", "suspended", "cancelled"], default: "none" },
      trialEndsAt: { type: Date, default: null },
      // First billed day (invoices start the month of this date).
      startedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      // The set-up fee invoice, once made (never billed twice).
      setupInvoice: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformInvoice", default: null },
      billingEmail: { type: String, trim: true, lowercase: true, default: "" },
      // Buyer details printed on the invoices.
      billing: {
        legalName: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
        city: { type: String, trim: true, default: "" },
        ice: { type: String, trim: true, default: "" },
        taxId: { type: String, trim: true, default: "" },
        rc: { type: String, trim: true, default: "" },
      },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
