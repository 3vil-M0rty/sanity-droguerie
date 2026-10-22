import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import CustomSelect from "../../components/useful/CustomSelect";
import { getExpiringLots } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatDate, fmtQty, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Lots arriving at their expiry date (peintures, colles, mastics…) — to sell first or to take out. */
export default function Expiring() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [days, setDays] = useState("90");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (companyId) getExpiringLots(companyId, days).then(setRows).catch((err) => setError(errorText(err, t, "sales.errors.load"))); }, [companyId, days, t]);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.expiring.title") }]} icon={CalendarClock} title={t("ng.expiring.title")} subtitle={t("ng.expiring.subtitle")} />
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <div className="filterGroup"><label>{t("ng.expiring.within")}</label><CustomSelect value={days} onSelect={setDays} options={["30", "60", "90", "180", "365"].map((d) => ({ value: d, label: `${d} ${t("ng.common.days")}` }))} /></div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr" }}><span>{t("ng.articles.name")}</span><span>{t("ng.stock.lotNumber")}</span><span>{t("ng.common.warehouse")}</span><span className={s.right}>{t("ng.stock.quantity")}</span><span>{t("ng.stock.expiry")}</span></div>
        {rows.map((l) => (
          <div key={l._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "2fr 1fr 1fr 0.8fr 1fr" }} role="button" tabIndex={0} onClick={() => navigate(`/stock/articles/${l.product?._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/stock/articles/${l.product?._id}`)}>
            <span><strong>{l.product?.name}</strong></span><span>{l.number}</span><span className="dataTableCellMuted">{l.warehouse?.code}</span>
            <span className={s.right}>{fmtQty(l.quantity)} {l.product?.unit}</span>
            <span className={l.expired ? s.bad : s.warn}>{formatDate(l.expiryDate)}{l.expired ? ` · ${t("ng.expiring.expired")}` : ""}</span>
          </div>
        ))}
      </div>
      {!rows.length && <p className={s.muted}>{t("ng.expiring.none")}</p>}
    </div>
  );
}
