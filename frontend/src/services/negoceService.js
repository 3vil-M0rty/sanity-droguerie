import api from "./api";
import { downloadBlob, normalizeBlobError } from "../utils/download";

// Sanity — négoce API: dépôts, marques, articles, stock, tarifs,
// commandes, BL & tournées, caisse, commerciaux, tableau de bord.

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, v); });
  return p.toString();
};
const data = (r) => r.data.data;

async function openPdf(url, fileName) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    downloadBlob(res.data, fileName);
  } catch (err) {
    throw await normalizeBlobError(err);
  }
}
async function downloadXlsx(url, fileName) {
  try {
    const res = await api.get(url, { responseType: "blob" });
    downloadBlob(res.data, fileName);
  } catch (err) {
    throw await normalizeBlobError(err);
  }
}

// ---------- dashboard
export const getDashboard = async (companyId) => data(await api.get(`/dashboard?${qs({ companyId })}`));
export const getAnalytics = async (companyId, fresh = false) => data(await api.get(`/dashboard/analytics?${qs({ companyId, fresh: fresh ? "1" : "" })}`));

// ---------- warehouses
export const getWarehouses = async (companyId) => data(await api.get(`/warehouses?${qs({ companyId })}`)) || [];
export const createWarehouse = async (body) => data(await api.post("/warehouses", body));
export const updateWarehouse = async (id, body) => data(await api.put(`/warehouses/${id}`, body));
export const setDefaultWarehouse = async (id) => data(await api.patch(`/warehouses/${id}/default`));
export const deleteWarehouse = async (id) => (await api.delete(`/warehouses/${id}`)).data;

// ---------- brands
export const getBrands = async (companyId) => data(await api.get(`/brands?${qs({ companyId })}`)) || [];
export const createBrand = async (body) => data(await api.post("/brands", body));
export const updateBrand = async (id, body) => data(await api.put(`/brands/${id}`, body));
export const deleteBrand = async (id) => (await api.delete(`/brands/${id}`)).data;

// ---------- articles
export const listArticles = async (params) => {
  const r = await api.get(`/products?${qs(params)}`);
  return { articles: r.data.data || [], pagination: r.data.pagination, amountsHidden: !!r.data.amountsHidden };
};
export const searchArticles = async (companyId, q, limit) => data(await api.get(`/products/suggestions?${qs({ companyId, q, limit })}`)) || [];
// Light fields of articles already known by id (lines of a document) — at most 100 per call.
export const getArticlesBrief = async (companyId, ids) => (ids.length ? data(await api.get(`/products/brief?${qs({ companyId, ids: ids.join(",") })}`)) || [] : []);
export const lookupBarcode = async (companyId, code) => data(await api.get(`/products/lookup?${qs({ companyId, code })}`));
export const getArticle = async (id) => data(await api.get(`/products/${id}`));
export const getArticlePrice = async (id, customer, unit) => data(await api.get(`/products/${id}/price?${qs({ customer, unit })}`));
export const getArticleMovements = async (id, warehouse) => data(await api.get(`/products/${id}/movements?${qs({ warehouse })}`)) || [];
export const getArticleLots = async (id, warehouse) => data(await api.get(`/products/${id}/lots?${qs({ warehouse })}`)) || [];
export const getSupplierPrices = async (id) => data(await api.get(`/products/${id}/supplier-prices`));
export const createArticle = async (body) => data(await api.post("/products", body));
export const updateArticle = async (id, body) => data(await api.put(`/products/${id}`, body));
export const createVariants = async (id, combos) => data(await api.post(`/products/${id}/variants`, { combos }));
export const adjustStock = async (id, body) => data(await api.post(`/products/${id}/adjust`, body));
export const deleteArticle = async (id) => (await api.delete(`/products/${id}`)).data;

