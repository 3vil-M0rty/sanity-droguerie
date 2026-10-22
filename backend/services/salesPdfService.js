const PDFDocument = require("pdfkit");
const { formatDate, formatAmount, drawLetterhead, docBrand, drawDocumentTitle, drawSignatureBlock, finalizeFooters } = require("./pdfHelpers");
const { drawPartyBlocks, drawTable, ensureSpace, drawWatermark, COL_X } = require("./purchasingPdfService");
const { amountToFrenchWords } = require("./frenchNumberWords");
const { lineHT } = require("./salesCalc");

/**
 * ============================================================
 * SALES DOCUMENTS — devis & facture (PDF)
 * ============================================================
 * Same look as the purchasing documents. Invoices carry what a
 * Moroccan invoice must show: the seller's ICE / IF / RC / TP / CNSS
 * (letterhead), the customer's ICE, a number and date, each line HT,
 * VAT per rate, totals, and the amount in words.
 * ============================================================
 */

const money = (n) => `${formatAmount(n)} MAD`;

function customerParty(customer) {
  return {
    name: customer?.name,
    contactName: customer?.contacts?.[0]?.name,
    address: customer?.address,
    city: customer?.city,
    phone: customer?.phone,
    email: customer?.email,
    ice: customer?.ice,
    identifiantFiscal: customer?.identifiantFiscal,
    rc: customer?.rc,
  };
}

function linesTable(doc, lines, { prices = true } = {}) {
  const hasDiscount = prices && lines.some((l) => l.discount > 0);
  const hasRef = lines.some((l) => l.reference);
  const lotText = (l) => ((l.lots || []).length ? `Lots : ${l.lots.map((x) => `${x.number}${x.quantity && l.lots.length > 1 ? ` (${formatAmount(x.quantity).replace(/,00$/, "")})` : ""}`).join(", ")}` : null);
  const columns = prices
    ? [
      ...(hasRef ? [{ key: "reference", label: "RÉF.", width: 62 }] : []),
      { key: "description", label: "DÉSIGNATION", width: (hasDiscount ? 185 : 219) - (hasRef ? 62 : 0) },
      { key: "quantity", label: "QTÉ", width: 44, align: "right" },
      { key: "unit", label: "UNITÉ", width: 42 },
      { key: "unitPrice", label: "P.U. HT", width: 70, align: "right" },
      ...(hasDiscount ? [{ key: "discount", label: "REMISE", width: 38, align: "right" }] : []),
      { key: "vat", label: "TVA", width: 36, align: "right" },
      { key: "total", label: "TOTAL HT", width: 90, align: "right", bold: true },
    ]
    : [
      { key: "reference", label: "RÉF.", width: 80 },
      { key: "description", label: "DÉSIGNATION", width: 300 },
      { key: "quantity", label: "QTÉ", width: 60, align: "right", bold: true },
      { key: "unit", label: "UNITÉ", width: 75 },
    ];
  drawTable(doc, columns, lines.map((l) => ({
    reference: l.reference || "",
    description: l.description,
    ...(lotText(l) ? { details: [lotText(l)] } : {}),
    quantity: formatAmount(l.quantity).replace(/,00$/, ""),
    unit: l.unit || "",
    unitPrice: formatAmount(l.unitPrice),
    discount: l.discount ? `${l.discount}%` : "",
    vat: `${l.vatRate ?? 0}%`,
    total: formatAmount(lineHT(l)),
  })));
}

function totalsBox(doc, width, rows, ttcLabel, ttc) {
  ensureSpace(doc, 40 + rows.length * 16 + 60);
  doc.moveDown(0.8);
  const boxWidth = 250;
  const boxX = COL_X + width - boxWidth;
  for (const [label, value] of rows) {
    const y = doc.y;
    doc.fontSize(8.5).font("Helvetica").fillColor("#333").text(label, boxX, y, { width: 140 });
    doc.text(value, boxX + 140, y, { width: boxWidth - 140, align: "right" });
    doc.y = y + 14;
  }
  const ttcY = doc.y + 2;
  const brand = docBrand(doc);
  doc.rect(boxX, ttcY, boxWidth, 22).fill(brand.secondary);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(brand.onSecondary).text(ttcLabel, boxX + 8, ttcY + 6, { width: 140 });
  doc.text(money(ttc), boxX + 140, ttcY + 6, { width: boxWidth - 148, align: "right" });
  doc.fillColor("#000");
  doc.y = ttcY + 32;
}

