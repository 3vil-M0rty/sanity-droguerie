const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const PayrollRun = require("../models/PayrollRun");
const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const Salary = require("../models/Salary");
const Company = require("../models/Company");
const User = require("../models/User");
const Advance = require("../models/Advance");
const PayrollBonus = require("../models/PayrollBonus");

const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { requireHRAccess } = require("../middleware/permissionMiddleware");
const { canAccessHRForCompany } = require("../permissions/permissions");
const { calculatePayslip, seniorityRateFor, hasManualSeniority } = require("../services/payrollCalculationService");
const { logAudit } = require("../services/auditLogger");
const {
  computePayrollAdjustments,
  computeAdvanceDeductions,
} = require("../services/payrollAttendanceService");
const {
  notifyMany,
  getHRRecipientIds,
} = require("../services/notificationService");
const { generatePayslipPdf, computeYtdTotals } = require("../services/payslipPdfService");
const { getLeaveBalance } = require("../services/leaveBalanceService");
const { countWorkingDays } = require("../services/workingDays");
const {
  buildCnssExport,
  buildPayrollRegister,
  buildBankTransferExport,
} = require("../services/payrollExportService");

// Fine-grained permissions of every endpoint: config/routePermissions.js
router.use(auth, guard(ROUTE_PERMISSIONS.payroll));
router.use(auth, requireHRAccess);

const canManage = (req, company) => canAccessHRForCompany(req.user, company);

// ======================================================
// GENERATE A PAYROLL RUN
// POST /api/payroll/runs
// body: { company, month, year }
//
// Creates one Payslip per active employee that has a current
// salary record, using services/payrollCalculationService.js.
// Fails with 409 if a run already exists for that company/period —
// use POST /:id/regenerate to recompute a draft run instead of
// silently creating duplicates.
// ======================================================

router.post("/runs", async (req, res) => {
  try {
    const { company, month, year } = req.body;

    if (!company || !mongoose.Types.ObjectId.isValid(company)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid company is required" });
    }

    if (!month || month < 1 || month > 12 || !year) {
      return res
        .status(400)
        .json({ success: false, message: "A valid month and year are required" });
    }

    const companyDoc = await Company.findById(company);
    if (!companyDoc) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    if (!canManage(req, companyDoc)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to run payroll for this company",
      });
    }

    const existing = await PayrollRun.findOne({ company, month, year });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A payroll run already exists for this period",
        data: existing,
      });
    }

    const run = await generateRun({ company, month, year, actorId: req.user.id });

    await logAudit(req, {
      company,
      action: "create",
      resourceType: "PayrollRun",
      resourceId: run._id,
      resourceLabel: `${month}/${year}`,
      after: run.toObject(),
    });

    res.status(201).json({ success: true, data: run });
  } catch (error) {
    console.error("POST payroll run error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating payroll run",
      error: error.message,
    });
  }
});

