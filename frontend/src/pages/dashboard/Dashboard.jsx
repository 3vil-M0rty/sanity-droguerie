import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Truck, Receipt, AlertTriangle, CalendarClock, ShoppingCart, Plus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { useAuth } from "../../hooks/useAuth";
import { getDashboard } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import Analytics from "./Analytics";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Tableau de bord Sanity: today's and this month's sales, what's waiting (to prepare, deliver, invoice, collect), stock alerts. */
export default function Dashboard() {
  const { t } = useI18n();
  const can = useCan();
  const { user } = useAuth();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (companyId) getDashboard(companyId).then(setD).catch((err) => setError(errorText(err, t, "sales.errors.load"))); }, [companyId, t]);
  const money = can("finance.amounts.view");
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.dashboard.title") }]} icon={LayoutDashboard} title={`${t("ng.dashboard.hello")} ${user?.firstName || ""}`} subtitle={t("ng.dashboard.subtitle")}>
        {can("sales.orders.create") && <Link className="btnPrimary" to="/sales/orders/new" state={{ companyId }}><Plus size={15} /> {t("ng.orders.new")}</Link>}
        {can("pos.sales.create") && <Link className="btnEdit" to="/pos"><ShoppingCart size={15} /> {t("ng.pos.title")}</Link>}
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {d && (
        <>
          {money && (
            <div className={s.kpis}>
              <div className={s.kpi}><span>{t("ng.dashboard.salesToday")}</span><strong>{formatMoney(d.salesToday)}</strong><small>HT</small></div>
              <div className={s.kpi}><span>{t("ng.dashboard.salesMonth")}</span><strong>{formatMoney(d.salesMonth)}</strong><small>HT</small></div>
              {d.marginHT !== undefined && <div className={s.kpi}><span>{t("ng.common.margin")}</span><strong>{formatMoney(d.marginHT)}</strong><small>{d.marginRate} %</small></div>}
              <div className={s.kpi}><span>{t("ng.dashboard.counter")}</span><strong>{formatMoney(d.counter.ttcToday)}</strong><small>{d.counter.ticketsToday} {t("ng.pos.tickets")} {t("ng.dashboard.today")}</small></div>
              <div className={s.kpi}><span>{t("ng.collections.toCollect")}</span><strong>{formatMoney(d.receivables)}</strong><small className={d.overdue > 0 ? s.bad : ""}>{t("sales.customers.overdue")} {formatMoney(d.overdue)}</small></div>
              {d.stockValue !== undefined && <div className={s.kpi}><span>{t("ng.stock.value")}</span><strong>{formatMoney(d.stockValue)}</strong><small>{t("ng.articles.cmup")}</small></div>}
            </div>
          )}
          <h2 className={styles.subTitle}>{t("ng.dashboard.todo")}</h2>
          <div className={s.kpis}>
            <Link className={s.kpi} to="/sales/orders"><span><ClipboardList size={12} /> {t("ng.dashboard.ordersToPrepare")}</span><strong>{d.ordersToPrepare}</strong></Link>
            <Link className={s.kpi} to="/logistics/delivery-notes"><span><Truck size={12} /> {t("ng.dashboard.toDeliver")}</span><strong>{d.toDeliver}</strong></Link>
            <Link className={s.kpi} to="/logistics/delivery-notes"><span><Receipt size={12} /> {t("ng.dashboard.toInvoice")}</span><strong>{d.toInvoice}</strong></Link>
            <Link className={s.kpi} to="/stock/articles"><span><AlertTriangle size={12} /> {t("ng.dashboard.lowStock")}</span><strong className={d.lowStock ? s.bad : ""}>{d.lowStock}</strong></Link>
            <Link className={s.kpi} to="/stock/expiring"><span><CalendarClock size={12} /> {t("ng.dashboard.expiring")}</span><strong className={d.expiringLots ? s.warn : ""}>{d.expiringLots}</strong></Link>
          </div>
        </>
      )}
      {money && companyId && <Analytics companyId={companyId} />}
    </div>
  );
}
