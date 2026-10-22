const crypto = require("crypto");
const { AsyncLocalStorage } = require("async_hooks");
const tenantScope = require("./tenantScope");

/**
 * ============================================================
 * ERROR MONITORING (no outside service)
 * ============================================================
 * Records, groups and alerts on:
 *   - server answers with status ≥ 500 — with the stack of the error
 *     the route logged through console.error (every route does
 *     `console.error("...", error)` before answering 500), captured
 *     per request;
 *   - errors reaching Express' error handler;
 *   - crashes (uncaughtException / unhandledRejection);
 *   - failed scheduled jobs;
 *   - errors in users' browsers (routes/monitoring.js).
 *
 * Identical errors (same source, route and message once numbers and
 * ids are blanked) form one group. The FIRST occurrence of a group —
 * or its return after being marked resolved — sends an alert to
 * ALERT_EMAIL (SMTP settings of .env) and/or ALERT_WEBHOOK_URL
 * (Slack / Discord / Teams / any JSON webhook), at most once an hour
 * per group and 20 an hour overall.
 *
 * Monitoring must never break the app: every failure in here is
 * swallowed.
 * ============================================================
 */

const BUILD = process.env.BUILD_ID || "";
const store = new AsyncLocalStorage();
const MAX_SAMPLES = 5;
const ALERT_EVERY_MS = 60 * 60 * 1000;
const ALERT_BUDGET_PER_HOUR = 20;
let alertWindow = { start: Date.now(), sent: 0 };
let enabled = true;

const hideInternals = () => process.env.NODE_ENV === "production" || process.env.HIDE_ERROR_DETAILS === "true";
const clip = (s, n) => (s == null ? undefined : String(s).slice(0, n));
const stripQuery = (url) => clip(String(url || "").split("?")[0], 300);

function normalize(message) {
  return String(message || "")
    .replace(/[0-9a-f]{24}/gi, ":id")
    .replace(/\b\d[\d.,:/-]*\b/g, "#")
    .replace(/(["'])(?:(?!\1).){1,80}\1/g, "'…'")
    .slice(0, 300);
}

function fingerprintOf({ source, route, message, stack }) {
  // Browser errors: the first frame tells two different bugs with the same message apart.
  const frame = source === "browser" ? String(stack || "").split("\n").find((l) => /at |@/.test(l)) || "" : "";
  return crypto
    .createHash("sha1")
    .update([source, route || "", normalize(message), normalize(frame.replace(/\?[^:)]*/g, ""))].join("|"))
    .digest("hex");
}

/** Express middleware: per-request store + record 5xx answers on finish. */
function requestMonitor() {
  return function monitor(req, res, next) {
    const ctx = { errors: [], body: null };
    const json = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 500) {
        ctx.body = body;
        // Production: routes' `error: error.message` (database / internal
        // messages) stays in the error log, never reaches the browser.
        if (hideInternals() && body && typeof body === "object" && !Array.isArray(body) && "error" in body) {
          const { error, ...rest } = body; // eslint-disable-line no-unused-vars
          return json(rest);
        }
      }
      return json(body);
    };
    res.on("finish", () => {
      if (res.statusCode < 500 || !enabled) return;
      const err = ctx.errors[ctx.errors.length - 1];
      const route = `${req.method} ${(req.baseUrl || "") + (req.route?.path || "")}`;
      record({
        source: "server",
        route: req.route ? route : `${req.method} ${stripQuery(req.originalUrl)}`,
        message: err?.message || ctx.body?.error || ctx.body?.message || `HTTP ${res.statusCode}`,
        stack: err?.stack,
        status: res.statusCode,
        url: req.originalUrl,
        tenantRef: req.user?.tenant || null,
        userRef: req.user?.id || null,
        userAgent: req.headers["user-agent"],
      });
    });
    store.run(ctx, next);
  };
}

/** Keeps the Error objects that routes log, for the request that logged them. */
function captureConsoleErrors() {
  if (console.error.$monitored) return;
  const original = console.error;
  const patched = (...args) => {
    const ctx = store.getStore();
    if (ctx) {
      const err = args.find((a) => a instanceof Error);
      if (err) ctx.errors.push(err);
      else if (args.length) ctx.errors.push({ message: args.map((a) => (typeof a === "string" ? a : a?.message || "")).join(" ").trim() });
    }
    return original(...args);
  };
  patched.$monitored = true;
  console.error = patched;
}

