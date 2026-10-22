import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileSignature, Pencil, Send, Check, X, Copy, Download, Trash2, ClipboardList, Receipt, Percent, Ban } from "lucide-react";

import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import Breadcrumbs from "../../components/useful/Breadcrumbs";
import StatusPill from "../../components/useful/StatusPill";
import ActionModal from "../../components/useful/ActionModal";
import {
  getQuote, setQuoteStatus, duplicateQuote, deleteQuote, emailQuote, downloadQuotePdf, quoteDeposit, quoteFinalInvoice,
} from "../../services/salesService";
import { quoteToOrder } from "../../services/negoceService";
import { formatMoney, formatDate, SALES_PILL, lineHT, salesTotals } from "./salesShared";
import styles from "../purchasing/Purchasing.module.css";
import s from "./Sales.module.css";

/** One devis: its lines and totals, and what comes next (send, accept, commande, facture). */
export default function QuoteDetail() {
  const can = useCan();
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null); // "email" | "refuse" | "deposit" | "delete" | "cancel"
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setQuote(await getQuote(id));
    } catch (err) {
      setError(err.response?.data?.message || t("sales.errors.load"));
    }
  }, [id, t]);
  useEffect(() => { load(); }, [load]);

  const run = async (fn, successKey) => {
    setBusy(true);
    setError("");
    try {
      const result = await fn();
      if (successKey) setNotice(t(successKey));
      return result;
    } catch (err) {
      setError(err.response?.data?.message || t("sales.errors.save"));
      return null;
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status, reason) => {
    const updated = await run(() => setQuoteStatus(id, status, reason));
    if (updated) setQuote({ ...quote, ...updated });
    setModal(null);
  };

  const openModal = async (name) => {
    setError("");
    if (name === "email") setForm({ to: quote.customer?.email || quote.customer?.contacts?.[0]?.email || "", cc: "", message: "" });
    if (name === "deposit") setForm({ percent: 30 });
    if (name === "refuse") setForm({ reason: "" });
    setModal(name);
  };

  if (!quote) {
    return <div className="pageShell">{error ? <div className="errorMessage">{error}</div> : <p className={s.muted}>{t("common.loading")}</p>}</div>;
  }

  const editable = ["draft", "sent"].includes(quote.status);
  const invoices = quote.invoices || [];
  const hasFinal = invoices.some((i) => i.type === "invoice");
  const totals = salesTotals(quote.lines);

  return (
    <div className="pageShell">
      <Breadcrumbs items={[{ label: t("sidebar.sales"), href: "/sales/quotes" }, { label: t("sales.quotes.title"), href: "/sales/quotes" }, { label: quote.number }]} />
      <div className="pageHeader">
        <div>
          <div className="pageTitleRow">
            <FileSignature size={20} />
            <h1>{t("sales.quotes.one")} {quote.number}</h1>
            <StatusPill status={SALES_PILL[quote.status]} label={quote.salesOrder ? t("ng.orders.convertedPill") : t(`sales.quoteStatus.${quote.status}`)} />
          </div>
          <p className="pageSubtitle">{quote.customer?.name}{quote.subject ? ` — ${quote.subject}` : ""}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btnEdit" onClick={() => run(() => downloadQuotePdf(quote))}><Download size={15} /> PDF</button>
          {can("sales.quotes.create") && <button type="button" className="btnEdit" onClick={async () => { const c = await run(() => duplicateQuote(id)); if (c) navigate(`/sales/quotes/${c._id}`); }}>
            <Copy size={15} /> {t("sales.quotes.duplicate")}
          </button>}
          {editable && can("sales.quotes.edit") && <button type="button" className="btnEdit" onClick={() => navigate(`/sales/quotes/${id}/edit`)}><Pencil size={15} /> {t("common.edit")}</button>}
        </div>
      </div>

      {error && <div className="errorMessage">{error}</div>}
      {notice && <div className={styles.infoBanner}>{notice}</div>}

      <div className={s.statusBar}>
        {["draft", "sent", "expired"].includes(quote.status) && can("sales.quotes.send") && (
          <button type="button" className="btnPrimary" onClick={() => openModal("email")}><Send size={15} /> {t("sales.quotes.sendEmail")}</button>
        )}
        {quote.status === "draft" && can("sales.quotes.send") && <button type="button" className="btnEdit" onClick={() => changeStatus("sent")}>{t("sales.quotes.markSent")}</button>}
        {["draft", "sent", "expired"].includes(quote.status) && can("sales.quotes.decide") && (
          <>
            <button type="button" className="btnEdit" onClick={() => changeStatus("accepted")}><Check size={15} /> {t("sales.quotes.accept")}</button>
            <button type="button" className="btnCancel" onClick={() => openModal("refuse")}><X size={15} /> {t("sales.quotes.refuse")}</button>
          </>
        )}
        {["draft", "sent", "accepted"].includes(quote.status) && !quote.salesOrder && !hasFinal && can("sales.quotes.convert") && (
          <button type="button" className="btnPrimary" disabled={busy}
            onClick={async () => { const o = await run(() => quoteToOrder(id)); if (o) navigate(`/sales/orders/${o._id}`); }}>
            <ClipboardList size={15} /> {t("ng.orders.fromQuote")}
          </button>
        )}
        {quote.status === "accepted" && !quote.salesOrder && !hasFinal && can("sales.quotes.convert") && (
          <>
            <button type="button" className="btnEdit" onClick={() => openModal("deposit")}><Percent size={15} /> {t("sales.quotes.deposit")}</button>
            <button type="button" className="btnEdit" disabled={busy}
              onClick={async () => { const inv = await run(() => quoteFinalInvoice(id)); if (inv) navigate(`/sales/invoices/${inv._id}`); }}>
              <Receipt size={15} /> {t("sales.quotes.finalInvoice")}
            </button>
          </>
        )}
        {["draft", "sent", "expired", "refused"].includes(quote.status) && quote.status !== "draft" && can("sales.quotes.edit") && (
          <button type="button" className="btnCancel" onClick={() => setModal("cancel")}><Ban size={15} /> {t("sales.quotes.cancel")}</button>
        )}
        {quote.status === "draft" && can("sales.quotes.delete") && <button type="button" className="btnDelete" onClick={() => setModal("delete")}><Trash2 size={15} /> {t("common.delete")}</button>}
      </div>

      {quote.status === "refused" && quote.refusalReason && <div className={styles.infoBanner}>{t("sales.quotes.refusedBecause")}: {quote.refusalReason}</div>}

      <div className={s.docMeta}>
        <div><span>{t("sales.customer")}</span>{quote.customer?.name}{quote.customer?.ice && <small className={s.muted}>ICE {quote.customer.ice}</small>}</div>
        <div><span>{t("sales.date")}</span>{formatDate(quote.date)}</div>
        <div><span>{t("sales.validUntil")}</span>{formatDate(quote.validUntil)}</div>
        <div><span>{t("sales.quotes.sentOn")}</span>{formatDate(quote.sentAt)}</div>
        {quote.salesRep && <div><span>{t("ng.common.salesRep")}</span>{quote.salesRep.firstName} {quote.salesRep.lastName}</div>}
        {quote.priceLevel && <div><span>{t("ng.pricing.level")}</span>{quote.priceLevel}</div>}
        {quote.salesOrder && (
          <div><span>{t("ng.orders.one")}</span>
            <button type="button" className={styles.linkButton} onClick={() => navigate(`/sales/orders/${quote.salesOrder._id}`)}>{quote.salesOrder.number}</button>
          </div>
        )}
      </div>

      <table className={s.linesTable}>
        <thead><tr><th>{t("ng.common.reference")}</th><th>{t("sales.lines.description")}</th><th className={s.num}>{t("sales.lines.quantity")}</th><th>{t("sales.lines.unit")}</th>
          <th className={s.num}>{t("sales.lines.unitPrice")}</th><th className={s.num}>{t("sales.lines.discount")}</th><th className={s.num}>{t("sales.lines.vat")}</th><th className={s.num}>{t("sales.lines.totalHT")}</th></tr></thead>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l._id}>
              <td className={s.muted}>{l.reference}</td><td>{l.description}</td><td className={s.num}>{l.quantity}</td><td>{l.unit}</td><td className={s.num}>{formatMoney(l.unitPrice, "")}</td>
              <td className={s.num}>{l.discount ? `${l.discount}%` : ""}</td><td className={s.num}>{l.vatRate}%</td><td className={s.num}>{formatMoney(lineHT(l), "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={s.totalsBox}>
        <div><span>{t("sales.totals.ht")}</span><strong>{formatMoney(quote.totalHT)}</strong></div>
        {totals.breakdown.filter((b) => b.rate > 0).map((b) => <div key={b.rate}><span>{t("sales.totals.vat")} {b.rate}%</span><span>{formatMoney(b.vat)}</span></div>)}
        <div className={s.grand}><span>{t("sales.totals.ttc")}</span><span>{formatMoney(quote.totalTTC)}</span></div>
      </div>
      {quote.paymentTerms && <p className={s.muted}>{t("sales.paymentTerms")}: {quote.paymentTerms}</p>}
      {quote.notes && <p className={s.muted}>{quote.notes}</p>}

      {invoices.length > 0 && (
        <section className={styles.section}>
          <h2>{t("sales.invoices.title")}</h2>
          <div className="dataTable">
            {invoices.map((i) => (
              <div key={i._id} className={`dataTableRow ${styles.clickableRow}`} style={{ gridTemplateColumns: "140px 1fr 1fr 1fr 120px" }}
                role="button" tabIndex={0} onClick={() => navigate(`/sales/invoices/${i._id}`)} onKeyDown={(e) => e.key === "Enter" && navigate(`/sales/invoices/${i._id}`)}>
                <span><strong>{i.number || t("sales.invoiceStatus.draft")}</strong></span>
                <span>{t(`sales.invoiceTypes.${i.type}`)}</span>
                <span>{formatMoney(i.totalTTC)}</span>
                <span className="dataTableCellMuted">{t("sales.invoices.paid")} {formatMoney(i.amountPaid)}</span>
                <span><StatusPill status={SALES_PILL[i.status]} label={t(`sales.invoiceStatus.${i.status}`)} /></span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- modals ---------- */}
      {modal === "email" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>{t("sales.quotes.sendEmail")}</h3>
            <label className={styles.field}>{t("sales.emailTo")}<input className={styles.input} type="email" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
            <label className={styles.field}>CC<input className={styles.input} value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })} /></label>
            <label className={styles.field}>{t("sales.emailMessage")}<textarea className={styles.input} rows={4} value={form.message} placeholder={t("sales.emailDefault")} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setModal(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnPrimary" disabled={busy} onClick={async () => {
                const res = await run(() => emailQuote(id, form));
                if (res) { setNotice(res.simulated ? t("sales.emailSimulated") : t("sales.emailSent")); setQuote({ ...quote, ...res.data }); setModal(null); }
              }}><Send size={14} /> {t("sales.send")}</button>
            </div>
          </div>
        </div>
      )}
      {modal === "refuse" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>{t("sales.quotes.refuse")}</h3>
            <label className={styles.field}>{t("sales.quotes.refuseReason")}<textarea className={styles.input} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setModal(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnDelete" onClick={() => changeStatus("refused", form.reason)}>{t("sales.quotes.refuse")}</button>
            </div>
          </div>
        </div>
      )}
      {modal === "deposit" && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3>{t("sales.quotes.deposit")}</h3>
            <label className={styles.field}>{t("sales.quotes.depositPercent")}
              <input className={styles.input} type="number" min="1" max="100" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
            </label>
            <p className={s.muted}>{t("sales.quotes.depositAmount").replace("{amount}", formatMoney((quote.totalTTC * (Number(form.percent) || 0)) / 100))}</p>
            <div className={styles.modalActions}>
              <button type="button" className="btnCancel" onClick={() => setModal(null)}>{t("common.cancel")}</button>
              <button type="button" className="btnPrimary" disabled={busy} onClick={async () => {
                const inv = await run(() => quoteDeposit(id, { percent: Number(form.percent) }));
                if (inv) navigate(`/sales/invoices/${inv._id}`);
              }}>{t("sales.quotes.createDeposit")}</button>
            </div>
          </div>
        </div>
      )}
      <ActionModal isOpen={modal === "delete"} type="confirm" title={t("sales.quotes.deleteTitle")} message={t("sales.quotes.deleteMessage")}
        onClose={() => setModal(null)} onConfirm={async () => { const r = await run(() => deleteQuote(id)); if (r) navigate("/sales/quotes"); }} />
      <ActionModal isOpen={modal === "cancel"} type="confirm" title={t("sales.quotes.cancel")} message={t("sales.quotes.cancelMessage")}
        onClose={() => setModal(null)} onConfirm={() => changeStatus("cancelled")} />
    </div>
  );
}