// Shared generation logic — used by POST /runs and POST /:id/regenerate.
async function generateRun({ company, month, year, actorId, existingRun }) {
  const employees = await Employee.find({
    company,
    employmentStatus: "active",
  });

  // Hours policy (overtime, deductions, monthly hours) comes from each
  // employee's schedule: their department's, else the company default.
  const { scheduleForEmployee } = require("../services/scheduleResolver");
  const scheduleCache = new Map();
  const hoursManagementOf = async (employee) => {
    const key = String(employee.department || "");
    if (!scheduleCache.has(key)) scheduleCache.set(key, (await scheduleForEmployee(employee, company))?.hoursManagement);
    return scheduleCache.get(key);
  };

  const run =
    existingRun ||
    (await PayrollRun.create({
      company,
      month,
      year,
      createdBy: actorId,
      updatedBy: actorId,
    }));

  if (existingRun) {
    await Payslip.deleteMany({ payrollRun: run._id });
  }

  let totalGross = 0;
  let totalNet = 0;
  let totalEmployerCost = 0;
  let count = 0;

  // Variable bonuses of this month (prime exceptionnelle, commission…),
  // added to this month's payslip only — see models/PayrollBonus.js.
  const monthBonuses = await PayrollBonus.find({ company, month: Number(month), year: Number(year) }).sort({ createdAt: 1 }).lean();
  const bonusesOf = (employeeId) => monthBonuses
    .filter((b) => String(b.employee) === String(employeeId))
    .map((b) => ({ label: b.label, amount: b.amount, kind: b.kind }));

  for (const employee of employees) {
    const currentSalary = await Salary.findOne({
      employee: employee._id,
      endDate: null,
    });

    // No salary on file for this employee — skip them rather than
    // fail the whole run; HR can add a salary and regenerate.
    if (!currentSalary) continue;

    // Absences (unpaid/unjustified), advances, and attendance
    // (overtime/lateness) all fold into this one payslip here —
    // see services/payrollAttendanceService.js.
    const adjustments = await computePayrollAdjustments({
      employeeId: employee._id,
      month,
      year,
      baseSalary: currentSalary.baseSalary,
      hoursManagement: await hoursManagementOf(employee),
    });

    // Days declared to CNSS: 26 for a full month (CNSS convention),
    // the working days actually covered for a mid-month hire, minus
    // unpaid days.
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    let coveredDays = 26;
    if (employee.hireDate && new Date(employee.hireDate) > monthStart) {
      coveredDays = new Date(employee.hireDate) > monthEnd ? 0 : Math.min(26, countWorkingDays(employee.hireDate, monthEnd));
    }
    const declaredDays = Math.max(0, Math.round(coveredDays - (adjustments.unpaidDays || 0)));

    // Prime d'ancienneté from the hire date, unless the salary already
    // carries it as a manual allowance line.
    const seniorityRate = hasManualSeniority(currentSalary.allowances) ? 0 : seniorityRateFor(employee.hireDate, monthEnd);

    const calc = calculatePayslip({
      baseSalary: currentSalary.baseSalary,
      allowances: [...(currentSalary.allowances || []).map((a) => ({ label: a.label, amount: a.amount, kind: a.kind })), ...bonusesOf(employee._id)],
      deductions: adjustments.otherDeductions,
      numberOfDependents: employee.numberOfDependents || 0,
      year: Number(year),
      seniorityRate,
      workedDays: declaredDays,
      overtimeAmount: adjustments.overtimeAmount,
      holidayAmount: adjustments.holidayAmount,
      unpaidDeduction: adjustments.unpaidDeduction,
    });

    await Payslip.create({
      company,
      employee: employee._id,
      payrollRun: run._id,
      month,
      year,
      currency: calc.currency,
      baseSalary: calc.baseSalary,
      seniorityRate: calc.seniorityRate,
      seniorityAmount: calc.seniorityAmount,
      allowances: calc.allowances.map((a) => ({ label: a.label, amount: a.amount, kind: a.kind, exemptAmount: a.exemptAmount })),
      allowanceTotal: calc.allowanceTotal,
      exemptAllowanceTotal: calc.exemptAllowanceTotal,
      overtimeAmount: calc.overtimeAmount,
      holidayAmount: calc.holidayAmount,
      holidayHours: adjustments.holidayHours,
      unpaidDeduction: calc.unpaidDeduction,
      unpaidDays: adjustments.unpaidDays || 0,
      declaredDays,
      grossSalary: calc.grossSalary,
      taxableGross: calc.taxableGross,
      cnssEmployee: calc.cnssEmployee,
      amoEmployee: calc.amoEmployee,
      cimrEmployee: calc.cimrEmployee,
      professionalExpenses: calc.professionalExpenses,
      monthlyTaxableIncome: calc.monthlyTaxableIncome,
      incomeTaxBeforeFamilyDeduction: calc.incomeTaxBeforeFamilyDeduction,
      incomeTax: calc.incomeTax,
      familyDeduction: calc.familyDeduction,
      otherDeductions: calc.otherDeductions,
      otherDeductionTotal: calc.otherDeductionTotal,
      totalEmployeeDeductions: calc.totalEmployeeDeductions,
      netSalary: calc.netSalary,
      employerCnss: calc.employer.cnssEmployer,
      employerVocationalTraining: calc.employer.vocationalTraining,
      employerAmo: calc.employer.amoEmployer,
      employerCimr: calc.employer.cimrEmployer,
      totalEmployerCost: calc.employer.totalEmployerCost,
      status: "draft",
      createdBy: actorId,
    });

    totalGross += calc.grossSalary;
    totalNet += calc.netSalary;
    totalEmployerCost += calc.employer.totalEmployerCost;
    count += 1;
  }

  run.employeeCount = count;
  run.totalGross = Math.round(totalGross * 100) / 100;
  run.totalNet = Math.round(totalNet * 100) / 100;
  run.totalEmployerCost = Math.round(totalEmployerCost * 100) / 100;
  run.updatedBy = actorId;
  await run.save();

  return run;
}

