import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, MapPin, Users, CloudUpload, Truck, ArrowLeft, RefreshCw, Phone, MessageCircle, Navigation, Trash2, Camera, Eraser, CheckCircle2, LogOut, Plus, Minus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../hooks/useI18n";
import api from "../../services/api";
import { getCompanies } from "../../services/companyService";
import { lastCompanyId } from "../purchasing/shared";
import { getItem, setItem, newRef, position, compressImage } from "./offlineStore";
import f from "./Field.module.css";

/**
 * ============================================================
 * SANITY TERRAIN — the phone app (/m)
 * ============================================================
 * Reps: their customers and the catalogue at each customer's price are
 * kept on the phone (IndexedDB), so an order is taken at the counter
 * with no network; it waits in the queue and leaves when the network
 * is back (each item has a clientRef: never sent twice). Visits are
 * logged with the GPS position.
 * Drivers: today's round, and the proof of delivery — signature on the
 * screen, photo, name of who received — also queued when offline.
 * ============================================================
 */
const fmt = (n) => `${(Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const fill = (s, v) => Object.entries(v).reduce((o, [k, x]) => o.replaceAll(`{${k}}`, x), String(s));
const EMPTY_QUEUE = { orders: [], visits: [], proofs: [] };
const waNumber = (p) => String(p || "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "").replace(/^0(?=[5-7]\d{8}$)/, "212");

export default function FieldApp() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  useEffect(() => {
    // installable app: manifest + service worker (only on /m)
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest-field.webmanifest";
    document.head.appendChild(link);
    const theme = document.createElement("meta");
    theme.name = "theme-color";
    theme.content = "#0f766e";
    document.head.appendChild(theme);
    if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});
    document.title = "Sanity Terrain";
    return () => { link.remove(); theme.remove(); };
  }, []);
  if (loading) return <div className={f.app}><div className={f.body}>{t("fx.common.loading")}</div></div>;
  if (!user) return <FieldLogin t={t} />;
  return <Field t={t} user={user} logout={logout} />;
}

function FieldLogin({ t }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await login(form.email, form.password);
    setBusy(false);
    if (r.requires2FA) setError(t("fx.field.use2fa"));
    else if (!r.success) setError(r.error || t("fx.field.loginFailed"));
  };
  return (
    <div className={f.app}>
      <form className={f.login} onSubmit={submit}>
        <h1>Sanity Terrain</h1>
        <p className={f.muted}>{t("fx.field.loginHint")}</p>
        {error && <div className={f.error}>{error} {error === t("fx.field.use2fa") && <Link to="/">→</Link>}</div>}
        <label className={f.field}>E-mail<input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className={f.field}>{t("fx.field.password")}<input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button type="submit" className={f.btnPrimary} style={{ width: "100%" }} disabled={busy}>{t("fx.field.signIn")}</button>
      </form>
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}

function Field({ t, user, logout }) {
  const online = useOnline();
  const [companyId, setCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [boot, setBoot] = useState(null);
  const [queue, setQueue] = useState(EMPTY_QUEUE);
  const [view, setView] = useState({ name: "home" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncLock = useRef(false);

  // company: last chosen on the computer, else the first one (cached for offline)
  useEffect(() => {
    (async () => {
      const cached = await getItem("company").catch(() => null);
      if (cached) { setCompanyId(cached.id); setCompanyName(cached.name); }
      try {
        const list = await getCompanies();
        const last = lastCompanyId();
        const c = list.find((x) => x._id === last) || list[0];
        if (c) { setCompanyId(c._id); setCompanyName(c.name); setItem("company", { id: c._id, name: c.name }); }
      } catch { /* offline: cached company */ }
    })();
    getItem("queue").then((q) => q && setQueue({ ...EMPTY_QUEUE, ...q })).catch(() => {});
  }, []);

  const saveQueue = useCallback(async (q) => { setQueue(q); await setItem("queue", q); }, []);

  // data for offline work: customers, catalogue (delta), levels, promotions
  const refresh = useCallback(async () => {
    if (!companyId) return;
    const key = `boot:${companyId}`;
    const cached = await getItem(key).catch(() => null);
    if (cached) setBoot(cached);
    if (!navigator.onLine) return;
    try {
      const since = cached?.serverTime && cached.catalogue ? cached.serverTime : "";
      const r = (await api.get(`/field/bootstrap?companyId=${companyId}${since ? `&since=${encodeURIComponent(since)}` : ""}`)).data.data;
      let catalogue = r.catalogue;
      if (catalogue && !r.catalogueComplete && cached?.catalogue) {
        const byId = new Map(cached.catalogue.map((p) => [p._id, p]));
        catalogue.forEach((p) => byId.set(p._id, p));
        catalogue = [...byId.values()];
      }
      const next = { ...r, catalogue: catalogue || cached?.catalogue };
      setBoot(next);
      await setItem(key, next);
    } catch (err) {
      if (!cached) setError(err.response?.data?.message || t("fx.field.loadFailed"));
    }
  }, [companyId, t]);
  useEffect(() => { refresh(); }, [refresh]);

  const sync = useCallback(async () => {
    if (syncLock.current || !navigator.onLine || !companyId) return;
    syncLock.current = true;
    setSyncing(true); setError("");
    try {
      let q = { ...EMPTY_QUEUE, ...(await getItem("queue")) };
      const orders = q.orders.filter((o) => o.status !== "failed");
      const visits = q.visits.filter((v) => v.status !== "failed");
      let sent = 0;
      if (orders.length || visits.length) {
        const out = (await api.post("/field/sync", { companyId, orders: orders.map((o) => o.payload), visits: visits.map((v) => v.payload) })).data.data;
        const apply = (list, results) => list.map((item) => {
          const r = results.find((x) => x.clientRef === item.payload.clientRef);
          if (!r) return item;
          if (r.ok) { sent += 1; return null; }
          return r.retry ? { ...item, error: r.error } : { ...item, status: "failed", error: r.error };
        }).filter(Boolean);
        q = { ...q, orders: [...apply(orders, out.orders), ...q.orders.filter((o) => o.status === "failed")], visits: [...apply(visits, out.visits), ...q.visits.filter((v) => v.status === "failed")] };
      }
      const proofs = [];
      for (const pr of q.proofs) {
        if (pr.status === "failed") { proofs.push(pr); continue; }
        try {
          await api.post(`/field/deliveries/${pr.noteId}/proof`, pr.payload);
          sent += 1;
        } catch (err) {
          const status = err.response?.status;
          proofs.push(status && status < 500 ? { ...pr, status: "failed", error: err.response?.data?.message } : pr);
        }
      }
      q = { ...q, proofs };
      await saveQueue(q);
      if (sent) setNotice(fill(t("fx.field.synced"), { n: sent }));
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || t("fx.field.syncFailed"));
    } finally {
      setSyncing(false);
      syncLock.current = false;
    }
  }, [companyId, refresh, saveQueue, t]);
  useEffect(() => { if (online) sync(); }, [online, sync]);

  const enqueue = async (kind, item) => {
    const q = { ...EMPTY_QUEUE, ...(await getItem("queue")) };
    q[kind] = [...q[kind], { ...item, status: "pending", createdAt: new Date().toISOString() }];
    await saveQueue(q);
    if (navigator.onLine) sync();
  };
  const pending = queue.orders.length + queue.visits.length + queue.proofs.length;
  const go = (name, extra = {}) => { setNotice(""); setError(""); setView({ name, ...extra }); window.scrollTo(0, 0); };
  const back = () => go(view.back || "home", view.backExtra || {});

  return (
    <div className={f.app}>
      <header className={f.top}>
        {view.name !== "home" ? <button type="button" onClick={back} aria-label={t("fx.field.back")}><ArrowLeft size={18} /></button> : null}
        <h1>{view.title || companyName || "Sanity"}</h1>
        <span className={`${f.dot} ${online ? "" : f.dotOff}`} title={online ? t("fx.field.online") : t("fx.field.offline")} />
        <button type="button" onClick={() => go("queue")} aria-label={t("fx.field.queue")}><CloudUpload size={16} /> {pending}</button>
      </header>
      <main className={f.body}>
        {!online && <div className={f.banner}>{t("fx.field.offlineBanner")}</div>}
        {notice && <div className={f.banner}>{notice}</div>}
        {error && <div className={f.error}>{error}</div>}
        {view.name === "home" && <Home t={t} user={user} boot={boot} pending={pending} go={go} logout={logout} syncing={syncing} sync={sync} />}
        {view.name === "customers" && <Customers t={t} boot={boot} go={go} next={view.next} />}
        {view.name === "customer" && <CustomerCard t={t} boot={boot} customer={view.customer} go={go} />}
        {view.name === "order" && <OrderScreen t={t} boot={boot} customer={view.customer} go={go} enqueue={enqueue} setNotice={setNotice} />}
        {view.name === "visit" && <VisitScreen t={t} customer={view.customer} go={go} enqueue={enqueue} setNotice={setNotice} />}
        {view.name === "queue" && <QueueScreen t={t} queue={queue} saveQueue={saveQueue} sync={sync} syncing={syncing} online={online} />}
        {view.name === "deliveries" && <Deliveries t={t} companyId={companyId} online={online} go={go} queue={queue} />}
        {view.name === "delivery" && <DeliveryScreen t={t} note={view.note} go={go} enqueue={enqueue} setNotice={setNotice} />}
      </main>
    </div>
  );
}

function Home({ t, user, boot, pending, go, logout, syncing, sync }) {
  const can = boot?.can || {};
  return (
    <>
      <p className={f.muted}>{fill(t("fx.field.hello"), { name: user.firstName || "" })}</p>
      <div className={f.tiles}>
        {can.orders && <button type="button" className={f.tile} onClick={() => go("customers", { next: "order", title: t("fx.field.newOrder") })}><ShoppingCart size={26} />{t("fx.field.newOrder")}<small>{t("fx.field.newOrderHint")}</small></button>}
        {can.visits && <button type="button" className={f.tile} onClick={() => go("customers", { next: "visit", title: t("fx.field.logVisit") })}><MapPin size={26} />{t("fx.field.logVisit")}<small>{t("fx.field.logVisitHint")}</small></button>}
        {(can.orders || can.visits) && <button type="button" className={f.tile} onClick={() => go("customers", { next: "customer", title: t("fx.field.myCustomers") })}><Users size={26} />{t("fx.field.myCustomers")}<small>{boot?.customers?.length ?? "…"}</small></button>}
        {can.deliveries && <button type="button" className={f.tile} onClick={() => go("deliveries", { title: t("fx.field.deliveries") })}><Truck size={26} />{t("fx.field.deliveries")}<small>{t("fx.field.deliveriesHint")}</small></button>}
        <button type="button" className={f.tile} onClick={() => go("queue", { title: t("fx.field.queue") })}><CloudUpload size={26} />{t("fx.field.queue")}<small>{fill(t("fx.field.pending"), { n: pending })}</small></button>
      </div>
      {boot && !can.orders && !can.visits && !can.deliveries && <div className={f.error} style={{ marginTop: 12 }}>{t("fx.field.noRights")}</div>}
      <div className={f.actions} style={{ marginTop: 18 }}>
        <button type="button" className={f.btn} onClick={sync} disabled={syncing}><RefreshCw size={16} /> {t("fx.field.syncNow")}</button>
        <button type="button" className={f.btnGhost} onClick={logout}><LogOut size={16} /> {t("fx.field.logout")}</button>
      </div>
      {boot?.serverTime && <p className={f.muted} style={{ marginTop: 10 }}>{t("fx.field.dataOf")} {new Date(boot.serverTime).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" })}</p>}
    </>
  );
}

function Customers({ t, boot, go, next }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (boot?.customers || []).filter((c) => !s || [c.name, c.code, c.city, c.zone].some((v) => String(v || "").toLowerCase().includes(s))).slice(0, 80);
  }, [boot, q]);
  return (
    <>
      <input className={f.search} type="search" placeholder={t("fx.field.searchCustomer")} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className={f.list}>
        {list.map((c) => (
          <button key={c._id} type="button" className={f.row} onClick={() => go(next, { customer: c, title: c.name, back: "customers", backExtra: { next, title: t("fx.field.myCustomers") } })}>
            <span className={f.grow}><strong>{c.name}</strong><small>{c.code} · {c.city || "—"}{c.priceLevel ? ` · ${c.priceLevel}` : ""}</small></span>
            {c.blocked ? <span className={`${f.pill} ${f.pillBad}`}>{t("ng.customers.blocked")}</span> : c.overdue > 0 ? <span className={f.pill}>{fmt(c.overdue)}</span> : null}
          </button>
        ))}
        {!boot && <p className={f.muted}>{t("fx.common.loading")}</p>}
      </div>
    </>
  );
}

function CustomerCard({ t, customer: c, go }) {
  const wa = waNumber(c.whatsapp || c.phone);
  return (
    <>
      <div className={f.card}>
        <h2>{c.name}</h2>
        <p className={f.muted}>{c.code} · {c.address || ""} {c.city || ""}</p>
        {c.balance !== undefined && <p>{t("fx.field.balance")} <strong>{fmt(c.balance)}</strong>{c.overdue > 0 && <span className={f.bad}> · {t("fx.wa.overdue")} {fmt(c.overdue)}</span>}</p>}
        {c.blocked && <p className={f.bad}>{t("ng.customers.blocked")} — {c.blockedReason}</p>}
        <div className={f.actions}>
          {c.phone && <a className={f.btn} href={`tel:${c.phone}`}><Phone size={16} /> {t("fx.field.call")}</a>}
          {wa && <a className={f.btn} href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
          {c.gps?.lat != null && <a className={f.btn} href={`https://www.google.com/maps/dir/?api=1&destination=${c.gps.lat},${c.gps.lng}`} target="_blank" rel="noreferrer"><Navigation size={16} /> {t("fx.field.route")}</a>}
        </div>
      </div>
      <div className={f.tiles}>
        <button type="button" className={f.tile} onClick={() => go("order", { customer: c, title: c.name, back: "customer", backExtra: { customer: c, title: c.name } })}><ShoppingCart size={24} />{t("fx.field.newOrder")}</button>
        <button type="button" className={f.tile} onClick={() => go("visit", { customer: c, title: c.name, back: "customer", backExtra: { customer: c, title: c.name } })}><MapPin size={24} />{t("fx.field.logVisit")}</button>
      </div>
    </>
  );
}

