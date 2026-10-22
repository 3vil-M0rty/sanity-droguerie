import { describe, it, expect } from "vitest";
const {
  calculatePayslip,
  computeFamilyDeduction,
  baseFromNet,
  seniorityRateForYears,
  seniorityRateFor,
  hasManualSeniority,
} = require("./payrollCalculationService");

const r2 = (n) => Math.round(n * 100) / 100;

describe("payslip calculation — 2025/2026 rules", () => {
  it("frais professionnels 25% of GROSS, capped at 2,916.67/month above 6,500 gross (CGI art. 59, LF 2023)", () => {
    const p = calculatePayslip({ baseSalary: 10000, allowances: [], deductions: [], numberOfDependents: 0 });
    expect(p.professionalExpenses).toBe(2500); // 25% × 10,000
    const high = calculatePayslip({ baseSalary: 20000, allowances: [], deductions: [], numberOfDependents: 0 });
    expect(high.professionalExpenses).toBe(2916.67);
  });

  it("35% of gross up to 78,000/year (6,500/month)", () => {
    const p = calculatePayslip({ baseSalary: 6000, allowances: [], deductions: [], numberOfDependents: 0 });
    expect(p.professionalExpenses).toBe(2100);
  });

  it("10,000 gross, no dependents: full chain", () => {
    const p = calculatePayslip({ baseSalary: 10000, allowances: [], deductions: [], numberOfDependents: 0 });
    expect(p.cnssEmployee).toBe(268.8); // 6,000 × 4.48%
    expect(p.amoEmployee).toBe(226); // 10,000 × 2.26%
    // net taxable = 10,000 − 268.80 − 226 − 2,500 = 7,005.20 → 84,062.40/yr → 30% − 18,000
    expect(p.monthlyTaxableIncome).toBe(7005.2);
    expect(p.incomeTax).toBe(601.56); // (84,062.40 × 30% − 18,000) / 12
    expect(p.netSalary).toBe(8903.64);
  });

  it("family reduction by year: 500 MAD/year per dependent in 2025, 600 from 2026 (LF 2026, CGI art. 74-I), 6 max", () => {
    expect(computeFamilyDeduction(1, 2025)).toBe(41.67);
    expect(computeFamilyDeduction(6, 2025)).toBe(250);
    expect(computeFamilyDeduction(1, 2026)).toBe(50);
    expect(computeFamilyDeduction(6, 2026)).toBe(300);
    expect(computeFamilyDeduction(9, 2026)).toBe(300);
    expect(computeFamilyDeduction(2, 2027)).toBe(100); // latest known figure carries on
    const p = calculatePayslip({ baseSalary: 10000, numberOfDependents: 3, year: 2026 });
    expect(p.incomeTax).toBe(r2(601.56 - 150));
    expect(p.netSalary).toBe(r2(8903.64 + 150));
  });

  it("prime d'ancienneté (art. 350): 5/10/15/20/25% at 2/5/12/20/25 years, on the base salary", () => {
    expect([0, 1, 2, 4, 5, 11, 12, 19, 20, 24, 25, 40].map(seniorityRateForYears)).toEqual([0, 0, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.2, 0.2, 0.25, 0.25]);
    expect(seniorityRateFor(new Date(2021, 2, 15), new Date(2026, 2, 14))).toBe(0.05); // 5 years the next day
    expect(seniorityRateFor(new Date(2021, 2, 15), new Date(2026, 2, 15))).toBe(0.1);
    const p = calculatePayslip({ baseSalary: 8000, seniorityRate: 0.1, year: 2026 });
    expect(p.seniorityAmount).toBe(800);
    expect(p.grossSalary).toBe(8800);
    expect(p.taxableGross).toBe(8800);
    expect(p.amoEmployee).toBe(r2(8800 * 0.0226));
    expect(hasManualSeniority([{ label: "Prime d'ancienneté", amount: 400 }])).toBe(true);
  });

  it("exempt allowances: out of CNSS/AMO/IR within the legal limit, the excess is taxed", () => {
    const p = calculatePayslip({
      baseSalary: 6000,
      year: 2026,
      allowances: [
        { label: "Transport", amount: 700, kind: "transport" }, // 500 exempt, 200 taxable
        { label: "Représentation", amount: 400, kind: "representation" }, // 10% of 6,000 = 600 → all exempt
        { label: "Prime de rendement", amount: 300 }, // taxable
      ],
    });
    expect(p.allowances.map((a) => a.exemptAmount)).toEqual([500, 400, 0]);
    expect(p.grossSalary).toBe(7400);
    expect(p.exemptAllowanceTotal).toBe(900);
    expect(p.taxableGross).toBe(6500);
    expect(p.amoEmployee).toBe(r2(6500 * 0.0226));
    expect(p.professionalExpenses).toBe(2275); // 35%: brut imposable 6,500 ≤ 78,000/yr
    // net = global gross − contributions − IR: the exempt part is paid in full
    expect(p.netSalary).toBe(r2(7400 - p.cnssEmployee - p.amoEmployee - p.incomeTax));
  });

  it("panier: exempt up to 2 × hourly SMIG per worked day", () => {
    const p = calculatePayslip({ baseSalary: 5000, allowances: [{ label: "Panier", amount: 1000, kind: "panier" }], workedDays: 26 });
    expect(p.allowances[0].exemptAmount).toBe(r2(2 * 17.92 * 26)); // 931.84
    expect(p.taxableGross).toBe(r2(5000 + 1000 - 931.84));
  });
});

