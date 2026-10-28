import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

/**
 * File storage with a quota per client (services/storageService.js):
 * article photos through the real route, private documents behind
 * expiring links, the quota (client's own > plan's > default), the
 * platform operator changing it, and the Cloudflare R2 driver.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sanity-storage-"));
process.env.STORAGE_LOCAL_DIR = dir;
process.env.JWT_SECRET = "storage-test-secret";
process.env.PUBLIC_API_URL = "http://api.test";
delete process.env.R2_ACCOUNT_ID;
delete process.env.CLOUDINARY_URL;
delete process.env.CLOUDINARY_CLOUD_NAME;

const tenantScope = require("./tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const Company = require("../models/Company");
const InventoryCategory = require("../models/InventoryCategory");
const Product = require("../models/Product");
const Plan = require("../models/Plan");
const StoredFile = require("../models/StoredFile");
const storage = require("./storageService");

let app;
let admin;
let op;
let tenant;
let otherTenant;
let companyId;
let otherCompanyId;
let productId;
const sys = (fn) => tenantScope.runAsSystem(fn);
const h = (t) => ({ Authorization: `Bearer ${t}` });
// Random pixels: a realistic (poorly compressible) photo.
const photo = (w = 3000, h2 = 2000) => sharp(require("crypto").randomBytes(w * h2 * 3), { raw: { width: w, height: h2, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/uploads", express.static(storage.localPublicDir()));
  app.use("/api/products", require("../routes/products"));
  app.use("/api/files", require("../routes/files"));
  app.use("/api/platform", require("../routes/platform"));
  tenantScope.enableStrictMode(true);
  await sys(async () => {
    tenant = await Tenant.create({ name: "Droguerie Test", edition: "droguerie" });
    const a = await User.create({ firstName: "A", lastName: "B", email: "a@test.ma", password: "secret12", role: "admin", tenant: tenant._id });
    const c = await Company.create({ name: "Droguerie Test", tenant: tenant._id, owner: a._id, legalForm: "SARL", industry: "Droguerie" });
    companyId = c._id;
    const cat = await InventoryCategory.create({ company: c._id, name: "Divers" });
    productId = (await Product.create({ company: c._id, category: cat._id, name: "Peinture", unit: "pot" }))._id;
    admin = jwt.sign({ id: String(a._id) }, process.env.JWT_SECRET);
    otherTenant = await Tenant.create({ name: "Autre" });
    const ou = await User.create({ firstName: "O", lastName: "T", email: "o@test.ma", password: "secret12", role: "admin", tenant: otherTenant._id });
    otherCompanyId = (await Company.create({ name: "Autre", tenant: otherTenant._id, owner: ou._id, legalForm: "SARL", industry: "Négoce" }))._id;
    const o = await User.create({ firstName: "Op", lastName: "P", email: "op@test.ma", password: "secret12", role: "platform_admin" });
    op = jwt.sign({ id: String(o._id) }, process.env.JWT_SECRET);
  });
});

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const usage = () => sys(() => storage.usage(tenant._id));

describe("file storage and quotas", () => {
  it("an article photo is resized, stored with its thumbnail and counted for its client", async () => {
    const big = await photo();
    const r = await request(app).post(`/api/products/${productId}/photo`).set(h(admin)).attach("photo", big, { filename: "photo.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(200);
    const img = r.body.data.image;
    expect(img.publicId).toMatch(/^local:t[a-f0-9]{24}\/companies\/[a-f0-9]{24}\/products\/[\w-]+\.webp$/);
    expect(img.url).toMatch(/^http:\/\/api\.test\/uploads\/.+\.webp$/);
    expect(img.thumbUrl).toMatch(/_t\.webp$/);
    // served, and really resized
    const served = await request(app).get(new URL(img.url).pathname).buffer(true);
    expect(served.status).toBe(200);
    const meta = await sharp(served.body).metadata();
    expect(Math.max(meta.width, meta.height)).toBe(1000);
    const rows = await sys(() => StoredFile.find({ tenant: tenant._id }).lean());
    expect(rows).toHaveLength(2);
    const u = await usage();
    expect(u.usedBytes).toBe(rows[0].bytes + rows[1].bytes);
    expect(u.usedBytes).toBeLessThan(big.length);
    expect(u).toMatchObject({ source: "default", quotaMB: 1024 });
  });

  it("replacing the photo frees the old one's space", async () => {
    const before = await usage();
    const r = await request(app).post(`/api/products/${productId}/photo`).set(h(admin)).attach("photo", await photo(800, 600), { filename: "p.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(200);
    const rows = await sys(() => StoredFile.find({ tenant: tenant._id }).lean());
    expect(rows).toHaveLength(2);
    const after = await usage();
    expect(after.usedBytes).toBe(rows.reduce((s, x) => s + x.bytes, 0));
    expect(after.usedBytes).not.toBe(before.usedBytes);
  });

  it("refuses an upload over the quota, with a clear message", async () => {
    await sys(() => Tenant.updateOne({ _id: tenant._id }, { $set: { "storage.quotaMB": 0.01 } })); // ~10 KB
    const r = await request(app).post(`/api/products/${productId}/photo`).set(h(admin)).attach("photo", await photo(), { filename: "p.jpg", contentType: "image/jpeg" });
    expect(r.status).toBe(413);
    expect(r.body.code).toBe("STORAGE_QUOTA");
    expect(r.body.message).toMatch(/Espace de stockage plein/);
    const rows = await sys(() => StoredFile.find({ tenant: tenant._id }).lean());
    expect(rows).toHaveLength(2); // nothing half-stored
    expect((await usage()).usedBytes).toBe(rows.reduce((s, x) => s + x.bytes, 0));
  });

  it("not an image → 400, nothing stored", async () => {
    await sys(() => Tenant.updateOne({ _id: tenant._id }, { $set: { "storage.quotaMB": null } }));
    const r = await request(app).post(`/api/products/${productId}/photo`).set(h(admin)).attach("photo", Buffer.from("not really a png"), { filename: "x.png", contentType: "image/png" });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe("BAD_IMAGE");
  });

  it("a private document opens only through a link that expires", async () => {
    const file = await sys(() => storage.uploadPrivateFile(Buffer.from("%PDF-1.4 facture"), `companies/${companyId}/purchasing`, "Facture fournisseur.pdf", "application/pdf", { companyId }));
    expect(file).toMatchObject({ url: "", private: true, resourceType: "local", format: "pdf", originalName: "Facture fournisseur.pdf" });
    // never under the public folder
    expect(fs.existsSync(path.join(storage.localPublicDir(), file.publicId.slice(6)))).toBe(false);
    const link = await storage.privateFileUrl(file, { ttlSeconds: 60 });
    expect(link).toMatch(/^http:\/\/api\.test\/api\/files\/raw\//);
    const ok = await request(app).get(new URL(link).pathname).buffer(true);
    expect(ok.status).toBe(200);
    expect(ok.body.toString()).toBe("%PDF-1.4 facture");
    expect(ok.headers["content-disposition"]).toMatch(/Facture%20fournisseur\.pdf/);
    const forged = new URL(link).pathname.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
    expect((await request(app).get(forged)).status).toBe(404);
    const expired = await storage.privateFileUrl(file, { ttlSeconds: -1 });
    expect((await request(app).get(new URL(expired).pathname)).status).toBe(404);
    await sys(() => storage.deleteFile(file.publicId));
  });

  it("quota: the client's own, else its plan's, else the default", async () => {
    await sys(async () => {
      const plan = await Plan.create({ code: "DGT", name: "Droguerie", monthlyPriceHT: 199, storageQuotaMB: 2048 });
      await Tenant.updateOne({ _id: tenant._id }, { $set: { "subscription.plan": plan._id } });
    });
    expect(await usage()).toMatchObject({ quotaMB: 2048, source: "plan" });
    const set = await request(app).patch(`/api/platform/tenants/${tenant._id}`).set(h(op)).send({ storageQuotaMB: 5120 });
    expect(set.status).toBe(200);
    expect(await usage()).toMatchObject({ quotaMB: 5120, source: "client" });
    const list = await request(app).get("/api/platform/tenants").set(h(op));
    const row = list.body.data.find((t) => t._id === String(tenant._id));
    expect(row.storage).toMatchObject({ quotaMB: 5120, source: "client" });
    expect(row.storage.usedBytes).toBeGreaterThan(0);
    expect(row.edition).toBe("droguerie");
    await request(app).patch(`/api/platform/tenants/${tenant._id}`).set(h(op)).send({ storageQuotaMB: "" }).expect(200);
    expect(await usage()).toMatchObject({ quotaMB: 2048, source: "plan" });
    expect((await request(app).patch(`/api/platform/tenants/${tenant._id}`).set(h(op)).send({ storageQuotaMB: -5 })).status).toBe(400);
    // only the platform operator
    expect((await request(app).patch(`/api/platform/tenants/${tenant._id}`).set(h(admin)).send({ storageQuotaMB: 99999 })).status).toBe(403);
  });

  it("recount rebuilds the used space from the stored files", async () => {
    await sys(() => Tenant.updateOne({ _id: tenant._id }, { $set: { "storage.usedBytes": 123 } }));
    const r = await request(app).post(`/api/platform/tenants/${tenant._id}/storage/recount`).set(h(op));
    expect(r.status).toBe(200);
    const rows = await sys(() => StoredFile.find({ tenant: tenant._id }).lean());
    expect(r.body.data.usedBytes).toBe(rows.reduce((s, x) => s + x.bytes, 0));
    expect(r.body.data.files).toBe(rows.length);
  });

  it("each client's files count only for that client", async () => {
    await sys(() => storage.uploadPrivateFile(Buffer.alloc(5000, 1), "x", "a.pdf", "application/pdf", { companyId: otherCompanyId }));
    expect((await sys(() => storage.usage(otherTenant._id))).usedBytes).toBe(5000);
    const mine = await sys(() => StoredFile.find({ tenant: tenant._id }).lean());
    expect(mine.every((f) => String(f.tenant) === String(tenant._id))).toBe(true);
  });

  it("deleting the article deletes its photo and frees the space", async () => {
    const r = await request(app).delete(`/api/products/${productId}`).set(h(admin));
    expect(r.status).toBe(200);
    expect(await sys(() => StoredFile.countDocuments({ tenant: tenant._id }))).toBe(0);
    expect((await usage()).usedBytes).toBe(0);
  });
});

describe("Cloudflare R2 driver", () => {
  it("stores in R2 (public bucket for photos, private bucket for documents) and signs private links", async () => {
    Object.assign(process.env, { R2_ACCOUNT_ID: "acc123", R2_ACCESS_KEY_ID: "key", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "sanity-public", R2_PRIVATE_BUCKET: "sanity-private", R2_PUBLIC_URL: "https://files.sanity.test/" });
    const { S3Client } = require("@aws-sdk/client-s3");
    const sent = [];
    const spy = vi.spyOn(S3Client.prototype, "send").mockImplementation(async (cmd) => { sent.push({ name: cmd.constructor.name, input: cmd.input }); return {}; });
    try {
      expect(storage.driver()).toBe("r2");
      const pic = await photo(1200, 900);
      const img = await sys(() => storage.uploadImage(pic, `companies/${companyId}/products`, { companyId }));
      expect(img.public_id).toMatch(/^r2:t[a-f0-9]{24}\/companies\//);
      expect(img.secure_url).toMatch(/^https:\/\/files\.sanity\.test\/t[a-f0-9]{24}\/companies\/.+\.webp$/);
      const doc = await sys(() => storage.uploadPrivateFile(Buffer.from("%PDF"), "companies/x/hr", "CIN.pdf", "application/pdf", { companyId }));
      expect(doc.resourceType).toBe("r2");
      const puts = sent.filter((s) => s.name === "PutObjectCommand");
      expect(puts.map((p) => p.input.Bucket)).toEqual(["sanity-public", "sanity-public", "sanity-private"]);
      expect(puts[0].input.ContentType).toBe("image/webp");
      expect(puts[2].input.CacheControl).toMatch(/no-store/);

      const link = await storage.privateFileUrl(doc, { ttlSeconds: 120 });
      const u = new URL(link);
      expect(u.hostname).toBe("sanity-private.acc123.r2.cloudflarestorage.com");
      expect(u.searchParams.get("X-Amz-Expires")).toBe("120");
      expect(u.searchParams.get("X-Amz-Signature")).toBeTruthy();

      await sys(() => storage.deleteImage(img.public_id));
      const dels = sent.filter((s) => s.name === "DeleteObjectCommand");
      expect(dels).toHaveLength(2); // photo + thumbnail
      expect(dels.every((d) => d.input.Bucket === "sanity-public")).toBe(true);
      await sys(() => storage.deleteFile(doc.publicId));
      expect((await usage()).usedBytes).toBe(0);
    } finally {
      spy.mockRestore();
      for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PRIVATE_BUCKET", "R2_PUBLIC_URL"]) delete process.env[k];
    }
  });

  it("R2 wins over Cloudinary; Cloudinary alone: public images, authenticated raw documents, signed download links", async () => {
    Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: "demo-cloud", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "test-secret", R2_ACCOUNT_ID: "acc123", R2_ACCESS_KEY_ID: "key", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET: "b" });
    const cld = require("cloudinary").v2;
    const uploads = [];
    const destroys = [];
    const up = vi.spyOn(cld.uploader, "upload").mockImplementation(async (data, opts) => { uploads.push({ data, opts }); return {}; });
    const del = vi.spyOn(cld.uploader, "destroy").mockImplementation(async (id, opts) => { destroys.push({ id, opts }); return { result: "ok" }; });
    try {
      expect(storage.driver()).toBe("r2"); // Cloudflare first when both are configured
      for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) delete process.env[k];
      expect(storage.driver()).toBe("cloudinary");
      const pic = await photo(800, 600);
      const img = await sys(() => storage.uploadImage(pic, `companies/${companyId}/products`, { companyId }));
      expect(img.public_id).toMatch(/^cloudinary:t[a-f0-9]{24}\/companies\//);
      expect(img.secure_url).toMatch(/^https:\/\/res\.cloudinary\.com\/demo-cloud\/image\/upload\/(v1\/)?sanity\/t[a-f0-9]{24}\/companies\/.+\.webp$/);
      expect(img.thumb_url).toMatch(/_t\.webp$/);
      expect(uploads[0].opts).toMatchObject({ resource_type: "image", type: "upload" });
      expect(uploads[0].opts.public_id).not.toMatch(/\.webp$/);
      expect(uploads[0].data).toMatch(/^data:image\/webp;base64,/);

      const doc = await sys(() => storage.uploadPrivateFile(Buffer.from("%PDF"), "companies/x/hr", "CIN.pdf", "application/pdf", { companyId }));
      expect(doc.resourceType).toBe("cloudinary");
      expect(uploads[2].opts).toMatchObject({ resource_type: "raw", type: "authenticated" });
      expect(uploads[2].opts.public_id).toMatch(/^sanity\/.+\.pdf$/);

      const before = Math.floor(Date.now() / 1000);
      const u = new URL(await storage.privateFileUrl(doc, { ttlSeconds: 120 }));
      expect(u.hostname).toBe("api.cloudinary.com");
      expect(u.searchParams.get("type")).toBe("authenticated");
      expect(u.searchParams.get("signature")).toBeTruthy();
      expect(Number(u.searchParams.get("expires_at"))).toBeGreaterThanOrEqual(before + 120);

      await sys(() => storage.deleteImage(img.public_id));
      await sys(() => storage.deleteFile(doc.publicId));
      expect(destroys).toHaveLength(3); // photo + thumbnail + document
      expect(destroys[2].opts).toMatchObject({ resource_type: "raw", type: "authenticated" });
      expect((await usage()).usedBytes).toBe(0);
    } finally {
      up.mockRestore();
      del.mockRestore();
      for (const k of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) delete process.env[k];
    }
  });

  it("old references (before R2) are left alone; nothing → null", async () => {
    expect(await storage.deleteFile("frame/companies/abc/logo")).toBeNull();
    expect(await storage.privateFileUrl({ url: "https://old.example/x.pdf" })).toBe("https://old.example/x.pdf");
    expect(await storage.privateFileUrl({ private: true, publicId: "purchasing/abc/invoice" })).toBeNull();
    expect(await storage.privateFileUrl(null)).toBeNull();
  });
});
