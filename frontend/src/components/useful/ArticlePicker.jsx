import { useEffect, useRef, useState } from "react";
import { Search, X, Package, Loader2 } from "lucide-react";

import styles from "./SearchBar.module.css";
import { useI18n } from "../../hooks/useI18n";
import { searchArticles } from "../../services/negoceService";
import { cached, keyOf } from "../../utils/queryCache";

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 15;

export const articleLabel = (p) => (p ? `${p.internalReference ? `${p.internalReference} — ` : ""}${p.name}` : "");

/**
 * Picks ONE article by asking the server — the catalogue is never in the
 * browser. Typing waits for a pause (300 ms), then fetches at most 15
 * light rows (name, reference, unit, stock, thumbnail) from
 * /products/suggestions, which searches indexed tokens: word starts,
 * references, barcodes (also their last digits), supplier references.
 * Answers are cached for a moment; an older answer never replaces a newer.
 *
 *   value     selected article id
 *   article   the selected article's row (for its label), if known
 *   onPick    (article | null) — the whole light row, so the form can
 *             use its unit / packagings / prices without another call
 */
export default function ArticlePicker({ companyId, value, article, onPick, placeholder, showStock = true }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const ticket = useRef(0);
  const label = article ? articleLabel(article) : "";

  useEffect(() => { if (!open) setQuery(label); }, [label, open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || !companyId || !q || q === label) { setResults([]); setLoading(false); return undefined; }
    setLoading(true);
    const mine = ++ticket.current;
    const timer = setTimeout(async () => {
      try {
        const rows = await cached(keyOf("article-suggest", { companyId, q: q.toLowerCase() }), () => searchArticles(companyId, q, MAX_RESULTS), 20000);
        if (mine === ticket.current) { setResults(rows); setActive(0); }
      } catch {
        if (mine === ticket.current) setResults([]);
      } finally {
        if (mine === ticket.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open, companyId, label]);

  const pick = (p) => {
    onPick?.(p);
    setOpen(false);
    setQuery(articleLabel(p));
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); pick(results[active]); }
    if (e.key === "Escape") setOpen(false);
  };

  const typed = query.trim() && query.trim() !== label;

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        {loading ? <Loader2 size={18} className={`${styles.icon} ${styles.spinner}`} /> : <Search size={18} className={styles.icon} />}
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder || t("sales.lines.pickArticle")}
          value={query}
          autoComplete="off"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={(e) => { setOpen(true); e.target.select(); }}
          onBlur={() => setTimeout(() => { setOpen(false); setQuery(label); }, 180)}
          onKeyDown={onKeyDown}
        />
        {(query || value) && (
          <button type="button" className={styles.clearBtn} title={t("common.clear")} onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onPick?.(null); setQuery(""); setOpen(true); }}>
            <X size={18} />
          </button>
        )}
      </div>
      {open && typed && (
        <div className={styles.suggestions} role="listbox">
          {!loading && results.length === 0 ? (
            <div className={styles.suggestionItem}><span>{t("common.noResults")}</span></div>
          ) : (
            results.map((p, i) => (
              <button key={p._id} type="button" role="option" aria-selected={i === active} className={styles.suggestionItem}
                style={i === active ? { background: "var(--color-bg-secondary)", color: "var(--color-text-primary)" } : undefined}
                onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(p); }}>
                {p.thumbnail
                  ? <img src={p.thumbnail} alt="" loading="lazy" width={28} height={28} style={{ objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "#fff" }} />
                  : <Package size={14} />}
                <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  {p.name}
                  <small style={{ display: "block", opacity: 0.7 }}>{[p.internalReference, p.barcode].filter(Boolean).join(" · ")}</small>
                </span>
                {showStock && !p.isService && <small style={{ whiteSpace: "nowrap" }}>{p.available ?? p.quantity ?? 0} {p.unit}</small>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
