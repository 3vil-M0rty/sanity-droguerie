/**
 * Why don't article photos show? Checks one stored photo end to end:
 *   1. which storage the server uses and its public address (R2_PUBLIC_URL)
 *   2. the photo is really in the bucket (R2 HeadObject)
 *   3. its public URL answers from the internet (HTTP GET)
 *
 * Run:  node scripts/checkImages.js        (from backend/, same .env as the server)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: true });
const mongoose = require("mongoose");
const tenantScope = require("../services/tenantScope");
const storage = require("../services/storageService");

const ok = (m) => console.log(`✓ ${m}`);
const ko = (m) => console.log(`✗ ${m}`);

(async () => {
  console.log(`Storage driver: ${storage.driver()}`);
  const pub = process.env.R2_PUBLIC_URL || "";
  console.log(`R2_BUCKET=${process.env.R2_BUCKET || "(empty)"}  R2_PUBLIC_URL=${pub || "(empty)"}`);
  if (storage.driver() === "r2") {
    if (!pub) ko("R2_PUBLIC_URL is empty: photo links can't be built.");
    else if (/r2\.cloudflarestorage\.com/.test(pub)) ko("R2_PUBLIC_URL is the S3 API endpoint (…r2.cloudflarestorage.com). That address is never public: use the bucket's Public Development URL (https://pub-….r2.dev) or your custom domain.");
    else if (!/^https:\/\//.test(pub)) ko("R2_PUBLIC_URL must start with https://");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const Product = require("../models/Product");
  const p = await tenantScope.runAsSystem(() => Product.findOne({ "image.publicId": { $exists: true, $ne: "" } }).select("name image").sort({ _id: -1 }).lean());
  if (!p) { ko("No article with a photo in the database."); return mongoose.disconnect(); }
  console.log(`\nArticle: ${p.name}\n  stored URL: ${p.image.url}\n  reference:  ${p.image.publicId}`);

  const [drv, key] = String(p.image.publicId).split(/:(.+)/);
  if (drv === "r2") {
    if (pub && !p.image.url.startsWith(pub.replace(/\/+$/, ""))) ko(`The stored URL doesn't start with the current R2_PUBLIC_URL: the photos were saved with another address (re-seed, or fix R2_PUBLIC_URL back).`);
    try {
      const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
      const s3 = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
      const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
      ok(`In bucket "${process.env.R2_BUCKET}" (${head.ContentLength} bytes, ${head.ContentType})`);
    } catch (err) {
      ko(`Not found in bucket "${process.env.R2_BUCKET}" with these keys (${err.name}). The photo was uploaded to another bucket/account, or the keys changed.`);
    }
  } else {
    ko(`This photo isn't on R2 (driver "${drv}"). It was stored before R2 was configured: re-seed (npm run unseed:droguerie, then npm run seed:droguerie -- --force).`);
  }

  try {
    const res = await fetch(p.image.url);
    if (res.ok) ok(`Public URL answers ${res.status} (${res.headers.get("content-type")}) — the image is reachable; if the app still shows nothing, reload with Ctrl+F5.`);
    else ko(`Public URL answers ${res.status}. ${res.status === 401 || res.status === 403 ? "Public access is OFF on the bucket: Cloudflare → R2 → bucket → Settings → Public Development URL → Enable (or connect a custom domain)." : res.status === 404 ? "Nothing at that address: wrong R2_PUBLIC_URL for this bucket, or the object is missing." : ""}`);
  } catch (err) {
    ko(`Public URL unreachable (${err.cause?.code || err.message}). Wrong domain in R2_PUBLIC_URL?`);
  }
  await mongoose.disconnect();
})().catch(async (err) => { console.error(err); await mongoose.disconnect(); process.exit(1); });
