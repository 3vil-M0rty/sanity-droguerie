import { useEffect, useState } from "react";
import { CreditCard, Download, AlertTriangle } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { PageTop } from "../negoce/common";
import { fill } from "../fx/shared";
import { getMySubscription, downloadMyInvoice } from "../../services/subscriptionService";
import StorageMeter from "../../components/useful/StorageMeter";
import styles from "../platform/Ops.module.css";

/**
 * "Mon abonnement" — for a client's administrators: the plan, its
 * status (trial, active, overdue), the balance and the platform's
 * invoices to download. Backend: routes/subscription.js.
 */
const money = (n) => `${(Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const day = (d) => (d ? new Date(d).toLocaleDateString("fr-MA") : "—");

export default function Subscription() {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMySubscription().then(setData).catch((err) => setError(err.response?.data?.message || String(err.message || err)));
  }, []);

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.organization") }, { label: t("sidebar.mySubscription") }]} icon={CreditCard} title={t("sidebar.mySubscription")} subtitle={t("fx.ops.my.subtitle")} />
      {error && <div className="errorMessage">{error}</div>}
      {data && (
        <>
          {data.overdue && <div className="errorMessage" role="alert"><AlertTriangle size={15} /> {fill(t("fx.ops.my.overdue"), { amount: money(data.balance) })}</div>}
          <section className={styles.section}>
            <h2>{data.plan ? data.plan.name : t("fx.ops.my.noPlan")} <span className={styles.badge} data-tone={data.status === "active" ? "active" : data.status === "past_due" ? "overdue" : undefined}>{t(`fx.ops.bill.subStatus.${data.status}`)}</span></h2>
            <dl className={styles.facts}>
              {data.status === "trial" && <><dt>{t("fx.ops.my.trialEnds")}</dt><dd>{day(data.trialEndsAt)}</dd></>}
              {data.plan && <><dt>{t("fx.ops.bill.cycle")}</dt><dd>{t(`fx.ops.bill.cycles.${data.cycle}`)}</dd></>}
              <dt>{t("fx.ops.bill.quotas")}</dt><dd>{fill(t("fx.ops.bill.quotaText"), { c: data.limits?.maxCompanies ?? "∞", e: data.limits?.maxEmployees ?? "∞" })}</dd>
              {data.storage && <><dt>{t("storage.title")}</dt><dd><StorageMeter storage={{ ...data.storage, source: null }} /></dd></>}
              <dt>{t("fx.ops.my.balance")}</dt><dd><strong>{money(data.balance)}</strong></dd>
            </dl>
            {data.plan?.features?.length > 0 && <ul className={styles.muted}>{data.plan.features.map((f) => <li key={f}>{f}</li>)}</ul>}
          </section>
          <section className={styles.section}>
            <h2>{t("fx.ops.my.invoices")}</h2>
            {data.invoices.length === 0 && <p className={styles.muted}>{t("fx.ops.bill.noInvoices")}</p>}
            {data.invoices.length > 0 && (
              <div className={styles.scroll}>
                <table className={styles.table}>
                  <thead><tr><th>{t("fx.ops.bill.number")}</th><th>{t("fx.ops.bill.date")}</th><th>{t("fx.ops.bill.dueDate")}</th><th className={styles.right}>TTC</th><th>{t("fx.ops.bill.status")}</th><th /></tr></thead>
                  <tbody>
                    {data.invoices.map((i) => (
                      <tr key={i._id}>
                        <td>{i.number}{i.type === "credit_note" && <small className={styles.muted}> ({t("fx.ops.bill.creditNote")})</small>}</td>
                        <td>{day(i.issueDate)}</td>
                        <td>{i.type === "invoice" ? day(i.dueDate) : "—"}</td>
                        <td className={styles.right}>{money(i.totalTTC)}</td>
                        <td><span className={styles.badge} data-tone={i.overdue ? "overdue" : i.status === "paid" ? "paid" : undefined}>{i.overdue ? t("fx.ops.bill.invState.overdue") : t(`fx.ops.bill.invState.${i.status}`)}</span></td>
                        <td><button type="button" className="tableActionBtn" aria-label="PDF" title="PDF" onClick={() => downloadMyInvoice(i._id, i.number)}><Download size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
