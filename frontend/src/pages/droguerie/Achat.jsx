import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackagePlus, Trash2, Plus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import CustomSelect from "../../components/useful/CustomSelect";
import { getShopSuppliers, quickPurchase } from "../../services/droguerieService";
import { searchArticles } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, errorText, todayInput } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import d from "./Droguerie.module.css";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const OUT_METHODS = ["especes", "cheque", "virement", "effet", "carte"];
const emptyLine = () => ({ product: null, name: "", isNew: false, salePriceTTC: "", quantity: "1", unitCost: "" });

/** One article line: search an existing article, or type a new one. */
function ArticleCell({ companyId, line, onChange }) {
  const { t } = useI18n();
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (line.product || line.isNew || line.name.trim().length < 2) { setResults([]); return undefined; }
    let stale = false;
    const h = setTimeout(() => searchArticles(companyId, line.name, 8).then((r) => !stale && setResults(r || [])).catch(() => {}), 250);
    return () => { stale = true; clearTimeout(h); };
  }, [companyId, line.name, line.product, line.isNew]);
  return (
    <div className={d.picker}>
      <input value={line.name} placeholder={t("dg.purchase.articlePlaceholder")} onChange={(e) => onChange({ ...line, name: e.target.value, product: null })} />
      {line.isNew && <small className={d.muted}>{t("dg.purchase.newArticle")} · <input style={{ width: 110, display: "inline-block" }} type="number" min="0" step="0.01" placeholder={t("dg.purchase.salePrice")} value={line.salePriceTTC} onChange={(e) => onChange({ ...line, salePriceTTC: e.target.value })} /></small>}
      {line.product && <small className={d.good}>✓ {t("dg.purchase.inCatalog")}</small>}
      {(results.length > 0 || (line.name.trim().length >= 2 && !line.product && !line.isNew)) && (
        <div className={d.suggestions}>
          {results.map((r) => (
            <button key={r._id} type="button" onClick={() => { onChange({ ...line, product: r._id, name: r.name, unitCost: line.unitCost || ((r.lastPurchasePrice || r.avgCost) ? String(r2((r.lastPurchasePrice || r.avgCost) * (1 + (r.vatRate ?? 20) / 100))) : "") }); setResults([]); }}>
              <strong>{r.name}</strong> <span className={d.muted}>{r.internalReference || ""} · {r.quantity ?? 0} {r.unit}</span>
            </button>
          ))}
          <button type="button" onClick={() => { onChange({ ...line, isNew: true }); setResults([]); }}><Plus size={13} /> {t("dg.purchase.createArticle").replace("{name}", line.name.trim())}</button>
        </div>
      )}
    </div>
  );
}

/**
 * Achat rapide — what came in from the wholesaler, in one screen: the
 * articles go into stock at their cost, the supplier's bill is
 * recorded, and what was paid now (the rest is owed).
 */
