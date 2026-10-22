const SalesSettings = require("../models/SalesSettings");

/**
 * ============================================================
 * PRICING — which price a customer pays for an article
 * ============================================================
 * Price levels are defined per company (SalesSettings.priceLevels):
 *   P1 Revendeur · P2 Gros · P3 Détail · P4 Comptoir (defaults)
 * A customer has one level (Customer.priceLevel, else the company's
 * default). Price of an article for a level (HT, base unit):
 *   1. the article's own price for that level (Product.priceLevels)
 *   2. else CMUP × (1 + level markup %)  when the level has a markup
 *   3. else the article's public price (Product.sellingPrice)
 * Then the customer's own discount (Customer.discountPercent) applies
 * as the line discount. A packaging unit multiplies by its factor.
 * ============================================================
 */

const DEFAULT_LEVELS = [
  { code: "P1", label: "Revendeur", markupPercent: 15, sortOrder: 1 },
  { code: "P2", label: "Gros / installateur", markupPercent: 22, sortOrder: 2 },
  { code: "P3", label: "Détail", markupPercent: 35, sortOrder: 3 },
  { code: "P4", label: "Comptoir", markupPercent: 40, sortOrder: 4 },
];

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

/** The company's settings — created with négoce defaults on first read. */
async function getSettings(companyId) {
  let s = await SalesSettings.findOne({ company: companyId });
  if (!s) {
    try {
      s = await SalesSettings.create({ company: companyId, priceLevels: DEFAULT_LEVELS, defaultPriceLevel: "P3", posPriceLevel: "P4" });
    } catch (err) {
      if (err.code !== 11000) throw err;
      s = await SalesSettings.findOne({ company: companyId });
    }
  }
  return s;
}

function levelFor(settings, customer) {
  const codes = new Set((settings?.priceLevels || []).map((l) => l.code));
  const wanted = customer?.priceLevel;
  if (wanted && codes.has(wanted)) return wanted;
  if (customer?.type === "walk_in" && settings?.posPriceLevel && codes.has(settings.posPriceLevel)) return settings.posPriceLevel;
  return settings?.defaultPriceLevel || (settings?.priceLevels?.[0]?.code ?? null);
}

/** HT price per base unit of `product` at price level `code`. */
function priceAtLevel(product, code, settings) {
  const own = (product.priceLevels || []).find((p) => p.level === code);
  if (own) return { price: round2(own.price), origin: "article" };
  const level = (settings?.priceLevels || []).find((l) => l.code === code);
  if (level && level.markupPercent !== null && level.markupPercent !== undefined && product.avgCost > 0) {
    return { price: round2(product.avgCost * (1 + level.markupPercent / 100)), origin: "markup" };
  }
  if (product.sellingPrice !== null && product.sellingPrice !== undefined) return { price: round2(product.sellingPrice), origin: "public" };
  return { price: null, origin: "none" };
}

/** Every level's price for one article — the article page and the price list. */
function allLevelPrices(product, settings) {
  return (settings?.priceLevels || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((l) => ({ code: l.code, label: l.label, ...priceAtLevel(product, l.code, settings) }));
}

/**
 * What a sales line should propose for this customer:
 * { unitPrice (HT, per `unit`), discount, level, unit, unitFactor, vatRate }.
 */
function quoteLine(product, customer, settings, unit = null, { quantity = 0, channel = "sales", promotions = null } = {}) {
  const level = levelFor(settings, customer);
  const { price } = priceAtLevel(product, level, settings);
  let factor = 1;
  let u = product.unit;
  if (unit && unit !== product.unit) {
    const pack = (product.packagings || []).find((p) => p.unit === unit);
    if (pack) { factor = pack.factor; u = pack.unit; }
  }
  const out = {
    level,
    unit: u,
    unitFactor: factor,
    unitPrice: price === null ? null : round2(price * factor),
    discount: Number(customer?.discountPercent) || 0,
    vatRate: product.vatRate ?? 20,
    promotion: null,
  };
  // Dated promotions (services/promotionService.js): the best one wins
  const promos = promotions || settings?.promotions;
  if (promos?.length && out.unitPrice !== null) {
    const best = require("./promotionService").bestPrice(promos, product, customer, { level, channel, baseQuantity: (Number(quantity) || 0) * factor, unitPrice: out.unitPrice, discount: out.discount, factor });
    if (best) Object.assign(out, { unitPrice: best.unitPrice, discount: best.discount, promotion: best.promotion });
  }
  return out;
}

/**
 * Lines priced below cost (net HT per base unit < CMUP) or below the
 * article's minimum price. Returns [{ index, name, net, floor, reason }].
 */
function belowFloor(lines, productsById) {
  const out = [];
  lines.forEach((l, index) => {
    const p = l.product && productsById.get(String(l.product));
    if (!p || p.isService || l.free) return; // free goods: added by a promotion, server side
    const net = (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100) / (l.unitFactor || 1);
    if (p.minSellingPrice && net + 1e-6 < p.minSellingPrice) out.push({ index, name: p.name, net: round2(net), floor: p.minSellingPrice, reason: "min_price" });
    else if (p.avgCost > 0 && net + 1e-6 < p.avgCost) out.push({ index, name: p.name, net: round2(net), floor: round2(p.avgCost), reason: "below_cost" });
  });
  return out;
}

module.exports = { DEFAULT_LEVELS, getSettings, levelFor, priceAtLevel, allLevelPrices, quoteLine, belowFloor, round2 };
