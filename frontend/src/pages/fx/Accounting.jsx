import { useCallback, useEffect, useState } from "react";
import { Calculator, Download, FileSpreadsheet, Settings2, Receipt, BookOpen } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText } from "../negoce/common";
import { getVat, downloadVat, getJournal, downloadJournal, getAccountingSettings, saveAccountingSettings } from "../../services/featuresService";
import { Tabs, PeriodPicker, usePeriod, fill, Kpi } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const ACCOUNT_KEYS = ["customers", "suppliers", "sales", "purchases", "vatCollected", "vatDeductible", "bank", "cash", "valuesToCollect", "cardClearing", "rebates"];

/** Comptabilité & TVA: VAT return, journal entries export, accounts & e-invoicing settings. */
export default function Accounting() {
  const { t } = useI18n();
  const can = useCan();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [tab, setTab] = useState("vat");
  const [period, setPeriod] = usePeriod("lastMonth");
  const [error, setError] = useState("");
  const tabs = [
    { value: "vat", label: t("fx.acc.tabs.vat"), icon: Receipt },
    { value: "journal", label: t("fx.acc.tabs.journal"), icon: BookOpen },
    ...(can("finance.accounting.settings") ? [{ value: "settings", label: t("fx.acc.tabs.settings"), icon: Settings2 }] : []),
  ];
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.finance") }, { label: t("fx.acc.title") }]} icon={Calculator} title={t("fx.acc.title")} subtitle={t("fx.acc.subtitle")} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <div className={p.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        {tab !== "settings" && <PeriodPicker t={t} period={period} setPeriod={setPeriod} />}
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {companyId && tab === "vat" && <VatTab t={t} can={can} companyId={companyId} period={period} setError={setError} />}
      {companyId && tab === "journal" && <JournalTab t={t} can={can} companyId={companyId} period={period} setError={setError} />}
      {companyId && tab === "settings" && <SettingsTab t={t} companyId={companyId} setError={setError} />}
    </div>
  );
}

