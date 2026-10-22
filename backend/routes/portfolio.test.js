import { describe, it, expect, beforeAll } from "vitest";

/** Cheques & LCN: portfolio, deposit slips, cleared, unpaid (invoice reopens), accounting. */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "portfolio-secret";

const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const PaymentInstrument = require("../models/PaymentInstrument");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
const binary = (res, cb) => { const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => cb(null, Buffer.concat(c))); };
const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const inDays = (n) => new Date(Date.now() + n * 86400000);

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/portfolio", require("./portfolio"));
  app.use("/api/sales-invoices", require("./salesInvoices"));
  app.use("/api/accounting", require("./accounting"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "store", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
}, 120000);

async function openInvoice(skip = 0) {
  return tenantScope.runAsSystem(() => SalesInvoice.find({ company: demo.company._id, type: "invoice", status: "issued" }).sort({ date: -1 }).skip(skip).limit(1).lean().then((x) => x[0]));
}
const pay = (inv, body) => request(app).post(`/api/sales-invoices/${inv._id}/payments`).set(h("admin")).send(body);

describe("portfolio", () => {
  let chequeId;
  let invoice;
  it("a cheque payment enters the portfolio with its due date", async () => {
    invoice = await openInvoice();
    const r = await pay(invoice, { amount: 1000, method: "cheque", reference: "CHQ-4471", dueDate: ymd(inDays(10)), bank: "Attijariwafa", drawer: "Benali SARL" });
    expect(r.status).toBe(201);
    const list = await request(app).get(`/api/portfolio?companyId=${demo.company._id}&search=CHQ-4471`).set(h("admin"));
    expect(list.status).toBe(200);
    const row = list.body.data.rows[0];
    expect(row).toMatchObject({ kind: "cheque", number: "CHQ-4471", bank: "Attijariwafa", status: "in_portfolio", amount: 1000, invoiceNumber: invoice.number });
    expect(list.body.data.summary.inPortfolio.count).toBeGreaterThanOrEqual(1);
    chequeId = row._id;
  });

  it("refuses to deposit a cheque before its date, then deposits it with a slip", async () => {
    const early = await request(app).post("/api/portfolio/deposits").set(h("admin")).send({ companyId: demo.company._id, instruments: [chequeId] });
    expect(early.status).toBe(400);
    expect(early.body.message).toMatch(/can't be deposited before/);
    const r = await request(app).post("/api/portfolio/deposits").set(h("admin")).send({ companyId: demo.company._id, instruments: [chequeId], date: ymd(inDays(10)), bankAccount: "BMCE — compte courant" });
    expect(r.status).toBe(201);
    expect(r.body.data).toMatchObject({ kind: "cheque", count: 1, total: 1000 });
    expect(r.body.data.number).toMatch(/^BR-\d{4}-\d+$/);
    const pdf = await request(app).get(`/api/portfolio/deposits/${r.body.data._id}/pdf`).set(h("admin")).buffer(true).parse(binary);
    expect(pdf.body.slice(0, 4).toString()).toBe("%PDF");
    // already at the bank: the payment can't just be deleted any more
    const ins = await tenantScope.runAsSystem(() => PaymentInstrument.findById(chequeId).lean());
    const del = await request(app).delete(`/api/sales-invoices/${invoice._id}/payments/${ins.paymentId}`).set(h("admin"));
    expect(del.status).toBe(400);
    expect(del.body.message).toMatch(/unpaid instead/);
  });

  it("unpaid: the invoice reopens, the customer can be blocked, the accountant gets both entries", async () => {
    const before = await tenantScope.runAsSystem(() => SalesInvoice.findById(invoice._id).lean());
    const r = await request(app).post(`/api/portfolio/${chequeId}/unpaid`).set(h("admin")).send({ reason: "Provision insuffisante", fees: 50, block: true });
    expect(r.status).toBe(200);
    expect(r.body.data.status).toBe("unpaid");
    const after = await tenantScope.runAsSystem(() => SalesInvoice.findById(invoice._id).lean());
    expect(after.amountPaid).toBeCloseTo(before.amountPaid - 1000, 2);
    expect(after.payments.some((p) => p.reference === "CHQ-4471")).toBe(false);
    const c = await tenantScope.runAsSystem(() => Customer.findById(invoice.customer).lean());
    expect(c.blocked).toBe(true);
    expect(c.blockedReason).toMatch(/Chèque impayé CHQ-4471/);
    const j = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&from=${ymd(inDays(-1))}&to=${ymd(inDays(1))}`).set(h("admin"));
    const unpaid = j.body.data.entries.find((e) => /Impayé Chèque CHQ-4471/.test(e.label));
    expect(unpaid.lines[0]).toMatchObject({ account: "3421", debit: 1000 });
    expect(j.body.data.entries.some((e) => /Règlement .* CHQ-4471/.test(e.label) && e.lines[0].account === "5111")).toBe(true);
    await request(app).post(`/api/portfolio/${chequeId}/unpaid`).set(h("admin")).send({}).expect(400);
  });

  it("LCN to discount, cleared by slip; no mixing cheques and LCN", async () => {
    const inv = await openInvoice(1);
    await pay(inv, { amount: 500, method: "effet", reference: "LCN-0091", dueDate: ymd(inDays(60)), bank: "CIH" }).expect(201);
    await pay(inv, { amount: 200, method: "cheque", reference: "CHQ-0001", dueDate: ymd(inDays(-1)) }).expect(201);
    const rows = (await request(app).get(`/api/portfolio?companyId=${demo.company._id}&status=in_portfolio`).set(h("admin"))).body.data.rows;
    const lcn = rows.find((x) => x.number === "LCN-0091");
    const chq = rows.find((x) => x.number === "CHQ-0001");
    await request(app).post("/api/portfolio/deposits").set(h("admin")).send({ companyId: demo.company._id, instruments: [lcn._id, chq._id] }).expect(400);
    await request(app).post("/api/portfolio/deposits").set(h("admin")).send({ companyId: demo.company._id, instruments: [chq._id], mode: "escompte" }).expect(400);
    const slip = await request(app).post("/api/portfolio/deposits").set(h("admin")).send({ companyId: demo.company._id, instruments: [lcn._id], mode: "escompte" });
    expect(slip.body.data.mode).toBe("escompte");
    const cl = await request(app).post(`/api/portfolio/deposits/${slip.body.data._id}/clear`).set(h("admin")).send({});
    expect(cl.body.data.cleared).toBe(1);
    const j = await request(app).get(`/api/accounting/journal?companyId=${demo.company._id}&from=${ymd(inDays(-1))}&to=${ymd(inDays(1))}`).set(h("admin"));
    const e = j.body.data.entries.find((x) => /Encaissement LCN LCN-0091/.test(x.label));
    expect(e.lines.map((l) => l.account)).toEqual(["5141", "5111"]);
  });

  it("permissions: storekeeper refused, rep sees only their customers", async () => {
    await request(app).get(`/api/portfolio?companyId=${demo.company._id}`).set(h("store")).expect(403);
    const mine = await request(app).get(`/api/portfolio?companyId=${demo.company._id}`).set(h("rep1"));
    if (mine.status === 200) {
      const ids = new Set((await tenantScope.runAsSystem(() => Customer.find({ salesRep: demo.users.rep1._id }).select("_id").lean())).map((c) => String(c._id)));
      expect(mine.body.data.rows.every((r) => ids.has(String(r.customer._id)))).toBe(true);
    } else {
      expect(mine.status).toBe(403);
    }
  });
});
