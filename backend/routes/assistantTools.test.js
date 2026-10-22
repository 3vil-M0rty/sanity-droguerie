import { describe, it, expect, beforeAll, afterEach } from "vitest";

/** The assistant reads the company's own figures, within each user's rights. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "assistant-tools-secret";

const User = require("../models/User");
const Customer = require("../models/Customer");
const assistant = require("../services/assistantService");
const tools = require("../services/assistantTools");

let app;
let demo;
const tok = {};
const users = {};

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/assistant", require("./assistant"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1", "rep2"]) {
    tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
    // the shape auth.js puts on req.user
    users[k] = await tenantScope.runAsSystem(async () => {
      const u = await User.findById(demo.users[k]._id).lean();
      return { ...u, id: String(u._id) };
    });
  }
}, 120000);
afterEach(() => assistant.setClient(undefined));

const run = (who, name, input) => tenantScope.runAsSystem(() => tools.runTool(name, input, { user: users[who], companyId: demo.company._id, now: new Date() }));
const json = (r) => JSON.parse(r.content);
const repCustomer = async (rep) => tenantScope.runAsSystem(() => Customer.findOne({ company: demo.company._id, salesRep: demo.users[rep]._id }).lean());

describe("data tools", () => {
  it("offers each user only the tools they have rights for", () => {
    const admin = tools.toolsFor(users.admin).map((t) => t.name);
    expect(admin).toEqual(expect.arrayContaining(["customer_purchases", "article_trends", "stock_status", "customer_balances", "sales_summary", "stockout_forecast"]));
    const store = tools.toolsFor(users.store).map((t) => t.name);
    expect(store).toContain("stock_status");
    expect(store).not.toContain("customer_purchases");
    expect(store).not.toContain("customer_balances");
  });

  it("answers 'what did this customer buy this quarter?' with the previous period to compare", async () => {
    const c = Object.values(demo.customers).find((x) => x.type === "reseller");
    const r = await run("admin", "customer_purchases", { customer: c.name });
    expect(r.isError).toBe(false);
    const out = json(r);
    expect(out.customer.name).toBe(c.name);
    expect(out.revenue).toBeGreaterThan(0);
    expect(out.topArticles.length).toBeGreaterThan(0);
    expect(out.previousPeriod).toHaveProperty("changePercent");
  });

  it("keeps a rep to their own customers and re-checks rights on every call", async () => {
    const other = await repCustomer("rep2");
    const r = await run("rep1", "customer_purchases", { customer: other.name });
    expect(r.isError).toBe(true);
    expect(r.content).toMatch(/Aucun client accessible/);
    const mine = await repCustomer("rep1");
    expect((await run("rep1", "customer_purchases", { customer: mine.name })).isError).toBe(false);
    // the storekeeper is refused even if the model calls the tool anyway
    const denied = await run("store", "customer_purchases", { customer: mine.name });
    expect(denied).toMatchObject({ isError: true });
    expect(denied.content).toMatch(/Accès refusé/);
  });

  it("hides amounts from people who don't see money", async () => {
    const store = json(await run("store", "stock_status", { query: "GRO-ES" }));
    expect(store.articles.length).toBeGreaterThan(0);
    expect(store.articles[0]).not.toHaveProperty("value");
    const admin = json(await run("admin", "stock_status", { query: "GRO-ES" }));
    expect(admin.articles[0]).toHaveProperty("value");
  });

  it("finds falling articles, sales by month and the biggest balances", async () => {
    const t = json(await run("admin", "article_trends", { direction: "falling", days: 90 }));
    expect(t.articles.every((a) => a.unitsNow < a.unitsBefore)).toBe(true);
    const s = json(await run("admin", "sales_summary", { groupBy: "month", from: new Date(Date.now() - 180 * 864e5).toISOString().slice(0, 10) }));
    expect(s.rows.length).toBeGreaterThanOrEqual(5);
    expect(s.revenue).toBeGreaterThan(0);
    const b = json(await run("admin", "customer_balances", {}));
    expect(b.customers[0].balance).toBeGreaterThanOrEqual(b.customers.at(-1).balance);
    const bad = await run("admin", "sales_summary", { groupBy: "month", from: "hier" });
    expect(bad.isError).toBe(true);
  });
});

describe("tool loop in the chat", () => {
  it("calls the tool, streams a 'tool' event, gives the result back to Claude and streams its answer", async () => {
    const c = Object.values(demo.customers).find((x) => x.type === "reseller");
    const calls = [];
    const script = [
      { text: "Je consulte ses achats…", stop: "tool_use", content: [{ type: "text", text: "Je consulte ses achats…" }, { type: "tool_use", id: "tu_1", name: "customer_purchases", input: { customer: c.name } }] },
      { text: `${c.name} a acheté pour X MAD HT.`, stop: "end_turn" },
    ];
    assistant.setClient({
      beta: {
        messages: {
          stream(params) {
            calls.push(JSON.parse(JSON.stringify(params)));
            const step = script[calls.length - 1];
            return {
              async* [Symbol.asyncIterator]() { yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: step.text } }; },
              finalMessage: async () => ({ stop_reason: step.stop, content: step.content || [{ type: "text", text: step.text }] }),
            };
          },
        },
      },
    });
    const r = await request(app).post("/api/assistant/chat").set({ Authorization: `Bearer ${tok.admin}` })
      .send({ messages: [{ role: "user", content: `Qu'a acheté ${c.name} ce trimestre ?` }], companyId: demo.company._id });
    const ev = r.text.split("\n\n").filter(Boolean).map((b) => { const [e, d] = b.split("\n"); return { event: e.slice(7), data: JSON.parse(d.slice(6)) }; });
    expect(ev.find((e) => e.event === "tool").data).toEqual({ name: "customer_purchases", label: "Achats d'un client" });
    expect(ev.at(-1)).toEqual({ event: "done", data: { mode: "ai", stopReason: "end_turn" } });
    expect(calls).toHaveLength(2);
    expect(calls[0].tools.map((t) => t.name)).toContain("customer_purchases");
    const second = calls[1].messages;
    expect(second[1].role).toBe("assistant");
    expect(second[1].content[1].type).toBe("tool_use");
    expect(second[2].content[0]).toMatchObject({ type: "tool_result", tool_use_id: "tu_1" });
    expect(JSON.parse(second[2].content[0].content).customer.name).toBe(c.name);
    expect(calls[0].system[1].text).toMatch(/Date du jour : \d{4}-\d{2}-\d{2}/);
  });
});
