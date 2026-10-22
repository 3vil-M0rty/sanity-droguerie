const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const PosSale = require("../models/PosSale");
const Product = require("../models/Product");
const InventoryCategory = require("../models/InventoryCategory");
const SalesTarget = require("../models/SalesTarget");
const User = require("../models/User");
const { amountDue, round2 } = require("./salesCalc");

/**
 * ============================================================
 * ANALYTICS (tableau de bord › Analyses)
 * ============================================================
 * The figures a négociant steers by, all computed by MongoDB from the
 * documents themselves (issued invoices / credit notes and counter
 * tickets, their lines with the CMUP cost recorded at sale time, stock
 * at CMUP) — nothing is pre-aggregated, nothing goes to the browser but
 * the results:
 *
 *   monthly        12 months of sales HT by channel (B2B invoices,
 *                  counter) with margin and margin rate
 *   projection     this month's sales at the current daily pace
 *   cashCycle      DSO (days of sales waiting to be collected), DIO (days
 *                  of sales sitting in stock) and their sum — the days a
 *                  dirham spends between buying an article and cashing it
 *   gmroi          gross margin of the last 12 months ÷ stock at CMUP:
 *                  dirhams of margin earned per dirham of stock
 *   abc            Pareto of margin by article: classes A (80 % of the
 *                  margin), B (next 15 %), C (last 5 %), the curve and the
 *                  top articles
 *   stockAge       stock value by time since the article last sold
 *                  (< 90 days, 90–365, > 1 year, never sold)
 *   stockouts      articles that will run out within 21 days at their
 *                  90-day sales pace, with the expected date
 *   aging          receivables by days overdue
 *   reps           this month's sales HT vs target per sales rep
 *   insights       plain-language findings from all of the above
 *
 * A sales rep who only sees their own customers gets their own figures
 * (scope from salesFlowService.repFilter); the counter isn't theirs.
 * ============================================================
 */

const DAY = 86400000;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const SOLD = ["issued", "partially_paid", "paid"];
const periodOf = (y, m) => `${y}-${String(m).padStart(2, "0")}`;

// A line's HT and its cost (unitCost is per base unit).
const LINE_HT = { $multiply: ["$lines.quantity", "$lines.unitPrice", { $subtract: [1, { $divide: [{ $ifNull: ["$lines.discount", 0] }, 100] }] }] };
const LINE_COST = { $multiply: [{ $ifNull: ["$lines.unitCost", 0] }, "$lines.quantity", { $ifNull: ["$lines.unitFactor", 1] }] };
const LINE_UNITS = { $multiply: ["$lines.quantity", { $ifNull: ["$lines.unitFactor", 1] }] };
const SIGN = { $cond: [{ $eq: ["$type", "credit_note"] }, -1, 1] };

async function monthlySeries(companyId, scope, withCounter, start, months) {
  const company = oid(companyId);
  const [inv, pos] = await Promise.all([
    SalesInvoice.aggregate([
      { $match: { company, ...scope, status: { $in: SOLD }, type: { $in: ["invoice", "credit_note"] }, date: { $gte: start } } },
      { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, ht: { $sum: { $multiply: [SIGN, "$totalHT"] } }, cost: { $sum: { $multiply: [SIGN, { $ifNull: ["$costTotal", 0] }] } } } },
    ]),
    withCounter
      ? PosSale.aggregate([
        { $match: { company, status: "completed", invoice: null, date: { $gte: start } } },
        { $group: { _id: { y: { $year: "$date" }, m: { $month: "$date" } }, ht: { $sum: "$totalHT" }, cost: { $sum: { $ifNull: ["$costTotal", 0] } }, tickets: { $sum: 1 } } },
      ])
      : [],
  ]);
  const byKey = (rows) => new Map(rows.map((r) => [periodOf(r._id.y, r._id.m), r]));
  const invBy = byKey(inv);
  const posBy = byKey(pos);
  const out = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = periodOf(d.getFullYear(), d.getMonth() + 1);
    const a = invBy.get(key) || {};
    const b = posBy.get(key) || {};
    const b2b = round2(a.ht || 0);
    const counter = round2(b.ht || 0);
    const total = round2(b2b + counter);
    const margin = round2(total - (a.cost || 0) - (b.cost || 0));
    out.push({ period: key, b2b, counter, total, margin, marginRate: total ? round2((margin / total) * 100) : null, tickets: b.tickets || 0 });
  }
  return out;
}

