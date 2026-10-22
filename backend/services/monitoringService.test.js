import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

/** Error monitoring: grouping, stacks from logged errors, alerts, browser reports, operator view. */
const tenantScope = require("./tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "monitoring-secret";
const monitoring = require("./monitoringService");
const ErrorEvent = require("../models/ErrorEvent");
const User = require("../models/User");

let app;
const hooks = [];
const realFetch = global.fetch;
const realError = console.error;

const events = () => tenantScope.runAsSystem(() => ErrorEvent.find().lean());

beforeAll(async () => {
  fake.connect();
  console.error = () => {}; // keep the test output clean; captureConsoleErrors wraps this
  monitoring.captureConsoleErrors();
  process.env.ALERT_WEBHOOK_URL = "https://hooks.example.test/alert";
  global.fetch = vi.fn(async (url, opts) => { hooks.push({ url, body: JSON.parse(opts.body) }); return { ok: true }; });
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use(monitoring.requestMonitor());
  app.get("/api/things/:id", (req, res) => {
    try {
      throw new Error(`Cast to ObjectId failed for value "${req.params.id}"`);
    } catch (error) {
      console.error("GET thing error:", error);
      res.status(500).json({ success: false, message: "Error loading thing", error: error.message });
    }
  });
  app.get("/api/ok", (req, res) => res.json({ ok: true }));
  app.use("/api/monitoring", require("../routes/monitoring"));
  app.use("/api/platform", require("../routes/platform"));
});

afterAll(() => {
  global.fetch = realFetch;
  console.error = realError;
  delete process.env.ALERT_WEBHOOK_URL;
});

describe("server errors", () => {
  it("a 500 is recorded with the stack the route logged; identical ones are grouped; first one alerts", async () => {
    await request(app).get("/api/things/abc").expect(500);
    await request(app).get("/api/things/xyz").expect(500);
    await request(app).get("/api/ok").expect(200);
    await new Promise((r) => setTimeout(r, 50));
    const list = await events();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ source: "server", route: "GET /api/things/:id", count: 2, status: "open" });
    expect(list[0].samples[0].stack).toContain("Cast to ObjectId failed");
    expect(list[0].samples[0].url).toBe("/api/things/abc");
    expect(hooks).toHaveLength(1);
    expect(hooks[0].body.text).toContain("Nouvelle erreur");
  });

  it("in production the browser never sees the internal message", async () => {
    process.env.NODE_ENV = "production";
    const r = await request(app).get("/api/things/abc").expect(500);
    process.env.NODE_ENV = "test";
    expect(r.body).toEqual({ success: false, message: "Error loading thing" });
  });

  it("a resolved error that comes back is reopened and alerts again", async () => {
    await tenantScope.runAsSystem(() => ErrorEvent.updateMany({}, { $set: { status: "resolved", lastAlertAt: new Date(Date.now() - 2 * 3600 * 1000) } }));
    await request(app).get("/api/things/again").expect(500);
    await new Promise((r) => setTimeout(r, 50));
    const [e] = await events();
    expect(e.status).toBe("open");
    expect(hooks.at(-1).body.text).toContain("Erreur revenue");
  });
});

describe("browser errors", () => {
  it("are accepted without login, trimmed, grouped by message and first frame", async () => {
    const body = { message: "Cannot read properties of undefined (reading 'name')", stack: "TypeError: x\n    at Kpi (https://app.test/assets/index-abc.js:1:200)", page: "/sales/invoices/66f0c0ffee0000000000abcd?tab=2", build: "2026.10" };
    await request(app).post("/api/monitoring/client-errors").send(body).expect(204);
    await request(app).post("/api/monitoring/client-errors").send(body).expect(204);
    await request(app).post("/api/monitoring/client-errors").send({}).expect(400);
    const b = (await events()).find((e) => e.source === "browser");
    expect(b).toMatchObject({ count: 2, route: "/sales/invoices/:id" });
    expect(b.samples[0].url).toBe("/sales/invoices/66f0c0ffee0000000000abcd");
  });
});

describe("operator view", () => {
  it("only the platform operator lists and resolves errors", async () => {
    const [op, clientAdmin] = await tenantScope.runAsSystem(async () => [
      await User.create({ firstName: "Op", lastName: "Platform", email: "op@platform.test", password: "Secret@123", role: "platform_admin" }),
      await User.create({ firstName: "Ad", lastName: "Min", email: "ad@client.test", password: "Secret@123", role: "admin", tenant: (await require("../models/Tenant").create({ name: "Client A" }))._id }),
    ]);
    const tok = (u) => ({ Authorization: `Bearer ${jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET)}` });
    await request(app).get("/api/platform/errors").set(tok(clientAdmin)).expect(403);
    const r = await request(app).get("/api/platform/errors?status=all").set(tok(op)).expect(200);
    expect(r.body.data.events.length).toBe(2);
    const id = r.body.data.events[0]._id;
    await request(app).patch(`/api/platform/errors/${id}`).set(tok(op)).send({ status: "resolved" }).expect(200);
    const open = await request(app).get("/api/platform/errors").set(tok(op)).expect(200);
    expect(open.body.data.events.length).toBe(1);
  });
});

describe("helpers", () => {
  it("normalize blanks ids, numbers and quoted values", () => {
    expect(monitoring.normalize('Cast failed for "abc" at 66f0c0ffee0000000000abcd line 12')).toBe("Cast failed for '…' at :id line #");
  });
});
