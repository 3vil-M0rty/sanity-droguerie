import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardCheck, Plus, Save, CheckCircle2, Ban } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import StatusPill from "../../components/useful/StatusPill";
import ActionModal from "../../components/useful/ActionModal";
import { getCounts, getCount, createCount, saveCount, validateCount, cancelCount } from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, CompanyFilter, formatDate, formatMoney, fmtQty, errorText, SALES_PILL } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Inventaires: one warehouse (or one family), expected quantities frozen, counted entered, gaps validated. */
export default function Counts() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!companyId) return;
    try { setRows(await getCounts({ companyId })); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (companyId) getInventoryCategories(companyId).then(setCategories).catch(() => setCategories([])); }, [companyId]);

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.counts.title") }]} icon={ClipboardCheck} title={t("ng.counts.title")} subtitle={t("ng.counts.subtitle")}>
        {can("inventory.counts.create") && <button type="button" className="btnPrimary" onClick={() => setForm({ warehouse: warehouses[0]?._id || "", category: "", title: "" })}><Plus size={15} /> {t("ng.counts.new")}</button>}
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {form && (
        <div className={styles.panel}>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.common.warehouse")}<CustomSelect value={form.warehouse} onSelect={(v) => setForm({ ...form, warehouse: v })} options={warehouseOptions(warehouses)} /></label>
            <label className={styles.field}>{t("ng.articles.family")}<CustomSelect value={form.category} onSelect={(v) => setForm({ ...form, category: v })} options={[{ value: "", label: t("ng.counts.wholeWarehouse") }, ...categories.map((c) => ({ value: c._id, label: c.fullName || c.name }))]} /></label>
            <label className={styles.field}>{t("ng.counts.label")}<input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("ng.counts.labelHint")} /></label>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={async () => { try { const c = await createCount({ ...form, company: companyId, category: form.category || undefined }); navigate(`/stock/counts/${c._id}`); } catch (err) { setError(errorText(err, t)); } }}>{t("ng.counts.start")}</button>
          </div>
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "140px 110px 1fr 1.4fr 140px 140px 120px" }}>
          <span>N°</span><span>{t("sales.date")}</span><span>{t("ng.common.warehouse")}</span><span>{t("ng.counts.scope")}</span><span>{t("ng.counts.progress")}</span><span className={s.right}>{t("ng.counts.gap")}</span><span>{t("sales.status")}</span>
        </div>
        {rows.map((c) => (
          <div key={c._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "140px 110px 1fr 1.4fr 140px 140px 120px" }} role="button" tabIndex={0} onClick={() => navigate(`/stock/counts/${c._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/stock/counts/${c._id}`)}>
            <span><strong>{c.number}</strong></span><span className="dataTableCellMuted">{formatDate(c.createdAt)}</span><span>{c.warehouse?.code}</span>
            <span className="dataTableCellMuted">{c.title || c.category?.name || t("ng.counts.wholeWarehouse")}</span>
            <span>{c.countedLines} / {c.lineCount}</span>
            <span className={`${s.right} ${c.gapValue < 0 ? s.bad : ""}`}>{c.status === "validated" && c.gapValue !== undefined ? formatMoney(c.gapValue) : "—"}</span>
            <span><StatusPill status={SALES_PILL[c.status] || "neutral"} label={t(`ng.counts.status.${c.status}`)} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One stock count: type the counted quantities (scanner-friendly), save, validate. */
export function CountDetail() {
  const { t } = useI18n();
  const can = useCan();
  const { id } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(null);
  const [values, setValues] = useState({});
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  const load = useCallback(async () => {
    try {
      const c = await getCount(id);
      setCount(c);
      setValues(Object.fromEntries(c.lines.map((l) => [l._id, l.counted ?? ""])));
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [id, t]);
  useEffect(() => { load(); }, [load]);
  if (!count) return <div className="pageShell">{error ? <div className="errorMessage">{error}</div> : null}</div>;
  const draft = count.status === "draft";
  const save = async () => {
    setError("");
    try { await saveCount(id, Object.entries(values).map(([lineId, counted]) => ({ lineId, counted }))); setNotice(t("ng.common.saved")); await load(); } catch (err) { setError(errorText(err, t)); }
  };
  const lines = count.lines.filter((l) => !filter || `${l.product?.name} ${l.product?.internalReference} ${l.product?.barcode}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.counts.title"), href: "/stock/counts" }, { label: count.number }]} icon={ClipboardCheck}
        title={`${t("ng.counts.one")} ${count.number}`} subtitle={`${count.warehouse?.code} — ${count.warehouse?.name}${count.category ? ` · ${count.category.name}` : ""}`}>
        {draft && can("inventory.counts.create") && <button type="button" className="btnEdit" onClick={save}><Save size={15} /> {t("common.save")}</button>}
        {draft && can("inventory.counts.validate") && <button type="button" className="btnPrimary" onClick={() => setConfirm(true)}><CheckCircle2 size={15} /> {t("ng.counts.validate")}</button>}
        {draft && can("inventory.counts.create") && <button type="button" className="btnCancel" onClick={async () => { await cancelCount(id); navigate("/stock/counts"); }}><Ban size={15} /> {t("common.cancel")}</button>}
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.infoBanner}>{notice}</div>}
      {count.status === "validated" && <div className={styles.infoBanner}>{t("ng.counts.validatedOn")} {formatDate(count.validatedAt)} — {t("ng.counts.gap")} {formatMoney(count.gapValue)}</div>}
      <input className={styles.input} style={{ maxWidth: 420, marginBottom: 10 }} placeholder={t("ng.articles.search")} value={filter} onChange={(e) => setFilter(e.target.value)} />
      <table className={s.miniTable}>
        <thead><tr><th>{t("ng.common.reference")}</th><th>{t("ng.articles.name")}</th><th className={s.num}>{t("ng.counts.expected")}</th><th className={s.num}>{t("ng.stock.counted")}</th><th className={s.num}>{t("ng.counts.gap")}</th></tr></thead>
        <tbody>
          {lines.map((l) => {
            const v = values[l._id];
            const gap = v === "" || v === null || v === undefined ? null : Number(v) - l.expected;
            return (
              <tr key={l._id}>
                <td className={s.muted}>{l.product?.internalReference}</td><td>{l.product?.name} <small className={s.muted}>{l.product?.unit}</small></td>
                <td className={s.num}>{fmtQty(l.expected)}</td>
                <td className={s.num} style={{ width: 130 }}>{draft ? <input type="number" min="0" step="any" value={v ?? ""} onChange={(e) => setValues({ ...values, [l._id]: e.target.value })} /> : fmtQty(l.counted)}</td>
                <td className={`${s.num} ${gap < 0 ? s.bad : gap > 0 ? s.good : ""}`}>{gap === null ? "—" : `${gap > 0 ? "+" : ""}${fmtQty(gap)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ActionModal isOpen={confirm} type="confirm" title={t("ng.counts.validate")} message={t("ng.counts.validateMessage")} onClose={() => setConfirm(false)}
        onConfirm={async () => { setConfirm(false); try { await saveCount(id, Object.entries(values).map(([lineId, counted]) => ({ lineId, counted }))); await validateCount(id); await load(); } catch (err) { setError(errorText(err, t)); } }} />
    </div>
  );
}
