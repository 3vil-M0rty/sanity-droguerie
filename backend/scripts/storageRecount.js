/**
 * Rebuilds every client's used storage (Tenant.storage.usedBytes) from the
 * list of stored files (models/StoredFile.js) and prints usage / quota.
 * Same as Platform → Clients → "Recompter", for all clients at once.
 *
 *   npm run storage:recount
 */
const tenantScope = require("../services/tenantScope");
const mongoose = require("mongoose");
const path = require("path");

async function run() {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  await mongoose.connect(process.env.MONGODB_URI);
  const Tenant = require("../models/Tenant");
  const storage = require("../services/storageService");
  await tenantScope.runAsSystem(async () => {
    console.log(`Storage: ${({ cloudinary: "Cloudinary", r2: "Cloudflare R2" })[storage.status().driver] || "local disk (no cloud storage configured)"}`);
    for (const t of await Tenant.find().select("name").sort({ name: 1 }).lean()) {
      const { files } = await storage.recount(t._id); // eslint-disable-line no-await-in-loop
      const u = await storage.usage(t._id); // eslint-disable-line no-await-in-loop
      const pct = u.quotaBytes ? Math.round((u.usedBytes / u.quotaBytes) * 100) : 0;
      console.log(`  ${t.name.padEnd(40)} ${(u.usedBytes / 1048576).toFixed(1).padStart(9)} MB / ${String(u.quotaMB).padStart(6)} MB  ${String(pct).padStart(3)} %  (${files} files, ${u.source} quota)`);
    }
  });
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
