// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * SALES TARGET (objectif commercial) — one per rep per month:
 * revenue HT to reach, the commission rate, an optional bonus when the
 * target is reached, and a collection target (recouvrement).
 * Achievements are computed live from invoices and payments
 * (services/salesRepService.js) — nothing is stored but the target.
 */
const salesTargetSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    period: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // "2026-10"
    revenueTarget: { type: Number, default: 0, min: 0 }, // HT
    collectionTarget: { type: Number, default: 0, min: 0 }, // TTC
    newCustomersTarget: { type: Number, default: 0, min: 0 },
    commissionRate: { type: Number, default: null, min: 0, max: 100 }, // % — null = company default
    bonus: { type: Number, default: 0, min: 0 }, // paid when revenue ≥ target
    notes: { type: String, trim: true, maxlength: 500 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
salesTargetSchema.index({ company: 1, salesRep: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("SalesTarget", salesTargetSchema);
