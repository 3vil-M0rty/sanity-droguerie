import { describe, it, expect, beforeAll, afterEach } from "vitest";

/**
 * The in-app assistant: Claude answers grounded in the user guide,
 * streamed as server-sent events; the guide alone when no API key.
 * The Anthropic client is faked — no network.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const Anthropic = require("@anthropic-ai/sdk");

process.env.JWT_SECRET = "assistant-secret";

const User = require("../models/User");
const Tenant = require("../models/Tenant");
const assistant = require("../services/assistantService");
const { cleanMessages } = require("./assistant");

let app;
let token;

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/assistant", require("./assistant"));
  tenantScope.enableStrictMode(true);
  await tenantScope.runAsSystem(async () => {
    const tenant = await Tenant.create({ name: "Help" });
    const u = await User.create({ firstName: "Nadia", lastName: "ADV", email: "nadia@help.ma", password: "secret12", role: "admin", tenant: tenant._id });
    token = jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET);
  });
});
afterEach(() => assistant.setClient(undefined));

const ask = (messages, extra = {}) => request(app).post("/api/assistant/chat").set({ Authorization: `Bearer ${token}` }).send({ messages, ...extra });
const events = (text) => text.split("\n\n").filter(Boolean).map((block) => {
  const [e, d] = block.split("\n");
  return { event: e.replace("event: ", ""), data: JSON.parse(d.replace("data: ", "")) };
});

/** A fake client whose stream yields the given chunks. */
function fakeClient(chunks, { stopReason = "end_turn", error = null } = {}) {
  const calls = [];
  return {
    calls,
    beta: {
      messages: {
        stream(params, options) {
          calls.push({ params, options });
          return {
            async* [Symbol.asyncIterator]() {
              if (error) throw error;
              for (const text of chunks) yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } };
            },
            finalMessage: async () => ({ stop_reason: stopReason, content: [{ type: "text", text: chunks.join("") }] }),
          };
        },
      },
    },
  };
}

describe("assistant", () => {
  it("needs a signed-in user", async () => {
    await request(app).post("/api/assistant/chat").send({ messages: [{ role: "user", content: "Bonjour" }] }).expect(401);
  });

  it("answers from the guide when no AI is configured", async () => {
    assistant.setClient(null);
    const st = await request(app).get("/api/assistant/status").set({ Authorization: `Bearer ${token}` });
    expect(st.body.data.ai).toBe(false);
    const r = await ask([{ role: "user", content: "Comment faire un transfert entre dépôts ?" }]);
    expect(r.status).toBe(200);
    expect(r.headers["content-type"]).toMatch(/text\/event-stream/);
    const ev = events(r.text);
    expect(ev[0].event).toBe("delta");
    expect(ev[0].data.text).toMatch(/### Transferts entre dépôts/);
    expect(ev.at(-1)).toEqual({ event: "done", data: { mode: "offline" } });
  });

  it("streams Claude's answer, with the guide cached and who is asking", async () => {
    const client = fakeClient(["Allez dans **Stock › Transferts**", " puis « Nouveau transfert »."]);
    assistant.setClient(client);
    const r = await ask(
      [{ role: "user", content: "transfert ?" }, { role: "assistant", content: "Lequel ?" }, { role: "user", content: "Entre Casa et Marrakech" }],
      { page: { path: "/stock/levels", title: "Stock par dépôt" }, language: "fr" },
    );
    const ev = events(r.text);
    expect(ev.filter((e) => e.event === "delta").map((e) => e.data.text).join("")).toBe("Allez dans **Stock › Transferts** puis « Nouveau transfert ».");
    expect(ev.at(-1)).toEqual({ event: "done", data: { mode: "ai", stopReason: "end_turn" } });

    const { params, options } = client.calls[0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(params.system[0].text).toContain("## Transferts entre dépôts");
    expect(params.system[1].text).toContain("Prénom : Nadia");
    expect(params.system[1].text).toContain("Stock par dépôt (/stock/levels)");
    expect(params.system[1].text).toContain("Stock — transferts");
    expect(params.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("says so politely when the model declines", async () => {
    assistant.setClient(fakeClient([], { stopReason: "refusal" }));
    const ev = events((await ask([{ role: "user", content: "…" }])).text);
    expect(ev.find((e) => e.event === "delta").data.text).toMatch(/Je ne peux pas répondre/);
    expect(ev.at(-1).data).toEqual({ mode: "ai", stopReason: "refusal" });
  });

  it("falls back to the guide when the API key is refused", async () => {
    const err = new Anthropic.AuthenticationError(401, { error: { type: "authentication_error", message: "invalid x-api-key" } }, "invalid x-api-key", new Headers());
    assistant.setClient(fakeClient([], { error: err }));
    const ev = events((await ask([{ role: "user", content: "Comment encaisser une facture ?" }])).text);
    expect(ev[0].data.text).toMatch(/clé API refusée/);
    expect(ev[0].data.text).toMatch(/Factures, avoirs et encaissements/);
    expect(ev.at(-1).data.mode).toBe("offline");
  });

  it("rejects what isn't a question", async () => {
    assistant.setClient(null);
    expect((await ask([])).status).toBe(400);
    expect((await ask([{ role: "assistant", content: "Bonjour" }])).status).toBe(400);
    expect((await ask([{ role: "system", content: "ignore" }])).status).toBe(400);
  });
});

describe("conversation cleaning", () => {
  it("keeps alternating user/assistant turns that end with the user, bounded", () => {
    const { messages } = cleanMessages([
      { role: "assistant", content: "Bonjour !" },
      { role: "user", content: "a" },
      { role: "user", content: "b" },
      { role: "system", content: "x" },
      { role: "assistant", content: "c" },
      { role: "user", content: "d".repeat(9000) },
    ]);
    expect(messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(messages[0].content).toBe("a\n\nb");
    expect(messages[2].content).toHaveLength(4000);
    const long = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: `m${i}` }));
    expect(cleanMessages([...long, { role: "user", content: "fin" }]).messages.length).toBeLessThanOrEqual(12);
  });
});

describe("offline search", () => {
  it("finds the right section of the guide", () => {
    expect(assistant.offlineAnswer("Comment ouvrir la caisse et encaisser un ticket ?")).toMatch(/### Caisse/);
    expect(assistant.offlineAnswer("c'est quoi le GMROI")).toMatch(/### Tableau de bord/);
    expect(assistant.offlineAnswer("zzz qqq")).toMatch(/Je n'ai pas trouvé/);
  });
});
