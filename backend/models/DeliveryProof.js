// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * Proof of delivery (preuve de livraison): the customer's signature and
 * a photo, taken on the driver's phone. Both arrive as compressed data
 * URLs. The signature (a few KB) stays here; the photo goes to private
 * file storage (services/storageService.js, counted in the client's
 * quota) and is opened through an expiring link. `photo` holds the
 * data URL only for proofs recorded before that.
 */
const proofSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    note: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryNote", required: true, index: true },
    signature: { type: String, default: "" }, // data:image/png;base64,…
    photo: { type: String, default: "" }, // legacy: data:image/jpeg;base64,…
    photoFile: { url: String, publicId: String, originalName: String, private: Boolean, resourceType: String, format: String },
    receivedBy: { type: String, trim: true, maxlength: 120 },
    gps: { lat: Number, lng: Number, accuracy: Number },
    takenAt: { type: Date, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientRef: { type: String, trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryProof", proofSchema);
