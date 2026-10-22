const helmet = require("helmet");

/**
 * ============================================================
 * SECURITY HEADERS (API)
 * ============================================================
 * The API only answers JSON, PDFs, Excel files and images — never
 * HTML for a browser to render — so its Content-Security-Policy can
 * forbid everything: even if an attacker managed to make the API echo
 * markup, a browser would neither run scripts from it nor frame it.
 *
 *  - Strict-Transport-Security: HTTPS only for a year (production).
 *  - X-Content-Type-Options: nosniff — a PDF stays a PDF.
 *  - X-Frame-Options / frame-ancestors: no API response inside a frame.
 *  - Referrer-Policy: no-referrer — signed document links never leak
 *    through the Referer header.
 *  - Cross-Origin-Resource-Policy: same-site would break the frontend
 *    on another domain (Vercel/Netlify), so "cross-origin" — CORS
 *    (server.js) is what restricts which sites may call the API.
 *  - Cache-Control: no-store on API answers (client data must not sit
 *    in shared caches or the browser's back/forward cache).
 *
 * The frontend's own headers (its CSP for the app pages) are set by its
 * host: frontend/vercel.json, or the equivalent in docs/SECURITY.md.
 * ============================================================
 */
function securityHeaders({ production = process.env.NODE_ENV === "production" } = {}) {
  const base = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'none'"],
        "form-action": ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: production ? { maxAge: 31536000, includeSubDomains: true } : false,
    xFrameOptions: { action: "deny" },
  });
  return function apply(req, res, next) {
    base(req, res, () => {
      // Signed document links (WhatsApp/e-mail) open a PDF straight in
      // the browser's viewer, which a "default-src 'none'" policy can
      // break (Firefox's pdf.js); those answers are PDFs we generate,
      // and nosniff still applies.
      if (req.path.startsWith("/api/public/docs/")) res.removeHeader("Content-Security-Policy");
      if (req.path.startsWith("/api/")) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
      }
      res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
      next();
    });
  };
}

/**
 * Behind a load balancer / reverse proxy (Render, Railway, Heroku,
 * nginx…), req.ip is the proxy's address unless Express trusts it:
 * every visitor would then share ONE rate-limit bucket (10 failed
 * logins by anyone would lock everybody out). TRUST_PROXY = number of
 * proxies in front of the server (default 1); set 0 when the server is
 * reached directly, otherwise X-Forwarded-For could be forged.
 */
function trustProxySetting(value = process.env.TRUST_PROXY) {
  if (value === undefined || value === "") return 1;
  if (value === "true") return true;
  if (value === "false") return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : value; // also accepts "loopback", a subnet…
}

module.exports = { securityHeaders, trustProxySetting };
