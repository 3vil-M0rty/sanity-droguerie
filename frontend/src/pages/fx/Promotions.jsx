import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgePercent, Plus, Pencil, Trash2, Trophy, X, FileMinus } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import StatusPill from "../../components/useful/StatusPill";
import ArticlePicker from "../../components/useful/ArticlePicker";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText, toInputDate } from "../negoce/common";
import { getBrands, getSalesSettings } from "../../services/negoceService";
import { getInventoryCategories } from "../../services/inventoryCategoryService";
import { getCustomers } from "../../services/salesService";
import { getPromotions, savePromotion, deletePromotion, getRebates, saveRebate, deleteRebate, getRebateProgress, settleRebate } from "../../services/featuresService";
import { Tabs, Modal, fill, useSelection } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const TYPES = ["reseller", "installer", "company", "retail", "walk_in"];
const stateOf = (x, now = new Date()) => (!x.active ? "off" : new Date(x.startDate) > now ? "upcoming" : new Date(x.endDate) < now ? "past" : "active");
const STATE_PILL = { active: "accepted", upcoming: "pending", past: "neutral", off: "neutral" };

/** Promotions (dated, automatic in pricing) and year-end rebates by tier. */
export default function Promotions() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [tab, setTab] = useState("promotions");
  const [lookups, setLookups] = useState({ families: [], brands: [], levels: [] });
  useEffect(() => {
    if (!companyId) return;
    Promise.all([getInventoryCategories(companyId).catch(() => []), getBrands(companyId).catch(() => []), getSalesSettings(companyId).catch(() => null)])
      .then(([families, brands, st]) => setLookups({ families, brands, levels: st?.priceLevels || [] }));
  }, [companyId]);
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.sales"), href: "/sales/orders" }, { label: t("fx.promo.title") }]} icon={BadgePercent} title={t("fx.promo.title")} subtitle={t("fx.promo.subtitle")} />
      <Tabs tabs={[{ value: "promotions", label: t("fx.promo.tabs.promotions"), icon: BadgePercent }, { value: "rebates", label: t("fx.promo.tabs.rebates"), icon: Trophy }]} value={tab} onChange={setTab} />
      <div className={p.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {companyId && tab === "promotions" && <PromotionList t={t} can={can} companyId={companyId} lookups={lookups} />}
      {companyId && tab === "rebates" && <RebateList t={t} can={can} companyId={companyId} />}
    </div>
  );
}

// ---------------------------------------------------------------- promotions
const EMPTY = () => ({ name: "", type: "percent", value: 10, buyQuantity: 10, freeQuantity: 1, minQuantity: 0, stackable: false, active: true, startDate: toInputDate(new Date()), endDate: toInputDate(new Date(Date.now() + 30 * 86400000)), products: [], categories: [], brands: [], customerTypes: [], priceLevels: [], channels: ["sales", "pos"] });

