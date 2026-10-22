const express = require("express");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad, normalizeSalesLines, validationMessage } = require("../utils/salesHelpers");
const { createWithNumber } = require("../services/documentNumberService");
const { generateOrderPdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");
const { logAudit } = require("../services/auditLogger");
const notifications = require("../services/businessNotifications");
const stock = require("../services/stockService");
const flow = require("../services/salesFlowService");

/**
 * ============================================================
 * SALES ORDERS (commandes clients, CC-…) — /api/sales-orders
 * ============================================================
 * GET    /?companyId=&status=&customer=&search=&toDeliver=true&page=
 * GET    /:id                    + its BLs, availability per line
 * POST   /                       { company, customer, warehouse?, lines, deliveryMode, … , confirm? }
 * PUT    /:id                    drafts (and confirmed: re-reserves)
 * DELETE /:id                    drafts only
 * POST   /:id/confirm            { override? }  credit check + stock reserved
 * POST   /:id/cancel             { reason }     releases the reservation
 * POST   /:id/deliver            { lines?:[{lineId, quantity, lots}], warehouse?, validate? } → BL (draft or validated)
 * GET    /:id/pdf
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.salesOrders));

const POPULATE = [
  { path: "customer", select: "name code phone address deliveryAddress city creditLimit priceLevel salesRep type documentFlow" },
  { path: "warehouse", select: "code name" },
  { path: "salesRep", select: "firstName lastName" },
  { path: "quote", select: "number" },
  { path: "lines.product", select: "name internalReference unit packagings tracking quantity" },
];

const fail = (res, error, message) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code, exposure: error.exposure, issues: error.issues });
  console.error(message, error);
  return res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: validationMessage(error, message) });
};

async function warehouseOf(order) {
  return order.warehouse || (await stock.defaultWarehouse(order.company))._id;
}

async function reserveAll(order, sign) {
  const wh = await warehouseOf(order);
  for (const l of order.lines) {
    if (!l.product) continue;
    const left = Math.max(l.quantity - (l.deliveredQuantity || 0), 0) * (l.unitFactor || 1);
    if (left <= 0) continue;
    // eslint-disable-next-line no-await-in-loop
    if (sign > 0) await stock.reserve({ product: l.product, warehouse: wh, quantity: left });
    else await stock.release({ product: l.product, warehouse: wh, quantity: left }); // eslint-disable-line no-await-in-loop
  }
}

router.get("/", async (req, res) => {
  try {
    const { companyId, status, customer, search, toDeliver } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = { company: companyId, ...(await flow.repFilter(req, companyId)) };
    if (status) filter.status = status;
    if (toDeliver === "true") filter.status = { $in: ["confirmed", "partially_delivered"] };
    if (isId(customer)) filter.customer = filter.customer ? { $in: filter.customer.$in.filter((c) => String(c) === String(customer)) } : customer;
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const customers = await Customer.find({ company: companyId, name: rx }).select("_id").lean();
      filter.$or = [{ number: rx }, { customerReference: rx }, { customer: { $in: customers.map((c) => c._id) } }];
    }
    const [orders, total] = await Promise.all([
      SalesOrder.find(filter).populate("customer", "name code").populate("salesRep", "firstName lastName").populate("warehouse", "code")
        .sort({ date: -1, number: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      SalesOrder.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders.map((o) => ({ ...o, progress: o.lines.reduce((s, l) => s + Math.min(l.deliveredQuantity || 0, l.quantity), 0) / (o.lines.reduce((s, l) => s + l.quantity, 0) || 1) })), pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 } });
  } catch (error) {
    fail(res, error, "Error loading orders");
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id).populate(POPULATE);
    if (!order) return bad(res, "Order not found", 404);
    if (!flow.canSeeCustomer(req, order.customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const wh = order.warehouse?._id || (await stock.defaultWarehouse(order.company))._id;
    const notes = await DeliveryNote.find({ salesOrder: order._id }).select("number type status date totalTTC invoice").sort({ createdAt: 1 }).lean();
    const availability = {};
    for (const l of order.lines) {
      // eslint-disable-next-line no-await-in-loop
      if (l.product) availability[String(l._id)] = await stock.available(l.product._id, wh);
    }
    res.json({ success: true, data: { ...order.toObject(), deliveryNotes: notes, availability } });
  } catch (error) {
    fail(res, error, "Error loading the order");
  }
});

async function buildLines(req, customer, companyId) {
  const { lines, error } = await normalizeSalesLines(await flow.priceLines(req.body.lines || [], customer, companyId), companyId);
  if (error) throw flow.httpError(error);
  await flow.checkFloors(req, lines, companyId);
  return lines.map((l) => ({ ...l, deliveredQuantity: 0 }));
}

async function confirm(req, order) {
  if (order.status !== "draft") throw flow.httpError("Only a draft order can be confirmed");
  const customer = await Customer.findById(order.customer);
  const check = await flow.checkCredit(req, customer, order.totalTTC, { override: !!req.body?.override });
  if (check?.overridden) order.creditOverride = { by: req.user.id, at: new Date(), reason: String(req.body.overrideReason || "").slice(0, 300) };
  order.status = "confirmed";
  order.confirmedAt = new Date();
  await order.save();
  await reserveAll(order, +1);
  await notifications.onOrderConfirmed(order, req.user.id);
}

router.post("/", async (req, res) => {
  try {
    const { company } = req.body;
    if (!isId(company) || !(await Company.exists({ _id: company }))) return bad(res, "A valid company is required");
    const customer = isId(req.body.customer) ? await Customer.findOne({ _id: req.body.customer, company }) : null;
    if (!customer) return bad(res, "Choose a customer");
    if (!flow.canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const lines = await buildLines(req, customer, company);
    const order = await createWithNumber(SalesOrder, {
      company,
      customer: customer._id,
      salesRep: customer.salesRep || req.user.id,
      warehouse: isId(req.body.warehouse) ? req.body.warehouse : customer.defaultWarehouse || null,
      priceLevel: customer.priceLevel,
      source: ["office", "rep", "phone", "online"].includes(req.body.source) ? req.body.source : "office",
      customerReference: req.body.customerReference,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      expectedDate: req.body.expectedDate || null,
      deliveryMode: req.body.deliveryMode === "pickup" ? "pickup" : "delivery",
      deliveryAddress: req.body.deliveryAddress || customer.deliveryAddress || customer.address,
      lines,
      paymentTerms: req.body.paymentTerms,
      notes: req.body.notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }, "CC");
    if (req.body.confirm) {
      try {
        await confirm(req, order);
      } catch (err) {
        // The order is kept as a draft; tell why it couldn't be confirmed.
        return res.status(201).json({ success: true, data: await SalesOrder.findById(order._id).populate(POPULATE), warning: err.message, code: err.code });
      }
    }
    await logAudit(req, { company, action: "create", resourceType: "SalesOrder", resourceId: order._id, resourceLabel: `${order.number} — ${customer.name}` });
    res.status(201).json({ success: true, data: await SalesOrder.findById(order._id).populate(POPULATE) });
  } catch (error) {
    fail(res, error, "Error creating the order");
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return bad(res, "Order not found", 404);
    if (!["draft", "confirmed"].includes(order.status)) return bad(res, "Only a draft or confirmed (not yet delivered) order can be edited");
    const customer = await Customer.findById(order.customer);
    if (!flow.canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const wasConfirmed = order.status === "confirmed";
    if (wasConfirmed) await reserveAll(order, -1);
    try {
      if (req.body.lines !== undefined) order.lines = await buildLines(req, customer, order.company);
      for (const f of ["customerReference", "paymentTerms", "notes", "deliveryAddress", "expectedDate"]) if (req.body[f] !== undefined) order[f] = req.body[f];
      if (req.body.deliveryMode !== undefined) order.deliveryMode = req.body.deliveryMode === "pickup" ? "pickup" : "delivery";
      if (req.body.warehouse !== undefined) order.warehouse = isId(req.body.warehouse) ? req.body.warehouse : null;
      order.updatedBy = req.user.id;
      await order.save();
    } finally {
      if (wasConfirmed) await reserveAll(await SalesOrder.findById(order._id), +1);
    }
    res.json({ success: true, data: await SalesOrder.findById(order._id).populate(POPULATE) });
  } catch (error) {
    fail(res, error, "Error updating the order");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return bad(res, "Order not found", 404);
    if (order.status !== "draft") return bad(res, "Only a draft can be deleted — cancel the order instead");
    await order.deleteOne();
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Error deleting the order");
  }
});

router.post("/:id/confirm", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return bad(res, "Order not found", 404);
    await confirm(req, order);
    await logAudit(req, { company: order.company, action: "update", resourceType: "SalesOrder", resourceId: order._id, resourceLabel: `${order.number} confirmée` });
    res.json({ success: true, data: await SalesOrder.findById(order._id).populate(POPULATE) });
  } catch (error) {
    fail(res, error, "Error confirming the order");
  }
});

router.post("/:id/cancel", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id);
    if (!order) return bad(res, "Order not found", 404);
    if (["delivered", "invoiced", "cancelled"].includes(order.status)) return bad(res, "This order can no longer be cancelled");
    if (await DeliveryNote.exists({ salesOrder: order._id, status: "draft" })) return bad(res, "Delete or cancel its draft delivery notes first");
    if (["confirmed", "partially_delivered"].includes(order.status)) await reserveAll(order, -1);
    order.status = "cancelled";
    order.cancelReason = String(req.body.reason || "").slice(0, 500);
    order.updatedBy = req.user.id;
    await order.save();
    await logAudit(req, { company: order.company, action: "update", resourceType: "SalesOrder", resourceId: order._id, resourceLabel: `${order.number} annulée` });
    res.json({ success: true, data: await SalesOrder.findById(order._id).populate(POPULATE) });
  } catch (error) {
    fail(res, error, "Error cancelling the order");
  }
});

/** Creates a BL for what's left (or the given quantities). validate: true → stock leaves now. */
router.post("/:id/deliver", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id).populate("customer");
    if (!order) return bad(res, "Order not found", 404);
    if (!["confirmed", "partially_delivered"].includes(order.status)) return bad(res, "Confirm the order first");
    let lines = flow.remainingLines(order);
    if (Array.isArray(req.body.lines)) {
      const wanted = new Map(req.body.lines.map((l) => [String(l.lineId), l]));
      lines = lines.map((l) => {
        const w = wanted.get(String(l.orderLine));
        if (!w) return null;
        const q = Number(w.quantity);
        if (!(q > 0)) return null;
        if (q > l.quantity + 1e-9) throw flow.httpError(`${l.description}: only ${l.quantity} left to deliver`);
        return { ...l, quantity: q, lots: Array.isArray(w.lots) ? w.lots : [] };
      }).filter(Boolean);
    }
    if (!lines.length) return bad(res, "Nothing left to deliver");
    const customer = order.customer;
    const note = await createWithNumber(DeliveryNote, {
      company: order.company,
      type: "delivery",
      customer: customer._id,
      salesOrder: order._id,
      salesRep: order.salesRep,
      warehouse: isId(req.body.warehouse) ? req.body.warehouse : await warehouseOf(order),
      date: req.body.date ? new Date(req.body.date) : new Date(),
      deliveryMode: order.deliveryMode,
      address: order.deliveryAddress || customer.deliveryAddress || customer.address,
      contactPhone: customer.phone,
      lines,
      notes: req.body.notes,
      history: [{ status: "draft", by: req.user.id }],
      createdBy: req.user.id,
      updatedBy: req.user.id,
    }, "BL");
    if (req.body.validate) await flow.validateNote(note, req.user.id);
    res.status(201).json({ success: true, data: await DeliveryNote.findById(note._id).populate("customer", "name").populate("warehouse", "code name") });
  } catch (error) {
    fail(res, error, "Error creating the delivery note");
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid order ID");
    const order = await SalesOrder.findById(req.params.id).populate("customer");
    if (!order) return bad(res, "Order not found", 404);
    const company = await Company.findById(order.company);
    const doc = generateOrderPdf({ order, company, customer: order.customer, logoBuffer: await fetchLogoBuffer(company) });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${order.number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    fail(res, error, "Error generating the PDF");
  }
});

module.exports = router;
