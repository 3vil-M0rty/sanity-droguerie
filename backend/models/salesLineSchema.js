const mongoose = require("mongoose");

/**
 * A priced line on a devis, a commande, a BL or an invoice. Amounts are
 * HT; `vatRate` in % (20, 14, 10, 7 or 0 in Morocco). `discount` is a %
 * off the line. `quantity` is in `unit`; when the unit is a packaging of
 * the article (Carton de 12) `unitFactor` gives the base units in one —
 * stock always moves `quantity × unitFactor` base units.
 *
 * `unitCost` is the CMUP HT per base unit when the goods left the stock
 * (BL, direct invoice, ticket) — the line's margin = HT − cost × qty × factor.
 */
module.exports = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  reference: { type: String, trim: true, maxlength: 60 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, trim: true, maxlength: 30 },
  unitFactor: { type: Number, default: 1, min: 0.0001 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  vatRate: { type: Number, default: 20, min: 0, max: 100 },
  unitCost: { type: Number, default: null },
  lots: [{ _id: false, number: String, quantity: Number, expiryDate: Date }],
  // Sales order lines: how much has left on BLs already.
  deliveredQuantity: { type: Number, default: 0, min: 0 },
  // BL lines: the order line they deliver.
  orderLine: { type: mongoose.Schema.Types.ObjectId, default: null },
  // Promotion that priced this line; `free` = goods given by a "10 + 1"
  // promotion (added by the server, never trusted from the client).
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", default: null },
  free: { type: Boolean, default: false },
});
