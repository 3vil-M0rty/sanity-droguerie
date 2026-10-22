// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * REMISE DE FIN D'ANNÉE (RFA) — rebate by sales tier over a period.
 *   whole       — the rate of the highest tier reached applies to the whole turnover
 *   progressive — each rate applies to its slice only
 * Settled as a draft credit note per customer (SalesInvoice.rebateAgreement).
 */
const rebateSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    customers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Customer" }],
    customerTypes: [{ type: String, enum: ["reseller", "installer", "company", "retail"] }],
    tiers: [{ _id: false, threshold: { type: Number, required: true, min: 0 }, percent: { type: Number, required: true, min: 0, max: 50 } }],
    mode: { type: String, enum: ["whole", "progressive"], default: "whole" },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    settlements: [{
      _id: false,
      customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      turnover: Number, percent: Number, amount: Number,
      creditNote: { type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" },
      at: Date, by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RebateAgreement", rebateSchema);
