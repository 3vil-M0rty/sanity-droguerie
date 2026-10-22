const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const mongoose = require("mongoose");

const crypto = require("crypto");

const { EJSON, ObjectId } = mongoose.mongo.BSON;

/**
 * Content fingerprint of a collection: SHA-256 of its documents in
 * canonical Extended JSON, sorted by _id. Written into the manifest at
 * backup time; a restore drill recomputes it on the restored copy, so
 * "restored" means "identical", not just "same number of documents".
 */
function contentHash(docs) {
  const lines = docs.map((d) => [String(d._id), EJSON.stringify(d, { relaxed: false })]);
  lines.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const h = crypto.createHash("sha256");
  for (const [, line] of lines) h.update(line).update("\n");
  return h.digest("hex");
}

/**
 * ============================================================
 * BACKUP / RESTORE (pure Node — no mongodump needed)
 * ============================================================
 * A backup is a folder:
 *   manifest.json            what was saved, when, document counts
 *   <collection>.jsonl.gz    one document per line, Extended JSON
 *                            (canonical: ObjectIds, dates, decimals
 *                            come back with their exact types)
 *
 * Whole database, or ONE client (tenant) only — its client record,
 * its companies, its accounts, every record of its companies, and
 * its accounts' notifications. A one-client backup is also the
 * "give me all my data" export for a client who leaves.
 *
 * Works on the raw driver database (mongoose.connection.db), so the
 * isolation plugin never filters what gets saved.
 *
 * Indexes are not stored: the server recreates them at startup.
 * ============================================================
 */

const SKIP_COLLECTIONS = new Set(["system.views", "system.profile"]);

function stamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

async function listCollectionNames(db) {
  const rows = await db.listCollections({}, { nameOnly: true }).toArray();
  return rows.map((c) => c.name).filter((n) => !SKIP_COLLECTIONS.has(n) && !n.startsWith("system.")).sort();
}

function writeLines(file, docs) {
  return new Promise((resolve, reject) => {
    const gz = zlib.createGzip();
    const out = fs.createWriteStream(file);
    gz.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
    gz.on("error", reject);
    for (const d of docs) gz.write(`${EJSON.stringify(d, { relaxed: false })}\n`);
    gz.end();
  });
}

async function readLines(file) {
  const docs = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim()) docs.push(EJSON.parse(line, { relaxed: false }));
  }
  return docs;
}

/** Filter that selects one client's documents in a collection (null = skip collection). */
async function tenantFilters(db, tenantId) {
  const tid = new ObjectId(String(tenantId));
  const companies = await db.collection("companies").find({ tenant: tid }, { projection: { _id: 1 } }).toArray();
  const users = await db.collection("users").find({ tenant: tid }, { projection: { _id: 1 } }).toArray();
  const companyIds = companies.map((c) => c._id);
  const userIds = users.map((u) => u._id);
  return (name) => {
    if (name === "tenants") return { _id: tid };
    if (name === "companies" || name === "users") return { tenant: tid };
    if (name === "notifications") return { user: { $in: userIds } };
    if (name === "auditlogs" || name === "emailoutboxes") return { $or: [{ tenant: tid }, { company: { $in: companyIds } }] };
    return { company: { $in: companyIds } };
  };
}

/**
 * Saves the database (or one client) into `dir`. Returns the manifest.
 */
async function backupDatabase(db, dir, { tenantId = null, log = () => {} } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const names = await listCollectionNames(db);
  const filterFor = tenantId ? await tenantFilters(db, tenantId) : () => ({});
  const manifest = {
    format: "frame-backup/1",
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    tenant: tenantId ? String(tenantId) : null,
    collections: {},
    hashes: {},
  };
  for (const name of names) {
    const filter = filterFor(name);
    // eslint-disable-next-line no-await-in-loop
    const docs = await db.collection(name).find(filter).toArray();
    if (tenantId && !docs.length) continue;
    // eslint-disable-next-line no-await-in-loop
    await writeLines(path.join(dir, `${name}.jsonl.gz`), docs);
    manifest.collections[name] = docs.length;
    manifest.hashes[name] = contentHash(docs);
    log(`  ${name}: ${docs.length}`);
  }
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

function readManifest(dir) {
  const file = path.join(dir, "manifest.json");
  if (!fs.existsSync(file)) throw new Error(`No manifest.json in ${dir} — not a backup folder`);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  if (manifest.format !== "frame-backup/1") throw new Error(`Unknown backup format: ${manifest.format}`);
  return manifest;
}

/**
 * Restores a backup folder into `db`.
 *   mode "empty" (default) — refuses unless every target collection is empty
 *   mode "drop"            — empties the backed-up collections first (full restore)
 *   mode "merge"           — upserts by _id, touching nothing else (one client back
 *                            into a live database)
 * Then checks every collection holds at least the backed-up count.
 */
async function restoreDatabase(db, dir, { mode = "empty", log = () => {} } = {}) {
  const manifest = readManifest(dir);
  const names = Object.keys(manifest.collections);

  if (mode === "empty") {
    for (const name of names) {
      // eslint-disable-next-line no-await-in-loop
      const n = await db.collection(name).countDocuments({});
      if (n > 0) {
        throw new Error(`Target collection "${name}" is not empty (${n} documents). Use --drop (full restore) or --merge.`);
      }
    }
  }

  const restored = {};
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await readLines(path.join(dir, `${name}.jsonl.gz`));
    const coll = db.collection(name);
    if (mode === "drop") {
      // eslint-disable-next-line no-await-in-loop
      await coll.deleteMany({});
    }
    if (mode === "merge") {
      for (const d of docs) {
        // eslint-disable-next-line no-await-in-loop
        await coll.replaceOne({ _id: d._id }, d, { upsert: true });
      }
    } else if (docs.length) {
      for (let i = 0; i < docs.length; i += 1000) {
        // eslint-disable-next-line no-await-in-loop
        await coll.insertMany(docs.slice(i, i + 1000), { ordered: true });
      }
    }
    restored[name] = docs.length;
    log(`  ${name}: ${docs.length}`);
  }

  // Verification: every backed-up document is there again.
  const problems = [];
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    const n = await db.collection(name).countDocuments({});
    if (n < manifest.collections[name]) problems.push(`${name}: expected ≥ ${manifest.collections[name]}, found ${n}`);
  }
  if (problems.length) throw new Error(`Restore verification failed:\n${problems.join("\n")}`);
  return { manifest, restored };
}

