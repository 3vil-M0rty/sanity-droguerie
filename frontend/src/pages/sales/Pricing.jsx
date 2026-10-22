import { useCallback, useEffect, useState } from "react";
import { Tags, Plus, Trash2, Save, Download, Percent } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import { getSalesSettings, saveSalesSettings, getPriceList, downloadPriceList, bulkPrices, getBrands } from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

/**
 * Tarifs: the price levels (P1 revendeur, P2 gros, P3 détail, P4 comptoir…)
 * with their markup on CMUP, the counter / credit / commission settings,
 * the price list per level (Excel), and bulk price updates.
 */
export default function Pricing() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [settings, setSettings] = useState(null);
  const [list, setList] = useState({ levels: [], rows: [] });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [f, setF] = useState({ category: "", brand: "" });
  const [bulk, setBulk] = useState({ level: "", mode: "markup", value: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const edit = can("sales.pricing.edit");

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const st = await getSalesSettings(companyId);
      setSettings(st);
      setList(await getPriceList({ companyId, ...f }));
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, f, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!companyId) return;
    getInventoryCategories(companyId).then(setCategories).catch(() => setCategories([]));
    getBrands(companyId).then(setBrands).catch(() => setBrands([]));
  }, [companyId]);

  if (!settings) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;
  const setLevel = (i, k, v) => setSettings({ ...settings, priceLevels: settings.priceLevels.map((l, j) => (j === i ? { ...l, [k]: v } : l)) });
  const save = async () => {
    setError(""); setNotice("");
    try { setSettings(await saveSalesSettings(companyId, settings)); setNotice(t("ng.common.saved")); await load(); } catch (err) { setError(errorText(err, t)); }
  };
  const levelOptions = settings.priceLevels.map((l) => ({ value: l.code, label: `${l.code} — ${l.label}` }));

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("ng.pricing.title") }]} icon={Tags} title={t("ng.pricing.title")} subtitle={t("ng.pricing.subtitle")}>
        <button type="button" className="btnEdit" onClick={() => downloadPriceList({ companyId, ...f })}><Download size={15} /> {t("ng.pricing.exportAll")}</button>
      </PageTop>
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.infoBanner}>{notice}</div>}

      <div className={s.twoCols}>
        <div className={s.card}>
          <h3>{t("ng.pricing.levels")}</h3>
          <p className={s.muted}>{t("ng.pricing.levelsHint")}</p>
          <table className={s.miniTable}>
            <thead><tr><th>Code</th><th>{t("ng.pricing.levelName")}</th><th className={s.num}>{t("ng.pricing.markup")}</th><th /></tr></thead>
            <tbody>
              {settings.priceLevels.map((l, i) => (
                <tr key={l.code + i}>
                  <td style={{ width: 80 }}><input disabled={!edit} value={l.code} onChange={(e) => setLevel(i, "code", e.target.value.toUpperCase())} /></td>
                  <td><input disabled={!edit} value={l.label} onChange={(e) => setLevel(i, "label", e.target.value)} /></td>
                  <td style={{ width: 110 }}><input disabled={!edit} type="number" min="0" step="0.5" value={l.markupPercent ?? ""} onChange={(e) => setLevel(i, "markupPercent", e.target.value)} placeholder="—" /></td>
                  <td style={{ width: 40 }}>{edit && <button type="button" className="tableActionBtn tableActionBtnDanger" disabled={settings.priceLevels.length === 1} onClick={() => setSettings({ ...settings, priceLevels: settings.priceLevels.filter((_, j) => j !== i) })}><Trash2 size={13} /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {edit && <button type="button" className="btnEdit" onClick={() => setSettings({ ...settings, priceLevels: [...settings.priceLevels, { code: `P${settings.priceLevels.length + 1}`, label: "", markupPercent: "" }] })}><Plus size={14} /> {t("ng.pricing.addLevel")}</button>}
          <div className={styles.formGrid} style={{ marginTop: 12 }}>
            <label className={styles.field}>{t("ng.pricing.defaultLevel")}<CustomSelect value={settings.defaultPriceLevel} onSelect={(v) => setSettings({ ...settings, defaultPriceLevel: v })} options={levelOptions} /></label>
            <label className={styles.field}>{t("ng.pricing.posLevel")}<CustomSelect value={settings.posPriceLevel} onSelect={(v) => setSettings({ ...settings, posPriceLevel: v })} options={levelOptions} /></label>
          </div>
        </div>
        <div className={s.card}>
          <h3>{t("ng.pricing.rules")}</h3>
          <label className={styles.checkboxRow}><input type="checkbox" disabled={!edit} checked={settings.blockBelowCost} onChange={(e) => setSettings({ ...settings, blockBelowCost: e.target.checked })} /> {t("ng.pricing.blockBelowCost")}</label>
          <label className={styles.checkboxRow}><input type="checkbox" disabled={!edit} checked={settings.vatRegistered !== false} onChange={(e) => setSettings({ ...settings, vatRegistered: e.target.checked })} /> {t("dg.settings.vatRegistered")}</label>
          <label className={styles.checkboxRow}><input type="checkbox" disabled={!edit} checked={settings.blockOverCreditLimit} onChange={(e) => setSettings({ ...settings, blockOverCreditLimit: e.target.checked })} /> {t("ng.pricing.blockCredit")}</label>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.reps.commissionBase")}
              <CustomSelect value={settings.commissionBase} onSelect={(v) => setSettings({ ...settings, commissionBase: v })} options={["collected", "invoiced", "margin"].map((x) => ({ value: x, label: t(`ng.reps.bases.${x}`) }))} />
            </label>
            <label className={styles.field}>{t("ng.reps.defaultRate")}<input className={styles.input} disabled={!edit} type="number" min="0" step="0.1" value={settings.defaultCommissionRate} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.pos.maxAnonymous")}<input className={styles.input} disabled={!edit} type="number" min="0" value={settings.posMaxAnonymousAmount} onChange={(e) => setSettings({ ...settings, posMaxAnonymousAmount: e.target.value })} /></label>
          </div>
          <label className={styles.field}>{t("ng.pos.ticketHeader")}<textarea className={styles.input} disabled={!edit} rows={3} value={settings.ticketHeader || ""} onChange={(e) => setSettings({ ...settings, ticketHeader: e.target.value })} /></label>
          <label className={styles.field}>{t("ng.pos.ticketFooter")}<textarea className={styles.input} disabled={!edit} rows={2} value={settings.ticketFooter || ""} onChange={(e) => setSettings({ ...settings, ticketFooter: e.target.value })} /></label>
          {edit && <div className={styles.formActions}><button type="button" className="btnPrimary" onClick={save}><Save size={15} /> {t("common.save")}</button></div>}
        </div>
      </div>

      <section className={styles.section}>
        <h2>{t("ng.pricing.priceList")}</h2>
        <div className={styles.toolbar}>
          <div className="filterGroup"><label>{t("ng.articles.family")}</label><CustomSelect value={f.category} onSelect={(v) => setF({ ...f, category: v })} options={[{ value: "", label: t("sales.all") }, ...categories.map((c) => ({ value: c._id, label: c.fullName || c.name }))]} /></div>
          <div className="filterGroup"><label>{t("ng.articles.brand")}</label><CustomSelect value={f.brand} onSelect={(v) => setF({ ...f, brand: v })} options={[{ value: "", label: t("sales.all") }, ...brands.map((b) => ({ value: b._id, label: b.name }))]} /></div>
        </div>
        {edit && (
          <div className={s.inlineForm}>
            <label>{t("ng.pricing.level")}<select value={bulk.level} onChange={(e) => setBulk({ ...bulk, level: e.target.value })}><option value="">—</option>{levelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <label>{t("ng.pricing.bulkMode")}<select value={bulk.mode} onChange={(e) => setBulk({ ...bulk, mode: e.target.value })}><option value="markup">{t("ng.pricing.bulkMarkup")}</option><option value="percent">{t("ng.pricing.bulkPercent")}</option></select></label>
            <label>%<input type="number" step="0.5" value={bulk.value} onChange={(e) => setBulk({ ...bulk, value: e.target.value })} /></label>
            <button type="button" className="btnEdit" disabled={!bulk.level || bulk.value === ""} onClick={async () => {
              try { const r = await bulkPrices({ company: companyId, ...f, ...bulk, value: Number(bulk.value) }); setNotice(t("ng.pricing.bulkDone").replace("{n}", r.changed)); await load(); } catch (err) { setError(errorText(err, t)); }
            }}><Percent size={14} /> {t("ng.pricing.bulkApply")}</button>
          </div>
        )}
        <div className="dataTable">
          <div className="dataTableHead" style={{ gridTemplateColumns: `110px 2fr 1fr 70px ${list.levels.map(() => "0.8fr").join(" ")}` }}>
            <span>{t("ng.common.reference")}</span><span>{t("ng.articles.name")}</span><span>{t("ng.articles.brand")}</span><span>{t("ng.articles.vat")}</span>
            {list.levels.map((l) => <span key={l.code} className={s.right}>{l.code} HT</span>)}
          </div>
          {list.rows.slice(0, 300).map((r) => (
            <div key={r._id} className="dataTableRow" style={{ gridTemplateColumns: `110px 2fr 1fr 70px ${list.levels.map(() => "0.8fr").join(" ")}` }}>
              <span className="dataTableCellMuted">{r.reference || "—"}</span><span>{r.name} <small className={s.muted}>{r.unit}</small></span><span className="dataTableCellMuted">{r.brand || "—"}</span><span className="dataTableCellMuted">{r.vatRate}%</span>
              {list.levels.map((l) => <span key={l.code} className={s.right}>{r.prices[l.code] === null ? "—" : formatMoney(r.prices[l.code], "")}</span>)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
