# Backups and restore — Sanity

Two layers. Use both.

| Layer | What | Who runs it | Protects against |
|---|---|---|---|
| **1. MongoDB Atlas Cloud Backup** | Snapshots of the whole cluster (Atlas M10 and up; point-in-time restore on the higher tiers) | Atlas | Server/disk loss, a bad deployment; restores to the minute |
| **2. Sanity's own backups** (this guide) | A folder per day: `manifest.json` + one `.jsonl.gz` file per collection, verified the moment it is made, restore-tested every week | the Sanity server | Atlas account problems, deleting a client by mistake, a client asking for "all my data", moving to another host |

Atlas snapshots are the fast way back for the whole platform. Sanity's own backups can also give back **one client** without touching the others.

---

## 1. Turn on the automatic backups

In `backend/.env`:

```
BACKUP_DIR=/data/sanity-backups          # a mounted volume, NOT only the server's disk
BACKUP_HOUR=2                            # server time
BACKUP_KEEP_DAYS=14
BACKUP_DRILL_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/sanity-restore-drill
```

Each day at `BACKUP_HOUR`, the server:

1. backs up the whole database into `BACKUP_DIR/<date>/`;
2. **verifies the backup**: it re-reads every file and checks the document counts and a SHA-256 content hash per collection against the manifest. A truncated or damaged backup is caught that same day.
3. deletes folders older than `BACKUP_KEEP_DAYS`. The newest one is never deleted.

**Every Sunday**, if `BACKUP_DRILL_URI` is set, it also runs the **restore drill**:

- restores that day's backup into the scratch database;
- recomputes every collection's content hash and compares it with the backup, so the restored data is shown to be identical, not just the same count;
- empties the scratch database again.

**Rules for the scratch database:**
- It must be an **empty, separate database**. The drill refuses a non-empty database, and also refuses if the URI points at the live database.
- On Atlas, a database named `sanity-restore-drill` in the same cluster is fine. A free M0 cluster also works when the data is small.

**Where to check:** Platform → **Erreurs**. The "Sauvegardes" panel shows:
- the last backup, with its size and number of documents;
- the last restore drill and its result;
- recent failures.

A failure is also sent as an alert (`ALERT_EMAIL` / `ALERT_WEBHOOK_URL`). If no backup has succeeded for 36 hours, the panel shows **"En retard"** (late).

### Keep a copy off the server

`BACKUP_DIR` on the server's own disk dies with the server. Use one of these:

* **Render / Railway / Fly:** mount a persistent volume on `BACKUP_DIR`, and copy it off nightly.
* **VPS:** add `rclone` to cron to copy the folder to cloud storage, e.g. Cloudflare R2, Backblaze B2 or OVH Object Storage (pick an EU region):
  ```
  30 3 * * *  rclone sync /data/sanity-backups r2:sanity-backups --max-age 15d
  ```
* Turn on **encryption at rest** in the storage bucket. The backups contain payroll and customer data (CNDP, law 09-08).
* Give the copy job an access key that can **write but not delete**, so ransomware on the server can't erase the off-site copies.

---

## 2. Run a restore drill by hand (do it once before go-live, then monthly)

```
cd backend
npm run backup:drill -- --scratch="mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/sanity-restore-drill"
```

This backs up the live database into a temporary folder, checks the files, restores them into the scratch database, compares every collection, and wipes the scratch database. It prints `✓ Restore proven: N collections, M documents identical to the backup`, or the exact collections that differ (exit code 1).

To test last night's backup instead:

```
npm run backup:drill -- --from=/data/sanity-backups/2026-10-12T02-00-00 --scratch="mongodb+srv://…/sanity-restore-drill"
```

Add `--keep` to leave the restored copy in the scratch database so you can open it in Compass.

**CI also runs this drill on a real MongoDB at every change** (`.github/workflows/ci.yml`): it loads the demo data, backs it up, restores it and compares.

Write down each manual drill (date, duration, result) in your security register. Buyers and the CNDP may ask for it.

---

## 3. Manual backup

```
npm run backup                                  # whole database → backups/<date>/
npm run backup -- --tenant=<clientId>           # ONE client (also its "export all my data")
npm run backup -- --out=/somewhere/else
```

---

## 4. Restore for real

**Always restore into a new, empty database first, look at it, then switch.**

| Situation | Command |
|---|---|
| Whole platform lost | Restore the Atlas snapshot (fastest). Or: `npm run restore -- --from=<folder> --uri="mongodb+srv://…/sanity-new"`, then point `MONGODB_URI` at `sanity-new` and restart. |
| One client's data damaged or deleted | `npm run restore -- --from=<one-client backup folder> --merge --yes` (puts back that client's documents by id, touches nothing else) |
| Full restore over the live database (last resort) | `npm run restore -- --from=<folder> --drop --yes` |

After a restore, start the server once: it rebuilds the indexes.

**Targets to promise in the contract** (see `docs/legal/`):
- data loss at most **24 h** (Sanity backups) or **a few minutes** (Atlas point-in-time);
- back in service within **4 working hours**.

Don't promise better than you have tested in a drill.