// ---------- stock
export const getStockLevels = async (params) => {
  const r = await api.get(`/stock/levels?${qs(params)}`);
  return { ...(r.data.data || {}), pagination: r.data.pagination, amountsHidden: !!r.data.amountsHidden };
};
export const getStockSummary = async (companyId) => {
  const r = await api.get(`/stock/summary?${qs({ companyId })}`);
  return { ...(r.data.data || {}), amountsHidden: !!r.data.amountsHidden };
};
export const updateStockLevel = async (productId, warehouseId, body) => data(await api.patch(`/stock/levels/${productId}/${warehouseId}`, body));
export const getValuation = async (params) => data(await api.get(`/stock/valuation?${qs(params)}`));
export const downloadValuation = (params) => downloadXlsx(`/stock/valuation?${qs({ ...params, format: "xlsx" })}`, "valorisation-stock.xlsx");
export const getMovements = async (params) => {
  const r = await api.get(`/stock/movements?${qs(params)}`);
  return { movements: r.data.data || [], pagination: r.data.pagination };
};
export const getExpiringLots = async (companyId, days) => data(await api.get(`/stock/expiring?${qs({ companyId, days })}`)) || [];
export const getTransfers = async (params) => data(await api.get(`/stock/transfers?${qs(params)}`)) || [];
export const getTransfer = async (id) => data(await api.get(`/stock/transfers/${id}`));
export const createTransfer = async (body) => data(await api.post("/stock/transfers", body));
export const sendTransfer = async (id) => data(await api.post(`/stock/transfers/${id}/send`));
export const receiveTransfer = async (id, lines) => data(await api.post(`/stock/transfers/${id}/receive`, { lines }));
export const cancelTransfer = async (id) => data(await api.post(`/stock/transfers/${id}/cancel`));
export const getCounts = async (params) => data(await api.get(`/stock/counts?${qs(params)}`)) || [];
export const getCount = async (id) => data(await api.get(`/stock/counts/${id}`));
export const createCount = async (body) => data(await api.post("/stock/counts", body));
export const saveCount = async (id, lines) => data(await api.put(`/stock/counts/${id}`, { lines }));
export const validateCount = async (id, body = {}) => data(await api.post(`/stock/counts/${id}/validate`, body));
export const cancelCount = async (id) => data(await api.post(`/stock/counts/${id}/cancel`));

// ---------- pricing
export const getSalesSettings = async (companyId) => data(await api.get(`/sales-settings?${qs({ companyId })}`));
export const saveSalesSettings = async (companyId, body) => data(await api.put(`/sales-settings?${qs({ companyId })}`, body));
export const getPriceList = async (params) => data(await api.get(`/sales-settings/price-list?${qs(params)}`));
export const downloadPriceList = (params) => downloadXlsx(`/sales-settings/price-list?${qs({ ...params, format: "xlsx" })}`, `tarif${params.level ? `-${params.level}` : ""}.xlsx`);
export const bulkPrices = async (body) => data(await api.post("/sales-settings/bulk-prices", body));

// ---------- customers (négoce extras)
export const getWalkInCustomer = async (companyId) => data(await api.get(`/customers/walk-in?${qs({ companyId })}`));
export const getCustomerStatement = async (id, params) => data(await api.get(`/customers/${id}/statement?${qs(params)}`));
export const blockCustomer = async (id, blocked, reason) => data(await api.patch(`/customers/${id}/block`, { blocked, reason }));

// ---------- sales orders
export const getSalesOrders = async (params) => {
  const r = await api.get(`/sales-orders?${qs(params)}`);
  return { orders: r.data.data || [], pagination: r.data.pagination };
};
export const getSalesOrder = async (id) => data(await api.get(`/sales-orders/${id}`));
export const createSalesOrder = async (body) => (await api.post("/sales-orders", body)).data;
export const updateSalesOrder = async (id, body) => data(await api.put(`/sales-orders/${id}`, body));
export const deleteSalesOrder = async (id) => (await api.delete(`/sales-orders/${id}`)).data;
export const confirmSalesOrder = async (id, body = {}) => data(await api.post(`/sales-orders/${id}/confirm`, body));
export const cancelSalesOrder = async (id, reason) => data(await api.post(`/sales-orders/${id}/cancel`, { reason }));
export const deliverSalesOrder = async (id, body) => data(await api.post(`/sales-orders/${id}/deliver`, body));
export const downloadOrderPdf = (o) => openPdf(`/sales-orders/${o._id}/pdf`, `${o.number}.pdf`);
export const quoteToOrder = async (quoteId, body = {}) => data(await api.post(`/quotes/${quoteId}/order`, body));

