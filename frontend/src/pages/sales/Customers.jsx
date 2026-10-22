import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, X, UserPlus, Lock, Unlock, ClipboardList } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import Breadcrumbs from "../../components/useful/Breadcrumbs";
import CustomSelect from "../../components/useful/CustomSelect";
import SearchBar from "../../components/useful/SearchBar";
import ActionModal from "../../components/useful/ActionModal";
import StatusPill from "../../components/useful/StatusPill";
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../../services/salesService";
import { getSalesSettings, getReps, getWarehouses, blockCustomer } from "../../services/negoceService";
import { useCan } from "../../hooks/useCan";
import { ImportButton } from "../fx/ImportModal";
import { WhatsAppModal } from "../fx/Widgets";
import { downloadStatementPdf } from "../../services/featuresService";
import { MessageCircle, FileText } from "lucide-react";
import { useCompanyPicker, formatMoney, formatDate, SALES_PILL } from "./salesShared";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

const EMPTY = {
  name: "", code: "", kind: "company", type: "reseller", ice: "", identifiantFiscal: "", rc: "", email: "", phone: "", address: "", city: "", paymentDays: 60, notes: "", contacts: [],
  priceLevel: "", discountPercent: 0, salesRep: "", creditLimit: "", documentFlow: "full", defaultWarehouse: "", deliveryAddress: "", zone: "",
};
const TYPES = ["reseller", "installer", "company", "retail"];

/**
 * Customers (clients): identity for invoices (ICE, IF, RC), contacts,
 * payment terms, what they owe — and for the négoce: type (revendeur,
 * installateur…), price level, discount, sales rep, credit limit,
 * document flow (commande → BL → facture, or facture directe), zone.
 */
