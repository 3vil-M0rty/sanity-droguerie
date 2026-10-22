// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * DELIVERY ROUND (tournée, TR-YYYY-NNNN) — one vehicle, one driver, one
 * day, an ordered list of BLs.
 *   planned → in_progress (truck left) → done (back; every BL delivered
 *   or brought back);  cancelled (BLs go back to "to plan").
 */
const deliveryRoundSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    number: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    zone: { type: String, trim: true, maxlength: 80, default: "" },
    vehicle: { type: String, trim: true, maxlength: 60, default: "" }, // immatriculation
    vehicleCapacityKg: { type: Number, default: null, min: 0 },
    driver: { type: String, trim: true, maxlength: 120, default: "" },
    driverUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    driverPhone: { type: String, trim: true, maxlength: 40, default: "" },
    status: { type: String, enum: ["planned", "in_progress", "done", "cancelled"], default: "planned", index: true },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    kmStart: { type: Number, default: null, min: 0 },
    kmEnd: { type: Number, default: null, min: 0 },
    cost: { type: Number, default: 0, min: 0 }, // fuel, tolls…
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
deliveryRoundSchema.index({ company: 1, number: 1 }, { unique: true });
deliveryRoundSchema.index({ company: 1, date: 1 });

module.exports = mongoose.model("DeliveryRound", deliveryRoundSchema);
