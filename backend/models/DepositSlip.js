// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/** Bordereau de remise: cheques / LCN handed to the bank together. */
const depositSlipSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    kind: { type: String, enum: ["cheque", "lcn"], required: true },
    // encaissement = wait for the due date; escompte = LCN discounted (bank advances the money)
    mode: { type: String, enum: ["encaissement", "escompte"], default: "encaissement" },
    bankAccount: { type: String, trim: true, maxlength: 120, default: "" },
    instruments: [{ type: mongoose.Schema.Types.ObjectId, ref: "PaymentInstrument" }],
    count: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
depositSlipSchema.index({ company: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("DepositSlip", depositSlipSchema);
