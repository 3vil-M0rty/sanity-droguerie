import { useEffect, useState } from "react";
import { Plus, Trash2, Ship } from "lucide-react";
import { formatMoney, errorText } from "../negoce/common";
import { previewLandedCost, addLateCosts } from "../../services/featuresService";
import { Modal } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const KINDS = ["freight", "customs", "transit", "handling", "insurance", "transport", "other"];
export const emptyLanded = () => ({ costs: [], allocation: "value", exchangeRate: "" });

/**
 * Frais d'approche on a reception: list of costs (amount or % of value,
 * spread by value / quantity / weight) + exchange rate, with the cost
 * price of each line previewed by the server.
 */
export function LandedCostEditor({ t, orderId, entries, value, onChange, withRate = true }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const set = (patch) => onChange({ ...value, ...patch });
  const setCost = (i, patch) => set({ costs: value.costs.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const active = value.costs.length > 0 || (value.exchangeRate && Number(value.exchangeRate) !== 1);
  useEffect(() => {
    if (!active || !entries.length) { setPreview(null); return undefined; }
    const h = setTimeout(() => {
      previewLandedCost(orderId, { lines: entries, costs: value.costs, allocation: value.allocation, exchangeRate: value.exchangeRate || 1 })
        .then((x) => { setPreview(x); setError(""); }).catch((err) => setError(errorText(err, t)));
    }, 350);
    return () => clearTimeout(h);
  }, [orderId, JSON.stringify(entries), JSON.stringify(value), active]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={s.card} style={{ margin: "10px 0" }}>
      <h3 style={{ display: "flex", gap: 6, alignItems: "center" }}><Ship size={16} /> {t("fx.lc.title")}</h3>
      <p className={s.muted}>{t("fx.lc.hint")}</p>
      <div className={p.formGrid}>
        {withRate && <label className={p.field}>{t("fx.lc.exchangeRate")}<input type="number" min="0" step="0.0001" className={p.input} placeholder="1" value={value.exchangeRate} onChange={(e) => set({ exchangeRate: e.target.value })} /></label>}
        <label className={p.field}>{t("fx.lc.allocation")}
          <select className={p.input} value={value.allocation} onChange={(e) => set({ allocation: e.target.value })}>{["value", "quantity", "weight"].map((k) => <option key={k} value={k}>{t(`fx.lc.allocations.${k}`)}</option>)}</select>
        </label>
      </div>
      {value.costs.map((c, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 0.9fr 0.7fr 1fr 32px", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <input className={p.input} placeholder={t("fx.lc.label")} aria-label={t("fx.lc.label")} value={c.label} onChange={(e) => setCost(i, { label: e.target.value })} />
          <select className={p.input} aria-label={t("fx.lc.kind")} value={c.kind} onChange={(e) => setCost(i, { kind: e.target.value })}>{KINDS.map((k) => <option key={k} value={k}>{t(`fx.lc.kinds.${k}`)}</option>)}</select>
          <input type="number" min="0" step="0.01" className={p.input} placeholder={t("fx.lc.amount")} aria-label={t("fx.lc.amount")} value={c.amount ?? ""} onChange={(e) => setCost(i, { amount: e.target.value, percent: e.target.value ? "" : c.percent })} />
          <input type="number" min="0" step="0.01" className={p.input} placeholder="%" aria-label={t("fx.lc.percent")} title={t("fx.lc.percent")} value={c.percent ?? ""} onChange={(e) => setCost(i, { percent: e.target.value, amount: e.target.value ? "" : c.amount })} />
          <select className={p.input} aria-label={t("fx.lc.allocation")} value={c.allocation || value.allocation} onChange={(e) => setCost(i, { allocation: e.target.value })}>{["value", "quantity", "weight"].map((k) => <option key={k} value={k}>{t(`fx.lc.allocations.${k}`)}</option>)}</select>
          <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => set({ costs: value.costs.filter((_, j) => j !== i) })}><Trash2 size={13} /></button>
        </div>
      ))}
      <button type="button" className="btnEdit" onClick={() => set({ costs: [...value.costs, { label: "", kind: value.costs.length ? "customs" : "freight", amount: "", percent: "", allocation: value.costs.length ? "value" : "weight" }] })}><Plus size={14} /> {t("fx.lc.add")}</button>
      {error && <div className="errorMessage" style={{ marginTop: 8 }}>{error}</div>}
      {preview && (
        <>
          <h4 className={p.subTitle}>{t("fx.lc.preview")} · {t("fx.lc.coefficient")} <strong>{preview.coefficient ?? "—"}</strong></h4>
          {preview.warnings.map((w) => <p key={w} className={s.warn}>{w}</p>)}
          <div className="dataTable">
            <div className="dataTableHead" style={{ gridTemplateColumns: "2fr 0.6fr 1fr 1fr 1fr 0.7fr" }}><span>{t("fx.fc.article")}</span><span className={s.right}>Qté</span><span className={s.right}>{t("fx.lc.goods")}</span><span className={s.right}>{t("fx.lc.extra")}</span><span className={s.right}>{t("fx.lc.unitCost")}</span><span className={s.right}>{t("fx.lc.uplift")}</span></div>
            {preview.lines.map((l) => (
              <div key={l.key} className="dataTableRow" style={{ gridTemplateColumns: "2fr 0.6fr 1fr 1fr 1fr 0.7fr" }}>
                <span className="truncate">{l.description}</span><span className={s.right}>{l.quantity}</span>
                <span className={s.right}>{formatMoney(l.goodsUnitCost)}</span><span className={s.right}>+ {formatMoney(l.extraUnitCost)}</span>
                <span className={s.right}><strong>{formatMoney(l.unitCost)}</strong></span><span className={s.right}>{l.upliftPercent ?? "—"} %</span>
              </div>
            ))}
            <div className="dataTableRow" style={{ gridTemplateColumns: "2fr 0.6fr 1fr 1fr 1fr 0.7fr", fontWeight: 600 }}>
              <span>{t("fx.common.total")}</span><span /><span className={s.right}>{formatMoney(preview.totalGoods)}</span><span className={s.right}>+ {formatMoney(preview.totalCosts)}</span><span /><span />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Costs whose invoice arrives after the reception (transit agent, port storage…). */
export function LateCostsButton({ t, orderId, reception, onDone }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(emptyLanded());
  const [error, setError] = useState("");
  const save = async () => {
    try {
      const out = await addLateCosts(orderId, reception._id, { costs: value.costs, allocation: value.allocation });
      setOpen(false); setValue(emptyLanded());
      onDone?.(out.order, t("fx.lc.lateDone"));
    } catch (err) { setError(errorText(err, t)); }
  };
  return (
    <>
      <button type="button" className={p.linkButton} onClick={() => setOpen(true)}><Plus size={12} /> {t("fx.lc.late")}</button>
      {open && (
        <Modal wide title={`${t("fx.lc.late")} — ${reception.reference}`} onClose={() => setOpen(false)}
          actions={<><button type="button" className="btnCancel" onClick={() => setOpen(false)}>{t("common.cancel")}</button><button type="button" className="btnPrimary" disabled={!value.costs.length} onClick={save}>{t("common.save")}</button></>}>
          <p className={s.muted}>{t("fx.lc.lateHint")}</p>
          {error && <div className="errorMessage">{error}</div>}
          <LandedCostEditor t={t} orderId={orderId} entries={reception.lines.map((x) => ({ lineId: x.lineId, quantity: x.quantity }))} value={value} onChange={setValue} withRate={false} />
        </Modal>
      )}
    </>
  );
}

/** One line under a reception: what its landed costs were. */
export function LandedSummary({ t, reception }) {
  const l = reception.landed;
  if (!l || !(l.totalCosts > 0 || (l.exchangeRate && l.exchangeRate !== 1))) return null;
  return (
    <p className={s.muted} style={{ margin: "4px 0" }}>
      {t("fx.lc.title")} : <strong>{formatMoney(l.totalCosts)}</strong>
      {l.exchangeRate && l.exchangeRate !== 1 ? ` · × ${l.exchangeRate}` : ""}
      {(l.costs || []).length ? ` (${l.costs.map((c) => `${c.label} ${formatMoney(c.computed)}`).join(", ")})` : ""}
    </p>
  );
}
