// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * ============================================================
 * ERROR EVENT — one group of identical errors (platform level)
 * ============================================================
 * Written by services/monitoringService.js: server 500s (with the
 * stack the route logged), crashes, failed scheduled jobs and errors
 * from users' browsers. Identical errors share one document
 * (fingerprint) with a counter and the last few occurrences.
 *
 * Platform-level on purpose (no `tenant` / `company` path): only the
 * platform operator reads it (routes/platform.js). tenantRef/userRef
 * say who was affected. Request bodies are never stored; URLs are kept
 * without their query string. Deleted 90 days after the last
 * occurrence (TTL index).
 * ============================================================
 */

const sampleSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    tenantRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    userRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    url: String,
    status: Number,
    stack: String,
    userAgent: String,
    build: String,
  },
  { _id: false }
);

const errorEventSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true, unique: true },
    source: { type: String, enum: ["server", "browser", "job", "crash"], required: true },
    message: { type: String, required: true, maxlength: 1000 },
    route: { type: String, maxlength: 300 },
    count: { type: Number, default: 1 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    tenantsAffected: [{ type: mongoose.Schema.Types.ObjectId }],
    status: { type: String, enum: ["open", "resolved", "ignored"], default: "open", index: true },
    resolvedAt: Date,
    lastAlertAt: Date,
    samples: [sampleSchema],
  },
  { timestamps: true }
);

errorEventSchema.index({ lastSeen: -1 });
errorEventSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });

module.exports = mongoose.model("ErrorEvent", errorEventSchema);
