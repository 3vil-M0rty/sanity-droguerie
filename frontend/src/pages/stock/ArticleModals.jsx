import { useEffect, useState } from "react";
import { X, ShoppingCart, Truck, Tags, Trophy } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { getArticle, getSupplierPrices } from "../../services/negoceService";
import { createPurchaseRequest } from "../../services/purchaseRequestService";
import { formatMoney, formatDate, fmtQty, errorText } from "../negoce/common";
import ArticleVisual from "./ArticleVisual";
import c from "./Catalog.module.css";

function Shell({ article, icon: Icon, title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className={c.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={c.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={c.modalHead}>
          <ArticleVisual article={article} size="small" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3><Icon size={16} /> {title}</h3>
            <p>{article.name}{article.internalReference ? ` · ${article.internalReference}` : ""}</p>
          </div>
          <button type="button" className={c.closeBtn} onClick={onClose} aria-label="close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Demande d'achat: quantity (suggested up to the max stock) + note. */
export function PurchaseRequestModal({ article, companyId, onClose, onDone }) {
  const { t } = useI18n();
  const suggested = Math.max(1, Math.ceil((article.maxQuantity || article.threshold * 2 || 0) - (article.quantity || 0)) || 1);
  const [qty, setQty] = useState(String(suggested));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createPurchaseRequest({ company: companyId, product: article._id, requestedQuantity: Number(qty), notes });
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell article={article} icon={ShoppingCart} title={t("ng.catalog.requestTitle")} onClose={onClose}>
      {done ? (
        <>
          <div className="successMessage">{t("ng.catalog.requestSent")}</div>
          <div className={c.foot}><button type="button" className="btnPrimary" onClick={onClose}>{t("ng.catalog.close")}</button></div>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className={c.hint}>
            {t("ng.catalog.inStock")}: <strong>{fmtQty(article.quantity)} {article.unit}</strong>
            {article.threshold > 0 && <> · {t("ng.articles.threshold")}: {fmtQty(article.threshold)}</>}
            {article.maxQuantity > 0 && <> · {t("ng.articles.maxQuantity")}: {fmtQty(article.maxQuantity)}</>}
          </div>
          <label className={c.field}>{t("ng.catalog.quantity")} ({article.unit})
            <input type="number" min="0.001" step="any" value={qty} onChange={(e) => setQty(e.target.value)} required autoFocus />
          </label>
          <label className={c.field}>{t("ng.catalog.notes")}
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("ng.catalog.notesHint")} />
          </label>
          {error && <div className="errorMessage">{error}</div>}
          <div className={c.foot}>
            <button type="button" className="btnCancel" onClick={onClose}>{t("ng.catalog.cancel")}</button>
            <button type="submit" className="btnPrimary" disabled={busy || !(Number(qty) > 0)}><ShoppingCart size={14} /> {t("ng.catalog.send")}</button>
          </div>
        </form>
      )}
    </Shell>
  );
}

/** Buying prices from every supplier, cheapest first. */
export function SupplierPricesModal({ article, onClose }) {
  const { t } = useI18n();
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getSupplierPrices(article._id).then(setRes).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [article._id, t]);

  const rows = res?.suppliers || [];
  const best = rows.find((r) => r.bestPrice !== null)?.bestPrice ?? null;
  const money = (v) => (v === null || v === undefined ? "—" : formatMoney(v, ""));

  return (
    <Shell article={article} icon={Truck} title={t("ng.catalog.supplierTitle")} onClose={onClose}>
      {error && <div className="errorMessage">{error}</div>}
      {!res && !error && <p className={c.muted}>…</p>}
      {res && (
        <>
          <div className={c.hint}>
            {t("ng.articles.cmup")}: <strong>{money(res.product.avgCost)}</strong> · {t("ng.articles.lastPurchase")}: <strong>{money(res.product.lastPurchasePrice)}</strong> · {t("ng.catalog.htPer")} {res.product.unit}
          </div>
          {rows.length === 0 ? <p className={c.muted}>{t("ng.catalog.noSupplier")}</p> : (
            <table className={c.table}>
              <thead>
                <tr><th>{t("ng.catalog.supplier")}</th><th className={c.num}>{t("ng.catalog.catalogPrice")}</th><th className={c.num}>{t("ng.catalog.lastOrder")}</th><th className={c.num}>{t("ng.catalog.lastQuote")}</th><th className={c.num}>{t("ng.catalog.gap")}</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const isBest = r.bestPrice !== null && r.bestPrice === best;
                  const gap = best && r.bestPrice !== null && !isBest ? ((r.bestPrice - best) / best) * 100 : null;
                  return (
                    <tr key={r.supplier._id || r.supplier.name || i}>
                      <td>
                        <strong>{r.supplier.name}</strong> {isBest && <span className={c.best}><Trophy size={12} /> {t("ng.catalog.best")}</span>}
                        <div className={c.muted}>
                          {[r.supplier.city, r.supplierReference && `${t("ng.catalog.ref")} ${r.supplierReference}`, r.supplier.paymentDays ? `${r.supplier.paymentDays} ${t("ng.catalog.days")}` : null].filter(Boolean).join(" · ")}
                        </div>
                        {r.orders > 0 && <div className={c.muted}>{r.orders} {t("ng.catalog.orders")} · {fmtQty(r.quantity)} {res.product.unit} · min {money(r.minPrice)}</div>}
                      </td>
                      <td className={`${c.num} ${isBest && r.bestPrice === r.catalogPrice ? c.best : ""}`}>{money(r.catalogPrice)}</td>
                      <td className={c.num}>{r.lastOrder ? <>{money(r.lastOrder.price)}<div className={c.muted}>{r.lastOrder.number} · {formatDate(r.lastOrder.date)}</div></> : "—"}</td>
                      <td className={c.num}>{r.lastQuote ? <>{money(r.lastQuote.price)}<div className={c.muted}>{formatDate(r.lastQuote.date)}</div></> : "—"}</td>
                      <td className={c.num}>{isBest ? <span className={c.best}>—</span> : gap !== null ? `+${gap.toFixed(1)} %` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
      <div className={c.foot}><button type="button" className="btnCancel" onClick={onClose}>{t("ng.catalog.close")}</button></div>
    </Shell>
  );
}

/** Our selling prices: every level, HT / TTC, per unit and per packaging. */
export function SellingPricesModal({ article, hidden, onClose }) {
  const { t } = useI18n();
  const [full, setFull] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getArticle(article._id).then(setFull).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [article._id, t]);

  const vat = Number(full?.vatRate ?? 20);
  const ttc = (v) => Math.round(v * (1 + vat / 100) * 100) / 100;
  const money = (v) => (v === null || v === undefined ? "—" : formatMoney(v, ""));
  const packs = (full?.packagings || []).filter((p) => p.factor > 1);
  const cost = full?.avgCost;

  return (
    <Shell article={article} icon={Tags} title={t("ng.catalog.sellingTitle")} onClose={onClose}>
      {error && <div className="errorMessage">{error}</div>}
      {!full && !error && <p className={c.muted}>…</p>}
      {full && (
        <>
          <div className={c.hint}>
            {t("ng.articles.publicPrice")}: <strong>{money(full.sellingPrice)} HT</strong> · {t("ng.articles.vat")} {vat} %
            {full.minSellingPrice ? <> · {t("ng.articles.minPrice")}: {money(full.minSellingPrice)}</> : null}
            {!hidden && cost ? <> · {t("ng.articles.cmup")}: {money(cost)}</> : null}
          </div>
          <table className={c.table}>
            <thead>
              <tr>
                <th>{t("ng.catalog.level")}</th>
                <th className={c.num}>HT / {full.unit}</th><th className={c.num}>TTC / {full.unit}</th>
                {packs.map((p) => <th key={p.unit} className={c.num}>TTC / {p.unit} ({p.factor})</th>)}
                {!hidden && cost ? <th className={c.num}>{t("ng.catalog.margin")}</th> : null}
              </tr>
            </thead>
            <tbody>
              {(full.levelPrices || []).map((l) => (
                <tr key={l.code}>
                  <td><strong>{l.code}</strong> {l.label}<div className={c.muted}>{t(`ng.catalog.origin.${l.origin}`)}</div></td>
                  <td className={c.num}>{money(l.price)}</td>
                  <td className={c.num}><strong>{l.price === null ? "—" : money(ttc(l.price))}</strong></td>
                  {packs.map((p) => <td key={p.unit} className={c.num}>{l.price === null ? "—" : money(ttc(l.price * p.factor))}</td>)}
                  {!hidden && cost ? <td className={`${c.num} ${l.price > cost ? c.best : ""}`}>{l.price ? `${(((l.price - cost) / l.price) * 100).toFixed(1)} %` : "—"}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div className={c.foot}><button type="button" className="btnCancel" onClick={onClose}>{t("ng.catalog.close")}</button></div>
    </Shell>
  );
}