function PromotionList({ t, can, companyId, lookups }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => getPromotions(companyId).then(setRows).catch((err) => setError(errorText(err, t, "sales.errors.load"))), [companyId, t]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    setError("");
    try {
      await savePromotion({ ...form, company: companyId, products: form.products.map((x) => x._id || x), categories: form.categories.map((x) => x._id || x), brands: form.brands.map((x) => x._id || x) });
      setForm(null); await load();
    } catch (err) { setError(errorText(err, t)); }
  };
  const describe = (x) => (x.type === "percent" ? `−${x.value} %` : x.type === "price" ? formatMoney(x.value) : `${x.buyQuantity} + ${x.freeQuantity}`);
  const scope = (x) => [...(x.products || []).map((a) => a.name), ...(x.categories || []).map((c) => c.name), ...(x.brands || []).map((b) => b.name)].join(", ") || t("fx.common.all");
  const cols = "1.6fr 0.8fr 1.8fr 1.2fr 0.9fr 90px";
  return (
    <>
      {error && <div className="errorMessage">{error}</div>}
      {can("sales.promotions.manage") && <div className={s.statusBar}><button type="button" className="btnPrimary" onClick={() => setForm(EMPTY())}><Plus size={15} /> {t("fx.promo.new")}</button></div>}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}><span>{t("fx.promo.name")}</span><span>{t("fx.promo.value")}</span><span>{t("fx.promo.targets")}</span><span>{t("fx.common.period")}</span><span>{t("fx.common.status")}</span><span /></div>
        {(rows || []).map((x) => {
          const st = stateOf(x);
          return (
            <div key={x._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
              <span><strong>{x.name}</strong><small className={s.muted}> · {t(`fx.promo.types.${x.type}`)}</small></span>
              <span><strong>{describe(x)}</strong></span>
              <span className="dataTableCellMuted truncate" title={scope(x)}>{scope(x)}</span>
              <span>{formatDate(x.startDate)} → {formatDate(x.endDate)}</span>
              <span><StatusPill status={STATE_PILL[st]} label={t(`fx.promo.states.${st}`)} /></span>
              <span className="dataTableActions">
                {can("sales.promotions.manage") && <button type="button" className="tableActionBtn" title={t("common.edit")} onClick={() => setForm({ ...x, startDate: toInputDate(x.startDate), endDate: toInputDate(x.endDate) })}><Pencil size={13} /></button>}
                {can("sales.promotions.manage") && <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("common.delete")} onClick={async () => { if (window.confirm(t("fx.promo.deleteMessage"))) { await deletePromotion(x._id); load(); } }}><Trash2 size={13} /></button>}
              </span>
            </div>
          );
        })}
      </div>
      {form && <PromotionForm t={t} companyId={companyId} lookups={lookups} form={form} setForm={setForm} onSave={save} error={error} />}
    </>
  );
}

function Multi({ items, value, onChange, label }) {
  const ids = new Set(value.map((x) => String(x._id || x)));
  return (
    <div className={p.field}>
      <span>{label}</span>
      <div className={s.chips}>
        {items.map((it) => (
          <button key={it.value} type="button" className={s.chipBtn} aria-pressed={ids.has(String(it.value))}
            style={ids.has(String(it.value)) ? { borderColor: "var(--color-primary)", background: "var(--color-bg-tertiary, transparent)", fontWeight: 600 } : undefined}
            onClick={() => onChange(ids.has(String(it.value)) ? value.filter((x) => String(x._id || x) !== String(it.value)) : [...value, it.value])}>{it.label}</button>
        ))}
      </div>
    </div>
  );
}