export default function Achat() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ supplier: "", supplierName: "", reference: "", date: todayInput(), paidAmount: "", paidMethod: "especes" });
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (companyId) getShopSuppliers(companyId).then((r) => setSuppliers(r.rows)).catch(() => setSuppliers([])); }, [companyId]);

  const total = r2(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0));
  const setLine = (i, l) => setLines(lines.map((x, j) => (j === i ? l : x)));

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await quickPurchase({
        companyId,
        ...(form.supplier === "__new" ? { supplierName: form.supplierName } : { supplier: form.supplier }),
        reference: form.reference,
        date: form.date,
        lines: lines.filter((l) => l.name.trim()).map((l) => ({
          ...(l.product ? { product: l.product } : { newArticle: { name: l.name.trim(), salePriceTTC: Number(l.salePriceTTC) || 0 } }),
          quantity: Number(l.quantity), unitCost: Number(l.unitCost),
        })),
        paid: { amount: form.paidAmount === "" ? 0 : Number(form.paidAmount), method: form.paidMethod },
      });
      setDone(r);
      setLines([emptyLine()]);
      setForm({ ...form, reference: "", paidAmount: "" });
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const ready = companyId && (form.supplier && (form.supplier !== "__new" || form.supplierName.trim()))
    && lines.some((l) => l.name.trim()) && lines.every((l) => !l.name.trim() || ((l.product || l.isNew) && Number(l.quantity) > 0 && l.unitCost !== ""));

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("dg.menu.home"), href: "/boutique" }, { label: t("dg.menu.purchase") }]} icon={PackagePlus} title={t("dg.menu.purchase")} subtitle={t("dg.purchase.subtitle")} />
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {done && (
        <div className="successMessage">
          {t("dg.purchase.done").replace("{number}", done.number).replace("{total}", formatMoney(done.totalTTC)).replace("{owed}", formatMoney(done.owed))}
          {" "}<button type="button" className="btnEdit" onClick={() => navigate("/boutique/fournisseurs")}>{t("dg.menu.suppliers")}</button>
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.formGrid}>
          <label className={styles.field}>{t("dg.purchase.supplier")}
            <CustomSelect value={form.supplier} onSelect={(v) => setForm({ ...form, supplier: v })} options={[...suppliers.map((s) => ({ value: s._id, label: s.name })), { value: "__new", label: `+ ${t("dg.purchase.newSupplier")}` }]} placeholder={t("dg.purchase.pickSupplier")} />
          </label>
          {form.supplier === "__new" && <label className={styles.field}>{t("dg.common.name")}<input className={styles.input} autoFocus value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} /></label>}
          <label className={styles.field}>{t("dg.purchase.reference")}<input className={styles.input} placeholder={t("dg.purchase.referenceHint")} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></label>
          <label className={styles.field}>{t("dg.common.date")}<input className={styles.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        </div>

        <table className={d.lines}>
          <thead><tr><th style={{ width: "48%" }}>{t("dg.purchase.article")}</th><th className={d.num}>{t("dg.purchase.quantity")}</th><th className={d.num}>{t("dg.purchase.unitCost")}</th><th className={d.num}>{t("dg.purchase.lineTotal")}</th><th /></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={i}>
                <td><ArticleCell companyId={companyId} line={l} onChange={(x) => setLine(i, x)} /></td>
                <td><input type="number" min="0" step="any" value={l.quantity} onChange={(e) => setLine(i, { ...l, quantity: e.target.value })} /></td>
                <td><input type="number" min="0" step="0.01" value={l.unitCost} onChange={(e) => setLine(i, { ...l, unitCost: e.target.value })} /></td>
                <td className={d.num}>{formatMoney((Number(l.quantity) || 0) * (Number(l.unitCost) || 0), "")}</td>
                <td><button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : [emptyLine()])} aria-label={t("common.delete")}><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className="btnEdit" onClick={() => setLines([...lines, emptyLine()])}><Plus size={14} /> {t("dg.purchase.addLine")}</button>

        <div className={d.total}><span>{t("dg.purchase.total")}</span><span>{formatMoney(total)}</span></div>
        <div className={styles.formGrid}>
          <label className={styles.field}>{t("dg.purchase.paidNow")}
            <input className={styles.input} type="number" min="0" step="0.01" placeholder="0" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
          </label>
          <label className={styles.field}>{t("dg.common.method")}<CustomSelect value={form.paidMethod} onSelect={(v) => setForm({ ...form, paidMethod: v })} options={OUT_METHODS.map((m) => ({ value: m, label: t(`dg.methods.${m}`) }))} /></label>
          <div className={styles.field}>{t("dg.purchase.owed")}<strong className={d.owed} style={{ fontSize: "1.2rem" }}>{formatMoney(Math.max(0, total - (Number(form.paidAmount) || 0)))}</strong></div>
        </div>
        <div className={styles.formActions}>
          <button type="button" className="btnEdit" onClick={() => setForm({ ...form, paidAmount: String(total) })}>{t("dg.purchase.paidAll")}</button>
          <button type="button" className="btnPrimary" disabled={!ready || busy} onClick={submit}>{t("dg.purchase.save")}</button>
        </div>
        <p className={d.muted}>{t("dg.purchase.hint")}</p>
      </div>
    </div>
  );
}
