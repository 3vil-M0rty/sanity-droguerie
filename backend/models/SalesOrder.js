// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");
const lineSchema = require("./salesLineSchema");

/**
 * SALES ORDER (commande client) — CC-YYYY-NNNN per company.
 *   draft → confirmed (stock reserved in the warehouse)
 *         → partially_delivered → delivered (BLs)
 *         → invoiced (every BL invoiced);  cancelled (releases the reservation)
 * Comes from a devis, a rep's visit, a phone call or (later) the online
 * shop. Lines keep deliveredQuantity; BLs are created from the remaining.
 */
const salesOrderSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: "Quote", default: null },
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    priceLevel: { type: String, trim: true, uppercase: true, default: null },
    source: { type: String, enum: ["office", "rep", "phone", "online", "quote"], default: "office" },
    customerReference: { type: String, trim: true, maxlength: 80 }, // the reseller's own PO number
    // Id made by the phone for an order taken offline: sending it twice
    // (bad network, retry) never makes two orders.
    clientRef: { type: String, trim: true, maxlength: 64, default: null },
    gps: { lat: Number, lng: Number, accuracy: Number },
    date: { type: Date, required: true, default: Date.now },
    expectedDate: { type: Date, default: null },
    deliveryMode: { type: String, enum: ["delivery", "pickup"], default: "delivery" },
    deliveryAddress: { type: String, trim: true, maxlength: 400 },
    lines: { type: [lineSchema], validate: [(v) => v.length > 0, "An order needs at least one line"] },
    totalHT: { type: Number, default: 0 },
    totalVAT: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
    paymentTerms: { type: String, trim: true, maxlength: 300 },
    notes: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["draft", "confirmed", "partially_delivered", "delivered", "invoiced", "cancelled"],
      default: "draft",
      index: true,
    },
    confirmedAt: { type: Date, default: null },
    creditOverride: { by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, at: Date, reason: String },
    cancelReason: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

salesOrderSchema.index({ company: 1, number: 1 }, { unique: true });
salesOrderSchema.index({ company: 1, clientRef: 1 }, { unique: true, partialFilterExpression: { clientRef: { $type: "string" } } });

salesOrderSchema.pre("validate", function computeTotals() {
  const { computeLineTotals } = require("../services/salesCalc");
  Object.assign(this, computeLineTotals(this.lines));
});

module.exports = mongoose.model("SalesOrder", salesOrderSchema);
