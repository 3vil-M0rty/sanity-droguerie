/**
 * ============================================================
 * LANDED COST (frais d'approche)
 * ============================================================
 * An imported container costs more than the supplier's price: freight,
 * customs duties (droits d'importation), transit agent, port handling,
 * insurance, local transport. Those costs belong in the stock value
 * (CMUP) of the articles received, so margins are true.
 *
 * Each cost is spread over the received lines by one key:
 *   value    — in proportion to the goods value (duties, insurance)
 *   quantity — per unit received (handling per carton)
 *   weight   — per kg (freight, transport); falls back to value when
 *              an article has no weight
 * A cost can be an amount (MAD HT) or a percentage of the goods value
 * (e.g. 17.5 % droits d'importation). Import VAT is recoverable and is
 * NOT a landed cost.
 *
 * Goods priced in a foreign currency: exchangeRate converts the line
 * prices to MAD first.
 * ============================================================
 */
const KINDS = ["freight", "customs", "transit", "handling", "insurance", "transport", "other"];
const METHODS = ["value", "quantity", "weight"];
const round = (n, d = 4) => Math.round((Number(n) || 0) * 10 ** d) / 10 ** d;
const r2 = (n) => round(n, 2);

function normalizeCosts(raw, defaultMethod = "value") {
  const errors = [];
  const costs = [];
  (Array.isArray(raw) ? raw : []).forEach((c, i) => {
    const label = String(c?.label || "").trim().slice(0, 120);
    const amount = c?.amount === "" || c?.amount === undefined || c?.amount === null ? null : Number(c.amount);
    const percent = c?.percent === "" || c?.percent === undefined || c?.percent === null ? null : Number(c.percent);
    if (!label && amount === null && percent === null) return;
    if (!label) errors.push(`Frais ${i + 1} : libellé manquant`);
    if (amount === null && percent === null) errors.push(`Frais « ${label} » : montant ou pourcentage requis`);
    if (amount !== null && !(amount >= 0)) errors.push(`Frais « ${label} » : montant invalide`);
    if (percent !== null && !(percent >= 0 && percent <= 500)) errors.push(`Frais « ${label} » : pourcentage invalide`);
    const allocation = METHODS.includes(c?.allocation) ? c.allocation : defaultMethod;
    costs.push({
      label, kind: KINDS.includes(c?.kind) ? c.kind : "other", amount: amount !== null ? amount : null, percent: percent !== null ? percent : null, allocation,
      supplierName: String(c?.supplierName || "").trim().slice(0, 200) || undefined, reference: String(c?.reference || "").trim().slice(0, 100) || undefined,
    });
  });
  return { costs, errors };
}

/**
 * @param lines [{ key, quantity, unitPrice (supplier currency, per unit), weightKg (per unit) }]
 * @returns { lines: [{ key, quantity, goodsUnitCost, extraUnitCost, unitCost, goodsValue, extra }], totalGoods, totalCosts, costs (with computed amount), warnings }
 */
function allocate(lines, rawCosts, { method = "value", exchangeRate = 1 } = {}) {
  const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 1;
  const rows = lines.filter((l) => Number(l.quantity) > 0).map((l) => {
    const goodsUnitCost = round(Number(l.unitPrice || 0) * rate);
    return { key: l.key, quantity: Number(l.quantity), weightKg: Number(l.weightKg) || 0, goodsUnitCost, goodsValue: r2(goodsUnitCost * Number(l.quantity)), extra: 0 };
  });
  const totalGoods = r2(rows.reduce((s, r) => s + r.goodsValue, 0));
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalWeight = rows.reduce((s, r) => s + r.weightKg * r.quantity, 0);
  const warnings = [];
  const costs = (Array.isArray(rawCosts) ? rawCosts : []).map((c) => ({ ...c, computed: r2(c.amount !== null && c.amount !== undefined ? c.amount : (Number(c.percent) || 0) * totalGoods / 100) }));

  for (const c of costs) {
    let key = c.allocation || method;
    if (key === "weight" && (totalWeight <= 0 || rows.some((r) => !r.weightKg))) {
      warnings.push(`« ${c.label} » : poids manquant sur certains articles — réparti au prorata de la valeur`);
      key = "value";
    }
    if (key === "value" && totalGoods <= 0) key = "quantity";
    const basis = rows.map((r) => (key === "value" ? r.goodsValue : key === "weight" ? r.weightKg * r.quantity : r.quantity));
    const total = key === "value" ? totalGoods : key === "weight" ? totalWeight : totalQty;
    if (!(total > 0)) continue;
    // Cents: the last line takes the rounding so the sum is exact.
    let left = c.computed;
    rows.forEach((r, i) => {
      const part = i === rows.length - 1 ? left : r2(c.computed * basis[i] / total);
      r.extra = r2(r.extra + part);
      left = r2(left - part);
    });
  }
  const totalCosts = r2(costs.reduce((s, c) => s + c.computed, 0));
  return {
    lines: rows.map((r) => ({
      key: r.key, quantity: r.quantity, goodsUnitCost: r.goodsUnitCost, goodsValue: r.goodsValue, extra: r.extra,
      extraUnitCost: round(r.extra / r.quantity), unitCost: round(r.goodsUnitCost + r.extra / r.quantity),
      upliftPercent: r.goodsValue > 0 ? r2((r.extra / r.goodsValue) * 100) : null,
    })),
    totalGoods, totalCosts, costs, warnings,
    coefficient: totalGoods > 0 ? round((totalGoods + totalCosts) / totalGoods, 4) : null, // "coefficient d'approche"
  };
}

module.exports = { allocate, normalizeCosts, KINDS, METHODS };
