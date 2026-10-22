import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneCall, ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import { getCollections, addCollectionAction, getReps } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

const ACTIONS = ["call", "visit", "reminder", "promise", "dispute", "note"];

/** Recouvrement: what each customer owes, oldest first; calls, visits and promises of payment. */
export default function Collections() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [reps, setReps] = useState([]);
  const [rep, setRep] = useState("");
  const [data, setData] = useState({ rows: [], totals: {} });
  const [open, setOpen] = useState({});
  const [action, setAction] = useState(null); // { invoice, type, note, promiseDate, promiseAmount }
  const [error, setError] = useState("");
  const load = useCallback(async () => { if (companyId) try { setData(await getCollections({ companyId, salesRep: rep })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [companyId, rep, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (companyId && can("sales.reps.view")) getReps(companyId).then(setReps).catch(() => setReps([])); }, [companyId, can]);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("ng.collections.title") }]} icon={PhoneCall} title={t("ng.collections.title")} subtitle={t("ng.collections.subtitle")} />
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        {reps.length > 0 && <div className="filterGroup"><label>{t("ng.common.salesRep")}</label><CustomSelect value={rep} onSelect={setRep} options={[{ value: "", label: t("sales.all") }, ...reps.map((r) => ({ value: r._id, label: `${r.firstName} ${r.lastName}` }))]} /></div>}
      </div>
      {error && <div className="errorMessage">{error}</div>}
      <div className={s.kpis}>
        <div className={s.kpi}><span>{t("ng.collections.toCollect")}</span><strong>{formatMoney(data.totals.total)}</strong><small>{data.totals.customers || 0} {t("ng.collections.customers")}</small></div>
        <div className={s.kpi}><span>{t("sales.customers.overdue")}</span><strong className={s.bad}>{formatMoney(data.totals.overdue)}</strong></div>
      </div>
      {action && (
        <div className={styles.panel}>
          <h3>{t("ng.collections.newAction")} — {action.number}</h3>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.collections.type")}<CustomSelect value={action.type} onSelect={(v) => setAction({ ...action, type: v })} options={ACTIONS.map((a) => ({ value: a, label: t(`ng.collections.actions.${a}`) }))} /></label>
            {action.type === "promise" && <label className={styles.field}>{t("ng.collections.promiseDate")}<input type="date" className={styles.input} value={action.promiseDate || ""} onChange={(e) => setAction({ ...action, promiseDate: e.target.value })} /></label>}
            {action.type === "promise" && <label className={styles.field}>{t("sales.amount")}<input type="number" className={styles.input} value={action.promiseAmount || ""} onChange={(e) => setAction({ ...action, promiseAmount: e.target.value })} /></label>}
          </div>
          <label className={styles.field}>{t("sales.notes")}<input className={styles.input} value={action.note || ""} onChange={(e) => setAction({ ...action, note: e.target.value })} /></label>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setAction(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={async () => { try { await addCollectionAction(action.invoice, action); setAction(null); await load(); } catch (err) { setError(errorText(err, t)); } }}>{t("common.save")}</button>
          </div>
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "28px 2fr 1fr 1fr 1fr 0.8fr" }}><span /><span>{t("sales.customer")}</span><span>{t("ng.common.salesRep")}</span><span className={s.right}>{t("sales.customers.due")}</span><span className={s.right}>{t("sales.customers.overdue")}</span><span className={s.right}>{t("ng.collections.oldest")}</span></div>
        {data.rows.map((r) => {
          const key = r.customer?._id;
          return (
            <div key={key}>
              <div className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "28px 2fr 1fr 1fr 1fr 0.8fr" }} role="button" tabIndex={0} onClick={() => setOpen({ ...open, [key]: !open[key] })} onKeyDown={(e) => e.key === "Enter" && setOpen({ ...open, [key]: !open[key] })}>
                <span>{open[key] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                <span><strong>{r.customer?.name}</strong> <small className={s.muted}>{r.customer?.phone}</small>{r.customer?.blocked && <small className={s.bad}> · {t("ng.customers.blocked")}</small>}</span>
                <span className="dataTableCellMuted">{r.salesRep ? `${r.salesRep.firstName} ${r.salesRep.lastName}` : "—"}</span>
                <span className={s.right}>{formatMoney(r.total)}</span>
                <span className={`${s.right} ${r.overdue ? s.bad : ""}`}>{r.overdue ? formatMoney(r.overdue) : "—"}</span>
                <span className={`${s.right} ${r.oldestDays > 60 ? s.bad : r.oldestDays > 0 ? s.warn : s.muted}`}>{r.oldestDays > 0 ? `${r.oldestDays} j` : "—"}</span>
              </div>
              {open[key] && (
                <table className={s.miniTable} style={{ margin: "4px 0 10px 28px", width: "calc(100% - 28px)" }}>
                  <thead><tr><th>{t("sales.number")}</th><th>{t("sales.dueDate")}</th><th className={s.num}>{t("sales.customers.due")}</th><th>{t("ng.collections.lastAction")}</th><th /></tr></thead>
                  <tbody>
                    {r.invoices.map((i) => (
                      <tr key={i._id}>
                        <td><button type="button" className={styles.linkButton} onClick={() => navigate(`/sales/invoices/${i._id}`)}>{i.number}</button></td>
                        <td className={i.days > 0 ? s.bad : ""}>{formatDate(i.dueDate)}{i.days > 0 ? ` (+${i.days} j)` : ""}</td>
                        <td className={s.num}>{formatMoney(i.due)}</td>
                        <td className={s.muted}>{i.nextPromise ? `${t("ng.collections.actions.promise")} ${formatDate(i.nextPromise.promiseDate)} ${i.nextPromise.promiseAmount ? formatMoney(i.nextPromise.promiseAmount) : ""}` : i.lastAction ? `${t(`ng.collections.actions.${i.lastAction.type}`)} ${formatDate(i.lastAction.date)} ${i.lastAction.note || ""}` : "—"}</td>
                        <td>{can("sales.collections.manage") && <button type="button" className="btnEdit" onClick={() => setAction({ invoice: i._id, number: i.number, type: "call" })}>+ {t("ng.collections.action")}</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
