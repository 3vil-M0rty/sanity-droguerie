/**
 * Article search that stays fast with 100 000+ articles.
 *
 * An unanchored, case-insensitive regex (/4570/i on name, reference,
 * barcode…) can't use an index: MongoDB reads every article of the
 * company on every keystroke. Instead, each article keeps a small list
 * of normalised words — `searchTokens` — computed when it is saved:
 *
 *   "Mitigeur lavabo Éco chromé", "GRO-ES-DCH", "6111000004570"
 *     → mitigeur, lavabo, eco, chrome, gro-es-dch, groesdch, gro, es, dch,
 *       6111000004570, 4570, 04570, 004570…
 *
 * and a search becomes, for each typed word, an ANCHORED prefix match
 * (/^chrom/) on that array, which walks the { company, searchTokens }
 * index like a dictionary. Accents and case don't matter, any word of the
 * name matches by its beginning, codes match whole, compacted, by segment,
 * and barcodes also by their last digits (what people read off a label).
 */

const MAX_TOKENS = 80;
const MAX_TERMS = 6;

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const words = (value) => normalize(value).split(/[^a-z0-9]+/).filter(Boolean);

/** A code (reference, barcode): whole, without separators, and by segment. */
function codeTokens(value) {
  const v = normalize(value).replace(/\s+/g, "");
  if (!v) return [];
  const out = [v, v.replace(/[^a-z0-9]/g, ""), ...words(v)];
  // Barcodes: the last 4 to 8 digits too, so "4570" finds 6111000004570.
  if (/^\d{8,}$/.test(v)) for (let n = 4; n <= Math.min(8, v.length - 1); n += 1) out.push(v.slice(-n));
  return out;
}

/** The tokens of a product (plain object or mongoose document). */
function productTokens(p) {
  const tokens = new Set();
  const add = (list) => list.forEach((x) => x && tokens.add(x.slice(0, 60)));
  add(words(p.name));
  add(codeTokens(p.internalReference));
  add(codeTokens(p.barcode));
  add(codeTokens(p.manufacturerReference));
  (p.packagings || []).forEach((k) => add(codeTokens(k.barcode)));
  (p.prices || []).forEach((x) => add(codeTokens(x.supplierReference)));
  (p.attributes || []).forEach((a) => add(words(a.value)));
  return [...tokens].slice(0, MAX_TOKENS);
}

const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The query part for what the user typed: every word must start one of
 * the article's tokens. Returns null when nothing searchable was typed.
 */
function searchFilter(q) {
  const raw = normalize(q);
  if (!raw) return null;
  let terms = words(raw);
  // "GRO-ES-DCH" / "611 1000" typed as one code: also try it compacted.
  const compact = raw.replace(/[^a-z0-9]/g, "");
  if (terms.length > 1 && !/\s/.test(raw)) terms = [compact];
  terms = [...new Set(terms)].slice(0, MAX_TERMS);
  if (!terms.length) return null;
  const clauses = terms.map((t) => ({ searchTokens: { $regex: `^${escapeRx(t)}` } }));
  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

module.exports = { normalize, productTokens, searchFilter };
