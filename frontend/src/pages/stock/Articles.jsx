import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Plus, AlertTriangle, LayoutGrid, List, Search, ChevronRight, Home, ShoppingCart, Truck, Tags, Barcode } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { ImportButton } from "../fx/ImportModal";
import CustomSelect from "../../components/useful/CustomSelect";
import Pagination from "../../components/useful/Pagination";
import StatusPill from "../../components/useful/StatusPill";
import { listArticles, getBrands } from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { getInventoryIcon } from "../../utils/inventoryIcons";
import { cached, peek, prefetch, keyOf } from "../../utils/queryCache";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, CompanyFilter, formatMoney, fmtQty, errorText } from "../negoce/common";
import ArticleVisual from "./ArticleVisual";
import { PurchaseRequestModal, SupplierPricesModal, SellingPricesModal } from "./ArticleModals";
import LabelsModal from "./LabelsModal";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";
import c from "./Catalog.module.css";

const VIEW_KEY = "sanity.articles.view";
const SEARCH_DEBOUNCE_MS = 300;
// One page is all the browser ever holds: 24 cards or 50 table rows. At that
// size plain rendering is cheap, so no virtualised list is needed — the
// catalogue itself (100 000+ articles) stays in MongoDB.
const PAGE_SIZE = { cards: 24, table: 50 };
const readView = () => { try { return localStorage.getItem(VIEW_KEY) || "cards"; } catch { return "cards"; } };
const saveView = (v) => { try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ } };

const stockState = (p) => {
  if (p.isService || p.isVariantParent) return null;
  if ((p.quantity || 0) <= 0) return "out";
  if (p.threshold > 0 && p.quantity <= p.threshold) return "low";
  return "ok";
};

/**
 * Catalogue d'articles. Cards: families → sub-families → article cards with
 * their photo, stock and price, and three shortcuts (demande d'achat, prix
 * fournisseurs, prix de vente). The table view is still one click away.
 *
 * Performance: search, filters, sort and paging run on the server; a page
 * already seen comes from a short-lived cache, the next page is prefetched,
 * the previous rows stay on screen while a new page loads, and only
 * thumbnails are shown (lazy-loaded).
 */
