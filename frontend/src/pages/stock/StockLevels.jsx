import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Warehouse, Store, Download, Search, LayoutGrid, List, AlertTriangle, Boxes } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { ImportButton } from "../fx/ImportModal";
import CustomSelect from "../../components/useful/CustomSelect";
import Pagination from "../../components/useful/Pagination";
import { getStockLevels, getStockSummary, downloadValuation } from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { cached, peek, prefetch, keyOf } from "../../utils/queryCache";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, fmtQty, errorText } from "../negoce/common";
import ArticleVisual from "./ArticleVisual";
import s from "../sales/Sales.module.css";
import c from "./Catalog.module.css";

const VIEW_KEY = "sanity.levels.view";
const readView = () => { try { return localStorage.getItem(VIEW_KEY) || "cards"; } catch { return "cards"; } };
const saveView = (v) => { try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };
const SEARCH_DEBOUNCE_MS = 300;
// One page of 24 cards / 50 rows: the server filters, counts and values
// the rest (routes/stock.js), the browser never holds the whole stock.
const PAGE_SIZE = { cards: 24, table: 50 };

/**
 * Stock par dépôt. Warehouse cards first (articles in stock, to restock,
 * value — computed by MongoDB), then the articles of the chosen warehouse
 * (or of all of them) as cards: picture, quantity here, minimum, and where
 * the rest of the stock is. A table view is one click away.
 */
