// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * Every WhatsApp message the app sends — or prepares as a wa.me link
 * when the WhatsApp Business API isn't connected. Delivery receipts
 * from Meta (sent → delivered → read / failed) update `status` via the
 * webhook (routes/publicDocs.js).
 */
const messageLogSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    channel: { type: String, enum: ["whatsapp"], default: "whatsapp" },
    kind: { type: String, enum: ["invoice", "statement", "reminder"], required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: "SalesInvoice" }],
    to: { type: String, required: true },
    text: { type: String, maxlength: 4000 },
    link: String, // public PDF link sent with the message
    // link = prepared wa.me link (a person sends it), simulated = no provider configured
    status: { type: String, enum: ["link", "simulated", "accepted", "sent", "delivered", "read", "failed"], required: true },
    provider: { type: String, enum: ["cloud", "link", "simulation"], required: true },
    providerId: { type: String, index: true },
    template: String,
    error: String,
    automatic: { type: Boolean, default: false },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
messageLogSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model("MessageLog", messageLogSchema);
