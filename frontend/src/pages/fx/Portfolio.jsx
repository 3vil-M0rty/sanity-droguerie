import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Download, CheckCircle2, XCircle, Search, Layers } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import StatusPill from "../../components/useful/StatusPill";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText, todayInput } from "../negoce/common";
import { getPortfolio, getDepositSlips, createDepositSlip, downloadDepositSlip, clearDepositSlip, clearInstrument, markUnpaid } from "../../services/featuresService";
import { Tabs, Kpi, fill, Modal, useSelection } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const PILL = { in_portfolio: "pending", deposited: "manager_approved", cleared: "accepted", unpaid: "rejected", cancelled: "neutral" };

/** Portefeuille chèques & LCN: due dates, deposit slips, cleared, unpaid. */
export default function Portfolio() {
  const { t } = useI18n();
  const can = useCan();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [tab, setTab] = useState("items");
  const [status, setStatus] = useState("in_portfolio");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [slips, setSlips] = useState([]);
  const [modal, setModal] = useState(null); // { type: "deposit" | "unpaid", ... }
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sel = useSelection();

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      setData(await getPortfolio({ companyId, status, kind, search }));
      if (can("sales.portfolio.view")) setSlips(await getDepositSlips(companyId));
    } catch (err) { setError(errorText(err, t, "sales.errors.load")); }
  }, [companyId, status, kind, search, t, can]);
  useEffect(() => { const h = setTimeout(load, 200); return () => clearTimeout(h); }, [load]);
  useEffect(() => { sel.clear(); }, [status, kind, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = data?.rows || [];
  const chosen = useMemo(() => rows.filter((r) => sel.has(r._id)), [rows, sel]);
  const chosenKinds = new Set(chosen.map((r) => r.kind));
  const act = async (fn, ok) => {
    setError(""); setNotice("");
    try { await fn(); if (ok) setNotice(ok); setModal(null); sel.clear(); await load(); } catch (err) { setError(errorText(err, t)); }
  };
  const sum = data?.summary;
  const cols = "28px 0.8fr 1fr 1.6fr 1fr 0.9fr 1fr 0.9fr 1fr 1.1fr";

  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("sidebar.finance") }, { label: t("fx.pf.title") }]} icon={Landmark} title={t("fx.pf.title")} subtitle={t("fx.pf.subtitle")} />
      {sum && (
        <div className={s.kpis}>
          <Kpi label={t("fx.pf.inPortfolio")} value={formatMoney(sum.inPortfolio.amount)} hint={`${sum.inPortfolio.count}`} />
          <Kpi label={t("fx.pf.toDeposit")} value={formatMoney(sum.toDeposit.amount)} hint={`${sum.toDeposit.count}`} tone={sum.toDeposit.count ? "bad" : undefined} />
          <Kpi label={t("fx.pf.thisWeek")} value={formatMoney(sum.dueThisWeek.amount)} hint={`${sum.dueThisWeek.count}`} />
          <Kpi label={t("fx.pf.deposited")} value={formatMoney(sum.deposited.amount)} hint={`${sum.deposited.count}`} />
          <Kpi label={t("fx.pf.unpaid")} value={formatMoney(sum.unpaid.amount)} hint={`${sum.unpaid.count}`} tone={sum.unpaid.count ? "bad" : undefined} />
        </div>
      )}
      <Tabs tabs={[{ value: "items", label: t("fx.pf.tabs.items") }, { value: "slips", label: t("fx.pf.tabs.slips"), count: slips.length }]} value={tab} onChange={setTab} />
      <div className={p.toolbar}>
        <CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} />
        {tab === "items" && (
          <>
            <div className="filterGroup"><label>{t("fx.common.status")}</label>
              <select className={p.input} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t("fx.common.all")}</option>
                {["in_portfolio", "deposited", "cleared", "unpaid"].map((k) => <option key={k} value={k}>{t(`fx.pf.statuses.${k}`)}</option>)}
              </select>
            </div>
            <div className="filterGroup"><label>{t("fx.pf.kind")}</label>
              <select className={p.input} value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">{t("fx.common.all")}</option>
                {["cheque", "lcn"].map((k) => <option key={k} value={k}>{t(`fx.pf.kinds.${k}`)}</option>)}
              </select>
            </div>
            <div className="filterGroup"><label><Search size={12} /></label><input className={p.input} value={search} placeholder={t("fx.pf.search")} onChange={(e) => setSearch(e.target.value)} /></div>
          </>
        )}
      </div>
      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={p.infoBanner}>{notice}</div>}

      {tab === "items" && (
        <>
          {can("sales.portfolio.deposit") && (
            <div className={s.statusBar}>
              <button type="button" className="btnPrimary" disabled={!chosen.length || chosenKinds.size > 1 || chosen.some((r) => r.status !== "in_portfolio")}
                onClick={() => setModal({ type: "deposit", date: todayInput(), mode: "encaissement", bankAccount: "" })}>
                <Layers size={15} /> {fill(t("fx.pf.deposit"), { n: chosen.length })} {chosen.length > 0 && `· ${formatMoney(chosen.reduce((a, r) => a + r.amount, 0))}`}
              </button>
              {chosenKinds.size > 1 && <span className={s.warn}>{t("fx.pf.sameKind")}</span>}
            </div>
          )}
          <div className="dataTable">
            <div className="dataTableHead" style={{ gridTemplateColumns: cols }}>
              <span />
              <span>{t("fx.pf.kind")}</span><span>{t("fx.pf.number")}</span><span>{t("fx.common.customer")}</span><span>{t("fx.pf.bank")}</span><span>{t("fx.pf.due")}</span>
              <span className={s.right}>{t("fx.common.amount")}</span><span>{t("fx.pf.invoice")}</span><span>{t("fx.common.status")}</span><span>{t("fx.common.actions")}</span>
            </div>
            {rows.map((r) => {
              const late = r.status === "in_portfolio" && new Date(r.dueDate) <= new Date();
              return (
                <div key={r._id} className="dataTableRow" style={{ gridTemplateColumns: cols }}>
                  <span><input type="checkbox" disabled={r.status !== "in_portfolio"} checked={sel.has(r._id)} onChange={() => sel.toggle(r._id)} aria-label={r.number} /></span>
                  <span>{t(`fx.pf.kinds.${r.kind}`)}</span>
                  <span><strong>{r.number || "—"}</strong></span>
                  <span className="truncate">{r.customer?.name}{r.drawer ? <small className={s.muted}> · {r.drawer}</small> : null}</span>
                  <span className="dataTableCellMuted">{r.bank || "—"}</span>
                  <span className={late ? s.warn : undefined}>{formatDate(r.dueDate)}</span>
                  <span className={s.right}><strong>{formatMoney(r.amount)}</strong></span>
                  <span><button type="button" className={p.linkButton} onClick={() => navigate(`/sales/invoices/${r.invoice}`)}>{r.invoiceNumber}</button></span>
                  <span><StatusPill status={PILL[r.status]} label={t(`fx.pf.statuses.${r.status}`)} />{r.depositSlip ? <small className={s.muted}> {r.depositSlip.number}</small> : null}{r.unpaidReason && r.status === "unpaid" ? <small className={s.bad}> {r.unpaidReason}</small> : null}</span>
                  <span className="dataTableActions">
                    {can("sales.portfolio.settle") && r.status === "deposited" && (
                      <button type="button" className="tableActionBtn tableActionBtnAccept" title={t("fx.pf.clear")} onClick={() => act(() => clearInstrument(r._id))}><CheckCircle2 size={14} /></button>
                    )}
                    {can("sales.portfolio.settle") && ["in_portfolio", "deposited"].includes(r.status) && (
                      <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("fx.pf.unpaidAction")} onClick={() => setModal({ type: "unpaid", item: r, reason: t("fx.pf.reasons")[0], fees: "", block: false })}><XCircle size={14} /></button>
                    )}
                  </span>
                </div>
              );
            })}
            {data && rows.length === 0 && <div className="dataTableRow"><span className="dataTableCellMuted">—</span></div>}
          </div>
        </>
      )}

      {tab === "slips" && (
        <div className="dataTable">
          <div className="dataTableHead" style={{ gridTemplateColumns: "1fr 0.9fr 0.8fr 1fr 0.6fr 1fr 1.4fr" }}>
            <span>{t("fx.pf.slip")}</span><span>{t("fx.common.date")}</span><span>{t("fx.pf.kind")}</span><span>{t("fx.pf.mode")}</span><span>{t("fx.pf.count")}</span><span className={s.right}>{t("fx.common.total")}</span><span>{t("fx.common.actions")}</span>
          </div>
          {slips.map((x) => (
            <div key={x._id} className="dataTableRow" style={{ gridTemplateColumns: "1fr 0.9fr 0.8fr 1fr 0.6fr 1fr 1.4fr" }}>
              <span><strong>{x.number}</strong>{x.bankAccount ? <small className={s.muted}> · {x.bankAccount}</small> : null}</span>
              <span>{formatDate(x.date)}</span>
              <span>{t(`fx.pf.kinds.${x.kind}`)}</span>
              <span>{t(`fx.pf.modes.${x.mode}`)}</span>
              <span>{x.count}</span>
              <span className={s.right}><strong>{formatMoney(x.total)}</strong></span>
              <span className="dataTableActions" style={{ gap: 6 }}>
                <button type="button" className="btnEdit" onClick={() => downloadDepositSlip(x).catch((err) => setError(errorText(err, t)))}><Download size={14} /> PDF</button>
                {can("sales.portfolio.settle") && <button type="button" className="btnEdit" onClick={() => act(() => clearDepositSlip(x._id), t("fx.common.saved"))}><CheckCircle2 size={14} /> {t("fx.pf.clearAll")}</button>}
              </span>
            </div>
          ))}
        </div>
      )}

      {modal?.type === "deposit" && (
        <Modal title={t("fx.pf.depositTitle")} onClose={() => setModal(null)}
          actions={<><button type="button" className="btnCancel" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" onClick={() => act(async () => { const slip = await createDepositSlip({ companyId, instruments: chosen.map((r) => r._id), date: modal.date, mode: modal.mode, bankAccount: modal.bankAccount }); await downloadDepositSlip(slip); }, t("fx.common.saved"))}>
              <Layers size={15} /> {t("common.save")} + PDF</button></>}>
          <p className={s.muted}>{chosen.length} · {formatMoney(chosen.reduce((a, r) => a + r.amount, 0))}</p>
          <label className={p.field}>{t("fx.common.date")}<input type="date" className={p.input} value={modal.date} onChange={(e) => setModal({ ...modal, date: e.target.value })} /></label>
          {chosen[0]?.kind === "lcn" && (
            <label className={p.field}>{t("fx.pf.mode")}
              <select className={p.input} value={modal.mode} onChange={(e) => setModal({ ...modal, mode: e.target.value })}>
                {["encaissement", "escompte"].map((k) => <option key={k} value={k}>{t(`fx.pf.modes.${k}`)}</option>)}
              </select>
            </label>
          )}
          <label className={p.field}>{t("fx.pf.bankAccount")}<input className={p.input} value={modal.bankAccount} onChange={(e) => setModal({ ...modal, bankAccount: e.target.value })} /></label>
        </Modal>
      )}
      {modal?.type === "unpaid" && (
        <Modal title={`${t("fx.pf.unpaidTitle")} — ${modal.item.number || ""} · ${formatMoney(modal.item.amount)}`} onClose={() => setModal(null)}
          actions={<><button type="button" className="btnCancel" onClick={() => setModal(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnDelete" onClick={() => act(() => markUnpaid(modal.item._id, { reason: modal.reason, fees: Number(modal.fees) || 0, block: modal.block }), t("fx.common.saved"))}><XCircle size={15} /> {t("fx.pf.unpaidAction")}</button></>}>
          <p className={s.muted}>{t("fx.pf.unpaidHint")}</p>
          <label className={p.field}>{t("fx.pf.reason")}
            <input className={p.input} list="unpaid-reasons" value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} />
            <datalist id="unpaid-reasons">{t("fx.pf.reasons").map((r) => <option key={r} value={r} />)}</datalist>
          </label>
          <label className={p.field}>{t("fx.pf.fees")}<input type="number" min="0" step="0.01" className={p.input} value={modal.fees} onChange={(e) => setModal({ ...modal, fees: e.target.value })} /></label>
          {can("sales.customers.credit") && <label className={p.checkboxRow}><input type="checkbox" checked={modal.block} onChange={(e) => setModal({ ...modal, block: e.target.checked })} /> {t("fx.pf.block")}</label>}
        </Modal>
      )}
    </div>
  );
}
