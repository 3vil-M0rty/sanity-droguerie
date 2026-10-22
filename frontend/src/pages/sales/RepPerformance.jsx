import { useCallback, useEffect, useState } from "react";
import { Target, Save } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { getPerformance, saveTarget } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText, currentPeriod } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

const pct = (n) => (n === null || n === undefined ? "—" : `${Math.round(n)} %`);

/** Commerciaux: CA, marge, encaissé vs objectifs, commission du mois; the director sets targets. */
export default function RepPerformance() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [period, setPeriod] = useState(currentPeriod());
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { if (companyId) try { setData(await getPerformance({ companyId, period })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [companyId, period, t]);
  useEffect(() => { load(); }, [load]);
  const manage = can("sales.reps.manage");
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("ng.reps.title") }]} icon={Target} title={t("ng.reps.title")} subtitle={t("ng.reps.subtitle")} />
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <div className="filterGroup"><label>{t("ng.reps.period")}</label><input type="month" className={styles.input} value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {data && (
        <>
          <div className={s.kpis}>
            <div className={s.kpi}><span>{t("ng.reps.invoiced")}</span><strong>{formatMoney(data.totals.invoicedHT)}</strong></div>
            <div className={s.kpi}><span>{t("ng.common.margin")}</span><strong>{formatMoney(data.totals.marginHT)}</strong></div>
            <div className={s.kpi}><span>{t("ng.reps.collected")}</span><strong>{formatMoney(data.totals.collected)}</strong></div>
            <div className={s.kpi}><span>{t("ng.reps.commissions")}</span><strong>{formatMoney(data.totals.commission)}</strong></div>
          </div>
          <div className="dataTable">
            <div className="dataTableHead" style={{ gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 1fr 0.8fr 1fr 0.7fr 1fr" }}>
              <span>{t("ng.common.salesRep")}</span><span className={s.right}>{t("ng.reps.invoiced")}</span><span className={s.right}>{t("ng.reps.target")}</span><span className={s.right}>%</span>
              <span className={s.right}>{t("ng.common.margin")}</span><span className={s.right}>{t("ng.reps.marginRate")}</span><span className={s.right}>{t("ng.reps.collected")}</span><span className={s.right}>{t("ng.reps.newCustomers")}</span><span className={s.right}>{t("ng.reps.commission")}</span>
            </div>
            {data.rows.map((r) => (
              <div key={r.rep._id}>
                <div className={`dataTableRow ${manage ? styles.clickableRow : ""}`} style={{ gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 1fr 0.8fr 1fr 0.7fr 1fr" }} role="button" tabIndex={0}
                  onClick={() => manage && setEditing({ salesRep: r.rep._id, revenueTarget: r.target?.revenueTarget || "", collectionTarget: r.target?.collectionTarget || "", newCustomersTarget: r.target?.newCustomersTarget || "", commissionRate: r.target?.commissionRate ?? "", bonus: r.target?.bonus || "" })}
                  onKeyDown={() => {}}>
                  <span><strong>{r.rep.firstName} {r.rep.lastName}</strong></span>
                  <span className={s.right}>{formatMoney(r.invoicedHT, "")}</span>
                  <span className={`${s.right} dataTableCellMuted`}>{r.target?.revenueTarget ? formatMoney(r.target.revenueTarget, "") : "—"}</span>
                  <span className={`${s.right} ${r.achievement >= 100 ? s.good : r.achievement !== null && r.achievement < 70 ? s.bad : ""}`}>{pct(r.achievement)}</span>
                  <span className={s.right}>{formatMoney(r.marginHT, "")}</span>
                  <span className={`${s.right} dataTableCellMuted`}>{pct(r.marginRate)}</span>
                  <span className={s.right}>{formatMoney(r.collected, "")}{r.collectionAchievement !== null && <small className={s.muted}> ({pct(r.collectionAchievement)})</small>}</span>
                  <span className={s.right}>{r.newCustomers}</span>
                  <span className={s.right}><strong>{formatMoney(r.commission, "")}</strong><small className={s.muted} style={{ display: "block" }}>{r.commissionRate}% {t(`ng.reps.bases.${r.commissionBase}`)}{r.bonus ? ` + ${formatMoney(r.bonus, "")}` : ""}</small></span>
                </div>
                {editing && editing.salesRep === r.rep._id && (
                  <div className={s.inlineForm}>
                    <label>{t("ng.reps.target")} HT<input type="number" value={editing.revenueTarget} onChange={(e) => setEditing({ ...editing, revenueTarget: e.target.value })} /></label>
                    <label>{t("ng.reps.collectionTarget")}<input type="number" value={editing.collectionTarget} onChange={(e) => setEditing({ ...editing, collectionTarget: e.target.value })} /></label>
                    <label>{t("ng.reps.newCustomers")}<input type="number" value={editing.newCustomersTarget} onChange={(e) => setEditing({ ...editing, newCustomersTarget: e.target.value })} /></label>
                    <label>{t("ng.reps.rate")}<input type="number" step="0.1" value={editing.commissionRate} onChange={(e) => setEditing({ ...editing, commissionRate: e.target.value })} placeholder={t("ng.reps.defaultRate")} /></label>
                    <label>{t("ng.reps.bonus")}<input type="number" value={editing.bonus} onChange={(e) => setEditing({ ...editing, bonus: e.target.value })} /></label>
                    <button type="button" className="btnCancel" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
                    <button type="button" className="btnPrimary" onClick={async () => { try { await saveTarget({ ...editing, company: companyId, period }); setEditing(null); await load(); } catch (err) { setError(errorText(err, t)); } }}><Save size={14} /> {t("common.save")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {manage && <p className={s.muted}>{t("ng.reps.clickToSet")}</p>}
        </>
      )}
    </div>
  );
}