/**
 * Re-reads every file of a backup folder and checks it against the
 * manifest (document counts and content hashes): catches a truncated,
 * corrupted or incomplete backup the day it is made, not the day it
 * is needed.
 */
async function verifyBackup(dir) {
  const manifest = readManifest(dir);
  const problems = [];
  for (const [name, count] of Object.entries(manifest.collections)) {
    let docs;
    try {
      // eslint-disable-next-line no-await-in-loop
      docs = await readLines(path.join(dir, `${name}.jsonl.gz`));
    } catch (e) {
      problems.push(`${name}: unreadable (${e.message})`);
      continue;
    }
    if (docs.length !== count) problems.push(`${name}: ${docs.length} documents, manifest says ${count}`);
    else if (manifest.hashes?.[name] && contentHash(docs) !== manifest.hashes[name]) problems.push(`${name}: content differs from the manifest`);
  }
  return { ok: problems.length === 0, problems, manifest };
}

/**
 * RESTORE DRILL — proves a backup can really be restored:
 * restores `dir` into `scratchDb` (must be empty: never the live
 * database), recomputes each collection's content hash there and
 * compares it with the backup's manifest, then empties the scratch
 * database again (unless keep = true).
 */
async function restoreDrill(scratchDb, dir, { keep = false, log = () => {} } = {}) {
  const started = Date.now();
  const { manifest } = await restoreDatabase(scratchDb, dir, { mode: "empty", log });
  const mismatches = [];
  for (const name of Object.keys(manifest.collections)) {
    // eslint-disable-next-line no-await-in-loop
    const docs = await scratchDb.collection(name).find({}).toArray();
    if (docs.length !== manifest.collections[name]) {
      mismatches.push(`${name}: ${docs.length} restored, ${manifest.collections[name]} saved`);
    } else if (manifest.hashes?.[name] && contentHash(docs) !== manifest.hashes[name]) {
      mismatches.push(`${name}: restored content differs from the backup`);
    }
  }
  if (!keep) {
    for (const name of Object.keys(manifest.collections)) {
      // eslint-disable-next-line no-await-in-loop
      await scratchDb.collection(name).deleteMany({});
    }
  }
  const documents = Object.values(manifest.collections).reduce((a, b) => a + b, 0);
  return {
    ok: mismatches.length === 0,
    mismatches,
    collections: Object.keys(manifest.collections).length,
    documents,
    durationMs: Date.now() - started,
    backupCreatedAt: manifest.createdAt,
  };
}

/** Backup folders under `root` older than `keepDays` are deleted (the newest one is always kept). */
function pruneBackups(root, keepDays, now = Date.now()) {
  if (!fs.existsSync(root)) return [];
  const folders = fs.readdirSync(root)
    .map((name) => ({ name, full: path.join(root, name) }))
    .filter((f) => fs.existsSync(path.join(f.full, "manifest.json")))
    .map((f) => ({ ...f, at: new Date(readManifest(f.full).createdAt).getTime() }))
    .sort((a, b) => b.at - a.at);
  const removed = [];
  for (const f of folders.slice(1)) {
    if (now - f.at > keepDays * 86400000) {
      fs.rmSync(f.full, { recursive: true, force: true });
      removed.push(f.name);
    }
  }
  return removed;
}

function folderSize(dir) {
  return fs.readdirSync(dir).reduce((t, f) => t + fs.statSync(path.join(dir, f)).size, 0);
}

module.exports = { backupDatabase, restoreDatabase, readManifest, stamp, verifyBackup, restoreDrill, pruneBackups, contentHash, folderSize };
