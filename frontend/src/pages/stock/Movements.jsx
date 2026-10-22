import { useCallback, useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import CustomSelect from "../../components/useful/CustomSelect";
import Pagination from "../../components/useful/Pagination";
import { getMovements } from "../../services/negoceService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, CompanyFilter, formatDate, fmtQty, formatMoney, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const KINDS = ["purchase", "purchase_return", "delivery", "delivery_return", "invoice", "credit_note", "pos", "pos_refund", "transfer", "count", "manual", "opening"];

/** Journal des mouvements de stock: every in / out with its document. */
export default function Movements() {
  const { t } = useI18n();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [f, setF] = useState({ warehouse: "", kind: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!companyId) return;
    try { const r = await getMovements({ companyId, ...f, page, limit: 50 }); setRows(r.movements); setPagination(r.pagination); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, f, page, t]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (v) => { setF((x) => ({ ...x, [k]: v })); setPage(1); };
  const cols = "130px 2fr 1.4fr 0.8fr 0.9fr 0.9fr 1fr";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.stock.movements") }]} icon={ArrowLeftRight} title={t("ng.stock.movements")} subtitle={t("ng.stock.movementsSubtitle")} />
      <div className={styles.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <div className="filterGroup"><label>{t("ng.common.warehouse")}</label><CustomSelect value={f.warehouse} onSelect={set("warehouse")} options={warehouseOptions(warehouses, t("ng.common.allWarehouses"))} /></div>
        <div className="filterGroup"><label>{t("ng.stock.origin")}</label><CustomSelect value={f.kind} onSelect={set("kind")} options={[{ value: "", label: t("sales.all") }, ...KINDS.map((k) => ({ value: k, label: t(`ng.stock.kinds.${k}`) }))]} /></div>
        <div className="filterGroup"><label>{t("ng.common.from")}</label><input type="date" className={styles.input} value={f.from} onChange={(e) => set("from")(e.target.value)} /></div>
        <div className="filterGroup"><label>{t("ng.common.to")}</label><input type="date" className={styles.input} value={f.to} onChange={(e) => set("to")(e.target.value)} /></div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
          <span>{t("sales.date")}</span><span>{t("ng.articles.name")}</span><span>{t("ng.stock.origin")}</span><span>{t("ng.common.warehouse")}</span>
          <span className={s.right}>{t("ng.stock.quantity")}</span><span className={s.right}>{t("ng.stock.after")}</span><span className={s.right}>{t("ng.articles.unitCost")}</span>
        </div>
        {rows.map((m) => {
          const neg = ["out", "transfer_out"].includes(m.type);
          return (
            <div key={m._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
              <span className="dataTableCellMuted">{formatDate(m.createdAt)} {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              <span><strong>{m.product?.name}</strong>{(m.lots || []).length > 0 && <small className={s.muted}> · {m.lots.map((l) => l.number).join(", ")}</small>}</span>
              <span>{t(`ng.stock.kinds.${m.source?.kind || "manual"}`)}{m.source?.number ? ` ${m.source.number}` : ""}<small className={s.muted} style={{ display: "block" }}>{m.customer?.name || m.supplier?.name || m.reason || ""}</small></span>
              <span className="dataTableCellMuted">{m.warehouse?.code || "—"}</span>
              <span className={`${s.right} ${neg ? s.bad : s.good}`}>{neg ? "−" : m.type === "adjustment" ? "±" : "+"}{fmtQty(m.quantity)}</span>
              <span className={`${s.right} dataTableCellMuted`}>{m.warehouseQuantity !== null && m.warehouseQuantity !== undefined ? fmtQty(m.warehouseQuantity) : fmtQty(m.resultingQuantity)}</span>
              <span className={`${s.right} dataTableCellMuted`}>{m.unitCost !== undefined && m.unitCost !== null ? formatMoney(m.unitCost, "") : ""}</span>
            </div>
          );
        })}
      </div>
      {pagination && pagination.pages > 1 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />}
    </div>
  );
}
