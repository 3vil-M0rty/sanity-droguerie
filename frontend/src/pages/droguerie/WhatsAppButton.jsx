import { useState } from "react";
import { useI18n } from "../../hooks/useI18n";
import { useCan } from "../../hooks/useCan";
import { sendCarnetWhatsapp, whatsappReminder } from "../../services/droguerieService";
import { errorText } from "../negoce/common";
import d from "./Droguerie.module.css";

/**
 * Carnet reminder on WhatsApp, sent from the app (routes/messaging.js): through the
 * WhatsApp Business API when configured, else WhatsApp opens with the message ready.
 * Users who may not send messages get the plain wa.me link.
 */
export default function WhatsAppButton({ customer, text, onSent, onError }) {
  const { t } = useI18n();
  const can = useCan();
  const [busy, setBusy] = useState(false);
  const phone = customer.whatsapp || customer.phone;
  if (!phone) return null;
  if (!can("sales.invoices.send") && !can("sales.collections.manage")) {
    const wa = whatsappReminder(phone, text);
    return wa && <a className={d.wa} href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>;
  }
  const send = async () => {
    // Opened now, while the click still counts, so the browser doesn't block it.
    const tab = window.open("", "_blank");
    setBusy(true);
    try {
      const r = await sendCarnetWhatsapp(customer._id, text);
      if (r.url) {
        if (tab) tab.location.href = r.url;
        else window.location.href = r.url;
      } else {
        tab?.close();
        onSent?.(t("dg.carnet.waSent").replace("{name}", customer.name));
      }
    } catch (err) {
      tab?.close();
      onError?.(errorText(err, t));
    } finally {
      setBusy(false);
    }
  };
  return <button type="button" className={d.wa} disabled={busy} onClick={send}>{busy ? t("dg.carnet.waSending") : "WhatsApp"}</button>;
}
