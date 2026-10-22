import { useMemo, useState } from "react";
import { X } from "lucide-react";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

// Small building blocks shared by the feature pages (pages/fx/*).

/** "{n} rows" + { n: 3 } → "3 rows". */
export const fill = (text, vars = {}) => Object.entries(vars).reduce((out, [k, v]) => out.replaceAll(`{${k}}`, v ?? ""), String(text ?? ""));

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function periodOf(kind, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (kind === "lastMonth") return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
  if (kind === "thisQuarter") return { from: ymd(new Date(y, Math.floor(m / 3) * 3, 1)), to: ymd(now) };
  if (kind === "thisYear") return { from: ymd(new Date(y, 0, 1)), to: ymd(now) };
  return { from: ymd(new Date(y, m, 1)), to: ymd(now) };
}

/** From / to inputs + presets (this month, last month, quarter, year). */
export function usePeriod(initial = "thisMonth") {
  const [period, setPeriod] = useState(() => periodOf(initial));
  return [period, setPeriod];
}
export function PeriodPicker({ t, period, setPeriod }) {
  return (
    <>
      <div className="filterGroup"><label>{t("fx.common.from")}</label><input type="date" className={p.input} value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} /></div>
      <div className="filterGroup"><label>{t("fx.common.to")}</label><input type="date" className={p.input} value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} /></div>
      <div className="filterGroup"><label>&nbsp;</label>
        <div className={s.chips}>
          {["thisMonth", "lastMonth", "thisQuarter", "thisYear"].map((k) => (
            <button key={k} type="button" className={s.chipBtn} onClick={() => setPeriod(periodOf(k))}>{t(`fx.common.${k}`)}</button>
          ))}
        </div>
      </div>
    </>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className={s.tabs} role="tablist">
      {tabs.map((tab) => (
        <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} className={value === tab.value ? s.tabActive : s.tab} onClick={() => onChange(tab.value)}>
          {tab.icon && <tab.icon size={14} />}{tab.label}{tab.count !== undefined && <span className={s.count}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, actions, wide = false }) {
  return (
    <div className={p.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={p.modalCard} style={wide ? { maxWidth: 920, width: "min(920px, 96vw)" } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {onClose && <button type="button" className="tableActionBtn" onClick={onClose} aria-label="close"><X size={15} /></button>}
        </div>
        <div style={{ marginTop: 12, maxHeight: "70vh", overflowY: "auto" }}>{children}</div>
        {actions && <div className={p.modalActions}>{actions}</div>}
      </div>
    </div>
  );
}

export function Kpi({ label, value, hint, tone }) {
  return (
    <div className={s.kpi}>
      <span>{label}</span>
      <strong className={tone === "bad" ? s.bad : tone === "good" ? s.good : undefined}>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

/** Selection of row ids. */
export function useSelection() {
  const [ids, setIds] = useState(() => new Set());
  return useMemo(() => ({
    ids,
    has: (id) => ids.has(String(id)),
    toggle: (id) => setIds((prev) => { const n = new Set(prev); const k = String(id); n.has(k) ? n.delete(k) : n.add(k); return n; }),
    setAll: (list) => setIds(new Set(list.map(String))),
    clear: () => setIds(new Set()),
    size: ids.size,
  }), [ids]);
}

export const fieldCls = p.field;
export const inputCls = p.input;
