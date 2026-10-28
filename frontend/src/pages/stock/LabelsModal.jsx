import { useEffect, useState } from "react";
import { Barcode, X, Trash2, Printer } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { searchArticles, printLabels } from "../../services/negoceService";
import { formatMoney, errorText } from "../negoce/common";
import CustomSelect from "../../components/useful/CustomSelect";
import styles from "../purchasing/Purchasing.module.css";

const FORMAT_KEY = "sanity.labels.format";
const readFormat = () => { try { return localStorage.getItem(FORMAT_KEY) || "roll"; } catch { return "roll"; } };
const saveFormat = (v) => { try { localStorage.setItem(FORMAT_KEY, v); } catch { /* private mode */ } };
const ttc = (p) => (p.sellingPrice === null || p.sellingPrice === undefined ? null : p.sellingPrice * (1 + Number(p.vatRate ?? 20) / 100));

/**
 * Barcode labels (backend POST /products/labels): pick articles and how many
 * labels each, choose the format (thermal roll 40×30 mm, or A4 sheet of
 * 24 × 70×37 mm), get a PDF to print. Articles without a code receive one
 * (in-store EAN-13) so their labels scan at the till.
 */
export default function LabelsModal({ companyId, initial = [], onClose }) {
  const { t } = useI18n();
  const [lines, setLines] = useState(() => initial.filter((p) => !p.isVariantParent && !p.isService).map((p) => ({ product: p, copies: 1 })));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [format, setFormat] = useState(readFormat);
  const [skip, setSkip] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return undefined; }
    const id = setTimeout(() => searchArticles(companyId, q, 8).then(setResults).catch(() => setResults([])), 250);
    return () => clearTimeout(id);
  }, [query, companyId]);

  const add = (p) => {
    setLines((cur) => (cur.some((l) => l.product._id === p._id) ? cur : [...cur, { product: p, copies: 1 }]));
    setQuery("");
    setResults([]);
  };
  const setCopies = (id, v) => setLines((cur) => cur.map((l) => (l.product._id === id ? { ...l, copies: v } : l)));
  const asStock = () => setLines((cur) => cur.map((l) => ({ ...l, copies: Math.max(1, Math.floor(l.product.quantity || 0)) })));
  const total = lines.reduce((s, l) => s + (Math.max(1, Number(l.copies) || 1)), 0);

  const print = async () => {
    setError("");
    setBusy(true);
    // Opened now, while the click still counts, so the browser doesn't block it.
    const tab = window.open("", "_blank");
    try {
      saveFormat(format);
      const blob = await printLabels({ companyId, format, skip: format === "a4" ? Number(skip) || 0 : 0, items: lines.map((l) => ({ product: l.product._id, copies: Math.max(1, Number(l.copies) || 1) })) });
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      tab?.close();
      let message = errorText(err, t);
      if (err?.response?.data instanceof Blob) { try { message = JSON.parse(await err.response.data.text()).message || message; } catch { /* keep */ } }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalCard} style={{ maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3><Barcode size={16} /> {t("ng.catalog.labels.title")}</h3>
          <button type="button" className="tableActionBtn" onClick={onClose} aria-label={t("common.close")}><X size={16} /></button>
        </div>
        <p style={{ margin: "0 0 10px", fontSize: "0.85rem", opacity: 0.75 }}>{t("ng.catalog.labels.hint")}</p>

        <div style={{ position: "relative" }}>
          <input className={styles.input} style={{ width: "100%" }} autoFocus placeholder={t("ng.catalog.labels.search")} value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && results.length) { e.preventDefault(); add(results[0]); } }} />
          {results.length > 0 && (
            <div style={{ position: "absolute", insetInline: 0, top: "100%", zIndex: 5, background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: 8, marginTop: 4, overflow: "hidden" }}>
              {results.map((p) => (
                <button type="button" key={p._id} onClick={() => add(p)} style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "8px 10px", background: "none", border: "none", borderBottom: "1px solid var(--color-border-light)", color: "inherit", cursor: "pointer", textAlign: "start" }}>
                  <span>{p.name}<small style={{ opacity: 0.6 }}>{p.barcode || p.internalReference ? ` · ${p.barcode || p.internalReference}` : ""}</small></span>
                  <span>{ttc(p) !== null ? formatMoney(ttc(p), "DH") : ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0", fontSize: "0.9rem" }}>
          <tbody>
            {lines.map((l) => (
              <tr key={l.product._id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                <td style={{ padding: "6px 4px" }}>
                  {l.product.name}
                  <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{l.product.barcode || l.product.internalReference || t("ng.catalog.labels.newCode")}</div>
                </td>
                <td style={{ padding: "6px 4px", width: 90 }}>
                  <input className={styles.input} type="number" min="1" max="500" value={l.copies} onChange={(e) => setCopies(l.product._id, e.target.value)} style={{ width: 70 }} aria-label={t("ng.catalog.labels.copies")} />
                </td>
                <td style={{ width: 36 }}>
                  <button type="button" className="tableActionBtn" onClick={() => setLines((cur) => cur.filter((x) => x.product._id !== l.product._id))} aria-label={t("common.delete")}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!lines.length && <tr><td style={{ padding: 10, opacity: 0.6 }}>{t("ng.catalog.labels.empty")}</td></tr>}
          </tbody>
        </table>
        {lines.length > 0 && <button type="button" className="btnEdit" onClick={asStock}>{t("ng.catalog.labels.asStock")}</button>}

        <div style={{ display: "grid", gridTemplateColumns: format === "a4" ? "2fr 1fr" : "1fr", gap: 10, marginTop: 12 }}>
          <label className={styles.field}>{t("ng.catalog.labels.format")}
            <CustomSelect value={format} onSelect={setFormat} options={[{ value: "roll", label: t("ng.catalog.labels.roll") }, { value: "a4", label: t("ng.catalog.labels.a4") }]} />
          </label>
          {format === "a4" && (
            <label className={styles.field}>{t("ng.catalog.labels.skip")}
              <input className={styles.input} type="number" min="0" max="23" value={skip} onChange={(e) => setSkip(e.target.value)} />
            </label>
          )}
        </div>

        {error && <div className="errorMessage" style={{ marginTop: 10 }}>{error}</div>}
        <div className={styles.modalActions}>
          <button type="button" className="btnCancel" onClick={onClose}>{t("common.cancel")}</button>
          <button type="button" className="btnPrimary" disabled={!lines.length || busy} onClick={print}>
            <Printer size={15} /> {busy ? t("common.loading") : t("ng.catalog.labels.print").replace("{n}", total)}
          </button>
        </div>
      </div>
    </div>
  );
}
