// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * BRAND (marque) — Grohe, Legrand, Schneider, Colorado, Roca… Articles
 * point to one; lists, price lists and sales reports can be filtered by it.
 */
const brandSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: [true, "Brand name is required"], trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 60 },
    logo: { url: { type: String, trim: true }, publicId: { type: String, trim: true } },
    notes: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

brandSchema.index({ company: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Brand", brandSchema);
