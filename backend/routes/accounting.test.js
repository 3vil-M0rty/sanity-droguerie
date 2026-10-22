import { describe, it, expect, beforeAll } from "vitest";

/**
 * Accounting export, VAT summary and e-invoicing on the demo wholesaler
 * (a year of invoices, payments, counter tickets and purchases).
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "accounting-secret";

const Company = require("../models/Company");
const Customer = require("../models/Customer");
const SalesInvoice = require("../models/SalesInvoice");
const { validateForEInvoice } = require("../utils/ublInvoice");

let app;
let admin;
let store;
let demo;
const h = (t) => ({ Authorization: `Bearer ${t}` });

/** Minimal well-formedness check: every opened tag is closed in order. */
function wellFormed(xml) {
  const stack = [];
  const re = /<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g;
  let m;
  while ((m = re.exec(xml.replace(/<\?xml[^>]*\?>/, "")))) {
    if (m[3] === "/") continue;
    if (m[1] === "/") { if (stack.pop() !== m[2]) return false; } else stack.push(m[2]);
  }
  return stack.length === 0;
}

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/accounting", require("./accounting"));
  app.use("/api/sales-invoices", require("./salesInvoices"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  admin = jwt.sign({ id: String(demo.users.admin._id) }, process.env.JWT_SECRET);
  store = jwt.sign({ id: String(demo.users.store._id) }, process.env.JWT_SECRET);
}, 120000);

const year = () => {
  const to = new Date();
  const from = new Date(to.getFullYear() - 1, to.getMonth(), 1);
  return `from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`;
};