async function alert(event, reason) {
  const now = Date.now();
  if (now - alertWindow.start > 3600 * 1000) alertWindow = { start: now, sent: 0 };
  if (alertWindow.sent >= ALERT_BUDGET_PER_HOUR) return;
  if (event.lastAlertAt && now - new Date(event.lastAlertAt).getTime() < ALERT_EVERY_MS) return;
  const to = process.env.ALERT_EMAIL;
  const hook = process.env.ALERT_WEBHOOK_URL;
  if (!to && !hook) return;
  alertWindow.sent += 1;
  const ErrorEvent = require("../models/ErrorEvent");
  await ErrorEvent.updateOne({ _id: event._id }, { $set: { lastAlertAt: new Date() } });
  const title = `[Sanity] ${reason === "reopened" ? "Erreur revenue" : "Nouvelle erreur"} (${event.source}) : ${clip(event.message, 140)}`;
  const text = [
    title,
    `Route : ${event.route || "—"}`,
    `Occurrences : ${event.count}`,
    `Première : ${new Date(event.firstSeen).toISOString()}`,
    process.env.PUBLIC_APP_URL ? `Voir : ${process.env.PUBLIC_APP_URL.replace(/\/$/, "")}/platform/errors` : "",
    "",
    clip(event.samples?.[event.samples.length - 1]?.stack, 3000) || "",
  ].filter((l) => l !== "").join("\n");
  if (to) {
    try {
      await require("./mailService").sendMail({ to, subject: title, text });
    } catch (e) { /* alert channel down: nothing else to do */ }
  }
  if (hook) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: clip(text, 1900) }) });
    } catch (e) { /* ignore */ }
  }
}

/**
 * Records one occurrence. Returns the group (or null when monitoring
 * failed / is off). Never throws.
 */
async function record({ source, route, message, stack, status, url, tenantRef, userRef, userAgent, build }) {
  if (!enabled) return null;
  try {
    return await tenantScope.runAsSystem(async () => {
      const ErrorEvent = require("../models/ErrorEvent");
      const msg = clip(message || "Unknown error", 1000);
      const fingerprint = fingerprintOf({ source, route, message: msg, stack });
      const sample = {
        at: new Date(), tenantRef: tenantRef || null, userRef: userRef || null,
        url: stripQuery(url), status, stack: clip(stack, 8000), userAgent: clip(userAgent, 300), build: clip(build || BUILD, 60),
      };
      const before = await ErrorEvent.findOne({ fingerprint }).select("status").lean();
      const update = {
        $inc: { count: 1 },
        $set: { lastSeen: new Date(), message: msg, route: clip(route, 300) },
        $setOnInsert: { fingerprint, source, firstSeen: new Date() },
        $push: { samples: { $each: [sample], $slice: -MAX_SAMPLES } },
      };
      if (tenantRef) update.$addToSet = { tenantsAffected: tenantRef };
      if (before?.status === "resolved") update.$set.status = "open";
      const event = await ErrorEvent.findOneAndUpdate({ fingerprint }, update, { upsert: true, new: true }).lean();
      const reason = !before ? "new" : before.status === "resolved" ? "reopened" : null;
      if (reason) await alert(event, reason);
      return event;
    });
  } catch (e) {
    return null;
  }
}

function setEnabled(value) {
  enabled = !!value;
}

/** Crash handlers: record, then let the process die as Node would (the host restarts it). */
function installProcessHandlers() {
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
    record({ source: "crash", route: "unhandledRejection", message: reason?.message || String(reason), stack: reason?.stack });
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    const done = () => process.exit(1);
    Promise.race([record({ source: "crash", route: "uncaughtException", message: err?.message, stack: err?.stack }), new Promise((r) => setTimeout(r, 2000))]).finally(done);
  });
}

module.exports = { requestMonitor, captureConsoleErrors, record, fingerprintOf, normalize, setEnabled, installProcessHandlers };
