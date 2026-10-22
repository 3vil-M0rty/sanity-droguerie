import { describe, it, expect, beforeAll } from "vitest";

/**
 * Net ↔ base salary calculator: the base it finds for a negotiated
 * net, once saved, makes the monthly payroll run pay exactly that net.
 */
const tenantScope = require("../services/tenantScope");
const fake = require("../test/fakeMongo");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "salary-sim-secret";
const Employee = require("../models/Employee");
const Payslip = require("../models/Payslip");

let app;
let demo;
const tok = {};
const h = (w) => ({ Authorization: `Bearer ${tok[w]}` });
let youssef;
let fatima;

// A month with no attendance yet (no overtime / lateness / absence).
const now = new Date();
const runMonth = ((now.getMonth() + 1) % 12) + 1;
const runYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

beforeAll(async () => {
  fake.connect();
  app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  app.use("/api/salaries", require("./salaries"));
  app.use("/api/payroll", require("./payroll"));
  demo = await tenantScope.runAsSystem(() => require("../scripts/seedSanity").seedSanityClient({ log: () => {} }));
  for (const k of ["admin", "rep1"]) tok[k] = jwt.sign({ id: String(demo.users[k]._id) }, process.env.JWT_SECRET);
  await tenantScope.runAsSystem(async () => {
    youssef = await Employee.findOne({ company: demo.company._id, employeeNumber: "EMP-008" });
    fatima = await Employee.findOne({ company: demo.company._id, employeeNumber: "EMP-012" });
    await Employee.updateOne({ _id: youssef._id }, { numberOfDependents: 3 });
  });
}, 120000);

describe("salary calculator", () => {
  it("base → net: full payslip with CNSS, AMO, frais pro, IR, family deduction", async () => {
    const r = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "base", amount: 10000, seniorityYears: 0, numberOfDependents: 0, year: 2026 });
    expect(r.status).toBe(200);
    const p = r.body.data.payslip;
    expect(p).toMatchObject({ grossSalary: 10000, cnssEmployee: 268.8, amoEmployee: 226, professionalExpenses: 2500, monthlyTaxableIncome: 7005.2, incomeTax: 601.56, netSalary: 8903.64 });
  });

  it("seniority comes from the hire date (≥ 2 years → 5%)", async () => {
    const r = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "base", amount: 14000, employeeId: fatima._id });
    expect(r.status).toBe(200);
    expect(r.body.data.seniorityYears).toBe(2);
    expect(r.body.data.payslip.seniorityAmount).toBe(700);
  });

  it("net → base, saved, then the payroll run pays exactly that net", async () => {
    const allowances = [{ label: "Transport", amount: 500, kind: "transport" }, { label: "Panier", amount: 400, kind: "panier" }];
    const sim = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "net", amount: 7000, employeeId: youssef._id, allowances, asOf: new Date(runYear, runMonth - 1, 1) });
    expect(sim.status).toBe(200);
    const { baseSalary, payslip } = sim.body.data;
    expect(payslip.netSalary).toBeGreaterThanOrEqual(7000);
    expect(payslip.netSalary).toBeLessThan(7000.02);
    expect(payslip.familyDeduction).toBe(runYear >= 2026 ? 150 : 125); // 3 dependents
    expect(payslip.exemptAllowanceTotal).toBe(900);

    await request(app).post("/api/salaries").set(h("admin")).send({ company: demo.company._id, employee: youssef._id, baseSalary, allowances, effectiveDate: new Date().toISOString().slice(0, 10) }).expect(201);
    const list = await request(app).get(`/api/salaries?companyId=${demo.company._id}&employeeId=${youssef._id}&current=true`).set(h("admin")).expect(200);
    // The list shows this month's payslip (seniority as of today).
    const today = await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "base", amount: baseSalary, employeeId: youssef._id, allowances });
    expect(list.body.data[0].payroll.netSalary).toBe(today.body.data.payslip.netSalary);
    expect(list.body.data[0].allowances.map((a) => a.kind)).toEqual(["transport", "panier"]);

    const run = await request(app).post("/api/payroll/runs").set(h("admin")).send({ company: demo.company._id, month: runMonth, year: runYear });
    expect(run.status).toBe(201);
    const slip = await tenantScope.runAsSystem(() => Payslip.findOne({ payrollRun: run.body.data._id, employee: youssef._id }).lean());
    expect(slip.netSalary).toBe(payslip.netSalary);
    expect(slip.baseSalary).toBe(baseSalary);
    expect(slip.taxableGross).toBe(payslip.taxableGross);
    expect(slip.exemptAllowanceTotal).toBe(900);
    const fatimaSlip = await tenantScope.runAsSystem(() => Payslip.findOne({ payrollRun: run.body.data._id, employee: fatima._id }).lean());
    expect(fatimaSlip.seniorityRate).toBe(0.05);
    expect(fatimaSlip.seniorityAmount).toBe(700);
  });

  it("checks its input and needs the HR salary permission", async () => {
    await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "gross", amount: 5000 }).expect(400);
    await request(app).post("/api/salaries/simulate").set(h("admin")).send({ mode: "net", amount: -1 }).expect(400);
    await request(app).post("/api/salaries/simulate").set(h("rep1")).send({ mode: "net", amount: 5000 }).expect(403);
  });
});
