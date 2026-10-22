/**
 * ============================================================
 * UNSEED — removes the Sanity demo client, and only it
 * ============================================================
 * Finds the demo tenant created by scripts/seedSanity.js
 * ("Smart Way (démo Sanity)") and deletes every record of its
 * companies (any collection with a `company` field), its users,
 * companies, notifications, audit logs and the tenant itself.
 * Nothing belonging to another client is touched.
 *
 *   npm run unseed
 *   npm run unseed:droguerie   (the Sanity Droguerie demo shop instead)
 * ============================================================
 */
const tenantScope = require("../services/tenantScope");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { DEMO_TENANT } = require("./seedSanity");

async function unseedSanityClient({ log = console.log, name = DEMO_TENANT } = {}) {
  const dir = path.join(__dirname, "..", "models");
  for (const f of fs.readdirSync(dir)) if (/^[A-Z]\w*\.js$/.test(f)) require(path.join(dir, f));
  const Tenant = mongoose.model("Tenant");
  const Company = mongoose.model("Company");
  const User = mongoose.model("User");
  const tenant = await Tenant.findOne({ name });
  if (!tenant) {
    log(`No "${name}" client found — nothing to remove.`);
    return 0;
  }
  const companyIds = (await Company.find({ tenant: tenant._id }).select("_id").lean()).map((c) => c._id);
  const userIds = (await User.find({ tenant: tenant._id }).select("_id").lean()).map((u) => u._id);
  let total = 0;
  // Photos and documents first (R2 or disk), while the list of them still exists.
  const storage = require("../services/storageService");
  const groups = await mongoose.model("StoredFile").distinct("group", { tenant: tenant._id });
  for (const g of groups) {
    const row = await mongoose.model("StoredFile").findOne({ group: g }).select("driver").lean(); // eslint-disable-line no-await-in-loop
    await storage.deleteFile(`${row?.driver || storage.driver()}:${g}`).catch((err) => log(`  (file ${g}: ${err.message})`)); // eslint-disable-line no-await-in-loop
  }
  if (groups.length) log(`  Files: ${groups.length}`);
  for (const Model of Object.values(mongoose.models)) {
    if (["Company", "User", "Tenant"].includes(Model.modelName)) continue;
    const or = [];
    if (Model.schema.path("company")) or.push({ company: { $in: companyIds } });
    if (Model.schema.path("tenant")) or.push({ tenant: tenant._id });
    if (Model.schema.path("user")) or.push({ user: { $in: userIds } });
    if (!or.length) continue;
    const { deletedCount } = await Model.deleteMany({ $or: or });
    if (deletedCount) log(`  ${Model.modelName}: ${deletedCount}`);
    total += deletedCount;
  }
  total += (await Company.deleteMany({ _id: { $in: companyIds } })).deletedCount;
  total += (await User.deleteMany({ tenant: tenant._id })).deletedCount;
  await Tenant.deleteOne({ _id: tenant._id });
  log(`✓ Removed "${name}" (${total} records)`);
  return total;
}

async function run() {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  await mongoose.connect(process.env.MONGODB_URI);
  const name = process.argv.includes("--droguerie") ? require("./seedDroguerie").DEMO_TENANT : DEMO_TENANT;
  await tenantScope.runAsSystem(() => unseedSanityClient({ name }));
  await mongoose.disconnect();
}

if (require.main === module) run().catch((err) => { console.error(err); process.exit(1); });

module.exports = { unseedSanityClient };