/** Per article over a window: revenue, margin, units sold, last sale. */
async function articleSales(companyId, scope, withCounter, since) {
  const company = oid(companyId);
  const pipeline = (match, sign) => [
    { $match: match },
    { $unwind: "$lines" },
    { $match: { "lines.product": { $ne: null } } },
    {
      $group: {
        _id: "$lines.product",
        revenue: { $sum: { $multiply: [sign, LINE_HT] } },
        cost: { $sum: { $multiply: [sign, LINE_COST] } },
        units: { $sum: { $multiply: [sign, LINE_UNITS] } },
        last: { $max: "$date" },
      },
    },
  ];
  const [inv, pos] = await Promise.all([
    SalesInvoice.aggregate(pipeline({ company, ...scope, status: { $in: SOLD }, type: { $in: ["invoice", "credit_note"] }, date: { $gte: since } }, SIGN)),
    withCounter ? PosSale.aggregate(pipeline({ company, status: "completed", invoice: null, date: { $gte: since } }, 1)) : [],
  ]);
  const map = new Map();
  for (const r of [...inv, ...pos]) {
    const k = String(r._id);
    const cur = map.get(k) || { product: r._id, revenue: 0, cost: 0, units: 0, last: null };
    cur.revenue += r.revenue;
    cur.cost += r.cost;
    cur.units += r.units;
    if (!cur.last || r.last > cur.last) cur.last = r.last;
    map.set(k, cur);
  }
  return map;
}

/** Last sale date of every article ever sold (for stock age). */
async function lastSales(companyId, scope, withCounter) {
  const company = oid(companyId);
  const group = [{ $unwind: "$lines" }, { $match: { "lines.product": { $ne: null } } }, { $group: { _id: "$lines.product", last: { $max: "$date" } } }];
  const [inv, pos] = await Promise.all([
    SalesInvoice.aggregate([{ $match: { company, ...scope, status: { $in: SOLD }, type: "invoice" } }, ...group]),
    withCounter ? PosSale.aggregate([{ $match: { company, status: "completed" } }, ...group]) : [],
  ]);
  const map = new Map();
  for (const r of [...inv, ...pos]) {
    const k = String(r._id);
    if (!map.has(k) || r.last > map.get(k)) map.set(k, r.last);
  }
  return map;
}

function abcOf(sales, names) {
  const rows = [...sales.values()]
    .map((r) => ({ product: String(r.product), margin: r.revenue - r.cost, revenue: r.revenue }))
    .filter((r) => r.margin > 0)
    .sort((a, b) => b.margin - a.margin);
  const total = rows.reduce((s, r) => s + r.margin, 0);
  let cum = 0;
  const classes = { A: { count: 0, margin: 0 }, B: { count: 0, margin: 0 }, C: { count: 0, margin: 0 } };
  const curve = [{ articlesPct: 0, marginPct: 0 }];
  rows.forEach((r, i) => {
    const before = total ? cum / total : 0;
    cum += r.margin;
    r.cls = before < 0.8 ? "A" : before < 0.95 ? "B" : "C";
    classes[r.cls].count += 1;
    classes[r.cls].margin += r.margin;
    curve.push({ articlesPct: round2(((i + 1) / rows.length) * 100), marginPct: round2(total ? (cum / total) * 100 : 0) });
  });
  // At most ~60 points: the browser draws a curve, not the catalogue.
  const step = Math.max(1, Math.ceil(curve.length / 60));
  const thin = curve.filter((_, i) => i % step === 0 || i === curve.length - 1);
  for (const c of Object.values(classes)) c.margin = round2(c.margin);
  return {
    totalMargin: round2(total),
    articlesWithMargin: rows.length,
    classes,
    curve: thin,
    top: rows.slice(0, 8).map((r) => ({ ...names.get(r.product), _id: r.product, margin: round2(r.margin), revenue: round2(r.revenue), share: round2(total ? (r.margin / total) * 100 : 0), cls: r.cls })),
  };
}