function PromotionForm({ t, companyId, lookups, form, setForm, onSave, error }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return (
    <Modal wide title={form._id ? t("fx.promo.edit") : t("fx.promo.new")} onClose={() => setForm(null)}
      actions={<><button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button><button type="button" className="btnPrimary" onClick={onSave}>{t("common.save")}</button></>}>
      {error && <div className="errorMessage">{error}</div>}
      <div className={p.formGrid}>
        <label className={p.field}>{t("fx.promo.name")}<input className={p.input} value={form.name} onChange={set("name")} placeholder="Printemps Grohe −15 %" /></label>
        <label className={p.field}>{t("fx.promo.type")}
          <select className={p.input} value={form.type} onChange={set("type")}>{["percent", "price", "free_goods"].map((k) => <option key={k} value={k}>{t(`fx.promo.types.${k}`)}</option>)}</select>
        </label>
        {form.type === "percent" && <label className={p.field}>{t("fx.promo.percent")}<input type="number" min="0" max="100" step="0.5" className={p.input} value={form.value} onChange={set("value")} /></label>}
        {form.type === "price" && <label className={p.field}>{t("fx.promo.price")}<input type="number" min="0" step="0.01" className={p.input} value={form.value} onChange={set("value")} /></label>}
        {form.type === "free_goods" && (
          <div className={p.field}><span>{t("fx.promo.buy")}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" min="1" className={p.input} style={{ width: 80 }} value={form.buyQuantity} onChange={set("buyQuantity")} /> +
              <input type="number" min="1" className={p.input} style={{ width: 80 }} value={form.freeQuantity} onChange={set("freeQuantity")} /> {t("fx.promo.free")}
            </div>
          </div>
        )}
        <label className={p.field}>{t("fx.promo.start")}<input type="date" className={p.input} value={form.startDate} onChange={set("startDate")} /></label>
        <label className={p.field}>{t("fx.promo.end")}<input type="date" className={p.input} value={form.endDate} onChange={set("endDate")} /></label>
        <label className={p.field}>{t("fx.promo.minQty")}<input type="number" min="0" className={p.input} value={form.minQuantity} onChange={set("minQuantity")} /></label>
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "6px 0 10px" }}>
        {form.type === "percent" && <label className={p.checkboxRow}><input type="checkbox" checked={!!form.stackable} onChange={set("stackable")} /> {t("fx.promo.stackable")}</label>}
        <label className={p.checkboxRow}><input type="checkbox" checked={!!form.active} onChange={set("active")} /> {t("fx.promo.active")}</label>
      </div>
      <h4 className={p.subTitle}>{t("fx.promo.targets")} <small className={s.muted}>{t("fx.promo.targetsHint")}</small></h4>
      <div className={p.field}><span>{t("fx.promo.articles")}</span>
        <div className={s.chips} style={{ marginBottom: 6 }}>
          {form.products.map((a) => <span key={a._id || a} className={s.tag}>{a.name || a} <button type="button" className="tableActionBtn" onClick={() => setForm({ ...form, products: form.products.filter((x) => (x._id || x) !== (a._id || a)) })}><X size={11} /></button></span>)}
        </div>
        <ArticlePicker companyId={companyId} value={null} placeholder={t("fx.field.searchArticle")} onPick={(a) => a && !form.products.some((x) => (x._id || x) === a._id) && setForm({ ...form, products: [...form.products, { _id: a._id, name: a.name }] })} />
      </div>
      <Multi label={t("fx.promo.families")} items={lookups.families.map((f) => ({ value: f._id, label: f.name }))} value={form.categories} onChange={(v) => setForm({ ...form, categories: v })} />
      <Multi label={t("fx.promo.brands")} items={lookups.brands.map((b) => ({ value: b._id, label: b.name }))} value={form.brands} onChange={(v) => setForm({ ...form, brands: v })} />
      <h4 className={p.subTitle}>{t("fx.promo.who")} <small className={s.muted}>{t("fx.promo.whoHint")}</small></h4>
      <Multi label={t("fx.promo.customerTypes")} items={TYPES.map((k) => ({ value: k, label: t(`ng.customers.types.${k}`) }))} value={form.customerTypes} onChange={(v) => setForm({ ...form, customerTypes: v })} />
      <Multi label={t("fx.promo.levels")} items={lookups.levels.map((l) => ({ value: l.code, label: `${l.code} ${l.label}` }))} value={form.priceLevels} onChange={(v) => setForm({ ...form, priceLevels: v })} />
      <Multi label={t("fx.promo.channels")} items={["sales", "pos"].map((k) => ({ value: k, label: t(`fx.promo.channelNames.${k}`) }))} value={form.channels} onChange={(v) => setForm({ ...form, channels: v })} />
    </Modal>
  );
}

// ---------------------------------------------------------------- rebates
const EMPTY_REBATE = () => ({ name: `RFA ${new Date().getFullYear()}`, from: `${new Date().getFullYear()}-01-01`, to: `${new Date().getFullYear()}-12-31`, customerTypes: ["reseller"], customers: [], mode: "whole", tiers: [{ threshold: 100000, percent: 1 }, { threshold: 250000, percent: 2 }, { threshold: 500000, percent: 3 }] });