// ======================================================
// REGENERATE A DRAFT RUN
// POST /api/payroll/runs/:id/regenerate
// Recomputes every payslip in a still-draft run (e.g. after
// correcting an employee's salary). Not allowed once completed.
// ======================================================

router.post("/runs/:id/regenerate", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid run ID" });
    }

    const run = await PayrollRun.findById(req.params.id).populate("company");
    if (!run) {
      return res.status(404).json({ success: false, message: "Payroll run not found" });
    }

    if (!canManage(req, run.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this payroll run",
      });
    }

    if (run.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only a draft run can be regenerated",
      });
    }

    const updated = await generateRun({
      company: run.company._id,
      month: run.month,
      year: run.year,
      actorId: req.user.id,
      existingRun: run,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("POST regenerate payroll run error:", error);
    res.status(500).json({
      success: false,
      message: "Error regenerating payroll run",
      error: error.message,
    });
  }
});

// ======================================================
// LIST PAYROLL RUNS
// GET /api/payroll/runs?companyId=&year=&page=&limit=
// ======================================================

router.get("/runs", async (req, res) => {
  try {
    const { companyId, year, page = 1, limit = 20 } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    if (!canManage(req, company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view payroll for this company",
      });
    }

    const filter = { company: companyId };
    if (year) filter.year = Number(year);

    const currentPage = Math.max(Number(page), 1);
    const currentLimit = Math.max(Number(limit), 1);

    const [runs, total] = await Promise.all([
      PayrollRun.find(filter)
        .sort({ year: -1, month: -1 })
        .skip((currentPage - 1) * currentLimit)
        .limit(currentLimit),
      PayrollRun.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: runs,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        pages: Math.ceil(total / currentLimit) || 1,
      },
    });
  } catch (error) {
    console.error("GET payroll runs error:", error);
    res.status(500).json({ success: false, message: "Error fetching payroll runs", error: error.message });
  }
});

// ======================================================
// GET A RUN + ITS PAYSLIPS
// GET /api/payroll/runs/:id
// ======================================================

router.get("/runs/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid run ID" });
    }

    const run = await PayrollRun.findById(req.params.id).populate("company", "name owner");
    if (!run) {
      return res.status(404).json({ success: false, message: "Payroll run not found" });
    }

    if (!canManage(req, run.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payroll run",
      });
    }

    const payslips = await Payslip.find({ payrollRun: run._id })
      .populate("employee", "firstName lastName employeeNumber jobTitle photo")
      .sort({ "employee.lastName": 1 });

    res.json({ success: true, data: { run, payslips } });
  } catch (error) {
    console.error("GET payroll run error:", error);
    res.status(500).json({ success: false, message: "Error fetching payroll run", error: error.message });
  }
});

// ======================================================
// COMPLETE A RUN (locks it)
// POST /api/payroll/runs/:id/complete
// ======================================================

