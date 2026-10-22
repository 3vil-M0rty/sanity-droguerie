import api from "./api";
import { downloadBlob, normalizeBlobError } from "../utils/download";

// API of the features added on top of the négoce core: accounting & VAT,
// e-invoicing, Excel import, WhatsApp, cheques & LCN, promotions & RFA,
// purchase forecast, landed costs, field app, reseller portal (office side).

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, v); });
  return p.toString();
};
const data = (r) => r.data.data;
async function download(url, fileName) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    downloadBlob(res.data, fileName);
  } catch (err) {
    throw await normalizeBlobError(err);
  }
}

// ---------- accounting & VAT
export const getAccountingSettings = async (companyId) => data(await api.get(`/accounting/settings?${qs({ companyId })}`));
export const saveAccountingSettings = async (companyId, body) => data(await api.put(`/accounting/settings?${qs({ companyId })}`, body));
export const getJournal = async (params) => data(await api.get(`/accounting/journal?${qs(params)}`));
export const downloadJournal = (params, format) => download(`/accounting/journal?${qs({ ...params, format })}`, `ecritures-${params.from}-${params.to}${format === "sage" ? "-sage" : ""}.${format === "xlsx" ? "xlsx" : "csv"}`);
export const getVat = async (params) => data(await api.get(`/accounting/vat?${qs(params)}`));
export const downloadVat = (params) => download(`/accounting/vat?${qs({ ...params, format: "xlsx" })}`, `tva-${params.from}-${params.to}.xlsx`);

// ---------- e-invoicing
export const getEInvoice = async (id) => data(await api.get(`/sales-invoices/${id}/einvoice`));
export const submitEInvoice = async (id, force = false) => {
  try {
    return data(await api.post(`/sales-invoices/${id}/einvoice`, { force }));
  } catch (err) {
    if (err.response?.data?.check) err.check = err.response.data.check;
    throw err;
  }
};
export const refreshEInvoice = async (id) => data(await api.post(`/sales-invoices/${id}/einvoice/refresh`));
export const downloadUbl = (inv) => download(`/sales-invoices/${inv._id}/ubl`, `${inv.number || "facture"}.xml`);

// ---------- Excel import (articles | customers | stock)
export const downloadImportTemplate = (kind, companyId) => download(`/imports/${kind}/template?${qs({ companyId })}`, `modele-import-${kind}.xlsx`);
const upload = async (kind, step, companyId, file) => {
  const form = new FormData();
  form.append("file", file);
  return data(await api.post(`/imports/${kind}/${step}?${qs({ companyId })}`, form));
};
export const previewImport = (kind, companyId, file) => upload(kind, "preview", companyId, file);
export const commitImport = (kind, companyId, file) => upload(kind, "commit", companyId, file);

// ---------- WhatsApp
export const getWhatsAppStatus = async () => data(await api.get("/messaging/status"));
export const getMessagingSettings = async (companyId) => data(await api.get(`/messaging/settings?${qs({ companyId })}`));
export const saveMessagingSettings = async (companyId, whatsapp) => data(await api.put(`/messaging/settings?${qs({ companyId })}`, { whatsapp }));
export const whatsappInvoice = async (id, body) => data(await api.post(`/messaging/invoices/${id}/whatsapp`, body));
export const whatsappStatement = async (customerId, body) => data(await api.post(`/messaging/customers/${customerId}/statement/whatsapp`, body));
export const getReminders = async (companyId, minDays) => data(await api.get(`/messaging/reminders?${qs({ companyId, minDays })}`));
export const sendReminders = async (body) => data(await api.post("/messaging/reminders", body));
export const getMessageLog = async (params) => data(await api.get(`/messaging/log?${qs(params)}`)) || [];
export const downloadStatementPdf = (customer, from, to) => download(`/customers/${customer._id}/statement/pdf?${qs({ from, to })}`, `releve-${customer.code || "client"}.pdf`);

// ---------- cheques & LCN
export const getPortfolio = async (params) => data(await api.get(`/portfolio?${qs(params)}`));
export const getDepositSlips = async (companyId) => data(await api.get(`/portfolio/deposits?${qs({ companyId })}`)) || [];
export const createDepositSlip = async (body) => data(await api.post("/portfolio/deposits", body));
export const downloadDepositSlip = (slip) => download(`/portfolio/deposits/${slip._id}/pdf`, `${slip.number}.pdf`);
export const clearDepositSlip = async (id, date) => data(await api.post(`/portfolio/deposits/${id}/clear`, { date }));
export const clearInstrument = async (id, date) => data(await api.post(`/portfolio/${id}/clear`, { date }));
export const markUnpaid = async (id, body) => (await api.post(`/portfolio/${id}/unpaid`, body)).data;

// ---------- promotions & RFA
export const getPromotions = async (companyId, status) => data(await api.get(`/promotions?${qs({ companyId, status })}`)) || [];
export const savePromotion = async (body) => data(body._id ? await api.put(`/promotions/${body._id}`, body) : await api.post("/promotions", body));
export const deletePromotion = async (id) => (await api.delete(`/promotions/${id}`)).data;
export const getRebates = async (companyId) => data(await api.get(`/promotions/rebates?${qs({ companyId })}`)) || [];
export const saveRebate = async (body) => data(body._id ? await api.put(`/promotions/rebates/${body._id}`, body) : await api.post("/promotions/rebates", body));
export const deleteRebate = async (id) => (await api.delete(`/promotions/rebates/${id}`)).data;
export const getRebateProgress = async (id) => data(await api.get(`/promotions/rebates/${id}/progress`));
export const settleRebate = async (id, customers) => data(await api.post(`/promotions/rebates/${id}/settle`, { customers }));

// ---------- purchase forecast & landed costs
export const getForecast = async (params) => data(await api.get(`/purchase-orders/reports/forecast?${qs(params)}`));
export const ordersFromForecast = async (body) => data(await api.post("/purchase-orders/from-forecast", body));
export const previewLandedCost = async (orderId, body) => data(await api.post(`/purchase-orders/${orderId}/receptions/landed-preview`, body));
export const addLateCosts = async (orderId, receptionId, body) => data(await api.post(`/purchase-orders/${orderId}/receptions/${receptionId}/costs`, body));

// ---------- field app (office side) & proof of delivery
export const getVisits = async (params) => data(await api.get(`/field/visits?${qs(params)}`));
export const getDeliveryProof = async (noteId) => data(await api.get(`/field/deliveries/${noteId}/proof`));

// ---------- reseller portal (office side)
export const getPortalSettings = async (companyId) => data(await api.get(`/portal-admin/settings?${qs({ companyId })}`));
export const savePortalSettings = async (companyId, portal) => data(await api.put(`/portal-admin/settings?${qs({ companyId })}`, { portal }));
export const getPortalAccounts = async (companyId, customer) => data(await api.get(`/portal-admin/accounts?${qs({ companyId, customer })}`)) || [];
export const createPortalAccount = async (body) => data(await api.post("/portal-admin/accounts", body));
export const updatePortalAccount = async (id, body) => data(await api.put(`/portal-admin/accounts/${id}`, body));
export const deletePortalAccount = async (id) => (await api.delete(`/portal-admin/accounts/${id}`)).data;