function textBlock(doc, width, title, text) {
  if (!text) return;
  ensureSpace(doc, 60);
  doc.moveDown(0.6);
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#777").text(title, COL_X, doc.y, { width });
  doc.fontSize(8.5).font("Helvetica").fillColor("#000").text(text, COL_X, doc.y + 2, { width });
}

// ============================================================
// DEVIS
// ============================================================
function generateQuotePdf({ quote, company, customer, logoBuffer }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  drawDocumentTitle(doc, "DEVIS", { colX: COL_X, width, ref: quote.number });
  drawPartyBlocks(doc, {
    supplier: customerParty(customer),
    label: "CLIENT",
    width,
    infoRows: [
      ["N° de devis", quote.number],
      ["Date", formatDate(quote.date)],
      ["Valable jusqu'au", quote.validUntil ? formatDate(quote.validUntil) : null],
      ["Objet", quote.subject],
    ],
  });
  linesTable(doc, quote.lines);
  const rows = [["Total HT", money(quote.totalHT)]];
  const { vatBreakdown } = require("./salesCalc");
  vatBreakdown(quote.lines).forEach((r) => { if (r.rate > 0) rows.push([`TVA ${r.rate}% (base ${formatAmount(r.baseHT)})`, money(r.vat)]); });
  totalsBox(doc, width, rows, "TOTAL TTC", quote.totalTTC);
  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor("#333").text(
    `Arrêté le présent devis à la somme de : ${amountToFrenchWords(quote.totalTTC)} TTC.`, COL_X, doc.y, { width }
  );
  textBlock(doc, width, "CONDITIONS DE PAIEMENT", quote.paymentTerms);
  textBlock(doc, width, "REMARQUES", quote.notes);
  ensureSpace(doc, 120);
  doc.moveDown(0.8);
  doc.fontSize(8).font("Helvetica").fillColor("#555").text("Bon pour accord — date, cachet et signature du client :", COL_X, doc.y, { width });
  drawSignatureBlock(doc, { city: company.address?.city, companyName: company.name, colX: COL_X, width });
  if (quote.status === "draft") drawWatermark(doc, "BROUILLON");
  if (quote.status === "cancelled") drawWatermark(doc, "ANNULÉ");
  finalizeFooters(doc, company);
  return doc;
}

// ============================================================
// FACTURE / FACTURE D'ACOMPTE / AVOIR
// ============================================================
const TITLES = { invoice: "FACTURE", deposit: "FACTURE D'ACOMPTE", credit_note: "AVOIR" };

