import { describe, it, expect } from "vitest";
const express = require("express");
const request = require("supertest");
const { securityHeaders, trustProxySetting } = require("./securityHeaders");
const { loginRateLimiter } = require("./rateLimitMiddleware");

function appWith(opts) {
  const app = express();
  app.set("trust proxy", trustProxySetting(opts?.trust));
  app.disable("x-powered-by");
  app.use(securityHeaders(opts));
  app.get("/api/thing", (req, res) => res.json({ ip: req.ip }));
  app.post("/api/login", loginRateLimiter, (req, res) => res.status(401).json({}));
  return app;
}

describe("security headers", () => {
  it("API answers carry a locked-down CSP, nosniff, no framing, no referrer, no caching", async () => {
    const r = await request(appWith()).get("/api/thing").expect(200);
    expect(r.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(r.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
    expect(r.headers["x-frame-options"]).toBe("DENY");
    expect(r.headers["referrer-policy"]).toBe("no-referrer");
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.headers["x-powered-by"]).toBeUndefined();
    expect(r.headers["strict-transport-security"]).toBeUndefined(); // dev
  });

  it("signed PDF links open in the browser's viewer (no CSP), still nosniff", async () => {
    const app = express();
    app.use(securityHeaders());
    app.get("/api/public/docs/:t", (req, res) => res.type("application/pdf").send("%PDF-1.4"));
    const r = await request(app).get("/api/public/docs/abc").expect(200);
    expect(r.headers["content-security-policy"]).toBeUndefined();
    expect(r.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("HSTS in production", async () => {
    const r = await request(appWith({ production: true })).get("/api/thing");
    expect(r.headers["strict-transport-security"]).toMatch(/max-age=31536000/);
  });
});

describe("behind the host's proxy", () => {
  it("each visitor keeps their own IP, so one attacker can't lock everybody out of login", async () => {
    const app = appWith({ trust: "1" });
    const r = await request(app).get("/api/thing").set("X-Forwarded-For", "41.250.1.10");
    expect(r.body.ip).toBe("41.250.1.10");
    for (let i = 0; i < 10; i += 1) await request(app).post("/api/login").set("X-Forwarded-For", "41.250.1.10");
    await request(app).post("/api/login").set("X-Forwarded-For", "41.250.1.10").expect(429);
    await request(app).post("/api/login").set("X-Forwarded-For", "105.66.2.20").expect(401); // someone else
  });

  it("TRUST_PROXY parsing", () => {
    expect(trustProxySetting(undefined)).toBe(1);
    expect(trustProxySetting("0")).toBe(0);
    expect(trustProxySetting("2")).toBe(2);
    expect(trustProxySetting("false")).toBe(false);
    expect(trustProxySetting("loopback")).toBe("loopback");
  });
});
