import { useCallback, useEffect, useState } from "react";
import { BellRing, MessageCircle, History, Settings2, ExternalLink } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText } from "../negoce/common";
import { getReminders, sendReminders, getMessageLog, getMessagingSettings, saveMessagingSettings } from "../../services/featuresService";
import { Tabs, Kpi, fill, useSelection } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** WhatsApp payment reminders: late customers, one-click reminders, history, automatic reminders. */
export default function Reminders() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [tab, setTab] = useState("late");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const tabs = [
    { value: "late", label: t("fx.wa.tabs.late"), icon: BellRing },
    { value: "log", label: t("fx.wa.tabs.log"), icon: History },
    ...(can("sales.collections.manage") ? [{ value: "settings", label: t("fx.wa.tabs.settings"), icon: Settings2 }] : []),
  ];
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("fx.wa.remTitle") }]} icon={MessageCircle} title={t("fx.wa.remTitle")} subtitle={t("fx.wa.remSubtitle")} />
      <Tabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setNotice(""); setError(""); }} />
      <div className={p.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={p.infoBanner}>{notice}</div>}
      {companyId && tab === "late" && <Late t={t} can={can} companyId={companyId} setError={setError} setNotice={setNotice} />}
      {companyId && tab === "log" && <Log t={t} companyId={companyId} setError={setError} />}
      {companyId && tab === "settings" && <Settings t={t} companyId={companyId} setError={setError} setNotice={setNotice} />}
    </div>
  );
}

