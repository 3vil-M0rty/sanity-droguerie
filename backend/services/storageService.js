const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * ============================================================
 * FILE STORAGE — Cloudflare R2, with a quota per client
 * ============================================================
 * Every photo (articles, logos, employees) and document (HR files,
 * supplier documents, delivery notes, invoices, quotes) goes through
 * here.
 *
 * Where files live
 *   cloudinary  Cloudinary, only when R2 is not configured and CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME,
 *          CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET) is set. Photos
 *          and logos are public images; documents are "authenticated"
 *          raw files, opened with a signed download link that expires
 *          after a few minutes (works even when the account blocks PDF
 *          delivery). CLOUDINARY_FOLDER prefixes every key (default "sanity").
 *   r2     Cloudflare R2 (S3-compatible), when R2_ACCOUNT_ID,
 *          R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET are set.
 *            R2_BUCKET          public bucket: photos and logos, served
 *                               from R2_PUBLIC_URL (its r2.dev URL or
 *                               your own domain, e.g. https://files.example.ma)
 *            R2_PRIVATE_BUCKET  private bucket (no public access): HR and
 *                               purchasing documents, opened with a link
 *                               that expires after a few minutes
 *   local  on this server's disk (STORAGE_LOCAL_DIR, default
 *          backend/uploads) when R2 isn't configured: development,
 *          tests, a demo. Not for production (lost when the server is
 *          rebuilt, not backed up with the database).
 *
 * Images are resized here before storage (at most 1000 px, WebP), so a
 * phone photo of 4 MB becomes ~100 KB; article photos also get a
 * 320 px thumbnail for lists.
 *
 * Quota: each client (Tenant) may store Tenant.storage.quotaMB, else its
 * plan's Plan.storageQuotaMB, else STORAGE_DEFAULT_QUOTA_MB (1024).
 * Space is reserved atomically before the upload, so two uploads at
 * the same time can't both squeeze past the limit. Every stored object
 * is one row of models/StoredFile.js; deleting a record's file frees
 * its space.
 *
 * Stored references keep the shape the records already use:
 *   { url, publicId: "r2:<key>" | "local:<key>", ... }
 * ============================================================
 */

const MB = 1024 * 1024;
const FILE_LINK_TTL_SECONDS = 5 * 60;
const IMAGE_MAX = 1000;
const THUMB_MAX = 320;

const r2Configured = () => !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);
const cloudinaryConfigured = () => !!(process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));
const driver = () => (r2Configured() ? "r2" : cloudinaryConfigured() ? "cloudinary" : "local");
const defaultQuotaMB = () => {
  const n = Number(process.env.STORAGE_DEFAULT_QUOTA_MB);
  return Number.isFinite(n) && n >= 0 && process.env.STORAGE_DEFAULT_QUOTA_MB !== "" && process.env.STORAGE_DEFAULT_QUOTA_MB !== undefined ? n : 1024;
};

const httpError = (status, message, code) => Object.assign(new Error(message), { status, code });

// ------------------------------------------------------------ drivers

let s3;
function r2() {
  if (!s3) {
    const { S3Client } = require("@aws-sdk/client-s3");
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
    });
  }
  return s3;
}
let cld;
function cloudinary() {
  if (!cld) {
    cld = require("cloudinary").v2;
    // CLOUDINARY_URL is read by the SDK itself; the three separate variables are passed here.
    if (!process.env.CLOUDINARY_URL) {
      cld.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    }
    cld.config({ secure: true });
  }
  return cld;
}
const cldFolder = () => String(process.env.CLOUDINARY_FOLDER ?? "sanity").replace(/^\/+|\/+$/g, "");
// Public images are stored as "image" (public id without extension, served as WebP);
// private documents as "raw" + "authenticated" (public id keeps its extension).
const cldId = (key, isPrivate) => {
  const id = cldFolder() ? `${cldFolder()}/${key}` : key;
  return isPrivate ? id : id.replace(/\.[^./]+$/, "");
};
const cldKind = (isPrivate) => (isPrivate ? { resource_type: "raw", type: "authenticated" } : { resource_type: "image", type: "upload" });

