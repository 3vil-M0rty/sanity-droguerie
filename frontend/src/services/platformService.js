import api from "./api";

// Platform operator (client management) — see backend routes/platform.js.

export const getClients = async () => (await api.get("/platform/tenants")).data.data || [];
export const getClient = async (id) => (await api.get(`/platform/tenants/${id}`)).data.data;
// data: { name, notes, admin: { firstName, lastName, email, password } }
export const createClient = async (data) => (await api.post("/platform/tenants", data)).data.data;
// data: { name?, notes?, status?: "active" | "suspended" }
export const updateClient = async (id, data) => (await api.patch(`/platform/tenants/${id}`, data)).data.data;
export const recountClientStorage = async (id) => (await api.post(`/platform/tenants/${id}/storage/recount`)).data.data;
export const addClientAdmin = async (id, data) => (await api.post(`/platform/tenants/${id}/admins`, data)).data.data;
export const getOrphans = async () => (await api.get("/platform/orphans")).data.data || { companies: [], users: [] };
export const assignOrphans = async (data) => (await api.post("/platform/orphans/assign", data)).data.data;
// data: { name, legalForm?, industry?, city?, ice? } — a client can have several companies
export const addClientCompany = async (id, data) => (await api.post(`/platform/tenants/${id}/companies`, data)).data.data;

// Error monitoring (backend services/monitoringService.js).
export const getErrorEvents = async ({ status = "open", source = "" } = {}) =>
  (await api.get(`/platform/errors?status=${status}${source ? `&source=${source}` : ""}`)).data.data;
export const setErrorStatus = async (id, status) => (await api.patch(`/platform/errors/${id}`, { status })).data.data;
export const deleteErrorEvent = async (id) => (await api.delete(`/platform/errors/${id}`)).data;
export const getBackups = async () => (await api.get("/platform/backups")).data.data;

// Billing the clients (backend routes/billing.js).
const B = "/platform/billing";
export const getBillingSettings = async () => (await api.get(`${B}/settings`)).data.data;
export const saveBillingSettings = async (data) => (await api.put(`${B}/settings`, data)).data.data;
export const getPlans = async () => (await api.get(`${B}/plans`)).data.data || [];
export const createPlan = async (data) => (await api.post(`${B}/plans`, data)).data.data;
export const updatePlan = async (id, data) => (await api.put(`${B}/plans/${id}`, data)).data.data;
export const getSubscriptions = async () => (await api.get(`${B}/subscriptions`)).data.data || [];
export const saveSubscription = async (tenantId, data) => (await api.put(`${B}/subscriptions/${tenantId}`, data)).data.data;
export const getPlatformInvoices = async (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return (await api.get(`${B}/invoices${q ? `?${q}` : ""}`)).data.data || [];
};
export const generateInvoices = async (period, issue = false) => (await api.post(`${B}/invoices/generate`, { period, issue })).data.data;
export const createPlatformInvoice = async (data) => (await api.post(`${B}/invoices`, data)).data.data;
export const issuePlatformInvoice = async (id) => (await api.post(`${B}/invoices/${id}/issue`)).data.data;
export const payPlatformInvoice = async (id, data) => (await api.post(`${B}/invoices/${id}/payments`, data)).data.data;
export const creditPlatformInvoice = async (id, reason) => (await api.post(`${B}/invoices/${id}/credit-note`, { reason })).data.data;
export const deletePlatformInvoice = async (id) => (await api.delete(`${B}/invoices/${id}`)).data;
export const downloadPlatformInvoice = async (id, number) => {
  const res = await api.get(`${B}/invoices/${id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${number || "brouillon"}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
export const refreshStandings = async () => (await api.post(`${B}/refresh`)).data.data;
export const loadDefaultCatalog = async () => (await api.post(`${B}/plans/defaults`)).data.data;
export const createSetupInvoice = async (tenantId, discountPct = 0) => (await api.post(`${B}/subscriptions/${tenantId}/setup-invoice`, { discountPct })).data.data;
export const downloadPriceList = async (edition) => {
  const res = await api.get(`${B}/price-list.pdf${edition ? `?edition=${edition}` : ""}`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Sanity${edition === "droguerie" ? "-Droguerie" : ""}-grille-tarifaire-${new Date().toISOString().slice(0, 7)}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
