import { useEffect } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import ArticlePicker from "../../components/useful/ArticlePicker";
import CustomSelect from "../../components/useful/CustomSelect";
import { useI18n } from "../../hooks/useI18n";
import { useArticleIndex } from "../../hooks/useArticleIndex";
import { lineTotals, formatMoney, supplierPriceFor, applySupplierPrices } from "./shared";
import styles from "./Purchasing.module.css";

/**
 * Editable order lines, shared by purchase orders and price requests.
 * Each line is either an inventory article (stock moves on reception)
 * or free text (a service, a one-off item — no stock).
 *   priceKey: "unitPrice" (order) | "quotedUnitPrice" (price request)
 *   priceOptional: price requests start without prices
 */
export const emptyLine = () => ({ product: "", description: "", quantity: 1, unit: "", unitPrice: "", quotedUnitPrice: "", vatRate: 20 });

// showPrices=false: a price request being written — you're ASKING the
// supplier for prices, so there's nothing to fill in yet.
//
// supplierName (purchase orders): the order's supplier. An article's
// price is then TAKEN FROM THE INVENTORY — the price recorded on that
// article for that supplier — instead of being typed again. Changing
// the supplier re-applies it. A price the user typed themselves
// (line.priceSource === "manual") is never overwritten.
//   line.priceSource: "article" (auto-filled) | "missing" (article has
//   no price for this supplier) | "manual" | undefined (not set yet)
//
// companyId: articles are searched on the server (ArticlePicker); only the
// articles on the lines are known here (useArticleIndex), never the catalogue.
export default function LinesEditor({ lines, onChange, companyId, priceKey = "unitPrice", priceOptional = false, showPrices = true, supplierName }) {
  const { t } = useI18n();
  const autoPrice = priceKey === "unitPrice" && supplierName !== undefined;
  const { byId, list: products, remember } = useArticleIndex(companyId, lines.map((l) => l.product));

  const articlePrice = (productId) => supplierPriceFor(byId.get(String(productId?._id || productId)), supplierName);

  // Re-apply inventory prices when the supplier (or the article list)
  // changes — only on lines that weren't priced by hand.
  useEffect(() => {
    if (!autoPrice || !supplierName) return;
    const { lines: next, changed } = applySupplierPrices(lines, products, supplierName);
    if (changed) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierName, products, lines.length]);

  const update = (index, patch) => onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const pickProduct = (index, p) => {
    if (!p) return update(index, { product: "", priceSource: undefined });
    remember(p);
    const patch = { product: p._id, description: p.name || "", unit: p.unit || "" };
    if (autoPrice && supplierName) {
      const price = supplierPriceFor(p, supplierName);
      Object.assign(patch, price !== null ? { unitPrice: price, priceSource: "article" } : { unitPrice: "", priceSource: "missing" });
    } else if (autoPrice) {
      Object.assign(patch, { unitPrice: "", priceSource: undefined }); // filled once a supplier is chosen
    }
    update(index, patch);
  };

  const missingCount = autoPrice && supplierName ? lines.filter((l) => l.product && l.priceSource === "missing").length : 0;

  const totals = lineTotals(lines, priceKey);

  return (
    <div className={styles.linesEditor}>
      <div className={showPrices ? styles.linesHead : styles.linesHeadNoPrice}>
        <span>{t("purchasing.lines.article")}</span>
        <span>{t("purchasing.lines.description")}</span>
        <span>{t("purchasing.lines.quantity")}</span>
        <span>{t("purchasing.lines.unit")}</span>
        {showPrices && <span>{priceKey === "unitPrice" ? t("purchasing.lines.unitPrice") : t("purchasing.lines.quotedPrice")}</span>}
        {showPrices && <span>{t("purchasing.lines.vat")}</span>}
        <span />
      </div>
      {lines.map((line, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={index} className={showPrices ? styles.lineRow : styles.lineRowNoPrice}>
          <ArticlePicker
            companyId={companyId}
            value={line.product?._id || line.product || ""}
            article={byId.get(String(line.product?._id || line.product || "")) || (line.product ? { name: line.description } : null)}
            onPick={(p) => pickProduct(index, p)}
            placeholder={t("purchasing.lines.pickArticle")}
            showStock={false}
          />
          <input className={styles.cellInput} value={line.description} placeholder={t("purchasing.lines.descriptionPlaceholder")}
            onChange={(e) => update(index, { description: e.target.value })} />
          <input className={styles.cellInput} type="number" min="0" step="any" value={line.quantity}
            onChange={(e) => update(index, { quantity: e.target.value })} />
          <input className={styles.cellInput} value={line.unit || ""} onChange={(e) => update(index, { unit: e.target.value })} />
          {showPrices && (
            <input
              className={`${styles.cellInput} ${autoPrice && line.priceSource === "missing" ? styles.cellMissing : ""} ${autoPrice && line.priceSource === "article" ? styles.cellFromArticle : ""}`}
              type="number" min="0" step="any" value={line[priceKey] ?? ""}
              title={autoPrice && line.priceSource === "article" ? t("purchasing.lines.priceFromArticle") : undefined}
              placeholder={autoPrice && line.priceSource === "missing" ? t("purchasing.lines.noPriceShort") : priceOptional ? "—" : "0.00"}
              onChange={(e) => update(index, { [priceKey]: e.target.value, ...(autoPrice ? { priceSource: "manual" } : {}) })} />
          )}
          {showPrices && (
            <CustomSelect value={String(line.vatRate)} onSelect={(v) => update(index, { vatRate: Number(v) })}
              options={[20, 14, 10, 7, 0].map((r) => ({ value: String(r), label: `${r}%` }))} />
          )}
          <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")}
            disabled={lines.length === 1} onClick={() => onChange(lines.filter((_, i) => i !== index))}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {autoPrice && !supplierName && lines.some((l) => l.product) && (
        <p className={styles.muted}>{t("purchasing.lines.pickSupplierForPrices")}</p>
      )}
      {missingCount > 0 && (
        <p className={styles.priceWarning}>
          <AlertTriangle size={13} /> {t("purchasing.lines.missingPrices").replace("{count}", missingCount).replace("{supplier}", supplierName)}
        </p>
      )}
      <div className={styles.linesFooter}>
        <button type="button" className="btnEdit" onClick={() => onChange([...lines, emptyLine()])}>
          <Plus size={14} /> {t("purchasing.lines.addLine")}
        </button>
        {showPrices && <div className={styles.totals}>
          <span>{t("purchasing.totals.ht")}: <strong>{formatMoney(totals.ht)}</strong></span>
          <span>{t("purchasing.totals.vat")}: <strong>{formatMoney(totals.vat)}</strong></span>
          <span>{t("purchasing.totals.ttc")}: <strong>{formatMoney(totals.ttc)}</strong></span>
        </div>}
      </div>
    </div>
  );
}
