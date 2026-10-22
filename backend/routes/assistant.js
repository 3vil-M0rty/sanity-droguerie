const express = require("express");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const Anthropic = require("@anthropic-ai/sdk");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const User = require("../models/User");
const Company = require("../models/Company");
const mongoose = require("mongoose");
const assistant = require("../services/assistantService");

/**
 * ============================================================
 * ASSISTANT — /api/assistant
 * ============================================================
 * GET  /status   { ai: true|false }  (false = answers from the guide only)
 * POST /chat     { messages: [{ role, content }…], page: { path, title }, language, companyId }
 *                → text/event-stream:
 *                  event: delta  data: { text }
 *                  event: tool   data: { name, label }   (reading the company's figures)
 *                  event: done   data: { mode: "ai"|"offline", stopReason }
 *                  event: error  data: { message }
 * Every signed-in user may ask. The assistant sees the user guide and who
 * is asking (role, accessible modules, current page). Company figures come
 * only through read-only tools, each checked against the user's permissions
 * (services/assistantTools.js) — for the company given, within the user's
 * client (tenant isolation applies to every query).
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.assistant));

const MAX_TURNS = 12;
const MAX_CHARS = 4000;
const MAX_TOTAL = 24000;

// A help chat, not a bulk endpoint: 30 questions per 10 minutes per user.
const askLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: Number(process.env.ASSISTANT_RATE_MAX) || 30,
  keyGenerator: (req) => (req.user?.id ? `assistant:${req.user.id}` : `assistant-ip:${ipKeyGenerator(req.ip || "")}`),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: "Trop de questions d'affilée — réessayez dans quelques minutes." }),
});

/** Clean conversation for the API: user/assistant turns, alternating, ending with the user. */
function cleanMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) return { error: "Posez une question." };
  let list = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter((m) => m.content);
  // merge consecutive same-role turns
  list = list.reduce((out, m) => {
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content = `${last.content}\n\n${m.content}`.slice(0, MAX_CHARS);
    else out.push({ ...m });
    return out;
  }, []);
  list = list.slice(-MAX_TURNS);
  while (list.length && list[0].role !== "user") list.shift();
  if (!list.length || list[list.length - 1].role !== "user") return { error: "La dernière entrée doit être une question." };
  let total = list.reduce((s, m) => s + m.content.length, 0);
  while (total > MAX_TOTAL && list.length > 1) {
    total -= list[0].content.length + (list[1]?.content.length || 0);
    list = list.slice(2);
  }
  return { messages: list };
}

router.get("/status", (req, res) => {
  res.json({ success: true, data: { ai: assistant.isAvailable() } });
});

router.post("/chat", askLimiter, async (req, res) => {
  const { messages, error } = cleanMessages(req.body?.messages);
  if (error) return res.status(400).json({ success: false, message: error });
  const page = req.body?.page && typeof req.body.page === "object" ? { path: req.body.page.path, title: req.body.page.title } : null;
  const language = typeof req.body?.language === "string" ? req.body.language.slice(0, 8) : "fr";
  const question = messages[messages.length - 1].content;

  res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders?.();
  const send = (event, data) => { if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };

  const offline = (note) => {
    const text = `${note ? `_${note}_\n\n` : ""}${assistant.offlineAnswer(question)}`;
    send("delta", { text });
    send("done", { mode: "offline" });
    res.end();
  };

  if (!assistant.isAvailable()) return offline();

  const controller = new AbortController();
  let finished = false;
  res.on("close", () => { if (!finished) controller.abort(); });

  try {
    const user = await User.findById(req.user.id).select("firstName").lean();
    // The company whose figures the tools read: must be one of the user's (tenant scope)
    const asked = mongoose.Types.ObjectId.isValid(String(req.body?.companyId || "")) ? req.body.companyId : null;
    const company = asked ? await Company.findById(asked).select("_id").lean() : await Company.findOne({}).select("_id").lean();
    const result = await assistant.streamAnswer({
      messages,
      user: req.user,
      context: { page, language, firstName: user?.firstName },
      companyId: company?._id || null,
      onText: (text) => send("delta", { text }),
      onTool: (t) => send("tool", t),
      signal: controller.signal,
    });
    finished = true;
    if (result.refused) send("delta", { text: "\n\nJe ne peux pas répondre à cette demande. Je peux en revanche vous expliquer comment utiliser un écran ou une fonction de Sanity." });
    send("done", { mode: "ai", stopReason: result.stopReason });
    res.end();
  } catch (err) {
    finished = true;
    if (controller.signal.aborted || err instanceof Anthropic.APIUserAbortError) return res.end();
    console.error("Assistant error:", err?.status || "", err?.message);
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return offline("L'assistant IA n'est pas disponible (clé API refusée) — voici la partie du guide qui correspond.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      send("error", { message: "L'assistant est très sollicité, réessayez dans un instant." });
    } else if (err instanceof Anthropic.APIConnectionError || (err instanceof Anthropic.APIError && (err.status || 0) >= 500)) {
      return offline("L'assistant IA est momentanément injoignable — voici la partie du guide qui correspond.");
    } else {
      send("error", { message: "L'assistant n'a pas pu répondre." });
    }
    res.end();
  }
});

module.exports = router;
module.exports.cleanMessages = cleanMessages;
