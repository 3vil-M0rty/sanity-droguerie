const express = require("express");
const mongoose = require("mongoose");
const SalesInvoice = require("../models/SalesInvoice");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const PosSale = require("../models/PosSale");
const Product = require("../models/Product");
const StockLot = require("../models/StockLot");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { hideMoney } = require("../middleware/hideMoney");
const { amountDue, round2 } = require("../services/salesCalc");
const flow = require("../services/salesFlowService");
const { analytics } = require("../services/analyticsService");

/**
 * DASHBOARD (tableau de bord négoce) — GET /api/dashboard?companyId=
 * Today / this month: sales HT (invoices + counter), margin, counter
 * tickets, orders to prepare, BLs to deliver / to invoice, low stock,
 * lots expiring, receivables and overdue. Scoped to the rep's customers
 * when they don't see every customer.
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.dashboard));
router.use(hideMoney(["marginHT", "stockValue"]));

router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(String(companyId || ""))) return res.status(400).json({ success: false, message: "companyId is required" });
    const scope = await flow.repFilter(req, companyId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const [invoices, open, pos, ordersToPrepare, toDeliver, toInvoice, lowStock, expiring, stockAgg] = await Promise.all([
      SalesInvoice.find({ company: companyId, ...scope, status: { $in: ["issued", "partially_paid", "paid"] }, date: { $gte: month } }).select("type date totalHT costTotal posSale").lean(),
      SalesInvoice.find({ company: companyId, ...scope, status: { $in: ["issued", "partially_paid"] }, type: { $ne: "credit_note" } }).select("status type totalTTC amountPaid dueDate").lean(),
      PosSale.find({ company: companyId, status: "completed", date: { $gte: month } }).select("date totalHT totalTTC costTotal invoice").lean(),
      SalesOrder.countDocuments({ company: companyId, ...scope, status: { $in: ["confirmed", "partially_delivered"] } }),
      DeliveryNote.countDocuments({ company: companyId, ...scope, type: "delivery", status: { $in: ["draft", "validated"] } }),
      DeliveryNote.countDocuments({ company: companyId, ...scope, type: "delivery", status: { $in: ["validated", "delivered"] }, invoice: null }),
      Product.countDocuments({ company: companyId, isService: { $ne: true }, isVariantParent: { $ne: true }, isActive: { $ne: false }, threshold: { $gt: 0 }, $expr: { $lte: ["$quantity", "$threshold"] } }),
      StockLot.countDocuments({ company: companyId, quantity: { $gt: 0 }, expiryDate: { $ne: null, $lte: new Date(Date.now() + 30 * 86400000) } }),
      Product.aggregate([{ $match: { company: new mongoose.Types.ObjectId(companyId), quantity: { $gt: 0 } } }, { $group: { _id: null, v: { $sum: { $multiply: ["$quantity", "$avgCost"] } } } }]),
    ]);
    const sum = (list, f) => round2(list.reduce((s, x) => s + f(x), 0));
    const sign = (i) => (i.type === "credit_note" ? -1 : 1);
    // Counter tickets turned into invoices count once (as invoices).
    const posOnly = pos.filter((p) => !p.invoice);
    const salesMonth = round2(sum(invoices, (i) => sign(i) * i.totalHT) + sum(posOnly, (p) => p.totalHT));
    const costMonth = round2(sum(invoices, (i) => sign(i) * (i.costTotal || 0)) + sum(posOnly, (p) => p.costTotal || 0));
    const isToday = (d) => new Date(d) >= today;
    const salesToday = round2(sum(invoices.filter((i) => isToday(i.date)), (i) => sign(i) * i.totalHT) + sum(posOnly.filter((p) => isToday(p.date)), (p) => p.totalHT));
    res.json({
      success: true,
      data: {
        salesToday, salesMonth, marginHT: round2(salesMonth - costMonth), marginRate: salesMonth ? round2(((salesMonth - costMonth) / salesMonth) * 100) : 0,
        counter: { ticketsToday: pos.filter((p) => isToday(p.date)).length, ttcToday: sum(pos.filter((p) => isToday(p.date)), (p) => p.totalTTC), ticketsMonth: pos.length },
        ordersToPrepare, toDeliver, toInvoice, lowStock, expiringLots: expiring,
        receivables: sum(open, amountDue),
        overdue: sum(open.filter((i) => i.dueDate && new Date(i.dueDate) < today), amountDue),
        stockValue: round2(stockAgg[0]?.v || 0),
      },
    });
  } catch (error) {
    console.error("GET dashboard error:", error);
    res.status(500).json({ success: false, message: "Error loading the dashboard", error: error.message });
  }
});

// ---------------------------------------------------------------- analytics
// Heavier aggregations (12 months, every article): computed once, then
// served from memory for 5 minutes per company and per viewer scope.
const ANALYTICS_TTL = 5 * 60 * 1000;
const analyticsCache = new Map();

router.get("/analytics", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(String(companyId || ""))) return res.status(400).json({ success: false, message: "companyId is required" });
    const scope = await flow.repFilter(req, companyId);
    const scoped = Object.keys(scope).length > 0;
    const key = `${companyId}:${scoped ? req.user.id : "all"}`;
    const hit = analyticsCache.get(key);
    if (hit && Date.now() - hit.at < ANALYTICS_TTL && req.query.fresh !== "1") return res.json({ success: true, data: hit.data, cached: true });
    const data = await analytics(companyId, scope, { repId: scoped ? req.user.id : null });
    analyticsCache.set(key, { at: Date.now(), data });
    if (analyticsCache.size > 500) analyticsCache.delete(analyticsCache.keys().next().value);
    res.json({ success: true, data });
  } catch (error) {
    console.error("GET dashboard analytics error:", error);
    res.status(500).json({ success: false, message: "Error computing the analytics", error: error.message });
  }
});

module.exports = router;