const bucketFor = (isPrivate) => (isPrivate ? process.env.R2_PRIVATE_BUCKET || process.env.R2_BUCKET : process.env.R2_BUCKET);
const localDir = () => path.resolve(process.env.STORAGE_LOCAL_DIR || path.join(__dirname, "..", "uploads"));
const localPath = (key, isPrivate) => {
  const full = path.resolve(localDir(), isPrivate ? "private" : "public", key);
  if (!full.startsWith(localDir() + path.sep)) throw httpError(400, "Invalid file key");
  return full;
};
const apiBase = () => (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");

function publicUrl(drv, key) {
  if (drv === "cloudinary") {
    const ext = (/\.([^./]+)$/.exec(key) || [])[1];
    return cloudinary().url(cldId(key, false), { resource_type: "image", type: "upload", secure: true, urlAnalytics: false, ...(ext ? { format: ext } : {}) });
  }
  if (drv === "r2") {
    const base = String(process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
    if (!base) throw httpError(503, "R2_PUBLIC_URL is not configured (the public address of the photos bucket)");
    return `${base}/${key}`;
  }
  return `${apiBase()}/uploads/${key}`;
}

async function putObject(drv, key, body, contentType, isPrivate, downloadName) {
  if (drv === "cloudinary") {
    const data = `data:${contentType || "application/octet-stream"};base64,${Buffer.from(body).toString("base64")}`;
    await cloudinary().uploader.upload(data, { public_id: cldId(key, isPrivate), ...cldKind(isPrivate), overwrite: false, ...(downloadName ? { context: { name: downloadName } } : {}) });
    return;
  }
  if (drv === "r2") {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await r2().send(new PutObjectCommand({
      Bucket: bucketFor(isPrivate),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      ...(downloadName ? { ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}` } : {}),
    }));
    return;
  }
  const file = localPath(key, isPrivate);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, body);
}

async function deleteObject(drv, key, isPrivate) {
  if (drv === "cloudinary") {
    await cloudinary().uploader.destroy(cldId(key, isPrivate), { ...cldKind(isPrivate), invalidate: true });
    return;
  }
  if (drv === "r2") {
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    await r2().send(new DeleteObjectCommand({ Bucket: bucketFor(isPrivate), Key: key }));
    return;
  }
  await fs.promises.unlink(localPath(key, isPrivate)).catch((err) => { if (err.code !== "ENOENT") throw err; });
}

// ------------------------------------------------------------ quota

/** The client a company belongs to (null for a company outside any client). */
async function tenantOfCompany(companyId) {
  if (!companyId) return null;
  const Company = require("../models/Company");
  const c = await Company.findById(companyId).select("tenant").lean();
  return c?.tenant || null;
}

const isSet = (v) => v !== null && v !== undefined;

/** Quota of a client: its own, else its plan's, else the default → { bytes, source }. */
async function quotaOf(tenant) {
  if (isSet(tenant?.storage?.quotaMB)) return { bytes: tenant.storage.quotaMB * MB, source: "client" };
  const planId = tenant?.subscription?.plan;
  if (planId) {
    const Plan = require("../models/Plan");
    const plan = await Plan.findById(planId).select("storageQuotaMB").lean();
    if (isSet(plan?.storageQuotaMB)) return { bytes: plan.storageQuotaMB * MB, source: "plan" };
  }
  return { bytes: defaultQuotaMB() * MB, source: "default" };
}
const quotaBytes = async (tenant) => (await quotaOf(tenant)).bytes;

const fmtMB = (bytes) => `${(bytes / MB).toLocaleString("fr-MA", { maximumFractionDigits: bytes < 10 * MB ? 1 : 0 })} Mo`;

/**
 * Reserves `bytes` for the client or refuses (413). Atomic: the update
 * only matches while usedBytes + bytes still fits the quota.
 */
async function reserve(tenantId, bytes, { enforce = true } = {}) {
  if (!tenantId || !bytes) return;
  const Tenant = require("../models/Tenant");
  if (!enforce) {
    await Tenant.updateOne({ _id: tenantId }, { $inc: { "storage.usedBytes": bytes } });
    return;
  }
  const tenant = await Tenant.findById(tenantId).select("storage subscription.plan").lean();
  if (!tenant) return;
  const quota = await quotaBytes(tenant);
  const r = bytes > quota ? { modifiedCount: 0 } : await Tenant.updateOne(
    { _id: tenantId, $or: [{ "storage.usedBytes": { $lte: quota - bytes } }, { "storage.usedBytes": { $exists: false } }, { "storage.usedBytes": null }] },
    { $inc: { "storage.usedBytes": bytes } }
  );
  if (!r.modifiedCount) {
    const used = tenant.storage?.usedBytes || 0;
    throw httpError(413, `Espace de stockage plein : ${fmtMB(used)} utilisés sur ${fmtMB(quota)}. Supprimez des fichiers ou demandez plus d'espace à votre fournisseur.`, "STORAGE_QUOTA");
  }
}

async function release(tenantId, bytes) {
  if (!tenantId || !bytes) return;
  const Tenant = require("../models/Tenant");
  await Tenant.updateOne({ _id: tenantId }, { $inc: { "storage.usedBytes": -bytes } });
  // Never below zero (a recount fixes any drift).
  await Tenant.updateOne({ _id: tenantId, "storage.usedBytes": { $lt: 0 } }, { $set: { "storage.usedBytes": 0 } });
}

/**
 * Usage of a client: { usedBytes, quotaBytes, quotaMB, source }, where
 * source says which quota applies: "client" (set for this client),
 * "plan" (its plan's) or "default" (STORAGE_DEFAULT_QUOTA_MB).
 * Pass the tenant document (with storage and subscription.plan) or its id.
 */
async function usage(tenantOrId) {
  let tenant = tenantOrId;
  if (!tenant?.storage && !tenant?.subscription) {
    const Tenant = require("../models/Tenant");
    tenant = await Tenant.findById(tenantOrId).select("storage subscription.plan").lean();
  }
  if (!tenant) return null;
  const q = await quotaOf(tenant);
  return { usedBytes: tenant.storage?.usedBytes || 0, quotaBytes: q.bytes, quotaMB: Math.round((q.bytes / MB) * 100) / 100, source: q.source };
}

/** Rebuilds a client's usedBytes from the ledger (models/StoredFile.js). */
async function recount(tenantId) {
  const StoredFile = require("../models/StoredFile");
  const Tenant = require("../models/Tenant");
  const rows = await StoredFile.find({ tenant: tenantId }).select("bytes").lean();
  const used = rows.reduce((s, r) => s + (r.bytes || 0), 0);
  await Tenant.updateOne({ _id: tenantId }, { $set: { "storage.usedBytes": used } });
  return { usedBytes: used, files: rows.length };
}

// ------------------------------------------------------------ store

const safeFolder = (folder) => String(folder || "files").split("/").map((p) => p.replace(/[^\w.-]/g, "_")).filter((p) => p && p !== "." && p !== "..").join("/");
const newKey = (tenantId, folder, ext) => `${tenantId ? `t${tenantId}` : "shared"}/${safeFolder(folder)}/${crypto.randomUUID()}${ext}`;

/** Stores the objects of one record (all or nothing), within the client's quota. */
async function storeObjects({ tenantId, companyId, folder, objects, kind, isPrivate, enforceQuota = true }) {
  const StoredFile = require("../models/StoredFile");
  const drv = driver();
  const total = objects.reduce((s, o) => s + o.body.length, 0);
  await reserve(tenantId, total, { enforce: enforceQuota });
  const written = [];
  try {
    for (const o of objects) {
      // eslint-disable-next-line no-await-in-loop
      await putObject(drv, o.key, o.body, o.contentType, isPrivate, o.downloadName);
      written.push(o);
    }
    await StoredFile.insertMany(objects.map((o) => ({
      tenant: tenantId, company: companyId || null, driver: drv, key: o.key, group: objects[0].key, bytes: o.body.length, kind, private: isPrivate, contentType: o.contentType, folder,
    })));
  } catch (err) {
    await release(tenantId, total);
    for (const o of written) await deleteObject(drv, o.key, isPrivate).catch(() => {}); // eslint-disable-line no-await-in-loop
    throw err;
  }
  return { drv, total };
}

/**
 * A photo: resized to at most 1000 px (WebP), plus a 320 px thumbnail.
 * Returns { secure_url, public_id, thumb_url, width, height, format, bytes }.
 */
async function uploadImage(buffer, folder, { companyId } = {}) {
  const sharp = require("sharp");
  let main;
  let thumb;
  try {
    main = await sharp(buffer).rotate().resize({ width: IMAGE_MAX, height: IMAGE_MAX, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    thumb = await sharp(buffer).rotate().resize({ width: THUMB_MAX, height: THUMB_MAX, fit: "inside", withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
  } catch {
    throw httpError(400, "Ce fichier n'est pas une image lisible (JPEG, PNG, WebP).", "BAD_IMAGE");
  }
  const tenantId = await tenantOfCompany(companyId);
  const key = newKey(tenantId, folder, ".webp");
  const thumbKey = key.replace(/\.webp$/, "_t.webp");
  const { drv, total } = await storeObjects({
    tenantId, companyId, folder, kind: "image", isPrivate: false,
    objects: [{ key, body: main.data, contentType: "image/webp" }, { key: thumbKey, body: thumb, contentType: "image/webp" }],
  });
  return {
    secure_url: publicUrl(drv, key),
    public_id: `${drv}:${key}`,
    thumb_url: publicUrl(drv, thumbKey),
    width: main.info.width,
    height: main.info.height,
    format: "webp",
    bytes: total,
  };
}

const EXT_BY_TYPE = { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

/**
 * A private document (HR, purchasing): stored as uploaded, opened only
 * through a short-lived link (privateFileUrl). Returns what the record
 * keeps: { url: "", publicId, originalName, private: true, resourceType, format }.
 * enforceQuota: false counts the file but never refuses it (a delivery
 * proof must not be lost because the client's storage is full).
 */
async function uploadPrivateFile(buffer, folder, originalName, mimetype, { companyId, enforceQuota = true } = {}) {
  const ext = EXT_BY_TYPE[mimetype] || (path.extname(String(originalName || "")).toLowerCase().replace(/[^.\w]/g, "").slice(0, 8) || "");
  const tenantId = await tenantOfCompany(companyId);
  const key = newKey(tenantId, folder, ext);
  const { drv } = await storeObjects({
    tenantId, companyId, folder, kind: "file", isPrivate: true, enforceQuota,
    objects: [{ key, body: buffer, contentType: mimetype || "application/octet-stream", downloadName: originalName }],
  });
  return { url: "", publicId: `${drv}:${key}`, originalName, private: true, resourceType: drv, format: ext.replace(".", "") };
}

const parseRef = (publicId) => {
  const m = /^(cloudinary|r2|local):(.+)$/.exec(String(publicId || ""));
  return m ? { drv: m[1], key: m[2] } : null;
};

/**
 * Deletes a record's file (and its thumbnail) and frees its space.
 * References from before R2 (old Cloudinary ids) are ignored.
 */
async function deleteStored(publicId) {
  const ref = parseRef(publicId);
  if (!ref) return null;
  const StoredFile = require("../models/StoredFile");
  const rows = await StoredFile.find({ group: ref.key }).lean();
  const list = rows.length ? rows : [{ key: ref.key, driver: ref.drv, private: false, bytes: 0, tenant: null }];
  for (const r of list) {
    // eslint-disable-next-line no-await-in-loop
    await deleteObject(r.driver || ref.drv, r.key, !!r.private).catch((err) => console.error("storage delete error:", err.message));
  }
  if (rows.length) {
    await StoredFile.deleteMany({ _id: { $in: rows.map((r) => r._id) } });
    const byTenant = new Map();
    for (const r of rows) if (r.tenant) byTenant.set(String(r.tenant), (byTenant.get(String(r.tenant)) || 0) + r.bytes);
    for (const [t, bytes] of byTenant) await release(t, bytes); // eslint-disable-line no-await-in-loop
  }
  return { result: "ok" };
}

// ------------------------------------------------------------ links

function localSign(key, ttlSeconds, name) {
  const { sign } = require("./publicLinks");
  return sign({ k: key, n: name || "" }, ttlSeconds / 86400);
}

/**
 * A link to open a stored file. Private files get a link that stops
 * working after `ttlSeconds`; public files and old ones keep their URL.
 */
async function privateFileUrl(file, { ttlSeconds = FILE_LINK_TTL_SECONDS } = {}) {
  if (!file) return null;
  const ref = parseRef(file.publicId);
  if (!file.private) return file.url || (ref ? publicUrl(ref.drv, ref.key) : null);
  if (!ref) return null; // private file from before R2: no longer reachable
  if (ref.drv === "cloudinary") {
    return cloudinary().utils.private_download_url(cldId(ref.key, true), "", {
      resource_type: "raw", type: "authenticated", expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  }
  if (ref.drv === "r2") {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucketFor(true), Key: ref.key }), { expiresIn: ttlSeconds });
  }
  return `${apiBase()}/api/files/raw/${localSign(ref.key, ttlSeconds, file.originalName)}`;
}

/** For routes/files.js: the local file behind a signed link, or null. */
function openLocalPrivate(token) {
  const { verify } = require("./publicLinks");
  const data = verify(token);
  if (!data?.k) return null;
  const file = localPath(data.k, true);
  if (!fs.existsSync(file)) return null;
  return { path: file, name: data.n || path.basename(file) };
}

/** Where the "local" driver keeps public files (served at /uploads). */
const localPublicDir = () => path.join(localDir(), "public");

function status() {
  return {
    driver: driver(),
    publicUrl: driver() === "cloudinary" ? `https://res.cloudinary.com/${cloudinary().config().cloud_name}` : driver() === "r2" ? process.env.R2_PUBLIC_URL || null : `${apiBase()}/uploads`,
    privateBucket: driver() === "r2" ? process.env.R2_PRIVATE_BUCKET || null : null,
    defaultQuotaMB: defaultQuotaMB(),
  };
}

module.exports = {
  FILE_LINK_TTL_SECONDS,
  uploadImage,
  uploadPrivateFile,
  // Same function for both: the reference says what to delete.
  deleteImage: deleteStored,
  deleteFile: deleteStored,
  privateFileUrl,
  openLocalPrivate,
  localPublicDir,
  usage,
  recount,
  quotaBytes,
  status,
  driver,
  MB,
};
