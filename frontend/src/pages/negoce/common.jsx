import { useEffect, useState } from "react";
import Breadcrumbs from "../../components/useful/Breadcrumbs";
import CustomSelect from "../../components/useful/CustomSelect";
import { useI18n } from "../../hooks/useI18n";
import { getWarehouses } from "../../services/negoceService";

// Shared bits of the négoce pages (stock, commandes, BL, caisse…).

export { useCompanyPicker, formatMoney, formatDate, toInputDate, todayInput } from "../purchasing/shared";
export { SALES_PILL } from "../sales/salesShared";

/** Warehouses (dépôts / magasins) of a company. */
export function useWarehouses(companyId) {
  const [warehouses, setWarehouses] = useState([]);
  useEffect(() => {
    if (!companyId) { setWarehouses([]); return; }
    getWarehouses(companyId).then(setWarehouses).catch(() => setWarehouses([]));
  }, [companyId]);
  return warehouses;
}

export const warehouseOptions = (warehouses, allLabel) => [
  ...(allLabel ? [{ value: "", label: allLabel }] : []),
  ...warehouses.filter((w) => w.isActive !== false).map((w) => ({ value: w._id, label: `${w.code} — ${w.name}` })),
];

/** Breadcrumbs + title row + subtitle + actions on the right. */
export function PageTop({ crumbs, icon: Icon, title, subtitle, children }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <div className="pageHeader">
        <div>
          <div className="pageTitleRow">{Icon && <Icon size={20} />}<h1>{title}</h1></div>
          {subtitle && <p className="pageSubtitle">{subtitle}</p>}
        </div>
        {children && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>}
      </div>
    </>
  );
}

/** "Société" picker shown in every toolbar. */
export function CompanyFilter({ companyId, setCompanyId, options }) {
  const { t } = useI18n();
  if (options.length < 2) return null;
  return (
    <div className="filterGroup">
      <label>{t("employees.toolbar.company")}</label>
      <CustomSelect value={companyId} onSelect={setCompanyId} options={options} />
    </div>
  );
}

export const errorText = (err, t, fallback = "sales.errors.save") => err?.response?.data?.message || err?.message || t(fallback);

export const fmtQty = (n) => (Number(n) || 0).toLocaleString("fr-MA", { maximumFractionDigits: 3 });

export const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
