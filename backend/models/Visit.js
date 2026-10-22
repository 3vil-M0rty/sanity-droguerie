// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/** A rep's visit to a customer, logged on the phone (offline-capable: clientRef). */
const visitSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    rep: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    visitedAt: { type: Date, required: true },
    outcome: { type: String, enum: ["order", "no_order", "closed", "collection", "prospect", "other"], default: "other" },
    notes: { type: String, trim: true, maxlength: 2000 },
    gps: { lat: Number, lng: Number, accuracy: Number },
    distanceMeters: { type: Number, default: null }, // from the customer's known location
    order: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder", default: null },
    nextVisitAt: { type: Date, default: null },
    clientRef: { type: String, trim: true, maxlength: 64, required: true },
  },
  { timestamps: true }
);
visitSchema.index({ company: 1, clientRef: 1 }, { unique: true });
visitSchema.index({ company: 1, visitedAt: -1 });

module.exports = mongoose.model("Visit", visitSchema);