function OrderScreen({ t, boot, customer, go, enqueue, setNotice }) {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]); // { product, name, ref, unit, factor, quantity, unitPrice }
  const [notes, setNotes] = useState("");
  const [ref, setRef] = useState("");
  const [step, setStep] = useState("pick");
  const level = customer.priceLevel || boot?.defaultLevel;
  const discount = Number(customer.discountPercent) || 0;
  const promoIds = useMemo(() => new Set((boot?.promotions || []).flatMap((p) => (p.products || []).map(String))), [boot]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const words = s.split(/\s+/);
    return (boot?.catalogue || []).filter((p) => p.barcode === s || p.packs.some((x) => x.barcode === s) || words.every((w) => `${p.name} ${p.ref} ${p.family}`.toLowerCase().includes(w))).slice(0, 40);
  }, [boot, q]);
  const priceOf = (p, factor = 1) => (p.prices?.[level] ?? null) === null ? null : p.prices[level] * factor * (1 - discount / 100);
  const add = (p, pack = null) => {
    const unit = pack ? pack.unit : p.unit;
    const factor = pack ? pack.factor : 1;
    setCart((c) => {
      const i = c.findIndex((x) => x.product === p._id && x.unit === unit);
      if (i >= 0) return c.map((x, j) => (j === i ? { ...x, quantity: x.quantity + 1 } : x));
      return [...c, { product: p._id, name: p.name, ref: p.ref, unit, factor, quantity: 1, unitPrice: priceOf(p, factor), vat: p.vat }];
    });
    // scanned code → straight in the cart
    const s = q.trim();
    if (s && (p.barcode === s || p.packs.some((x) => x.barcode === s))) setQ("");
  };
  // A line at 0 stays visible (easy to fix a typo); it isn't sent.
  const setQty = (i, v) => setCart((c) => c.map((x, j) => (j === i ? { ...x, quantity: Math.max(Number(String(v).replace(",", ".")) || 0, 0) } : x)));
  const totalHT = cart.reduce((a, x) => a + (x.unitPrice || 0) * x.quantity, 0);
  const totalTTC = cart.reduce((a, x) => a + (x.unitPrice || 0) * x.quantity * (1 + (x.vat ?? 20) / 100), 0);
  const save = async () => {
    const gps = await position();
    const clientRef = newRef("ord");
    const lines = cart.filter((x) => x.quantity > 0).map((x) => ({ product: x.product, quantity: x.quantity, unit: x.unit }));
    await enqueue("orders", { label: `${customer.name} — ${lines.length} ligne(s) · ≈ ${fmt(totalTTC)} TTC`, payload: { clientRef, customer: customer._id, lines, notes, customerReference: ref, takenAt: new Date().toISOString(), gps } });
    await enqueue("visits", { label: `${customer.name} — ${t("fx.visits.outcomes.order")}`, payload: { clientRef: newRef("vis"), customer: customer._id, outcome: "order", orderClientRef: clientRef, visitedAt: new Date().toISOString(), gps } });
    go("home");
    setNotice(t("fx.field.orderQueued"));
  };
  if (customer.blocked) return <div className={f.error}>{t("ng.customers.blocked")} — {customer.blockedReason}</div>;
  if (step === "review") {
    return (
      <>
        <div className={f.card}>
          <h2>{customer.name}</h2>
          <p className={f.muted}>{level ? `${t("ng.pricing.levelShort")} ${level}` : ""}{discount ? ` · −${discount} %` : ""}</p>
          {cart.map((x, i) => (
            <div key={`${x.product}-${x.unit}`} className={f.row} style={{ cursor: "default" }}>
              <span className={f.grow}><strong>{x.name}</strong><small>{x.unit} · {x.unitPrice === null ? "—" : fmt(x.unitPrice)}</small></span>
              <span className={f.qty}>
                <button type="button" onClick={() => setQty(i, x.quantity - 1)} aria-label="-"><Minus size={14} /></button>
                <input value={x.quantity} inputMode="decimal" onChange={(e) => setQty(i, e.target.value)} aria-label={t("fx.fc.quantity")} />
                <button type="button" onClick={() => setQty(i, x.quantity + 1)} aria-label="+"><Plus size={14} /></button>
              </span>
              <button type="button" className={f.btnGhost} onClick={() => setCart(cart.filter((_, j) => j !== i))} aria-label={t("common.delete")}><Trash2 size={16} /></button>
            </div>
          ))}
          <p style={{ marginTop: 10 }}>{t("fx.field.totalHT")} <strong>{fmt(totalHT)}</strong> · TTC ≈ <strong>{fmt(totalTTC)}</strong></p>
          <p className={f.muted}>{t("fx.field.priceNote")}</p>
        </div>
        <label className={f.field}>{t("ng.orders.customerReference")}<input value={ref} onChange={(e) => setRef(e.target.value)} /></label>
        <label className={f.field}>{t("fx.common.notes")}<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className={f.cartBar}>
          <button type="button" className={f.btn} onClick={() => setStep("pick")}><ArrowLeft size={16} /></button>
          <strong>{fmt(totalTTC)}</strong>
          <button type="button" className={f.btnPrimary} disabled={!cart.some((x) => x.quantity > 0)} onClick={save}><CheckCircle2 size={16} /> {t("fx.field.saveOrder")}</button>
        </div>
      </>
    );
  }
  return (
    <>
      <input className={f.search} type="search" inputMode="search" placeholder={t("fx.field.searchArticle")} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className={f.list}>
        {results.map((p) => {
          const price = priceOf(p);
          const inCart = cart.filter((x) => x.product === p._id);
          return (
            <div key={p._id} className={f.row} style={{ cursor: "default", flexWrap: "wrap" }}>
              {p.thumb ? <img className={f.thumb} src={p.thumb} alt="" loading="lazy" /> : <span className={f.thumb} />}
              <span className={f.grow}>
                <strong>{p.name}</strong>
                <small>{p.ref}{p.stock !== null ? ` · ${t("fx.field.stock")} ${p.stock}` : ""}{promoIds.has(String(p._id)) ? " · " : ""}{promoIds.has(String(p._id)) && <span className={`${f.pill} ${f.pillGood}`}>Promo</span>}</small>
              </span>
              <span className={f.price}>{price === null ? "—" : fmt(price)}</span>
              <div className={f.actions} style={{ width: "100%", marginTop: 6 }}>
                <button type="button" className={f.btn} onClick={() => add(p)}><Plus size={15} /> {p.unit}</button>
                {p.packs.map((x) => <button key={x.unit} type="button" className={f.btn} onClick={() => add(p, x)}><Plus size={15} /> {x.unit} ({x.factor})</button>)}
                {inCart.map((x) => <span key={x.unit} className={`${f.pill} ${f.pillGood}`}>{x.quantity} {x.unit}</span>)}
              </div>
            </div>
          );
        })}
        {q && !results.length && <p className={f.muted}>{t("fx.field.noArticle")}</p>}
        {!q && <p className={f.muted}>{t("fx.field.searchHint")}</p>}
      </div>
      {cart.length > 0 && (
        <div className={f.cartBar}>
          <span className={f.qty}>
            <button type="button" onClick={() => setQty(cart.length - 1, cart[cart.length - 1].quantity - 1)} aria-label="-"><Minus size={14} /></button>
            <input value={cart[cart.length - 1].quantity} inputMode="decimal" onChange={(e) => setQty(cart.length - 1, e.target.value)} aria-label={t("fx.fc.quantity")} />
            <button type="button" onClick={() => setQty(cart.length - 1, cart[cart.length - 1].quantity + 1)} aria-label="+"><Plus size={14} /></button>
          </span>
          <strong>{cart.length} · {fmt(totalHT)} HT</strong>
          <button type="button" className={f.btnPrimary} onClick={() => setStep("review")}>{t("fx.field.review")}</button>
        </div>
      )}
    </>
  );
}

