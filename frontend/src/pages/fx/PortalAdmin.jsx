import { useCallback, useEffect, useState } from "react";
import { Store, UserPlus, KeyRound, Power, Trash2, Copy, MessageCircle, ExternalLink } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import StatusPill from "../../components/useful/StatusPill";
import { useCompanyPicker, PageTop, CompanyFilter, formatDate, errorText } from "../negoce/common";
import { getCustomers } from "../../services/salesService";
import { getPortalSettings, savePortalSettings, getPortalAccounts, createPortalAccount, updatePortalAccount, deletePortalAccount } from "../../services/featuresService";
import { Modal, fill } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

/** Office side of the reseller portal: open it, choose what it shows, give and manage logins. */
export default function PortalAdmin() {
  const { t } = useI18n();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const companyName = options.find((o) => o.value === companyId)?.label || "";
  const [settings, setSettings] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(null);
  const [secret, setSecret] = useState(null); // { account, password }
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const url = `${window.location.origin}/portail`;

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [st, acc] = await Promise.all([getPortalSettings(companyId), getPortalAccounts(companyId)]);
      setSettings(st); setAccounts(acc);
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (form && !customers.length) getCustomers(companyId, {}).then((c) => setCustomers(c.filter((x) => x.type !== "walk_in"))).catch(() => {}); }, [form, companyId, customers.length]);

  const act = async (fn, ok) => { setError(""); setNotice(""); try { const r = await fn(); if (ok) setNotice(ok); await load(); return r; } catch (err) { setError(errorText(err, t)); return null; } };
  const saveSettings = (patch) => act(async () => setSettings(await savePortalSettings(companyId, { ...settings, ...patch })), t("fx.common.saved"));
  const invite = (acc, password) => fill(t("fx.portalAdmin.invite"), { name: acc.name, company: companyName, url, email: acc.email, password });
  const cols = "1.6fr 1.6fr 1.2fr 0.8fr 1fr 0.8fr 120px";

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("fx.portalAdmin.title") }]} icon={Store} title={t("fx.portalAdmin.title")} subtitle={t("fx.portalAdmin.subtitle")}>
        <a className="btnEdit" href="/portail" target="_blank" rel="noreferrer"><ExternalLink size={15} /> {t("fx.portalAdmin.url")}</a>
      </PageTop>
      <div className={p.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={p.infoBanner}>{notice}</div>}
      {settings && (
        <div className={s.card} style={{ marginBottom: 16 }}>
          <div className={p.formGrid}>
            <label className={p.checkboxRow}><input type="checkbox" checked={!!settings.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked })} /> <strong>{t("fx.portalAdmin.open")}</strong></label>
            <label className={p.field}>{t("fx.portalAdmin.stock")}
              <select className={p.input} value={settings.showStock} onChange={(e) => saveSettings({ showStock: e.target.value })}>{["level", "exact", "none"].map((k) => <option key={k} value={k}>{t(`fx.portalAdmin.stocks.${k}`)}</option>)}</select>
            </label>
            <label className={p.field}>{t("fx.portalAdmin.minOrder")}<input type="number" min="0" className={p.input} defaultValue={settings.minOrderAmount} onBlur={(e) => Number(e.target.value) !== settings.minOrderAmount && saveSettings({ minOrderAmount: Number(e.target.value) || 0 })} /></label>
          </div>
          <label className={p.field}>{t("fx.portalAdmin.message")}<input className={p.input} defaultValue={settings.message} onBlur={(e) => e.target.value !== settings.message && saveSettings({ message: e.target.value })} /></label>
          <p className={s.muted}>{t("fx.portalAdmin.url")} : <a href={url} target="_blank" rel="noreferrer">{url}</a></p>
        </div>
      )}
      <div className={s.statusBar}>
        <h3 style={{ margin: 0, flex: 1 }}>{t("fx.portalAdmin.accounts")}</h3>
        <button type="button" className="btnPrimary" onClick={() => setForm({ customer: "", name: "", email: "", phone: "", role: "buyer" })}><UserPlus size={15} /> {t("fx.portalAdmin.newAccess")}</button>
      </div>
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}><span>{t("fx.common.customer")}</span><span>{t("fx.portalAdmin.name")}</span><span>{t("fx.portalAdmin.email")}</span><span>{t("fx.portalAdmin.role")}</span><span>{t("fx.portalAdmin.lastLogin")}</span><span>{t("fx.common.status")}</span><span /></div>
        {accounts.map((a) => (
          <div key={a._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
            <span><strong>{a.customer?.name}</strong> <small className={s.muted}>{a.customer?.code}</small></span>
            <span>{a.name}</span>
            <span className="dataTableCellMuted truncate">{a.email}</span>
            <span>{t(`fx.portalAdmin.roles.${a.role}`)}</span>
            <span className="dataTableCellMuted">{a.lastLoginAt ? formatDate(a.lastLoginAt) : "—"}</span>
            <span><StatusPill status={a.active ? "accepted" : "neutral"} label={a.active ? t("fx.promo.active") : t("fx.portalAdmin.disable")} /></span>
            <span className="dataTableActions">
              <button type="button" className="tableActionBtn" title={t("fx.portalAdmin.reset")} onClick={async () => { const r = await act(() => updatePortalAccount(a._id, { resetPassword: true })); if (r) setSecret({ account: r.account, password: r.temporaryPassword }); }}><KeyRound size={13} /></button>
              <button type="button" className="tableActionBtn" title={a.active ? t("fx.portalAdmin.disable") : t("fx.portalAdmin.enable")} onClick={() => act(() => updatePortalAccount(a._id, { active: !a.active }))}><Power size={13} /></button>
              <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")} onClick={() => window.confirm(t("fx.portalAdmin.deleteMessage")) && act(() => deletePortalAccount(a._id))}><Trash2 size={13} /></button>
            </span>
          </div>
        ))}
      </div>

      {form && (
        <Modal title={t("fx.portalAdmin.newAccess")} onClose={() => setForm(null)}
          actions={<><button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" disabled={!form.customer || !form.email || !form.name} onClick={async () => { const r = await act(() => createPortalAccount({ ...form, companyId })); if (r) { setForm(null); setSecret({ account: { ...r.account, phone: form.phone }, password: r.temporaryPassword }); } }}>{t("common.save")}</button></>}>
          <label className={p.field}>{t("fx.common.customer")}
            <select className={p.input} value={form.customer} onChange={(e) => { const c = customers.find((x) => x._id === e.target.value); setForm({ ...form, customer: e.target.value, email: form.email || c?.email || "", phone: form.phone || c?.whatsapp || c?.phone || "" }); }}>
              <option value="">{t("fx.common.select")}</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
            </select>
          </label>
          <label className={p.field}>{t("fx.portalAdmin.name")}<input className={p.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className={p.field}>{t("fx.portalAdmin.email")}<input type="email" className={p.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className={p.field}>{t("fx.portalAdmin.phone")}<input className={p.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className={p.field}>{t("fx.portalAdmin.role")}
            <select className={p.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{["buyer", "viewer"].map((k) => <option key={k} value={k}>{t(`fx.portalAdmin.roles.${k}`)}</option>)}</select>
          </label>
        </Modal>
      )}
      {secret && (
        <Modal title={secret.account.email} onClose={() => setSecret(null)} actions={<button type="button" className="btnPrimary" onClick={() => setSecret(null)}>{t("fx.common.close")}</button>}>
          <p>{t("fx.portalAdmin.temp")}</p>
          <p style={{ fontSize: "1.4rem", fontFamily: "monospace", letterSpacing: 1 }}><strong>{secret.password}</strong></p>
          <div className={s.statusBar}>
            <button type="button" className="btnEdit" onClick={() => navigator.clipboard?.writeText(invite(secret.account, secret.password))}><Copy size={15} /> {t("fx.common.copy")}</button>
            <a className="btnEdit" target="_blank" rel="noreferrer" href={`https://wa.me/${String(secret.account.phone || "").replace(/\D/g, "").replace(/^0(?=[5-7])/, "212")}?text=${encodeURIComponent(invite(secret.account, secret.password))}`}><MessageCircle size={15} /> {t("fx.portalAdmin.shareWa")}</a>
          </div>
        </Modal>
      )}
    </div>
  );
}
