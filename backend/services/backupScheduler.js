const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const tenantScope = require("./tenantScope");
const { backupDatabase, verifyBackup, restoreDrill, pruneBackups, stamp, folderSize } = require("./backupService");

/**
 * ============================================================
 * AUTOMATIC BACKUPS + WEEKLY RESTORE DRILL
 * ============================================================
 * On when BACKUP_DIR is set (.env). Every day at BACKUP_HOUR (server
 * time, default 2):
 *   1. full backup into BACKUP_DIR/<date>/
 *   2. verification: every file re-read, counts and content hashes
 *      checked against the manifest
 *   3. folders older than BACKUP_KEEP_DAYS (default 14) deleted
 * Every Sunday, when BACKUP_DRILL_URI is set (an EMPTY scratch
 * database, never the live one): the day's backup is restored there,
 * compared document by document (content hashes), then wiped.
 *
 * Each run is logged (models/BackupRun.js → platform "Erreurs" page);
 * a failure goes to error monitoring, which alerts.
 *
 * BACKUP_DIR must not be the server's own disk only: mount a volume
 * that is copied elsewhere (see scripts/BACKUP_RESTORE.md). With
 * MongoDB Atlas, also keep Atlas' own cloud backups switched on.
 * ============================================================
 */

const HOUR = 3600 * 1000;
let timer = null;
let lastDay = null;

function settings(env = process.env) {
  return {
    dir: env.BACKUP_DIR || "",
    hour: Number.isInteger(Number(env.BACKUP_HOUR)) ? Number(env.BACKUP_HOUR) : 2,
    keepDays: Number(env.BACKUP_KEEP_DAYS) > 0 ? Number(env.BACKUP_KEEP_DAYS) : 14,
    drillUri: env.BACKUP_DRILL_URI || "",
  };
}

async function log(entry) {
  try {
    await tenantScope.runAsSystem(() => require("../models/BackupRun").create(entry));
  } catch (e) { /* the log must not break the backup */ }
  if (entry.status === "failed") {
    require("./monitoringService").record({
      source: "job",
      route: entry.kind === "drill" ? "backup restore drill" : "daily backup",
      message: entry.error || (entry.problems || []).join("; ") || "Backup failed",
    });
  }
}

/** Runs one backup (+ verification + pruning), and the drill when asked. */
async function runBackup({ db = mongoose.connection.db, drill = false, env = process.env } = {}) {
  const cfg = settings(env);
  if (!cfg.dir) return null;
  const started = Date.now();
  const folder = path.join(cfg.dir, stamp());
  let result = null;
  try {
    const manifest = await backupDatabase(db, folder);
    const check = await verifyBackup(folder);
    const pruned = pruneBackups(cfg.dir, cfg.keepDays);
    result = {
      kind: "backup",
      status: check.ok ? "ok" : "failed",
      folder,
      collections: Object.keys(manifest.collections).length,
      documents: Object.values(manifest.collections).reduce((a, b) => a + b, 0),
      sizeBytes: folderSize(folder),
      durationMs: Date.now() - started,
      pruned,
      problems: check.problems,
      error: check.ok ? undefined : "Backup verification failed",
    };
  } catch (e) {
    result = { kind: "backup", status: "failed", folder, durationMs: Date.now() - started, error: e.message };
  }
  await log(result);
  if (drill && result.status === "ok" && cfg.drillUri) await runDrill(folder, cfg.drillUri);
  return result;
}

async function runDrill(folder, uri) {
  let conn;
  const started = Date.now();
  try {
    if (!fs.existsSync(folder)) throw new Error(`Backup folder not found: ${folder}`);
    conn = await mongoose.createConnection(uri).asPromise();
    if (conn.db.databaseName === mongoose.connection.db?.databaseName && conn.host === mongoose.connection.host) {
      throw new Error("BACKUP_DRILL_URI points at the live database — use an empty scratch database");
    }
    const r = await restoreDrill(conn.db, folder);
    await log({ kind: "drill", status: r.ok ? "ok" : "failed", folder, collections: r.collections, documents: r.documents, durationMs: Date.now() - started, problems: r.mismatches, error: r.ok ? undefined : "Restored data differs from the backup" });
    return r;
  } catch (e) {
    await log({ kind: "drill", status: "failed", folder, durationMs: Date.now() - started, error: e.message });
    return null;
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
}

/** Hourly tick: runs the day's backup once, at BACKUP_HOUR. */
function start() {
  const cfg = settings();
  if (!cfg.dir || timer) return false;
  fs.mkdirSync(cfg.dir, { recursive: true });
  const tick = () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() !== cfg.hour || lastDay === day) return;
    lastDay = day;
    runBackup({ drill: now.getDay() === 0 }).catch(() => {});
  };
  timer = setInterval(tick, HOUR / 4);
  tick();
  console.log(`✓ Automatic backups: every day at ${cfg.hour}h into ${cfg.dir} (kept ${cfg.keepDays} days)${cfg.drillUri ? ", restore drill on Sundays" : ""}`);
  return true;
}

module.exports = { start, runBackup, runDrill, settings };
