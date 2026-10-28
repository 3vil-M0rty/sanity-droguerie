const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");

/**
 * ============================================================
 * ARTICLE LABELS — barcode stickers as a PDF
 * ============================================================
 * Two standard formats:
 *   roll  40 × 30 mm, one label per page — thermal label printers
 *         (Xprinter, Zebra, TSC…) with the usual 40×30 roll
 *   a4    A4 sheet of 24 labels, 3 × 8 of 70 × 37 mm — any office
 *         printer with the common "70×37" sticker sheets
 * Each label: article name, price TTC, barcode with its digits.
 *
 * Barcode symbology: EAN-13 when the code is a valid EAN-13 (products
 * carry one, and the in-store codes made by assignInStoreCodes are
 * EAN-13 too), Code 128 for anything else (an internal reference).
 *
 * Articles without any code get an in-store EAN-13 (GS1 prefix 20,
 * reserved for a shop's own use) saved on the article, so the label
 * scans at the till straight away.
 * ============================================================
 */

const MM = 72 / 25.4;
const FORMATS = {
  roll: { label: [40, 30] },
  a4: { label: [70, 37], cols: 3, rows: 8, page: [210, 297], margin: [0, 0.5] },
};

function ean13CheckDigit(d12) {
  const sum = [...d12].reduce((s, ch, i) => s + Number(ch) * (i % 2 ? 3 : 1), 0);
  return String((10 - (sum % 10)) % 10);
}
const isEan13 = (code) => /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === code[12];

/** The code a label carries: barcode, else internal reference. */
const codeOf = (p) => String(p.barcode || p.internalReference || "").trim();

/**
 * Gives every article without a barcode nor an internal reference an
 * in-store EAN-13 "20" + 10-digit sequence + check digit, unique in the company.
 * Returns the number of codes assigned.
 */
async function assignInStoreCodes(Product, companyId, products) {
  const missing = products.filter((p) => !codeOf(p));
  if (!missing.length) return 0;
  const last = await Product.find({ company: companyId, barcode: /^20\d{11}$/ }).select("barcode").sort({ barcode: -1 }).limit(1).lean();
  let seq = last.length ? Number(last[0].barcode.slice(2, 12)) : 0;
  for (const p of missing) {
    seq += 1;
    const d12 = `20${String(seq).padStart(10, "0")}`;
    p.barcode = d12 + ean13CheckDigit(d12);
    // eslint-disable-next-line no-await-in-loop
    await Product.updateOne({ _id: p._id, company: companyId }, { $set: { barcode: p.barcode } });
  }
  return missing.length;
}

async function barcodePng(code) {
  const ean = isEan13(code);
  return bwipjs.toBuffer({
    bcid: ean ? "ean13" : "code128",
    text: ean ? code.slice(0, 12) : code, // bwip adds the EAN check digit
    scale: 4,
    height: 10,
    includetext: true,
    textsize: 9,
    textxalign: "center",
    guardwhitespace: ean,
  });
}

const money = (n) => `${(Math.round(n * 100) / 100).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DH`;
const priceTtc = (p) => (p.sellingPrice === null || p.sellingPrice === undefined ? null : p.sellingPrice * (1 + Number(p.vatRate ?? 20) / 100));

/** Draws one label with its top-left corner at (x, y) points, size w × h points. */
function drawLabel(doc, { x, y, w, h, product, png, shop }) {
  const pad = 2.2 * MM;
  const innerW = w - 2 * pad;
  let top = y + pad * 0.8;
  if (shop) {
    doc.font("Helvetica").fontSize(5.5).fillColor("#555").text(shop, x + pad, top, { width: innerW, lineBreak: false, ellipsis: true });
    top += 7;
  }
  const nameSize = h < 32 * MM ? 7 : 8;
  doc.font("Helvetica-Bold").fontSize(nameSize).fillColor("#000")
    .text(product.name, x + pad, top, { width: innerW, height: nameSize * 2.5, lineGap: -0.5, ellipsis: true });
  top += nameSize * 2.3 + 1;
  const ttc = priceTtc(product);
  if (ttc !== null) {
    doc.font("Helvetica-Bold").fontSize(h < 32 * MM ? 11 : 13).text(money(ttc), x + pad, top, { width: innerW, align: "right", lineBreak: false });
    top += (h < 32 * MM ? 11 : 13) + 1;
  }
  const bottom = y + h - pad * 0.6;
  const room = bottom - top;
  if (png && room > 8) doc.image(png, x + pad, top, { fit: [innerW, room], align: "center", valign: "bottom" });
}

/**
 * The labels PDF (a pdfkit document, not ended).
 * @param items [{ product, copies }]  product: { name, barcode, internalReference, sellingPrice, vatRate }
 * @param format "roll" | "a4"
 * @param opts { shop?: shop name printed on top, skip?: empty positions to leave at the start of an A4 sheet }
 */
async function labelsPdf(items, format = "roll", { shop = "", skip = 0 } = {}) {
  const f = FORMATS[format] || FORMATS.roll;
  const pngs = new Map();
  for (const { product } of items) {
    const code = codeOf(product);
    // eslint-disable-next-line no-await-in-loop
    if (code && !pngs.has(code)) pngs.set(code, await barcodePng(code).catch(() => null));
  }
  const labels = items.flatMap(({ product, copies }) => Array.from({ length: Math.max(1, Math.min(500, Number(copies) || 1)) }, () => product));
  const [lw, lh] = f.label.map((v) => v * MM);

  if (format !== "a4") {
    const doc = new PDFDocument({ size: [lw, lh], margin: 0, autoFirstPage: false, info: { Title: "Étiquettes" } });
    for (const p of labels) {
      doc.addPage({ size: [lw, lh], margin: 0 });
      drawLabel(doc, { x: 0, y: 0, w: lw, h: lh, product: p, png: pngs.get(codeOf(p)), shop });
    }
    return doc;
  }

  const [pw, ph] = f.page.map((v) => v * MM);
  const [mx, my] = f.margin.map((v) => v * MM);
  const perPage = f.cols * f.rows;
  const doc = new PDFDocument({ size: [pw, ph], margin: 0, autoFirstPage: false, info: { Title: "Étiquettes" } });
  const slots = [...Array(Math.max(0, Math.min(perPage - 1, Number(skip) || 0))).fill(null), ...labels];
  slots.forEach((p, i) => {
    const pos = i % perPage;
    if (pos === 0) doc.addPage({ size: [pw, ph], margin: 0 });
    if (!p) return;
    const col = pos % f.cols;
    const row = Math.floor(pos / f.cols);
    drawLabel(doc, { x: mx + col * lw, y: my + row * lh, w: lw, h: lh, product: p, png: pngs.get(codeOf(p)), shop });
  });
  return doc;
}

module.exports = { labelsPdf, assignInStoreCodes, isEan13, ean13CheckDigit, FORMATS };
