require('../services/tenantScope'); // client-isolation plugin, before models
const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { backupDatabase, verifyBackup, restoreDrill, stamp } = require('../services/backupService');

/**
 * RESTORE DRILL — proves the backups can really be restored.
 *
 *   npm run backup:drill -- --scratch="mongodb+srv://.../sanity-restore-drill"
 *       backs up the live database (MONGODB_URI) into a temporary folder,
 *       restores it into the EMPTY scratch database, compares every
 *       collection (document counts + content hashes), then wipes the
 *       scratch database.
 *   npm run backup:drill -- --from=backups/2026-10-12T02-00-00 --scratch=...
 *       same with an existing backup folder (e.g. last night's).
 *   --keep   leaves the restored copy in the scratch database to look at.
 *
 * Exit code 0 = restore proven; 1 = failure (CI fails, see .github/workflows/ci.yml).
 */
function arg(name) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : '';
}

(async () => {
  const scratch = arg('scratch') || process.env.BACKUP_DRILL_URI;
  if (!scratch) {
    console.error('Usage: npm run backup:drill -- --scratch=<mongodb uri of an EMPTY database> [--from=<backup folder>] [--keep]');
    process.exit(1);
  }
  let live;
  let target;
  try {
    let dir = arg('from') ? path.resolve(arg('from')) : '';
    if (!dir) {
      live = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
      dir = path.join(os.tmpdir(), `sanity-drill-${stamp()}`);
      console.log(`1. Backing up "${live.db.databaseName}" into ${dir}`);
      await backupDatabase(live.db, dir);
    }
    console.log('2. Checking the backup files against the manifest');
    const check = await verifyBackup(dir);
    if (!check.ok) throw new Error(`Backup files are damaged:\n${check.problems.join('\n')}`);
    target = await mongoose.createConnection(scratch).asPromise();
    if (live && target.db.databaseName === live.db.databaseName && target.host === live.host) {
      throw new Error('The scratch database is the live database. Use another database name.');
    }
    console.log(`3. Restoring into "${target.db.databaseName}" and comparing every document`);
    const r = await restoreDrill(target.db, dir, { keep: process.argv.includes('--keep') });
    if (!r.ok) throw new Error(`Restored data differs from the backup:\n${r.mismatches.join('\n')}`);
    console.log(`✓ Restore proven: ${r.collections} collections, ${r.documents} documents identical to the backup (${(r.durationMs / 1000).toFixed(1)} s).`);
    if (!arg('from')) fs.rmSync(dir, { recursive: true, force: true });
    process.exit(0);
  } catch (error) {
    console.error(`✗ Restore drill FAILED: ${error.message}`);
    process.exit(1);
  } finally {
    await live?.close().catch(() => {});
    await target?.close().catch(() => {});
  }
})();