export default function Articles({ readOnly = false }) {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [view, setView] = useState(readView);
  const family = params.get("family") || "";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ brand: "", warehouse: "", lowStockOnly: "", variants: "stock" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { kind, article }
  const lastRequest = useRef(0);

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((cur) => { if (cur !== next) setPage(1); return next; });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!companyId) return;
    getInventoryCategories(companyId).then((r) => setCategories(Array.isArray(r) ? r : [])).catch(() => setCategories([]));
    getBrands(companyId).then(setBrands).catch(() => setBrands([]));
  }, [companyId]);

  // Family tree: children per parent, colour inherited from the top family,
  // article count including sub-families.
  const tree = useMemo(() => {
    const byId = new Map(categories.map((x) => [String(x._id), x]));
    const children = new Map();
    for (const x of categories) {
      const key = x.parent ? String(x.parent) : "";
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(x);
    }
    const colorOf = (x) => { let cur = x; while (cur) { if (cur.color) return cur.color; cur = cur.parent ? byId.get(String(cur.parent)) : null; } return "#4c8dff"; };
    const total = (x) => (x.productCount || 0) + (children.get(String(x._id)) || []).reduce((sum, ch) => sum + total(ch), 0);
    const pathOf = (id) => { const out = []; let cur = byId.get(String(id)); while (cur) { out.unshift(cur); cur = cur.parent ? byId.get(String(cur.parent)) : null; } return out; };
    return { byId, children, colorOf, total, pathOf };
  }, [categories]);

  const current = family ? tree.byId.get(family) : null;
  const subFamilies = tree.children.get(family) || [];
  const searching = search.trim().length > 0;
  // At the root of the card view, only the families show — pick one to see its articles.
  const showArticles = view === "table" || searching || !!family || filters.lowStockOnly || subFamilies.length === 0;

  const load = useCallback(async () => {
    const ticket = ++lastRequest.current;
    if (!companyId || !showArticles) { setRows([]); setPagination(null); setLoading(false); return; }
    const params = { companyId, ...filters, category: family, search, page, limit: PAGE_SIZE[view] };
    const key = keyOf("articles", params);
    const apply = (r) => { setRows(r.articles); setPagination(r.pagination); setHidden(r.amountsHidden); setError(""); };
    const hit = peek(key);
    if (hit) apply(hit);
    else setLoading(true); // the rows already shown stay, dimmed, until the new page arrives
    try {
      const r = await cached(key, () => listArticles(params));
      if (ticket !== lastRequest.current) return; // a newer search / filter already answered
      apply(r);
      if (r.pagination?.hasNext) {
        const nextParams = { ...params, page: page + 1 };
        prefetch(keyOf("articles", nextParams), () => listArticles(nextParams));
      }
    } catch (err) {
      if (ticket === lastRequest.current) setError(errorText(err, t, "sales.errors.load"));
    } finally {
      if (ticket === lastRequest.current) setLoading(false);
    }
  }, [companyId, filters, family, search, page, view, showArticles, t]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const goFamily = (id) => { setParams(id ? { family: id } : {}); setPage(1); };
  const switchView = (v) => { setView(v); saveView(v); setPage(1); };
  const open = (p) => navigate(`/stock/articles/${p._id}`);

  const canRequest = !readOnly && can("inventory.requests.create");
  const canSupplierPrices = !hidden && (can("purchasing.orders.view") || can("purchasing.suppliers.view") || can("finance.amounts.view"));
  const famColor = current ? tree.colorOf(current) : null;
  const columns = hidden ? "110px 2.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr" : "110px 2.2fr 1fr 0.8fr 0.8fr 0.8fr 0.9fr 0.9fr";

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.stock"), href: "/stock/articles" }, { label: t("ng.articles.title") }]} icon={Package}
        title={t("ng.articles.title")} subtitle={t("ng.catalog.subtitle")}>
        {!readOnly && can("inventory.articles.create") && companyId && (
          <button type="button" className="btnPrimary" onClick={() => navigate("/stock/articles/new", { state: { companyId, category: family } })}><Plus size={15} /> {t("ng.articles.new")}</button>
        )}
        {!readOnly && can("inventory.articles.import") && companyId && <ImportButton t={t} kind="articles" companyId={companyId} onDone={() => load()} />}
        {companyId && <button type="button" className="btnEdit" onClick={() => setModal({ kind: "labels" })}><Barcode size={15} /> {t("ng.catalog.labels.button")}</button>}
      </PageTop>

      <div className={c.bar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        <div className={c.search}>
          <Search size={16} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("ng.articles.search")} aria-label={t("ng.articles.search")} />
        </div>
        <div className="filterGroup" style={{ minWidth: 150 }}>
          <CustomSelect value={filters.brand} onSelect={set("brand")} options={[{ value: "", label: `${t("ng.articles.brand")} : ${t("sales.all")}` }, ...brands.map((b) => ({ value: b._id, label: b.name }))]} />
        </div>
        {warehouses.length > 1 && (
          <div className="filterGroup" style={{ minWidth: 170 }}>
            <CustomSelect value={filters.warehouse} onSelect={set("warehouse")} options={warehouseOptions(warehouses, t("ng.common.allWarehouses"))} />
          </div>
        )}
        <button type="button" className={`${c.chipToggle} ${filters.lowStockOnly ? c.on : ""}`} onClick={() => set("lowStockOnly")(filters.lowStockOnly ? "" : "true")}>
          <AlertTriangle size={14} /> {t("ng.articles.showLow")}
        </button>
        <div className={c.toggle} role="group">
          <button type="button" className={view === "cards" ? c.on : ""} onClick={() => switchView("cards")}><LayoutGrid size={14} /> {t("ng.catalog.cards")}</button>
          <button type="button" className={view === "table" ? c.on : ""} onClick={() => switchView("table")}><List size={14} /> {t("ng.catalog.table")}</button>
        </div>
      </div>

      {(family || view === "cards") && (
        <nav className={c.path} aria-label="families">
          <button type="button" onClick={() => goFamily("")}><Home size={14} /> {t("ng.catalog.allFamilies")}</button>
          {family && tree.pathOf(family).map((x, i, arr) => (
            <span key={x._id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ChevronRight size={14} />
              {i === arr.length - 1 ? <strong>{x.name}</strong> : <button type="button" onClick={() => goFamily(String(x._id))}>{x.name}</button>}
            </span>
          ))}
        </nav>
      )}

      {error && <div className="errorMessage">{error}</div>}

      {view === "cards" && !searching && !filters.lowStockOnly && subFamilies.length > 0 && (
        <>
          {family && <div className={c.sectionTitle}>{t("ng.catalog.subFamilies")}</div>}
          <div className={c.families}>
            {subFamilies.map((x) => {
              const Icon = getInventoryIcon(x.icon);
              const subs = (tree.children.get(String(x._id)) || []).length;
              return (
                <button type="button" key={x._id} className={c.family} style={{ "--fam": tree.colorOf(x) }} onClick={() => goFamily(String(x._id))}>
                  <span className={c.familyIcon}><Icon size={22} /></span>
                  <span className={c.familyName}>{x.name}</span>
                  <span className={c.familyMeta}>
                    {tree.total(x)} {t("ng.catalog.articlesCount")}{subs ? ` · ${subs} ${t("ng.catalog.subFamiliesCount")}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {showArticles && (
        <>
          {view === "cards" && (family || searching) && subFamilies.length > 0 && !searching && <div className={c.sectionTitle}>{t("ng.articles.title")}{current ? ` — ${current.name}` : ""}</div>}
          {loading && rows.length === 0 ? (
            <div className={view === "cards" ? c.articles : ""} aria-busy="true">
              {Array.from({ length: view === "cards" ? 8 : 10 }, (_, i) => <div key={i} className={view === "cards" ? c.skeletonCard : c.skeletonRow} />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="emptyStateBlock"><div className="emptyStateIcon"><Package size={28} /></div><h2>{t("ng.articles.empty")}</h2><p>{t("ng.articles.emptyHint")}</p></div>
          ) : view === "cards" ? (
            <div className={`${c.articles} ${loading ? c.stale : ""}`} aria-busy={loading}>
              {rows.map((p) => {
                const st = stockState(p);
                const qty = filters.warehouse ? p.warehouseStock?.quantity ?? 0 : p.quantity;
                const color = (p.category && tree.byId.get(String(p.category._id)) && tree.colorOf(tree.byId.get(String(p.category._id)))) || famColor;
                const ttc = p.sellingPrice !== null && p.sellingPrice !== undefined ? p.sellingPrice * (1 + (Number(p.vatRate ?? 20) / 100)) : null;
                return (
                  <article key={p._id} className={c.card} style={{ "--fam": color || "#4c8dff" }}>
                    <div className={c.cardTop} onClick={() => open(p)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(p)}>
                      <ArticleVisual article={p} color={color} />
                      {st && <span className={`${c.badge} ${st === "ok" ? c.badgeOk : st === "low" ? c.badgeLow : c.badgeOut}`}>{t(`ng.catalog.state.${st}`)}</span>}
                      {p.isVariantParent && <span className={c.badge}>{t("ng.articles.model")}</span>}
                      {p.brand?.name && <span className={c.brand}>{p.brand.name}</span>}
                    </div>
                    <div className={c.cardBody} onClick={() => open(p)}>
                      <span className={c.name}>{p.name}</span>
                      <span className={c.ref}>{[p.internalReference, p.barcode].filter(Boolean).join(" · ") || "—"}</span>
                      <div className={c.figures}>
                        <span className={c.stock}>
                          {p.isService || p.isVariantParent ? "—" : <><strong>{fmtQty(qty)}</strong> {p.unit}{p.reserved ? <> · {fmtQty(p.reserved)} {t("ng.catalog.reservedShort")}</> : null}</>}
                        </span>
                        <span className={c.price}>
                          {ttc !== null ? <><strong>{formatMoney(ttc, "DH")}</strong>{t("ng.catalog.publicTtc")}</> : "—"}
                        </span>
                      </div>
                    </div>
                    <div className={c.actions}>
                      <button type="button" disabled={!canRequest || p.isService || p.isVariantParent} title={t("ng.catalog.requestTitle")} onClick={() => setModal({ kind: "request", article: p })}>
                        <ShoppingCart size={16} /> {t("ng.catalog.request")}
                      </button>
                      <button type="button" disabled={!canSupplierPrices} title={t("ng.catalog.supplierTitle")} onClick={() => setModal({ kind: "suppliers", article: p })}>
                        <Truck size={16} /> {t("ng.catalog.buyPrices")}
                      </button>
                      <button type="button" title={t("ng.catalog.sellingTitle")} onClick={() => setModal({ kind: "selling", article: p })}>
                        <Tags size={16} /> {t("ng.catalog.sellPrices")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={`dataTable ${loading ? c.stale : ""}`} aria-busy={loading}>
              <div className="dataTableHead" style={{ gridTemplateColumns: columns }}>
                <span>{t("ng.common.reference")}</span><span>{t("ng.articles.name")}</span><span>{t("ng.articles.brand")}</span>
                <span className={s.right}>{filters.warehouse ? t("ng.stock.inWarehouse") : t("ng.stock.quantity")}</span>
                <span className={s.right}>{t("ng.stock.reserved")}</span><span className={s.right}>{t("ng.stock.available")}</span>
                <span className={s.right}>{t("ng.articles.publicPrice")}</span>{!hidden && <span className={s.right}>{t("ng.articles.cmup")}</span>}
              </div>
              {rows.map((p) => {
                const qty = filters.warehouse ? p.warehouseStock?.quantity ?? 0 : p.quantity;
                const low = stockState(p) === "low" || stockState(p) === "out";
                return (
                  <div key={p._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: columns }} role="button" tabIndex={0}
                    onClick={() => open(p)} onKeyDown={(e) => e.key === "Enter" && open(p)}>
                    <span className="dataTableCellMuted">{p.internalReference || "—"}</span>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <ArticleVisual article={p} size="tiny" color={p.category?._id ? tree.colorOf(tree.byId.get(String(p.category._id)) || p.category) : undefined} />
                      <span>
                        <strong>{p.name}</strong>
                        {p.isVariantParent && <StatusPill status="neutral" label={t("ng.articles.model")} />}
                        {p.tracking !== "none" && <small className={s.muted}> · {t(`ng.articles.tracking.${p.tracking}`)}</small>}
                        {p.isActive === false && <StatusPill status="rejected" label={t("sales.customers.inactive")} />}
                        <small className={s.muted} style={{ display: "block" }}>{p.category?.name}{p.barcode ? ` · ${p.barcode}` : ""}</small>
                      </span>
                    </span>
                    <span className="dataTableCellMuted">{p.brand?.name || "—"}</span>
                    <span className={`${s.right} ${low ? s.bad : ""}`}>{p.isService || p.isVariantParent ? "—" : <>{fmtQty(qty)} <small className={s.muted}>{p.unit}</small>{low && <AlertTriangle size={12} />}</>}</span>
                    <span className={`${s.right} dataTableCellMuted`}>{p.reserved ? fmtQty(p.reserved) : "—"}</span>
                    <span className={s.right}>{p.isService || p.isVariantParent ? "—" : fmtQty(p.available)}</span>
                    <span className={s.right}>{p.sellingPrice !== null && p.sellingPrice !== undefined ? formatMoney(p.sellingPrice, "") : "—"}</span>
                    {!hidden && <span className={`${s.right} dataTableCellMuted`}>{p.avgCost ? formatMoney(p.avgCost, "") : "—"}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {pagination && pagination.pages > 1 && <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />}
        </>
      )}

      {modal?.kind === "request" && <PurchaseRequestModal article={modal.article} companyId={companyId} onClose={() => setModal(null)} />}
      {modal?.kind === "suppliers" && <SupplierPricesModal article={modal.article} onClose={() => setModal(null)} />}
      {modal?.kind === "labels" && <LabelsModal companyId={companyId} initial={family || search ? rows : []} onClose={() => setModal(null)} />}
      {modal?.kind === "selling" && <SellingPricesModal article={modal.article} hidden={hidden} onClose={() => setModal(null)} />}
    </div>
  );
}
