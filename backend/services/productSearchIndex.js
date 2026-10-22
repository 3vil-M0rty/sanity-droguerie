const Product = require("../models/Product");
const { productTokens } = require("../utils/searchTokens");

/**
 * Fills `searchTokens` (and the thumbnail of web-link pictures) on
 * articles saved before the indexed search existed. New and edited
 * articles get them on save (models/Product.js), so after one pass this
 * finds nothing to do. Works in batches: never the whole catalogue in
 * memory. Returns how many articles were updated.
 */
async function backfillSearchTokens({ batchSize = 500, log = () => {} } = {}) {
  let done = 0;
  let lastId = null;
  for (;;) {
    const filter = { searchTokens: { $exists: false } };
    if (lastId) filter._id = { $gt: lastId };
    const batch = await Product.find(filter)
      .select("name internalReference barcode manufacturerReference packagings prices attributes image")
      .sort({ _id: 1 }).limit(batchSize).lean();
    if (!batch.length) break;
    await Product.bulkWrite(batch.map((p) => {
      const $set = { searchTokens: productTokens(p) };
      if (p.image?.url && !p.image.thumbUrl && /^https?:\/\//i.test(p.image.url)) $set["image.thumbUrl"] = p.image.url;
      return { updateOne: { filter: { _id: p._id }, update: { $set } } };
    }));
    done += batch.length;
    lastId = batch[batch.length - 1]._id;
    log(`… ${done} article(s) indexed`);
  }
  return done;
}

module.exports = { backfillSearchTokens };