export default function StockLevels() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouse = params.get("warehouse") || "";
  const [view, setView] = useState(readView);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("stock"); // stock | all | low
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ warehouses: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastRequest = useRef(0);

  useEffect(() => {
    if (!companyId) return;
    getInventoryCategories(companyId).then(setCategories).catch(() => setCategories([]));
    cached(keyOf("stock-summary", { companyId }), () => getStockSummary(companyId)).then(setSummary).catch(() => setSummary(null));
  }, [companyId]);

  useEffect(() => {
    const id = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((cur) => { if (cur !== next) setPage(1); return next; });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const load = useCallback(async () => {
    const ticket = ++lastRequest.current;
    if (!companyId) return;
    const q = { companyId, warehouse, category, search, inStockOnly: show === "stock" ? "true" : "", lowOnly: show === "low" ? "true" : "", page, limit: PAGE_SIZE[view] };
    const key = keyOf("levels", q);
    const hit = peek(key);
    if (hit) setData(hit);
    else setLoading(true);
    try {
      const r = await cached(key, () => getStockLevels(q));
      if (ticket !== lastRequest.current) return;
      setData(r);
      setError("");
      if (r.pagination?.hasNext) {
        const next = { ...q, page: page + 1 };
        prefetch(keyOf("levels", next), () => getStockLevels(next));
      }
    } catch (err) {
      if (ticket === lastRequest.current) setError(errorText(err, t, "sales.errors.load"));
    } finally {
      if (ticket === lastRequest.current) setLoading(false);
    }
  }, [companyId, warehouse, category, search, show, page, view, t]);
  useEffect(() => { load(); }, [load]);

  const pickWarehouse = (id, nextShow) => {
    setParams(id ? { warehouse: id } : {});
    if (nextShow) setShow(nextShow);
    setPage(1);
  };
  const switchView = (v) => { setView(v); saveView(v); setPage(1); };

  const hidden = data.amountsHidden || summary?.amountsHidden;
  const whs = data.warehouses?.length ? data.warehouses : summary?.warehouses || [];
  const codeOf = useMemo(() => new Map(whs.map((w) => [String(w._id), w.code])), [whs]);
  const current = whs.find((w) => String(w._id) === warehouse);
  const rows = data.rows || [];
  const open = (r) => navigate(`/stock/articles/${r._id}`);

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.stock.levelsTitle") }]} icon={Warehouse}
        title={t("ng.stock.levelsTitle")} subtitle={t("ng.levels.subtitle")}>
        {can("finance.amounts.view") && <button type="button" className="btnEdit" onClick={() => downloadValuation({ companyId, category, warehouse })}><Download size={15} /> {t("ng.stock.valuationXlsx")}</button>}
        {can("inventory.articles.import") && companyId && <ImportButton t={t} kind="stock" companyId={companyId} onDone={() => load()} />}
      </PageTop>

      {/* ---- warehouse cards */}
      <div className={c.whGrid}>
        <WarehouseCard active={!warehouse} icon={Boxes} title={t("ng.levels.allWarehouses")} sub={summary ? `${fmtQty(summary.overall.articles)} ${t("ng.catalog.articlesCount")}` : ""}
          stats={summary?.overall} hidden={hidden} t={t} onClick={() => pickWarehouse("")} onLow={() => pickWarehouse("", "low")} />
        {(summary?.warehouses || []).map((w) => (
          <WarehouseCard key={w._id} active={String(w._id) === warehouse} icon={w.kind === "store" ? Store : Warehouse}
            code={w.code} title={w.name} sub={[w.kind === "store" ? t("ng.levels.store") : t("ng.levels.warehouse"), w.city, w.hasCounter ? t("ng.levels.counter") : null].filter(Boolean).join(" · ")}
            stats={w} hidden={hidden} t={t} onClick={() => pickWarehouse(String(w._id))} onLow={() => pickWarehouse(String(w._id), "low")} />
        ))}
      </div>

      {/* ---- filters */}
      <div className={c.bar}>
        <CompanyFilter companyId={companyId} setCompanyId={(v) => { setCompanyId(v); pickWarehouse(""); }} options={options} />
        <div className={c.search}>
          <Search size={16} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("ng.articles.search")} aria-label={t("ng.articles.search")} />
        </div>
        <div className="filterGroup" style={{ minWidth: 190 }}>
          <CustomSelect value={category} onSelect={(v) => { setCategory(v); setPage(1); }}
            options={[{ value: "", label: `${t("ng.articles.family")} : ${t("sales.all")}` }, ...categories.map((x) => ({ value: x._id, label: x.fullName || x.name }))]} />
        </div>
        <div className={c.toggle} role="group">
          {[["stock", t("ng.levels.inStock")], ["all", t("ng.levels.all")], ["low", t("ng.levels.low")]].map(([k, label]) => (
            <button key={k} type="button" className={show === k ? c.on : ""} onClick={() => { setShow(k); setPage(1); }}>
              {k === "low" && <AlertTriangle size={13} />} {label}
            </button>
          ))}
        </div>
        <div className={c.toggle} role="group">
          <button type="button" className={view === "cards" ? c.on : ""} onClick={() => switchView("cards")}><LayoutGrid size={14} /> {t("ng.catalog.cards")}</button>
          <button type="button" className={view === "table" ? c.on : ""} onClick={() => switchView("table")}><List size={14} /> {t("ng.catalog.table")}</button>
        </div>
      </div>

      {error && <div className="errorMessage">{error}</div>}
      {!hidden && data.totalValue !== undefined && (
        <div className={c.hint}>
          {current ? `${current.code} — ${current.name}` : t("ng.levels.allWarehouses")} · {fmtQty(data.pagination?.total || 0)} {t("ng.catalog.articlesCount")} · {t("ng.stock.value")} <strong>{formatMoney(data.totalValue)}</strong>
        </div>
      )}

      {/* ---- articles */}
      {loading && rows.length === 0 ? (
        <div className={view === "cards" ? c.stockCards : ""} aria-busy="true">
          {Array.from({ length: view === "cards" ? 6 : 10 }, (_, i) => <div key={i} className={view === "cards" ? c.skeletonCard : c.skeletonRow} style={view === "cards" ? { height: 210 } : undefined} />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="emptyStateBlock"><div className="emptyStateIcon"><Warehouse size={28} /></div><h2>{show === "low" ? t("ng.levels.noneLow") : t("ng.stock.none")}</h2><p>{show === "low" ? t("ng.levels.noneLowHint") : t("ng.levels.emptyHere")}</p></div>
      ) : view === "cards" ? (
        <div className={`${c.stockCards} ${loading ? c.stale : ""}`} aria-busy={loading}>
          {rows.map((r) => <StockCard key={r._id} r={r} warehouse={warehouse} whs={whs} codeOf={codeOf} hidden={hidden} t={t} onOpen={() => open(r)} />)}
        </div>
      ) : (
        <StockTable rows={rows} warehouse={warehouse} whs={whs} hidden={hidden} loading={loading} t={t} onOpen={open} />
      )}
      {data.pagination && data.pagination.pages > 1 && <Pagination page={data.pagination.page} pages={data.pagination.pages} total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />}
    </div>
  );
}

function WarehouseCard({ active, icon: Icon, code, title, sub, stats, hidden, t, onClick, onLow }) {
  return (
    <div className={`${c.whCard} ${active ? c.whActive : ""}`} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className={c.whHead}>
        <span className={c.whIcon}><Icon size={20} /></span>
        <div style={{ minWidth: 0 }}>
          <div className={c.whTitle}>{code && <span className={c.whCode}>{code}</span>}{title}</div>
          {sub && <div className={c.whSub}>{sub}</div>}
        </div>
      </div>
      <div className={c.whStats}>
        <span><strong>{stats ? fmtQty(stats.inStock) : "…"}</strong>{t("ng.levels.articlesInStock")}</span>
        {stats?.low > 0 ? (
          <button type="button" className={c.whLow} onClick={(e) => { e.stopPropagation(); onLow(); }}>
            <AlertTriangle size={12} /> <strong>{fmtQty(stats.low)}</strong> {t("ng.levels.toRestock")}
          </button>
        ) : <span className={c.muted}>0 {t("ng.levels.toRestock")}</span>}
        {!hidden && stats?.value !== undefined && <span className={c.whValue}>{formatMoney(stats.value, "DH")}</span>}
      </div>
    </div>
  );
}

function StockCard({ r, warehouse, whs, codeOf, hidden, t, onOpen }) {
  const qty = r.shownQuantity ?? r.quantity ?? 0;
  const state = qty <= 0 ? "out" : r.low ? "low" : "ok";
  const color = r.category?.color;
  const entries = Object.entries(r.byWarehouse || {}).filter(([, l]) => l.quantity);
  const max = Math.max(1, ...entries.map(([, l]) => l.quantity));
  const elsewhere = warehouse ? entries.filter(([id]) => id !== warehouse) : [];
  return (
    <article className={c.stockCard} style={{ "--fam": color || "#4c8dff" }} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      <div className={c.stockTop}>
        <ArticleVisual article={r} size="small" color={color} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className={c.name}>{r.name}</div>
          <div className={c.ref}>{[r.internalReference, r.category?.name, r.brand?.name].filter(Boolean).join(" · ")}</div>
        </div>
        <span className={`${c.pill} ${state === "ok" ? c.badgeOk : state === "low" ? c.badgeLow : c.badgeOut}`}>{t(`ng.catalog.state.${state}`)}</span>
      </div>
      <div className={c.stockQty}>
        <div>
          <small>{warehouse ? t("ng.levels.here") : t("ng.levels.total")}</small>
          <strong>{fmtQty(qty)}</strong> <span>{r.unit}</span>
        </div>
        <div className={c.stockSide}>
          {r.minimum > 0 && <span>{t("ng.levels.minimum")} {fmtQty(r.minimum)}</span>}
          {r.reserved > 0 && <span>{fmtQty(r.reserved)} {t("ng.levels.reserved")}</span>}
          <span>{fmtQty(r.available)} {t("ng.levels.available")}</span>
        </div>
      </div>
      {r.minimum > 0 && <div className={c.meter}><span style={{ width: `${Math.min(100, (qty / (r.minimum * 2)) * 100)}%` }} className={state === "ok" ? c.meterOk : state === "low" ? c.meterLow : c.meterOut} /></div>}
      {!warehouse ? (
        entries.length ? (
          <div className={c.split}>
            {whs.filter((w) => r.byWarehouse?.[w._id]?.quantity).map((w) => {
              const l = r.byWarehouse[w._id];
              return (
                <div key={w._id} className={c.splitRow}>
                  <span className={c.splitCode}>{w.code}</span>
                  <span className={c.splitBar}><span style={{ width: `${(l.quantity / max) * 100}%` }} /></span>
                  <span className={c.splitQty}>{fmtQty(l.quantity)}</span>
                </div>
              );
            })}
          </div>
        ) : <div className={c.muted}>{t("ng.levels.nowhere")}</div>
      ) : elsewhere.length > 0 && (
        <div className={c.muted}>{t("ng.levels.elsewhere")} : {elsewhere.map(([id, l]) => `${codeOf.get(id) || "?"} ${fmtQty(l.quantity)}`).join(" · ")}</div>
      )}
      {!hidden && r.value !== undefined && <div className={c.stockValue}>{t("ng.levels.value")} <strong>{formatMoney(r.value, "DH")}</strong></div>}
    </article>
  );
}

function StockTable({ rows, warehouse, whs, hidden, loading, t, onOpen }) {
  const perWh = !warehouse;
  const cols = perWh
    ? `110px 2.2fr ${whs.map(() => "0.7fr").join(" ")} 0.7fr 0.8fr${hidden ? "" : " 0.9fr"}`
    : `110px 2.2fr 0.8fr 0.7fr 0.7fr 0.8fr${hidden ? "" : " 0.9fr"}`;
  return (
    <div className={`dataTable ${loading ? c.stale : ""}`} aria-busy={loading}>
      <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
        <span>{t("ng.common.reference")}</span><span>{t("ng.articles.name")}</span>
        {perWh ? whs.map((w) => <span key={w._id} className={s.right}>{w.code}</span>) : <><span className={s.right}>{t("ng.levels.here")}</span><span className={s.right}>{t("ng.levels.minimum")}</span></>}
        <span className={s.right}>{t("ng.stock.reserved")}</span><span className={s.right}>{t("ng.stock.available")}</span>
        {!hidden && <span className={s.right}>{t("ng.stock.value")}</span>}
      </div>
      {rows.map((r) => (
        <div key={r._id} className="dataTableRow" style={{ gridTemplateColumns: cols, cursor: "pointer" }} role="button" tabIndex={0} onClick={() => onOpen(r)} onKeyDown={(e) => e.key === "Enter" && onOpen(r)}>
          <span className="dataTableCellMuted">{r.internalReference || "—"}</span>
          <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <ArticleVisual article={r} size="tiny" color={r.category?.color} />
            <span><strong>{r.name}</strong> <small className={s.muted}>{r.unit}</small><small className={s.muted} style={{ display: "block" }}>{r.category?.name}</small></span>
          </span>
          {perWh
            ? whs.map((w) => <span key={w._id} className={`${s.right} ${r.byWarehouse?.[w._id]?.quantity ? "" : "dataTableCellMuted"}`}>{fmtQty(r.byWarehouse?.[w._id]?.quantity || 0)}</span>)
            : <><span className={`${s.right} ${r.low ? s.bad : ""}`}><strong>{fmtQty(r.shownQuantity)}</strong>{r.low && <AlertTriangle size={12} />}</span><span className={`${s.right} dataTableCellMuted`}>{r.minimum ? fmtQty(r.minimum) : "—"}</span></>}
          <span className={`${s.right} dataTableCellMuted`}>{r.reserved ? fmtQty(r.reserved) : "—"}</span>
          <span className={`${s.right} ${perWh && r.low ? s.bad : ""}`}>{fmtQty(r.available)}</span>
          {!hidden && <span className={s.right}>{formatMoney(r.value, "")}</span>}
        </div>
      ))}
    </div>
  );
}
