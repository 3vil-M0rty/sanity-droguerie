const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Salary = require("../models/Salary");
const Employee = require("../models/Employee");
const Company = require("../models/Company");

const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const {
  requireHRAccess,
  requireAdmin,
} = require("../middleware/permissionMiddleware");
const { canAccessHRForCompany } = require("../permissions/permissions");
const { has: hasPerm } = require("../services/permissionService");
const { findMatchingEmployeeIds } = require("../utils/employeeSearch");
const calc = require("../services/payrollCalculationService");

// Every route below the module-wide requireHRAccess check applies
// to the whole HR module. Company-level scoping for owners (an
// owner may only touch companies they own) is still checked
// per-record via canAccessHRForCompany.
// Fine-grained permissions of every endpoint: config/routePermissions.js
router.use(auth, guard(ROUTE_PERMISSIONS.salaries));
router.use(auth, requireHRAccess);

const canManage = (req, company) => canAccessHRForCompany(req.user, company);

// ======================================================
// SALARY SIMULATOR — base → net and net → base
// POST /api/salaries/simulate
// body: { mode: "base" | "net", amount, allowances: [{label, amount, kind}],
//         numberOfDependents, seniorityYears | employeeId, cimrEmployeeRate,
//         cimrEmployerRate, year, asOf (effective date → seniority and
//         family-deduction year as of the end of that month),
//         bonus: { amount, mode: "gross" | "net", kind } (one-off bonus) }
// Runs the SAME calculation as the monthly payroll run, so the base
// found for a negotiated net pays exactly that net on the payslip.
// Nothing is saved.
// ======================================================

router.post("/simulate", async (req, res) => {
  try {
    const {
      mode = "base",
      amount,
      allowances = [],
      numberOfDependents,
      seniorityYears,
      employeeId,
      cimrEmployeeRate,
      cimrEmployerRate,
      year,
      asOf,
      bonus,
    } = req.body || {};

    const value = Number(amount);
    if (!["base", "net"].includes(mode) || !Number.isFinite(value) || value < 0 || value > 10000000) {
      return res.status(400).json({ success: false, message: "A valid mode (base | net) and amount are required" });
    }
    const cleanAllowances = (Array.isArray(allowances) ? allowances : [])
      .filter((a) => a && Number(a.amount) > 0)
      .map((a) => ({ label: String(a.label || "Indemnité").slice(0, 80), amount: Number(a.amount), kind: a.kind }));

    let employee = null;
    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ success: false, message: "Invalid employee" });
      }
      employee = await Employee.findById(employeeId).select("company hireDate numberOfDependents firstName lastName");
      if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
      const companyDoc = await Company.findById(employee.company);
      if (!companyDoc || !canManage(req, companyDoc)) {
        return res.status(403).json({ success: false, message: "Not authorized for this employee" });
      }
    }

    // Seniority as the payroll run sees it: at the end of the month
    // the salary applies to (asOf = effective date, default today).
    const asOfDate = asOf && !Number.isNaN(new Date(asOf).getTime()) ? new Date(asOf) : new Date();
    const monthEnd = new Date(asOfDate.getFullYear(), asOfDate.getMonth() + 1, 0);
    const years = seniorityYears !== undefined && seniorityYears !== null && seniorityYears !== ""
      ? Math.max(0, Number(seniorityYears) || 0)
      : calc.completedYears(employee?.hireDate, monthEnd);
    const seniorityRate = calc.hasManualSeniority(cleanAllowances) ? 0 : calc.seniorityRateForYears(years);
    const rate = (r) => (r === undefined || r === null || r === "" ? undefined : Math.min(0.2, Math.max(0, Number(r) / 100)));

    const input = {
      allowances: cleanAllowances,
      numberOfDependents: numberOfDependents ?? employee?.numberOfDependents ?? 0,
      year: Number(year) || monthEnd.getFullYear(),
      seniorityRate,
      cimrEmployeeRate: rate(cimrEmployeeRate),
      cimrEmployerRate: rate(cimrEmployerRate),
    };

    const result = mode === "net"
      ? calc.baseFromNet({ targetNet: value, ...input })
      : { baseSalary: value, payslip: calc.calculatePayslip({ ...input, baseSalary: value }) };

    // One-off bonus (prime exceptionnelle) on top of this salary:
    // bonus.mode "gross" (amount paid by the company) or "net" (amount
    // the employee should receive).
    let bonusResult = null;
    const bonusAmount = Number(bonus?.amount);
    if (bonus && Number.isFinite(bonusAmount) && bonusAmount > 0 && bonusAmount <= 10000000) {
      const bonusInput = {
        ...input,
        baseSalary: result.baseSalary,
        bonusKind: calc.EXEMPT_KINDS.includes(bonus.kind) ? bonus.kind : "taxable",
      };
      const effect = bonus.mode === "net"
        ? calc.bonusGrossFromNet({ ...bonusInput, targetNet: bonusAmount })
        : calc.bonusEffect({ ...bonusInput, bonusGross: bonusAmount });
      bonusResult = {
        mode: bonus.mode === "net" ? "net" : "gross",
        gross: effect.gross,
        net: effect.net,
        cnss: effect.cnss,
        amo: effect.amo,
        incomeTax: effect.incomeTax,
        employerCost: effect.employerCost,
        monthNet: effect.withBonus.netSalary,
      };
    }

    const payrollConfig = require("../config/payrollConfig");
    res.json({
      success: true,
      data: {
        mode,
        target: mode === "net" ? value : null,
        baseSalary: result.baseSalary,
        seniorityYears: years,
        payslip: result.payslip,
        bonus: bonusResult,
        belowSmig: result.baseSalary + result.payslip.seniorityAmount < payrollConfig.SMIG_MONTHLY_APPROX,
        smig: payrollConfig.SMIG_MONTHLY_APPROX,
        caps: Object.fromEntries(calc.EXEMPT_KINDS.map((k) => [k, calc.exemptCap(k, { baseSalary: result.baseSalary })])),
      },
    });
  } catch (error) {
    console.error("POST salary simulate error:", error);
    res.status(500).json({ success: false, message: "Error simulating salary", error: error.message });
  }
});