router.post("/runs/:id/complete", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid run ID" });
    }

    const run = await PayrollRun.findById(req.params.id).populate("company");
    if (!run) {
      return res.status(404).json({ success: false, message: "Payroll run not found" });
    }

    if (!canManage(req, run.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this payroll run",
      });
    }

    if (run.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only a draft run can be completed",
      });
    }

    run.status = "completed";
    run.completedAt = new Date();
    run.updatedBy = req.user.id;
    await run.save();

    await Payslip.updateMany(
      { payrollRun: run._id },
      { $set: { status: "validated" } }
    );

    // Mark advances as repaid ONLY now, at completion — not during
    // (possibly repeated) draft generation. Completing a run is a
    // one-time, final action, so this is the one safe point to
    // actually mutate Advance records; generating/regenerating a
    // draft just shows what WOULD be deducted, without touching
    // anything yet (see services/payrollAttendanceService.js).
    const runPayslips = await Payslip.find({ payrollRun: run._id }).select("employee");
    for (const payslip of runPayslips) {
      const { toMarkRepaid } = await computeAdvanceDeductions({ employeeId: payslip.employee });
      for (const { advanceId, amount } of toMarkRepaid) {
        const advance = await Advance.findById(advanceId);
        if (!advance) continue;
        advance.repaidAmount = Math.round(((advance.repaidAmount || 0) + amount) * 100) / 100;
        advance.repaid = advance.repaidAmount >= advance.amount;
        await advance.save();
      }
    }

    // Notify every employee with a linked User account that a new
    // payslip is available.
    const payslips = await Payslip.find({ payrollRun: run._id }).populate({
      path: "employee",
      select: "_id",
    });

    const linkedUsers = await User.find({
      employee: { $in: payslips.map((p) => p.employee._id) },
    }).select("_id");

    await notifyMany(
      linkedUsers.map((u) => u._id),
      {
        type: "payslip_available",
        title: "New payslip available",
        message: `Your payslip for ${run.month}/${run.year} is ready.`,
        link: "/me/payslips",
      }
    );

    await logAudit(req, {
      company: run.company._id,
      action: "update",
      resourceType: "PayrollRun",
      resourceId: run._id,
      resourceLabel: `${run.month}/${run.year}`,
      after: { status: "completed" },
    });

    res.json({ success: true, data: run });
  } catch (error) {
    console.error("POST complete payroll run error:", error);
    res.status(500).json({ success: false, message: "Error completing payroll run", error: error.message });
  }
});

// ======================================================
// DELETE A DRAFT RUN
// DELETE /api/payroll/runs/:id
// ======================================================

router.delete("/runs/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid run ID" });
    }

    const run = await PayrollRun.findById(req.params.id).populate("company");
    if (!run) {
      return res.status(404).json({ success: false, message: "Payroll run not found" });
    }

    if (!canManage(req, run.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this payroll run",
      });
    }

    if (run.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "A completed payroll run cannot be deleted — void it instead",
      });
    }

    await Payslip.deleteMany({ payrollRun: run._id });
    await PayrollRun.findByIdAndDelete(run._id);

    res.json({ success: true, message: "Payroll run deleted", runId: run._id });
  } catch (error) {
    console.error("DELETE payroll run error:", error);
    res.status(500).json({ success: false, message: "Error deleting payroll run", error: error.message });
  }
});

// ======================================================
// GET PAYSLIPS FOR AN EMPLOYEE (HR view — self-service uses
// /api/me/payslips instead)
// GET /api/payroll/payslips?employeeId=&companyId=&page=&limit=
// ======================================================

router.get("/payslips", async (req, res) => {
  try {
    const { employeeId, companyId, page = 1, limit = 20 } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "companyId is required" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    if (!canManage(req, company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view payslips for this company",
      });
    }

    const filter = { company: companyId };
    if (employeeId) filter.employee = employeeId;

    const currentPage = Math.max(Number(page), 1);
    const currentLimit = Math.max(Number(limit), 1);

    const [payslips, total] = await Promise.all([
      Payslip.find(filter)
        .populate("employee", "firstName lastName employeeNumber jobTitle photo")
        .sort({ year: -1, month: -1 })
        .skip((currentPage - 1) * currentLimit)
        .limit(currentLimit),
      Payslip.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: payslips,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        pages: Math.ceil(total / currentLimit) || 1,
      },
    });
  } catch (error) {
    console.error("GET payslips error:", error);
    res.status(500).json({ success: false, message: "Error fetching payslips", error: error.message });
  }
});

// ======================================================
// DOWNLOAD PAYSLIP PDF
// GET /api/payroll/payslips/:id/pdf
// ======================================================

