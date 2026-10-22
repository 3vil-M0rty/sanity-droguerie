import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";

/** WhatsApp: invoices, statements, reminders, public PDF links, Meta webhook. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

process.env.JWT_SECRET = "messaging-secret";

const SalesInvoice = require("../models/SalesInvoice");
const SalesSettings = require("../models/SalesSettings");
const MessageLog = require("../models/MessageLog");
const wa = require("../services/whatsappService");
const messaging = require("../services/messagingService");

let app;
let demo;
const tok = {};
const h = (who) => ({ Authorization: `Bearer ${tok[who]}` });
const binary = (res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); };
const CLOUD_ENV = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_INVOICE", "WHATSAPP_TEMPLATE_REMINDER", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"];

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json({ verify: (req, res, buf) => { if (req.originalUrl.startsWith("/api/public/whatsapp")) req.rawBody = buf; } }));
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/messaging", require("./messaging"));
  app.use("/api/customers", require("./customers"));
  app.use("/api/public", require("./publicDocs"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

afterEach(() => {
  CLOUD_ENV.forEach((k) => delete process.env[k]);
  vi.restoreAllMocks();
});

const anIssuedInvoice = () => tenantScope.runAsSystem(() => SalesInvoice.findOne({ company: demo.company._id, type: "invoice", status: { $in: ["issued", "partially_paid"] } }).lean());

describe("phone numbers", () => {
  it("normalises Moroccan numbers to the international form", () => {
    expect(wa.normalizePhone("06 61 23 45 67")).toBe("212661234567");
    expect(wa.normalizePhone("+212 661-234-567")).toBe("212661234567");
    expect(wa.normalizePhone("00212661234567")).toBe("212661234567");
    expect(wa.normalizePhone("+212 0661234567")).toBe("212661234567");
    expect(wa.normalizePhone("+33 6 12 34 56 78")).toBe("33612345678");
    expect(wa.normalizePhone("12")).toBeNull();
  });
});

describe("without the Business API (wa.me links)", () => {
  it("prepares an invoice message with a signed PDF link the customer can open", async () => {
    const inv = await anIssuedInvoice();
    const r = await request(app).post(`/api/messaging/invoices/${inv._id}/whatsapp`).set(h("admin")).send({});
    expect(r.status).toBe(200);
    expect(r.body.data.mode).toBe("link");
    expect(r.body.data.url).toMatch(/^https:\/\/wa\.me\/2126\d{8}\?text=/);
    const text = decodeURIComponent(r.body.data.url.split("text=")[1]);
    expect(text).toContain(inv.number);
    const link = text.match(/https?:\/\/\S+\/api\/public\/docs\/(\S+)/);
    expect(link).toBeTruthy();
    const pdf = await request(app).get(`/api/public/docs/${link[1]}`).buffer(true).parse(binary);
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.body.slice(0, 4).toString()).toBe("%PDF");
    // tampered or foreign tokens are refused
    const [body, sig] = link[1].split(".");
    const forged = Buffer.from(JSON.stringify({ k: "inv", id: String(inv._id), exp: Date.now() + 1e12 })).toString("base64url");
    await request(app).get(`/api/public/docs/${forged}.${sig}`).expect(410);
    await request(app).get(`/api/public/docs/${body}.${sig[0] === "x" ? "y" : "x"}${sig.slice(1)}`).expect(410);
    const log = await tenantScope.runAsSystem(() => MessageLog.findById(r.body.data.log._id).lean());
    expect(log).toMatchObject({ kind: "invoice", status: "link", provider: "link" });
  });

  it("sends a statement and gives its PDF", async () => {
    const customer = demo.customers["Plomberie Moderne Benali"];
    const r = await request(app).post(`/api/messaging/customers/${customer._id}/statement/whatsapp`).set(h("admin")).send({ to: "0612345678" });
    expect(r.body.data.url).toMatch(/^https:\/\/wa\.me\/212612345678\?/);
    expect(decodeURIComponent(r.body.data.url)).toMatch(/relevé de compte/);
    const pdf = await request(app).get(`/api/customers/${customer._id}/statement/pdf`).set(h("admin")).buffer(true).parse(binary);
    expect(pdf.status).toBe(200);
    expect(pdf.body.slice(0, 4).toString()).toBe("%PDF");
    await request(app).post(`/api/messaging/customers/${customer._id}/statement/whatsapp`).set(h("admin")).send({ to: "abc" }).expect(400);
  });

  it("lists late customers for reminders; a rep only sees their own", async () => {
    const all = await request(app).get(`/api/messaging/reminders?companyId=${demo.company._id}`).set(h("admin"));
    expect(all.status).toBe(200);
    const rows = all.body.data.rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].overdue).toBeGreaterThan(0);
    expect(rows[0].invoices[0].daysLate).toBeGreaterThanOrEqual(1);
    const mine = await request(app).get(`/api/messaging/reminders?companyId=${demo.company._id}`).set(h("rep1"));
    expect(mine.body.data.rows.every((x) => String(x.customer.salesRep) === String(demo.users.rep1._id))).toBe(true);
    expect(mine.body.data.rows.length).toBeLessThan(rows.length);

    const send = await request(app).post("/api/messaging/reminders").set(h("admin")).send({ companyId: demo.company._id, customers: [rows[0].customer._id] });
    expect(send.body.data.results[0]).toMatchObject({ ok: true, status: "link" });
    expect(decodeURIComponent(send.body.data.results[0].url)).toMatch(/impayée/);
    const again = await request(app).get(`/api/messaging/reminders?companyId=${demo.company._id}`).set(h("admin"));
    expect(again.body.data.rows.find((x) => x.customer._id === rows[0].customer._id).reminders).toBe(1);
    await request(app).post("/api/messaging/reminders").set(h("store")).send({ companyId: demo.company._id, customers: [rows[0].customer._id] }).expect(403);
  });
});

describe("with the WhatsApp Business API", () => {
  it("sends the approved template with the PDF as header, then follows Meta's receipts", async () => {
    Object.assign(process.env, { WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_TEMPLATE_INVOICE: "facture_v1", WHATSAPP_APP_SECRET: "app-secret" });
    const calls = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, opts) => {
      calls.push({ url, body: JSON.parse(opts.body) });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.ABC" }] }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const inv = await anIssuedInvoice();
    const r = await request(app).post(`/api/messaging/invoices/${inv._id}/whatsapp`).set(h("admin")).send({});
    expect(r.status).toBe(200);
    expect(r.body.data.url).toBeNull();
    expect(calls[0].url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(calls[0].body.template.name).toBe("facture_v1");
    expect(calls[0].body.template.components[0].parameters[0].document.link).toMatch(/\/api\/public\/docs\//);
    expect(calls[0].body.template.components[1].parameters[1].text).toBe(inv.number);

    const hook = (statuses) => {
      const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses } }] }] });
      const sig = `sha256=${crypto.createHmac("sha256", "app-secret").update(body).digest("hex")}`;
      return request(app).post("/api/public/whatsapp/webhook").set("Content-Type", "application/json").set("X-Hub-Signature-256", sig).send(body);
    };
    await hook([{ id: "wamid.ABC", status: "read" }]).expect(200);
    await hook([{ id: "wamid.ABC", status: "delivered" }]).expect(200); // late receipt doesn't go backwards
    const log = await tenantScope.runAsSystem(() => MessageLog.findOne({ providerId: "wamid.ABC" }).lean());
    expect(log.status).toBe("read");
    await request(app).post("/api/public/whatsapp/webhook").set("X-Hub-Signature-256", "sha256=00").send({ entry: [] }).expect(401);
  });

  it("logs a refusal from Meta as failed", async () => {
    Object.assign(process.env, { WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { message: "Recipient not on WhatsApp" } }), { status: 400 }));
    const inv = await anIssuedInvoice();
    const r = await request(app).post(`/api/messaging/invoices/${inv._id}/whatsapp`).set(h("admin")).send({});
    expect(r.status).toBe(502);
    expect(r.body.message).toMatch(/Recipient not on WhatsApp/);
  });

  it("answers Meta's webhook handshake", async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = "verify-me";
    const ok = await request(app).get("/api/public/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42");
    expect(ok.text).toBe("42");
    await request(app).get("/api/public/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42").expect(403);
  });

  it("sends automatic reminders once, on the reminder days only", async () => {
    Object.assign(process.env, { WHATSAPP_TOKEN: "t", WHATSAPP_PHONE_NUMBER_ID: "123", WHATSAPP_TEMPLATE_REMINDER: "relance_v1" });
    let n = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ messages: [{ id: `wamid.R${n++}` }] }), { status: 200 }));
    const rows = await tenantScope.runAsSystem(() => messaging.remindersDue(demo.company._id));
    const target = rows.find((r) => r.whatsapp && !r.lastReminderAt);
    const days = target.invoices[0].daysLate;
    await tenantScope.runAsSystem(() => SalesSettings.updateOne({ company: demo.company._id }, { $set: { "whatsapp.autoReminders": true, "whatsapp.reminderDays": [days] } }, { upsert: true }));
    const before = await tenantScope.runAsSystem(() => MessageLog.countDocuments({ kind: "reminder", automatic: true }));
    const sent = await tenantScope.runAsSystem(() => messaging.runDailyReminders());
    expect(sent).toBeGreaterThanOrEqual(1);
    expect(await tenantScope.runAsSystem(() => MessageLog.countDocuments({ kind: "reminder", automatic: true }))).toBe(before + sent);
    expect(await tenantScope.runAsSystem(() => messaging.runDailyReminders())).toBe(0); // not twice the same day
  });
});