function RebateList({ t, can, companyId }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(null); // progress of one agreement
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [customers, setCustomers] = useState([]);
  const sel = useSelection();
  const load = useCallback(() => getRebates(companyId).then(setRows).catch((err) => setError(errorText(err, t, "sales.errors.load"))), [companyId, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (form) getCustomers(companyId, {}).then(setCustomers).catch(() => setCustomers([])); }, [form, companyId]);
  const show = async (r) => { setError(""); sel.clear(); try { setOpen(await getRebateProgress(r._id)); } catch (err) { setError(errorText(err, t)); } };
  const save = async () => {
    try { await saveRebate({ ...form, company: companyId, customers: form.customers.map((c) => c._id || c) }); setForm(null); load(); } catch (err) { setError(errorText(err, t)); }
  };
  const settle = async () => {
    try {
      const out = await settleRebate(open.agreement._id, [...sel.ids]);
      setNotice(fill(t("fx.promo.settleDone"), { n: out.created.length }));
      await show(open.agreement); load();
    } catch (err) { setError(errorText(err, t)); }
  };
  const cols = "1.6fr 1.2fr 1.6fr 1fr 110px";
  const pcols = "28px 2fr 1fr 0.7fr 1fr 1.6fr";
  return (
    <>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={p.infoBanner}>{notice}</div>}
      {can("sales.promotions.manage") && <div className={s.statusBar}><button type="button" className="btnPrimary" onClick={() => setForm(EMPTY_REBATE())}><Plus size={15} /> {t("fx.promo.rebNew")}</button></div>}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}><span>{t("fx.promo.rebName")}</span><span>{t("fx.common.period")}</span><span>{t("fx.promo.tiers")}</span><span>{t("fx.promo.mode")}</span><span /></div>
        {rows.map((r) => (
          <div key={r._id} className={`dataTableRow ${p.clickableRow}`} style={{ gridTemplateColumns: cols }} onClick={() => show(r)}>
            <span><strong>{r.name}</strong>{r.settlements?.length ? <small className={s.muted}> · {r.settlements.length} ✓</small> : null}</span>
            <span>{formatDate(r.from)} → {formatDate(r.to)}</span>
            <span className="dataTableCellMuted">{r.tiers.map((x) => `${formatMoney(x.threshold, "")} → ${x.percent} %`).join(" · ")}</span>
            <span className="dataTableCellMuted">{t(`fx.promo.modes.${r.mode}`)}</span>
            <span className="dataTableActions" onClick={(e) => e.stopPropagation()}>
              {can("sales.promotions.manage") && <button type="button" className="tableActionBtn" onClick={() => setForm({ ...r, from: toInputDate(r.from), to: toInputDate(r.to) })}><Pencil size={13} /></button>}
              {can("sales.promotions.manage") && !r.settlements?.length && <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={async () => { if (window.confirm(t("fx.promo.deleteRebate"))) { await deleteRebate(r._id); load(); } }}><Trash2 size={13} /></button>}
            </span>
          </div>
        ))}
      </div>

      {open && (
        <section className={s.card} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{t("fx.promo.progress")} — {open.agreement.name}</h3>
            <span className={s.muted}>{t("fx.promo.turnover")} {formatMoney(open.totals.turnover)} · {t("fx.promo.rebate")} <strong>{formatMoney(open.totals.amount)}</strong></span>
            {can("sales.promotions.manage") && <button type="button" className="btnPrimary" disabled={!sel.size} onClick={settle}><FileMinus size={15} /> {fill(t("fx.promo.settle"), { n: sel.size })}</button>}
          </div>
          <div className="dataTable" style={{ marginTop: 10 }}>
            <div className="dataTableHead" style={{ gridTemplateColumns: pcols }}>
              <span><input type="checkbox" aria-label={t("fx.common.all")} onChange={(e) => (e.target.checked ? sel.setAll(open.rows.filter((r) => !r.settled && r.amount > 0).map((r) => r.customer._id)) : sel.clear())} /></span>
              <span>{t("fx.common.customer")}</span><span className={s.right}>{t("fx.promo.turnover")}</span><span>{t("fx.promo.reached")}</span><span className={s.right}>{t("fx.promo.rebate")}</span><span>{t("fx.promo.next")}</span>
            </div>
            {open.rows.map((r) => (
              <div key={r.customer._id} className="dataTableRow" style={{ gridTemplateColumns: pcols }}>
                <span><input type="checkbox" disabled={!!r.settled || !(r.amount > 0)} checked={sel.has(r.customer._id)} onChange={() => sel.toggle(r.customer._id)} aria-label={r.customer.name} /></span>
                <span><strong>{r.customer.name}</strong> <small className={s.muted}>{r.customer.code}</small></span>
                <span className={s.right}>{formatMoney(r.turnover)}</span>
                <span>{r.percent ? `${r.percent} %` : "—"}</span>
                <span className={s.right}><strong>{formatMoney(r.amount)}</strong></span>
                <span>
                  {r.settled
                    ? <button type="button" className={p.linkButton} onClick={() => navigate(`/sales/invoices/${r.settled.creditNote}`)}>{t("fx.promo.settled")} ✓</button>
                    : r.next ? <span className={s.warn}>{fill(t("fx.promo.missing"), { amount: formatMoney(r.next.missing) })} → {r.next.percent} %</span> : <span className={s.good}>{t("fx.promo.top")}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {form && (
        <Modal title={form._id ? form.name : t("fx.promo.rebNew")} onClose={() => setForm(null)}
          actions={<><button type="button" className="btnCancel" onClick={() => setForm(null)}>{t("common.cancel")}</button><button type="button" className="btnPrimary" onClick={save}>{t("common.save")}</button></>}>
          <label className={p.field}>{t("fx.promo.rebName")}<input className={p.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <div className={p.formGrid}>
            <label className={p.field}>{t("fx.common.from")}<input type="date" className={p.input} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></label>
            <label className={p.field}>{t("fx.common.to")}<input type="date" className={p.input} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
          </div>
          <label className={p.field}>{t("fx.promo.mode")}
            <select className={p.input} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>{["whole", "progressive"].map((k) => <option key={k} value={k}>{t(`fx.promo.modes.${k}`)}</option>)}</select>
          </label>
          <h4 className={p.subTitle}>{t("fx.promo.tiers")}</h4>
          {form.tiers.map((tier, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input type="number" min="0" className={p.input} aria-label={t("fx.promo.threshold")} placeholder={t("fx.promo.threshold")} value={tier.threshold} onChange={(e) => setForm({ ...form, tiers: form.tiers.map((x, j) => (j === i ? { ...x, threshold: e.target.value } : x)) })} />
              <input type="number" min="0" max="50" step="0.25" className={p.input} style={{ width: 100 }} aria-label={t("fx.promo.rate")} value={tier.percent} onChange={(e) => setForm({ ...form, tiers: form.tiers.map((x, j) => (j === i ? { ...x, percent: e.target.value } : x)) })} /> %
              <button type="button" className="tableActionBtn tableActionBtnDanger" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, j) => j !== i) })}><Trash2 size={13} /></button>
            </div>
          ))}
          <button type="button" className="btnEdit" onClick={() => setForm({ ...form, tiers: [...form.tiers, { threshold: "", percent: "" }] })}><Plus size={14} /> {t("fx.promo.addTier")}</button>
          <h4 className={p.subTitle}>{t("fx.promo.customersOf")}</h4>
          <Multi label={t("fx.promo.customerTypes")} items={["reseller", "installer", "company", "retail"].map((k) => ({ value: k, label: t(`ng.customers.types.${k}`) }))} value={form.customerTypes || []} onChange={(v) => setForm({ ...form, customerTypes: v })} />
          <label className={p.field}>{t("fx.promo.customersOf")} <small className={s.muted}>({t("fx.promo.allOfTypes")} — {t("fx.common.select").toLowerCase()} :)</small>
            <select multiple className={p.input} style={{ minHeight: 120 }} value={(form.customers || []).map((c) => String(c._id || c))} onChange={(e) => setForm({ ...form, customers: [...e.target.selectedOptions].map((o) => o.value) })}>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
            </select>
          </label>
        </Modal>
      )}
    </>
  );
}