function generateInvoicePdf({ invoice, company, customer, quote, creditedInvoice, logoBuffer, deliveryNotes = [] }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  drawDocumentTitle(doc, TITLES[invoice.type] || "FACTURE", { colX: COL_X, width, ref: invoice.number || "BROUILLON" });
  drawPartyBlocks(doc, {
    supplier: customerParty(customer),
    label: "CLIENT",
    width,
    infoRows: [
      [invoice.type === "credit_note" ? "N° d'avoir" : "N° de facture", invoice.number || "— (brouillon)"],
      ["Date", formatDate(invoice.date)],
      [invoice.type === "credit_note" ? null : "Échéance", invoice.type === "credit_note" ? null : invoice.dueDate ? formatDate(invoice.dueDate) : null],
      ["Devis", quote?.number],
      ["Bons de livraison", deliveryNotes.length ? deliveryNotes.map((d) => d.number).join(", ") : null],
      ["Facture corrigée", creditedInvoice?.number],
      ["Objet", invoice.subject],
    ].filter(([label]) => label),
  });
  linesTable(doc, invoice.lines);

  const rows = [];
  const linesHT = (invoice.totalHT || 0) + (invoice.depositsDeductedHT || 0);
  rows.push(["Total HT", money(linesHT)]);
  if (invoice.depositsDeductedHT) rows.push(["Acomptes déjà facturés (HT)", `- ${money(invoice.depositsDeductedHT)}`]);
  if (invoice.depositsDeductedHT) rows.push(["Net HT", money(invoice.totalHT)]);
  (invoice.vatBreakdown || []).forEach((r) => { if (r.rate > 0) rows.push([`TVA ${r.rate}% (base ${formatAmount(r.baseHT)})`, money(r.vat)]); });
  const label = invoice.type === "credit_note" ? "TOTAL AVOIR TTC" : invoice.depositsDeductedHT ? "NET À PAYER TTC" : "TOTAL TTC";
  totalsBox(doc, width, rows, label, invoice.totalTTC);
  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor("#333").text(
    `Arrêtée la présente ${invoice.type === "credit_note" ? "facture d'avoir" : "facture"} à la somme de : ${amountToFrenchWords(invoice.totalTTC)} TTC.`,
    COL_X, doc.y, { width }
  );
  if (invoice.amountPaid > 0 && invoice.type !== "credit_note") {
    doc.moveDown(0.3);
    doc.fontSize(8.5).font("Helvetica").fillColor("#333").text(
      `Déjà réglé : ${money(invoice.amountPaid)} — Reste à payer : ${money(Math.max(invoice.totalTTC - invoice.amountPaid, 0))}`,
      COL_X, doc.y, { width }
    );
  }
  textBlock(doc, width, "CONDITIONS DE PAIEMENT", invoice.paymentTerms);
  if (company.bank?.rib) textBlock(doc, width, "RÈGLEMENT PAR VIREMENT", `${company.bank.bankName ? `${company.bank.bankName} — ` : ""}RIB : ${company.bank.rib}`);
  textBlock(doc, width, "REMARQUES", invoice.notes);
  ensureSpace(doc, 60);
  doc.moveDown(0.6);
  doc.fontSize(7.5).font("Helvetica").fillColor("#666").text(
    "En cas de retard de paiement, des pénalités de retard sont exigibles conformément à la loi n° 69-21.",
    COL_X, doc.y, { width }
  );
  drawSignatureBlock(doc, { city: company.address?.city, companyName: company.name, colX: COL_X, width });
  if (invoice.status === "draft") drawWatermark(doc, "BROUILLON");
  if (invoice.status === "cancelled") drawWatermark(doc, "ANNULÉE");
  finalizeFooters(doc, company);
  return doc;
}

// ============================================================
// COMMANDE CLIENT (bon de commande / confirmation de commande)
// ============================================================
function generateOrderPdf({ order, company, customer, logoBuffer }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  drawDocumentTitle(doc, "BON DE COMMANDE CLIENT", { colX: COL_X, width, ref: order.number });
  drawPartyBlocks(doc, {
    supplier: customerParty(customer),
    label: "CLIENT",
    width,
    infoRows: [
      ["N° de commande", order.number],
      ["Date", formatDate(order.date)],
      ["Réf. client", order.customerReference],
      ["Livraison prévue", order.expectedDate ? formatDate(order.expectedDate) : null],
      ["Livraison", order.deliveryMode === "pickup" ? "Enlèvement au dépôt" : order.deliveryAddress || customer?.deliveryAddress || customer?.address],
    ],
  });
  linesTable(doc, order.lines);
  const rows = [["Total HT", money(order.totalHT)]];
  const { vatBreakdown } = require("./salesCalc");
  vatBreakdown(order.lines).forEach((r) => { if (r.rate > 0) rows.push([`TVA ${r.rate}% (base ${formatAmount(r.baseHT)})`, money(r.vat)]); });
  totalsBox(doc, width, rows, "TOTAL TTC", order.totalTTC);
  textBlock(doc, width, "CONDITIONS DE PAIEMENT", order.paymentTerms);
  textBlock(doc, width, "REMARQUES", order.notes);
  drawSignatureBlock(doc, { city: company.address?.city, companyName: company.name, colX: COL_X, width });
  if (order.status === "draft") drawWatermark(doc, "BROUILLON");
  if (order.status === "cancelled") drawWatermark(doc, "ANNULÉE");
  finalizeFooters(doc, company);
  return doc;
}

