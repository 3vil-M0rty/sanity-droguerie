import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileText, Download, CheckCircle2, PackageCheck, Ban, Receipt, Trash2, Save } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import SearchSelect from "../../components/useful/SearchSelect";
import CustomSelect from "../../components/useful/CustomSelect";
import StatusPill from "../../components/useful/StatusPill";
import ActionModal from "../../components/useful/ActionModal";
import SalesLinesEditor from "../sales/SalesLinesEditor";
import { getCustomers } from "../../services/salesService";
import {
  getDeliveryNote, createDeliveryNote, validateDeliveryNote, deliverDeliveryNote, cancelDeliveryNote, deleteDeliveryNote, downloadDeliveryNotePdf, invoiceDeliveryNotes,
} from "../../services/negoceService";
import { useCompanyPicker, useWarehouses, warehouseOptions, PageTop, formatMoney, formatDate, fmtQty, errorText, SALES_PILL } from "../negoce/common";
import { emptySalesLine, cleanLines } from "../sales/salesShared";
import styles from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";
import { DeliveryProofPanel } from "../fx/Widgets";

/** A BL / BR: lines, lots, validate (stock out / in), deliver (signed), cancel, invoice, print. */
export default function DeliveryNoteDetail() {
  const { t } = useI18n();
  const can = useCan();
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const isNew = !id;
  const { companyId: picked } = useCompanyPicker();
  const company = state?.companyId || picked;
  const warehouses = useWarehouses(isNew ? company : null);
  const [customers, setCustomers] = useState([]);
  const [draft, setDraft] = useState({ type: state?.type || "delivery", customer: "", warehouse: "", deliveryMode: "delivery", lines: [emptySalesLine()], notes: "" });
  const [note, setNote] = useState(null);
  const [deliver, setDeliver] = useState(null);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { if (!isNew) try { setNote(await getDeliveryNote(id)); } catch (err) { setError(errorText(err, t, "sales.errors.load")); } }, [id, isNew, t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (isNew && company) getCustomers(company, { active: "true" }).then(setCustomers).catch(() => setCustomers([])); }, [isNew, company]);
  const run = async (fn) => { setBusy(true); setError(""); try { const r = await fn(); await load(); return r || true; } catch (err) { setError(errorText(err, t)); return null; } finally { setBusy(false); } };

  if (isNew) {
    return (
      <div className="pageShell">
        <PageTop crumbs={[{ label: t("ng.menu.logistics"), href: "/logistics/delivery-notes" }, { label: draft.type === "return" ? t("ng.delivery.newReturn") : t("ng.delivery.new") }]} icon={FileText} title={draft.type === "return" ? t("ng.delivery.newReturn") : t("ng.delivery.new")} subtitle={draft.type === "return" ? t("ng.delivery.returnHint") : t("ng.delivery.freeHint")} />
        {error && <div className="errorMessage">{error}</div>}
        <div className={styles.formGrid}>
          <label className={styles.field}>{t("sales.customer")}<SearchSelect value={draft.customer} onSelect={(v) => setDraft({ ...draft, customer: v, warehouse: draft.warehouse || customers.find((c) => c._id === v)?.defaultWarehouse || "" })} options={customers.map((c) => ({ value: c._id, label: `${c.code ? `${c.code} — ` : ""}${c.name}` }))} placeholder={t("sales.pickCustomer")} noResultsLabel={t("sales.noCustomer")} /></label>
          <label className={styles.field}>{t("ng.common.warehouse")}<CustomSelect value={draft.warehouse} onSelect={(v) => setDraft({ ...draft, warehouse: v })} options={warehouseOptions(warehouses, t("ng.common.defaultWarehouse"))} /></label>
          {draft.type === "delivery" && <label className={styles.field}>{t("ng.orders.deliveryMode")}<CustomSelect value={draft.deliveryMode} onSelect={(v) => setDraft({ ...draft, deliveryMode: v })} options={[{ value: "delivery", label: t("ng.orders.modes.delivery") }, { value: "pickup", label: t("ng.orders.modes.pickup") }]} /></label>}
        </div>
        <SalesLinesEditor lines={draft.lines} onChange={(lines) => setDraft({ ...draft, lines })} companyId={company} customerId={draft.customer || null} showStock={draft.type === "delivery"} />
        <label className={styles.field}>{t("sales.notes")}<input className={styles.input} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
        <div className={styles.formActions}>
          <button type="button" className="btnCancel" onClick={() => navigate(-1)}>{t("common.cancel")}</button>
          <button type="button" className="btnPrimary" disabled={busy || !draft.customer} onClick={async () => {
            setBusy(true); setError("");
            try { const n = await createDeliveryNote({ ...draft, company, warehouse: draft.warehouse || undefined, lines: cleanLines(draft.lines) }); navigate(`/logistics/delivery-notes/${n._id}`, { replace: true }); } catch (err) { setError(errorText(err, t)); } finally { setBusy(false); }
          }}><Save size={15} /> {t("common.save")}</button>
        </div>
      </div>
    );
  }

  if (!note) return <div className="pageShell">{error && <div className="errorMessage">{error}</div>}</div>;
  const isReturn = note.type === "return";
  return (
    <div className="pageShell">
      <PageTop crumbs={[{ label: t("ng.menu.logistics"), href: "/logistics/delivery-notes" }, { label: t("ng.delivery.notes"), href: "/logistics/delivery-notes" }, { label: note.number }]} icon={FileText}
        title={`${isReturn ? t("ng.delivery.return") : t("ng.delivery.one")} ${note.number}`} subtitle={`${note.customer?.name} · ${note.warehouse?.code} — ${note.warehouse?.name}`}>
        <button type="button" className="btnEdit" onClick={() => run(() => downloadDeliveryNotePdf(note))}><Download size={15} /> PDF</button>
        {can("finance.amounts.view") && <button type="button" className="btnEdit" onClick={() => run(() => downloadDeliveryNotePdf(note, true))}><Download size={15} /> {t("ng.delivery.valuedPdf")}</button>}
      </PageTop>
      {error && <div className="errorMessage">{error}</div>}
      <div className={s.statusBar}>
        <StatusPill status={SALES_PILL[note.status]} label={t(`ng.delivery.status.${note.status}`)} />
        {note.status === "draft" && can("logistics.notes.validate") && <button type="button" className="btnPrimary" disabled={busy} onClick={() => run(() => validateDeliveryNote(id))}><CheckCircle2 size={15} /> {isReturn ? t("ng.delivery.validateReturn") : t("ng.delivery.validate")}</button>}
        {!isReturn && ["draft", "validated"].includes(note.status) && can("logistics.notes.deliver") && <button type="button" className="btnPrimary" onClick={() => setDeliver({ receivedBy: "", reserves: "", cashCollected: "" })}><PackageCheck size={15} /> {t("ng.delivery.markDelivered")}</button>}
        {!isReturn && ["validated", "delivered"].includes(note.status) && !note.invoice && can("sales.invoices.create") && <button type="button" className="btnEdit" disabled={busy} onClick={async () => { const inv = await run(() => invoiceDeliveryNotes([id])); if (inv?._id) navigate(`/sales/invoices/${inv._id}`); }}><Receipt size={15} /> {t("ng.delivery.invoice")}</button>}
        {note.status !== "cancelled" && note.status !== "draft" && !note.invoice && can("logistics.notes.cancel") && <button type="button" className="btnCancel" onClick={() => setModal("cancel")}><Ban size={15} /> {t("common.cancel")}</button>}
        {note.status === "draft" && can("logistics.notes.delete") && <button type="button" className="btnDelete" onClick={() => setModal("delete")}><Trash2 size={15} /> {t("common.delete")}</button>}
      </div>
      {deliver && (
        <div className={styles.panel}>
          <div className={styles.formGrid}>
            <label className={styles.field}>{t("ng.delivery.receivedBy")}<input className={styles.input} value={deliver.receivedBy} onChange={(e) => setDeliver({ ...deliver, receivedBy: e.target.value })} /></label>
            <label className={styles.field}>{t("ng.delivery.cashCollected")}<input className={styles.input} type="number" min="0" value={deliver.cashCollected} onChange={(e) => setDeliver({ ...deliver, cashCollected: e.target.value })} /></label>
          </div>
          <label className={styles.field}>{t("ng.delivery.reserves")}<input className={styles.input} value={deliver.reserves} onChange={(e) => setDeliver({ ...deliver, reserves: e.target.value })} /></label>
          <div className={styles.formActions}>
            <button type="button" className="btnCancel" onClick={() => setDeliver(null)}>{t("common.cancel")}</button>
            <button type="button" className="btnPrimary" disabled={busy} onClick={async () => { if (await run(() => deliverDeliveryNote(id, deliver))) setDeliver(null); }}>{t("common.confirm")}</button>
          </div>
        </div>
      )}
      <div className={s.docMeta}>
        <div><span>{t("sales.customer")}</span>{note.customer?.name}<small className={s.muted}>{note.contactPhone || note.customer?.phone}</small></div>
        <div><span>{t("sales.date")}</span>{formatDate(note.date)}</div>
        <div><span>{t("ng.orders.deliveryMode")}</span>{t(`ng.orders.modes.${note.deliveryMode}`)}<small className={s.muted}>{note.address}</small></div>
        {note.salesOrder && <div><span>{t("ng.orders.one")}</span><button type="button" className={styles.linkButton} onClick={() => navigate(`/sales/orders/${note.salesOrder._id}`)}>{note.salesOrder.number}</button></div>}
        {note.round && <div><span>{t("ng.delivery.round")}</span><button type="button" className={styles.linkButton} onClick={() => navigate(`/logistics/rounds/${note.round._id}`)}>{note.round.number} · {formatDate(note.round.date)}</button></div>}
        {note.invoice && <div><span>{t("sales.invoices.title")}</span><button type="button" className={styles.linkButton} onClick={() => navigate(`/sales/invoices/${note.invoice._id}`)}>{note.invoice.number || t("sales.invoiceStatus.draft")}</button></div>}
        {note.weightKg > 0 && <div><span>{t("ng.delivery.weight")}</span>{fmtQty(note.weightKg)} kg</div>}
        {note.deliveredAt && <div><span>{t("ng.delivery.deliveredOn")}</span>{formatDate(note.deliveredAt)} · {note.receivedBy}</div>}
        {note.cashCollected > 0 && <div><span>{t("ng.delivery.cashCollected")}</span>{formatMoney(note.cashCollected)}</div>}
      </div>
      {note.reserves && <div className={styles.infoBanner}>{t("ng.delivery.reserves")} : {note.reserves}</div>}
      <DeliveryProofPanel t={t} note={note} />
      <table className={s.linesTable}>
        <thead><tr><th>{t("ng.common.reference")}</th><th>{t("sales.lines.description")}</th><th className={s.num}>{t("sales.lines.quantity")}</th><th>{t("sales.lines.unit")}</th><th>{t("ng.stock.lots")}</th><th className={s.num}>{t("sales.lines.totalHT")}</th></tr></thead>
        <tbody>
          {note.lines.map((l) => (
            <tr key={l._id}><td className={s.muted}>{l.reference}</td><td>{l.description}</td><td className={s.num}>{fmtQty(l.quantity)}</td><td>{l.unit}</td>
              <td className={s.muted}>{(l.lots || []).map((x) => x.number).join(", ") || "—"}</td><td className={s.num}>{formatMoney(l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100), "")}</td></tr>
          ))}
        </tbody>
      </table>
      <div className={s.totalsBox}><div className={s.grand}><span>{t("sales.totals.ttc")}</span><span>{formatMoney(note.totalTTC)}</span></div></div>
      <ActionModal isOpen={modal === "cancel"} type="confirm" title={t("common.cancel")} message={t("ng.delivery.cancelMessage")} onClose={() => setModal(null)} onConfirm={async () => { setModal(null); await run(() => cancelDeliveryNote(id, "")); }} />
      <ActionModal isOpen={modal === "delete"} type="confirm" title={t("common.delete")} message={t("ng.delivery.deleteMessage")} onClose={() => setModal(null)} onConfirm={async () => { setModal(null); try { await deleteDeliveryNote(id); navigate("/logistics/delivery-notes"); } catch (err) { setError(errorText(err, t)); } }} />
    </div>
  );
}
