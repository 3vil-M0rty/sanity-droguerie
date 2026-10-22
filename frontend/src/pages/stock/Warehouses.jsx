import { useCallback, useEffect, useState } from "react";
import { Warehouse, Plus, Star, X, Trash2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import StatusPill from "../../components/useful/StatusPill";
import { getWarehouses, createWarehouse, updateWarehouse, setDefaultWarehouse, deleteWarehouse, getBrands, createBrand, updateBrand, deleteBrand } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const EMPTY = { code: "", name: "", kind: "warehouse", city: "", address: "", phone: "", hasCounter: false, isActive: true };

/** Dépôts & magasins: where the stock sits; a store with a counter can open a cash register. */
export default function Warehouses() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { if (companyId) try { setRows(await getWarehouses(companyId)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn) => { setError(""); try { await fn(); await load(); } catch (err) { setError(errorText(err, t)); } };
  const manage = can("inventory.warehouses.manage");
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.warehouses.title") }]} icon={Warehouse} title={t("ng.warehouses.title")} subtitle={t("ng.warehouses.subtitle")}>
        {manage && <button type="button" className="btnPrimary" onClick={() => setForm({ ...EMPTY })}><Plus size={15} /> {t("ng.warehouses.new")}</button>}
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {form && (
        <form className={styles.panel} onSubmit={(e) => { e.preventDefault(); act(async () => { if (form._id) await updateWarehouse(form._id, form); else await createWarehouse({ ...form, company: companyId }); setForm(null); }); }}>
          <div className={styles.sectionHeader}><h3>{form._id ? form.name : t("ng.warehouses.new")}</h3><button type="button" className="tableActionBtn" onClick={() => setForm(null)}><X size={14} /></button></div>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.warehouses.code")}<input className={styles.input} required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.warehouses.name")}<input className={styles.input} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.warehouses.kind")}<CustomSelect value={form.kind} onSelect={(v) => setForm({ ...form, kind: v, hasCounter: v === "store" ? true : form.hasCounter })} options={[{ value: "warehouse", label: t("ng.warehouses.kinds.warehouse") }, { value: "store", label: t("ng.warehouses.kinds.store") }]} /></label>
            <label className={styles.field}>{t("sales.customers.city")}<input className={styles.input} value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            <label className={styles.field}>{t("sales.customers.address")}<input className={styles.input} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className={styles.field}>{t("sales.customers.phone")}<input className={styles.input} value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          </div>
          <label className={styles.checkboxRow}><input type="checkbox" checked={!!form.hasCounter} onChange={(e) => setForm({ ...form, hasCounter: e.target.checked })} /> {t("ng.warehouses.hasCounter")}</label>
          {form._id && <label className={styles.checkboxRow}><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> {t("ng.warehouses.active")}</label>}
          <div className={styles.formActions}>
            {form._id && !form.isDefault && <button type="button" className="btnDelete" onClick={() => act(async () => { await deleteWarehouse(form._id); setForm(null); })}><Trash2 size={14} /> {t("common.delete")}</button>}
            <button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="submit" className="btnPrimary">{t("common.save")}</button>
          </div>
        </form>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "100px 2fr 1fr 1fr 0.8fr 1fr 140px" }}><span>{t("ng.warehouses.code")}</span><span>{t("ng.warehouses.name")}</span><span>{t("ng.warehouses.kind")}</span><span>{t("sales.customers.city")}</span><span className={s.right}>{t("ng.articles.title")}</span><span /><span /></div>
        {rows.map((w) => (
          <div key={w._id} className={`dataTableRow ${manage ? styles.clickableRow : ""}`} style={{ gridTemplateColumns: "100px 2fr 1fr 1fr 0.8fr 1fr 140px" }} role="button" tabIndex={0} onClick={() => manage && setForm({ ...EMPTY, ...w })} onKeyDown={(e) => e.key === "Enter" && manage && setForm({ ...EMPTY, ...w })}>
            <span><strong>{w.code}</strong></span><span>{w.name}</span><span className="dataTableCellMuted">{t(`ng.warehouses.kinds.${w.kind}`)}{w.hasCounter ? ` · ${t("ng.warehouses.counter")}` : ""}</span>
            <span className="dataTableCellMuted">{w.city || "—"}</span><span className={s.right}>{w.articles}</span>
            <span>{w.isDefault && <StatusPill status="accepted" label={t("ng.warehouses.default")} />}{w.isActive === false && <StatusPill status="rejected" label={t("ng.warehouses.closed")} />}</span>
            <span>{manage && !w.isDefault && w.isActive !== false && <button type="button" className="btnEdit" onClick={(e) => { e.stopPropagation(); act(() => setDefaultWarehouse(w._id)); }}><Star size={13} /> {t("ng.warehouses.makeDefault")}</button>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Marques (Grohe, Legrand, Colorado…). */
export function Brands() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => { if (companyId) try { setRows(await getBrands(companyId)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn) => { setError(""); try { await fn(); await load(); } catch (err) { setError(errorText(err, t)); } };
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.brands.title") }]} title={t("ng.brands.title")} subtitle={t("ng.brands.subtitle")} />
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {can("inventory.categories.create") && (
        <form className={s.inlineForm} onSubmit={(e) => { e.preventDefault(); if (name.trim()) act(async () => { await createBrand({ company: companyId, name }); setName(""); }); }}>
          <label className={s.grow}>{t("ng.brands.name")}<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <button type="submit" className="btnPrimary"><Plus size={14} /> {t("ng.brands.add")}</button>
        </form>
      )}
      <div className={s.chips}>
        {rows.map((b) => (
          <span key={b._id} className={s.chipBtn}>
            {b.name} <small className={s.muted}>({b.articles})</small>
            {can("inventory.categories.edit") && <button type="button" className="tableActionBtn" onClick={() => { const n = window.prompt(t("ng.brands.rename"), b.name); if (n) act(() => updateBrand(b._id, { name: n })); }}>✎</button>}
            {can("inventory.categories.delete") && !b.articles && <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => act(() => deleteBrand(b._id))}><Trash2 size={12} /></button>}
          </span>
        ))}
      </div>
    </div>
  );
}