async function analytics(companyId, scope = {}, { now = new Date(), months = 12, repId = null } = {}) {
  const company = oid(companyId);
  const withCounter = Object.keys(scope).length === 0;
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const since90 = new Date(now.getTime() - 90 * DAY);
  const since365 = new Date(now.getTime() - 365 * DAY);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [monthly, sales90, sales365, lastSold, products, open, categories] = await Promise.all([
    monthlySeries(companyId, scope, withCounter, start, months),
    articleSales(companyId, scope, withCounter, since90),
    articleSales(companyId, scope, withCounter, since365),
    lastSales(companyId, scope, withCounter),
    Product.find({ company, isService: { $ne: true }, isVariantParent: { $ne: true } }).select("name internalReference unit quantity avgCost threshold category image.thumbUrl").lean(),
    SalesInvoice.find({ company, ...scope, status: { $in: ["issued", "partially_paid"] }, type: { $ne: "credit_note" } }).select("totalTTC amountPaid dueDate date status type").lean(),
    InventoryCategory.find({ company }).select("name parent color").lean(),
  ]);
  const names = new Map(products.map((p) => [String(p._id), { name: p.name, internalReference: p.internalReference, unit: p.unit, thumbnail: p.image?.thumbUrl || "" }]));

  // ---- this month and its projection
  const thisMonth = monthly[monthly.length - 1];
  const lastMonth = monthly[monthly.length - 2] || null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsed = Math.max(1, (now - new Date(now.getFullYear(), now.getMonth(), 1)) / DAY);
  const projection = {
    toDate: thisMonth.total,
    projected: round2((thisMonth.total / elapsed) * daysInMonth),
    lastMonth: lastMonth ? lastMonth.total : 0,
    daysElapsed: Math.floor(elapsed),
    daysInMonth,
  };

  // ---- stock, cash cycle, GMROI
  const stockValue = round2(products.reduce((s, p) => s + Math.max(p.quantity || 0, 0) * (p.avgCost || 0), 0));
  const sum = (m, f) => [...m.values()].reduce((s, r) => s + f(r), 0);
  const cogs90 = sum(sales90, (r) => r.cost);
  const sales90HT = sum(sales90, (r) => r.revenue);
  const margin12 = monthly.reduce((s, m) => s + m.margin, 0);
  const receivables = round2(open.reduce((s, i) => s + amountDue(i), 0));
  const sales90TTC = sales90HT * 1.2; // receivables are TTC
  const dso = sales90TTC > 0 ? Math.round((receivables / sales90TTC) * 90) : null;
  const dio = cogs90 > 0 ? Math.round((stockValue / cogs90) * 90) : null;
  const cashCycle = { dso, dio, days: dso !== null && dio !== null ? dso + dio : null, receivables, stockValue };
  const gmroi = stockValue > 0 ? round2(margin12 / stockValue) : null;

  // ---- ABC on the last 12 months' margin
  const abc = abcOf(sales365, names);

  // ---- stock age by last sale
  const ageBuckets = [
    { key: "active", label: "< 90 j", value: 0, count: 0 },
    { key: "slow", label: "90 j – 1 an", value: 0, count: 0 },
    { key: "dormant", label: "> 1 an", value: 0, count: 0 },
    { key: "never", label: "jamais vendu", value: 0, count: 0 },
  ];
  const dormant = [];
  for (const p of products) {
    const v = Math.max(p.quantity || 0, 0) * (p.avgCost || 0);
    if (v <= 0) continue;
    const last = lastSold.get(String(p._id));
    const age = last ? (now - last) / DAY : Infinity;
    const b = age < 90 ? ageBuckets[0] : age < 365 ? ageBuckets[1] : last ? ageBuckets[2] : ageBuckets[3];
    b.value += v;
    b.count += 1;
    if (age >= 180) dormant.push({ ...names.get(String(p._id)), _id: p._id, value: round2(v), quantity: p.quantity, lastSale: last || null });
  }
  ageBuckets.forEach((b) => { b.value = round2(b.value); b.share = stockValue ? round2((b.value / stockValue) * 100) : 0; });
  dormant.sort((a, b) => b.value - a.value);

  // ---- stockouts at the 90-day pace
  const stockouts = [];
  for (const p of products) {
    const r = sales90.get(String(p._id));
    if (!r || r.units <= 0) continue;
    const perDay = r.units / 90;
    const qty = Math.max(p.quantity || 0, 0);
    const days = qty / perDay;
    if (days <= 21) {
      stockouts.push({
        ...names.get(String(p._id)), _id: p._id, quantity: qty, perDay: round2(perDay), days: Math.floor(days),
        date: new Date(today.getTime() + Math.floor(days) * DAY), reorder: Math.ceil(perDay * 30 - qty),
      });
    }
  }
  stockouts.sort((a, b) => a.days - b.days);

  // ---- receivables aging (TTC due)
  const aging = [
    { key: "notDue", label: "non échu", amount: 0, count: 0 },
    { key: "d30", label: "1–30 j", amount: 0, count: 0 },
    { key: "d60", label: "31–60 j", amount: 0, count: 0 },
    { key: "d90", label: "61–90 j", amount: 0, count: 0 },
    { key: "d90plus", label: "> 90 j", amount: 0, count: 0 },
  ];
  for (const i of open) {
    const due = amountDue(i);
    if (due <= 0) continue;
    const late = i.dueDate ? Math.floor((today - new Date(i.dueDate)) / DAY) : 0;
    const b = late <= 0 ? aging[0] : late <= 30 ? aging[1] : late <= 60 ? aging[2] : late <= 90 ? aging[3] : aging[4];
    b.amount += due;
    b.count += 1;
  }
  aging.forEach((b) => { b.amount = round2(b.amount); });

  // ---- reps: this month vs target
  const period = periodOf(now.getFullYear(), now.getMonth() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [repSales, targets] = await Promise.all([
    SalesInvoice.aggregate([
      { $match: { company, ...scope, status: { $in: SOLD }, type: { $in: ["invoice", "credit_note"] }, date: { $gte: monthStart }, salesRep: { $ne: null } } },
      { $group: { _id: "$salesRep", ht: { $sum: { $multiply: [SIGN, "$totalHT"] } } } },
    ]),
    SalesTarget.find({ company, period, ...(repId ? { salesRep: oid(repId) } : {}) }).select("salesRep revenueTarget").lean(),
  ]);
  const repIds = [...new Set([...repSales.map((r) => String(r._id)), ...targets.map((x) => String(x.salesRep))])];
  const users = repIds.length ? await User.find({ _id: { $in: repIds.map(oid) } }).select("firstName lastName").lean() : [];
  const userName = new Map(users.map((u) => [String(u._id), `${u.firstName || ""} ${u.lastName || ""}`.trim()]));
  const reps = repIds.map((id) => {
    const ht = round2(repSales.find((r) => String(r._id) === id)?.ht || 0);
    const target = targets.find((x) => String(x.salesRep) === id)?.revenueTarget || 0;
    return { _id: id, name: userName.get(id) || "—", sales: ht, target, achievement: target ? round2((ht / target) * 100) : null, projected: round2((ht / elapsed) * daysInMonth) };
  }).sort((a, b) => b.sales - a.sales);

  // ---- family mix of the last 12 months (top families by margin)
  const catOf = new Map(products.map((p) => [String(p._id), String(p.category)]));
  const catById = new Map(categories.map((c) => [String(c._id), c]));
  const topFamily = (id) => { let c = catById.get(id); while (c && c.parent) c = catById.get(String(c.parent)) || null; return c; };
  const familyMap = new Map();
  for (const r of sales365.values()) {
    const fam = topFamily(catOf.get(String(r.product)));
    if (!fam) continue;
    const k = String(fam._id);
    const cur = familyMap.get(k) || { _id: k, name: fam.name, color: fam.color || null, revenue: 0, margin: 0 };
    cur.revenue += r.revenue;
    cur.margin += r.revenue - r.cost;
    familyMap.set(k, cur);
  }
  const families = [...familyMap.values()]
    .map((f) => ({ ...f, revenue: round2(f.revenue), margin: round2(f.margin), marginRate: f.revenue ? round2((f.margin / f.revenue) * 100) : null }))
    .sort((a, b) => b.revenue - a.revenue);

  const insights = buildInsights({ monthly, projection, cashCycle, gmroi, abc, ageBuckets, stockouts, aging, reps, families, stockValue });

  return {
    asOf: now,
    monthly,
    projection,
    cashCycle,
    gmroi,
    abc,
    stockAge: { buckets: ageBuckets, dormant: dormant.slice(0, 6) },
    stockouts: stockouts.slice(0, 8),
    stockoutCount: stockouts.length,
    aging,
    reps,
    families,
    insights,
  };
}

/**
 * Plain-language findings, most important first. Each one has a tone
 * (good / warning / critical / info), a short title, a detail sentence and
 * where to act (a route).
 */
function buildInsights({ monthly, projection, cashCycle, gmroi, abc, ageBuckets, stockouts, aging, reps, families }) {
  const out = [];
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ");
  const recent = monthly.filter((m) => m.total > 0);

  if (projection.lastMonth > 0 && projection.daysElapsed >= 7) {
    const delta = ((projection.projected - projection.lastMonth) / projection.lastMonth) * 100;
    if (Math.abs(delta) >= 5) {
      out.push({
        tone: delta > 0 ? "good" : "warning", kind: "pace",
        title: `Rythme du mois : ${delta > 0 ? "+" : ""}${delta.toFixed(0)} % vs le mois dernier`,
        detail: `À ce rythme, le mois finira vers ${fmt(projection.projected)} DH HT (mois dernier : ${fmt(projection.lastMonth)} DH).`,
        to: "/sales/invoices",
      });
    }
  }
  if (recent.length >= 4) {
    const last3 = recent.slice(-3);
    const before = recent.slice(0, -3);
    const rate = (list) => { const t = list.reduce((s, m) => s + m.total, 0); return t ? (list.reduce((s, m) => s + m.margin, 0) / t) * 100 : 0; };
    const diff = rate(last3) - rate(before);
    if (Math.abs(diff) >= 1) {
      out.push({
        tone: diff > 0 ? "good" : "warning", kind: "margin",
        title: `Taux de marge ${diff > 0 ? "en hausse" : "en baisse"} de ${Math.abs(diff).toFixed(1)} pt`,
        detail: `${rate(last3).toFixed(1)} % sur les 3 derniers mois contre ${rate(before).toFixed(1)} % avant. ${diff < 0 ? "Vérifiez les remises et les prix sous le CMUP." : "Les hausses de tarif tiennent."}`,
        to: "/sales/pricing",
      });
    }
  }
  if (stockouts.length) {
    const soon = stockouts.filter((s) => s.days <= 7).length;
    out.push({
      tone: soon ? "critical" : "warning", kind: "stockout",
      title: `${stockouts.length} article${stockouts.length > 1 ? "s" : ""} en rupture d'ici 3 semaines`,
      detail: `${soon ? `${soon} dans les 7 jours, dont ` : "Dont "}${stockouts[0].name} (${stockouts[0].days} j de stock au rythme actuel). Lancez les demandes d'achat.`,
      to: "/purchasing/requests",
    });
  }
  const sleeping = ageBuckets.filter((b) => b.key === "dormant" || b.key === "never");
  const sleepingValue = sleeping.reduce((s, b) => s + b.value, 0);
  const sleepingShare = sleeping.reduce((s, b) => s + b.share, 0);
  if (sleepingShare >= 5) {
    out.push({
      tone: sleepingShare >= 15 ? "critical" : "warning", kind: "dormant",
      title: `${sleepingShare.toFixed(0)} % du stock ne s'est pas vendu depuis un an`,
      detail: `${fmt(sleepingValue)} DH immobilisés (articles jamais vendus ou sans vente depuis 12 mois). Promotion, retour fournisseur ou transfert vers le showroom.`,
      to: "/stock/levels",
    });
  }
  const late90 = aging.find((b) => b.key === "d90plus");
  const lateAll = aging.filter((b) => b.key !== "notDue").reduce((s, b) => s + b.amount, 0);
  if (lateAll > 0) {
    out.push({
      tone: late90.amount > 0 ? "critical" : "warning", kind: "receivables",
      title: `${fmt(lateAll)} DH de factures échues`,
      detail: late90.amount > 0 ? `Dont ${fmt(late90.amount)} DH à plus de 90 jours : priorité au recouvrement.` : "Rien au-delà de 90 jours — relancez avant que ça vieillisse.",
      to: "/sales/collections",
    });
  }
  if (cashCycle.days !== null) {
    out.push({
      tone: cashCycle.days > 120 ? "warning" : "info", kind: "cashCycle",
      title: `Cycle de trésorerie : ${cashCycle.days} jours`,
      detail: `Un dirham passe ${cashCycle.dio} j en stock puis ${cashCycle.dso} j chez le client avant de revenir en caisse.`,
      to: "/stock/levels",
    });
  }
  if (abc.articlesWithMargin >= 5) {
    const a = abc.classes.A;
    out.push({
      tone: "info", kind: "abc",
      title: `${a.count} articles font 80 % de la marge`,
      detail: `Sur ${abc.articlesWithMargin} articles vendus en 12 mois. Ne les laissez jamais en rupture ; ${abc.top[0] ? `le n° 1 est ${abc.top[0].name} (${abc.top[0].share} %).` : ""}`,
      to: "/stock/articles",
    });
  }
  if (gmroi !== null) {
    out.push({
      tone: gmroi >= 1.5 ? "good" : gmroi >= 0.8 ? "info" : "warning", kind: "gmroi",
      title: `GMROI : ${gmroi.toFixed(2)} DH de marge par DH de stock`,
      detail: gmroi >= 1.5 ? "Le stock travaille bien." : "Le stock tourne lentement : réduisez les articles C et dormants.",
      to: "/stock/levels",
    });
  }
  const behind = reps.filter((r) => r.target > 0 && r.projected < r.target * 0.9);
  if (behind.length) {
    out.push({
      tone: "warning", kind: "reps",
      title: `${behind.length} ${behind.length > 1 ? "commerciaux" : "commercial"} en retard sur l'objectif`,
      detail: behind.map((r) => `${r.name} (projection ${Math.round((r.projected / r.target) * 100)} %)`).join(", "),
      to: "/sales/reps",
    });
  }
  const weakFamily = families.filter((f) => f.revenue > 0 && f.marginRate !== null).sort((a, b) => a.marginRate - b.marginRate)[0];
  if (weakFamily && families.length > 1) {
    out.push({
      tone: "info", kind: "family",
      title: `Famille la moins marginée : ${weakFamily.name} (${weakFamily.marginRate} %)`,
      detail: `${fmt(weakFamily.revenue)} DH de CA sur 12 mois. Revoir les niveaux de prix de cette famille.`,
      to: "/sales/pricing",
    });
  }
  const rank = { critical: 0, warning: 1, good: 2, info: 3 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

module.exports = { analytics, buildInsights, abcOf, articleSales };
