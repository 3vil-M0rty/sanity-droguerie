import api from "./api";

// Sanity Droguerie — the shop edition's one-step routes (backend routes/droguerie.js).
const data = (res) => res.data.data;
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();

export const getShopHome = async (companyId) => data(await api.get(`/droguerie/home?${qs({ companyId })}`));
export const getCarnet = async (companyId, { search, all } = {}) => data(await api.get(`/droguerie/carnet?${qs({ companyId, search, all: all ? "true" : "" })}`));
export const getCarnetAccount = async (customerId) => data(await api.get(`/droguerie/carnet/${customerId}`));
export const payCarnet = async (customerId, body) => data(await api.post(`/droguerie/carnet/${customerId}/payment`, body));
export const getShopSuppliers = async (companyId) => data(await api.get(`/droguerie/suppliers?${qs({ companyId })}`));
export const paySupplier = async (supplierId, body) => data(await api.post(`/droguerie/suppliers/${supplierId}/payment`, body));
export const quickArticle = async (body) => data(await api.post("/droguerie/articles/quick", body));
export const quickPurchase = async (body) => data(await api.post("/droguerie/purchases", body));

/**
 * Sends the customer their carnet reminder (with their statement PDF link) through the
 * backend: WhatsApp Business API when it is configured, else the answer carries a
 * wa.me `url` for the browser to open.
 */
export const sendCarnetWhatsapp = async (customerId, message) => data(await api.post(`/messaging/customers/${customerId}/statement/whatsapp`, { message }));

/** wa.me link with a polite reminder of what the customer owes. */
export function whatsappReminder(phone, text) {
  let n = String(phone || "").replace(/[^\d+]/g, "");
  if (!n) return null;
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = `212${n.slice(1)}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