function Late({ t, can, companyId, setError, setNotice }) {
  const [minDays, setMinDays] = useState(1);
  const [data, setData] = useState(null);
  const [queue, setQueue] = useState([]); // wa.me links still to open (link mode)
  const [busy, setBusy] = useState(false);
  const sel = useSelection();
  const load = useCallback(() => getReminders(companyId, minDays).then(setData).catch((err) => setError(errorText(err, t, "sales.errors.load"))), [companyId, minDays, t, setError]);
  useEffect(() => { load(); }, [load]);
  if (!data) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const rows = data.rows;
  const total = rows.reduce((a, r) => a + r.overdue, 0);
  const send = async () => {
    setBusy(true); setError("");
    // Opened inside the click so the pop-up blocker lets it through (link mode).
    const win = data.mode !== "cloud" ? window.open("about:blank", "_blank") : null;
    try {
      const out = await sendReminders({ companyId, customers: [...sel.ids], minDays });
      const links = out.results.filter((r) => r.ok && r.url).map((r) => r.url);
      const failed = out.results.filter((r) => !r.ok);
      if (links.length && win) { win.location.href = links[0]; setQueue(links.slice(1)); } else win?.close();
      setNotice(`${out.results.length - failed.length} / ${out.results.length} ✓${failed.length ? ` — ${failed.map((f) => `${f.customer?.name}: ${f.error}`).join(" · ")}` : ""}`);
      sel.clear();
      await load();
    } catch (err) { win?.close(); setError(errorText(err, t)); } finally { setBusy(false); }
  };
  const cols = "28px 2fr 1fr 1fr 0.9fr 1fr 1.2fr";
  return (
    <>
      <div className={p.toolbar}>
        <div className="filterGroup"><label>{t("fx.wa.minDays")}</label>
          <select className={p.input} value={minDays} onChange={(e) => setMinDays(Number(e.target.value))}>
            {[1, 8, 15, 30, 60, 90].map((d) => <option key={d} value={d}>{d} {t("ng.common.days")}</option>)}
          </select>
        </div>
      </div>
      <div className={s.kpis}>
        <Kpi label={fill(t("fx.wa.lateCustomers"), { n: rows.length })} value={formatMoney(total)} tone="bad" />
      </div>
      {can("sales.collections.manage") && (
        <div className={s.statusBar}>
          <button type="button" className="btnPrimary" disabled={busy || !sel.size} onClick={send}><MessageCircle size={15} /> {fill(t("fx.wa.sendSelected"), { n: sel.size })}</button>
          {queue.length > 0 && (
            <button type="button" className="btnEdit" onClick={() => { window.open(queue[0], "_blank"); setQueue(queue.slice(1)); }}><ExternalLink size={15} /> {fill(t("fx.wa.openNext"), { n: queue.length })}</button>
          )}
        </div>
      )}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
          <span><input type="checkbox" aria-label={t("fx.common.all")} checked={sel.size > 0 && sel.size === rows.filter((r) => r.whatsapp).length} onChange={(e) => (e.target.checked ? sel.setAll(rows.filter((r) => r.whatsapp).map((r) => r.customer._id)) : sel.clear())} /></span>
          <span>{t("fx.common.customer")}</span><span className={s.right}>{t("fx.wa.overdue")}</span><span>{t("fx.wa.invoices")}</span><span className={s.right}>{t("fx.wa.oldest")}</span><span>{t("fx.wa.to")}</span><span>{t("fx.wa.lastReminder")}</span>
        </div>
        {rows.map((r) => (
          <div key={r.customer._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
            <span><input type="checkbox" disabled={!r.whatsapp} checked={sel.has(r.customer._id)} onChange={() => sel.toggle(r.customer._id)} aria-label={r.customer.name} /></span>
            <span><strong>{r.customer.name}</strong> <small className={s.muted}>{r.customer.code}</small></span>
            <span className={`${s.right} ${s.bad}`}><strong>{formatMoney(r.overdue)}</strong></span>
            <span className="dataTableCellMuted truncate" title={r.invoices.map((i) => i.number).join(", ")}>{r.invoices.length} · {r.invoices.slice(0, 2).map((i) => i.number).join(", ")}</span>
            <span className={s.right}>{r.daysLate} {t("ng.common.days")}</span>
            <span className={r.whatsapp ? undefined : s.warn}>{r.phone || t("fx.wa.noPhone")}</span>
            <span className="dataTableCellMuted">{r.lastReminderAt ? `${formatDate(r.lastReminderAt)} (${r.reminders})` : t("fx.wa.never")}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Log({ t, companyId, setError }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { getMessageLog({ companyId }).then(setRows).catch((err) => setError(errorText(err, t, "sales.errors.load"))); }, [companyId, t, setError]);
  if (!rows) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const cols = "1fr 0.8fr 1.6fr 1fr 0.9fr 1fr";
  return (
    <div className="dataTable">
      <div className="dataTableHead" style={{ gridTemplateColumns: cols }}><span>{t("fx.common.date")}</span><span>{t("fx.acc.label")}</span><span>{t("fx.common.customer")}</span><span>{t("fx.wa.to")}</span><span>{t("fx.common.status")}</span><span>{t("ng.common.salesRep")}</span></div>
      {rows.map((m) => (
        <div key={m._id} className="dataTableRow" style={{ gridTemplateColumns: cols }} title={m.text}>
          <span>{new Date(m.createdAt).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" })}</span>
          <span>{t(`fx.wa.kinds.${m.kind}`)}{m.automatic ? ` · ${t("fx.wa.auto2")}` : ""}</span>
          <span>{m.customer?.name || "—"}</span>
          <span className="dataTableCellMuted">+{m.to}</span>
          <span className={m.status === "failed" ? s.bad : m.status === "read" || m.status === "delivered" ? s.good : undefined}>{t(`fx.wa.statuses.${m.status}`)}{m.error ? ` — ${m.error}` : ""}</span>
          <span className="dataTableCellMuted">{m.sentBy ? `${m.sentBy.firstName} ${m.sentBy.lastName}` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

function Settings({ t, companyId, setError, setNotice }) {
  const [form, setForm] = useState(null);
  useEffect(() => { getMessagingSettings(companyId).then((d) => setForm({ ...d.whatsapp, days: (d.whatsapp?.reminderDays || []).join(", "), mode: d.mode })).catch((err) => setError(errorText(err, t, "sales.errors.load"))); }, [companyId, t, setError]);
  if (!form) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const save = async () => {
    try {
      const out = await saveMessagingSettings(companyId, { autoReminders: form.autoReminders, reminderDays: form.days.split(/[,;\s]+/).filter(Boolean).map(Number), signature: form.signature });
      setForm({ ...out.whatsapp, days: out.whatsapp.reminderDays.join(", "), mode: out.mode });
      setNotice(t("fx.common.saved"));
    } catch (err) { setError(errorText(err, t)); }
  };
  return (
    <div className={s.card} style={{ maxWidth: 640 }}>
      <h3>{t("fx.wa.auto")}</h3>
      <p className={s.muted}>{t("fx.wa.autoHint")}</p>
      {form.mode !== "cloud" && <p className={s.warn}>{t("fx.wa.needsCloud")}</p>}
      <label className={p.checkboxRow}><input type="checkbox" checked={!!form.autoReminders} onChange={(e) => setForm({ ...form, autoReminders: e.target.checked })} /> {t("fx.wa.auto")}</label>
      <label className={p.field}>{t("fx.wa.days")}<input className={p.input} value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></label>
      <label className={p.field}>{t("fx.wa.signature")}<input className={p.input} value={form.signature || ""} onChange={(e) => setForm({ ...form, signature: e.target.value })} /></label>
      <div className={p.formActions}><button type="button" className="btnPrimary" onClick={save}>{t("common.save")}</button></div>
    </div>
  );
}
