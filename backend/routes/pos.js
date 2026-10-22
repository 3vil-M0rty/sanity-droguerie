const express = require("express");
const CashSession = require("../models/CashSession");
const PosSale = require("../models/PosSale");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { hideMoney } = require("../middleware/hideMoney");
const { has } = require("../services/permissionService");
const { isId, bad, normalizeSalesLines, addDays } = require("../utils/salesHelpers");
const { createWithNumber } = require("../services/documentNumberService");
const { logAudit } = require("../services/auditLogger");
const { round2 } = require("../services/salesCalc");
const stock = require("../services/stockService");
const pricing = require("../services/pricingService");
const flow = require("../services/salesFlowService");
const { walkIn } = require("./customers");

/**
 * ============================================================
 * POINT OF SALE (caisse comptoir) — /api/pos
 * ============================================================
 * GET  /sessions/current?companyId=          my open session (or null)
 * GET  /sessions?companyId=&status=           (pos.sessions.viewAll: everyone's)
 * GET  /sessions/:id                          + its tickets, totals per method (Z report)
 * POST /sessions/open   { company, warehouse, register, openingFloat }
 * POST /sessions/:id/cash-move { type: in|out, amount, reason }
 * POST /sessions/:id/close  { counted: { especes, carte, cheque, virement }, notes }
 * GET  /sales?companyId=&session=&from=&to=
 * GET  /sales/:id                              (ticket, for printing)
 * POST /sales  { session, customer?, customerName?, lines, payments:[{method, amount, reference}], invoice? }
 * POST /sales/:id/refund { reason }
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.pos));
router.use(hideMoney(["unitCost", "costTotal"]));

const METHODS = ["especes", "carte", "cheque", "virement", "credit"];
const fail = (res, error, message) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
  console.error(message, error);
  return res.status(500).json({ success: false, message, error: error.message });
};

async function sessionSummary(session) {
  const sales = await PosSale.find({ session: session._id }).lean();
  const expected = Object.fromEntries(METHODS.map((m) => [m, 0]));
  let total = 0;
  let count = 0;
  for (const s of sales) {
    if (s.status !== "completed") continue;
    count += 1;
    total += s.totalTTC;
    for (const p of s.payments) expected[p.method] = round2(expected[p.method] + p.amount);
    // Change given back comes out of the cash drawer.
    expected.especes = round2(expected.especes - (s.change || 0));
  }
  const moves = (session.cashMoves || []).reduce((s, m) => s + (m.type === "in" ? m.amount : -m.amount), 0);
  expected.especes = round2(expected.especes + (session.openingFloat || 0) + moves);
  return { expected, totalTTC: round2(total), ticketCount: count, refunded: sales.filter((s) => s.status === "refunded").length };
}

// ---------------------------------------------------------------- sessions
router.get("/sessions/current", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const session = await CashSession.findOne({ company: req.query.companyId, cashier: req.user.id, status: "open" }).populate("warehouse", "code name").lean();
    if (!session) return res.json({ success: true, data: null });
    res.json({ success: true, data: { ...session, ...(await sessionSummary(session)) } });
  } catch (error) {
    fail(res, error, "Error loading the session");
  }
});

router.get("/sessions", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const filter = { company: req.query.companyId };
    if (!has(req.user, "pos.sessions.viewAll")) filter.cashier = req.user.id;
    if (req.query.status) filter.status = req.query.status;
    const sessions = await CashSession.find(filter).populate("warehouse", "code name").populate("cashier", "firstName lastName").sort({ openedAt: -1 }).limit(100).lean();
    res.json({ success: true, data: sessions });
  } catch (error) {
    fail(res, error, "Error loading sessions");
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const session = await CashSession.findById(req.params.id).populate("warehouse", "code name").populate("cashier", "firstName lastName").lean();
    if (!session) return bad(res, "Session not found", 404);
    if (String(session.cashier?._id) !== String(req.user.id) && !has(req.user, "pos.sessions.viewAll")) return bad(res, "Not your session", 403);
    const sales = await PosSale.find({ session: session._id }).populate("customer", "name").select("number date totalTTC payments status customerName change").sort({ date: -1 }).lean();
    res.json({ success: true, data: { ...session, ...(session.status === "open" ? await sessionSummary(session) : {}), sales } });
  } catch (error) {
    fail(res, error, "Error loading the session");
  }
});

router.post("/sessions/open", async (req, res) => {
  try {
    const { company, warehouse } = req.body;
    if (!isId(company)) return bad(res, "A valid company is required");
    if (await CashSession.exists({ company, cashier: req.user.id, status: "open" })) return bad(res, "You already have an open cash session — close it first");
    const wh = isId(warehouse) ? await Warehouse.findOne({ _id: warehouse, company }) : await stock.defaultWarehouse(company);
    if (!wh) return bad(res, "Warehouse not found");
    const session = await createWithNumber(CashSession, {
      company, warehouse: wh._id, register: String(req.body.register || "Caisse 1").slice(0, 40), cashier: req.user.id,
      openingFloat: Math.max(Number(req.body.openingFloat) || 0, 0), openedAt: new Date(),
    }, "CS");
    await logAudit(req, { company, action: "create", resourceType: "CashSession", resourceId: session._id, resourceLabel: `${session.number} ouverte (fond ${session.openingFloat} MAD)` });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    fail(res, error, "Error opening the session");
  }
});

router.post("/sessions/:id/cash-move", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const session = await CashSession.findById(req.params.id);
    if (!session || session.status !== "open") return bad(res, "Open session not found", 404);
    if (String(session.cashier) !== String(req.user.id) && !has(req.user, "pos.sessions.viewAll")) return bad(res, "Not your session", 403);
    const amount = round2(req.body.amount);
    if (!(amount > 0)) return bad(res, "Enter an amount");
    session.cashMoves.push({ type: req.body.type === "in" ? "in" : "out", amount, reason: String(req.body.reason || "").slice(0, 200), by: req.user.id });
    await session.save();
    res.json({ success: true, data: { ...session.toObject(), ...(await sessionSummary(session)) } });
  } catch (error) {
    fail(res, error, "Error recording the cash movement");
  }
});

router.post("/sessions/:id/close", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const session = await CashSession.findById(req.params.id);
    if (!session || session.status !== "open") return bad(res, "Open session not found", 404);
    if (String(session.cashier) !== String(req.user.id) && !has(req.user, "pos.sessions.viewAll")) return bad(res, "Not your session", 403);
    const summary = await sessionSummary(session);
    const counted = Object.fromEntries(METHODS.map((m) => [m, round2(req.body.counted?.[m] ?? (m === "credit" ? summary.expected.credit : 0))]));
    session.expected = summary.expected;
    session.counted = counted;
    session.difference = round2(counted.especes - summary.expected.especes);
    session.ticketCount = summary.ticketCount;
    session.totalTTC = summary.totalTTC;
    session.closingNotes = String(req.body.notes || "").slice(0, 1000);
    session.status = "closed";
    session.closedAt = new Date();
    await session.save();
    await logAudit(req, { company: session.company, action: "update", resourceType: "CashSession", resourceId: session._id, resourceLabel: `${session.number} clôturée — ${session.totalTTC} MAD, écart ${session.difference} MAD` });
    res.json({ success: true, data: session });
  } catch (error) {
    fail(res, error, "Error closing the session");
  }
});

// ---------------------------------------------------------------- sales
router.get("/sales", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const filter = { company: req.query.companyId };
    if (isId(req.query.session)) filter.session = req.query.session;
    if (!has(req.user, "pos.sessions.viewAll")) filter.cashier = req.user.id;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) { const to = new Date(req.query.to); to.setHours(23, 59, 59, 999); filter.date.$lte = to; }
    }
    res.json({ success: true, data: await PosSale.find(filter).populate("customer", "name").populate("cashier", "firstName lastName").select("-lines.lots").sort({ date: -1 }).limit(300).lean() });
  } catch (error) {
    fail(res, error, "Error loading tickets");
  }
});

router.get("/sales/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const sale = await PosSale.findById(req.params.id).populate("customer", "name ice phone").populate("cashier", "firstName lastName").populate("warehouse", "name address city phone").populate("invoice", "number").lean();
    if (!sale) return bad(res, "Ticket not found", 404);
    const [company, settings] = await Promise.all([Company.findById(sale.company).select("name tradeName ice taxId registrationNumber professionalTaxNumber address phone email logo").lean(), pricing.getSettings(sale.company)]);
    res.json({ success: true, data: { ...sale, company, ticketHeader: settings.ticketHeader, ticketFooter: settings.ticketFooter } });
  } catch (error) {
    fail(res, error, "Error loading the ticket");
  }
});

router.post("/sales", async (req, res) => {
  try {
    const session = isId(req.body.session) ? await CashSession.findById(req.body.session) : null;
    if (!session || session.status !== "open") return bad(res, "Open a cash session first");
    if (String(session.cashier) !== String(req.user.id)) return bad(res, "This session belongs to another cashier", 403);
    const company = session.company;
    const settings = await pricing.getSettings(company);
    const customer = isId(req.body.customer) ? await Customer.findOne({ _id: req.body.customer, company }) : await walkIn(company);
    if (!customer) return bad(res, "Customer not found");
    if (customer.blocked) return bad(res, `Le compte de ${customer.name} est bloqué`, 409);

    // Manual discounts need the permission; prices come from the customer's level.
    // Without "pos.sales.discount" the price comes from the article. A
    // line without an article ("article divers": a description and a
    // price, no stock) keeps the price the cashier typed.
    const rawLines = (req.body.lines || []).map((l) => (has(req.user, "pos.sales.discount") ? l : { ...l, discount: undefined, unitPrice: l.product ? undefined : l.unitPrice }));
    const { lines, error } = await normalizeSalesLines(await flow.priceLines(rawLines, customer, company, { channel: "pos" }), company);
    if (error) return bad(res, error);
    await flow.checkFloors(req, lines, company);
    const totals = require("../services/salesCalc").computeLineTotals(lines);

    const payments = (Array.isArray(req.body.payments) ? req.body.payments : [])
      .map((p) => ({ method: p.method, amount: round2(p.amount), reference: String(p.reference || "").slice(0, 80) }))
      .filter((p) => METHODS.includes(p.method) && p.amount > 0);
    const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
    if (paid + 0.005 < totals.totalTTC) return bad(res, `Il manque ${round2(totals.totalTTC - paid)} MAD`);
    const cash = payments.filter((p) => p.method === "especes").reduce((s, p) => s + p.amount, 0);
    const change = round2(paid - totals.totalTTC);
    if (change > cash + 0.005) return bad(res, "Only cash can give change back — adjust the card / cheque amount");
    const onAccount = payments.filter((p) => p.method === "credit").reduce((s, p) => s + p.amount, 0);
    if (onAccount > 0) {
      if (customer.type === "walk_in") return bad(res, "Choose a known customer to sell on account");
      await flow.checkCredit(req, customer, onAccount);
    }
    if (customer.type === "walk_in" && totals.totalTTC > (settings.posMaxAnonymousAmount || Infinity) && !req.body.customerName) {
      return bad(res, `Au-delà de ${settings.posMaxAnonymousAmount} MAD, indiquez le nom du client`);
    }

    // Stock check before anything moves.
    for (const l of lines) {
      if (!l.product) continue;
      // eslint-disable-next-line no-await-in-loop
      const p = await Product.findById(l.product).select("name isService").lean();
      if (p.isService) continue;
      // eslint-disable-next-line no-await-in-loop
      const avail = await require("../models/StockLevel").findOne({ product: l.product, warehouse: session.warehouse }).lean();
      if (!avail || avail.quantity + 1e-9 < l.quantity * (l.unitFactor || 1)) return bad(res, `"${p.name}" : stock insuffisant au magasin (${avail ? avail.quantity : 0})`, 409);
    }
    const sale = await createWithNumber(PosSale, {
      company, session: session._id, warehouse: session.warehouse, cashier: req.user.id,
      customer: customer._id, customerName: String(req.body.customerName || "").slice(0, 120),
      date: new Date(), lines, payments, amountTendered: cash, change,
    }, "TK");
    for (const l of sale.lines) {
      if (!l.product) continue;
      // eslint-disable-next-line no-await-in-loop
      const out = await stock.issue({ product: l.product, warehouse: session.warehouse, quantity: l.quantity * (l.unitFactor || 1), lots: l.lots, reason: `Ticket ${sale.number}`, source: { kind: "pos", id: sale._id, number: sale.number }, actorId: req.user.id, customer: customer.type === "walk_in" ? null : customer._id });
      l.unitCost = out.unitCost;
      l.lots = out.lots;
    }
    await sale.save();

    // Invoice: asked for (B2B customer at the counter) or needed to follow a sale on account.
    if (req.body.invoice || onAccount > 0) {
      const issueDate = new Date();
      const invoice = await SalesInvoice.create({
        company, type: "invoice", customer: customer._id, salesRep: customer.salesRep || null, posSale: sale._id,
        date: issueDate, dueDate: addDays(issueDate, customer.paymentDays ?? 0), subject: `Ticket ${sale.number}`,
        lines: sale.lines.map((l) => { const { _id, ...rest } = l.toObject(); return rest; }),
        moveStock: false, stockMovedAt: new Date(), status: "draft", createdBy: req.user.id, updatedBy: req.user.id,
        payments: payments.filter((p) => p.method !== "credit").map((p) => ({ date: issueDate, amount: p.method === "especes" ? round2(p.amount - change) : p.amount, method: p.method === "virement" ? "virement" : p.method, reference: p.reference || sale.number, by: req.user.id })).filter((p) => p.amount > 0),
      });
      const { nextNumber } = require("../services/documentNumberService");
      for (let attempt = 0; attempt < 5; attempt += 1) {
        invoice.number = await nextNumber(SalesInvoice, company, "FA", issueDate); // eslint-disable-line no-await-in-loop
        invoice.status = "issued";
        invoice.issuedAt = new Date();
        try { await invoice.save(); break; } catch (err) { if (err.code !== 11000 || attempt === 4) throw err; } // eslint-disable-line no-await-in-loop
      }
      sale.invoice = invoice._id;
      await sale.save();
    }
    res.status(201).json({ success: true, data: await PosSale.findById(sale._id).populate("customer", "name").populate("invoice", "number") });
  } catch (error) {
    fail(res, error, "Error recording the sale");
  }
});

router.post("/sales/:id/refund", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const sale = await PosSale.findById(req.params.id);
    if (!sale) return bad(res, "Ticket not found", 404);
    if (sale.status !== "completed") return bad(res, "Already refunded");
    if (sale.invoice) return bad(res, "This ticket was invoiced — make a credit note on the invoice");
    const session = await CashSession.findById(sale.session);
    if (!session || session.status !== "open") return bad(res, "The ticket's cash session is closed — refund through a credit note");
    for (const l of sale.lines) {
      if (!l.product) continue;
      // eslint-disable-next-line no-await-in-loop
      await stock.receive({ product: l.product, warehouse: sale.warehouse, quantity: l.quantity * (l.unitFactor || 1), unitCost: l.unitCost, lots: l.lots, reason: `Remboursement ticket ${sale.number}`, source: { kind: "pos_refund", id: sale._id, number: sale.number }, actorId: req.user.id });
    }
    sale.status = "refunded";
    sale.refundedAt = new Date();
    sale.refundReason = String(req.body.reason || "").slice(0, 300);
    await sale.save();
    await logAudit(req, { company: sale.company, action: "update", resourceType: "PosSale", resourceId: sale._id, resourceLabel: `${sale.number} remboursé (${sale.totalTTC} MAD)` });
    res.json({ success: true, data: sale });
  } catch (error) {
    fail(res, error, "Error refunding the ticket");
  }
});

module.exports = router;
