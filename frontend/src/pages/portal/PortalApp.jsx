import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Package, FileText, User, LogOut, Download, Trash2, CheckCircle2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import {
  portalToken, portalLogin, portalMe, portalPassword, portalFamilies, portalCatalogue, portalOrder, portalOrders, portalOrderDetail, portalInvoices, portalInvoicePdf, portalStatementPdf,
} from "./portalApi";
import c from "./Portal.module.css";

/**
 * ============================================================
 * PORTAIL REVENDEURS — /portail
 * ============================================================
 * The reseller's staff log in with the access the office gave them
 * (Ventes › Portail revendeurs), browse the catalogue at THEIR price,
 * order, follow their orders, download invoices and statements.
 * ============================================================
 */
const fmt = (n) => `${(Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const fdate = (d) => (d ? new Date(d).toLocaleDateString("fr-MA") : "");
const errOf = (e) => e?.response?.data?.message || e?.message || "Erreur";

export default function PortalApp() {
  const { t } = useI18n();
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(!!portalToken.get());
  const load = useCallback(async () => {
    if (!portalToken.get()) { setChecking(false); return; }
    try { setMe(await portalMe()); } catch { portalToken.set(""); setMe(null); } finally { setChecking(false); }
  }, []);
  useEffect(() => { document.title = "Portail de commande"; load(); }, [load]);
  if (checking) return <div className={c.app}><div className={c.body}>…</div></div>;
  if (!me) return <Login t={t} onDone={load} />;
  if (me.user.mustChangePassword) return <ChangePassword t={t} forced onDone={load} />;
  return <Shop t={t} me={me} reload={load} logout={() => { portalToken.set(""); setMe(null); }} />;
}

function Login({ t, onDone }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try { const r = await portalLogin(form.email, form.password); portalToken.set(r.token); onDone(); } catch (err) { setError(errOf(err)); }
  };
  return (
    <div className={c.app}>
      <form className={c.login} onSubmit={submit}>
        <h1>{t("fx.portal.title")}</h1>
        <p className={c.muted}>{t("fx.portal.loginHint")}</p>
        {error && <div className={c.error}>{error}</div>}
        <label className={c.field}>E-mail<input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label className={c.field}>{t("fx.field.password")}<input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <button type="submit" className={c.btnPrimary} style={{ width: "100%" }}>{t("fx.field.signIn")}</button>
      </form>
    </div>
  );
}

function ChangePassword({ t, forced, onDone }) {
  const [form, setForm] = useState({ current: "", next: "", again: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");
    if (form.next !== form.again) { setError(t("fx.portal.mismatch")); return; }
    try { await portalPassword(form.current, form.next); setOk(t("fx.portal.passwordChanged")); setForm({ current: "", next: "", again: "" }); onDone?.(); } catch (err) { setError(errOf(err)); }
  };
  const inner = (
    <form className={c.login} onSubmit={submit} style={forced ? undefined : { margin: 0, maxWidth: 420 }}>
      <h2 style={{ marginTop: 0 }}>{t("fx.portal.changePassword")}</h2>
      {forced && <p className={c.muted}>{t("fx.portal.firstLogin")}</p>}
      {error && <div className={c.error}>{error}</div>}
      {ok && <div className={c.ok}>{ok}</div>}
      <label className={c.field}>{t("fx.portal.current")}<input type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required /></label>
      <label className={c.field}>{t("fx.portal.newPassword")}<input type="password" autoComplete="new-password" minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required /></label>
      <label className={c.field}>{t("fx.portal.again")}<input type="password" autoComplete="new-password" minLength={8} value={form.again} onChange={(e) => setForm({ ...form, again: e.target.value })} required /></label>
      <button type="submit" className={c.btnPrimary}>{t("common.save")}</button>
    </form>
  );
  return forced ? <div className={c.app}>{inner}</div> : inner;
}

const CART_KEY = "sanity.portal.cart";
function useCart() {
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } });
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private mode */ } }, [cart]);
  return [cart, setCart];
}

function Shop({ t, me, reload, logout }) {
  const [tab, setTab] = useState("catalogue");
  const [cart, setCart] = useCart();
  const count = cart.length;
  const canOrder = me.user.role === "buyer" && !me.customer.blocked;
  const tabs = [
    ["catalogue", t("fx.portal.catalogue"), Package],
    ...(canOrder ? [["cart", t("fx.portal.cart"), ShoppingCart]] : []),
    ["orders", t("fx.portal.orders"), FileText],
    ["invoices", t("fx.portal.invoices"), FileText],
    ["account", t("fx.portal.account"), User],
  ];
  return (
    <div className={c.app}>
      <header className={c.top}>
        <div className={c.brand}>{me.company.logo ? <img src={me.company.logo} alt="" /> : <span className={c.logoBox}>{(me.company.name || "S")[0]}</span>}{me.company.name}</div>
        <nav className={c.nav}>
          {tabs.map(([k, label, Icon]) => (
            <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => setTab(k)}><Icon size={15} /> {label}{k === "cart" && count > 0 && <span className={c.badge}>{count}</span>}</button>
          ))}
          <button type="button" onClick={logout} title={t("fx.field.logout")} aria-label={t("fx.field.logout")}><LogOut size={15} /></button>
        </nav>
      </header>
      <main className={c.body}>
        <div className={c.hero}>
          <div className={c.stat}><span>{me.customer.name}</span><strong style={{ fontSize: "1rem" }}>{me.user.name}</strong></div>
          <div className={c.stat}><span>{t("fx.portal.balance")}</span><strong>{fmt(me.customer.balance)}</strong>{me.customer.overdue > 0 && <div className={c.bad}>{t("fx.wa.overdue")} {fmt(me.customer.overdue)}</div>}</div>
          {me.customer.available !== null && <div className={c.stat}><span>{t("fx.portal.available")}</span><strong>{fmt(me.customer.available)}</strong></div>}
        </div>
        {me.portal.message && <div className={c.message}>{me.portal.message}</div>}
        {me.customer.blocked && <div className={c.error}>{t("fx.portal.blocked")}</div>}
        {tab === "catalogue" && <Catalogue t={t} me={me} canOrder={canOrder} cart={cart} setCart={setCart} />}
        {tab === "cart" && <Cart t={t} me={me} cart={cart} setCart={setCart} onOrdered={() => { reload(); setTab("orders"); }} />}
        {tab === "orders" && <Orders t={t} />}
        {tab === "invoices" && <Invoices t={t} />}
        {tab === "account" && <Account t={t} me={me} />}
      </main>
    </div>
  );
}

function Catalogue({ t, me, canOrder, cart, setCart }) {
  const [families, setFamilies] = useState([]);
  const [q, setQ] = useState({ search: "", family: "", promo: "", page: 1 });
  const [data, setData] = useState(null);
  const [qty, setQty] = useState({});
  const [error, setError] = useState("");
  useEffect(() => { portalFamilies().then(setFamilies).catch(() => {}); }, []);
  useEffect(() => {
    const h = setTimeout(() => portalCatalogue(q).then(setData).catch((err) => setError(errOf(err))), 250);
    return () => clearTimeout(h);
  }, [q]);
  const add = (p) => {
    const entry = qty[p._id] || {};
    const unit = entry.unit || p.unit;
    const factor = unit === p.unit ? 1 : (p.packagings.find((x) => x.unit === unit)?.factor || 1);
    const n = Number(entry.n) || 1;
    setCart((cur) => {
      const i = cur.findIndex((x) => x.product === p._id && x.unit === unit);
      if (i >= 0) return cur.map((x, j) => (j === i ? { ...x, quantity: x.quantity + n } : x));
      return [...cur, { product: p._id, name: p.name, ref: p.ref, unit, factor, quantity: n, net: p.net, vatRate: p.vatRate, thumb: p.thumb }];
    });
  };
  const roots = families.filter((f) => !f.parent);
  return (
    <>
      <div className={c.filters}>
        <input type="search" placeholder={t("fx.portal.search")} value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value, page: 1 })} aria-label={t("fx.portal.search")} />
        <select value={q.family} onChange={(e) => setQ({ ...q, family: e.target.value, page: 1 })} aria-label={t("fx.promo.families")}>
          <option value="">{t("fx.portal.allFamilies")}</option>
          {roots.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <button type="button" className={c.btn} aria-pressed={q.promo === "1"} style={q.promo === "1" ? { borderColor: "#0f766e", color: "#0f766e" } : undefined} onClick={() => setQ({ ...q, promo: q.promo === "1" ? "" : "1", page: 1 })}>{t("fx.portal.promos")}</button>
      </div>
      {error && <div className={c.error}>{error}</div>}
      <div className={c.grid}>
        {(data?.rows || []).map((p) => {
          const inCart = cart.filter((x) => x.product === p._id).reduce((a, x) => a + x.quantity * x.factor, 0);
          return (
            <article key={p._id} className={c.product}>
              {p.thumb ? <img src={p.thumb} alt={p.name} loading="lazy" /> : <div className={c.noImg} />}
              <div className={c.pBody}>
                <h3>{p.name}</h3>
                <span className={c.ref}>{p.ref}</span>
                {p.promotion && <span className={c.promo}>{p.promotion.freeGoods ? `${p.promotion.freeGoods} · ` : ""}{p.promotion.name}</span>}
                <span className={c.price}>{p.net === null ? t("fx.portal.onRequest") : fmt(p.net)}{p.discount > 0 && <span className={c.old}>{fmt(p.price)}</span>} <small className={c.muted}>HT / {p.unit}</small></span>
                {p.stock?.level && <span className={`${c.stock} ${c[p.stock.level]}`}>{t(`fx.portal.stock.${p.stock.level}`)}</span>}
                {p.stock?.quantity !== undefined && <span className={c.stock}>{t("fx.field.stock")} {p.stock.quantity}</span>}
                {canOrder && p.net !== null && (
                  <div className={c.addRow}>
                    <input type="number" min="1" value={qty[p._id]?.n ?? 1} aria-label={t("fx.fc.quantity")} onChange={(e) => setQty({ ...qty, [p._id]: { ...qty[p._id], n: e.target.value } })} />
                    {p.packagings.length > 0 && (
                      <select value={qty[p._id]?.unit || p.unit} aria-label="unit" onChange={(e) => setQty({ ...qty, [p._id]: { ...qty[p._id], unit: e.target.value } })}>
                        <option value={p.unit}>{p.unit}</option>
                        {p.packagings.map((x) => <option key={x.unit} value={x.unit}>{x.unit} ({x.factor})</option>)}
                      </select>
                    )}
                    <button type="button" className={c.btnPrimary} onClick={() => add(p)} aria-label={t("fx.portal.add")}><ShoppingCart size={15} /></button>
                  </div>
                )}
                {inCart > 0 && <span className={c.muted}>✓ {inCart} {p.unit} {t("fx.portal.inCart")}</span>}
              </div>
            </article>
          );
        })}
      </div>
      {data && data.rows.length === 0 && <p className={c.muted}>{t("fx.portal.noResult")}</p>}
      {data && data.pages > 1 && (
        <div className={c.pager}>
          <button type="button" className={c.btn} disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>‹</button>
          <span>{data.page} / {data.pages}</span>
          <button type="button" className={c.btn} disabled={q.page >= data.pages} onClick={() => setQ({ ...q, page: q.page + 1 })}>›</button>
        </div>
      )}
    </>
  );
}

function Cart({ t, me, cart, setCart, onOrdered }) {
  const [form, setForm] = useState({ customerReference: "", notes: "", deliveryMode: "delivery" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const totalHT = cart.reduce((a, x) => a + (x.net || 0) * x.factor * x.quantity, 0);
  const totalTTC = cart.reduce((a, x) => a + (x.net || 0) * x.factor * x.quantity * (1 + (x.vatRate ?? 20) / 100), 0);
  const min = me.portal.minOrderAmount || 0;
  const order = async () => {
    setBusy(true); setError("");
    try {
      await portalOrder({ ...form, lines: cart.map((x) => ({ product: x.product, quantity: x.quantity, unit: x.unit })) });
      setCart([]);
      onOrdered();
    } catch (err) { setError(errOf(err)); } finally { setBusy(false); }
  };
  if (!cart.length) return <p className={c.muted}>{t("fx.portal.emptyCart")}</p>;
  return (
    <div className={c.twoCols}>
      <table className={c.table}>
        <thead><tr><th>{t("fx.fc.article")}</th><th className={c.num}>{t("fx.fc.quantity")}</th><th className={c.num}>{t("fx.portal.unitPrice")}</th><th className={c.num}>{t("fx.common.total")}</th><th /></tr></thead>
        <tbody>
          {cart.map((x, i) => (
            <tr key={`${x.product}-${x.unit}`}>
              <td><strong>{x.name}</strong><div className={c.muted}>{x.ref}</div></td>
              <td className={c.num}><input type="number" min="1" style={{ width: 70, padding: 6, borderRadius: 8, border: "1px solid #cbd5e1" }} value={x.quantity} aria-label={t("fx.fc.quantity")} onChange={(e) => setCart(cart.map((y, j) => (j === i ? { ...y, quantity: Math.max(Number(e.target.value) || 1, 1) } : y)))} /> {x.unit}</td>
              <td className={c.num}>{fmt(x.net * x.factor)}</td>
              <td className={c.num}><strong>{fmt(x.net * x.factor * x.quantity)}</strong></td>
              <td><button type="button" className={c.btn} onClick={() => setCart(cart.filter((_, j) => j !== i))} aria-label={t("common.delete")}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={c.box}>
        <p>{t("fx.field.totalHT")} <strong>{fmt(totalHT)}</strong></p>
        <p>TTC ≈ <strong>{fmt(totalTTC)}</strong></p>
        {min > 0 && totalHT < min && <p className={c.bad}>{t("fx.portal.minimum")} {fmt(min)} HT</p>}
        <label className={c.field}>{t("ng.orders.customerReference")}<input value={form.customerReference} onChange={(e) => setForm({ ...form, customerReference: e.target.value })} /></label>
        <label className={c.field}>{t("ng.orders.deliveryMode")}
          <select value={form.deliveryMode} onChange={(e) => setForm({ ...form, deliveryMode: e.target.value })}>
            <option value="delivery">{t("ng.orders.modes.delivery")}</option><option value="pickup">{t("ng.orders.modes.pickup")}</option>
          </select>
        </label>
        <label className={c.field}>{t("fx.common.notes")}<textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        {error && <div className={c.error}>{error}</div>}
        <button type="button" className={c.btnPrimary} style={{ width: "100%" }} disabled={busy || (min > 0 && totalHT < min)} onClick={order}><CheckCircle2 size={16} /> {t("fx.portal.placeOrder")}</button>
        <p className={c.muted} style={{ marginTop: 8 }}>{t("fx.portal.orderNote")}</p>
      </div>
    </div>
  );
}

function Orders({ t }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => { portalOrders().then(setRows).catch(() => setRows([])); }, []);
  return (
    <>
      <table className={c.table}>
        <thead><tr><th>N°</th><th>{t("fx.common.date")}</th><th>{t("ng.orders.customerReference")}</th><th>{t("fx.common.status")}</th><th className={c.num}>TTC</th></tr></thead>
        <tbody>
          {(rows || []).map((o) => (
            <tr key={o._id} onClick={async () => setOpen(await portalOrderDetail(o._id))} style={{ cursor: "pointer" }}>
              <td><strong>{o.number}</strong></td><td>{fdate(o.date)}</td><td>{o.customerReference || "—"}</td><td>{o.statusLabel}</td><td className={c.num}>{fmt(o.totalTTC)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows && !rows.length && <p className={c.muted}>{t("fx.portal.noOrders")}</p>}
      {open && (
        <div className={c.box} style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>{open.number} — {open.statusLabel}</h3>
          <table className={c.table}>
            <tbody>{open.lines.map((l) => <tr key={l._id}><td>{l.description}</td><td className={c.num}>{l.quantity} {l.unit}</td><td className={c.num}>{l.deliveredQuantity ? `${l.deliveredQuantity} ✓` : ""}</td><td className={c.num}>{fmt(l.unitPrice * l.quantity * (1 - (l.discount || 0) / 100))}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Invoices({ t }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { portalInvoices().then(setRows).catch(() => setRows([])); }, []);
  const due = useMemo(() => (rows || []).reduce((a, i) => a + (i.due || 0), 0), [rows]);
  return (
    <>
      {error && <div className={c.error}>{error}</div>}
      <p>{t("fx.portal.toPay")} <strong>{fmt(due)}</strong></p>
      <table className={c.table}>
        <thead><tr><th>N°</th><th>{t("fx.common.date")}</th><th>{t("sales.dueDate")}</th><th className={c.num}>TTC</th><th className={c.num}>{t("fx.portal.remaining")}</th><th /></tr></thead>
        <tbody>
          {(rows || []).map((i) => (
            <tr key={i._id}>
              <td><strong>{i.number}</strong>{i.type === "credit_note" ? ` (${t("sales.invoiceTypes.credit_note")})` : ""}</td><td>{fdate(i.date)}</td>
              <td className={i.due > 0 && i.dueDate && new Date(i.dueDate) < new Date() ? c.bad : undefined}>{fdate(i.dueDate)}</td>
              <td className={c.num}>{fmt(i.totalTTC)}</td><td className={c.num}>{i.due > 0 ? fmt(i.due) : "—"}</td>
              <td><button type="button" className={c.btn} onClick={() => portalInvoicePdf(i).catch((err) => setError(errOf(err)))}><Download size={14} /> PDF</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Account({ t, me }) {
  const [error, setError] = useState("");
  return (
    <div className={c.twoCols}>
      <div className={c.box}>
        <h3 style={{ marginTop: 0 }}>{me.customer.name}</h3>
        <p className={c.muted}>{me.customer.code} · {me.customer.city}</p>
        <p>{t("fx.portal.balance")} <strong>{fmt(me.customer.balance)}</strong></p>
        {me.customer.creditLimit ? <p>{t("ng.customers.creditLimit")} {fmt(me.customer.creditLimit)}</p> : null}
        {error && <div className={c.error}>{error}</div>}
        <button type="button" className={c.btn} onClick={() => portalStatementPdf().catch((err) => setError(errOf(err)))}><FileText size={14} /> {t("fx.wa.statementPdf")}</button>
        <p className={c.muted} style={{ marginTop: 12 }}>{me.company.name} · {me.company.phone || ""} {me.company.email || ""}</p>
      </div>
      <ChangePassword t={t} />
    </div>
  );
}
