import { describe, it, expect, beforeEach } from "vitest";

const fs = require("fs");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");
const { createFakeDb } = require("../test/fakeMongo");
const { backupDatabase, restoreDatabase } = require("./backupService");

const oid = () => new mongoose.Types.ObjectId();
let dir;
let source;
const T_A = oid();
const T_B = oid();
const C_A = oid();
const C_B = oid();
const U_A = oid();
const U_B = oid();

function seed(db) {
  db.collection("tenants").docs.push({ _id: T_A, name: "A" }, { _id: T_B, name: "B" });
  db.collection("companies").docs.push({ _id: C_A, tenant: T_A, name: "Alpha" }, { _id: C_B, tenant: T_B, name: "Beta" });
  db.collection("users").docs.push({ _id: U_A, tenant: T_A, email: "a@a" }, { _id: U_B, tenant: T_B, email: "b@b" });
  db.collection("employees").docs.push(
    { _id: oid(), company: C_A, firstName: "Ali", hireDate: new Date("2020-01-02T00:00:00Z"), salary: mongoose.mongo.BSON.Decimal128.fromString("1234.56") },
    { _id: oid(), company: C_B, firstName: "Bea" }
  );
  db.collection("notifications").docs.push({ _id: oid(), user: U_A, title: "x" }, { _id: oid(), user: U_B, title: "y" });
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "frame-backup-"));
  source = createFakeDb("live");
  seed(source);
});

describe("backup and restore", () => {
  it("full backup → restore into an empty database gives back every document with exact types", async () => {
    const manifest = await backupDatabase(source, dir);
    expect(manifest.collections).toEqual({ companies: 2, employees: 2, notifications: 2, tenants: 2, users: 2 });

    const target = createFakeDb("restore-test");
    await restoreDatabase(target, dir);
    const ali = target.collection("employees").docs.find((e) => e.firstName === "Ali");
    expect(ali._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(ali.company.equals(C_A)).toBe(true);
    expect(ali.hireDate).toBeInstanceOf(Date);
    expect(ali.hireDate.toISOString()).toBe("2020-01-02T00:00:00.000Z");
    expect(String(ali.salary)).toBe("1234.56");
    expect(target.collection("users").docs).toHaveLength(2);
  });

  it("refuses to restore over a database that already has data, unless --drop", async () => {
    await backupDatabase(source, dir);
    await expect(restoreDatabase(source, dir)).rejects.toThrow(/not empty/);
    source.collection("companies").docs.push({ _id: oid(), name: "added after backup" });
    await restoreDatabase(source, dir, { mode: "drop" });
    expect(source.collection("companies").docs.map((c) => c.name).sort()).toEqual(["Alpha", "Beta"]);
  });

  it("one-client backup contains only that client's data", async () => {
    const manifest = await backupDatabase(source, dir, { tenantId: T_A });
    expect(manifest.tenant).toBe(String(T_A));
    const target = createFakeDb("export");
    await restoreDatabase(target, dir);
    expect(target.collection("companies").docs.map((c) => c.name)).toEqual(["Alpha"]);
    expect(target.collection("users").docs.map((u) => u.email)).toEqual(["a@a"]);
    expect(target.collection("employees").docs.map((e) => e.firstName)).toEqual(["Ali"]);
    expect(target.collection("notifications").docs).toHaveLength(1);
    expect(target.collection("tenants").docs.map((t) => t.name)).toEqual(["A"]);
  });

  it("merge puts one client back into a live database without touching the others", async () => {
    await backupDatabase(source, dir, { tenantId: T_A });
    // Client A's employees get lost; client B keeps working meanwhile.
    source.collection("employees").docs = source.collection("employees").docs.filter((e) => !e.company.equals(C_A));
    source.collection("employees").docs.push({ _id: oid(), company: C_B, firstName: "New B hire" });
    await restoreDatabase(source, dir, { mode: "merge" });
    expect(source.collection("employees").docs.map((e) => e.firstName).sort()).toEqual(["Ali", "Bea", "New B hire"]);
  });
});

describe("verified backups and restore drill", () => {
  const { verifyBackup, restoreDrill, pruneBackups, contentHash } = require("./backupService");
  const zlib = require("zlib");

  it("the manifest carries a content hash per collection; verification re-reads every file", async () => {
    const manifest = await backupDatabase(source, dir);
    expect(Object.keys(manifest.hashes)).toEqual(Object.keys(manifest.collections));
    expect((await verifyBackup(dir)).ok).toBe(true);
  });

  it("a damaged backup file is caught the day it is made", async () => {
    await backupDatabase(source, dir);
    const file = path.join(dir, "employees.jsonl.gz");
    const lines = zlib.gunzipSync(fs.readFileSync(file)).toString().trim().split("\n");
    fs.writeFileSync(file, zlib.gzipSync(`${lines[0].replace("Ali", "Alj")}\n${lines[1]}\n`));
    const check = await verifyBackup(dir);
    expect(check.ok).toBe(false);
    expect(check.problems[0]).toMatch(/employees: content differs/);
    fs.writeFileSync(file, Buffer.from("not gzip"));
    expect((await verifyBackup(dir)).problems[0]).toMatch(/employees: unreadable/);
  });

  it("restore drill: restored into an empty database, identical document by document, then wiped", async () => {
    await backupDatabase(source, dir);
    const scratch = createFakeDb("drill");
    const r = await restoreDrill(scratch, dir);
    expect(r).toMatchObject({ ok: true, collections: 5, documents: 10, mismatches: [] });
    expect(await scratch.collection("employees").countDocuments({})).toBe(0);
    const kept = createFakeDb("drill-keep");
    await restoreDrill(kept, dir, { keep: true });
    const emp = await kept.collection("employees").find({}).toArray();
    expect(contentHash(emp)).toBe(contentHash(await source.collection("employees").find({}).toArray()));
  });

  it("the drill refuses a database that is not empty (never restores over live data)", async () => {
    await backupDatabase(source, dir);
    await expect(restoreDrill(source, dir)).rejects.toThrow(/not empty/);
  });

  it("old backup folders are pruned; the newest is always kept", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "frame-prune-"));
    const make = (name, daysAgo) => {
      fs.mkdirSync(path.join(root, name));
      fs.writeFileSync(path.join(root, name, "manifest.json"), JSON.stringify({ format: "frame-backup/1", createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(), collections: {} }));
    };
    make("old", 30);
    make("older", 40);
    make("recent", 2);
    expect(pruneBackups(root, 14).sort()).toEqual(["old", "older"]);
    expect(fs.readdirSync(root)).toEqual(["recent"]);
    const lonely = fs.mkdtempSync(path.join(os.tmpdir(), "frame-prune-"));
    fs.mkdirSync(path.join(lonely, "only"));
    fs.writeFileSync(path.join(lonely, "only", "manifest.json"), JSON.stringify({ format: "frame-backup/1", createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), collections: {} }));
    expect(pruneBackups(lonely, 14)).toEqual([]);
  });
});
