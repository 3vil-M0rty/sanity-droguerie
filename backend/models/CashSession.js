// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * CASH SESSION (session de caisse, CS-YYYY-NNNN) — one cashier at one
 * register of a store, from opening (fond de caisse) to closing (count).
 *   open → closed
 * At closing the cashier counts each payment method; `expected` is what
 * the tickets say; `difference` = counted − expected (écart de caisse).
 */
const byMethod = { especes: { type: Number, default: 0 }, carte: { type: Number, default: 0 }, cheque: { type: Number, default: 0 }, virement: { type: Number, default: 0 }, credit: { type: Number, default: 0 } };

const cashSessionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    register: { type: String, trim: true, maxlength: 40, default: "Caisse 1" },
    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    openingFloat: { type: Number, default: 0, min: 0 }, // fond de caisse
    // Cash in / out during the session (bank deposit, petty expense…).
    cashMoves: [{ type: { type: String, enum: ["in", "out"] }, amount: { type: Number, min: 0.01 }, reason: String, at: { type: Date, default: Date.now }, by: { type: mongoose.Schema.Types.ObjectId, ref: "User" } }],
    expected: byMethod,
    counted: byMethod,
    difference: { type: Number, default: 0 }, // cash only
    ticketCount: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    closingNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);
cashSessionSchema.index({ company: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("CashSession", cashSessionSchema);
