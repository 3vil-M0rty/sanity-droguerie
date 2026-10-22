import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Receipt, Undo2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import StatusPill from "../../components/useful/StatusPill";
import { getDeliveryNotes, invoiceDeliveryNotes } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText, SALES_PILL } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const VIEWS = ["", "toPlan", "toInvoice", "draft", "validated", "delivered", "cancelled"];

/** Bons de livraison: to prepare, to plan in a round, to invoice (grouped per customer). */
export default function DeliveryNotes() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [view, setView] = useState("");
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!companyId) return;
    const params = { companyId };
    if (view === "toPlan") params.toPlan = "true";
    else if (view === "toInvoice") params.toInvoice = "true";
    else if (view) params.status = view;
    try { setRows(await getDeliveryNotes(params)); setPicked([]); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, view, t]);
  useEffect(() => { load(); }, [load]);
  const pickedCustomer = picked.length ? rows.find((r) => r._id === picked[0])?.customer?._id : null;
  const toggle = (n) => setPicked((p) => (p.includes(n._id) ? p.filter((x) => x !== n._id) : [...p, n._id]));
  const cols = `${view === "toInvoice" ? "34px " : ""}130px 100px 1.6fr 0.8fr 1fr 1fr 120px`;
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.logistics"), href: "/logistics/delivery-notes" }, { label: t("ng.delivery.notes") }]} icon={FileText} title={t("ng.delivery.notes")} subtitle={t("ng.delivery.subtitle")}>
        {can("logistics.notes.create") && companyId && (
          <>
            <button type="button" className="btnEdit" onClick={() => navigate("/logistics/delivery-notes/new", { state: { companyId, type: "return" } })}><Undo2 size={15} /> {t("ng.delivery.newReturn")}</button>
            <button type="button" className="btnPrimary" onClick={() => navigate("/logistics/delivery-notes/new", { state: { companyId } })}><Plus size={15} /> {t("ng.delivery.new")}</button>
          </>
        )}
      </PageTop>
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <div className={styles.tabs}>{VIEWS.map((v) => <button key={v || "all"} type="button" className={view === v ? styles.tabActive : styles.tab} onClick={() => setView(v)}>{v ? t(`ng.delivery.views.${v}`) : t("sales.all")}</button>)}</div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {view === "toInvoice" && can("sales.invoices.create") && (
        <div className={styles.infoBanner}>
          {t("ng.delivery.groupHint")}{" "}
          <button type="button" className="btnPrimary" disabled={!picked.length} onClick={async () => { try { const inv = await invoiceDeliveryNotes(picked); navigate(`/sales/invoices/${inv._id}`); } catch (err) { setError(errorText(err, t)); } }}>
            <Receipt size={14} /> {t("ng.delivery.invoiceSelected")} ({picked.length})
          </button>
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
          {view === "toInvoice" && <span />}<span>{t("sales.number")}</span><span>{t("sales.date")}</span><span>{t("sales.customer")}</span><span>{t("ng.common.warehouse")}</span><span>{t("ng.delivery.round")}</span><span className={s.right}>{t("sales.totals.ttc")}</span><span>{t("sales.status")}</span>
        </div>
        {rows.map((n) => (
          <div key={n._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: cols }} role="button" tabIndex={0} onClick={() => navigate(`/logistics/delivery-notes/${n._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/logistics/delivery-notes/${n._id}`)}>
            {view === "toInvoice" && <span onClick={(e) => e.stopPropagation()} onKeyDown={() => {}} role="presentation"><input type="checkbox" checked={picked.includes(n._id)} disabled={!!pickedCustomer && pickedCustomer !== n.customer?._id} onChange={() => toggle(n)} /></span>}
            <span><strong>{n.number}</strong>{n.type === "return" && <small className={s.warn}> · {t("ng.delivery.return")}</small>}{n.salesOrder && <small className={s.muted} style={{ display: "block" }}>{n.salesOrder.number}</small>}</span>
            <span className="dataTableCellMuted">{formatDate(n.date)}</span>
            <span>{n.customer?.name}<small className={s.muted} style={{ display: "block" }}>{n.customer?.city}{n.customer?.zone ? ` · ${n.customer.zone}` : ""}</small></span>
            <span className="dataTableCellMuted">{n.warehouse?.code}</span>
            <span className="dataTableCellMuted">{n.deliveryMode === "pickup" ? t("ng.orders.modes.pickup") : n.round ? n.round.number : "—"}</span>
            <span className={s.right}>{formatMoney(n.totalTTC)}{n.invoice && <small className={s.muted} style={{ display: "block" }}>{n.invoice.number}</small>}</span>
            <span><StatusPill status={SALES_PILL[n.status]} label={t(`ng.delivery.status.${n.status}`)} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}