// ---------- delivery notes & rounds
export const getDeliveryNotes = async (params) => data(await api.get(`/logistics/delivery-notes?${qs(params)}`)) || [];
export const getDeliveryNote = async (id) => data(await api.get(`/logistics/delivery-notes/${id}`));
export const createDeliveryNote = async (body) => data(await api.post("/logistics/delivery-notes", body));
export const updateDeliveryNote = async (id, body) => data(await api.put(`/logistics/delivery-notes/${id}`, body));
export const validateDeliveryNote = async (id, body = {}) => data(await api.post(`/logistics/delivery-notes/${id}/validate`, body));
export const deliverDeliveryNote = async (id, body) => data(await api.post(`/logistics/delivery-notes/${id}/deliver`, body));
export const cancelDeliveryNote = async (id, reason) => data(await api.post(`/logistics/delivery-notes/${id}/cancel`, { reason }));
export const deleteDeliveryNote = async (id) => (await api.delete(`/logistics/delivery-notes/${id}`)).data;
export const downloadDeliveryNotePdf = (n, valued = false) => openPdf(`/logistics/delivery-notes/${n._id}/pdf?${qs({ valued: valued ? "true" : "" })}`, `${n.number}.pdf`);
export const invoiceDeliveryNotes = async (ids) => data(await api.post("/logistics/delivery-notes/invoice", { ids }));
export const getRounds = async (params) => data(await api.get(`/logistics/rounds?${qs(params)}`)) || [];
export const getRound = async (id) => data(await api.get(`/logistics/rounds/${id}`));
export const createRound = async (body) => data(await api.post("/logistics/rounds", body));
export const updateRound = async (id, body) => data(await api.put(`/logistics/rounds/${id}`, body));
export const startRound = async (id, body = {}) => data(await api.post(`/logistics/rounds/${id}/start`, body));
export const finishRound = async (id, body) => data(await api.post(`/logistics/rounds/${id}/finish`, body));
export const cancelRound = async (id) => data(await api.post(`/logistics/rounds/${id}/cancel`));

// ---------- point of sale
export const getCurrentSession = async (companyId) => data(await api.get(`/pos/sessions/current?${qs({ companyId })}`));
export const getSessions = async (params) => data(await api.get(`/pos/sessions?${qs(params)}`)) || [];
export const getSession = async (id) => data(await api.get(`/pos/sessions/${id}`));
export const openSession = async (body) => data(await api.post("/pos/sessions/open", body));
export const cashMove = async (id, body) => data(await api.post(`/pos/sessions/${id}/cash-move`, body));
export const closeSession = async (id, body) => data(await api.post(`/pos/sessions/${id}/close`, body));
export const getPosSales = async (params) => data(await api.get(`/pos/sales?${qs(params)}`)) || [];
export const getPosSale = async (id) => data(await api.get(`/pos/sales/${id}`));
export const createPosSale = async (body) => data(await api.post("/pos/sales", body));
export const refundPosSale = async (id, reason) => data(await api.post(`/pos/sales/${id}/refund`, { reason }));

// ---------- sales reps
export const getReps = async (companyId) => data(await api.get(`/sales-reps?${qs({ companyId })}`)) || [];
export const getPerformance = async (params) => data(await api.get(`/sales-reps/performance?${qs(params)}`));
export const getTargets = async (params) => data(await api.get(`/sales-reps/targets?${qs(params)}`)) || [];
export const saveTarget = async (body) => data(await api.put("/sales-reps/targets", body));
export const getCollections = async (params) => data(await api.get(`/sales-reps/collections?${qs(params)}`));
export const addCollectionAction = async (invoiceId, body) => data(await api.post(`/sales-reps/collections/${invoiceId}/actions`, body));

// Barcode labels (PDF): { companyId, items: [{ product, copies }], format: "roll" | "a4", skip? }
export const printLabels = async (body) => (await api.post("/products/labels", body, { responseType: "blob" })).data;