export default function Customers() {
  const { t } = useI18n();
  const can = useCan();
  const [levels, setLevels] = useState([]);
  const [reps, setReps] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [repFilter, setRepFilter] = useState("");
  const navigate = useNavigate();
  const { companyId, setCompanyId, options: companyOptions } = useCompanyPicker();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null); // { ...fields, _id? }
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [waOpen, setWaOpen] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setCustomers(await getCustomers(companyId, { search, type: typeFilter, salesRep: repFilter }));
    } catch (err) {
      setError(err.response?.data?.message || t("sales.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [companyId, search, typeFilter, repFilter, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!companyId) return;
    getSalesSettings(companyId).then((x) => setLevels(x?.priceLevels || [])).catch(() => setLevels([]));
    getReps(companyId).then(setReps).catch(() => setReps([]));
    getWarehouses(companyId).then(setWarehouses).catch(() => setWarehouses([]));
  }, [companyId]);

  const openEdit = async (c) => {
    setError("");
    setForm({ ...EMPTY, ...c, salesRep: c.salesRep?._id || c.salesRep || "", defaultWarehouse: c.defaultWarehouse?._id || c.defaultWarehouse || "", creditLimit: c.creditLimit ?? "", contacts: c.contacts || [] });
    try { setDetail(await getCustomer(c._id)); } catch { setDetail(null); }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, paymentDays: Number(form.paymentDays) || 0, discountPercent: Number(form.discountPercent) || 0 };
      if (form._id) await updateCustomer(form._id, payload);
      else await createCustomer({ ...payload, company: companyId });
      setForm(null);
      setDetail(null);
      setNotice(t("sales.customers.saved"));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || t("sales.errors.save"));
    }
  };

  const remove = async () => {
    try {
      const res = await deleteCustomer(deleteTarget._id);
      setNotice(res.deactivated ? t("sales.customers.deactivated") : t("sales.customers.deleted"));
      setDeleteTarget(null);
      setForm(null);
      await load();
    } catch (err) {
      setDeleteTarget(null);
      setError(err.response?.data?.message || t("sales.errors.save"));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setContact = (i, k, v) => setForm({ ...form, contacts: form.contacts.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });
  const columns = "90px 1.6fr 0.9fr 0.9fr 0.6fr 1fr 1fr 1fr";

  return (
    <div className="pageShell">
      <Breadcrumbs items={[{ label: t("sidebar.sales"), href: "/sales/quotes" }, { label: t("sales.customers.title") }]} />
      <div className="pageHeader">
        <div>
          <div className="pageTitleRow"><Users size={20} /><h1>{t("sales.customers.title")}</h1></div>
          <p className="pageSubtitle">{t("sales.customers.subtitle")}</p>
        </div>
        {companyId && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {can("sales.customers.import") && <ImportButton t={t} kind="customers" companyId={companyId} onDone={() => load()} />}
            <button type="button" className="btnPrimary" onClick={() => { setForm({ ...EMPTY }); setDetail(null); }}>
              <Plus size={15} /> {t("sales.customers.new")}
            </button>
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className="filterGroup">
          <label>{t("employees.toolbar.company")}</label>
          <CustomSelect value={companyId} onSelect={setCompanyId} options={companyOptions} />
        </div>
        <div className="filterGroup">
          <label>{t("ng.customers.type")}</label>
          <CustomSelect value={typeFilter} onSelect={setTypeFilter} options={[{ value: "", label: t("sales.all") }, ...TYPES.map((x) => ({ value: x, label: t(`ng.customers.types.${x}`) }))]} />
        </div>
        {reps.length > 0 && can("sales.customers.viewAll") && (
          <div className="filterGroup">
            <label>{t("ng.common.salesRep")}</label>
            <CustomSelect value={repFilter} onSelect={setRepFilter} options={[{ value: "", label: t("sales.all") }, { value: "none", label: t("ng.customers.noRep") }, ...reps.map((r) => ({ value: r._id, label: `${r.firstName} ${r.lastName}` }))]} />
          </div>
        )}
        <SearchBar onSearch={setSearch} onClear={() => setSearch("")} placeholder={t("sales.customers.search")} />
      </div>

      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.infoBanner}>{notice}</div>}

      {form && (
        <form className={styles.panel} onSubmit={save}>
          <div className={styles.sectionHeader}>
            <h3>{form._id ? form.name : t("sales.customers.new")}</h3>
            <button type="button" className="tableActionBtn" onClick={() => { setForm(null); setDetail(null); }}><X size={14} /></button>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("sales.customers.name")}<input className={styles.input} required value={form.name} onChange={set("name")} /></label>
            <label className={styles.field}>{t("ng.customers.code")}<input className={styles.input} value={form.code || ""} onChange={set("code")} placeholder={t("ng.customers.codeAuto")} /></label>
            <label className={styles.field}>{t("ng.customers.type")}
              <CustomSelect value={form.type} onSelect={(v) => setForm({ ...form, type: v, kind: v === "installer" || v === "retail" ? "individual" : form.kind })}
                options={TYPES.map((x) => ({ value: x, label: t(`ng.customers.types.${x}`) }))} />
            </label>
            <label className={styles.field}>{t("ng.pricing.level")}
              <CustomSelect value={form.priceLevel || ""} onSelect={(v) => setForm({ ...form, priceLevel: v })}
                options={[{ value: "", label: t("ng.pricing.defaultLevel") }, ...levels.map((l) => ({ value: l.code, label: `${l.code} — ${l.label}` }))]} />
            </label>
            <label className={styles.field}>{t("ng.customers.discount")}<input className={styles.input} type="number" min="0" max="100" step="0.5" value={form.discountPercent} onChange={set("discountPercent")} /></label>
            {can("sales.customers.viewAll") && (
              <label className={styles.field}>{t("ng.common.salesRep")}
                <CustomSelect value={form.salesRep || ""} onSelect={(v) => setForm({ ...form, salesRep: v })}
                  options={[{ value: "", label: t("ng.customers.noRep") }, ...reps.map((r) => ({ value: r._id, label: `${r.firstName} ${r.lastName}` }))]} />
              </label>
            )}
            {can("sales.customers.credit") && (
              <label className={styles.field}>{t("ng.customers.creditLimit")}<input className={styles.input} type="number" min="0" value={form.creditLimit} onChange={set("creditLimit")} placeholder={t("ng.customers.noLimit")} /></label>
            )}
            <label className={styles.field}>{t("ng.customers.flow")}
              <CustomSelect value={form.documentFlow} onSelect={(v) => setForm({ ...form, documentFlow: v })}
                options={[{ value: "full", label: t("ng.customers.flows.full") }, { value: "direct", label: t("ng.customers.flows.direct") }]} />
            </label>
            {warehouses.length > 1 && (
              <label className={styles.field}>{t("ng.common.warehouse")}
                <CustomSelect value={form.defaultWarehouse || ""} onSelect={(v) => setForm({ ...form, defaultWarehouse: v })}
                  options={[{ value: "", label: t("ng.common.defaultWarehouse") }, ...warehouses.map((w) => ({ value: w._id, label: `${w.code} — ${w.name}` }))]} />
              </label>
            )}
            <label className={styles.field}>{t("ng.customers.zone")}<input className={styles.input} value={form.zone || ""} onChange={set("zone")} /></label>
            <label className={styles.field}>{t("ng.customers.deliveryAddress")}<input className={styles.input} value={form.deliveryAddress || ""} onChange={set("deliveryAddress")} /></label>
            <label className={styles.field}>{t("sales.customers.kind")}
              <CustomSelect value={form.kind} onSelect={(v) => setForm({ ...form, kind: v })}
                options={[{ value: "company", label: t("sales.customers.kinds.company") }, { value: "individual", label: t("sales.customers.kinds.individual") }]} />
            </label>
            <label className={styles.field}>ICE<input className={styles.input} value={form.ice || ""} onChange={set("ice")} placeholder={form.kind === "company" ? t("sales.customers.iceHint") : ""} /></label>
            <label className={styles.field}>IF<input className={styles.input} value={form.identifiantFiscal || ""} onChange={set("identifiantFiscal")} /></label>
            <label className={styles.field}>RC<input className={styles.input} value={form.rc || ""} onChange={set("rc")} /></label>
            <label className={styles.field}>{t("sales.customers.paymentDays")}<input className={styles.input} type="number" min="0" max="365" value={form.paymentDays} onChange={set("paymentDays")} /></label>
            <label className={styles.field}>{t("sales.customers.email")}<input className={styles.input} type="email" value={form.email || ""} onChange={set("email")} /></label>
            <label className={styles.field}>{t("sales.customers.phone")}<input className={styles.input} value={form.phone || ""} onChange={set("phone")} /></label>
            <label className={styles.field}>{t("fx.wa.to")}<input className={styles.input} value={form.whatsapp || ""} placeholder={form.phone || t("fx.wa.toHint")} onChange={set("whatsapp")} /></label>
            <label className={styles.field}>{t("sales.customers.address")}<input className={styles.input} value={form.address || ""} onChange={set("address")} /></label>
            <label className={styles.field}>{t("sales.customers.city")}<input className={styles.input} value={form.city || ""} onChange={set("city")} /></label>
          </div>

          <h4 className={styles.subTitle}>{t("sales.customers.contacts")}</h4>
          {form.contacts.map((c, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className={styles.formGrid}>
              <input className={styles.input} placeholder={t("sales.customers.contactName")} value={c.name || ""} onChange={(e) => setContact(i, "name", e.target.value)} />
              <input className={styles.input} placeholder={t("sales.customers.contactRole")} value={c.role || ""} onChange={(e) => setContact(i, "role", e.target.value)} />
              <input className={styles.input} placeholder={t("sales.customers.phone")} value={c.phone || ""} onChange={(e) => setContact(i, "phone", e.target.value)} />
              <div style={{ display: "flex", gap: 6 }}>
                <input className={styles.input} placeholder={t("sales.customers.email")} value={c.email || ""} onChange={(e) => setContact(i, "email", e.target.value)} />
                <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setForm({ ...form, contacts: form.contacts.filter((_, j) => j !== i) })}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          <button type="button" className="btnEdit" onClick={() => setForm({ ...form, contacts: [...form.contacts, {}] })}>
            <UserPlus size={14} /> {t("sales.customers.addContact")}
          </button>
          <label className={styles.field} style={{ marginTop: 12 }}>{t("sales.customers.notes")}<textarea className={styles.input} rows={2} value={form.notes || ""} onChange={set("notes")} /></label>

          {detail && (
            <div className={s.statusBar} style={{ marginTop: 12 }}>
              <button type="button" className="btnEdit" onClick={() => downloadStatementPdf(detail, `${new Date().getFullYear()}-01-01`, new Date().toISOString().slice(0, 10)).catch((err) => setError(err.message))}><FileText size={15} /> {t("fx.wa.statementPdf")}</button>
              {can("sales.invoices.send") && <button type="button" className="btnEdit" onClick={() => setWaOpen(true)}><MessageCircle size={15} /> {t("fx.wa.sendStatement")}</button>}
            </div>
          )}
          {detail && waOpen && <WhatsAppModal t={t} kind="statement" customer={{ ...detail, whatsapp: form.whatsapp, phone: form.phone }} from={`${new Date().getFullYear()}-01-01`} to={new Date().toISOString().slice(0, 10)} onClose={() => setWaOpen(false)} onDone={setNotice} />}
          {detail && (
            <div className={s.docMeta}>
              <div><span>{t("ng.customers.exposure")}</span><strong>{formatMoney(detail.stats?.exposure?.total)}</strong>
                {detail.stats?.creditLeft !== null && detail.stats?.creditLeft !== undefined && <small className={detail.stats.creditLeft < 0 ? s.bad : s.muted}>{t("ng.customers.creditLeft")} {formatMoney(detail.stats.creditLeft)}</small>}
              </div>
              {detail.blocked && <div><span>{t("ng.customers.blocked")}</span><strong className={s.bad}>{detail.blockedReason || "—"}</strong></div>}
              <div><span>{t("ng.orders.title")}</span>
                {(detail.orders || []).slice(0, 5).map((o) => (
                  <button key={o._id} type="button" className={styles.linkButton} onClick={() => navigate(`/sales/orders/${o._id}`)}>
                    {o.number} · {formatMoney(o.totalTTC)} · {t(`ng.orders.status.${o.status}`)}
                  </button>
                ))}
              </div>
              <div><span>{t("sales.customers.invoiced")}</span>{formatMoney(detail.stats?.invoiced)}</div>
              <div><span>{t("sales.customers.due")}</span><strong className={detail.stats?.due > 0 ? s.bad : ""}>{formatMoney(detail.stats?.due)}</strong></div>
              <div><span>{t("sales.quotes.title")}</span>
                {(detail.quotes || []).slice(0, 5).map((q) => (
                  <button key={q._id} type="button" className={styles.linkButton} onClick={() => navigate(`/sales/quotes/${q._id}`)}>
                    {q.number} · {formatMoney(q.totalTTC)} · {t(`sales.quoteStatus.${q.status}`)}
                  </button>
                ))}
              </div>
              <div><span>{t("sales.invoices.title")}</span>
                {(detail.invoices || []).slice(0, 5).map((i) => (
                  <button key={i._id} type="button" className={styles.linkButton} onClick={() => navigate(`/sales/invoices/${i._id}`)}>
                    {i.number || t("sales.invoiceStatus.draft")} · {formatMoney(i.totalTTC)} · {formatDate(i.date)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            {form._id && <button type="button" className="btnDelete" onClick={() => setDeleteTarget(form)}><Trash2 size={14} /> {t("common.delete")}</button>}
            {form._id && can("sales.orders.create") && <button type="button" className="btnEdit" onClick={() => navigate("/sales/orders/new", { state: { companyId, customerId: form._id } })}><ClipboardList size={14} /> {t("ng.orders.new")}</button>}
            {form._id && can("sales.customers.credit") && (
              <button type="button" className="btnEdit" onClick={async () => {
                const reason = form.blocked ? "" : window.prompt(t("ng.customers.blockReason")) || "";
                try { const c = await blockCustomer(form._id, !form.blocked, reason); setForm({ ...form, blocked: c.blocked, blockedReason: c.blockedReason }); await load(); } catch (err) { setError(err.response?.data?.message || t("sales.errors.save")); }
              }}>{form.blocked ? <><Unlock size={14} /> {t("ng.customers.unblock")}</> : <><Lock size={14} /> {t("ng.customers.block")}</>}</button>
            )}
            <button type="button" className="btnCancel" onClick={() => { setForm(null); setDetail(null); }}>{t("common.cancel")}</button>
            <button type="submit" className="btnPrimary">{t("common.save")}</button>
          </div>
        </form>
      )}

      {!loading && customers.length === 0 && (
        <div className="emptyStateBlock">
          <div className="emptyStateIcon"><Users size={28} /></div>
          <h2>{t("sales.customers.emptyTitle")}</h2>
          <p>{t("sales.customers.emptyMessage")}</p>
        </div>
      )}

      {customers.length > 0 && (
        <div className="dataTable">
          <div className="dataTableHead" style={{ gridTemplateColumns: columns }}>
            <span>{t("ng.customers.code")}</span><span>{t("sales.customers.name")}</span><span>{t("sales.customers.city")}</span><span>{t("ng.common.salesRep")}</span>
            <span>{t("ng.pricing.levelShort")}</span><span>{t("ng.customers.creditLimit")}</span><span>{t("sales.customers.due")}</span><span>{t("sales.customers.overdue")}</span>
          </div>
          {customers.map((c) => (
            <div key={c._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: columns }}
              role="button" tabIndex={0} onClick={() => openEdit(c)} onKeyDown={(e) => e.key === "Enter" && openEdit(c)}>
              <span className="dataTableCellMuted">{c.code || "—"}</span>
              <span>
                <strong>{c.name}</strong>
                {!c.isActive && <StatusPill status={SALES_PILL.cancelled} label={t("sales.customers.inactive")} />}
                {c.blocked && <StatusPill status="rejected" label={t("ng.customers.blocked")} />}
                <small className={s.muted}> · {t(`ng.customers.types.${c.type || "reseller"}`)}</small>
              </span>
              <span className="dataTableCellMuted">{c.city || "—"}{c.zone ? ` · ${c.zone}` : ""}</span>
              <span className="dataTableCellMuted">{c.salesRep ? `${c.salesRep.firstName} ${c.salesRep.lastName?.[0] || ""}.` : "—"}</span>
              <span className="dataTableCellMuted">{c.priceLevel || "—"}</span>
              <span className="dataTableCellMuted">{c.creditLimit ? formatMoney(c.creditLimit) : "—"}</span>
              <span>{c.due ? formatMoney(c.due) : "—"}</span>
              <span className={c.overdue ? s.bad : "dataTableCellMuted"}>{c.overdue ? formatMoney(c.overdue) : "—"}</span>
            </div>
          ))}
        </div>
      )}

      <ActionModal isOpen={!!deleteTarget} type="confirm" title={t("sales.customers.deleteTitle")}
        message={deleteTarget ? t("sales.customers.deleteMessage").replace("{name}", deleteTarget.name) : ""}
        onConfirm={remove} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
