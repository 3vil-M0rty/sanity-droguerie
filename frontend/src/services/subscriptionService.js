import api from "./api";

// "Mon abonnement" — the client's plan and its invoices from the platform (backend routes/subscription.js).
export const getMySubscription = async () => (await api.get("/subscription")).data.data;
export const downloadMyInvoice = async (id, number) => {
  const res = await api.get(`/subscription/invoices/${id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${number}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
