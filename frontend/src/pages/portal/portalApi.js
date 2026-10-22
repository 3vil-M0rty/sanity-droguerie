import axios from "axios";

// The reseller portal has its own session (not an internal login).
const KEY = "sanity.portal.token";
export const portalToken = {
  get: () => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } },
  set: (v) => { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch { /* private mode */ } },
};

const papi = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/portal` });
papi.interceptors.request.use((config) => {
  const token = portalToken.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const data = (r) => r.data.data;
export const portalLogin = async (email, password) => data(await papi.post("/login", { email, password }));
export const portalMe = async () => data(await papi.get("/me"));
// A password change ends the other sessions; keep this one with the fresh token.
export const portalPassword = async (current, next) => {
  const data = (await papi.post("/password", { current, next })).data;
  if (data?.token) portalToken.set(data.token);
  return data;
};
export const portalFamilies = async () => data(await papi.get("/families")) || [];
export const portalCatalogue = async (params) => data(await papi.get("/catalogue", { params }));
export const portalOrder = async (body) => data(await papi.post("/orders", body));
export const portalOrders = async () => data(await papi.get("/orders")) || [];
export const portalOrderDetail = async (id) => data(await papi.get(`/orders/${id}`));
export const portalInvoices = async () => data(await papi.get("/invoices")) || [];
async function blob(url, name) {
  const res = await papi.get(url, { responseType: "blob" });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(href);
}
export const portalInvoicePdf = (inv) => blob(`/invoices/${inv._id}/pdf`, `${inv.number}.pdf`);
export const portalStatementPdf = () => blob("/statement/pdf", "releve.pdf");