describe("net → base (calcul à l'envers)", () => {
  const cases = [
    { targetNet: 3200 },
    { targetNet: 6000 },
    { targetNet: 6020 }, // in the dip just above 6,500 gross (frais pro 35% → 25%)
    { targetNet: 8000, numberOfDependents: 2, year: 2026 },
    { targetNet: 15000, seniorityRate: 0.15, numberOfDependents: 4, year: 2026 },
    { targetNet: 9000, seniorityRate: 0.05, allowances: [{ label: "Transport", amount: 500, kind: "transport" }, { label: "Panier", amount: 600, kind: "panier" }, { label: "Prime", amount: 250 }] },
    { targetNet: 40000, year: 2026 },
    { targetNet: 7000, seniorityRate: 0.05, numberOfDependents: 3, allowances: [{ label: "Transport", amount: 500, kind: "transport" }, { label: "Panier", amount: 400, kind: "panier" }] },
    { targetNet: 30000, seniorityRate: 0.25, allowances: [{ label: "Représentation", amount: 5000, kind: "representation" }] },
  ];
  for (const c of cases) {
    it(`finds the smallest base paying ${c.targetNet} net`, () => {
      const { baseSalary, payslip } = baseFromNet(c);
      const { targetNet, ...input } = c;
      // The payslip with this base (same engine) pays at least the target…
      expect(calculatePayslip({ ...input, baseSalary }).netSalary).toBe(payslip.netSalary);
      expect(payslip.netSalary).toBeGreaterThanOrEqual(targetNet);
      expect(payslip.netSalary - targetNet).toBeLessThan(0.02);
      // …and one cent less does not.
      expect(calculatePayslip({ ...input, baseSalary: r2(baseSalary - 0.01) }).netSalary).toBeLessThan(targetNet);
    });
  }

  it("round trip base → net → base", () => {
    for (const base of [3422.72, 5000, 6500, 6500.01, 7250.5, 12000, 33333.33]) {
      const net = calculatePayslip({ baseSalary: base, numberOfDependents: 1, year: 2026 }).netSalary;
      const back = baseFromNet({ targetNet: net, numberOfDependents: 1, year: 2026 }).baseSalary;
      expect(calculatePayslip({ baseSalary: back, numberOfDependents: 1, year: 2026 }).netSalary).toBe(net);
      expect(back).toBeLessThanOrEqual(base);
    }
  });
});