// ============================================================
// BON DE LIVRAISON (valued or not)
// ============================================================
function generateDeliveryNotePdf({ note, company, customer, logoBuffer, valued = false }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  drawDocumentTitle(doc, note.type === "return" ? "BON DE RETOUR" : "BON DE LIVRAISON", { colX: COL_X, width, ref: note.number });
  drawPartyBlocks(doc, {
    supplier: customerParty(customer),
    label: "CLIENT",
    width,
    infoRows: [
      ["N° de BL", note.number],
      ["Date", formatDate(note.date)],
      ["Commande", note.salesOrder?.number],
      ["Dépôt", note.warehouse?.name],
      ["Adresse de livraison", note.deliveryMode === "pickup" ? "Enlèvement au dépôt" : note.address],
      ["Tournée", note.round?.number],
    ],
  });
  linesTable(doc, note.lines, { prices: valued });
  if (valued) {
    const rows = [["Total HT", money(note.totalHT)]];
    const { vatBreakdown } = require("./salesCalc");
    vatBreakdown(note.lines).forEach((r) => { if (r.rate > 0) rows.push([`TVA ${r.rate}%`, money(r.vat)]); });
    totalsBox(doc, width, rows, "TOTAL TTC", note.totalTTC);
  }
  textBlock(doc, width, "REMARQUES", note.notes);
  ensureSpace(doc, 120);
  doc.moveDown(1);
  const y = doc.y;
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#333").text("Livré par", COL_X, y, { width: width / 2 - 10 });
  doc.text("Reçu par (nom, date, cachet et signature)", COL_X + width / 2, y, { width: width / 2 });
  doc.fontSize(8).font("Helvetica").fillColor("#555").text(note.driver || "", COL_X, y + 14, { width: width / 2 - 10 });
  doc.text(note.receivedBy || "", COL_X + width / 2, y + 14, { width: width / 2 });
  doc.y = y + 70;
  if (note.status === "draft") drawWatermark(doc, "BROUILLON");
  if (note.status === "cancelled") drawWatermark(doc, "ANNULÉ");
  finalizeFooters(doc, company);
  return doc;
}

