import { useEffect, useState } from "react";
import { ShieldCheck, Send, RefreshCw, FileCode2, MessageCircle, ExternalLink } from "lucide-react";
import StatusPill from "../../components/useful/StatusPill";
import { useCan } from "../../hooks/useCan";
import { formatDate, errorText } from "../negoce/common";
import { getEInvoice, submitEInvoice, refreshEInvoice, downloadUbl, whatsappInvoice, whatsappStatement, getWhatsAppStatus, getDeliveryProof } from "../../services/featuresService";
import { Modal } from "./shared";
import p from "../purchasing/Purchasing.module.css";
import s from "../sales/Sales.module.css";

const EINV_PILL = { not_sent: "neutral", pending: "pending", accepted: "accepted", rejected: "rejected", error: "rejected" };

/** Invoice page: DGI e-invoice status, what to fix, submit, UBL file. */
export function EInvoicePanel({ t, invoice }) {
  const can = useCan();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!invoice?._id || invoice.status === "draft") return;
    getEInvoice(invoice._id).then(setState).catch(() => setState(null));
  }, [invoice?._id, invoice?.status]);
  if (!invoice || invoice.status === "draft" || invoice.status === "cancelled") return null;
  const e = state?.einvoice || { status: "not_sent" };
  const check = state?.check;
  const act = async (fn) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const out = await fn();
      if (out?.einvoice) setState((x) => ({ ...(x || {}), einvoice: out.einvoice, check: { ...(x?.check || {}), warnings: out.warnings || x?.check?.warnings || [] } }));
      else if (out) setState((x) => ({ ...(x || {}), einvoice: out }));
      setNotice(t("fx.einv.sent"));
    } catch (err) {
      if (err.check) setState((x) => ({ ...(x || {}), check: err.check }));
      setError(errorText(err, t));
    } finally { setBusy(false); }
  };
  return (
    <section className={s.card} style={{ margin: "14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <ShieldCheck size={18} />
        <h3 style={{ margin: 0 }}>{t("fx.einv.title")}</h3>
        <StatusPill status={EINV_PILL[e.status] || "neutral"} label={t(`fx.einv.status.${e.status}`)} />
        {e.reference && <span className={s.muted}>{t("fx.einv.reference")} <strong>{e.reference}</strong>{e.answeredAt ? ` · ${formatDate(e.answeredAt)}` : ""}</span>}
        {e.qr && <a href={e.qr} target="_blank" rel="noreferrer" className={p.linkButton}><ExternalLink size={13} /> {t("fx.einv.qr")}</a>}
        <span style={{ flex: 1 }} />
        <button type="button" className="btnEdit" onClick={() => downloadUbl(invoice).catch((err) => setError(errorText(err, t)))}><FileCode2 size={15} /> {t("fx.einv.ubl")}</button>
        {e.status === "pending" && <button type="button" className="btnEdit" disabled={busy} onClick={() => act(() => refreshEInvoice(invoice._id))}><RefreshCw size={15} /> {t("fx.einv.refresh")}</button>}
        {can("sales.einvoicing.submit") && e.status !== "accepted" && e.status !== "pending" && (
          <button type="button" className="btnPrimary" disabled={busy} onClick={() => act(() => submitEInvoice(invoice._id, e.status !== "not_sent"))}><Send size={15} /> {e.status === "not_sent" ? t("fx.einv.submit") : t("fx.einv.resubmit")}</button>
        )}
      </div>
      {e.provider === "simulation" && e.status !== "not_sent" && <p className={s.muted} style={{ marginTop: 6 }}>{t("fx.einv.simulation")}</p>}
      {e.message && e.status !== "accepted" && <p className={s.warn} style={{ marginTop: 6 }}>{e.message}</p>}
      {error && <div className="errorMessage" style={{ marginTop: 8 }}>{error}</div>}
      {notice && !error && <div className={p.infoBanner} style={{ marginTop: 8 }}>{notice}</div>}
      {check?.errors?.length > 0 && (
        <div style={{ marginTop: 8 }}><strong className={s.bad}>{t("fx.einv.missing")}</strong><ul className={p.plainList}>{check.errors.map((x) => <li key={x}>{x}</li>)}</ul></div>
      )}
      {check?.warnings?.length > 0 && (
        <div style={{ marginTop: 8 }}><strong className={s.warn}>{t("fx.einv.warnings")}</strong><ul className={p.plainList}>{check.warnings.map((x) => <li key={x}>{x}</li>)}</ul></div>
      )}
    </section>
  );
}

/**
 * WhatsApp send dialog — invoice (kind "invoice") or account statement
 * (kind "statement"). Link mode opens wa.me in a new tab with the
 * prepared message; cloud mode sends directly.
 */
export function WhatsAppModal({ t, kind, invoice, customer, from, to: until, onClose, onDone }) {
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ to: customer?.whatsapp || customer?.phone || "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { getWhatsAppStatus().then((x) => setMode(x.mode)).catch(() => setMode("link")); }, []);
  const send = async () => {
    setBusy(true); setError("");
    // Open the tab now (still inside the click) so pop-up blockers allow it.
    const win = mode !== "cloud" ? window.open("about:blank", "_blank") : null;
    try {
      const out = kind === "invoice"
        ? await whatsappInvoice(invoice._id, { to: form.to, message: form.message })
        : await whatsappStatement(customer._id, { to: form.to, message: form.message, from, until });
      if (out.url) { if (win) win.location.href = out.url; else window.open(out.url, "_blank"); }
      else win?.close();
      onDone?.(out.url ? t("fx.wa.opened") : t("fx.wa.sent"));
      onClose();
    } catch (err) {
      win?.close();
      setError(errorText(err, t));
    } finally { setBusy(false); }
  };
  return (
    <Modal title={kind === "invoice" ? t("fx.wa.sendInvoice") : t("fx.wa.sendStatement")} onClose={onClose}
      actions={<><button type="button" className="btnCancel" onClick={onClose}>{t("common.cancel")}</button><button type="button" className="btnPrimary" disabled={busy || !form.to} onClick={send}><MessageCircle size={15} /> {t("fx.common.send")}</button></>}>
      <p className={s.muted}>{mode === "cloud" ? t("fx.wa.cloudMode") : t("fx.wa.linkMode")}</p>
      {error && <div className="errorMessage">{error}</div>}
      <label className={p.field}>{t("fx.wa.to")}<input className={p.input} value={form.to} placeholder={t("fx.wa.toHint")} onChange={(e) => setForm({ ...form, to: e.target.value })} /></label>
      <label className={p.field}>{t("fx.wa.message")}<textarea className={p.input} rows={4} value={form.message} placeholder={t("fx.wa.messageHint")} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
    </Modal>
  );
}

/** Delivery note page: signature, photo and position captured on the driver's phone. */
export function DeliveryProofPanel({ t, note }) {
  const [proof, setProof] = useState(null);
  useEffect(() => {
    if (!note?.proof) return;
    getDeliveryProof(note._id).then(setProof).catch(() => setProof(null));
  }, [note?._id, note?.proof]);
  if (!note?.proof || !proof) return null;
  return (
    <section className={s.card} style={{ margin: "14px 0" }}>
      <h3>{t("fx.pod.title")}</h3>
      <p className={s.muted}>
        {t("fx.pod.receivedBy")} <strong>{proof.receivedBy}</strong> · {t("fx.pod.at")} {new Date(proof.takenAt).toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short" })}
        {proof.by ? ` · ${proof.by.firstName} ${proof.by.lastName}` : ""}
        {proof.gps?.lat ? <> · <a href={`https://www.google.com/maps?q=${proof.gps.lat},${proof.gps.lng}`} target="_blank" rel="noreferrer">{t("fx.pod.gps")}</a></> : null}
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {proof.signature && <figure style={{ margin: 0 }}><figcaption className={s.muted}>{t("fx.pod.signature")}</figcaption><img src={proof.signature} alt={t("fx.pod.signature")} style={{ maxWidth: 320, maxHeight: 160, background: "#fff", border: "1px solid var(--color-border)", borderRadius: 8 }} /></figure>}
        {proof.photo && <figure style={{ margin: 0 }}><figcaption className={s.muted}>{t("fx.pod.photo")}</figcaption><a href={proof.photo} target="_blank" rel="noreferrer"><img src={proof.photo} alt={t("fx.pod.photo")} style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8 }} /></a></figure>}
      </div>
    </section>
  );
}
