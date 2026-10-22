import { describe, it, expect, beforeAll } from "vitest";

/**
 * Billing the platform's clients: plans, subscriptions, monthly
 * invoices, numbering, payments, credit notes, overdue → suspension →
 * reopening on payment, and the client's own "Mon abonnement".
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "billing-secret";
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const PlatformInvoice = require("../models/PlatformInvoice");
const billing = require("../services/billingService");

let app;
let op;
let clientA;
let clientB;
let adminA;
let userA;
let pro;
const tok = (u) => ({ Authorization: `Bearer ${jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET)}` });
const sys = (fn) => tenantScope.runAsSystem(fn);

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/platform/billing", require("./billing"));
  app.use("/api/subscription", require("./subscription"));
  app.use("/api/auth", require("./auth"));
  await sys(async () => {
    clientA = await Tenant.create({ name: "Quincaillerie Atlas" });
    clientB = await Tenant.create({ name: "Sanitaire Bennani" });
    op = await User.create({ firstName: "Op", lastName: "P", email: "op@sanity.ma", password: "Secret@123", role: "platform_admin" });
    adminA = await User.create({ firstName: "Admin", lastName: "A", email: "admin@atlas.ma", password: "Secret@123", role: "admin", tenant: clientA._id });
    userA = await User.create({ firstName: "User", lastName: "A", email: "user@atlas.ma", password: "Secret@123", role: "user", tenant: clientA._id });
  });
});

describe("set-up", () => {
  it("only the platform operator manages billing", async () => {
    await request(app).get("/api/platform/billing/plans").set(tok(adminA)).expect(403);
  });

  it("seller identity, VAT and terms; a plan; subscriptions with negotiated price and trial", async () => {
    await request(app).put("/api/platform/billing/settings").set(tok(op)).send({
      seller: { legalName: "Sanity Software SARL", ice: "003456789000012", taxId: "51234567", rc: "RC 512345 Casablanca", address: "Bd Zerktouni", city: "Casablanca", rib: "011 780 0000123456789012 34", bankName: "BMCE" },
      vatRate: 20, paymentTermsDays: 15, graceDays: 10, autoSuspend: true,
    }).expect(200);
    const p = await request(app).post("/api/platform/billing/plans").set(tok(op)).send({ code: "pro", name: "Pro", monthlyPriceHT: 1500, yearlyPriceHT: 15000, limits: { maxCompanies: 2, maxEmployees: 50 }, features: ["Stock", "Ventes", "Paie"] });
    expect(p.status).toBe(201);
    pro = p.body.data;
    await request(app).post("/api/platform/billing/plans").set(tok(op)).send({ code: "PRO", name: "Doublon", monthlyPriceHT: 1 }).expect(409);

    const a = await request(app).put(`/api/platform/billing/subscriptions/${clientA._id}`).set(tok(op)).send({ plan: pro._id, cycle: "monthly", discountPct: 10, action: "activate", startedAt: "2026-09-01", billingEmail: "compta@atlas.ma", billing: { legalName: "Quincaillerie Atlas SARL", ice: "001122334000055", city: "Fès" } });
    expect(a.status).toBe(200);
    expect(a.body.data.limits).toEqual({ maxCompanies: 2, maxEmployees: 50 });
    const b = await request(app).put(`/api/platform/billing/subscriptions/${clientB._id}`).set(tok(op)).send({ plan: pro._id, action: "start_trial", trialDays: 30 });
    expect(b.body.data.subscription.status).toBe("trial");
    const list = await request(app).get("/api/platform/billing/subscriptions").set(tok(op)).expect(200);
    expect(list.body.data.find((t) => t.name === "Quincaillerie Atlas").cyclePriceHT).toBe(1350);
  });
});

describe("invoices", () => {
  let invoice;

  it("the month's run makes one draft per paying client (not during the trial); running it again adds nothing", async () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const r = await request(app).post("/api/platform/billing/invoices/generate").set(tok(op)).send({ period }).expect(200);
    expect(r.body.data.created.map((c) => c.tenant)).toEqual(["Quincaillerie Atlas"]);
    expect(r.body.data.created[0].totalTTC).toBe(1620); // 1,500 − 10 % = 1,350 HT + 20 % TVA
    const again = await request(app).post("/api/platform/billing/invoices/generate").set(tok(op)).send({ period }).expect(200);
    expect(again.body.data.created).toEqual([]);
    invoice = (await request(app).get("/api/platform/billing/invoices?status=draft").set(tok(op))).body.data[0];
    expect(invoice.number).toBeNull();
    expect(invoice.lines[0].label).toMatch(/^Abonnement Sanity Pro — /);
  });

  it("issuing gives the next number of the year, the due date and freezes seller and buyer", async () => {
    const r = await request(app).post(`/api/platform/billing/invoices/${invoice._id}/issue`).set(tok(op)).expect(200);
    const year = new Date().getFullYear();
    expect(r.body.data.number).toBe(`SAN-${year}-0001`);
    expect(r.body.data.seller.ice).toBe("003456789000012");
    expect(r.body.data.buyer).toMatchObject({ legalName: "Quincaillerie Atlas SARL", ice: "001122334000055" });
    expect(Math.round((new Date(r.body.data.dueDate) - new Date(r.body.data.issueDate)) / 86400000)).toBe(15);
    await request(app).post(`/api/platform/billing/invoices/${invoice._id}/issue`).set(tok(op)).expect(409);
    await request(app).delete(`/api/platform/billing/invoices/${invoice._id}`).set(tok(op)).expect(409);
    const pdf = await request(app).get(`/api/platform/billing/invoices/${invoice._id}/pdf`).set(tok(op)).buffer(true).parse((res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); });
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.body.slice(0, 4).toString()).toBe("%PDF");
  });

  it("a manual invoice (set-up fee) takes the following number", async () => {
    const m = await request(app).post("/api/platform/billing/invoices").set(tok(op)).send({ tenant: clientA._id, lines: [{ label: "Mise en service et formation", quantity: 1, unitPriceHT: 4000 }] }).expect(201);
    expect(m.body.data.totalTTC).toBe(4800);
    const r = await request(app).post(`/api/platform/billing/invoices/${m.body.data._id}/issue`).set(tok(op)).expect(200);
    expect(r.body.data.number).toBe(`SAN-${new Date().getFullYear()}-0002`);
  });

  it("overdue → past due, then suspended after the grace period; payment reopens the account", async () => {
    const later = new Date(Date.now() + 30 * 86400000); // 15 days after the due date
    const r1 = await billing.refreshStanding(clientA._id, { now: new Date(Date.now() + 20 * 86400000) });
    expect(r1).toMatchObject({ subscription: "past_due", status: "active" });
    const r2 = await billing.refreshStanding(clientA._id, { now: later });
    expect(r2).toMatchObject({ status: "suspended", subscription: "suspended" });
    const t = await sys(() => Tenant.findById(clientA._id).lean());
    expect(t.suspendedReason).toBe("unpaid");
    const login = await request(app).post("/api/auth/login").send({ email: "admin@atlas.ma", password: "Secret@123" });
    expect(login.status).toBe(403);
    expect(login.body.message).toMatch(/unpaid invoice/);

    // Pays both invoices.
    const open = (await request(app).get(`/api/platform/billing/invoices?tenant=${clientA._id}&status=issued`).set(tok(op))).body.data;
    await request(app).post(`/api/platform/billing/invoices/${open[0]._id}/payments`).set(tok(op)).send({ amount: 999999 }).expect(400);
    for (const inv of open) {
      await request(app).post(`/api/platform/billing/invoices/${inv._id}/payments`).set(tok(op)).send({ amount: inv.totalTTC, method: "virement", reference: "VIR 88123" }).expect(200);
    }
    const after = await sys(() => Tenant.findById(clientA._id).lean());
    expect(after).toMatchObject({ status: "active", suspendedReason: null });
    expect(after.subscription.status).toBe("active");
  });

  it("a manual suspension is never lifted by a payment", async () => {
    await sys(() => Tenant.updateOne({ _id: clientA._id }, { $set: { status: "suspended", suspendedReason: "manual" } }));
    await billing.refreshStanding(clientA._id);
    expect((await sys(() => Tenant.findById(clientA._id).lean())).status).toBe("suspended");
    await sys(() => Tenant.updateOne({ _id: clientA._id }, { $set: { status: "active", suspendedReason: null } }));
  });

  it("an issued, unpaid invoice is cancelled by a numbered credit note", async () => {
    const m = await request(app).post("/api/platform/billing/invoices").set(tok(op)).send({ tenant: clientA._id, lines: [{ label: "Erreur", unitPriceHT: 100 }] }).expect(201);
    await request(app).post(`/api/platform/billing/invoices/${m.body.data._id}/issue`).set(tok(op)).expect(200);
    const cn = await request(app).post(`/api/platform/billing/invoices/${m.body.data._id}/credit-note`).set(tok(op)).send({ reason: "Facturé par erreur" }).expect(200);
    expect(cn.body.data).toMatchObject({ type: "credit_note", totalTTC: -120, number: `SAN-AV-${new Date().getFullYear()}-0001` });
    const orig = await sys(() => PlatformInvoice.findById(m.body.data._id).lean());
    expect(orig.status).toBe("cancelled");
    await request(app).post(`/api/platform/billing/invoices/${m.body.data._id}/credit-note`).set(tok(op)).expect(409);
  });

  it("issuing needs the seller's legal name and ICE", async () => {
    await request(app).put("/api/platform/billing/settings").set(tok(op)).send({ seller: { ice: "" } }).expect(200);
    const m = await request(app).post("/api/platform/billing/invoices").set(tok(op)).send({ tenant: clientA._id, lines: [{ label: "X", unitPriceHT: 10 }] }).expect(201);
    const r = await request(app).post(`/api/platform/billing/invoices/${m.body.data._id}/issue`).set(tok(op)).expect(400);
    expect(r.body.message).toMatch(/ICE/);
    await request(app).delete(`/api/platform/billing/invoices/${m.body.data._id}`).set(tok(op)).expect(200);
    await request(app).put("/api/platform/billing/settings").set(tok(op)).send({ seller: { ice: "003456789000012" } }).expect(200);
  });
});

describe("Mon abonnement (client side)", () => {
  it("the client's admin sees its plan and its own invoices only; other users don't see it", async () => {
    await sys(() => PlatformInvoice.create({ tenant: clientB._id, number: "SAN-OTHER", status: "issued", lines: [], totalTTC: 1 }));
    const r = await request(app).get("/api/subscription").set(tok(adminA)).expect(200);
    expect(r.body.data.plan.code).toBe("PRO");
    expect(r.body.data.invoices.length).toBe(4); // 2 paid + cancelled + credit note — never client B's
    expect(r.body.data.invoices.some((i) => i.number === "SAN-OTHER")).toBe(false);
    expect(r.body.data.balance).toBe(0);
    await request(app).get("/api/subscription").set(tok(userA)).expect(403);
    const other = await sys(() => PlatformInvoice.findOne({ number: "SAN-OTHER" }).lean());
    await request(app).get(`/api/subscription/invoices/${other._id}/pdf`).set(tok(adminA)).expect(404);
  });
});

describe("helpers", () => {
  it("yearly plans are billed in their anniversary month only; trials are not billed", () => {
    const t = { subscription: { plan: "p", status: "active", cycle: "yearly", startedAt: new Date(2026, 2, 10) } };
    expect(billing.isDue(t, 2027, 3)).toBe(true);
    expect(billing.isDue(t, 2027, 4)).toBe(false);
    const trial = { subscription: { plan: "p", status: "trial", cycle: "monthly", trialEndsAt: new Date(2026, 11, 15), startedAt: new Date(2026, 11, 15) } };
    expect(billing.isDue(trial, 2026, 11)).toBe(false);
    expect(billing.isDue(trial, 2026, 12)).toBe(true);
    expect(billing.cyclePriceHT({ cycle: "yearly", discountPct: 0 }, { monthlyPriceHT: 1000, yearlyPriceHT: null })).toBe(12000);
  });
});

describe("Sanity price catalogue", () => {
  it("loads Essentiel / Pro / Entreprise with monthly, yearly and set-up prices, once", async () => {
    const r = await request(app).post("/api/platform/billing/plans/defaults").set(tok(op)).expect(200);
    expect(r.body.data.created.sort()).toEqual(["DROGUERIE", "DROGUERIE_PLUS", "ENTREPRISE", "ESSENTIEL"]); // PRO existed (created earlier in this file)
    expect(r.body.data.kept).toEqual(["PRO"]);
    const plans = (await request(app).get("/api/platform/billing/plans").set(tok(op))).body.data;
    const ess = plans.find((p) => p.code === "ESSENTIEL");
    expect(ess).toMatchObject({ monthlyPriceHT: 1490, yearlyPriceHT: 14900, setupFeeHT: 9900, includedUsers: 5 });
    expect(plans.find((p) => p.code === "ENTREPRISE")).toMatchObject({ monthlyPriceHT: 5990, yearlyPriceHT: 59900, setupFeeHT: 39000 });
    // Our own PRO price (1,500, set above) is not overwritten.
    expect(plans.find((p) => p.code === "PRO").monthlyPriceHT).toBe(1500);
    const again = await request(app).post("/api/platform/billing/plans/defaults").set(tok(op)).expect(200);
    expect(again.body.data.created).toEqual([]);
    const settings = (await request(app).get("/api/platform/billing/settings").set(tok(op))).body.data;
    expect(settings.addons.map((a) => a.code)).toContain("USER");
    expect(settings.priceList.terms).toMatch(/2 mois offerts/);
  });

  it("prints the price list (one A4 page)", async () => {
    const pdf = await request(app).get("/api/platform/billing/price-list.pdf").set(tok(op)).buffer(true).parse((res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); });
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-type"]).toBe("application/pdf");
    expect(pdf.body.slice(0, 4).toString()).toBe("%PDF");
    expect((pdf.body.toString("latin1").match(/\/Type \/Page\b/g) || []).length).toBe(1);
    await request(app).get("/api/platform/billing/price-list.pdf").set(tok(adminA)).expect(403);
  });

  it("a Droguerie plan switches the client to the shop edition, with its own price list", async () => {
    const plans = (await request(app).get("/api/platform/billing/plans").set(tok(op))).body.data;
    const dg = plans.find((p) => p.code === "DROGUERIE");
    expect(dg).toMatchObject({ edition: "droguerie", monthlyPriceHT: 199, yearlyPriceHT: 1990, setupFeeHT: 990 });
    await request(app).put(`/api/platform/billing/subscriptions/${clientB._id}`).set(tok(op)).send({ plan: dg._id }).expect(200);
    expect((await sys(() => Tenant.findById(clientB._id).lean())).edition).toBe("droguerie");
    const pdf = await request(app).get("/api/platform/billing/price-list.pdf?edition=droguerie").set(tok(op)).buffer(true).parse((res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); });
    expect(pdf.status).toBe(200);
    expect(pdf.headers["content-disposition"]).toMatch(/Sanity-Droguerie/);
    expect((pdf.body.toString("latin1").match(/\/Type \/Page\b/g) || []).length).toBe(1);
    // back to a Sanity plan: back to the full ERP
    await request(app).put(`/api/platform/billing/subscriptions/${clientB._id}`).set(tok(op)).send({ plan: plans.find((p) => p.code === "PRO")._id }).expect(200);
    expect((await sys(() => Tenant.findById(clientB._id).lean())).edition).toBe("sanity");
  });

  it("invoices the set-up fee once, with an optional launch discount", async () => {
    const plans = (await request(app).get("/api/platform/billing/plans").set(tok(op))).body.data;
    const ent = plans.find((p) => p.code === "ENTREPRISE");
    await request(app).put(`/api/platform/billing/subscriptions/${clientB._id}`).set(tok(op)).send({ plan: ent._id }).expect(200);
    const r = await request(app).post(`/api/platform/billing/subscriptions/${clientB._id}/setup-invoice`).set(tok(op)).send({ discountPct: 50 }).expect(201);
    expect(r.body.data.lines.map((l) => l.totalHT)).toEqual([39000, -19500]);
    expect(r.body.data).toMatchObject({ totalHT: 19500, vatAmount: 3900, totalTTC: 23400, status: "draft" });
    await request(app).post(`/api/platform/billing/subscriptions/${clientB._id}/setup-invoice`).set(tok(op)).send({}).expect(409);
  });
});
