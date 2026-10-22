const PDFDocument = require("pdfkit");

/**
 * Printable price list (A4, French): one column per plan (monthly,
 * yearly, set-up fee, what is included), the options, the commercial
 * terms and the seller's contact details. Built from the plans and
 * settings stored in the platform, so a price changed there is on the
 * next PDF.
 */

const TEAL = "#0f766e";
const INK = "#111827";
const MUTED = "#4b5563";
const LINE = "#d1d5db";
const SOFT = "#f0fdfa";

const money = (n) => (Number(n) || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }).replace(/ | /g, " ");
const UNIT = { month: "/ mois", one_time: "une fois", quote: "" };

function priceListPdf({ plans = [], addons = [], settings = {}, date = new Date(), title = "Sanity" }) {
  const doc = new PDFDocument({ size: "A4", margin: 36, info: { Title: `${title} — Grille tarifaire`, Author: settings.seller?.legalName || "Sanity" } });
  const W = doc.page.width - 72;
  const X = 36;
  const seller = settings.seller || {};
  const pl = settings.priceList || {};
  // One A4 page: the layout below is sized to fit; never add pages.
  doc.page.margins.bottom = 0;
  const clean = (t) => String(t || "").replace(/[↔→←]/g, "-");

  // ---------- header
  doc.rect(0, 0, doc.page.width, 96).fill(TEAL);
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(26).text(title, X, 26);
  doc.font("Helvetica").fontSize(11).text(pl.tagline || "Le logiciel de gestion des grossistes et distributeurs", X, 60, { width: W * 0.65 });
  doc.font("Helvetica-Bold").fontSize(14).text("Grille tarifaire", X, 28, { width: W, align: "right" });
  const validity = pl.validUntil ? `Valable jusqu'au ${new Date(pl.validUntil).toLocaleDateString("fr-MA")}` : `Édition ${date.toLocaleDateString("fr-MA", { month: "long", year: "numeric" })}`;
  doc.font("Helvetica").fontSize(9.5).text(validity, X, 50, { width: W, align: "right" });
  doc.text("Prix en MAD hors taxes", X, 64, { width: W, align: "right" });

  // ---------- plan columns
  const shown = plans.filter((p) => p.active !== false).slice(0, 4);
  const gap = 10;
  const colW = (W - gap * (shown.length - 1)) / Math.max(shown.length, 1);
  const top = 116;
  // Height = tallest column.
  doc.font("Helvetica").fontSize(8.2);
  const featuresH = shown.map((p) => (p.features || []).reduce((h, f) => h + doc.heightOfString(clean(f), { width: colW - 34 }) + 2.5, 0));
  const colH = 200 + Math.max(0, ...featuresH);

  shown.forEach((p, i) => {
    const x = X + i * (colW + gap);
    const hl = !!p.highlight;
    doc.roundedRect(x, top, colW, colH, 8).lineWidth(hl ? 2 : 1).fillAndStroke(hl ? SOFT : "#ffffff", hl ? TEAL : LINE);
    if (hl) {
      doc.roundedRect(x + colW / 2 - 46, top - 9, 92, 18, 9).fill(TEAL);
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(8).text("RECOMMANDÉ", x + colW / 2 - 46, top - 4, { width: 92, align: "center" });
    }
    let y = top + 16;
    doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(17).text(p.name, x + 12, y, { width: colW - 24 });
    y += 24;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.6).text(p.audience || " ", x + 12, y, { width: colW - 24, height: 24 });
    y += 30;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(22).text(money(p.monthlyPriceHT), x + 12, y, { continued: true });
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("  MAD HT / mois");
    y += 30;
    doc.font("Helvetica").fontSize(8.8).fillColor(INK);
    if (p.yearlyPriceHT != null) {
      doc.text(`ou ${money(p.yearlyPriceHT)} MAD HT / an`, x + 12, y, { width: colW - 24 });
      doc.fillColor(TEAL).font("Helvetica-Bold").text(p.yearlyPriceHT < p.monthlyPriceHT * 12 ? `soit ${Math.round(12 - p.yearlyPriceHT / p.monthlyPriceHT)} mois offerts` : " ", x + 12, y + 12, { width: colW - 24 });
    }
    y += 34;
    doc.moveTo(x + 12, y).lineTo(x + colW - 12, y).lineWidth(0.6).stroke(LINE);
    y += 8;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.4).text("Mise en service (une fois)", x + 12, y, { width: colW - 24 });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(`${p.code === "ENTREPRISE" ? "dès " : ""}${money(p.setupFeeHT)} MAD HT`, x + 12, y + 12, { width: colW - 24 });
    y += 34;
    doc.moveTo(x + 12, y).lineTo(x + colW - 12, y).lineWidth(0.6).stroke(LINE);
    y += 10;
    doc.font("Helvetica").fontSize(8.2).fillColor(INK);
    for (const f of p.features || []) {
      doc.fillColor(TEAL).text("•", x + 12, y, { continued: false });
      doc.fillColor(INK).text(clean(f), x + 22, y, { width: colW - 34 });
      y = doc.y + 2.5;
    }
  });

  // ---------- options
  let y = top + colH + 16;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(12.5).text("Options", X, y);
  y += 17;
  const visibleAddons = addons.filter((a) => a.name);
  // Tighter rows when there are many options, so the page never overflows.
  const rowH = visibleAddons.length > 6 ? 13 : 15;
  visibleAddons.forEach((a, i) => {
    if (i % 2 === 0) doc.rect(X, y - 4, W, rowH).fill("#f9fafb");
    doc.fillColor(INK).font("Helvetica").fontSize(8.8).text(clean(a.name), X + 8, y, { width: W * 0.55 });
    doc.fillColor(MUTED).fontSize(8).text(clean(a.note), X + W * 0.55, y + 1, { width: W * 0.22 });
    const price = a.unit === "quote" || !a.priceHT ? "Sur devis" : `${money(a.priceHT)} MAD HT ${UNIT[a.unit] || ""}`;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.8).text(price, X + W * 0.77, y, { width: W * 0.23 - 8, align: "right" });
    y += rowH;
  });

  // ---------- terms
  y += 10;
  doc.fillColor(TEAL).font("Helvetica-Bold").fontSize(12.5).text("Conditions", X, y);
  y += 17;
  doc.font("Helvetica").fontSize(8.3).fillColor(INK);
  for (const line of String(pl.terms || "").split("\n").map((l) => l.trim()).filter(Boolean)) {
    doc.fillColor(TEAL).text("•", X + 2, y);
    doc.fillColor(INK).text(clean(line), X + 12, y, { width: W - 12 });
    y = doc.y + 2;
  }

  // ---------- footer (contact)
  const fy = doc.page.height - 58;
  doc.moveTo(X, fy - 8).lineTo(X + W, fy - 8).lineWidth(0.6).stroke(LINE);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text(seller.legalName || "Sanity", X, fy, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(8.6).fillColor(MUTED)
    .text([seller.phone, seller.email, [seller.address, seller.city].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ") || " ", X, fy + 13, { width: W, align: "center" });
  const ids = [seller.ice && `ICE ${seller.ice}`, seller.rc && `RC ${seller.rc}`, seller.taxId && `IF ${seller.taxId}`].filter(Boolean).join(" — ");
  if (ids) doc.fontSize(7.5).text(ids, X, fy + 26, { width: W, align: "center" });
  return doc;
}

module.exports = { priceListPdf };
