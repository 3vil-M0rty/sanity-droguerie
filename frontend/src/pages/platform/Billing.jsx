import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt, RefreshCw, FilePlus2, Send, Banknote, FileMinus2, Download, Trash2, Plus, Save, Pencil, X, Printer, PackagePlus } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { PageTop } from "../negoce/common";
import { fill } from "../fx/shared";
import {
  getBillingSettings, saveBillingSettings, getPlans, createPlan, updatePlan,
  getSubscriptions, saveSubscription, getPlatformInvoices, generateInvoices, createPlatformInvoice,
  issuePlatformInvoice, payPlatformInvoice, creditPlatformInvoice, deletePlatformInvoice,
  downloadPlatformInvoice, refreshStandings, loadDefaultCatalog, createSetupInvoice, downloadPriceList,
} from "../../services/platformService";
import styles from "./Ops.module.css";

/**
 * Platform operator: invoicing the clients — subscriptions, invoices
 * (monthly run, issue, payment, credit note, PDF), plans and the
 * seller's legal details. Backend: routes/billing.js.
 */
const TABS = ["clients", "invoices", "plans", "settings"];
const money = (n) => `${(Number(n) || 0).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
const day = (d) => (d ? new Date(d).toLocaleDateString("fr-MA") : "—");
const thisPeriod = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const errText = (err) => err.response?.data?.message || String(err.message || err);

export default function Billing() {
  const { t } = useI18n();
  const [tab, setTab] = useState("clients");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);

  const loadCommon = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([getPlans(), getSubscriptions()]);
      setPlans(p);
      setSubs(s);
    } catch (err) { setError(errText(err)); }
  }, []);
  useEffect(() => { loadCommon(); }, [loadCommon]);

  const run = async (fn, okText) => {
    setError("");
    setNotice("");
    try {
      const r = await fn();
      if (okText) setNotice(typeof okText === "function" ? okText(r) : okText);
      await loadCommon();
      return r;
    } catch (err) {
      setError(errText(err));
      return null;
    }
  };

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.platform") }, { label: t("fx.ops.bill.title") }]} icon={Receipt} title={t("fx.ops.bill.title")} subtitle={t("fx.ops.bill.subtitle")}>
        <button type="button" className="btnEdit" onClick={() => run(refreshStandings, (r) => fill(t("fx.ops.bill.refreshed"), { n: r.length }))}><RefreshCw size={15} /> {t("fx.ops.bill.refresh")}</button>
      </PageTop>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((k) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? styles.tabOn : styles.tab} onClick={() => { setTab(k); setNotice(""); setError(""); }}>{t(`fx.ops.bill.tabs.${k}`)}</button>)}
        </div>
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.notice}>{notice}</div>}
      {tab === "clients" && <Clients t={t} subs={subs} plans={plans} run={run} />}
      {tab === "invoices" && <Invoices t={t} subs={subs} run={run} />}
      {tab === "plans" && <Plans t={t} plans={plans} run={run} />}
      {tab === "settings" && <Settings t={t} run={run} />}
    </div>
  );
}

// ---------------- clients & subscriptions

function Clients({ t, subs, plans, run }) {
  const [editing, setEditing] = useState(null);
  return (
    <section className={styles.section}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead><tr><th>{t("fx.ops.bill.client")}</th><th>{t("fx.ops.bill.plan")}</th><th>{t("fx.ops.bill.status")}</th><th className={styles.right}>{t("fx.ops.bill.price")}</th><th className={styles.right}>{t("fx.ops.bill.due")}</th><th className={styles.right}>{t("fx.ops.bill.overdue")}</th><th /></tr></thead>
          <tbody>
            {subs.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.name}</strong>{c.status === "suspended" && <> <span className={styles.badge} data-tone="suspended">{t(c.suspendedReason === "unpaid" ? "fx.ops.bill.suspendedUnpaid" : "fx.ops.bill.suspended")}</span></>}</td>
                <td>{c.subscription.plan ? `${c.subscription.plan.name} · ${t(`fx.ops.bill.cycles.${c.subscription.cycle}`)}` : "—"}</td>
                <td><span className={styles.badge} data-tone={c.subscription.status === "active" ? "active" : c.subscription.status === "past_due" || c.subscription.status === "suspended" ? "overdue" : undefined}>{t(`fx.ops.bill.subStatus.${c.subscription.status || "none"}`)}</span>{c.subscription.status === "trial" && <small className={styles.muted}> → {day(c.subscription.trialEndsAt)}</small>}</td>
                <td className={styles.right}>{c.subscription.plan ? money(c.cyclePriceHT) : "—"}</td>
                <td className={styles.right}>{c.due ? money(c.due) : "—"}</td>
                <td className={styles.right}>{c.overdue ? <strong style={{ color: "var(--tone-ff8585)" }}>{money(c.overdue)}</strong> : "—"}</td>
                <td><button type="button" className="tableActionBtn" aria-label={t("fx.ops.bill.edit")} title={t("fx.ops.bill.edit")} onClick={() => setEditing(c)}><Pencil size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <SubscriptionForm t={t} client={editing} plans={plans} onClose={() => setEditing(null)} run={run} />}
    </section>
  );
}

function SubscriptionForm({ t, client, plans, onClose, run }) {
  const s = client.subscription;
  const [f, setF] = useState({
    plan: s.plan?._id || "", cycle: s.cycle || "monthly", priceHT: s.priceHT ?? "", discountPct: s.discountPct || 0,
    startedAt: s.startedAt ? String(s.startedAt).slice(0, 10) : "", billingEmail: s.billingEmail || "",
    billing: { legalName: "", address: "", city: "", ice: "", taxId: "", rc: "", ...(s.billing || {}) },
  });
  const [setupDiscount, setSetupDiscount] = useState("0");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setB = (k) => (e) => setF({ ...f, billing: { ...f.billing, [k]: e.target.value } });
  const save = (action) => run(async () => {
    await saveSubscription(client._id, { ...f, plan: f.plan || null, priceHT: f.priceHT === "" ? null : f.priceHT, startedAt: f.startedAt || null, ...(action ? { action } : {}) });
    onClose();
  }, t("fx.ops.common.saved"));
  return (
    <div className={styles.section} style={{ marginTop: 14 }}>
      <h2>{client.name} <button type="button" className="tableActionBtn" aria-label={t("fx.ops.common.cancel")} onClick={onClose} style={{ marginLeft: "auto" }}><X size={14} /></button></h2>
      <div className={styles.grid}>
        <label className={styles.field}>{t("fx.ops.bill.plan")}
          <select value={f.plan} onChange={set("plan")}><option value="">—</option>{plans.filter((p) => p.active || p._id === f.plan).map((p) => <option key={p._id} value={p._id}>{p.name} ({money(p.monthlyPriceHT)} / {t("fx.ops.bill.month")})</option>)}</select>
        </label>
        <label className={styles.field}>{t("fx.ops.bill.cycle")}
          <select value={f.cycle} onChange={set("cycle")}><option value="monthly">{t("fx.ops.bill.cycles.monthly")}</option><option value="yearly">{t("fx.ops.bill.cycles.yearly")}</option></select>
        </label>
        <label className={styles.field}>{t("fx.ops.bill.negotiated")}<input type="number" min="0" step="0.01" value={f.priceHT} onChange={set("priceHT")} placeholder={t("fx.ops.bill.planPrice")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.discount")}<input type="number" min="0" max="100" value={f.discountPct} onChange={set("discountPct")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.startedAt")}<input type="date" value={f.startedAt} onChange={set("startedAt")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.billingEmail")}<input type="email" value={f.billingEmail} onChange={set("billingEmail")} placeholder="compta@client.ma" /></label>
      </div>
      <p className={styles.muted} style={{ margin: "12px 0 6px" }}>{t("fx.ops.bill.buyer")}</p>
      <div className={styles.grid}>
        {["legalName", "ice", "taxId", "rc", "address", "city"].map((k) => <label key={k} className={styles.field}>{t(`fx.ops.bill.party.${k}`)}<input value={f.billing[k]} onChange={setB(k)} /></label>)}
      </div>
      <div className={styles.actions}>
        <button type="button" className="btnPrimary" onClick={() => save()}><Save size={14} /> {t("fx.ops.common.save")}</button>
        {s.status !== "trial" && <button type="button" className="btnEdit" onClick={() => save("start_trial")}>{t("fx.ops.bill.startTrial")}</button>}
        {s.status !== "active" && <button type="button" className="btnEdit" onClick={() => save("activate")}>{t("fx.ops.bill.activate")}</button>}
        {s.status !== "cancelled" && s.status !== "none" && <button type="button" className="btnDelete" onClick={() => save("cancel")}>{t("fx.ops.bill.cancelSub")}</button>}
      </div>
      {s.plan && (
        <div className={styles.actions}>
          <label className={styles.field} style={{ maxWidth: 160 }}>{t("fx.ops.bill.setupDiscount")}<input type="number" min="0" max="100" value={setupDiscount} onChange={(e) => setSetupDiscount(e.target.value)} /></label>
          <button type="button" className="btnEdit" style={{ alignSelf: "flex-end" }} onClick={() => run(() => createSetupInvoice(client._id, Number(setupDiscount) || 0), t("fx.ops.bill.setupCreated"))}>{t("fx.ops.bill.setupInvoice")}</button>
        </div>
      )}
      <p className={styles.muted}>{t("fx.ops.bill.limitsHint")}</p>
    </div>
  );
}

// ---------------- invoices

function Invoices({ t, subs, run }) {
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState(thisPeriod());
  const [list, setList] = useState([]);
  const [paying, setPaying] = useState(null);
  const [manual, setManual] = useState(false);

  const load = useCallback(async () => {
    try { setList(await getPlatformInvoices({ status })); } catch { /* shown by run() */ }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn, ok) => { await run(fn, ok); await load(); };

  const drafts = list.filter((i) => i.status === "draft");
  return (
    <>
      <section className={styles.section}>
        <h2><FilePlus2 size={16} /> {t("fx.ops.bill.monthly")}</h2>
        <p className={styles.muted}>{t("fx.ops.bill.monthlyHint")}</p>
        <div className={styles.actions}>
          <input type="month" aria-label={t("fx.ops.bill.period")} value={period} onChange={(e) => setPeriod(e.target.value)} className={styles.field} style={{ padding: 8 }} />
          <button type="button" className="btnPrimary" onClick={() => act(() => generateInvoices(period), (r) => fill(t("fx.ops.bill.generated"), { n: r.created.length, s: r.skipped.length }))}>{t("fx.ops.bill.generate")}</button>
          {drafts.length > 0 && <button type="button" className="btnEdit" onClick={() => act(async () => { for (const d of drafts) await issuePlatformInvoice(d._id); return drafts.length; }, (n) => fill(t("fx.ops.bill.issuedN"), { n }))}><Send size={14} /> {fill(t("fx.ops.bill.issueAll"), { n: drafts.length })}</button>}
          <button type="button" className="btnEdit" onClick={() => setManual(!manual)}><Plus size={14} /> {t("fx.ops.bill.manual")}</button>
        </div>
        {manual && <ManualInvoice t={t} subs={subs} onDone={() => { setManual(false); load(); }} run={run} />}
      </section>

      <section className={styles.section}>
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {["", "draft", "issued", "overdue", "paid", "cancelled"].map((s) => <button key={s || "all"} type="button" className={status === s ? styles.tabOn : styles.tab} onClick={() => setStatus(s)}>{t(`fx.ops.bill.invStatus.${s || "all"}`)}</button>)}
          </div>
        </div>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead><tr><th>{t("fx.ops.bill.number")}</th><th>{t("fx.ops.bill.client")}</th><th>{t("fx.ops.bill.date")}</th><th>{t("fx.ops.bill.dueDate")}</th><th className={styles.right}>TTC</th><th className={styles.right}>{t("fx.ops.bill.paid")}</th><th>{t("fx.ops.bill.status")}</th><th /></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i._id}>
                  <td>{i.number || <em className={styles.muted}>{t("fx.ops.bill.draft")}</em>}{i.type === "credit_note" && <small className={styles.muted}> ({t("fx.ops.bill.creditNote")})</small>}</td>
                  <td>{i.tenantName}</td>
                  <td>{day(i.issueDate)}</td>
                  <td>{i.type === "invoice" ? day(i.dueDate) : "—"}</td>
                  <td className={styles.right}>{money(i.totalTTC)}</td>
                  <td className={styles.right}>{i.paidAmount ? money(i.paidAmount) : "—"}</td>
                  <td><span className={styles.badge} data-tone={i.overdue ? "overdue" : i.status === "paid" ? "paid" : undefined}>{i.overdue ? t("fx.ops.bill.invState.overdue") : t(`fx.ops.bill.invState.${i.status}`)}</span></td>
                  <td>
                    <div className={styles.actions} style={{ marginTop: 0, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                      {i.status === "draft" && <button type="button" className="tableActionBtn" title={t("fx.ops.bill.issue")} aria-label={t("fx.ops.bill.issue")} onClick={() => act(() => issuePlatformInvoice(i._id), t("fx.ops.bill.issuedOne"))}><Send size={14} /></button>}
                      {i.status === "issued" && i.type === "invoice" && <button type="button" className="tableActionBtn" title={t("fx.ops.bill.pay")} aria-label={t("fx.ops.bill.pay")} onClick={() => setPaying(i)}><Banknote size={14} /></button>}
                      {i.status === "issued" && i.type === "invoice" && !i.paidAmount && <button type="button" className="tableActionBtn" title={t("fx.ops.bill.cancelInvoice")} aria-label={t("fx.ops.bill.cancelInvoice")} onClick={() => { const reason = window.prompt(t("fx.ops.bill.creditReason")); if (reason !== null) act(() => creditPlatformInvoice(i._id, reason), t("fx.ops.bill.credited")); }}><FileMinus2 size={14} /></button>}
                      <button type="button" className="tableActionBtn" title="PDF" aria-label="PDF" onClick={() => downloadPlatformInvoice(i._id, i.number)}><Download size={14} /></button>
                      {i.status === "draft" && <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")} aria-label={t("common.delete")} onClick={() => act(() => deletePlatformInvoice(i._id))}><Trash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className={styles.muted}>{t("fx.ops.bill.noInvoices")}</p>}
        </div>
        {paying && <PaymentForm t={t} invoice={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); load(); }} run={run} />}
      </section>
    </>
  );
}

function ManualInvoice({ t, subs, onDone, run }) {
  const [tenant, setTenant] = useState("");
  const [lines, setLines] = useState([{ label: "", quantity: 1, unitPriceHT: "" }]);
  const setLine = (i, k, v) => setLines(lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPriceHT) || 0), 0), [lines]);
  return (
    <div style={{ marginTop: 12 }}>
      <div className={styles.grid}>
        <label className={styles.field}>{t("fx.ops.bill.client")}<select value={tenant} onChange={(e) => setTenant(e.target.value)}><option value="">—</option>{subs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
      </div>
      {lines.map((l, i) => (
        <div key={i} className={styles.grid} style={{ marginTop: 8 }}>
          <label className={styles.field}>{t("fx.ops.bill.label")}<input value={l.label} onChange={(e) => setLine(i, "label", e.target.value)} placeholder={t("fx.ops.bill.labelPh")} /></label>
          <label className={styles.field}>{t("fx.ops.bill.qty")}<input type="number" min="0" step="0.01" value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} /></label>
          <label className={styles.field}>{t("fx.ops.bill.unitHT")}<input type="number" step="0.01" value={l.unitPriceHT} onChange={(e) => setLine(i, "unitPriceHT", e.target.value)} /></label>
        </div>
      ))}
      <div className={styles.actions}>
        <button type="button" className="btnEdit" onClick={() => setLines([...lines, { label: "", quantity: 1, unitPriceHT: "" }])}><Plus size={14} /> {t("fx.ops.bill.addLine")}</button>
        <span className={styles.muted}>{t("fx.ops.bill.totalHT")} : {money(total)}</span>
        <button type="button" className="btnPrimary" disabled={!tenant} onClick={async () => { const r = await run(() => createPlatformInvoice({ tenant, lines }), t("fx.ops.bill.draftCreated")); if (r) onDone(); }}>{t("fx.ops.bill.createDraft")}</button>
      </div>
    </div>
  );
}

function PaymentForm({ t, invoice, onClose, onDone, run }) {
  const left = Math.round((invoice.totalTTC - invoice.paidAmount) * 100) / 100;
  const [f, setF] = useState({ amount: String(left), date: new Date().toISOString().slice(0, 10), method: "virement", reference: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className={styles.section} style={{ marginTop: 14 }}>
      <h2><Banknote size={16} /> {invoice.number} · {invoice.tenantName} <button type="button" className="tableActionBtn" aria-label={t("fx.ops.common.cancel")} onClick={onClose} style={{ marginLeft: "auto" }}><X size={14} /></button></h2>
      <div className={styles.grid}>
        <label className={styles.field}>{t("fx.ops.bill.amount")}<input type="number" min="0" step="0.01" value={f.amount} onChange={set("amount")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.date")}<input type="date" value={f.date} onChange={set("date")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.method")}<select value={f.method} onChange={set("method")}>{["virement", "cheque", "effet", "especes", "carte", "autre"].map((m) => <option key={m} value={m}>{t(`fx.ops.bill.methods.${m}`)}</option>)}</select></label>
        <label className={styles.field}>{t("fx.ops.bill.reference")}<input value={f.reference} onChange={set("reference")} placeholder="VIR 123456" /></label>
      </div>
      <div className={styles.actions}>
        <button type="button" className="btnPrimary" onClick={async () => { const r = await run(() => payPlatformInvoice(invoice._id, { ...f, amount: Number(f.amount) }), t("fx.ops.bill.paymentSaved")); if (r) onDone(); }}>{t("fx.ops.bill.recordPayment")}</button>
        <span className={styles.muted}>{t("fx.ops.bill.left")} : {money(left)}</span>
      </div>
    </div>
  );
}

// ---------------- plans

const EMPTY_PLAN = { code: "", name: "", description: "", audience: "", monthlyPriceHT: "", yearlyPriceHT: "", setupFeeHT: "", includedUsers: "", includedWarehouses: "", highlight: false, edition: "sanity", storageGB: "", limits: { maxCompanies: "", maxEmployees: "" }, features: "", active: true };

function Plans({ t, plans, run }) {
  const [f, setF] = useState(null);
  const edit = (p) => setF(p ? { ...p, yearlyPriceHT: p.yearlyPriceHT ?? "", setupFeeHT: p.setupFeeHT ?? "", includedUsers: p.includedUsers ?? "", includedWarehouses: p.includedWarehouses ?? "", audience: p.audience || "", storageGB: p.storageQuotaMB != null ? String(Math.round((p.storageQuotaMB / 1024) * 100) / 100) : "", limits: { maxCompanies: p.limits?.maxCompanies ?? "", maxEmployees: p.limits?.maxEmployees ?? "" }, features: (p.features || []).join("\n") } : { ...EMPTY_PLAN });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    const { storageGB, ...rest } = f;
    const body = { ...rest, storageQuotaMB: storageGB === "" ? null : Math.round(Number(String(storageGB).replace(",", ".")) * 1024), yearlyPriceHT: f.yearlyPriceHT === "" ? null : f.yearlyPriceHT, setupFeeHT: f.setupFeeHT === "" ? 0 : f.setupFeeHT, includedUsers: f.includedUsers === "" ? null : f.includedUsers, includedWarehouses: f.includedWarehouses === "" ? null : f.includedWarehouses, limits: { maxCompanies: f.limits.maxCompanies === "" ? null : f.limits.maxCompanies, maxEmployees: f.limits.maxEmployees === "" ? null : f.limits.maxEmployees }, features: String(f.features).split("\n").map((x) => x.trim()).filter(Boolean) };
    const r = await run(() => (f._id ? updatePlan(f._id, body) : createPlan(body)), t("fx.ops.common.saved"));
    if (r) setF(null);
  };
  return (
    <section className={styles.section}>
      <div className={styles.actions} style={{ marginTop: 0, marginBottom: 10 }}>
        <button type="button" className="btnPrimary" onClick={() => run(() => downloadPriceList())}><Printer size={14} /> {t("fx.ops.bill.priceList")}</button>
        <button type="button" className="btnEdit" onClick={() => run(() => downloadPriceList("droguerie"))}><Printer size={14} /> {t("dg.platform.priceList")}</button>
        <button type="button" className="btnEdit" onClick={() => run(loadDefaultCatalog, (r) => fill(t("fx.ops.bill.catalogLoaded"), { n: r.created.length, k: r.kept.length }))}><PackagePlus size={14} /> {t("fx.ops.bill.loadCatalog")}</button>
        <button type="button" className="btnEdit" onClick={() => edit(null)}><Plus size={14} /> {t("fx.ops.bill.newPlan")}</button>
      </div>
      {plans.length === 0 && <p className={styles.muted}>{t("fx.ops.bill.noPlans")}</p>}
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead><tr><th>{t("fx.ops.bill.planName")}</th><th className={styles.right}>{t("fx.ops.bill.monthPrice")}</th><th className={styles.right}>{t("fx.ops.bill.yearPrice")}</th><th className={styles.right}>{t("fx.ops.bill.setupFee")}</th><th>{t("fx.ops.bill.quotas")}</th><th className={styles.right}>{t("fx.ops.bill.clients")}</th><th /></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p._id} style={{ opacity: p.active ? 1 : 0.55 }}>
                <td><strong>{p.name}</strong> <small className={styles.muted}>{p.code}</small></td>
                <td className={styles.right}>{money(p.monthlyPriceHT)}</td>
                <td className={styles.right}>{p.yearlyPriceHT != null ? money(p.yearlyPriceHT) : "—"}</td>
                <td className={styles.right}>{p.setupFeeHT ? money(p.setupFeeHT) : "—"}</td>
                <td>{fill(t("fx.ops.bill.quotaText"), { c: p.limits?.maxCompanies ?? "∞", e: p.limits?.maxEmployees ?? "∞" })}</td>
                <td className={styles.right}>{p.clients}</td>
                <td><button type="button" className="tableActionBtn" aria-label={t("fx.ops.bill.edit")} onClick={() => edit(p)}><Pencil size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f && (
        <div style={{ marginTop: 14 }}>
          <div className={styles.grid}>
            <label className={styles.field}>{t("fx.ops.bill.code")}<input value={f.code} onChange={set("code")} placeholder="PRO" /></label>
            <label className={styles.field}>{t("fx.ops.bill.planName")}<input value={f.name} onChange={set("name")} placeholder="Pro" /></label>
            <label className={styles.field}>{t("fx.ops.bill.monthPrice")}<input type="number" min="0" step="0.01" value={f.monthlyPriceHT} onChange={set("monthlyPriceHT")} /></label>
            <label className={styles.field}>{t("fx.ops.bill.yearPrice")}<input type="number" min="0" step="0.01" value={f.yearlyPriceHT} onChange={set("yearlyPriceHT")} placeholder={t("fx.ops.bill.yearPh")} /></label>
            <label className={styles.field}>{t("fx.ops.bill.setupFee")}<input type="number" min="0" step="0.01" value={f.setupFeeHT} onChange={set("setupFeeHT")} /></label>
            <label className={styles.field}>{t("fx.ops.bill.audience")}<input value={f.audience} onChange={set("audience")} /></label>
            <label className={styles.field}>{t("storage.planQuotaGB")}<input type="number" min="0" step="0.5" value={f.storageGB} onChange={set("storageGB")} placeholder={t("storage.defaultPh")} /></label>
            <label className={styles.field}>{t("dg.platform.edition")}<select value={f.edition || "sanity"} onChange={set("edition")}><option value="sanity">{t("dg.platform.editionSanity")}</option><option value="droguerie">{t("dg.platform.editionDroguerie")}</option></select></label>
            <label className={styles.field}>{t("fx.ops.bill.users")}<input type="number" min="0" value={f.includedUsers} onChange={set("includedUsers")} placeholder="∞" /></label>
            <label className={styles.field}>{t("fx.ops.bill.warehouses")}<input type="number" min="0" value={f.includedWarehouses} onChange={set("includedWarehouses")} placeholder="∞" /></label>
            <label className={styles.field}>{t("quota.maxCompanies")}<input type="number" min="0" value={f.limits.maxCompanies} onChange={(e) => setF({ ...f, limits: { ...f.limits, maxCompanies: e.target.value } })} placeholder="∞" /></label>
            <label className={styles.field}>{t("quota.maxEmployees")}<input type="number" min="0" value={f.limits.maxEmployees} onChange={(e) => setF({ ...f, limits: { ...f.limits, maxEmployees: e.target.value } })} placeholder="∞" /></label>
          </div>
          <label className={styles.field} style={{ marginTop: 10 }}>{t("fx.ops.bill.features")}<textarea rows={4} value={f.features} onChange={set("features")} /></label>
          <label className={styles.muted} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 8 }}><input type="checkbox" checked={!!f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> {t("fx.ops.bill.planActive")}</label>
          <label className={styles.muted} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}><input type="checkbox" checked={!!f.highlight} onChange={(e) => setF({ ...f, highlight: e.target.checked })} /> {t("fx.ops.bill.highlight")}</label>
          <div className={styles.actions}>
            <button type="button" className="btnPrimary" onClick={save}><Save size={14} /> {t("fx.ops.common.save")}</button>
            <button type="button" className="btnCancel" onClick={() => setF(null)}>{t("fx.ops.common.cancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------- settings

const SELLER = ["legalName", "legalForm", "capital", "address", "city", "ice", "taxId", "rc", "patente", "cnss", "email", "phone", "bankName", "rib"];

function Settings({ t, run }) {
  const [f, setF] = useState(null);
  useEffect(() => { getBillingSettings().then(setF).catch(() => {}); }, []);
  if (!f) return null;
  const setS = (k) => (e) => setF({ ...f, seller: { ...f.seller, [k]: e.target.value } });
  const setAddon = (i, patch) => setF({ ...f, addons: f.addons.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <section className={styles.section}>
      <h2>{t("fx.ops.bill.seller")}</h2>
      <p className={styles.muted}>{t("fx.ops.bill.sellerHint")}</p>
      <div className={styles.grid} style={{ marginTop: 10 }}>
        {SELLER.map((k) => <label key={k} className={styles.field}>{t(`fx.ops.bill.party.${k}`)}<input value={f.seller?.[k] || ""} onChange={setS(k)} /></label>)}
      </div>
      <h2 style={{ marginTop: 18 }}>{t("fx.ops.bill.rules")}</h2>
      <div className={styles.grid}>
        <label className={styles.field}>{t("fx.ops.bill.prefix")}<input value={f.invoicePrefix} onChange={set("invoicePrefix")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.vat")}<input type="number" min="0" max="100" value={f.vatRate} onChange={set("vatRate")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.terms")}<input type="number" min="0" value={f.paymentTermsDays} onChange={set("paymentTermsDays")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.trialDays")}<input type="number" min="0" value={f.trialDays} onChange={set("trialDays")} /></label>
        <label className={styles.field}>{t("fx.ops.bill.grace")}<input type="number" min="0" value={f.graceDays} onChange={set("graceDays")} /></label>
      </div>
      <label className={styles.muted} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10 }}><input type="checkbox" checked={!!f.autoSuspend} onChange={(e) => setF({ ...f, autoSuspend: e.target.checked })} /> {t("fx.ops.bill.autoSuspend")}</label>
      <label className={styles.muted} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}><input type="checkbox" checked={!!f.emailInvoices} onChange={(e) => setF({ ...f, emailInvoices: e.target.checked })} /> {t("fx.ops.bill.emailInvoices")}</label>
      <h2 style={{ marginTop: 18 }}>{t("fx.ops.bill.options")}</h2>
      <p className={styles.muted}>{t("fx.ops.bill.optionsHint")}</p>
      {(f.addons || []).map((a, i) => (
        <div key={i} className={styles.grid} style={{ marginTop: 8 }}>
          <label className={styles.field}>{t("fx.ops.bill.label")}<input value={a.name} onChange={(e) => setAddon(i, { name: e.target.value })} /></label>
          <label className={styles.field}>{t("fx.ops.bill.unitHT")}<input type="number" min="0" value={a.priceHT} onChange={(e) => setAddon(i, { priceHT: e.target.value })} /></label>
          <label className={styles.field}>{t("fx.ops.bill.unit")}<select value={a.unit} onChange={(e) => setAddon(i, { unit: e.target.value })}>{["month", "one_time", "quote"].map((u) => <option key={u} value={u}>{t(`fx.ops.bill.units.${u}`)}</option>)}</select></label>
          <label className={styles.field}>{t("fx.ops.bill.note")}<input value={a.note || ""} onChange={(e) => setAddon(i, { note: e.target.value })} /></label>
          <button type="button" className="tableActionBtn tableActionBtnDanger" aria-label={t("common.delete")} style={{ alignSelf: "end" }} onClick={() => setF({ ...f, addons: f.addons.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
        </div>
      ))}
      <div className={styles.actions}><button type="button" className="btnEdit" onClick={() => setF({ ...f, addons: [...(f.addons || []), { name: "", priceHT: 0, unit: "month", note: "" }] })}><Plus size={14} /> {t("fx.ops.bill.addOption")}</button></div>
      <h2 style={{ marginTop: 18 }}>{t("fx.ops.bill.priceListTexts")}</h2>
      <div className={styles.grid}>
        <label className={styles.field}>{t("fx.ops.bill.tagline")}<input value={f.priceList?.tagline || ""} onChange={(e) => setF({ ...f, priceList: { ...f.priceList, tagline: e.target.value } })} /></label>
        <label className={styles.field}>{t("fx.ops.bill.validUntil")}<input type="date" value={f.priceList?.validUntil ? String(f.priceList.validUntil).slice(0, 10) : ""} onChange={(e) => setF({ ...f, priceList: { ...f.priceList, validUntil: e.target.value || null } })} /></label>
      </div>
      <label className={styles.field} style={{ marginTop: 10 }}>{t("fx.ops.bill.terms2")}<textarea rows={6} value={f.priceList?.terms || ""} onChange={(e) => setF({ ...f, priceList: { ...f.priceList, terms: e.target.value } })} /></label>
      <div className={styles.actions}>
        <button type="button" className="btnPrimary" onClick={() => run(() => saveBillingSettings(f), t("fx.ops.common.saved"))}><Save size={14} /> {t("fx.ops.common.save")}</button>
        <button type="button" className="btnEdit" onClick={() => run(async () => { await saveBillingSettings(f); await downloadPriceList(); })}><Printer size={14} /> {t("fx.ops.bill.priceList")}</button>
      </div>
    </section>
  );
}
