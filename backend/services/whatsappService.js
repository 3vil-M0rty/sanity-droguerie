const MessageLog = require("../models/MessageLog");

/**
 * ============================================================
 * WHATSAPP — invoices, statements and payment reminders
 * ============================================================
 * Two ways to send, picked automatically:
 *
 *  cloud — WhatsApp Business Platform (Meta Cloud API), when
 *          WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set.
 *          Messages to a customer who hasn't written in the last 24 h
 *          must use a template approved by Meta: set
 *          WHATSAPP_TEMPLATE_INVOICE / _STATEMENT / _REMINDER (see
 *          TEMPLATES below for their variables). Without a template
 *          the app sends a plain document message, which Meta only
 *          delivers inside an open 24 h conversation.
 *  link  — nothing to configure: the app prepares a wa.me link with
 *          the text and the PDF link; the user's own WhatsApp (phone
 *          or WhatsApp Web) opens with the message ready to send.
 *
 * Every message is logged (models/MessageLog.js). The PDF travels as
 * a signed, expiring public link (services/publicLinks.js).
 * ============================================================
 */

const API_VERSION = () => process.env.WHATSAPP_API_VERSION || "v21.0";
const isCloud = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
const mode = () => (isCloud() ? "cloud" : "link");

// Variables each approved template must have, in this order ({{1}}, {{2}}…).
const TEMPLATES = {
  invoice: { env: "WHATSAPP_TEMPLATE_INVOICE", vars: ["nom du client", "n° de facture", "montant TTC", "échéance"], header: "document" },
  statement: { env: "WHATSAPP_TEMPLATE_STATEMENT", vars: ["nom du client", "solde dû", "dont en retard"], header: "document" },
  reminder: { env: "WHATSAPP_TEMPLATE_REMINDER", vars: ["nom du client", "montant en retard", "nombre de factures", "plus ancienne échéance"], header: "document" },
};

/** Moroccan numbers: 06…/07…/05… → 2126…; +212 / 00212 accepted; other countries with their code. */
function normalizePhone(raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0[5-7]\d{8}$/.test(d)) d = `212${d.slice(1)}`;
  if (/^2120\d{9}$/.test(d)) d = `212${d.slice(4)}`; // +212 0661…
  return /^\d{8,15}$/.test(d) ? d : null;
}

const waLink = (phone, text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

function status() {
  return {
    mode: mode(),
    templates: Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, process.env[t.env] || null])),
    variables: Object.fromEntries(Object.entries(TEMPLATES).map(([k, t]) => [k, t.vars])),
    webhook: !!process.env.WHATSAPP_VERIFY_TOKEN,
  };
}

async function cloudSend(payload) {
  const res = await fetch(`https://graph.facebook.com/${API_VERSION()}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `WhatsApp API ${res.status}`);
  return body?.messages?.[0]?.id || null;
}

/**
 * Sends (cloud) or prepares (link) one message and logs it.
 * @param {object} m { company, customer, kind, to, text, link, filename, params, invoices, sentBy, automatic }
 * @returns {Promise<{ log, url? }>} url = the wa.me link in link mode
 */
async function send(m) {
  const to = normalizePhone(m.to);
  if (!to) { const e = new Error("Numéro WhatsApp invalide"); e.status = 400; throw e; }
  const base = {
    company: m.company, customer: m.customer, kind: m.kind, invoices: m.invoices || [], to, text: m.text, link: m.link,
    sentBy: m.sentBy, automatic: !!m.automatic,
  };
  if (!isCloud()) {
    if (m.automatic) return { log: await MessageLog.create({ ...base, provider: "simulation", status: "simulated" }) };
    const url = waLink(to, m.link ? `${m.text}\n\n${m.link}` : m.text);
    return { log: await MessageLog.create({ ...base, provider: "link", status: "link" }), url };
  }
  const tpl = process.env[TEMPLATES[m.kind]?.env];
  const doc = m.link ? { link: m.link, filename: m.filename || "document.pdf" } : null;
  const payload = tpl
    ? {
      to, type: "template",
      template: {
        name: tpl,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "fr" },
        components: [
          ...(doc ? [{ type: "header", parameters: [{ type: "document", document: doc }] }] : []),
          { type: "body", parameters: (m.params || []).map((p) => ({ type: "text", text: String(p ?? "") })) },
        ],
      },
    }
    : doc ? { to, type: "document", document: { ...doc, caption: m.text.slice(0, 1024) } } : { to, type: "text", text: { body: m.text } };
  try {
    const providerId = await cloudSend(payload);
    return { log: await MessageLog.create({ ...base, provider: "cloud", status: "accepted", providerId, template: tpl || undefined }) };
  } catch (err) {
    const log = await MessageLog.create({ ...base, provider: "cloud", status: "failed", error: err.message, template: tpl || undefined });
    const e = new Error(`WhatsApp : ${err.message}`);
    e.status = 502;
    e.log = log;
    throw e;
  }
}

const RANK = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
/** Meta webhook: statuses[] → MessageLog.status (never goes backwards). */
async function applyWebhook(body) {
  let n = 0;
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      for (const st of change.value?.statuses || []) {
        const log = await MessageLog.findOne({ providerId: String(st.id || "") });
        if (!log || !(st.status in RANK)) continue;
        if (RANK[st.status] <= (RANK[log.status] ?? -1) && st.status !== "failed") continue;
        log.status = st.status;
        if (st.status === "failed") log.error = st.errors?.[0]?.title || st.errors?.[0]?.message || "échec";
        await log.save();
        n += 1;
      }
    }
  }
  return n;
}

module.exports = { normalizePhone, waLink, send, status, mode, isCloud, applyWebhook, TEMPLATES };
