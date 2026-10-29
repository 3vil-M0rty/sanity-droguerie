// What a printed QR label carries, and how labels are laid out on A4.
// The till's lookup (GET /products/lookup) recognises all three codes.

/** Barcode, else internal reference, else the article's id. */
export const labelCode = (a) => (a?.barcode || a?.internalReference || a?._id || "").trim();

/** Price incl. VAT shown on the label (the public price). */
export const labelPriceTTC = (a) => Math.round((Number(a?.sellingPrice) || 0) * (1 + (Number(a?.vatRate ?? 20) || 0) / 100) * 100) / 100;

// Standard A4 sticker sheets (any brand: same sizes as Avery L7160 / L7651).
export const LABEL_FORMATS = {
  medium: { cols: 3, rows: 7, width: 63.5, height: 38.1, top: 15.15, left: 7.25, gapX: 2.5, gapY: 0 },
  small: { cols: 5, rows: 13, width: 38.1, height: 21.2, top: 10.7, left: 4.75, gapX: 2.5, gapY: 0 },
};

export const MAX_LABEL_ARTICLES = 500;
export const MAX_COPIES = 99;

/** "id*copies,id*copies" ⇄ [{ id, copies }] — the print tab's URL. */
export const encodeItems = (items) => items.map((i) => `${i.id}*${i.copies}`).join(",");
export const decodeItems = (s) => String(s || "").split(",").map((part) => {
  const [id, n] = part.split("*");
  const copies = Math.min(Math.max(Math.floor(Number(n)) || 1, 1), MAX_COPIES);
  return /^[0-9a-f]{24}$/i.test(id || "") ? { id, copies } : null;
}).filter(Boolean).slice(0, MAX_LABEL_ARTICLES);
