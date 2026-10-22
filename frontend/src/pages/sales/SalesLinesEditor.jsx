import { Plus, Trash2, ScanBarcode } from "lucide-react";
import { useState } from "react";
import ArticlePicker from "../../components/useful/ArticlePicker";
import CustomSelect from "../../components/useful/CustomSelect";
import { useI18n } from "../../hooks/useI18n";
import { useArticleIndex } from "../../hooks/useArticleIndex";
import { getArticlePrice, lookupBarcode } from "../../services/negoceService";
import { formatMoney, emptySalesLine, salesTotals, lineHT, VAT_RATES } from "./salesShared";
import styles from "./Sales.module.css";

/**
 * Priced lines of a devis, a commande, a BL or an invoice (négoce).
 * Picking an article (or scanning its barcode / a carton's barcode)
 * fills its reference, unit and the price of the customer's level
 * (Tarifs) with the customer's discount. The unit can be the article's
 * base unit or one of its packagings (Carton de 12…): the price follows.
 * A line can also be free text (transport, service).
 * Articles are searched on the server (ArticlePicker); only those on the
 * lines are known here (useArticleIndex) — never the whole catalogue.
 */
export default function SalesLinesEditor({ lines, onChange, companyId = null, customerId = null, showStock = true }) {
  const { t } = useI18n();
  const [scan, setScan] = useState("");
  const [scanError, setScanError] = useState("");
  const { byId, remember } = useArticleIndex(companyId, lines.map((l) => l.product));
  const update = (index, patch) => onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const priced = async (product, unit) => {
    const base = {
      product: product._id,
      reference: product.internalReference || "",
      description: product.name,
      unit: unit || product.unit || "",
      vatRate: product.vatRate ?? 20,
    };
    try {
      const p = await getArticlePrice(product._id, customerId, unit || undefined);
      return { ...base, unit: p.unit, unitFactor: p.unitFactor, unitPrice: p.unitPrice ?? "", discount: p.discount || 0, vatRate: p.vatRate };
    } catch {
      return { ...base, unitPrice: product.sellingPrice ?? "" };
    }
  };

  const pickProduct = async (index, p) => {
    if (!p) return update(index, { product: "" });
    remember(p);
    update(index, await priced(p));
  };
  const pickUnit = async (index, unit) => {
    const l = lines[index];
    const p = byId.get(String(l.product?._id || l.product));
    if (!p) return update(index, { unit });
    const next = await priced(p, unit);
    update(index, { unit: next.unit, unitFactor: next.unitFactor, unitPrice: next.unitPrice, discount: l.discount || next.discount });
  };

  // Enter in the scan box. Not a <form>: this editor sits inside the
  // document's own form, and a nested form's submit would submit it too.
  const onScan = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation();
    const code = scan.trim();
    if (!code || !companyId) return;
    setScanError("");
    try {
      const { product, unit } = await lookupBarcode(companyId, code);
      remember(product);
      const line = { ...emptySalesLine(), ...(await priced(product, unit)) };
      const same = lines.findIndex((l) => (l.product?._id || l.product) === product._id && l.unit === line.unit);
      if (same >= 0) update(same, { quantity: (Number(lines[same].quantity) || 0) + 1 });
      else {
        const onlyEmpty = lines.length === 1 && !lines[0].product && !lines[0].description;
        onChange(onlyEmpty ? [line] : [...lines, line]);
      }
      setScan("");
    } catch (err) {
      setScanError(err.response?.data?.message || t("ng.common.notFound"));
    }
  };

  const totals = salesTotals(lines);

  return (
    <div className={styles.linesEditor}>
      {companyId && (
        <div className={styles.scanRow}>
          <ScanBarcode size={16} />
          <input className={styles.cellInput} value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={onScan} placeholder={t("ng.common.scanPlaceholder")} />
          {scanError && <span className={styles.bad}>{scanError}</span>}
        </div>
      )}
      <div className={styles.linesHead}>
        <span>{t("sales.lines.article")}</span>
        <span>{t("sales.lines.description")}</span>
        <span>{t("sales.lines.quantity")}</span>
        <span>{t("sales.lines.unit")}</span>
        <span>{t("sales.lines.unitPrice")}</span>
        <span>{t("sales.lines.discount")}</span>
        <span>{t("sales.lines.vat")}</span>
        <span className={styles.right}>{t("sales.lines.totalHT")}</span>
        <span />
      </div>
      {lines.map((line, index) => {
        const p = byId.get(String(line.product?._id || line.product || ""));
        const units = p ? [p.unit, ...(p.packagings || []).filter((k) => k.forSale !== false).map((k) => k.unit)] : [];
        const need = (Number(line.quantity) || 0) * (line.unitFactor || 1);
        const stockLeft = p && showStock && !p.isService ? (p.available ?? p.quantity) : null;
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className={styles.lineRow}>
            <div>
              <ArticlePicker companyId={companyId} value={line.product?._id || line.product || ""} onPick={(v) => pickProduct(index, v)}
                article={p || (line.product ? { name: line.description, internalReference: line.reference } : null)}
                placeholder={t("sales.lines.pickArticle")} showStock={showStock} />
              {stockLeft !== null && (
                <small className={need > stockLeft ? styles.bad : styles.muted}>{t("ng.stock.available")} : {stockLeft} {p.unit}</small>
              )}
            </div>
            <input className={styles.cellInput} value={line.description} placeholder={t("sales.lines.descriptionPlaceholder")}
              onChange={(e) => update(index, { description: e.target.value })} />
            <input className={styles.cellInput} type="number" min="0" step="any" value={line.quantity}
              onChange={(e) => update(index, { quantity: e.target.value })} />
            {units.length > 1 ? (
              <CustomSelect value={line.unit} onSelect={(v) => pickUnit(index, v)}
                options={units.map((u) => {
                  const k = (p.packagings || []).find((x) => x.unit === u);
                  return { value: u, label: k ? `${u} (${k.factor})` : u };
                })} />
            ) : (
              <input className={styles.cellInput} value={line.unit || ""} onChange={(e) => update(index, { unit: e.target.value })} />
            )}
            <input className={styles.cellInput} type="number" step="any" value={line.unitPrice ?? ""} placeholder="0.00"
              onChange={(e) => update(index, { unitPrice: e.target.value })} />
            <input className={styles.cellInput} type="number" min="0" max="100" step="any" value={line.discount ?? 0}
              onChange={(e) => update(index, { discount: e.target.value })} />
            <CustomSelect value={String(line.vatRate)} onSelect={(v) => update(index, { vatRate: Number(v) })}
              options={VAT_RATES.map((r) => ({ value: String(r), label: `${r}%` }))} />
            <span className={styles.lineTotal}>{formatMoney(lineHT(line), "")}</span>
            <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")}
              disabled={lines.length === 1} onClick={() => onChange(lines.filter((_, i) => i !== index))}>
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      <div className={styles.linesFooter}>
        <button type="button" className="btnEdit" onClick={() => onChange([...lines, emptySalesLine()])}>
          <Plus size={14} /> {t("sales.lines.addLine")}
        </button>
        <div className={styles.totals}>
          <span>{t("sales.totals.ht")} <strong>{formatMoney(totals.ht)}</strong></span>
          {totals.breakdown.filter((b) => b.rate > 0).map((b) => (
            <span key={b.rate}>{t("sales.totals.vat")} {b.rate}% <strong>{formatMoney(b.vat)}</strong></span>
          ))}
          <span>{t("sales.totals.ttc")} <strong>{formatMoney(totals.ttc)}</strong></span>
        </div>
      </div>
    </div>
  );
}