function VatTab({ t, can, companyId, period, setError }) {
  const [vat, setVat] = useState(null);
  const [regime, setRegime] = useState(null);
  useEffect(() => {
    setVat(null);
    getVat({ companyId, ...period }).then((v) => { setVat(v); setRegime((r) => r || v.regime || "encaissement"); }).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [companyId, period, t, setError]);
  if (!vat) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const r = vat.regimes[regime || "encaissement"];
  const table = (rows, title) => (
    <div className={s.card}>
      <h3>{title}</h3>
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "0.6fr 1fr 1fr" }}><span>{t("fx.acc.rate")}</span><span className={s.right}>{t("fx.acc.base")}</span><span className={s.right}>{t("fx.acc.vat")}</span></div>
        {rows.length === 0 && <div className="dataTableRow"><span className="dataTableCellMuted">—</span></div>}
        {rows.map((x) => (
          <div key={x.rate} className="dataTableRow" style={{ gridTemplateColumns: "0.6fr 1fr 1fr" }}>
            <span>{x.rate} %</span><span className={s.right}>{formatMoney(x.baseHT)}</span><span className={s.right}><strong>{formatMoney(x.vat)}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <>
      <div className={p.toolbar}>
        <div className="filterGroup">
          <label>{t("fx.acc.regime")}</label>
          <div className={s.chips}>
            {["encaissement", "debit"].map((k) => (
              <button key={k} type="button" className={s.chipBtn} aria-pressed={regime === k} style={regime === k ? { borderColor: "var(--color-primary)", fontWeight: 600 } : undefined} onClick={() => setRegime(k)}>{t(`fx.acc.regimes.${k}`)}</button>
            ))}
          </div>
        </div>
        {can("finance.accounting.export") && (
          <div className="filterGroup"><label>&nbsp;</label>
            <button type="button" className="btnEdit" onClick={() => downloadVat({ companyId, ...period }).catch((err) => setError(errorText(err, t)))}><FileSpreadsheet size={15} /> {t("fx.acc.excel")}</button>
          </div>
        )}
      </div>
      <div className={s.kpis}>
        <Kpi label={t("fx.acc.collected")} value={formatMoney(r.totalCollected)} hint={vat.counter?.totalVAT ? `${t("fx.acc.counter")} ${formatMoney(vat.counter.totalVAT)}` : undefined} />
        <Kpi label={t("fx.acc.deductible")} value={formatMoney(r.totalDeductible)} />
        <Kpi label={r.net >= 0 ? t("fx.acc.net") : t("fx.acc.credit")} value={formatMoney(Math.abs(r.net))} tone={r.net >= 0 ? "bad" : "good"} />
      </div>
      <div className={s.twoCols}>
        {table(r.collected, t("fx.acc.collected"))}
        {table(r.deductible, t("fx.acc.deductible"))}
      </div>
      <p className={s.muted} style={{ marginTop: 12 }}>{t("fx.acc.vatHint")}</p>
    </>
  );
}

function JournalTab({ t, can, companyId, period, setError }) {
  const [j, setJ] = useState(null);
  useEffect(() => {
    setJ(null);
    getJournal({ companyId, ...period }).then(setJ).catch((err) => setError(errorText(err, t, "sales.errors.load")));
  }, [companyId, period, t, setError]);
  const dl = (format) => downloadJournal({ companyId, ...period }, format).catch((err) => setError(errorText(err, t)));
  if (!j) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const cols = "0.5fr 0.8fr 1fr 0.8fr 0.8fr 2.4fr 0.9fr 0.9fr";
  const balanced = Math.abs(j.totals.debit - j.totals.credit) < 0.01;
  return (
    <>
      <div className={s.kpis}>
        <Kpi label={t("fx.acc.journal")} value={fill(t("fx.acc.entries"), { n: j.totals.count })} hint={balanced ? `✓ ${t("fx.acc.balanced")}` : undefined} tone={balanced ? undefined : "bad"} />
        <Kpi label={t("fx.acc.debit")} value={formatMoney(j.totals.debit)} />
        <Kpi label={t("fx.acc.credit2")} value={formatMoney(j.totals.credit)} />
      </div>
      {can("finance.accounting.export") && (
        <div className={s.statusBar}>
          <button type="button" className="btnPrimary" onClick={() => dl("csv")}><Download size={15} /> {t("fx.acc.csv")}</button>
          <button type="button" className="btnEdit" onClick={() => dl("sage")}><Download size={15} /> {t("fx.acc.sage")}</button>
          <button type="button" className="btnEdit" onClick={() => dl("xlsx")}><FileSpreadsheet size={15} /> {t("fx.acc.xlsx")}</button>
        </div>
      )}
      <p className={s.muted}>{t("fx.acc.journalHint")}</p>
      <h3 style={{ margin: "16px 0 8px", fontSize: "0.92rem" }}>{t("fx.acc.preview")}</h3>
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
          <span>{t("fx.acc.journal")}</span><span>{t("fx.common.date")}</span><span>{t("fx.acc.piece")}</span><span>{t("fx.acc.account")}</span><span>{t("fx.acc.tiers")}</span><span>{t("fx.acc.label")}</span><span className={s.right}>{t("fx.acc.debit")}</span><span className={s.right}>{t("fx.acc.credit2")}</span>
        </div>
        {j.entries.slice(0, 50).flatMap((e, i) => e.lines.map((l, k) => (
          <div key={`${i}-${k}`} className="dataTableRow" style={{ gridTemplateColumns: cols, borderTop: k === 0 ? "2px solid var(--color-border)" : undefined }}>
            <span className="dataTableCellMuted">{k === 0 ? e.journal : ""}</span>
            <span>{k === 0 ? formatDate(e.date) : ""}</span>
            <span>{k === 0 ? e.piece : ""}</span>
            <span><strong>{l.account}</strong></span>
            <span className="dataTableCellMuted">{l.tiers}</span>
            <span className="truncate" title={l.label}>{l.label}</span>
            <span className={s.right}>{l.debit ? formatMoney(l.debit, "") : ""}</span>
            <span className={s.right}>{l.credit ? formatMoney(l.credit, "") : ""}</span>
          </div>
        )))}
      </div>
    </>
  );
}

function SettingsTab({ t, companyId, setError }) {
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState("");
  const load = useCallback(() => getAccountingSettings(companyId).then(setForm).catch((err) => setError(errorText(err, t, "sales.errors.load"))), [companyId, t, setError]);
  useEffect(() => { load(); }, [load]);
  if (!form) return <p className={s.muted}>{t("fx.common.loading")}</p>;
  const acc = form.accounting;
  const setAcc = (k, v) => setForm({ ...form, accounting: { ...acc, [k]: v } });
  const save = async () => {
    setError(""); setNotice("");
    try {
      const out = await saveAccountingSettings(companyId, { accounting: acc, einvoicing: form.einvoicing });
      setForm({ ...form, ...out });
      setNotice(t("fx.common.saved"));
    } catch (err) { setError(errorText(err, t)); }
  };
  return (
    <>
      {notice && <div className={p.infoBanner}>{notice}</div>}
      <div className={s.twoCols}>
        <div className={s.card}>
          <h3>{t("fx.acc.accounts")}</h3>
          <p className={s.muted}>{t("fx.acc.accountsHint")}</p>
          <div className={p.formGrid}>
            {ACCOUNT_KEYS.map((k) => (
              <label key={k} className={p.field}>{t(`fx.acc.keys.${k}`)}
                <input className={p.input} value={acc[k] || ""} placeholder={form.defaults?.[k]} onChange={(e) => setAcc(k, e.target.value)} />
              </label>
            ))}
          </div>
          <h3 style={{ marginTop: 16 }}>{t("fx.acc.byRate")}</h3>
          <div className={p.formGrid}>
            {[20, 14, 10, 7, 0].map((r) => (
              <label key={r} className={p.field}>{r} %
                <input className={p.input} value={acc.salesByRate?.[r] || ""} placeholder={acc.sales} onChange={(e) => setAcc("salesByRate", { ...(acc.salesByRate || {}), [r]: e.target.value })} />
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className={s.card}>
            <h3>{t("fx.acc.journals")}</h3>
            <div className={p.formGrid}>
              {["sales", "purchases", "bank", "cash"].map((k) => (
                <label key={k} className={p.field}>{t(`fx.acc.journalKeys.${k}`)}
                  <input className={p.input} value={acc.journals?.[k] || ""} maxLength={6} onChange={(e) => setAcc("journals", { ...acc.journals, [k]: e.target.value.toUpperCase() })} />
                </label>
              ))}
            </div>
            <label className={p.field} style={{ marginTop: 10 }}>{t("fx.acc.regime")}
              <select className={p.input} value={acc.vatRegime} onChange={(e) => setAcc("vatRegime", e.target.value)}>
                {["encaissement", "debit"].map((k) => <option key={k} value={k}>{t(`fx.acc.regimes.${k}`)}</option>)}
              </select>
            </label>
          </div>
          <div className={s.card} style={{ marginTop: 14 }}>
            <h3>{t("fx.acc.einvoicing")}</h3>
            <p className={s.muted}>{t("fx.acc.einvoicingHint")}</p>
            <label className={p.checkboxRow}><input type="checkbox" checked={!!form.einvoicing?.enabled} onChange={(e) => setForm({ ...form, einvoicing: { ...form.einvoicing, enabled: e.target.checked } })} /> {t("fx.acc.enabled")}</label>
            <label className={p.checkboxRow}><input type="checkbox" checked={!!form.einvoicing?.autoSubmit} onChange={(e) => setForm({ ...form, einvoicing: { ...form.einvoicing, autoSubmit: e.target.checked } })} /> {t("fx.acc.autoSubmit")}</label>
            <label className={p.field}>{t("fx.acc.provider")}
              <select className={p.input} value={form.einvoicing?.provider || "simulation"} onChange={(e) => setForm({ ...form, einvoicing: { ...form.einvoicing, provider: e.target.value } })}>
                {["simulation", "http"].map((k) => <option key={k} value={k}>{t(`fx.acc.providers.${k}`)}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className={p.formActions}><button type="button" className="btnPrimary" onClick={save}>{t("common.save")}</button></div>
    </>
  );
}