// ======================================================
// GET ALL SALARY RECORDS
// GET /api/salaries?companyId=&employeeId=&search=&current=true&page=&limit=
// ======================================================

router.get("/", async (req, res) => {
  try {
    const {
      companyId,
      employeeId,
      search,
      current,
      page = 1,
      limit = 20,
    } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid companyId",
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!canManage(req, company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view salaries of this company",
      });
    }

    const filter = { company: companyId };

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employeeId",
        });
      }

      filter.employee = employeeId;
    } else if (search) {
      filter.employee = { $in: await findMatchingEmployeeIds(companyId, search) };
    }

    // "current" = only the active salary record per employee
    // (the one with no endDate yet).
    if (current === "true") {
      filter.endDate = null;
    }

    const currentPage = Math.max(Number(page), 1);
    const currentLimit = Math.max(Number(limit), 1);
    const skip = (currentPage - 1) * currentLimit;

    const [salaries, total] = await Promise.all([
      Salary.find(filter)
        .populate("employee", "firstName lastName employeeNumber jobTitle photo hireDate numberOfDependents")
        .sort({ effectiveDate: -1 })
        .skip(skip)
        .limit(currentLimit),

      Salary.countDocuments(filter),
    ]);

    // Real monthly payslip figures (CNSS, AMO, IR, ancienneté,
    // exempt allowances) — the same calculation as the payroll run,
    // for a full month without absences or overtime.
    const today = new Date();
    const year = today.getFullYear();
    const monthEnd = new Date(year, today.getMonth() + 1, 0);
    const data = salaries.map((salary) => {
      const json = salary.toJSON();
      const slip = calc.calculatePayslip({
        baseSalary: salary.baseSalary,
        allowances: salary.allowances,
        numberOfDependents: salary.employee?.numberOfDependents || 0,
        year,
        seniorityRate: calc.hasManualSeniority(salary.allowances) ? 0 : calc.seniorityRateFor(salary.employee?.hireDate, monthEnd),
      });
      json.payroll = { grossSalary: slip.grossSalary, netSalary: slip.netSalary, incomeTax: slip.incomeTax, seniorityAmount: slip.seniorityAmount, totalEmployerCost: slip.employer.totalEmployerCost };
      return json;
    });

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        pages: Math.ceil(total / currentLimit) || 1,
      },
    });
  } catch (error) {
    console.error("GET salaries error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching salaries",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE SALARY RECORD
// GET /api/salaries/:id
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary ID",
      });
    }

    const salary = await Salary.findById(req.params.id)
      .populate("company", "name")
      .populate("employee", "firstName lastName employeeNumber jobTitle photo");

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (!canManage(req, salary.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this salary record",
      });
    }

    res.json({ success: true, data: salary });
  } catch (error) {
    console.error("GET salary error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching salary record",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE SALARY RECORD (a raise / new salary period)
// POST /api/salaries
//
// Automatically closes off whichever salary record was
// previously "current" (endDate: null) for this employee, by
// setting its endDate to the new record's effectiveDate — so
// callers never manage that by hand and history is never lost.
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      company,
      employee,
      baseSalary,
      allowances,
      deductions,
      currency,
      effectiveDate,
      notes,
    } = req.body;

    if (!company || !mongoose.Types.ObjectId.isValid(company)) {
      return res.status(400).json({
        success: false,
        message: "A valid company is required",
      });
    }

    if (!employee || !mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({
        success: false,
        message: "A valid employee is required",
      });
    }

    if (baseSalary === undefined || baseSalary === null || Number(baseSalary) < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid base salary is required",
      });
    }

    if (!effectiveDate) {
      return res.status(400).json({
        success: false,
        message: "Effective date is required",
      });
    }

    const companyDoc = await Company.findById(company);

    if (!companyDoc) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!canManage(req, companyDoc)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create a salary record for this company",
      });
    }

    if (!hasPerm(req.user, "hr.salaries.create")) {
      return res.status(403).json({
        success: false,
        message: "Managing salaries requires Responsable RH authority or higher",
      });
    }

    const employeeDoc = await Employee.findOne({ _id: employee, company });

    if (!employeeDoc) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in this company",
      });
    }

    const newEffectiveDate = new Date(effectiveDate);

    // Close off the previously-current record, if any.
    await Salary.updateMany(
      { employee, endDate: null },
      { $set: { endDate: newEffectiveDate, updatedBy: req.user.id } }
    );

    const salary = await Salary.create({
      company,
      employee,
      baseSalary,
      allowances: allowances || [],
      deductions: deductions || [],
      currency: currency || "MAD",
      effectiveDate: newEffectiveDate,
      endDate: null,
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    const populated = await salary.populate(
      "employee",
      "firstName lastName employeeNumber jobTitle photo"
    );

    res.status(201).json({
      success: true,
      data: populated,
      message: "Salary record created successfully",
    });
  } catch (error) {
    console.error("POST salary error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating salary record",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE SALARY RECORD
// PUT /api/salaries/:id
// (Corrections to an existing record — NOT how you give a raise;
// use POST / for that so history stays intact.)
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary ID",
      });
    }

    const salary = await Salary.findById(req.params.id).populate("company");

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (!canManage(req, salary.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this salary record",
      });
    }

    if (!hasPerm(req.user, "hr.salaries.edit")) {
      return res.status(403).json({
        success: false,
        message: "Managing salaries requires Responsable RH authority or higher",
      });
    }

    const {
      baseSalary,
      allowances,
      deductions,
      currency,
      effectiveDate,
      endDate,
      notes,
    } = req.body;

    if (baseSalary !== undefined) salary.baseSalary = baseSalary;
    if (allowances !== undefined) salary.allowances = allowances;
    if (deductions !== undefined) salary.deductions = deductions;
    if (currency !== undefined) salary.currency = currency;
    if (effectiveDate !== undefined) salary.effectiveDate = effectiveDate;
    if (endDate !== undefined) salary.endDate = endDate;
    if (notes !== undefined) salary.notes = notes;

    salary.updatedBy = req.user.id;

    await salary.save();

    const populated = await salary.populate(
      "employee",
      "firstName lastName employeeNumber jobTitle photo"
    );

    res.json({
      success: true,
      data: populated,
      message: "Salary record updated successfully",
    });
  } catch (error) {
    console.error("PUT salary error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating salary record",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE SALARY RECORD
// DELETE /api/salaries/:id
//
// Restricted to platform admins — salary records are a sensitive
// historical/compliance trail, so even an owner or HR-department
// user (who can otherwise manage salaries freely) can't erase one.
// ======================================================

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary ID",
      });
    }

    const salary = await Salary.findById(req.params.id).populate("company");

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary record not found",
      });
    }

    if (!canManage(req, salary.company)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this salary record",
      });
    }

    await Salary.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Salary record deleted successfully",
      salaryId: salary._id,
    });
  } catch (error) {
    console.error("DELETE salary error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting salary record",
      error: error.message,
    });
  }
});

module.exports = router;
