const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const SalesInvoice = require("../models/SalesInvoice");
const PosSale = require("../models/PosSale");
const Product = require("../models/Product");
const InventoryCategory = require("../models/InventoryCategory");
const StockLevel = require("../models/StockLevel");
const Warehouse = require("../models/Warehouse");
const { has } = require("./permissionService");
const { seesAllCustomers, canSeeFinancials } = require("../permissions/permissions");
const { lineHT, amountDue, round2 } = require("./salesCalc");

/**
 * ============================================================
 * ASSISTANT DATA TOOLS — "what did Al Amal buy this quarter?"
 * ============================================================
 * Read-only tools Claude may call to answer with the company's own
 * figures. Security, in three layers:
 *   1. a tool is OFFERED only if the user holds one of its permissions;
 *   2. every call RE-CHECKS that permission (never trust the model);
 *   3. data is scoped like the screens: a rep without
 *      sales.customers.viewAll only sees their own customers; amounts
 *      (revenue, cost, margin) need finance.amounts.view — without it
 *      the tools answer in quantities only.
 * The company comes from the request (tenant-isolated queries); the
 * model never chooses which company it reads.
 * Results are compact JSON (≤ 25 rows) to keep the context small.
 * ============================================================
 */
const SOLD = ["issued", "partially_paid", "paid"];
const MAX_ROWS = 25;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const anyOf = (user, keys) => keys.some((k) => { try { return has(user, k); } catch { return false; } });

function period(input, fallbackDays = 90, now = new Date()) {
  const to = input?.to ? new Date(input.to) : now;
  const from = input?.from ? new Date(input.from) : new Date(to.getTime() - fallbackDays * 86400000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw toolError("Dates invalides : utilise le format AAAA-MM-JJ.");
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);
  if (to - from > 3 * 366 * 86400000) throw toolError("Période trop longue (3 ans au plus).");
  return { from, to };
}
const toolError = (message) => Object.assign(new Error(message), { toolError: true });
const ymd = (d) => new Date(d).toISOString().slice(0, 10);

/** Customers this user may see, matching a name / code / id. */
async function findCustomers(ctx, query, limit = 8) {
  const filter = { company: ctx.companyId };
  if (!seesAllCustomers(ctx.user)) filter.salesRep = ctx.user.id;
  const q = String(query || "").trim();
  if (mongoose.Types.ObjectId.isValid(q)) filter._id = q;
  else if (q) {
    const words = q.split(/\s+/).filter((w) => w.length > 1).map(esc);
    filter.$and = words.map((w) => ({ $or: [{ name: new RegExp(w, "i") }, { code: new RegExp(`^${w}`, "i") }] }));
  }
  return Customer.find(filter).select("name code type city priceLevel salesRep creditLimit blocked").limit(limit).lean();
}

async function oneCustomer(ctx, query) {
  const list = await findCustomers(ctx, query, 6);
  if (!list.length) throw toolError(`Aucun client accessible ne correspond à « ${query} ».`);
  if (list.length > 1) {
    const exact = list.find((c) => c.name.toLowerCase() === String(query).trim().toLowerCase() || c.code === String(query).trim().toUpperCase());
    if (exact) return exact;
    return { ambiguous: list.map((c) => ({ id: String(c._id), name: c.name, code: c.code, city: c.city })) };
  }
  return list[0];
}

/** Lines sold in a period → per product { units, revenue, cost }. Credit notes deducted. */
async function salesLines(ctx, { from, to, customer = null, withCounter = true }) {
  const match = { company: oid(ctx.companyId), status: { $in: SOLD }, type: { $in: ["invoice", "credit_note"] }, date: { $gte: from, $lte: to } };
  if (customer) match.customer = oid(customer);
  else if (!seesAllCustomers(ctx.user)) match.salesRep = oid(ctx.user.id);
  const invoices = await SalesInvoice.find(match).select("type date customer salesRep lines").lean();
  const tickets = withCounter && !customer && seesAllCustomers(ctx.user)
    ? await PosSale.find({ company: ctx.companyId, status: "completed", invoice: null, date: { $gte: from, $lte: to } }).select("date lines").lean()
    : [];
  const docs = [...invoices.map((d) => ({ ...d, sign: d.type === "credit_note" ? -1 : 1 })), ...tickets.map((d) => ({ ...d, sign: 1, counter: true }))];
  return docs;
}

