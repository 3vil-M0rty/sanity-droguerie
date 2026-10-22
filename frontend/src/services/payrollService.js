import api from "./api";
import { downloadBlob, normalizeBlobError } from "../utils/download";

// ---------- Payroll runs ----------

export const getPayrollRuns = async ({ companyId, year, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (companyId) params.append("companyId", companyId);
  if (year) params.append("year", year);
  params.append("page", page);
  params.append("limit", limit);

  const response = await api.get(`/payroll/runs?${params.toString()}`);
  return {
    runs: response.data.data || [],
    pagination: response.data.pagination || { total: 0, page: 1, limit, pages: 1 },
  };
};

export const getPayrollRunById = async (id) => {
  const response = await api.get(`/payroll/runs/${id}`);
  return response.data.data; // { run, payslips }
};

export const createPayrollRun = async ({ company, month, year }) => {
  const response = await api.post("/payroll/runs", { company, month, year });
  return response.data.data;
};

export const regeneratePayrollRun = async (id) => {
  const response = await api.post(`/payroll/runs/${id}/regenerate`);
  return response.data.data;
};

export const completePayrollRun = async (id) => {
  const response = await api.post(`/payroll/runs/${id}/complete`);
  return response.data.data;
};

export const deletePayrollRun = async (id) => {
  const response = await api.delete(`/payroll/runs/${id}`);
  return response.data;
};

// ---------- Payslips ----------

export const getPayslips = async ({ companyId, employeeId, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (companyId) params.append("companyId", companyId);
  if (employeeId) params.append("employeeId", employeeId);
  params.append("page", page);
  params.append("limit", limit);

  const response = await api.get(`/payroll/payslips?${params.toString()}`);
  return {
    payslips: response.data.data || [],
    pagination: response.data.pagination || { total: 0, page: 1, limit, pages: 1 },
  };
};

export const markPayslipPaid = async (id) => {
  const response = await api.patch(`/payroll/payslips/${id}/mark-paid`);
  return response.data.data;
};

// ---------- Downloads (PDF payslip, CSV exports) ----------

export const downloadPayslipPdf = async (id, filename = "bulletin.pdf") => {
  try {
    const response = await api.get(`/payroll/payslips/${id}/pdf`, {
      responseType: "blob",
    });
    downloadBlob(response.data, filename, true);
  } catch (err) {
    throw await normalizeBlobError(err);
  }
};

/**
 * `type` is one of: "cnss" | "register" | "bank-transfer"
 */
export const downloadPayrollExport = async (runId, type, filename) => {
  try {
    const response = await api.get(`/payroll/runs/${runId}/export/${type}`, {
      responseType: "blob",
    });
    downloadBlob(response.data, filename || `export-${type}.csv`, false);
  } catch (err) {
    throw await normalizeBlobError(err);
  }
};

// ======================================================
// MONTHLY VARIABLE BONUSES (primes du mois) + commissions import
// ======================================================

export const getPayrollBonuses = async ({ companyId, month, year }) => {
  const response = await api.get(`/payroll/bonuses?companyId=${companyId}&month=${month}&year=${year}`);
  return { bonuses: response.data.data || [], locked: !!response.data.locked, total: response.data.total || 0 };
};

export const createPayrollBonus = async (data) => (await api.post("/payroll/bonuses", data)).data.data;

export const updatePayrollBonus = async (id, data) => (await api.put(`/payroll/bonuses/${id}`, data)).data.data;

export const deletePayrollBonus = async (id) => (await api.delete(`/payroll/bonuses/${id}`)).data;

export const importCommissions = async (data) => (await api.post("/payroll/bonuses/import-commissions", data)).data.data;
