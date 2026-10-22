const express = require("express");
const jwt = require("jsonwebtoken");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { record } = require("../services/monitoringService");

/**
 * POST /api/monitoring/client-errors — errors from users' browsers
 * (frontend/src/utils/errorReporter.js). No login needed (an error can
 * happen on the login page) — the session, when there is one, only
 * tags the report. Limited to 30 reports / 15 min per visitor and to
 * short fields; nothing typed by the user is sent.
 */
const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => `client-errors:${ipKeyGenerator(req.ip || "")}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false }),
});

function sessionOf(req) {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !process.env.JWT_SECRET) return {};
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    return d?.purpose ? {} : { userRef: d.id || null, tenantRef: d.tenant || null };
  } catch {
    return {};
  }
}

router.post("/client-errors", limiter, async (req, res) => {
  const b = req.body || {};
  const message = String(b.message || "").slice(0, 500);
  if (!message) return res.status(400).json({ success: false });
  const { userRef, tenantRef } = sessionOf(req);
  await record({
    source: "browser",
    route: String(b.page || "").split("?")[0].replace(/[0-9a-f]{24}/gi, ":id").slice(0, 200),
    message,
    stack: String(b.stack || "").slice(0, 6000),
    url: String(b.page || "").slice(0, 300),
    userRef: /^[0-9a-f]{24}$/i.test(String(userRef)) ? userRef : null,
    tenantRef: /^[0-9a-f]{24}$/i.test(String(tenantRef)) ? tenantRef : null,
    userAgent: req.headers["user-agent"],
    build: String(b.build || "").slice(0, 60),
  });
  res.status(204).end();
});

module.exports = router;