function byProduct(docs) {
  const map = new Map();
  for (const d of docs) {
    for (const l of d.lines || []) {
      const k = l.product ? String(l.product) : `txt:${l.description}`;
      const cur = map.get(k) || { product: l.product || null, description: l.description, units: 0, revenue: 0, cost: 0 };
      const units = (Number(l.quantity) || 0) * (Number(l.unitFactor) || 1);
      cur.units += d.sign * units;
      cur.revenue += d.sign * lineHT(l);
      cur.cost += d.sign * (Number(l.unitCost) || 0) * units;
      map.set(k, cur);
    }
  }
  return map;
}

async function names(ids) {
  const list = await Product.find({ _id: { $in: ids.filter(Boolean) } }).select("name internalReference unit category").lean();
  return new Map(list.map((p) => [String(p._id), p]));
}

const money = (ctx, obj) => (ctx.money ? obj : Object.fromEntries(Object.entries(obj).filter(([k]) => !["revenue", "cost", "margin", "marginRate", "amount", "value", "balance", "overdue", "notDue", "avgCost", "creditLimit", "ticket"].includes(k))));

// ---------------------------------------------------------------- tools
const TOOLS = [
  {
    name: "find_customers",
    permissions: ["sales.customers.view"],
    label: "Recherche de clients",
    description: "Cherche des clients par nom, code (CL-0012) ou ville. À utiliser quand le nom donné est approximatif ou pour obtenir l'identifiant d'un client avant un autre outil.",
    input_schema: { type: "object", properties: { query: { type: "string", description: "Nom, partie du nom ou code client" } }, required: ["query"], additionalProperties: false },
    async run(ctx, input) {
      const list = await findCustomers(ctx, input.query, 10);
      return { customers: list.map((c) => money(ctx, { id: String(c._id), name: c.name, code: c.code, type: c.type, city: c.city, priceLevel: c.priceLevel, creditLimit: c.creditLimit, blocked: !!c.blocked })) };
    },
  },
  {
    name: "customer_purchases",
    permissions: ["sales.invoices.view", "sales.customers.view"],
    label: "Achats d'un client",
    description: "Ce qu'un client a acheté sur une période (factures moins avoirs) : total HT, nombre de factures, articles et familles les plus achetés, et comparaison avec la période précédente de même durée. Pour « qu'a acheté Al Amal ce trimestre ? ».",
    input_schema: {
      type: "object",
      properties: {
        customer: { type: "string", description: "Nom, code ou identifiant du client" },
        from: { type: "string", description: "Début, AAAA-MM-JJ (inclus)" },
        to: { type: "string", description: "Fin, AAAA-MM-JJ (incluse)" },
      },
      required: ["customer"],
      additionalProperties: false,
    },
    async run(ctx, input) {
      const c = await oneCustomer(ctx, input.customer);
      if (c.ambiguous) return { ambiguous: true, message: "Plusieurs clients correspondent : demande lequel.", candidates: c.ambiguous };
      const { from, to } = period(input, 90, ctx.now);
      const span = to - from;
      const prev = { from: new Date(from.getTime() - span - 1), to: new Date(from.getTime() - 1) };
      const [docs, prevDocs] = await Promise.all([salesLines(ctx, { from, to, customer: c._id }), salesLines(ctx, { ...prev, customer: c._id })]);
      const items = byProduct(docs);
      const prevItems = byProduct(prevDocs);
      const meta = await names([...items.values()].map((x) => x.product));
      const cats = new Map((await InventoryCategory.find({ company: ctx.companyId }).select("name").lean()).map((x) => [String(x._id), x.name]));
      const families = new Map();
      for (const it of items.values()) {
        const fam = cats.get(String(meta.get(String(it.product))?.category || "")) || "Sans famille";
        const f = families.get(fam) || { family: fam, revenue: 0, units: 0 };
        f.revenue += it.revenue;
        f.units += it.units;
        families.set(fam, f);
      }
      const total = [...items.values()].reduce((s, x) => s + x.revenue, 0);
      const prevTotal = [...prevItems.values()].reduce((s, x) => s + x.revenue, 0);
      const invoices = docs.filter((d) => d.sign > 0).length;
      const top = [...items.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 15);
      return {
        customer: { name: c.name, code: c.code, type: c.type, city: c.city },
        period: { from: ymd(from), to: ymd(to) },
        ...money(ctx, { revenue: round2(total) }),
        invoices, creditNotes: docs.filter((d) => d.sign < 0).length,
        previousPeriod: { from: ymd(prev.from), to: ymd(prev.to), ...money(ctx, { revenue: round2(prevTotal) }), changePercent: prevTotal ? round2(((total - prevTotal) / Math.abs(prevTotal)) * 100) : null },
        topArticles: top.map((x) => {
          const p = meta.get(String(x.product));
          const before = prevItems.get(x.product ? String(x.product) : `txt:${x.description}`);
          return money(ctx, { article: p?.name || x.description, reference: p?.internalReference || "", units: round2(x.units), unit: p?.unit || "", revenue: round2(x.revenue), unitsPreviousPeriod: round2(before?.units || 0) });
        }),
        families: [...families.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((f) => money(ctx, { family: f.family, revenue: round2(f.revenue), units: round2(f.units) })),
        articlesNotBoughtAnyMore: [...prevItems.values()].filter((x) => !items.has(x.product ? String(x.product) : `txt:${x.description}`) && x.units > 0).slice(0, 8).map((x) => x.description),
      };
    },
  },
  {
    name: "article_trends",
    permissions: ["sales.reports.view", "inventory.articles.view"],
    label: "Tendance des articles",
    description: "Articles dont les ventes baissent ou montent : compare les quantités vendues sur les N derniers jours à la période précédente de même durée. Pour « quels articles sont en baisse ? ». Peut se limiter à une famille ou à un client.",
    input_schema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["falling", "rising"], description: "falling = en baisse, rising = en hausse" },
        days: { type: "integer", minimum: 14, maximum: 365, description: "Durée de chaque période en jours (90 par défaut)" },
        family: { type: "string", description: "Nom de famille (optionnel)" },
        customer: { type: "string", description: "Client (optionnel)" },
        limit: { type: "integer", minimum: 1, maximum: 25 },
      },
      required: ["direction"],
      additionalProperties: false,
    },
    async run(ctx, input) {
      const days = Math.min(Math.max(Number(input.days) || 90, 14), 365);
      const to = ctx.now;
      const from = new Date(to.getTime() - days * 86400000);
      const prevFrom = new Date(from.getTime() - days * 86400000);
      let customer = null;
      if (input.customer) {
        const c = await oneCustomer(ctx, input.customer);
        if (c.ambiguous) return { ambiguous: true, candidates: c.ambiguous };
        customer = c._id;
      }
      const [now, before] = await Promise.all([salesLines(ctx, { from, to, customer }), salesLines(ctx, { from: prevFrom, to: from, customer })]);
      const a = byProduct(now);
      const b = byProduct(before);
      const keys = new Set([...a.keys(), ...b.keys()].filter((k) => !k.startsWith("txt:")));
      const meta = await names([...keys]);
      let famIds = null;
      if (input.family) {
        const fams = await InventoryCategory.find({ company: ctx.companyId, name: new RegExp(esc(input.family), "i") }).select("_id").lean();
        famIds = new Set(fams.map((f) => String(f._id)));
        const children = await InventoryCategory.find({ company: ctx.companyId, parent: { $in: [...famIds].map(oid) } }).select("_id").lean();
        children.forEach((c) => famIds.add(String(c._id)));
      }
      const rows = [];
      for (const k of keys) {
        const p = meta.get(k);
        if (!p || (famIds && !famIds.has(String(p.category)))) continue;
        const cur = a.get(k)?.units || 0;
        const prev = b.get(k)?.units || 0;
        if (prev <= 0 && cur <= 0) continue;
        const change = prev > 0 ? ((cur - prev) / prev) * 100 : null;
        rows.push(money(ctx, { article: p.name, reference: p.internalReference, unit: p.unit, unitsNow: round2(cur), unitsBefore: round2(prev), changePercent: change === null ? null : round2(change), revenue: round2(a.get(k)?.revenue || 0) }));
      }
      const dir = input.direction === "rising" ? -1 : 1;
      rows.sort((x, y) => dir * ((x.unitsNow - x.unitsBefore) - (y.unitsNow - y.unitsBefore)));
      const filtered = rows.filter((r) => (input.direction === "rising" ? r.unitsNow > r.unitsBefore : r.unitsNow < r.unitsBefore));
      return { periodDays: days, current: { from: ymd(from), to: ymd(to) }, previous: { from: ymd(prevFrom), to: ymd(from) }, scope: seesAllCustomers(ctx.user) ? "toute l'entreprise" : "vos clients seulement", articles: filtered.slice(0, Math.min(Number(input.limit) || 15, MAX_ROWS)), totalMatching: filtered.length };
    },
  },
  {
    name: "stock_status",
    permissions: ["inventory.articles.view"],
    label: "État du stock",
    description: "Stock d'articles (par dépôt), articles sous le minimum, valeur du stock. Pour « combien de Grohe en stock ? » ou « qu'est-ce qui est sous le minimum ? ».",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Nom ou référence d'article (optionnel)" },
        belowMinimum: { type: "boolean", description: "Seulement les articles sous leur stock minimum" },
        warehouse: { type: "string", description: "Code ou nom de dépôt (optionnel)" },
      },
      additionalProperties: false,
    },
    async run(ctx, input) {
      const filter = { company: ctx.companyId, isService: { $ne: true }, isVariantParent: { $ne: true } };
      if (input.query) {
        const words = String(input.query).split(/\s+/).filter(Boolean).map(esc);
        filter.$and = words.map((w) => ({ $or: [{ name: new RegExp(w, "i") }, { internalReference: new RegExp(w, "i") }, { barcode: w }] }));
      }
      let list = await Product.find(filter).select("name internalReference unit quantity threshold avgCost").limit(input.belowMinimum ? 2000 : 40).lean();
      if (input.belowMinimum) list = list.filter((p) => (p.threshold || 0) > 0 && (p.quantity || 0) <= p.threshold);
      list = list.slice(0, MAX_ROWS);
      const whs = await Warehouse.find({ company: ctx.companyId }).select("code name").lean();
      const wh = input.warehouse ? whs.find((w) => w.code?.toLowerCase() === String(input.warehouse).toLowerCase() || w.name.toLowerCase().includes(String(input.warehouse).toLowerCase())) : null;
      if (input.warehouse && !wh) throw toolError(`Dépôt « ${input.warehouse} » inconnu. Dépôts : ${whs.map((w) => w.code || w.name).join(", ")}.`);
      const levels = await StockLevel.find({ company: ctx.companyId, product: { $in: list.map((p) => p._id) }, ...(wh ? { warehouse: wh._id } : {}) }).select("product warehouse quantity reserved").lean();
      const whName = new Map(whs.map((w) => [String(w._id), w.code || w.name]));
      return {
        articles: list.map((p) => money(ctx, {
          article: p.name, reference: p.internalReference, unit: p.unit, total: round2(p.quantity || 0), minimum: p.threshold || 0,
          belowMinimum: (p.threshold || 0) > 0 && (p.quantity || 0) <= p.threshold,
          byWarehouse: levels.filter((l) => String(l.product) === String(p._id)).map((l) => ({ warehouse: whName.get(String(l.warehouse)), quantity: round2(l.quantity), reserved: round2(l.reserved || 0) })),
          value: round2(Math.max(p.quantity || 0, 0) * (p.avgCost || 0)),
        })),
      };
    },
  },
  {
    name: "customer_balances",
    permissions: ["sales.invoices.view", "sales.collections.view"],
    label: "Soldes clients",
    description: "Ce que doivent les clients : solde, montant échu, retard le plus ancien, par client (un client précis ou les plus gros débiteurs).",
    input_schema: { type: "object", properties: { customer: { type: "string", description: "Client (optionnel ; sinon les plus gros soldes)" }, overdueOnly: { type: "boolean" } }, additionalProperties: false },
    async run(ctx, input) {
      if (!ctx.money) throw toolError("Cet utilisateur ne voit pas les montants : impossible de donner les soldes.");
      const match = { company: ctx.companyId, type: { $ne: "credit_note" }, status: { $in: ["issued", "partially_paid"] } };
      if (input.customer) {
        const c = await oneCustomer(ctx, input.customer);
        if (c.ambiguous) return { ambiguous: true, candidates: c.ambiguous };
        match.customer = c._id;
      } else if (!seesAllCustomers(ctx.user)) {
        match.customer = { $in: (await Customer.find({ company: ctx.companyId, salesRep: ctx.user.id }).select("_id").lean()).map((c) => c._id) };
      }
      const invoices = await SalesInvoice.find(match).select("number customer dueDate totalTTC amountPaid status type").populate("customer", "name code").lean();
      const by = new Map();
      for (const inv of invoices) {
        const due = amountDue(inv);
        if (!due) continue;
        const k = String(inv.customer?._id);
        const row = by.get(k) || { customer: inv.customer?.name, code: inv.customer?.code, balance: 0, overdue: 0, invoices: 0, oldestDaysLate: 0 };
        const late = inv.dueDate ? Math.floor((ctx.now - new Date(inv.dueDate)) / 86400000) : 0;
        row.balance += due;
        if (late > 0) { row.overdue += due; row.oldestDaysLate = Math.max(row.oldestDaysLate, late); }
        row.invoices += 1;
        by.set(k, row);
      }
      let rows = [...by.values()].map((r) => ({ ...r, balance: round2(r.balance), overdue: round2(r.overdue) }));
      if (input.overdueOnly) rows = rows.filter((r) => r.overdue > 0);
      rows.sort((a, b) => b.balance - a.balance);
      return { currency: "MAD TTC", customers: rows.slice(0, MAX_ROWS), total: round2(rows.reduce((s, r) => s + r.balance, 0)), totalOverdue: round2(rows.reduce((s, r) => s + r.overdue, 0)) };
    },
  },
  {
    name: "sales_summary",
    permissions: ["sales.reports.view", "sales.invoices.view"],
    label: "Synthèse des ventes",
    description: "Chiffre d'affaires HT (et marge si autorisé) sur une période, ventilé par mois, par client, par famille ou par commercial. Pour « combien a-t-on vendu en septembre ? », « meilleurs clients du trimestre ».",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string", description: "AAAA-MM-JJ" },
        to: { type: "string", description: "AAAA-MM-JJ" },
        groupBy: { type: "string", enum: ["month", "customer", "family", "rep", "article"] },
        limit: { type: "integer", minimum: 1, maximum: 25 },
      },
      required: ["groupBy"],
      additionalProperties: false,
    },
    async run(ctx, input) {
      const { from, to } = period(input, 90, ctx.now);
      const docs = await salesLines(ctx, { from, to });
      const groups = new Map();
      let custNames = new Map();
      let repNames = new Map();
      const meta = input.groupBy === "family" || input.groupBy === "article" ? await names([...new Set(docs.flatMap((d) => (d.lines || []).map((l) => l.product && String(l.product))).filter(Boolean))]) : new Map();
      const cats = input.groupBy === "family" ? new Map((await InventoryCategory.find({ company: ctx.companyId }).select("name").lean()).map((x) => [String(x._id), x.name])) : new Map();
      if (input.groupBy === "customer") custNames = new Map((await Customer.find({ _id: { $in: [...new Set(docs.map((d) => String(d.customer || "")).filter(Boolean))] } }).select("name").lean()).map((c) => [String(c._id), c.name]));
      if (input.groupBy === "rep") {
        const User = require("../models/User");
        repNames = new Map((await User.find({ _id: { $in: [...new Set(docs.map((d) => String(d.salesRep || "")).filter(Boolean))] } }).select("firstName lastName").lean()).map((u) => [String(u._id), `${u.firstName} ${u.lastName}`]));
      }
      for (const d of docs) {
        for (const l of d.lines || []) {
          let key;
          if (input.groupBy === "month") key = new Date(d.date).toISOString().slice(0, 7);
          else if (input.groupBy === "customer") key = d.counter ? "Comptoir (tickets)" : custNames.get(String(d.customer)) || "—";
          else if (input.groupBy === "rep") key = d.counter ? "Comptoir" : repNames.get(String(d.salesRep)) || "Sans commercial";
          else if (input.groupBy === "family") key = cats.get(String(meta.get(String(l.product))?.category || "")) || "Sans famille";
          else key = meta.get(String(l.product))?.name || l.description;
          const g = groups.get(key) || { key, revenue: 0, cost: 0, units: 0 };
          const units = (Number(l.quantity) || 0) * (Number(l.unitFactor) || 1);
          g.revenue += d.sign * lineHT(l);
          g.cost += d.sign * (Number(l.unitCost) || 0) * units;
          g.units += d.sign * units;
          groups.set(key, g);
        }
      }
      let rows = [...groups.values()].map((g) => money(ctx, { [input.groupBy]: g.key, revenue: round2(g.revenue), margin: round2(g.revenue - g.cost), marginRate: g.revenue ? round2(((g.revenue - g.cost) / g.revenue) * 100) : null, units: round2(g.units) }));
      rows = input.groupBy === "month" ? rows.sort((a, b) => String(a.month).localeCompare(String(b.month))) : rows.sort((a, b) => (b.revenue ?? b.units) - (a.revenue ?? a.units)).slice(0, Math.min(Number(input.limit) || 15, MAX_ROWS));
      const revenue = [...groups.values()].reduce((s, g) => s + g.revenue, 0);
      const cost = [...groups.values()].reduce((s, g) => s + g.cost, 0);
      return {
        period: { from: ymd(from), to: ymd(to) }, scope: seesAllCustomers(ctx.user) ? "toute l'entreprise (comptoir inclus)" : "vos clients seulement",
        ...money(ctx, { revenue: round2(revenue), margin: round2(revenue - cost) }), currency: "MAD HT", rows,
      };
    },
  },
  {
    name: "stockout_forecast",
    permissions: ["purchasing.reports.view", "purchasing.orders.create", "inventory.articles.view"],
    label: "Prévision de rupture",
    description: "Articles qui vont manquer avant qu'une livraison puisse arriver (rythme des ventes sur 90 jours, stock, commandes en cours, délai fournisseur) avec la quantité conseillée et le fournisseur le moins cher.",
    input_schema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 25 } }, additionalProperties: false },
    async run(ctx, input) {
      const { rows } = await require("./replenishmentService").forecast(ctx.companyId, { now: ctx.now });
      return { articles: rows.slice(0, Math.min(Number(input.limit) || 15, MAX_ROWS)).map((r) => money(ctx, { article: r.product.name, reference: r.product.internalReference, onHand: r.onHand, incoming: r.incoming, perDay: r.perDay, daysLeft: r.daysLeft, leadTimeDays: r.leadTimeDays, suggestedQuantity: r.quantity, supplier: r.supplier?.name || null, amount: r.amount })), total: rows.length, where: "Achats › Prévision (bouton « Créer les bons de commande »)" };
    },
  },
];

/** Tool definitions offered to this user (only those they hold a permission for). */
function toolsFor(user) {
  return TOOLS.filter((t) => anyOf(user, t.permissions)).map(({ name, description, input_schema }) => ({ name, description, input_schema }));
}

/** Runs one tool call; never throws — errors go back to the model as a tool error. */
async function runTool(name, input, ctx) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { content: `Outil inconnu : ${name}`, isError: true };
  if (!anyOf(ctx.user, tool.permissions)) return { content: "Accès refusé : cet utilisateur n'a pas le droit de consulter ces données.", isError: true };
  try {
    const out = await tool.run({ ...ctx, money: canSeeFinancials(ctx.user) }, input || {});
    let text = JSON.stringify(out);
    if (text.length > 20000) text = `${text.slice(0, 20000)}…(tronqué)`;
    return { content: text, isError: false };
  } catch (err) {
    if (err.toolError) return { content: err.message, isError: true };
    console.error(`assistant tool ${name} failed:`, err);
    return { content: "Erreur en lisant les données.", isError: true };
  }
}

const labelOf = (name) => TOOLS.find((t) => t.name === name)?.label || name;

module.exports = { TOOLS, toolsFor, runTool, labelOf, findCustomers };
