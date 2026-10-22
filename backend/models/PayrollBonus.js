// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * ============================================================
 * PAYROLL BONUS — a variable amount for ONE month
 * ============================================================
 * Prime exceptionnelle, prime de l'Aïd, 13e mois, prime de bilan,
 * a sales rep's commission… Entered for a given month (before or
 * after the payroll run is generated) and added to that month's
 * payslip only. Fixed monthly allowances stay on the Salary record.
 *
 * kind: "taxable" (default) or one of the exempt kinds of
 * EXEMPT_ALLOWANCES in config/payrollConfig.js.
 * source: "manual", or "commission" when imported from the sales
 * reps' commissions (re-importing replaces those lines).
 * ============================================================
 */

const payrollBonusSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    label: { type: String, trim: true, required: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0 },
    kind: {
      type: String,
      enum: ["taxable", "transport", "transport_outside", "panier", "representation"],
      default: "taxable",
    },
    source: { type: String, enum: ["manual", "commission"], default: "manual" },
    // Commission import: the figures it came from, shown to HR.
    details: { type: mongoose.Schema.Types.Mixed, default: undefined },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

payrollBonusSchema.index({ company: 1, year: 1, month: 1 });

module.exports = mongoose.model("PayrollBonus", payrollBonusSchema);