router.get("/payslips/:id/pdf", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid payslip ID" });
    }

    const payslip = await Payslip.findById(req.params.id)
      .populate("company")
      .populate({
        path: "employee",
        populate: { path: "department", select: "name" },
      });

    if (!payslip) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }

    if (!canManage(req, payslip.company)) {
      return res.status(403).json({ success: false, message: "Not authorized to view this payslip" });
    }

    const [ytd, leaveBalance] = await Promise.all([
      computeYtdTotals(Payslip, payslip.employee._id, payslip.year, payslip.month),
      getLeaveBalance(payslip.employee),
    ]);

    const doc = generatePayslipPdf({
      payslip,
      employee: payslip.employee,
      company: payslip.company,
      ytdGross: ytd.gross,
      ytdNet: ytd.net,
      leaveBalance,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="bulletin-${payslip.employee.employeeNumber || payslip.employee._id}-${payslip.month}-${payslip.year}.pdf"`
    );
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("GET payslip PDF error:", error);
    res.status(500).json({ success: false, message: "Error generating payslip PDF", error: error.message });
  }
});

// ======================================================
// PAYROLL RUN EXPORTS (CNSS worksheet, register, bank transfer)
// GET /api/payroll/runs/:id/export/:type
// :type = cnss | register | bank-transfer
// ======================================================

router.get("/runs/:id/export/:type", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid run ID" });
    }

    const run = await PayrollRun.findById(req.params.id).populate("company");
    if (!run) {
      return res.status(404).json({ success: false, message: "Payroll run not found" });
    }
    if (!canManage(req, run.company)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const payslips = await Payslip.find({ payrollRun: run._id }).populate("employee");

    let csv;
    let filenamePart;

    if (req.params.type === "cnss") {
      csv = buildCnssExport(run, payslips, run.company);
      filenamePart = "cnss-bds";
    } else if (req.params.type === "register") {
      csv = buildPayrollRegister(run, payslips, run.company);
      filenamePart = "etat-de-paie";
    } else if (req.params.type === "bank-transfer") {
      csv = buildBankTransferExport(run, payslips, run.company);
      filenamePart = "virement-masse";
    } else {
      return res.status(400).json({ success: false, message: "Unknown export type" });
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filenamePart}-${run.month}-${run.year}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("GET payroll export error:", error);
    res.status(500).json({ success: false, message: "Error generating export", error: error.message });
  }
});

// ======================================================
// MARK A PAYSLIP AS PAID
// PATCH /api/payroll/payslips/:id/mark-paid
// ======================================================

router.patch("/payslips/:id/mark-paid", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid payslip ID" });
    }

    const payslip = await Payslip.findById(req.params.id).populate("company");
    if (!payslip) {
      return res.status(404).json({ success: false, message: "Payslip not found" });
    }

    if (!canManage(req, payslip.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this payslip",
      });
    }

    payslip.status = "paid";
    payslip.paidAt = new Date();
    await payslip.save();

    res.json({ success: true, data: payslip });
  } catch (error) {
    console.error("PATCH mark payslip paid error:", error);
    res.status(500).json({ success: false, message: "Error updating payslip", error: error.message });
  }
});


// ======================================================
// MONTHLY VARIABLE BONUSES (primes du mois)
// GET    /api/payroll/bonuses?companyId=&month=&year=
// POST   /api/payroll/bonuses                     { company, employee, month, year, label, amount, kind, notes }
// PUT    /api/payroll/bonuses/:id                 { label, amount, kind, notes }
// DELETE /api/payroll/bonuses/:id
// POST   /api/payroll/bonuses/import-commissions  { company, month, year, commissionMonth?, commissionYear? }
// A bonus goes on that month's payslip only. When the month's run is
// still a draft it is regenerated at once; a completed month is locked.
// ======================================================

const BONUS_KINDS = ["taxable", "transport", "transport_outside", "panier", "representation"];
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function validPeriod(month, year) {
  const m = Number(month);
  const y = Number(year);
  return Number.isInteger(m) && m >= 1 && m <= 12 && Number.isInteger(y) && y >= 2000 && y <= 2100 ? { month: m, year: y } : null;
}

async function companyFor(req, res, companyId) {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    res.status(400).json({ success: false, message: "A valid company is required" });
    return null;
  }
  const company = await Company.findById(companyId);
  if (!company) {
    res.status(404).json({ success: false, message: "Company not found" });
    return null;
  }
  if (!canManage(req, company)) {
    res.status(403).json({ success: false, message: "Not authorized for this company" });
    return null;
  }
  return company;
}

/** null when the month is still open, else the closed run. */
async function closedRun(company, month, year) {
  const run = await PayrollRun.findOne({ company, month, year }).select("status");
  return run && run.status !== "draft" ? run : null;
}

/** Re-computes the month's draft run, if there is one. */
async function refreshDraft(company, month, year, actorId) {
  const run = await PayrollRun.findOne({ company, month, year });
  if (!run || run.status !== "draft") return null;
  return generateRun({ company, month, year, actorId, existingRun: run });
}

router.get("/bonuses", async (req, res) => {
  try {
    const company = await companyFor(req, res, req.query.companyId);
    if (!company) return;
    const period = validPeriod(req.query.month, req.query.year);
    if (!period) return res.status(400).json({ success: false, message: "A valid month and year are required" });
    const bonuses = await PayrollBonus.find({ company: company._id, ...period })
      .populate("employee", "firstName lastName employeeNumber")
      .sort({ createdAt: 1 });
    const run = await PayrollRun.findOne({ company: company._id, ...period }).select("status");
    res.json({
      success: true,
      data: bonuses,
      locked: !!run && run.status !== "draft",
      total: round2(bonuses.reduce((t, b) => t + b.amount, 0)),
    });
  } catch (error) {
    console.error("GET payroll bonuses error:", error);
    res.status(500).json({ success: false, message: "Error fetching bonuses", error: error.message });
  }
});

router.post("/bonuses", async (req, res) => {
  try {
    const { employee, label, amount, kind = "taxable", notes } = req.body || {};
    const company = await companyFor(req, res, req.body?.company);
    if (!company) return;
    const period = validPeriod(req.body?.month, req.body?.year);
    if (!period) return res.status(400).json({ success: false, message: "A valid month and year are required" });
    const value = round2(amount);
    if (!(value > 0) || value > 10000000) return res.status(400).json({ success: false, message: "A valid amount is required" });
    if (!String(label || "").trim()) return res.status(400).json({ success: false, message: "A label is required" });
    if (!BONUS_KINDS.includes(kind)) return res.status(400).json({ success: false, message: "Invalid kind" });
    if (!employee || !mongoose.Types.ObjectId.isValid(employee)) return res.status(400).json({ success: false, message: "A valid employee is required" });
    const emp = await Employee.findOne({ _id: employee, company: company._id }).select("_id");
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found in this company" });
    if (await closedRun(company._id, period.month, period.year)) {
      return res.status(409).json({ success: false, message: "Payroll for this month is completed" });
    }
    const bonus = await PayrollBonus.create({
      company: company._id, employee: emp._id, ...period, label: String(label).trim(), amount: value, kind, notes,
      source: "manual", createdBy: req.user.id, updatedBy: req.user.id,
    });
    await logAudit(req, { company: company._id, action: "create", resourceType: "PayrollBonus", resourceId: bonus._id, resourceLabel: `${bonus.label} ${period.month}/${period.year}`, after: bonus.toObject() });
    await refreshDraft(company._id, period.month, period.year, req.user.id);
    res.status(201).json({ success: true, data: bonus });
  } catch (error) {
    console.error("POST payroll bonus error:", error);
    res.status(500).json({ success: false, message: "Error creating bonus", error: error.message });
  }
});

async function bonusFor(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ success: false, message: "Invalid bonus ID" });
    return null;
  }
  const bonus = await PayrollBonus.findById(req.params.id);
  if (!bonus) {
    res.status(404).json({ success: false, message: "Bonus not found" });
    return null;
  }
  const company = await companyFor(req, res, bonus.company);
  if (!company) return null;
  if (await closedRun(bonus.company, bonus.month, bonus.year)) {
    res.status(409).json({ success: false, message: "Payroll for this month is completed" });
    return null;
  }
  return bonus;
}

router.put("/bonuses/:id", async (req, res) => {
  try {
    const bonus = await bonusFor(req, res);
    if (!bonus) return;
    const before = bonus.toObject();
    const { label, amount, kind, notes } = req.body || {};
    if (label !== undefined) {
      if (!String(label).trim()) return res.status(400).json({ success: false, message: "A label is required" });
      bonus.label = String(label).trim();
    }
    if (amount !== undefined) {
      const value = round2(amount);
      if (!(value > 0) || value > 10000000) return res.status(400).json({ success: false, message: "A valid amount is required" });
      bonus.amount = value;
    }
    if (kind !== undefined) {
      if (!BONUS_KINDS.includes(kind)) return res.status(400).json({ success: false, message: "Invalid kind" });
      bonus.kind = kind;
    }
    if (notes !== undefined) bonus.notes = notes;
    bonus.updatedBy = req.user.id;
    await bonus.save();
    await logAudit(req, { company: bonus.company, action: "update", resourceType: "PayrollBonus", resourceId: bonus._id, resourceLabel: bonus.label, before, after: bonus.toObject() });
    await refreshDraft(bonus.company, bonus.month, bonus.year, req.user.id);
    res.json({ success: true, data: bonus });
  } catch (error) {
    console.error("PUT payroll bonus error:", error);
    res.status(500).json({ success: false, message: "Error updating bonus", error: error.message });
  }
});

router.delete("/bonuses/:id", async (req, res) => {
  try {
    const bonus = await bonusFor(req, res);
    if (!bonus) return;
    await PayrollBonus.deleteOne({ _id: bonus._id });
    await logAudit(req, { company: bonus.company, action: "delete", resourceType: "PayrollBonus", resourceId: bonus._id, resourceLabel: bonus.label, before: bonus.toObject() });
    await refreshDraft(bonus.company, bonus.month, bonus.year, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE payroll bonus error:", error);
    res.status(500).json({ success: false, message: "Error deleting bonus", error: error.message });
  }
});

// Sales reps' commissions (Commercial → Commerciaux) → taxable bonuses.
// Each rep's login must be linked to their employee file. Re-importing
// replaces the month's commission lines (manual bonuses are untouched).
router.post("/bonuses/import-commissions", async (req, res) => {
  try {
    const company = await companyFor(req, res, req.body?.company);
    if (!company) return;
    const period = validPeriod(req.body?.month, req.body?.year);
    if (!period) return res.status(400).json({ success: false, message: "A valid month and year are required" });
    const from = validPeriod(req.body?.commissionMonth ?? period.month, req.body?.commissionYear ?? period.year);
    if (!from) return res.status(400).json({ success: false, message: "Invalid commission month" });
    if (await closedRun(company._id, period.month, period.year)) {
      return res.status(409).json({ success: false, message: "Payroll for this month is completed" });
    }
    const salesPeriod = `${from.year}-${String(from.month).padStart(2, "0")}`;
    const perf = await require("../services/salesRepService").performance(company._id, salesPeriod);

    const imported = [];
    const skipped = [];
    const label = `Commission ${String(from.month).padStart(2, "0")}/${from.year}`;
    for (const row of perf.rows) {
      const repName = `${row.rep.firstName || ""} ${row.rep.lastName || ""}`.trim();
      const user = await User.findById(row.rep._id).select("employee");
      const employee = user?.employee ? await Employee.findOne({ _id: user.employee, company: company._id }).select("_id firstName lastName") : null;
      if (!employee) {
        if (row.commission > 0) skipped.push({ rep: repName, commission: row.commission, reason: "no_employee" });
        continue;
      }
      await PayrollBonus.deleteMany({ company: company._id, employee: employee._id, ...period, source: "commission" });
      if (!(row.commission > 0)) continue;
      const bonus = await PayrollBonus.create({
        company: company._id, employee: employee._id, ...period, label, amount: round2(row.commission), kind: "taxable",
        source: "commission", createdBy: req.user.id, updatedBy: req.user.id,
        details: { salesPeriod, base: row.commissionBase, baseAmount: row.commissionBaseAmount, rate: row.commissionRate, targetBonus: row.bonus, invoicedHT: row.invoicedHT },
      });
      imported.push({ _id: bonus._id, employee: employee._id, name: `${employee.firstName} ${employee.lastName}`, amount: bonus.amount, details: bonus.details });
    }
    await logAudit(req, { company: company._id, action: "create", resourceType: "PayrollBonus", resourceId: company._id, resourceLabel: `${label} → ${period.month}/${period.year} (${imported.length})` });
    await refreshDraft(company._id, period.month, period.year, req.user.id);
    res.json({ success: true, data: { imported, skipped, salesPeriod, total: round2(imported.reduce((t, b) => t + b.amount, 0)) } });
  } catch (error) {
    console.error("POST import commissions error:", error);
    res.status(500).json({ success: false, message: "Error importing commissions", error: error.message });
  }
});

module.exports = router;
