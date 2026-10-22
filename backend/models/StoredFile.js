const mongoose = require("mongoose");

/**
 * ============================================================
 * STORED FILE — one object in file storage (services/storageService.js)
 * ============================================================
 * The ledger behind each client's storage quota: every image or
 * document Sanity stores for a client is one row, with its size.
 * Tenant.storage.usedBytes is the running total of these rows;
 * `npm run storage:recount` (or the platform's "Recompter") rebuilds
 * it from here.
 *   group  the record's main key: an article photo is stored as the
 *          picture + its thumbnail, two rows with the same group,
 *          deleted together.
 * ============================================================
 */
const storedFileSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", default: null, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    driver: { type: String, enum: ["r2", "local"], required: true },
    key: { type: String, required: true, unique: true },
    group: { type: String, required: true, index: true },
    bytes: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: ["image", "file"], required: true },
    private: { type: Boolean, default: false },
    contentType: { type: String, trim: true },
    folder: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StoredFile", storedFileSchema);
