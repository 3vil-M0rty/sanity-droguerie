const express = require("express");
const crypto = require("crypto");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const links = require("../services/publicLinks");
const wa = require("../services/whatsappService");
const { buildStatement } = require("../services/statementService");
const { generateInvoicePdf, generateStatementPdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");

/**
 * ============================================================
 * PUBLIC — /api/public (no login)
 * ============================================================
 * GET  /docs/:token        the PDF a WhatsApp message points to
 *                          (signed, expiring link — services/publicLinks.js)
 * GET  /whatsapp/webhook   Meta's verification handshake
 * POST /whatsapp/webhook   delivery receipts (signed by Meta with the app secret)
 * Runs in the system context: the token / Meta's signature is the access check.
 * ============================================================
 */
const router = express.Router();

router.get("/docs/:token", async (req, res) => {
  try {
    const t = links.verify(req.params.token);
    if (!t) return res.status(410).type("text/plain; charset=utf-8").send("Ce lien a expiré ou n'est pas valide. Demandez un nouvel envoi à votre fournisseur.");
    let doc;
    let name;
    if (t.k === "inv") {
      const invoice = await SalesInvoice.findById(t.id).populate(["customer", { path: "quote", select: "number" }, { path: "creditedInvoice", select: "number" }, { path: "deliveryNotes", select: "number" }]);
      if (!invoice || invoice.status === "draft" || invoice.status === "cancelled") return res.status(404).send("Document introuvable");
      const company = await Company.findById(invoice.company);
      doc = generateInvoicePdf({ invoice, company, customer: invoice.customer, quote: invoice.quote, creditedInvoice: invoice.creditedInvoice, logoBuffer: await fetchLogoBuffer(company), deliveryNotes: invoice.deliveryNotes || [] });
      name = invoice.number;
    } else if (t.k === "st") {
      const customer = await Customer.findById(t.id).lean();
      if (!customer) return res.status(404).send("Document introuvable");
      const company = await Company.findById(customer.company);
      const statement = await buildStatement(customer, new Date(t.f), new Date(t.t));
      doc = generateStatementPdf({ statement, company, customer, logoBuffer: await fetchLogoBuffer(company) });
      name = `releve-${customer.code || "client"}`;
    } else {
      return res.status(404).send("Document introuvable");
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${name}.pdf"`);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("GET public doc error:", error);
    res.status(500).send("Erreur");
  }
});

router.get("/whatsapp/webhook", (req, res) => {
  const ok = process.env.WHATSAPP_VERIFY_TOKEN && req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN;
  if (!ok) return res.sendStatus(403);
  res.status(200).send(String(req.query["hub.challenge"] || ""));
});

router.post("/whatsapp/webhook", async (req, res) => {
  try {
    // Only Meta's signed calls are accepted; without WHATSAPP_APP_SECRET
    // the webhook is closed (an unsigned post could change message statuses).
    const secret = process.env.WHATSAPP_APP_SECRET;
    if (!secret || !req.rawBody) return res.sendStatus(503);
    const expected = `sha256=${crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex")}`;
    const got = String(req.get("x-hub-signature-256") || "");
    if (got.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return res.sendStatus(401);
    await wa.applyWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.sendStatus(200); // Meta retries for hours on errors; the log is enough
  }
});

module.exports = router;
