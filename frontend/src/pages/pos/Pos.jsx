import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ScanBarcode, Trash2, LogIn, LogOut, Banknote, CreditCard, Printer, UserRound, PackagePlus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import CustomSelect from "../../components/useful/CustomSelect";
import SearchSelect from "../../components/useful/SearchSelect";
import { getCurrentSession, openSession, closeSession, cashMove, createPosSale, searchArticles, lookupBarcode, getArticlePrice, getSalesSettings } from "../../services/negoceService";
import { getCustomers } from "../../services/salesService";
import { useCompanyPicker, useWarehouses, PageTop, CompanyFilter, formatMoney, errorText } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import p from "./Pos.module.css";

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const METHODS = ["especes", "carte", "cheque", "virement", "credit"];

/**
 * Caisse comptoir: open a session (fond de caisse), scan or search
 * articles, take payment in several methods, give change, print the
 * ticket; close with the cash count (Z).
 */
export default function Pos() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const warehouses = useWarehouses(companyId);
  const [session, setSession] = useState(undefined);
  const [openForm, setOpenForm] = useState({ warehouse: "", register: "Caisse 1", openingFloat: "" });
  const [closeForm, setCloseForm] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [wantInvoice, setWantInvoice] = useState(false);
  const [pay, setPay] = useState({ especes: "", carte: "", cheque: "", virement: "", credit: "" });
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [busy, setBusy] = useState(false);
  const scanRef = useRef(null);
  // "Article divers": something sold without an article card (a key cut,
  // paint mixed to order…) — a description and a TTC price, no stock.
  const [divers, setDivers] = useState(null);
  const [vatRegistered, setVatRegistered] = useState(true);
  useEffect(() => { if (companyId) getSalesSettings(companyId).then((s) => setVatRegistered(s?.vatRegistered !== false)).catch(() => {}); }, [companyId]);
  const addDivers = () => {
    const ttc = Number(divers?.price);
    if (!divers?.description?.trim() || !(ttc > 0)) return;
    const vatRate = vatRegistered ? 20 : 0;
    setCart((c) => [...c, { product: null, name: divers.description.trim(), reference: t("ng.pos.diversRef"), unit: "", unitFactor: 1, unitPrice: r2(ttc / (1 + vatRate / 100)), discount: 0, vatRate, quantity: Number(divers.quantity) || 1 }]);
    setDivers(null);
    scanRef.current?.focus();
  };

  const loadSession = useCallback(async () => {
    if (!companyId) return;
    try { setSession(await getCurrentSession(companyId)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, t]);
  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => { if (companyId) getCustomers(companyId, { active: "true" }).then(setCustomers).catch(() => setCustomers([])); }, [companyId]);
  useEffect(() => {
    const store = warehouses.find((w) => w.hasCounter) || warehouses[0];
    if (store && !openForm.warehouse) setOpenForm((f) => ({ ...f, warehouse: store._id }));
  }, [warehouses, openForm.warehouse]);

  useEffect(() => {
    if (!query.trim() || !companyId) { setResults([]); return undefined; }
    // Debounced; an answer that arrives after the next keystroke is dropped.
    let stale = false;
    const h = setTimeout(() => searchArticles(companyId, query).then((r) => !stale && setResults(r)).catch(() => !stale && setResults([])), 300);
    return () => { stale = true; clearTimeout(h); };
  }, [query, companyId]);

  const add = async (product, unit) => {
    setError("");
    let price = { unit: unit || product.unit, unitFactor: 1, unitPrice: product.sellingPrice ?? 0, discount: 0, vatRate: product.vatRate ?? 20 };
    try { price = await getArticlePrice(product._id, customer || undefined, unit || undefined); } catch { /* keep public price */ }
    setCart((c) => {
      const i = c.findIndex((l) => l.product === product._id && l.unit === price.unit);
      if (i >= 0) return c.map((l, j) => (j === i ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { product: product._id, name: product.name, reference: product.internalReference, unit: price.unit, unitFactor: price.unitFactor, unitPrice: price.unitPrice ?? 0, discount: price.discount || 0, vatRate: price.vatRate, quantity: 1 }];
    });
    setQuery("");
    setResults([]);
    scanRef.current?.focus();
  };

  const onScan = async (e) => {
    e.preventDefault();
    const code = query.trim();
    if (!code) return;
    try {
      const { product, unit } = await lookupBarcode(companyId, code);
      await add(product, unit);
    } catch {
      if (results.length === 1) await add(results[0]);
      else if (!results.length) setError(t("ng.common.notFound"));
    }
  };

  const lineTTC = (l) => r2(l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100) * (1 + l.vatRate / 100));
  const total = r2(cart.reduce((sum, l) => sum + lineTTC(l), 0));
  const paid = r2(METHODS.reduce((sum, m) => sum + (Number(pay[m]) || 0), 0));
  const change = r2(paid - total);

  const checkout = async () => {
    setBusy(true);
    setError("");
    try {
      const payments = METHODS.filter((m) => Number(pay[m]) > 0).map((m) => ({ method: m, amount: Number(pay[m]) }));
      const sale = await createPosSale({
        session: session._id, customer: customer || undefined, customerName, invoice: wantInvoice,
        lines: cart.map((l) => (l.product
          ? { product: l.product, quantity: l.quantity, unit: l.unit, ...(can("pos.sales.discount") ? { unitPrice: l.unitPrice, discount: l.discount } : {}) }
          : { description: l.name, quantity: l.quantity, unitPrice: l.unitPrice, vatRate: l.vatRate, ...(can("pos.sales.discount") ? { discount: l.discount } : {}) })),
        payments,
      });
      setLastSale(sale);
      setCart([]);
      setPay({ especes: "", carte: "", cheque: "", virement: "", credit: "" });
      setCustomer(""); setCustomerName(""); setWantInvoice(false);
      await loadSession();
      window.open(`/pos/tickets/${sale._id}`, "_blank", "noopener");
    } catch (err) {
      setError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  if (session === undefined) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;

  if (!session) {
    return (
      <div className="pageShell">
        <PageTop crumbs={[{ label: t("ng.menu.pos"), href: "/pos" }, { label: t("ng.pos.title") }]} icon={ShoppingCart} title={t("ng.pos.title")} subtitle={t("ng.pos.closedHint")} />
        <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
        {error && <div className="errorMessage">{error}</div>}
        <div className={styles.panel} style={{ maxWidth: 520 }}>
          <h3>{t("ng.pos.open")}</h3>
          <label className={styles.field}>{t("ng.pos.store")}<CustomSelect value={openForm.warehouse} onSelect={(v) => setOpenForm({ ...openForm, warehouse: v })} options={warehouses.map((w) => ({ value: w._id, label: `${w.code} — ${w.name}` }))} /></label>
          <label className={styles.field}>{t("ng.pos.register")}<input className={styles.input} value={openForm.register} onChange={(e) => setOpenForm({ ...openForm, register: e.target.value })} /></label>
          <label className={styles.field}>{t("ng.pos.openingFloat")}<input className={styles.input} type="number" min="0" value={openForm.openingFloat} onChange={(e) => setOpenForm({ ...openForm, openingFloat: e.target.value })} /></label>
          <div className={styles.formActions}>
            <button type="button" className="btnPrimary" disabled={!can("pos.sessions.open")} onClick={async () => { try { await openSession({ ...openForm, company: companyId, openingFloat: Number(openForm.openingFloat) || 0 }); await loadSession(); } catch (err) { setError(errorText(err, t)); } }}><LogIn size={15} /> {t("ng.pos.open")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.pos"), href: "/pos" }, { label: t("ng.pos.title") }]} icon={ShoppingCart} title={`${t("ng.pos.title")} — ${session.register}`}
        subtitle={`${session.number} · ${session.warehouse?.name} · ${session.ticketCount} ${t("ng.pos.tickets")} · ${formatMoney(session.totalTTC)}`}>
        {lastSale && <button type="button" className="btnEdit" onClick={() => window.open(`/pos/tickets/${lastSale._id}`, "_blank", "noopener")}><Printer size={15} /> {t("ng.pos.reprint")} {lastSale.number}</button>}
        <button type="button" className="btnEdit" onClick={() => navigate(`/pos/sessions/${session._id}`)}>{t("ng.pos.sessionDetail")}</button>
        <button type="button" className="btnEdit" onClick={async () => { const amount = window.prompt(t("ng.pos.cashOutPrompt")); if (amount) { try { await cashMove(session._id, { type: "out", amount: Number(amount), reason: window.prompt(t("ng.stock.reason")) || "" }); await loadSession(); } catch (err) { setError(errorText(err, t)); } } }}><Banknote size={15} /> {t("ng.pos.cashOut")}</button>
        <button type="button" className="btnCancel" onClick={() => setCloseForm({ especes: "", carte: String(session.expected?.carte || ""), cheque: String(session.expected?.cheque || ""), virement: String(session.expected?.virement || ""), notes: "" })}><LogOut size={15} /> {t("ng.pos.close")}</button>
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}

      {closeForm && (
        <div className={styles.panel}>
          <h3>{t("ng.pos.close")} — {t("ng.pos.zReport")}</h3>
          <div className={styles.formGrid}>
            {["especes", "carte", "cheque", "virement"].map((m) => (
              <label key={m} className={styles.field}>{t(`ng.pos.methods.${m}`)} <small className={p.muted}>({t("ng.pos.expected")} {formatMoney(session.expected?.[m] || 0)})</small>
                <input className={styles.input} type="number" min="0" step="0.01" value={closeForm[m]} onChange={(e) => setCloseForm({ ...closeForm, [m]: e.target.value })} /></label>
            ))}
          </div>
          {closeForm.especes !== "" && <p className={r2(closeForm.especes - (session.expected?.especes || 0)) === 0 ? p.good : p.bad}>{t("ng.pos.difference")} : {formatMoney(r2(closeForm.especes - (session.expected?.especes || 0)))}</p>}
          <label className={styles.field}>{t("sales.notes")}<input className={styles.input} value={closeForm.notes} onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })} /></label>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setCloseForm(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={async () => { try { const z = await closeSession(session._id, { counted: Object.fromEntries(["especes", "carte", "cheque", "virement"].map((m) => [m, Number(closeForm[m]) || 0])), notes: closeForm.notes }); setCloseForm(null); navigate(`/pos/sessions/${z._id}`); } catch (err) { setError(errorText(err, t)); } }}>{t("ng.pos.closeConfirm")}</button>
          </div>
        </div>
      )}

      <div className={p.layout}>
        <div>
          <form className={p.scan} onSubmit={onScan}>
            <ScanBarcode size={22} />
            <input ref={scanRef} autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("ng.pos.scanPlaceholder")} />
            <button type="button" className="btnEdit" onClick={() => setDivers(divers ? null : { description: "", price: "", quantity: "1" })}><PackagePlus size={15} /> {t("ng.pos.divers")}</button>
          </form>
          {divers && (
            <form className={p.divers} onSubmit={(e) => { e.preventDefault(); addDivers(); }}>
              <input autoFocus placeholder={t("ng.pos.diversDescription")} value={divers.description} onChange={(e) => setDivers({ ...divers, description: e.target.value })} />
              <input type="number" min="0" step="0.01" placeholder={t("ng.pos.unitTTC")} value={divers.price} onChange={(e) => setDivers({ ...divers, price: e.target.value })} />
              <input type="number" min="1" step="any" placeholder={t("sales.lines.quantity")} value={divers.quantity} onChange={(e) => setDivers({ ...divers, quantity: e.target.value })} />
              <button type="submit" className="btnPrimary">{t("ng.pos.diversAdd")}</button>
            </form>
          )}
          {results.length > 0 && (
            <div className={p.results}>
              {results.map((r) => (
                <button key={r._id} type="button" className={p.result} onClick={() => add(r)}>
                  <strong>{r.name}</strong><small>{r.internalReference} · {t("ng.stock.quantity")} {r.quantity} {r.unit}</small>
                  {(r.packagings || []).length > 0 && <small>{r.packagings.map((k) => <span key={k.unit} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); add(r, k.unit); }} onKeyDown={() => {}} style={{ textDecoration: "underline", marginRight: 6 }}>+ {k.unit} ({k.factor})</span>)}</small>}
                </button>
              ))}
            </div>
          )}
          <table className={p.cart}>
            <thead><tr><th>{t("ng.articles.name")}</th><th className={p.num}>{t("sales.lines.quantity")}</th><th className={p.num}>{t("ng.pos.unitTTC")}</th>{can("pos.sales.discount") && <th className={p.num}>%</th>}<th className={p.num}>{t("sales.totals.ttc")}</th><th /></tr></thead>
            <tbody>
              {cart.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={i}>
                  <td><strong>{l.name}</strong><div className={p.muted}>{[l.reference, l.unit].filter(Boolean).join(" · ")}</div></td>
                  <td className={p.num}><input type="number" min="0" step="any" value={l.quantity} onChange={(e) => setCart(cart.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} /></td>
                  <td className={p.num}>{formatMoney(l.unitPrice * (1 + l.vatRate / 100), "")}</td>
                  {can("pos.sales.discount") && <td className={p.num}><input type="number" min="0" max="100" value={l.discount} onChange={(e) => setCart(cart.map((x, j) => (j === i ? { ...x, discount: Number(e.target.value) } : x)))} /></td>}
                  <td className={p.num}><strong>{formatMoney(lineTTC(l), "")}</strong></td>
                  <td><button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setCart(cart.filter((_, j) => j !== i))}><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {!cart.length && <tr><td colSpan={6} className={p.muted}>{t("ng.pos.emptyCart")}</td></tr>}
            </tbody>
          </table>
        </div>

        <div className={p.panel}>
          <div className={p.total}><span>{t("sales.totals.ttc")}</span><span>{formatMoney(total)}</span></div>
          <label className={styles.field}><span><UserRound size={13} /> {t("sales.customer")}</span>
            <SearchSelect value={customer} onSelect={setCustomer} options={[{ value: "", label: t("ng.pos.walkIn") }, ...customers.map((c) => ({ value: c._id, label: `${c.code ? `${c.code} — ` : ""}${c.name}` }))]} placeholder={t("ng.pos.walkIn")} noResultsLabel={t("sales.noCustomer")} />
          </label>
          {!customer && <input className={styles.input} placeholder={t("ng.pos.customerName")} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />}
          {customer && <label className={styles.checkboxRow}><input type="checkbox" checked={wantInvoice} onChange={(e) => setWantInvoice(e.target.checked)} /> {t("ng.pos.invoice")}</label>}
          <div className={p.methods}>
            {METHODS.filter((m) => m !== "credit" || customer).map((m) => (
              <label key={m} className={p.method}>{m === "carte" ? <CreditCard size={12} /> : null} {t(`ng.pos.methods.${m}`)}
                <span className={p.methodInput}>
                  <input type="number" min="0" step="0.01" value={pay[m]} onChange={(e) => setPay({ ...pay, [m]: e.target.value })} />
                  {paid < total && <button type="button" title={t("ng.pos.rest")} onClick={() => setPay({ ...pay, [m]: String(r2((Number(pay[m]) || 0) + total - paid)) })}>=</button>}
                </span>
              </label>
            ))}
          </div>
          <div className={p.quick}>
            {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 200) * 200].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v) => (
              <button key={v} type="button" onClick={() => setPay({ ...pay, especes: String(r2(v - (paid - (Number(pay.especes) || 0)))) })}>{formatMoney(v, "")}</button>
            ))}
          </div>
          <div className={p.row}><span>{t("ng.pos.paid")}</span><span>{formatMoney(paid)}</span></div>
          <div className={`${p.row} ${p.change}`}><span>{change >= 0 ? t("ng.pos.change") : t("ng.pos.missing")}</span><span className={change >= 0 ? p.good : p.bad}>{formatMoney(Math.abs(change))}</span></div>
          <button type="button" className={`btnPrimary ${p.big}`} disabled={busy || !cart.length || paid + 0.005 < total || !can("pos.sales.create")} onClick={checkout}>{t("ng.pos.checkout")}</button>
        </div>
      </div>
    </div>
  );
}
