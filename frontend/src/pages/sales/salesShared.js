// Helpers shared by the sales (ventes) pages.
export { useCompanyPicker, formatMoney, formatDate, toInputDate, todayInput, PAYMENT_METHODS } from "../purchasing/shared";

/** Status → StatusPill colour. */
export const SALES_PILL = {
  draft: "neutral",
  sent: "manager_approved",
  accepted: "accepted",
  refused: "rejected",
  expired: "pending",
  cancelled: "rejected",
  issued: "pending",
  partially_paid: "manager_approved",
  paid: "accepted",
  planned: "neutral",
  in_progress: "manager_approved",
  on_hold: "pending",
  completed: "accepted",
};

export const VAT_RATES = [20, 14, 10, 7, 0];

export const emptySalesLine = () => ({ product: "", reference: "", description: "", quantity: 1, unit: "", unitFactor: 1, unitPrice: "", discount: 0, vatRate: 20 });

export const lineHT = (l) => (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100);

/** Totals with VAT per rate, as the backend computes them. */
export function salesTotals(lines) {
  const byRate = new Map();
  for (const l of lines) {
    const rate = Number(l.vatRate) || 0;
    byRate.set(rate, (byRate.get(rate) || 0) + lineHT(l));
  }
  const r = (n) => Math.round(n * 100) / 100;
  const breakdown = [...byRate.entries()].map(([rate, base]) => ({ rate, baseHT: r(base), vat: r((base * rate) / 100) })).sort((a, b) => b.rate - a.rate);
  const ht = r(breakdown.reduce((s, x) => s + x.baseHT, 0));
  const vat = r(breakdown.reduce((s, x) => s + x.vat, 0));
  return { ht, vat, ttc: r(ht + vat), breakdown };
}

/** Lines as the API expects them. */
export const cleanLines = (lines) => lines
  .filter((l) => l.product || String(l.description || "").trim())
  .map((l) => ({
    ...(l._id ? { _id: l._id } : {}),
    product: l.product?._id || l.product || null,
    reference: l.reference || "",
    description: l.description,
    quantity: Number(l.quantity),
    unit: l.unit,
    unitPrice: l.unitPrice === "" || l.unitPrice === null || l.unitPrice === undefined ? null : Number(l.unitPrice),
    discount: Number(l.discount) || 0,
    vatRate: Number(l.vatRate),
    ...((l.lots || []).length ? { lots: l.lots } : {}),
  }));

SALES_PILL.confirmed = "manager_approved";
SALES_PILL.partially_delivered = "pending";
SALES_PILL.delivered = "accepted";
SALES_PILL.invoiced = "accepted";
SALES_PILL.validated = "manager_approved";
SALES_PILL.done = "accepted";
SALES_PILL.received = "accepted";
SALES_PILL.open = "pending";
SALES_PILL.closed = "neutral";
SALES_PILL.refunded = "rejected";
