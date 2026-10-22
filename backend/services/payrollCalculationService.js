const payrollConfig = require("../config/payrollConfig");

/**
 * ============================================================
 * PAYROLL CALCULATION SERVICE
 * ============================================================
 * Pure functions — no database access, no side effects. Given a
 * gross salary and a few employee-specific inputs, returns every
 * line of a Moroccan payslip. See config/payrollConfig.js for the
 * rates/brackets this reads from (and the disclaimer about keeping
 * them current).
 * ============================================================
 */

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Sum of a Salary record's allowances/deductions line-item arrays.
 */
function sumLineItems(items = []) {
  return (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Computes the monthly CNSS employee contribution: rate × salary,
 * capped at the monthly ceiling.
 */
function computeCNSSEmployee(grossSalary) {
  const base = Math.min(grossSalary, payrollConfig.CNSS.MONTHLY_CEILING);
  return round2(base * payrollConfig.CNSS.EMPLOYEE_RATE);
}

/**
 * Employer-side CNSS cost — three sub-branches, since two of them
 * (long-term, short-term) are capped at the monthly ceiling while
 * family allowances are not. See config/payrollConfig.js for what
 * each one represents.
 */
function computeCNSSEmployer(grossSalary) {
  const cappedBase = Math.min(grossSalary, payrollConfig.CNSS.MONTHLY_CEILING);

  const longTerm = cappedBase * payrollConfig.CNSS.EMPLOYER_RATE_LONG_TERM;
  const shortTerm = cappedBase * payrollConfig.CNSS.EMPLOYER_RATE_SHORT_TERM;
  const familyAllowance =
    grossSalary * payrollConfig.CNSS.EMPLOYER_RATE_FAMILY_ALLOWANCE;

  return round2(longTerm + shortTerm + familyAllowance);
}

function computeVocationalTraining(grossSalary) {
  return round2(
    grossSalary * payrollConfig.CNSS.EMPLOYER_VOCATIONAL_TRAINING_RATE
  );
}

/**
 * AMO has no ceiling — applied to the full gross salary.
 */
function computeAMOEmployee(grossSalary) {
  return round2(grossSalary * payrollConfig.AMO.EMPLOYEE_RATE);
}

function computeAMOEmployer(grossSalary) {
  const base =
    payrollConfig.AMO.EMPLOYER_RATE +
    payrollConfig.AMO.EMPLOYER_SOLIDARITY_CONTRIBUTION_RATE;
  return round2(grossSalary * base);
}

function computeCIMR(grossSalary, employeeRate, employerRate) {
  const empRate = employeeRate ?? payrollConfig.CIMR.DEFAULT_EMPLOYEE_RATE;
  const erRate = employerRate ?? payrollConfig.CIMR.DEFAULT_EMPLOYER_RATE;

  return {
    employee: round2(grossSalary * empRate),
    employer: round2(grossSalary * erRate),
  };
}

/**
 * Professional-expenses deduction: a flat % of the salary that's
 * left after CNSS/AMO/CIMR, capped at a monthly ceiling.
 */
function computeProfessionalExpenses(grossTaxable) {
  const fp = payrollConfig.PROFESSIONAL_EXPENSES;
  if (grossTaxable <= 0) return 0;
  if (grossTaxable * 12 <= fp.ANNUAL_THRESHOLD) {
    return round2(grossTaxable * fp.RATE_UP_TO_THRESHOLD);
  }
  return round2(Math.min(grossTaxable * fp.RATE_ABOVE_THRESHOLD, fp.ANNUAL_CAP_ABOVE_THRESHOLD / 12));
}

/**
 * Progressive IR (income tax) using the annualized quick-calculation
 * method: find the bracket the ANNUAL taxable income falls into,
 * apply (income × rate) − deduction, then divide by 12.
 */
function computeAnnualIR(annualTaxableIncome) {
  const bracket = payrollConfig.IR_BRACKETS.find(
    (b) => annualTaxableIncome <= b.upTo
  );

  if (!bracket || bracket.rate === 0) return 0;

  const raw = annualTaxableIncome * bracket.rate - bracket.deduction;
  return Math.max(raw, 0);
}

/**
 * Family-charge deduction: a flat amount subtracted from the IR
 * itself (not the taxable base), per dependent up to the max. The
 * amount depends on the payslip's year (500 in 2025, 600 from 2026).
 */
function perDependentAnnual(year = new Date().getFullYear()) {
  const table = payrollConfig.FAMILY_DEDUCTION.PER_DEPENDENT_ANNUAL_BY_YEAR;
  const years = Object.keys(table).map(Number).sort((x, y) => x - y);
  const applicable = years.filter((y) => y <= year);
  return table[applicable.length ? applicable[applicable.length - 1] : years[0]];
}

function computeFamilyDeduction(numberOfDependents = 0, year) {
  const count = Math.min(
    Math.max(0, Number(numberOfDependents) || 0),
    payrollConfig.FAMILY_DEDUCTION.MAX_DEPENDENTS
  );
  return round2((count * perDependentAnnual(year)) / 12);
}

/**
 * Prime d'ancienneté rate (Code du travail art. 350): 5% from 2
 * years, 10% from 5, 15% from 12, 20% from 20, 25% from 25.
 * `years` = completed years of service.
 */
function seniorityRateForYears(years = 0) {
  const step = payrollConfig.SENIORITY_STEPS.find((s) => years >= s.years);
  return step ? step.rate : 0;
}

function completedYears(hireDate, asOf = new Date()) {
  if (!hireDate) return 0;
  const from = new Date(hireDate);
  const to = new Date(asOf);
  let years = to.getFullYear() - from.getFullYear();
  if (to.getMonth() < from.getMonth() || (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())) years -= 1;
  return Math.max(0, years);
}

function seniorityRateFor(hireDate, asOf) {
  return seniorityRateForYears(completedYears(hireDate, asOf));
}

/** A salary that already carries a manual "Prime d'ancienneté" line. */
function hasManualSeniority(allowances = []) {
  return (allowances || []).some((a) => /anciennet/i.test(a?.label || ""));
}

const EXEMPT_KINDS = Object.keys(payrollConfig.EXEMPT_ALLOWANCES);

/**
 * Monthly exempt limit for one kind of allowance.
 */
function exemptCap(kind, { baseSalary = 0, workedDays = 26 } = {}) {
  const rule = payrollConfig.EXEMPT_ALLOWANCES[kind];
  if (!rule) return 0;
  if (rule.monthlyCap !== undefined) return rule.monthlyCap;
  if (rule.baseSalaryRate !== undefined) return round2(baseSalary * rule.baseSalaryRate);
  if (rule.smigHourlyMultiplierPerDay !== undefined) {
    return round2(rule.smigHourlyMultiplierPerDay * payrollConfig.SMIG_HOURLY * workedDays);
  }
  return 0;
}

/**
 * Splits allowances into exempt and taxable parts. Each exempt kind
 * (transport, panier, représentation) is exempt up to its legal
 * limit, summed across lines of the same kind; the excess, and every
 * ordinary allowance, is taxable.
 */
function splitAllowances(allowances = [], context) {
  const used = {};
  const lines = (allowances || []).map((a) => {
    const amount = round2(Number(a.amount) || 0);
    const kind = EXEMPT_KINDS.includes(a.kind) ? a.kind : "taxable";
    let exemptAmount = 0;
    if (kind !== "taxable") {
      const cap = exemptCap(kind, context);
      exemptAmount = round2(Math.max(0, Math.min(amount, cap - (used[kind] || 0))));
      used[kind] = round2((used[kind] || 0) + exemptAmount);
    }
    return { label: a.label, amount, kind, exemptAmount, taxableAmount: round2(amount - exemptAmount) };
  });
  return {
    lines,
    total: round2(lines.reduce((t, l) => t + l.amount, 0)),
    exemptTotal: round2(lines.reduce((t, l) => t + l.exemptAmount, 0)),
  };
}

/**
 * Full payslip calculation for one employee, one month.
 *
 * @param {Object} input
 * @param {number} input.baseSalary
 * @param {Array}  input.allowances  - [{ label, amount, kind? }]; kind
 *                 "transport" | "transport_outside" | "panier" |
 *                 "representation" = exempt within the legal limit,
 *                 anything else = taxable.
 * @param {Array}  input.deductions  - [{ label, amount }] (non-statutory, e.g. advance repayment)
 * @param {number} input.numberOfDependents
 * @param {number} [input.year] - payslip year (family deduction amount)
 * @param {number} [input.seniorityRate] - prime d'ancienneté rate (0.05 … 0.25)
 * @param {number} [input.workedDays] - for the panier limit (26 = full month)
 * @param {number} [input.cimrEmployeeRate]
 * @param {number} [input.cimrEmployerRate]
 * @param {number} [input.overtimeAmount] - extra pay for overtime hours, already computed
 * @param {number} [input.unpaidDeduction] - deduction for unpaid absence days, already computed
 */
function calculatePayslip({
  baseSalary,
  allowances = [],
  deductions = [],
  numberOfDependents = 0,
  year,
  seniorityRate = 0,
  workedDays = 26,
  cimrEmployeeRate,
  cimrEmployerRate,
  overtimeAmount = 0,
  holidayAmount = 0,
  unpaidDeduction = 0,
}) {
  const split = splitAllowances(allowances, { baseSalary, workedDays });
  const allowanceTotal = split.total;
  const otherDeductionTotal = sumLineItems(deductions);

  // Prime d'ancienneté on the base salary actually earned this month
  // (after unpaid absence).
  const seniorityAmount = round2(Math.max(0, baseSalary - unpaidDeduction) * (seniorityRate || 0));

  // Salaire brut global = base + ancienneté + allowances + overtime,
  // minus unpaid days (unpaid absence reduces the salary base itself,
  // before statutory contributions).
  // (holidayAmount: premium for public holidays worked — taxable and
  // subject to contributions, like overtime.)
  const grossSalary = round2(
    baseSalary + seniorityAmount + allowanceTotal + overtimeAmount + holidayAmount - unpaidDeduction
  );

  // Salaire brut imposable: what CNSS, AMO, CIMR, frais
  // professionnels and IR are computed on (exempt allowances out).
  const exemptAllowanceTotal = split.exemptTotal;
  const taxableGross = round2(grossSalary - exemptAllowanceTotal);

  const cnssEmployee = computeCNSSEmployee(taxableGross);
  const cnssEmployer = computeCNSSEmployer(taxableGross);
  const vocationalTraining = computeVocationalTraining(taxableGross);

  const amoEmployee = computeAMOEmployee(taxableGross);
  const amoEmployer = computeAMOEmployer(taxableGross);

  const cimr = computeCIMR(taxableGross, cimrEmployeeRate, cimrEmployerRate);

  const taxableBeforeExpenses = round2(
    taxableGross - cnssEmployee - amoEmployee - cimr.employee
  );

  // Frais professionnels are computed on the GROSS taxable salary
  // (CGI art. 59-I), not on the salary net of contributions.
  const professionalExpenses = computeProfessionalExpenses(taxableGross);

  const monthlyTaxableIncome = round2(
    Math.max(0, taxableBeforeExpenses - professionalExpenses)
  );

  const annualIR = computeAnnualIR(monthlyTaxableIncome * 12);
  const monthlyIRBeforeFamilyDeduction = round2(annualIR / 12);

  const familyDeduction = computeFamilyDeduction(numberOfDependents, year);

  const incomeTax = round2(
    Math.max(monthlyIRBeforeFamilyDeduction - familyDeduction, 0)
  );

  const totalEmployeeDeductions = round2(
    cnssEmployee + amoEmployee + cimr.employee + incomeTax + otherDeductionTotal
  );

  const netSalary = round2(grossSalary - totalEmployeeDeductions);

  const totalEmployerCost = round2(
    grossSalary +
      cnssEmployer +
      vocationalTraining +
      amoEmployer +
      cimr.employer
  );

  return {
    currency: payrollConfig.CURRENCY,

    baseSalary: round2(baseSalary),
    seniorityRate: seniorityRate || 0,
    seniorityAmount,
    allowances: split.lines,
    allowanceTotal: round2(allowanceTotal),
    exemptAllowanceTotal,
    overtimeAmount: round2(overtimeAmount),
    holidayAmount: round2(holidayAmount),
    unpaidDeduction: round2(unpaidDeduction),
    grossSalary,
    taxableGross,

    cnssEmployee,
    amoEmployee,
    cimrEmployee: cimr.employee,
    professionalExpenses,
    monthlyTaxableIncome,
    incomeTaxBeforeFamilyDeduction: monthlyIRBeforeFamilyDeduction,
    incomeTax,
    familyDeduction,
    otherDeductions: deductions,
    otherDeductionTotal: round2(otherDeductionTotal),
    totalEmployeeDeductions,

    netSalary,

    // Employer-side (doesn't affect employee net pay, but needed
    // for payroll-cost reporting).
    employer: {
      cnssEmployer,
      vocationalTraining,
      amoEmployer,
      cimrEmployer: cimr.employer,
      totalEmployerCost,
    },
  };
}

/**
 * Net → base ("calcul à l'envers"): the smallest base salary, to the
 * cent, whose payslip — computed by calculatePayslip itself, with the
 * same allowances, seniority, dependents and CIMR — pays at least
 * `targetNet`. Because it runs the real payslip calculation, the
 * payslip generated later with this base pays exactly the net shown.
 *
 * Net never rises faster than `maxSlope` × the base (one dirham of
 * base, plus the seniority bonus on it, plus at most 10% more exempt
 * représentation), so stepping the base up by gap / maxSlope never
 * overshoots the smallest solution; this stays exact across the
 * frais-professionnels threshold, where net pay briefly drops as the
 * salary crosses 6,500 MAD.
 */
function baseFromNet({ targetNet, ...input }) {
  const target = round2(Number(targetNet) || 0);
  const netAt = (cents) => calculatePayslip({ ...input, baseSalary: cents / 100 }).netSalary;
  const maxSlope = 1 + (Number(input.seniorityRate) || 0) + 0.1;
  let cents = 0;
  if (netAt(0) >= target) return { baseSalary: 0, payslip: calculatePayslip({ ...input, baseSalary: 0 }) };
  for (let i = 0; i < 500; i += 1) {
    const gap = target - netAt(cents);
    if (gap <= 0) break;
    const step = Math.floor((gap * 100) / maxSlope);
    if (step < 1) break;
    cents += step;
  }
  // Final approach, cent by cent (rounding of each line).
  for (let i = 0; i < 10000 && netAt(cents) < target; i += 1) cents += 1;
  const baseSalary = cents / 100;
  return { baseSalary, payslip: calculatePayslip({ ...input, baseSalary }) };
}

/**
 * One-off bonus (prime exceptionnelle) on top of a monthly salary:
 * what it costs and what the employee actually receives, i.e. the
 * difference between the payslip with and without it. CNSS stops at
 * its ceiling and IR is progressive, so a bonus is not simply
 * "gross × a fixed rate" — this runs the full payslip twice.
 */
function bonusEffect({ bonusGross, bonusKind = "taxable", bonusLabel = "Prime exceptionnelle", ...input }) {
  const without = calculatePayslip(input);
  const gross = round2(Math.max(0, Number(bonusGross) || 0));
  const withBonus = calculatePayslip({
    ...input,
    allowances: [...(input.allowances || []), { label: bonusLabel, amount: gross, kind: bonusKind }],
  });
  return {
    gross,
    net: round2(withBonus.netSalary - without.netSalary),
    cnss: round2(withBonus.cnssEmployee - without.cnssEmployee),
    amo: round2(withBonus.amoEmployee - without.amoEmployee),
    incomeTax: round2(withBonus.incomeTax - without.incomeTax),
    employerCost: round2(withBonus.employer.totalEmployerCost - without.employer.totalEmployerCost),
    without,
    withBonus,
  };
}

/**
 * Gross bonus needed for the employee to receive `targetNet` more
 * (smallest amount to the cent). A bonus never adds more net than
 * its own gross, so stepping by the remaining gap never overshoots.
 */
function bonusGrossFromNet({ targetNet, ...input }) {
  const target = round2(Math.max(0, Number(targetNet) || 0));
  const netAt = (cents) => bonusEffect({ ...input, bonusGross: cents / 100 }).net;
  let cents = 0;
  for (let i = 0; i < 500; i += 1) {
    const gap = target - netAt(cents);
    const step = Math.floor(gap * 100);
    if (step < 1) break;
    cents += step;
  }
  for (let i = 0; i < 10000 && netAt(cents) < target; i += 1) cents += 1;
  return bonusEffect({ ...input, bonusGross: cents / 100 });
}

module.exports = {
  calculatePayslip,
  computeCNSSEmployee,
  computeCNSSEmployer,
  computeAMOEmployee,
  computeAMOEmployer,
  computeAnnualIR,
  computeFamilyDeduction,
  computeProfessionalExpenses,
  perDependentAnnual,
  seniorityRateFor,
  seniorityRateForYears,
  completedYears,
  hasManualSeniority,
  exemptCap,
  splitAllowances,
  baseFromNet,
  bonusEffect,
  bonusGrossFromNet,
  EXEMPT_KINDS,
  sumLineItems,
  round2,
};
