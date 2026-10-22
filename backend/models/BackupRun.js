// Must load before the schema is compiled — registers the client-isolation plugin.
require("../services/tenantScope");
const mongoose = require("mongoose");

/**
 * One automatic backup (and, weekly, its restore drill) — written by
 * services/backupScheduler.js, shown to the platform operator. Platform
 * level (no tenant / company path).
 */
const backupRunSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["backup", "drill"], required: true },
    status: { type: String, enum: ["ok", "failed"], required: true },
    folder: String,
    collections: Number,
    documents: Number,
    sizeBytes: Number,
    durationMs: Number,
    pruned: [String],
    problems: [String],
    error: String,
  },
  { timestamps: true }
);

backupRunSchema.index({ createdAt: -1 });
backupRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 400 * 24 * 3600 });

module.exports = mongoose.model("BackupRun", backupRunSchema);
