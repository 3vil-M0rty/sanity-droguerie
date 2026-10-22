import { describe, it, expect, beforeAll } from "vitest";

/**
 * Monthly variable bonuses (primes du mois), the sales commissions
 * import, and the one-off bonus calculation (gross ↔ net).
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "payroll-bonus-secret";
const Employee = require("../models/Employee");
const Payslip = require("../models/Payslip");
const User = require("../models/User");
const calc = require("../services/payrollCalculationService");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
let omar;
let karim;
let runId;
const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();
const period = `${year}-${String(month).padStart(2, "0")}`;

const slipOf = (employee) => tenantScope.runAsSystem(() => Payslip.findOne({ payrollRun: runId, employee: employee._id }).lean());

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/payroll", require("./payroll"));
  app.use("/api/salaries", require("./salaries"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
  await tenantScope.runAsSystem(async () => {
    omar = await Employee.findOne({ company: demo.company._id, employeeNumber: "EMP-006" });
    karim = await Employee.findOne({ company: demo.company._id, employeeNumber: "EMP-003" });
  });
}, 120000);

describe("primes du mois", () => {
  it("a bonus entered before the run lands on that month's payslip only, with CNSS, AMO and IR", async () => {
    const r = await request(app).post("/api/payroll/bonuses").set(h("admin")).send({ company: demo.company._id, employee: omar._id, month, year, label: "Prime de l'Aïd", amount: 1000 });
    expect(r.status).toBe(201);
    const run = await request(app).post("/api/payroll/runs").set(h("admin")).send({ company: demo.company._id, month, year });
    expect(run.status).toBe(201);
    runId = run.body.data._id;
    const slip = await slipOf(omar);
    expect(slip.allowances.map((a) => [a.label, a.amount])).toContainEqual(["Prime de l'Aïd", 1000]);
    const without = calc.calculatePayslip({ baseSalary: 4500, year, seniorityRate: slip.seniorityRate, workedDays: slip.declaredDays ?? 26 });
    expect(slip.grossSalary).toBe(Math.round((without.grossSalary + 1000) * 100) / 100);
    expect(slip.netSalary).toBeLessThan(without.netSalary + 1000);
    expect(slip.netSalary).toBeGreaterThan(without.netSalary + 700);
  });

  it("changing or deleting a bonus recomputes the draft run at once", async () => {
    const list = await request(app).get(`/api/payroll/bonuses?companyId=${demo.company._id}&month=${month}&year=${year}`).set(h("admin")).expect(200);
    expect(list.body.locked).toBe(false);
    const id = list.body.data[0]._id;
    await request(app).put(`/api/payroll/bonuses/${id}`).set(h("admin")).send({ amount: 1500 }).expect(200);
    expect((await slipOf(omar)).allowances.find((a) => a.label === "Prime de l'Aïd").amount).toBe(1500);
    await request(app).delete(`/api/payroll/bonuses/${id}`).set(h("admin")).expect(200);
    expect((await slipOf(omar)).allowances.find((a) => a.label === "Prime de l'Aïd")).toBeUndefined();
  });

  it("imports the reps' commissions of the month as taxable bonuses; re-import replaces them", async () => {
    const perf = await tenantScope.runAsSystem(() => require("../services/salesRepService").performance(demo.company._id, period));
    const karimRow = perf.rows.find((r) => String(r.rep._id) === String(demo.users.rep1._id));
    const r = await request(app).post("/api/payroll/bonuses/import-commissions").set(h("admin")).send({ company: demo.company._id, month, year });
    expect(r.status).toBe(200);
    const mine = r.body.data.imported.find((b) => String(b.employee) === String(karim._id));
    if (karimRow.commission > 0) {
      expect(mine.amount).toBe(karimRow.commission);
      expect(mine.details).toMatchObject({ salesPeriod: period, rate: karimRow.commissionRate });
      const slip = await slipOf(karim);
      expect(slip.allowances.find((a) => a.label === `Commission ${String(month).padStart(2, "0")}/${year}`).amount).toBe(karimRow.commission);
    } else {
      expect(mine).toBeUndefined();
    }
    await request(app).post("/api/payroll/bonuses/import-commissions").set(h("admin")).send({ company: demo.company._id, month, year }).expect(200);
    const list = await request(app).get(`/api/payroll/bonuses?companyId=${demo.company._id}&month=${month}&year=${year}`).set(h("admin")).expect(200);
    const karimLines = list.body.data.filter((b) => String(b.employee._id) === String(karim._id) && b.source === "commission");
    expect(karimLines.length).toBe(karimRow.commission > 0 ? 1 : 0);
  });

  it("a rep whose login has no employee file is reported, not lost", async () => {
    await tenantScope.runAsSystem(() => User.updateOne({ _id: demo.users.rep2._id }, { $unset: { employee: 1 } }));
    const perf = await tenantScope.runAsSystem(() => require("../services/salesRepService").performance(demo.company._id, period));
    const leila = perf.rows.find((r) => String(r.rep._id) === String(demo.users.rep2._id));
    const r = await request(app).post("/api/payroll/bonuses/import-commissions").set(h("admin")).send({ company: demo.company._id, month, year }).expect(200);
    if (leila.commission > 0) expect(r.body.data.skipped.map((s) => s.reason)).toContain("no_employee");
  });

  it("a completed month is locked; bad input and missing permission are refused", async () => {
    await request(app).post("/api/payroll/bonuses").set(h("admin")).send({ company: demo.company._id, employee: omar._id, month, year, label: "X", amount: -5 }).expect(400);
    await request(app).post("/api/payroll/bonuses").set(h("admin")).send({ company: demo.company._id, employee: omar._id, month: 13, year, label: "X", amount: 5 }).expect(400);
    await request(app).post("/api/payroll/bonuses").set(h("rep1")).send({ company: demo.company._id, employee: omar._id, month, year, label: "X", amount: 5 }).expect(403);
    await request(app).post(`/api/payroll/runs/${runId}/complete`).set(h("admin")).expect(200);
    await request(app).post("/api/payroll/bonuses").set(h("admin")).send({ company: demo.company._id, employee: omar._id, month, year, label: "Trop tard", amount: 100 }).expect(409);
    const list = await request(app).get(`/api/payroll/bonuses?companyId=${demo.company._id}&month=${month}&year=${year}`).set(h("admin")).expect(200);
    expect(list.body.locked).toBe(true);
    for (const b of list.body.data) await request(app).delete(`/api/payroll/bonuses/${b._id}`).set(h("admin")).expect(409);
  });
});

describe("prime exceptionnelle in the calculator", () => {
  it("gross → what the employee receives (payslip with − without)", async () => {
    const r = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "base", amount: 8000, seniorityYears: 0, numberOfDependents: 2, year: 2026, bonus: { amount: 5000, mode: "gross" } });
    expect(r.status).toBe(200);
    const b = r.body.data.bonus;
    const without = calc.calculatePayslip({ baseSalary: 8000, numberOfDependents: 2, year: 2026 });
    const withBonus = calc.calculatePayslip({ baseSalary: 8000, numberOfDependents: 2, year: 2026, allowances: [{ label: "Prime", amount: 5000 }] });
    expect(b.gross).toBe(5000);
    expect(b.net).toBe(Math.round((withBonus.netSalary - without.netSalary) * 100) / 100);
    expect(b.cnss).toBe(0); // already above the 6,000 CNSS ceiling
    expect(b.amo).toBe(113);
    expect(b.monthNet).toBe(withBonus.netSalary);
  });

  it("net wanted → gross bonus to pay (smallest, to the cent)", async () => {
    const r = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "base", amount: 8000, seniorityYears: 0, numberOfDependents: 2, year: 2026, bonus: { amount: 3000, mode: "net" } });
    const b = r.body.data.bonus;
    expect(b.net).toBeGreaterThanOrEqual(3000);
    expect(b.net).toBeLessThan(3000.02);
    const less = calc.bonusEffect({ baseSalary: 8000, numberOfDependents: 2, year: 2026, bonusGross: Math.round((b.gross - 0.01) * 100) / 100 });
    expect(less.net).toBeLessThan(3000);
  });
});
