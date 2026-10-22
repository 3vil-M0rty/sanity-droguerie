import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Smartphone, MapPinned } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import { getReps } from "../../services/negoceService";
import { getVisits } from "../../services/featuresService";
import { Kpi, fill, PeriodPicker, usePeriod } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Reps' visits from the field app: where, when, what came of it. */
export default function Visits() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [period, setPeriod] = usePeriod("thisMonth");
  const [reps, setReps] = useState([]);
  const [rep, setRep] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => companyId && getVisits({ companyId, ...period, rep }).then(setData).catch((err) => setError(errorText(err, t, "sales.errors.load"))), [companyId, period, rep, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (companyId && can("sales.reps.view")) getReps(companyId).then(setReps).catch(() => setReps([])); }, [companyId, can]);
  const appUrl = `${window.location.origin}/m`;
  const cols = "1.1fr 1.8fr 1.2fr 1fr 1.1fr 1.6fr 0.6fr";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("fx.visits.title") }]} icon={MapPinned} title={t("fx.visits.title")} subtitle={t("fx.visits.subtitle")}>
        <a className="btnEdit" href="/m" target="_blank" rel="noreferrer"><Smartphone size={15} /> {t("fx.visits.app")}</a>
      </PageTop>
      <p className={s.muted}>{fill(t("fx.visits.appHint"), { url: appUrl })}</p>
      <div className={p.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <PeriodPicker t={t} period={period} setPeriod={setPeriod} />
        {reps.length > 0 && (
          <div className="filterGroup"><label>{t("fx.visits.rep")}</label>
            <select className={p.input} value={rep} onChange={(e) => setRep(e.target.value)}>
              <option value="">{t("fx.common.all")}</option>
              {reps.map((r) => <option key={r._id} value={r._id}>{r.firstName} {r.lastName}</option>)}
            </select>
          </div>
        )}
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {data && (
        <div className={s.kpis}>
          <Kpi label={t("fx.visits.title")} value={fill(t("fx.visits.count"), { n: data.summary.visits })} />
          <Kpi label={t("fx.visits.order")} value={fill(t("fx.visits.withOrder"), { n: data.summary.withOrder })} hint={data.summary.visits ? `${Math.round((data.summary.withOrder / data.summary.visits) * 100)} %` : undefined} tone="good" />
          <Kpi label={t("fx.visits.distance")} value={fill(t("fx.visits.farCount"), { n: data.summary.far })} tone={data.summary.far ? "bad" : undefined} />
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
          <span>{t("fx.common.date")}</span><span>{t("fx.common.customer")}</span><span>{t("fx.visits.rep")}</span><span>{t("fx.visits.outcome")}</span><span>{t("fx.visits.order")}</span><span>{t("fx.common.notes")}</span><span>{t("fx.visits.map")}</span>
        </div>
        {(data?.rows || []).map((v) => (
          <div key={v._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
            <span>{new Date(v.visitedAt).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" })}</span>
            <span><strong>{v.customer?.name}</strong> <small className={s.muted}>{v.customer?.city}</small></span>
            <span className="dataTableCellMuted">{v.rep ? `${v.rep.firstName} ${v.rep.lastName}` : "—"}</span>
            <span>{t(`fx.visits.outcomes.${v.outcome}`)}</span>
            <span>{v.order ? <button type="button" className={p.linkButton} onClick={() => navigate(`/sales/orders/${v.order._id}`)}>{v.order.number} · {formatMoney(v.order.totalTTC)}</button> : "—"}</span>
            <span className="dataTableCellMuted truncate" title={v.notes}>{v.notes || ""}{v.distanceMeters > 500 ? <strong className={s.warn}> · {Math.round(v.distanceMeters)} m ({t("fx.visits.far")})</strong> : null}</span>
            <span>{v.gps?.lat ? <a href={`https://www.google.com/maps?q=${v.gps.lat},${v.gps.lng}`} target="_blank" rel="noreferrer" className={p.linkButton} aria-label={t("fx.visits.map")}><MapPin size={14} /></a> : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
