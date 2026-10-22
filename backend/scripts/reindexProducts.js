/**
 * Builds the search tokens of articles saved before the indexed search
 * (also done automatically at server start — this is the manual way):
 *   npm run reindex:products
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const tenantScope = require("../services/tenantScope");
const { backfillSearchTokens } = require("../services/productSearchIndex");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const n = await tenantScope.runAsSystem(() => backfillSearchTokens({ log: console.log }));
  await require("../models/Product").syncIndexes();
  console.log(`✓ ${n} article(s) indexed, indexes in sync`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