// ============================================================
// RELEVÉ DE COMPTE CLIENT
// ============================================================
function generateStatementPdf({ statement, company, customer, logoBuffer }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  drawDocumentTitle(doc, "RELEVÉ DE COMPTE", { colX: COL_X, width, ref: customer.code || "" });
  drawPartyBlocks(doc, {
    supplier: customerParty(customer),
    label: "CLIENT",
    width,
    infoRows: [
      ["Période", `du ${formatDate(statement.from)} au ${formatDate(statement.to)}`],
      ["Édité le", formatDate(new Date())],
      ["Solde au début", money(statement.opening)],
    ],
  });
  drawTable(doc, [
    { key: "label", label: "LIBELLÉ", width: 225 },
    { key: "date", label: "DATE", width: 65 },
    { key: "debit", label: "DÉBIT", width: 75, align: "right" },
    { key: "credit", label: "CRÉDIT", width: 75, align: "right" },
    { key: "balance", label: "SOLDE", width: 75, align: "right", bold: true },
  ], [
    { label: "Solde reporté", date: formatDate(statement.from), debit: "", credit: "", balance: formatAmount(statement.opening) },
    ...statement.rows.map((r) => ({ label: r.label, date: formatDate(r.date), debit: r.debit ? formatAmount(r.debit) : "", credit: r.credit ? formatAmount(r.credit) : "", balance: formatAmount(r.balance) })),
  ]);
  totalsBox(doc, width, [["Dont échu (en retard)", money(statement.overdue)]], statement.closing >= 0 ? "SOLDE DÛ" : "SOLDE CRÉDITEUR", Math.abs(statement.closing));
  if (statement.open.length) {
    ensureSpace(doc, 80);
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#777").text("FACTURES RESTANT À RÉGLER", COL_X, doc.y, { width });
    doc.moveDown(0.3);
    drawTable(doc, [
      { key: "number", label: "FACTURE", width: 140 },
      { key: "date", label: "DATE", width: 80 },
      { key: "dueDate", label: "ÉCHÉANCE", width: 80 },
      { key: "late", label: "RETARD", width: 70, align: "right" },
      { key: "due", label: "RESTE DÛ", width: 145, align: "right", bold: true },
    ], statement.open.map((i) => ({ number: i.number, date: formatDate(i.date), dueDate: i.dueDate ? formatDate(i.dueDate) : "", late: i.daysLate ? `${i.daysLate} j` : "—", due: formatAmount(i.due) })));
  }
  if (company.bank?.rib) textBlock(doc, width, "RÈGLEMENT PAR VIREMENT", `${company.bank.bankName ? `${company.bank.bankName} — ` : ""}RIB : ${company.bank.rib}`);
  finalizeFooters(doc, company);
  return doc;
}

// ============================================================
// BORDEREAU DE REMISE (chèques / LCN)
// ============================================================
function generateDepositSlipPdf({ slip, instruments, company, logoBuffer }) {
  const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
  const { width } = drawLetterhead(doc, company, { logoBuffer });
  const what = slip.kind === "lcn" ? (slip.mode === "escompte" ? "REMISE D'EFFETS À L'ESCOMPTE" : "REMISE D'EFFETS À L'ENCAISSEMENT") : "BORDEREAU DE REMISE DE CHÈQUES";
  drawDocumentTitle(doc, what, { colX: COL_X, width, ref: slip.number });
  doc.fontSize(9).font("Helvetica").fillColor("#000");
  const y = doc.y;
  doc.text(`Date : ${formatDate(slip.date)}`, COL_X, y, { width: width / 2 });
  doc.text(`Compte : ${slip.bankAccount || company.bank?.bankName || ""}${company.bank?.rib ? ` — RIB ${company.bank.rib}` : ""}`, COL_X, doc.y + 2, { width });
  doc.text(`Remettant : ${company.name}`, COL_X, doc.y + 2, { width });
  doc.moveDown(0.8);
  drawTable(doc, [
    { key: "n", label: "N°", width: 28, align: "right" },
    { key: "number", label: slip.kind === "lcn" ? "N° EFFET" : "N° CHÈQUE", width: 80 },
    { key: "bank", label: "BANQUE", width: 80 },
    { key: "drawer", label: "TIREUR", width: 140 },
    { key: "due", label: "ÉCHÉANCE", width: 62 },
    { key: "amount", label: "MONTANT", width: 125, align: "right", bold: true },
  ], instruments.map((i, k) => ({ n: String(k + 1), number: i.number || "—", bank: i.bank || "", drawer: i.drawer || i.customer?.name || "", due: formatDate(i.dueDate), amount: formatAmount(i.amount) })));
  totalsBox(doc, width, [["Nombre de valeurs", String(instruments.length)]], "TOTAL REMIS", slip.total);
  doc.fontSize(8.5).font("Helvetica-Oblique").fillColor("#333").text(`Arrêté le présent bordereau à la somme de : ${amountToFrenchWords(slip.total)}.`, COL_X, doc.y, { width });
  drawSignatureBlock(doc, { city: company.address?.city, companyName: company.name, colX: COL_X, width });
  finalizeFooters(doc, company);
  return doc;
}

module.exports = { generateQuotePdf, generateInvoicePdf, generateOrderPdf, generateDeliveryNotePdf, generateStatementPdf, generateDepositSlipPdf, customerParty };