function VisitScreen({ t, customer, go, enqueue, setNotice }) {
  const [form, setForm] = useState({ outcome: "no_order", notes: "", nextVisitAt: "" });
  const save = async () => {
    const gps = await position();
    await enqueue("visits", { label: `${customer.name} — ${t(`fx.visits.outcomes.${form.outcome}`)}`, payload: { clientRef: newRef("vis"), customer: customer._id, ...form, nextVisitAt: form.nextVisitAt || null, visitedAt: new Date().toISOString(), gps } });
    go("home");
    setNotice(t("fx.field.visitQueued"));
  };
  return (
    <>
      <div className={f.card}><h2>{customer.name}</h2><p className={f.muted}>{customer.address} {customer.city}</p></div>
      <label className={f.field}>{t("fx.visits.outcome")}
        <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
          {["no_order", "order", "collection", "closed", "prospect", "other"].map((k) => <option key={k} value={k}>{t(`fx.visits.outcomes.${k}`)}</option>)}
        </select>
      </label>
      <label className={f.field}>{t("fx.common.notes")}<textarea rows={4} value={form.notes} placeholder={t("fx.field.visitNotesHint")} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      <label className={f.field}>{t("fx.field.nextVisit")}<input type="date" value={form.nextVisitAt} onChange={(e) => setForm({ ...form, nextVisitAt: e.target.value })} /></label>
      <p className={f.muted}>{t("fx.field.gpsNote")}</p>
      <button type="button" className={f.btnPrimary} style={{ width: "100%" }} onClick={save}><CheckCircle2 size={16} /> {t("common.save")}</button>
    </>
  );
}

