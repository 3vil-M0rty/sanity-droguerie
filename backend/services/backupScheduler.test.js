import { describe, it, expect, beforeAll } from "vitest";

/** Automatic backup: backup → verification → pruning, logged; failures alert through monitoring. */
const fs = require("fs");
const os = require("os");
const path = require("path");
const tenantScope = require("./tenantScope");
const fake = require("../test/fakeMongo");
const scheduler = require("./backupScheduler");
const BackupRun = require("../models/BackupRun");
const ErrorEvent = require("../models/ErrorEvent");

let root;
beforeAll(() => {
  fake.connect();
  root = fs.mkdtempSync(path.join(os.tmpdir(), "frame-auto-backup-"));
  const live = fake.fakeDb;
  live.collection("tenants").docs.push({ _id: new (require("mongoose").Types.ObjectId)(), name: "Client" });
});

describe("automatic backups", () => {
  it("does nothing without BACKUP_DIR", async () => {
    expect(await scheduler.runBackup({ db: fake.fakeDb, env: {} })).toBeNull();
  });

  it("backs up, verifies the files and logs the run", async () => {
    const r = await scheduler.runBackup({ db: fake.fakeDb, env: { BACKUP_DIR: root, BACKUP_KEEP_DAYS: "14" } });
    expect(r).toMatchObject({ kind: "backup", status: "ok", problems: [] });
    expect(r.documents).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(r.folder, "manifest.json"))).toBe(true);
    const runs = await tenantScope.runAsSystem(() => BackupRun.find().lean());
    expect(runs).toHaveLength(1);
  });

  it("a failed backup is logged and reported to error monitoring", async () => {
    const r = await scheduler.runBackup({ db: { listCollections: () => { throw new Error("connection lost"); }, databaseName: "x" }, env: { BACKUP_DIR: root } });
    expect(r).toMatchObject({ status: "failed", error: "connection lost" });
    await new Promise((res) => setTimeout(res, 50));
    const errs = await tenantScope.runAsSystem(() => ErrorEvent.find({ source: "job" }).lean());
    expect(errs.map((e) => e.route)).toContain("daily backup");
  });

  it("settings: defaults and parsing", () => {
    expect(scheduler.settings({ BACKUP_DIR: "/b" })).toEqual({ dir: "/b", hour: 2, keepDays: 14, drillUri: "" });
    expect(scheduler.settings({ BACKUP_DIR: "/b", BACKUP_HOUR: "4", BACKUP_KEEP_DAYS: "30", BACKUP_DRILL_URI: "mongodb://x/drill" })).toEqual({ dir: "/b", hour: 4, keepDays: 30, drillUri: "mongodb://x/drill" });
  });
});
