import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingDown, ShoppingCart, RefreshCw } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, fmtQty, errorText } from "../negoce/common";
import { getForecast, ordersFromForecast } from "../../services/featuresService";
import { Kpi, fill, useSelection } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/**
 * Prévision d'achat: articles that will run out before a delivery could
 * arrive (90-day sales pace, stock, open orders, supplier lead time).
 * Adjust quantities / suppliers, one click makes the draft purchase orders.
 */
export default function Forecast() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [params, setParams] = useState({ coverDays: 30, safetyDays: 7, defaultLead: 15 });
  const [data, setData] = useState(null);
  const [edits, setEdits] = useState({}); // productId → { quantity, supplier }
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState([]);
  const sel = useSelection();

  const load = useCallback(async () => {
    if (!companyId) return;
    setError("");
    try {
      const d = await getForecast({ companyId, ...params });
      setData(d);
      setEdits({});
      sel.setAll(d.rows.filter((r) => r.supplier).map((r) => r.product._id));
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, params, t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const rows = data?.rows || [];
  const line = (r) => ({ quantity: edits[r.product._id]?.quantity ?? r.quantity, supplier: edits[r.product._id]?.supplier ?? r.supplier?._id ?? "" });
  const priceOf = (r) => {
    const l = line(r);
    const offer = r.offers.find((o) => String(o.supplier) === String(l.supplier));
    return offer ? offer.price : r.unitPrice;
  };
  const chosen = rows.filter((r) => sel.has(r.product._id));
  const total = chosen.reduce((a, r) => a + (Number(line(r).quantity) || 0) * priceOf(r), 0);
  const bySupplier = useMemo(() => new Set(chosen.map((r) => line(r).supplier).filter(Boolean)).size, [chosen, edits]); // eslint-disable-line react-hooks/exhaustive-deps
  const missingSupplier = chosen.some((r) => !line(r).supplier);

  const create = async () => {
    setError(""); setNotice("");
    try {
      const orders = await ordersFromForecast({ companyId, lines: chosen.map((r) => ({ product: r.product._id, quantity: Number(line(r).quantity), supplier: line(r).supplier, unitPrice: priceOf(r) })) });
      setCreated(orders);
      setNotice(fill(t("fx.fc.created"), { n: orders.length }));
      sel.clear();
      await load();
    } catch (err) { setError(errorText(err, t)); }
  };

  const cols = "28px 2.2fr 0.8fr 0.8fr 0.8fr 1fr 1.1fr 1.6fr 1fr";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.purchasing"), href: "/purchasing/orders" }, { label: t("fx.fc.title") }]} icon={TrendingDown} title={t("fx.fc.title")} subtitle={t("fx.fc.subtitle")} />
      <div className={p.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        {[["coverDays", "fx.fc.cover"], ["safetyDays", "fx.fc.safety"], ["defaultLead", "fx.fc.lead"]].map(([k, label]) => (
          <div key={k} className="filterGroup"><label>{t(label)}</label><input type="number" min="0" className={p.input} style={{ width: 110 }} value={params[k]} onChange={(e) => setParams({ ...params, [k]: e.target.value })} /></div>
        ))}
        <div className="filterGroup"><label>&nbsp;</label><button type="button" className="btnEdit" onClick={load}><RefreshCw size={15} /></button></div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && (
        <div className={p.infoBanner}>
          {notice}{" "}
          {created.map((o) => <button key={o._id} type="button" className={p.linkButton} onClick={() => navigate(`/purchasing/orders/${o._id}`)}>{o.number} ({o.supplier.name}) </button>)}
        </div>
      )}
      {data && (
        <div className={s.kpis}>
          <Kpi label={t("fx.fc.urgentKpi")} value={rows.filter((r) => r.priority === 0).length} tone={rows.some((r) => r.priority === 0) ? "bad" : undefined} />
          <Kpi label={t("fx.fc.toOrder")} value={rows.length} />
          {data.suppliers.slice(0, 2).map((g) => <Kpi key={g.supplier?._id || "none"} label={g.supplier?.name || t("fx.fc.noSupplier")} value={formatMoney(g.amount)} hint={`${g.count}`} />)}
        </div>
      )}
      {data && rows.length === 0 && <div className="emptyStateBlock"><div className="emptyStateIcon"><TrendingDown size={28} /></div><h2>{t("fx.fc.none")}</h2></div>}
      {rows.length > 0 && (
        <>
          {can("purchasing.orders.create") && (
            <div className={s.statusBar}>
              <button type="button" className="btnPrimary" disabled={!chosen.length || missingSupplier} onClick={create}>
                <ShoppingCart size={15} /> {fill(t("fx.fc.create"), { n: bySupplier })} · {formatMoney(total)} HT
              </button>
              {missingSupplier && <span className={s.warn}>{t("fx.fc.missingSupplier")}</span>}
            </div>
          )}
          <div className="dataTable">
            <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
              <span><input type="checkbox" aria-label={t("fx.common.all")} checked={sel.size === rows.length} onChange={(e) => (e.target.checked ? sel.setAll(rows.map((r) => r.product._id)) : sel.clear())} /></span>
              <span>{t("fx.fc.article")}</span><span className={s.right}>{t("fx.fc.stock")}</span><span className={s.right}>{t("fx.fc.incoming")}</span><span className={s.right}>{t("fx.fc.perDay")}</span>
              <span>{t("fx.fc.daysLeft")}</span><span>{t("fx.fc.quantity")}</span><span>{t("fx.fc.supplier")}</span><span className={s.right}>{t("fx.fc.amount")}</span>
            </div>
            {rows.map((r) => {
              const l = line(r);
              return (
                <div key={r.product._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
                  <span><input type="checkbox" checked={sel.has(r.product._id)} onChange={() => sel.toggle(r.product._id)} aria-label={r.product.name} /></span>
                  <span><strong>{r.product.name}</strong> <small className={s.muted}>{r.product.internalReference}</small>{r.onOrders.length ? <small className={s.muted}> · {r.onOrders.join(", ")}</small> : null}</span>
                  <span className={s.right}>{fmtQty(r.onHand)}</span>
                  <span className={`${s.right} dataTableCellMuted`}>{r.incoming ? fmtQty(r.incoming) : "—"}</span>
                  <span className={`${s.right} dataTableCellMuted`}>{fmtQty(r.perDay)}</span>
                  <span className={r.priority === 0 ? s.bad : s.warn}>{r.daysLeft === null ? "—" : `${r.daysLeft} ${t("ng.common.days")}`}{r.priority === 0 ? <small> · {t("fx.fc.urgent")}</small> : null}</span>
                  <span>
                    <input type="number" min="0" className={p.cellInput || p.input} style={{ width: 90 }} value={l.quantity} aria-label={t("fx.fc.quantity")}
                      onChange={(e) => setEdits({ ...edits, [r.product._id]: { ...edits[r.product._id], quantity: e.target.value } })} /> <small className={s.muted}>{r.product.unit}</small>
                    {r.pack && <div><small className={s.muted}>{fill(t("fx.fc.packs"), { n: Math.ceil((Number(l.quantity) || 0) / r.pack.factor), unit: r.pack.unit })}</small></div>}
                  </span>
                  <span>
                    <select className={p.input} value={l.supplier} aria-label={t("fx.fc.supplier")} onChange={(e) => setEdits({ ...edits, [r.product._id]: { ...edits[r.product._id], supplier: e.target.value } })}>
                      <option value="">{t("fx.fc.noSupplier")}</option>
                      {r.offers.filter((o) => o.supplier).map((o) => <option key={o.supplier} value={o.supplier}>{o.supplierName} — {formatMoney(o.price)}</option>)}
                    </select>
                  </span>
                  <span className={s.right}><strong>{formatMoney((Number(l.quantity) || 0) * priceOf(r))}</strong></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