function QueueScreen({ t, queue, saveQueue, sync, syncing, online }) {
  const all = [
    ...queue.orders.map((x) => ({ ...x, kind: "orders", icon: ShoppingCart })),
    ...queue.visits.map((x) => ({ ...x, kind: "visits", icon: MapPin })),
    ...queue.proofs.map((x) => ({ ...x, kind: "proofs", icon: Truck })),
  ];
  const remove = (item) => saveQueue({ ...queue, [item.kind]: queue[item.kind].filter((x) => x !== queue[item.kind].find((y) => y.createdAt === item.createdAt && (y.payload?.clientRef || y.noteId) === (item.payload?.clientRef || item.noteId))) });
  return (
    <>
      <p className={f.muted}>{t("fx.field.queueHint")}</p>
      <button type="button" className={f.btnPrimary} style={{ width: "100%", marginBottom: 12 }} disabled={!online || syncing || !all.length} onClick={sync}><RefreshCw size={16} /> {syncing ? t("fx.common.loading") : t("fx.field.syncNow")}</button>
      <div className={f.list}>
        {all.map((x) => (
          <div key={`${x.kind}-${x.createdAt}-${x.payload?.clientRef || x.noteId}`} className={f.row} style={{ cursor: "default" }}>
            <x.icon size={18} />
            <span className={f.grow}><strong>{x.label}</strong><small>{new Date(x.createdAt).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" })}{x.error ? ` · ${x.error}` : ""}</small></span>
            {x.status === "failed" ? <span className={`${f.pill} ${f.pillBad}`}>{t("fx.field.failed")}</span> : <span className={f.pill}>{t("fx.field.waiting")}</span>}
            {x.status === "failed" && <button type="button" className={f.btnGhost} onClick={() => remove(x)} aria-label={t("common.delete")}><Trash2 size={16} /></button>}
          </div>
        ))}
        {!all.length && <p className={f.muted}>{t("fx.field.queueEmpty")}</p>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- driver
function Deliveries({ t, companyId, online, go, queue }) {
  const [rounds, setRounds] = useState(null);
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!companyId) return;
    const key = `rounds:${companyId}:${day}`;
    getItem(key).then((x) => x && setRounds(x)).catch(() => {});
    if (!online) return;
    api.get(`/field/deliveries?companyId=${companyId}&date=${day}`).then((r) => { setRounds(r.data.data); setItem(key, r.data.data); }).catch((err) => setError(err.response?.data?.message || t("fx.field.loadFailed")));
  }, [companyId, day, online, t]);
  const queued = new Set(queue.proofs.map((p) => p.noteId));
  return (
    <>
      <label className={f.field}>{t("fx.common.date")}<input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></label>
      {error && <div className={f.error}>{error}</div>}
      {(rounds || []).map((r) => (
        <div key={r._id} className={f.card}>
          <h2>{r.number} · {r.zone || ""}</h2>
          <p className={f.muted}>{r.vehicle} · {r.notes?.length || 0} BL</p>
          <div className={f.list}>
            {r.notes.map((n) => {
              const done = n.status === "delivered" || queued.has(n._id);
              return (
                <button key={n._id} type="button" className={f.row} onClick={() => go("delivery", { note: n, title: n.number, back: "deliveries", backExtra: { title: t("fx.field.deliveries") } })}>
                  <span className={f.grow}><strong>{n.roundOrder}. {n.customer?.name}</strong><small>{n.number} · {n.deliveryAddress || n.customer?.address || ""} {n.customer?.city || ""}</small></span>
                  {done ? <span className={`${f.pill} ${f.pillGood}`}>{queued.has(n._id) && n.status !== "delivered" ? t("fx.field.waiting") : t("fx.field.delivered")}</span> : <span className={f.pill}>{t("fx.field.toDeliver")}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {rounds && !rounds.length && <p className={f.muted}>{t("fx.field.noRound")}</p>}
    </>
  );
}

function SignaturePad({ onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  useEffect(() => {
    const c = ref.current;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e) => { drawing.current = true; ref.current.setPointerCapture(e.pointerId); const p = pos(e); const ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e) => { if (!drawing.current) return; const p = pos(e); const ctx = ref.current.getContext("2d"); ctx.lineTo(p.x, p.y); ctx.stroke(); dirty.current = true; };
  const up = () => { if (!drawing.current) return; drawing.current = false; if (dirty.current) onChange(ref.current.toDataURL("image/png")); };
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); dirty.current = false; onChange(""); };
  return (
    <div>
      <canvas ref={ref} className={f.sign} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <button type="button" className={f.btnGhost} onClick={clear}><Eraser size={15} /> Effacer</button>
    </div>
  );
}

function DeliveryScreen({ t, note, go, enqueue, setNotice }) {
  const [form, setForm] = useState({ receivedBy: note.receivedBy || "", reserves: "", cashCollected: "", signature: "", photo: "" });
  const [error, setError] = useState("");
  const delivered = note.status === "delivered";
  const pickPhoto = async (file) => { if (file) setForm({ ...form, photo: await compressImage(file) }); };
  const save = async () => {
    if (!form.receivedBy.trim()) { setError(t("fx.field.needName")); return; }
    if (!form.signature && !form.photo) { setError(t("fx.field.needProof")); return; }
    const gps = await position();
    await enqueue("proofs", { noteId: note._id, label: `${note.number} — ${note.customer?.name}`, payload: { ...form, cashCollected: Number(form.cashCollected) || 0, gps, takenAt: new Date().toISOString(), clientRef: newRef("pod") } });
    go("deliveries", { title: t("fx.field.deliveries") });
    setNotice(t("fx.field.proofQueued"));
  };
  return (
    <>
      <div className={f.card}>
        <h2>{note.customer?.name}</h2>
        <p className={f.muted}>{note.number} · {note.deliveryAddress || note.customer?.address} {note.customer?.city}</p>
        <div className={f.actions}>
          {note.customer?.phone && <a className={f.btn} href={`tel:${note.customer.phone}`}><Phone size={16} /> {t("fx.field.call")}</a>}
          {note.customer?.gps?.lat != null
            ? <a className={f.btn} href={`https://www.google.com/maps/dir/?api=1&destination=${note.customer.gps.lat},${note.customer.gps.lng}`} target="_blank" rel="noreferrer"><Navigation size={16} /> {t("fx.field.route")}</a>
            : <a className={f.btn} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${note.deliveryAddress || note.customer?.address || ""} ${note.customer?.city || ""}`)}`} target="_blank" rel="noreferrer"><Navigation size={16} /> {t("fx.field.route")}</a>}
        </div>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>{(note.lines || []).map((l, i) => <li key={i}>{l.quantity} {l.unit} — {l.description}</li>)}</ul>
        {note.totalTTC !== undefined && <p style={{ marginTop: 8 }}>TTC <strong>{fmt(note.totalTTC)}</strong></p>}
      </div>
      {delivered ? <div className={f.banner}>{t("fx.field.delivered")} · {note.receivedBy}</div> : (
        <>
          {error && <div className={f.error}>{error}</div>}
          <label className={f.field}>{t("fx.pod.receivedBy")} *<input value={form.receivedBy} onChange={(e) => setForm({ ...form, receivedBy: e.target.value })} /></label>
          <div className={f.field}>{t("fx.pod.signature")}<SignaturePad onChange={(signature) => setForm((x) => ({ ...x, signature }))} /></div>
          <div className={f.field}>{t("fx.pod.photo")}
            <label className={f.btn} style={{ width: "fit-content" }}><Camera size={16} /> {t("fx.field.takePhoto")}<input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => pickPhoto(e.target.files?.[0])} /></label>
            {form.photo && <img className={f.photo} src={form.photo} alt={t("fx.pod.photo")} />}
          </div>
          <label className={f.field}>{t("ng.delivery.reserves")}<textarea rows={2} value={form.reserves} onChange={(e) => setForm({ ...form, reserves: e.target.value })} /></label>
          <label className={f.field}>{t("ng.delivery.cashCollected")}<input inputMode="decimal" value={form.cashCollected} onChange={(e) => setForm({ ...form, cashCollected: e.target.value })} /></label>
          <button type="button" className={f.btnPrimary} style={{ width: "100%" }} onClick={save}><CheckCircle2 size={16} /> {t("fx.field.confirmDelivery")}</button>
        </>
      )}
    </>
  );
}
