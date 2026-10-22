import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Receipt, Printer, Undo2 } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import StatusPill from "../../components/useful/StatusPill";
import { getSessions, getSession, refundPosSale } from "../../services/negoceService";
import { useCompanyPicker, PageTop, CompanyFilter, formatMoney, formatDate, errorText, SALES_PILL } from "../negoce/common";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const METHODS = ["especes", "carte", "cheque", "virement", "credit"];
const time = (d) => (d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");

/** Sessions de caisse: who, when, totals, cash difference. */
export default function PosSessions() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { companyId, setCompanyId, options } = useCompanyPicker();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { if (companyId) getSessions({ companyId }).then(setRows).catch((err) => setError(errorText(err, t, "sales.errors.load"))); }, [companyId, t]);
  const cols = "130px 1.2fr 1fr 1fr 0.7fr 1fr 1fr 110px";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.pos"), href: "/pos" }, { label: t("ng.pos.sessions") }]} icon={Receipt} title={t("ng.pos.sessions")} subtitle={t("ng.pos.sessionsSubtitle")} />
      <div className={styles.toolbar}><CompanyFilter companyId={companyId} setCompanyId={setCompanyId} options={options} /></div>
      {error && <div className="errorMessage">{error}</div>}
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: cols }}><span>N°</span><span>{t("ng.pos.opened")}</span><span>{t("ng.pos.cashier")}</span><span>{t("ng.pos.store")}</span><span className={s.right}>{t("ng.pos.tickets")}</span><span className={s.right}>{t("sales.totals.ttc")}</span><span className={s.right}>{t("ng.pos.difference")}</span><span>{t("sales.status")}</span></div>
        {rows.map((r) => (
          <div key={r._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: cols }} role="button" tabIndex={0} onClick={() => navigate(`/pos/sessions/${r._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/pos/sessions/${r._id}`)}>
            <span><strong>{r.number}</strong></span><span>{formatDate(r.openedAt)} {time(r.openedAt)}{r.closedAt ? ` → ${time(r.closedAt)}` : ""}</span>
            <span>{r.cashier?.firstName} {r.cashier?.lastName}</span><span className="dataTableCellMuted">{r.warehouse?.code} · {r.register}</span>
            <span className={s.right}>{r.status === "closed" ? r.ticketCount : "…"}</span><span className={s.right}>{r.status === "closed" ? formatMoney(r.totalTTC) : "…"}</span>
            <span className={`${s.right} ${r.difference < 0 ? s.bad : r.difference > 0 ? s.warn : ""}`}>{r.status === "closed" ? formatMoney(r.difference) : "—"}</span>
            <span><StatusPill status={SALES_PILL[r.status]} label={t(`ng.pos.sessionStatus.${r.status}`)} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One session: Z report per payment method, tickets, refunds. */
export function PosSessionDetail() {
  const { t } = useI18n();
  const can = useCan();
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setSession(await getSession(id)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [id, t]);
  useEffect(() => { load(); }, [load]);
  if (!session) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.pos"), href: "/pos" }, { label: t("ng.pos.sessions"), href: "/pos/sessions" }, { label: session.number }]} icon={Receipt}
        title={`${t("ng.pos.session")} ${session.number}`} subtitle={`${session.cashier?.firstName} ${session.cashier?.lastName} · ${session.warehouse?.name} · ${session.register}`}>
        <button type="button" className="btnEdit" onClick={() => window.print()}><Printer size={15} /> {t("ng.pos.printZ")}</button>
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}
      <div className={s.card} style={{ marginBottom: 14 }}>
        <h3>{t("ng.pos.zReport")} — {session.status === "open" ? t("ng.pos.sessionStatus.open") : `${formatDate(session.closedAt)} ${time(session.closedAt)}`}</h3>
        <table className={s.miniTable}>
          <thead><tr><th>{t("ng.pos.method")}</th><th className={s.num}>{t("ng.pos.expected")}</th>{session.status === "closed" && <th className={s.num}>{t("ng.pos.counted")}</th>}{session.status === "closed" && <th className={s.num}>{t("ng.pos.difference")}</th>}</tr></thead>
          <tbody>
            {METHODS.map((m) => {
              const exp = session.expected?.[m] || 0;
              const cnt = session.counted?.[m] || 0;
              return (
                <tr key={m}><td>{t(`ng.pos.methods.${m}`)}</td><td className={s.num}>{formatMoney(exp)}</td>
                  {session.status === "closed" && <td className={s.num}>{formatMoney(cnt)}</td>}
                  {session.status === "closed" && <td className={`${s.num} ${Math.abs(cnt - exp) > 0.009 ? s.bad : ""}`}>{formatMoney(cnt - exp)}</td>}</tr>
              );
            })}
          </tbody>
        </table>
        <p className={s.muted}>{t("ng.pos.openingFloat")} {formatMoney(session.openingFloat)} · {(session.cashMoves || []).length} {t("ng.pos.cashMoves")} · {session.closingNotes}</p>
      </div>
      <div className="dataTable">
        <div className="dataTableHead" style={{ gridTemplateColumns: "150px 90px 1.4fr 1fr 1.4fr 120px 130px" }}><span>{t("ng.pos.ticket")}</span><span>{t("ng.pos.time")}</span><span>{t("sales.customer")}</span><span className={s.right}>{t("sales.totals.ttc")}</span><span>{t("ng.pos.payments")}</span><span>{t("sales.status")}</span><span /></div>
        {(session.sales || []).map((x) => (
          <div key={x._id} className="dataTableRow" style={{ gridTemplateColumns: "150px 90px 1.4fr 1fr 1.4fr 120px 130px" }}>
            <span><strong>{x.number}</strong></span><span className="dataTableCellMuted">{time(x.date)}</span><span>{x.customer?.name || x.customerName || t("ng.pos.walkIn")}</span>
            <span className={s.right}>{formatMoney(x.totalTTC)}</span>
            <span className="dataTableCellMuted">{x.payments.map((p) => `${t(`ng.pos.methods.${p.method}`)} ${formatMoney(p.amount, "")}`).join(" · ")}{x.change ? ` · ${t("ng.pos.change")} ${formatMoney(x.change, "")}` : ""}</span>
            <span><StatusPill status={SALES_PILL[x.status] || "accepted"} label={t(`ng.pos.saleStatus.${x.status}`)} /></span>
            <span className="dataTableActions" style={{ gap: 4 }}>
              <button type="button" className="tableActionBtn" title={t("ng.pos.reprint")} onClick={() => window.open(`/pos/tickets/${x._id}`, "_blank", "noopener")}><Printer size={13} /></button>
              {x.status === "completed" && session.status === "open" && can("pos.sales.refund") && <button type="button" className="tableActionBtn tableActionBtnDanger" title={t("ng.pos.refund")} onClick={async () => { const reason = window.prompt(t("ng.pos.refundReason")); if (reason !== null) { try { await refundPosSale(x._id, reason); await load(); } catch (err) { setError(errorText(err, t)); } } }}><Undo2 size={13} /></button>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
