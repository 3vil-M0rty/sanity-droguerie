import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ClipboardList, Plus, CheckCircle2, Truck, Ban, Pencil, Download, Trash2, ShieldAlert } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import SearchBar from "../../components/useful/SearchBar";
import StatusPill from "../../components/useful/StatusPill";
import Pagination from "../../components/useful/Pagination";
import ActionModal from "../../components/useful/ActionModal";
import { getSalesOrders, getSalesOrder, confirmSalesOrder, cancelSalesOrder, deliverSalesOrder, deleteSalesOrder, downloadOrderPdf } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, fmtQty, errorText, SALES_PILL } from "../negoce/common";
import { lineHT } from "./salesShared";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

const FILTERS = ["", "draft", "confirmed", "partially_delivered", "delivered", "invoiced", "cancelled"];

/** Commandes clients (CC-…): from the reps, the phone, a devis. */
export default function Orders() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!companyId) return;
    try { const r = await getSalesOrders({ companyId, status, search, page }); setRows(r.orders); setPagination(r.pagination); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, status, search, page, t]);
  useEffect(() => { load(); }, [load]);
  const cols = "130px 100px 1.6fr 1fr 1fr 130px 150px";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("ng.orders.title") }]} icon={ClipboardList} title={t("ng.orders.title")} subtitle={t("ng.orders.subtitle")}>
        {can("sales.orders.create") && companyId && <button type="button" className="btnPrimary" onClick={() => navigate("/sales/orders/new", { state: { companyId } })}><Plus size={15} /> {t("ng.orders.new")}</button>}
      </PageTop>
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <SearchBar onSearch={(v) => { setSearch(v); setPage(1); }} onClear={() => setSearch("")} placeholder={t("ng.orders.search")} />
        <div className={styles.tabs}>
          {FILTERS.map((f) => <button key={f || "all"} type="button" className={status === f ? styles.tabActive : styles.tab} onClick={() => { setStatus(f); setPage(1); }}>{f ? t(`ng.orders.status.${f}`) : t("sales.all")}</button>)}
        </div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {rows.length === 0 ? (
        <div className="emptyStateBlock"><div className="emptyStateIcon"><ClipboardList size={28} /></div><h2>{t("ng.orders.empty")}</h2></div>
      ) : (
        <div className="dataTable">
          <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
            <span>{t("sales.number")}</span><span>{t("sales.date")}</span><span>{t("sales.customer")}</span><span>{t("ng.common.salesRep")}</span><span className={s.right}>{t("sales.totals.ttc")}</span><span>{t("ng.orders.delivered")}</span><span>{t("sales.status")}</span>
          </div>
          {rows.map((o) => (
            <div key={o._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: cols }} role="button" tabIndex={0} onClick={() => navigate(`/sales/orders/${o._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/sales/orders/${o._id}`)}>
              <span><strong>{o.number}</strong>{o.customerReference && <small className={s.muted} style={{ display: "block" }}>{o.customerReference}</small>}</span>
              <span className="dataTableCellMuted">{formatDate(o.date)}</span>
              <span>{o.customer?.name}</span>
              <span className="dataTableCellMuted">{o.salesRep ? `${o.salesRep.firstName} ${o.salesRep.lastName}` : "—"}</span>
              <span className={s.right}>{formatMoney(o.totalTTC)}</span>
              <span className={s.progressCell}><span className={s.progress}><span style={{ width: `${Math.round((o.progress || 0) * 100)}%` }} /></span>{Math.round((o.progress || 0) * 100)}%</span>
              <span><StatusPill status={SALES_PILL[o.status]} label={t(`ng.orders.status.${o.status}`)} /></span>
            </div>
          ))}
        </div>
      )}
      {pagination && pagination.pages > 1 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />}
    </div>
  );
}

