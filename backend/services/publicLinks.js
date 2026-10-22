const crypto = require("crypto");

/**
 * Signed, expiring links to one document (invoice PDF, statement PDF)
 * that a customer can open from WhatsApp without an account.
 * Token = base64url(payload) + "." + HMAC-SHA256(payload). Nothing in
 * the token is secret; it simply can't be forged or extended.
 */
// Own key (PUBLIC_LINK_SECRET), else one DERIVED from JWT_SECRET — never the
// session key itself, never a built-in default: with no secret at all,
// links can be neither made nor opened (fail closed).
const secret = () => {
  if (process.env.PUBLIC_LINK_SECRET) return process.env.PUBLIC_LINK_SECRET;
  if (process.env.JWT_SECRET) return crypto.createHmac("sha256", process.env.JWT_SECRET).update("sanity-public-links/v1").digest("hex");
  throw Object.assign(new Error("PUBLIC_LINK_SECRET (or JWT_SECRET) is not configured"), { status: 503 });
};
const b64 = (s) => Buffer.from(s).toString("base64url");
const mac = (s) => crypto.createHmac("sha256", secret()).update(s).digest("base64url");

function sign(payload, days = Number(process.env.PUBLIC_LINK_DAYS) || 30) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + days * 86400000 }));
  return `${body}.${mac(body)}`;
}

function verify(token) {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = mac(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Public base URL of the API (what a customer's phone can reach). */
function baseUrl(req) {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/+$/, "");
  return req ? `${req.protocol}://${req.get("host")}` : "http://localhost:5000";
}

const docUrl = (req, payload) => `${baseUrl(req)}/api/public/docs/${sign(payload)}`;

module.exports = { sign, verify, baseUrl, docUrl };