describe("journal entries", () => {
  it("balances every entry and covers sales, counter, receipts and purchases", async () => {
    const r = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&${year()}`).set(h(admin));
    expect(r.status).toBe(200);
    const { entries, totals } = r.body.data;
    expect(entries.length).toBeGreaterThan(100);
    for (const e of entries) {
      const d = e.lines.reduce((s, l) => s + l.debit, 0);
      const c = e.lines.reduce((s, l) => s + l.credit, 0);
      expect(Math.abs(d - c)).toBeLessThan(0.005);
    }
    expect(totals.debit).toBeCloseTo(totals.credit, 2);
    const journals = new Set(entries.map((e) => e.journal));
    expect([...journals]).toEqual(expect.arrayContaining(["VT", "BQ"]));
    const inv = entries.find((e) => e.journal === "VT" && /^FA-/.test(e.piece));
    expect(inv.lines[0]).toMatchObject({ account: "3421" });
    expect(inv.lines.some((l) => l.account === "7111")).toBe(true);
    expect(inv.lines.some((l) => l.account === "4455")).toBe(true);
    expect(entries.some((e) => /^TK-/.test(e.piece) && e.lines.some((l) => l.account === "5161"))).toBe(true);
  });

  it("exports CSV / Sage, and only with the export permission", async () => {
    const csv = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&${year()}&format=csv`).set(h(admin));
    expect(csv.headers["content-type"]).toMatch(/text\/csv/);
    expect(csv.text.split("\r\n")[0]).toBe("﻿Journal;Date;Pièce;Compte;Tiers;Libellé;Débit;Crédit");
    expect(csv.text).toMatch(/;3421;CL-\d{4};/);
    const sage = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&${year()}&format=sage`).set(h(admin));
    expect(sage.text.split("\r\n")[0]).toMatch(/^﻿VT;\d{6};/);
    await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&${year()}`).set(h(store)).expect(403);
  });

  it("uses the accountant's own accounts", async () => {
    await request(app).put(`/api/accounting/settings?companyId=${demo.company._id}`).set(h(admin))
      .send({ accounting: { customers: "34210000", sales: "71110000", journals: { sales: "VE" }, salesByRate: { 7: "71110007" } } }).expect(200);
    const r = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&${year()}`).set(h(admin));
    const e = r.body.data.entries.find((x) => x.journal === "VE" && /^FA-/.test(x.piece));
    expect(e.lines[0].account).toBe("34210000");
    await request(app).put(`/api/accounting/settings?companyId=${demo.company._id}`).set(h(admin)).send({ accounting: { customers: "bad account!" } }).expect(400);
  });
});

describe("VAT summary", () => {
  it("gives collected, deductible and net for both regimes", async () => {
    const r = await request(app).get(`/api/accounting/vat?companyId=${demo.company._id}&${year()}`).set(h(admin));
    expect(r.status).toBe(200);
    const { regimes, counter } = r.body.data;
    expect(regimes.encaissement.totalCollected).toBeGreaterThan(0);
    expect(regimes.debit.totalCollected).toBeGreaterThan(0);
    expect(counter.totalVAT).toBeGreaterThan(0);
    for (const k of ["encaissement", "debit"]) {
      const x = regimes[k];
      expect(x.net).toBeCloseTo(x.totalCollected - x.totalDeductible, 2);
      expect(x.collected.every((row) => [0, 7, 10, 14, 20].includes(row.rate))).toBe(true);
    }
    const xlsx = await request(app).get(`/api/accounting/vat?companyId=${demo.company._id}&${year()}&format=xlsx`).set(h(admin)).buffer(true);
    expect(xlsx.headers["content-type"]).toMatch(/spreadsheetml/);
  });
});

describe("e-invoicing", () => {
  let invoiceId;
  it("refuses an invoice that misses legal identifiers, saying what to fix", async () => {
    const inv = await tenantScope.runAsSystem(() => SalesInvoice.findOne({ company: demo.company._id, status: "paid", type: "invoice" }).lean());
    invoiceId = String(inv._id);
    await tenantScope.runAsSystem(() => Company.updateOne({ _id: demo.company._id }, { $unset: { taxId: 1, registrationNumber: 1 } }));
    const r = await request(app).post(`/api/sales-invoices/${invoiceId}/einvoice`).set(h(admin)).send({});
    expect(r.status).toBe(400);
    expect(r.body.check.errors.join(" ")).toMatch(/Identifiant fiscal/);
    expect(r.body.check.errors.join(" ")).toMatch(/Registre de commerce/);
  });

  it("builds a well-formed UBL invoice and gets it cleared (simulation)", async () => {
    await tenantScope.runAsSystem(async () => {
      await Company.updateOne({ _id: demo.company._id }, { $set: { ice: "001534000000099", taxId: "40123456", registrationNumber: "RC 123456", professionalTaxNumber: "35123456", "address.city": "Casablanca" } });
      const inv = await SalesInvoice.findById(invoiceId).lean();
      await Customer.updateOne({ _id: inv.customer }, { $set: { ice: "001534000000012" } });
    });
    const ubl = await request(app).get(`/api/sales-invoices/${invoiceId}/ubl`).set(h(admin));
    expect(ubl.status).toBe(200);
    expect(ubl.headers["content-type"]).toMatch(/application\/xml/);
    expect(wellFormed(ubl.text)).toBe(true);
    expect(ubl.text).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(ubl.text).toContain('<cbc:ID schemeID="ICE">001534000000099</cbc:ID>');
    expect(ubl.text).toContain('<cbc:ID schemeID="ICE">001534000000012</cbc:ID>');
    expect(ubl.text).toMatch(/<cbc:PayableAmount currencyID="MAD">[\d.]+<\/cbc:PayableAmount>/);

    const r = await request(app).post(`/api/sales-invoices/${invoiceId}/einvoice`).set(h(admin)).send({});
    expect(r.status).toBe(200);
    expect(r.body.data.einvoice).toMatchObject({ status: "accepted", provider: "simulation" });
    expect(r.body.data.einvoice.reference).toMatch(/^SIM-\d{4}-[0-9A-F]{12}$/);
    expect(r.body.data.einvoice.xmlHash).toMatch(/^[0-9a-f]{64}$/);
    // already accepted
    await request(app).post(`/api/sales-invoices/${invoiceId}/einvoice`).set(h(admin)).send({}).expect(400);
    // a storekeeper can't submit
    await request(app).post(`/api/sales-invoices/${invoiceId}/einvoice`).set(h(store)).send({}).expect(403);
  });

  it("checks B2B buyers' ICE and the legal VAT rates", () => {
    const company = { name: "X", ice: "001534000000099", taxId: "1", registrationNumber: "2", address: { city: "Casa" } };
    const res = validateForEInvoice({ number: "FA-1", lines: [{ quantity: 1, vatRate: 18 }] }, company, { name: "Client", type: "reseller", kind: "company" });
    expect(res.ok).toBe(false);
    expect(res.errors.join(" ")).toMatch(/ICE du client/);
    expect(res.errors.join(" ")).toMatch(/18 %/);
    expect(validateForEInvoice({ number: "FA-2", lines: [{ quantity: 1, vatRate: 20 }] }, company, { name: "Mme Alami", type: "walk_in", kind: "individual" }).ok).toBe(true);
  });
});
