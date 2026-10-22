// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * PROMOTION — dated, applied automatically when a line is priced
 * (services/promotionService.js):
 *   percent    — extra discount % (best of it and the customer's own discount,
 *                or both when `stackable`)
 *   price      — promotional net price HT per base unit
 *   free_goods — "10 + 1": for every buyQuantity base units, freeQuantity free
 *                (a free line is added)
 * Targets: articles / families / brands (none = everything), customer
 * types / price levels / customers (none = everyone), channels.
 */
const ref = (model) => [{ type: mongoose.Schema.Types.ObjectId, ref: model }];
const promotionSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    active: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: { type: String, enum: ["percent", "price", "free_goods"], required: true },
    value: { type: Number, default: 0, min: 0 }, // % or price
    buyQuantity: { type: Number, default: null, min: 1 },
    freeQuantity: { type: Number, default: null, min: 1 },
    minQuantity: { type: Number, default: 0, min: 0 }, // base units on the line
    stackable: { type: Boolean, default: false },
    products: ref("Product"),
    categories: ref("InventoryCategory"),
    brands: ref("Brand"),
    customerTypes: [{ type: String, enum: ["reseller", "installer", "company", "retail", "walk_in"] }],
    priceLevels: [{ type: String, uppercase: true, trim: true }],
    customers: ref("Customer"),
    channels: { type: [{ type: String, enum: ["sales", "pos"] }], default: ["sales", "pos"] },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
promotionSchema.index({ company: 1, active: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);