/** One order: confirm (reserves stock, checks the credit limit), deliver (BL), follow up. */
export function OrderDetail() {
  const { t } = useI18n();
  const can = useCan();
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(state?.warning || "");
  const [creditBlocked, setCreditBlocked] = useState(null);
  const [deliver, setDeliver] = useState(null); // { lineId: qty }
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setOrder(await getSalesOrder(id)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [id, t]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn) => {
    setBusy(true); setError(""); setCreditBlocked(null);
    try { const r = await fn(); await load(); return r || true; } catch (err) {
      if (["CREDIT_LIMIT", "CUSTOMER_BLOCKED"].includes(err.response?.data?.code)) setCreditBlocked(err.response.data);
      setError(errorText(err, t)); return null;
    } finally { setBusy(false); }
  };
  if (!order) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;
  const open = ["confirmed", "partially_delivered"].includes(order.status);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("ng.orders.title"), href: "/sales/orders" }, { label: order.number }]} icon={ClipboardList}
        title={`${t("ng.orders.one")} ${order.number}`} subtitle={`${order.customer?.name}${order.customerReference ? ` · ${t("ng.orders.customerReference")} ${order.customerReference}` : ""}`}>
        <button type="button" className="btnEdit" onClick={() => run(() => downloadOrderPdf(order))}><Download size={15} /> PDF</button>
        {["draft", "confirmed"].includes(order.status) && can("sales.orders.edit") && <button type="button" className="btnEdit" onClick={() => navigate(`/sales/orders/${id}/edit`)}><Pencil size={15} /> {t("common.edit")}</button>}
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}
      {creditBlocked && can("sales.customers.credit") && (
        <div className={styles.infoBanner}><ShieldAlert size={14} /> {t("ng.orders.overrideHint")}{" "}
          <button type="button" className="btnEdit" onClick={() => run(() => confirmSalesOrder(id, { override: true, overrideReason: window.prompt(t("ng.orders.overrideReason")) || "" }))}>{t("ng.orders.override")}</button>
        </div>
      )}
      <div className={s.statusBar}>
        <StatusPill status={SALES_PILL[order.status]} label={t(`ng.orders.status.${order.status}`)} />
        {order.status === "draft" && can("sales.orders.confirm") && <button type="button" className="btnPrimary" disabled={busy} onClick={() => run(() => confirmSalesOrder(id))}><CheckCircle2 size={15} /> {t("ng.orders.confirm")}</button>}
        {open && can("logistics.notes.create") && <button type="button" className="btnPrimary" onClick={() => setDeliver(Object.fromEntries(order.lines.map((l) => [l._id, Math.max(l.quantity - (l.deliveredQuantity || 0), 0)])))}><Truck size={15} /> {t("ng.orders.makeBL")}</button>}
        {!["delivered", "invoiced", "cancelled"].includes(order.status) && can("sales.orders.cancel") && <button type="button" className="btnCancel" onClick={() => setModal("cancel")}><Ban size={15} /> {t("ng.orders.cancel")}</button>}
        {order.status === "draft" && can("sales.orders.delete") && <button type="button" className="btnDelete" onClick={() => setModal("delete")}><Trash2 size={15} /> {t("common.delete")}</button>}
      </div>
      <div className={s.docMeta}>
        <div><span>{t("sales.customer")}</span>{order.customer?.name}<small className={s.muted}>{order.customer?.code} · {order.customer?.city}</small></div>
        <div><span>{t("sales.date")}</span>{formatDate(order.date)}</div>
        <div><span>{t("ng.orders.expectedDate")}</span>{formatDate(order.expectedDate)}</div>
        <div><span>{t("ng.common.warehouse")}</span>{order.warehouse ? `${order.warehouse.code} — ${order.warehouse.name}` : t("ng.common.defaultWarehouse")}</div>
        <div><span>{t("ng.orders.deliveryMode")}</span>{t(`ng.orders.modes.${order.deliveryMode}`)}<small className={s.muted}>{order.deliveryAddress}</small></div>
        <div><span>{t("ng.common.salesRep")}</span>{order.salesRep ? `${order.salesRep.firstName} ${order.salesRep.lastName}` : "—"}</div>
        <div><span>{t("ng.pricing.level")}</span>{order.priceLevel || "—"}</div>
        {order.quote && <div><span>{t("sales.quotes.one")}</span><button type="button" className={styles.linkButton} onClick={() => navigate(`/sales/quotes/${order.quote._id}`)}>{order.quote.number}</button></div>}
      </div>
      <table className={s.linesTable}>
        <thead><tr><th>{t("ng.common.reference")}</th><th>{t("sales.lines.description")}</th><th className={s.num}>{t("sales.lines.quantity")}</th><th>{t("sales.lines.unit")}</th>
          <th className={s.num}>{t("ng.orders.delivered")}</th><th className={s.num}>{t("ng.stock.available")}</th><th className={s.num}>{t("sales.lines.unitPrice")}</th><th className={s.num}>{t("sales.lines.discount")}</th><th className={s.num}>{t("sales.lines.totalHT")}</th>
          {deliver && <th className={s.num}>{t("ng.orders.toDeliver")}</th>}</tr></thead>
        <tbody>
          {order.lines.map((l) => {
            const avail = order.availability?.[l._id];
            const left = l.quantity - (l.deliveredQuantity || 0);
            return (
              <tr key={l._id}>
                <td className={s.muted}>{l.reference}</td><td>{l.description}</td><td className={s.num}>{fmtQty(l.quantity)}</td><td>{l.unit}</td>
                <td className={s.num}>{fmtQty(l.deliveredQuantity)}</td>
                <td className={`${s.num} ${avail !== undefined && avail + (open ? left * (l.unitFactor || 1) : 0) < left * (l.unitFactor || 1) ? s.bad : s.muted}`}>{avail !== undefined ? fmtQty(avail) : "—"}</td>
                <td className={s.num}>{formatMoney(l.unitPrice, "")}</td><td className={s.num}>{l.discount ? `${l.discount}%` : ""}</td><td className={s.num}>{formatMoney(lineHT(l), "")}</td>
                {deliver && <td className={s.num} style={{ width: 110 }}><input type="number" min="0" max={left} step="any" value={deliver[l._id]} onChange={(e) => setDeliver({ ...deliver, [l._id]: e.target.value })} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={s.totalsBox}>
        <div><span>{t("sales.totals.ht")}</span><strong>{formatMoney(order.totalHT)}</strong></div>
        <div><span>{t("sales.totals.vat")}</span><span>{formatMoney(order.totalVAT)}</span></div>
        <div className={s.grand}><span>{t("sales.totals.ttc")}</span><span>{formatMoney(order.totalTTC)}</span></div>
      </div>
      {deliver && (
        <div className={styles.formActions}>
          <button type="button" className="btnCancel" onClick={() => setDeliver(null)}>{t("common.cancel")}</button>
          <button type="button" className="btnEdit" disabled={busy} onClick={async () => { const n = await run(() => deliverSalesOrder(id, { lines: Object.entries(deliver).map(([lineId, quantity]) => ({ lineId, quantity: Number(quantity) })).filter((x) => x.quantity > 0) })); if (n?._id) navigate(`/logistics/delivery-notes/${n._id}`); }}>{t("ng.orders.blDraft")}</button>
          {can("logistics.notes.validate") && <button type="button" className="btnPrimary" disabled={busy} onClick={async () => { const n = await run(() => deliverSalesOrder(id, { validate: true, lines: Object.entries(deliver).map(([lineId, quantity]) => ({ lineId, quantity: Number(quantity) })).filter((x) => x.quantity > 0) })); if (n?._id) navigate(`/logistics/delivery-notes/${n._id}`); }}><Truck size={14} /> {t("ng.orders.blValidate")}</button>}
        </div>
      )}
      {(order.deliveryNotes || []).length > 0 && (
        <section className={styles.section}>
          <h2>{t("ng.delivery.notes")}</h2>
          <div className="dataTable">
            {order.deliveryNotes.map((n) => (
              <div key={n._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "140px 110px 1fr 140px" }} role="button" tabIndex={0} onClick={() => navigate(`/logistics/delivery-notes/${n._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/logistics/delivery-notes/${n._id}`)}>
                <span><strong>{n.number}</strong></span><span className="dataTableCellMuted">{formatDate(n.date)}</span><span>{formatMoney(n.totalTTC)}{n.invoice ? ` · ${t("ng.delivery.invoiced")}` : ""}</span>
                <span><StatusPill status={SALES_PILL[n.status]} label={t(`ng.delivery.status.${n.status}`)} /></span>
              </div>
            ))}
          </div>
        </section>
      )}
      <ActionModal isOpen={modal === "cancel"} type="confirm" title={t("ng.orders.cancel")} message={t("ng.orders.cancelMessage")} onClose={() => setModal(null)} onConfirm={async () => { setModal(null); await run(() => cancelSalesOrder(id, "")); }} />
      <ActionModal isOpen={modal === "delete"} type="confirm" title={t("common.delete")} message={t("ng.orders.deleteMessage")} onClose={() => setModal(null)} onConfirm={async () => { setModal(null); if (await run(() => deleteSalesOrder(id))) navigate("/sales/orders"); }} />
    </div>
  );
}
