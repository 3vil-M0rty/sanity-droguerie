const express = require("express");
const Company = require("../models/Company");
const Customer = require("../models/Customer");
const DeliveryNote = require("../models/DeliveryNote");
const DeliveryRound = require("../models/DeliveryRound");
const SalesOrder = require("../models/SalesOrder");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { has: hasPerm } = require("../services/permissionService");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { hideMoney } = require("../middleware/hideMoney");
const { isId, bad, normalizeSalesLines } = require("../utils/salesHelpers");
const { logAudit } = require("../services/auditLogger");
const { createWithNumber } = require("../services/documentNumberService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");
const { generateDeliveryNotePdf } = require("../services/salesPdfService");
const stock = require("../services/stockService");
const flow = require("../services/salesFlowService");

/**
 * ============================================================
 * LOGISTICS — /api/logistics
 * ============================================================
 * Delivery notes (BL-… / BR-… for returns):
 * GET    /delivery-notes?companyId=&status=&customer=&round=&toPlan=true&toInvoice=true&from=&to=
 * GET    /delivery-notes/:id
 * POST   /delivery-notes            { company, customer, warehouse, lines, type?, … }  (free BL / return)
 * PUT    /delivery-notes/:id        drafts (planning fields any time before delivery)
 * POST   /delivery-notes/:id/validate                 stock out (return: stock in)
 * POST   /delivery-notes/:id/deliver   { receivedBy, reserves, cashCollected }
 * POST   /delivery-notes/:id/cancel    { reason }     stock back
 * DELETE /delivery-notes/:id           drafts only
 * GET    /delivery-notes/:id/pdf?valued=true
 * POST   /delivery-notes/invoice       { ids: [...] }  one invoice for BLs of one customer
 *
 * Delivery rounds (tournées, TR-…):
 * GET    /rounds?companyId=&from=&to=&status=  · GET /rounds/:id
 * POST   /rounds   { company, date, vehicle, driver, zone, noteIds? }
 * PUT    /rounds/:id   (+ noteIds: ordered stops)
 * POST   /rounds/:id/start · POST /rounds/:id/finish { kmEnd, cost, results:[{noteId, delivered, receivedBy, cashCollected}] }
 * POST   /rounds/:id/cancel
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.logistics));
router.use(hideMoney(["unitCost", "costTotal"]));

const fail = (res, error, fallback) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback, error: error.message });
};
const str = (v, max) => String(v ?? "").trim().slice(0, max);

const NOTE_POPULATE = [
  { path: "customer", select: "name code phone address deliveryAddress city zone" },
  { path: "warehouse", select: "code name" },
  { path: "salesOrder", select: "number customerReference" },
  { path: "round", select: "number date driver vehicle status" },
  { path: "invoice", select: "number status" },
  { path: "lines.product", select: "name internalReference unit tracking weightKg" },
];

async function weightOf(lines) {
  const ids = lines.filter((l) => l.product).map((l) => l.product?._id || l.product);
  const products = await Product.find({ _id: { $in: ids } }).select("weightKg").lean();
  const byId = new Map(products.map((p) => [String(p._id), p.weightKg || 0]));
  return Math.round(lines.reduce((s, l) => s + (byId.get(String(l.product?._id || l.product)) || 0) * l.quantity * (l.unitFactor || 1), 0) * 10) / 10;
}

// ================================================================ BL
router.get("/delivery-notes", async (req, res) => {
  try {
    const { companyId, status, customer, round, toPlan, toInvoice, type } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const filter = { company: companyId, ...(await flow.repFilter(req, companyId)) };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (isId(customer)) filter.customer = customer;
    if (isId(round)) filter.round = round;
    if (toPlan === "true") Object.assign(filter, { type: "delivery", deliveryMode: "delivery", status: { $in: ["draft", "validated"] }, round: null });
    if (toInvoice === "true") Object.assign(filter, { type: "delivery", status: { $in: ["validated", "delivered"] }, invoice: null });
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) { const to = new Date(req.query.to); to.setHours(23, 59, 59, 999); filter.date.$lte = to; }
    }
    const notes = await DeliveryNote.find(filter).populate("customer", "name code city zone").populate("warehouse", "code").populate("round", "number date")
      .populate("salesOrder", "number").populate("invoice", "number").select("-history").sort({ date: -1, number: -1 }).limit(Math.min(Number(req.query.limit) || 200, 500)).lean();
    res.json({ success: true, data: notes });
  } catch (error) {
    fail(res, error, "Error loading delivery notes");
  }
});

router.get("/delivery-notes/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id).populate(NOTE_POPULATE).populate("history.by", "firstName lastName");
    if (!note) return bad(res, "Delivery note not found", 404);
    res.json({ success: true, data: note });
  } catch (error) {
    fail(res, error, "Error loading the delivery note");
  }
});

router.post("/delivery-notes", async (req, res) => {
  try {
    const { company } = req.body;
    if (!isId(company) || !(await Company.exists({ _id: company }))) return bad(res, "A valid company is required");
    const customer = isId(req.body.customer) ? await Customer.findOne({ _id: req.body.customer, company }) : null;
    if (!customer) return bad(res, "Choose a customer");
    const type = req.body.type === "return" ? "return" : "delivery";
    const priced = await flow.priceLines(req.body.lines || [], customer, company);
    const { lines, error } = await normalizeSalesLines(priced, company);
    if (error) return bad(res, error);
    const warehouse = isId(req.body.warehouse) ? req.body.warehouse : customer.defaultWarehouse || (await stock.defaultWarehouse(company))._id;
    const note = await createWithNumber(DeliveryNote, {
      company, type, customer: customer._id, salesRep: customer.salesRep || null, warehouse,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      deliveryMode: req.body.deliveryMode === "pickup" ? "pickup" : "delivery",
      address: str(req.body.address || customer.deliveryAddress || customer.address, 400),
      contactName: str(req.body.contactName, 120), contactPhone: str(req.body.contactPhone || customer.phone, 40),
      lines, notes: req.body.notes,
      history: [{ status: "draft", by: req.user.id }],
      createdBy: req.user.id, updatedBy: req.user.id,
    }, type === "return" ? "BR" : "BL");
    note.weightKg = await weightOf(note.lines);
    await note.save();
    if (req.body.validate) await flow.validateNote(note, req.user.id);
    await logAudit(req, { company, action: "create", resourceType: "DeliveryNote", resourceId: note._id, resourceLabel: `${note.number} — ${customer.name}` });
    res.status(201).json({ success: true, data: await DeliveryNote.findById(note._id).populate(NOTE_POPULATE) });
  } catch (error) {
    fail(res, error, "Error creating the delivery note");
  }
});

router.put("/delivery-notes/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    if (["delivered", "cancelled"].includes(note.status)) return bad(res, "This delivery note is closed");
    // Planning fields: any time before delivery.
    for (const [k, max] of [["address", 400], ["contactName", 120], ["contactPhone", 40], ["driver", 120], ["notes", 2000]]) if (req.body[k] !== undefined) note[k] = str(req.body[k], max);
    if (req.body.date !== undefined) note.date = req.body.date;
    if (req.body.packages !== undefined) note.packages = req.body.packages === "" ? null : Number(req.body.packages);
    if (req.body.deliveryMode !== undefined) note.deliveryMode = req.body.deliveryMode === "pickup" ? "pickup" : "delivery";
    // Lines and warehouse: drafts only (the stock hasn't moved yet).
    if (note.status === "draft") {
      if (req.body.lines !== undefined) {
        const customer = await Customer.findById(note.customer);
        const { lines, error } = await normalizeSalesLines(await flow.priceLines(req.body.lines, customer, note.company), note.company);
        if (error) return bad(res, error);
        note.lines = lines;
        note.weightKg = await weightOf(lines);
      }
      if (isId(req.body.warehouse)) note.warehouse = req.body.warehouse;
    } else if (req.body.lines !== undefined) return bad(res, "The goods have left — cancel the BL or make a return to change its lines");
    note.updatedBy = req.user.id;
    await note.save();
    res.json({ success: true, data: await DeliveryNote.findById(note._id).populate(NOTE_POPULATE) });
  } catch (error) {
    fail(res, error, "Error updating the delivery note");
  }
});

router.post("/delivery-notes/:id/validate", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    if (note.type === "delivery" && !note.salesOrder) {
      // A free BL (no confirmed order) checks the customer's credit now.
      const customer = await Customer.findById(note.customer);
      await flow.checkCredit(req, customer, note.totalTTC, { override: !!req.body.override });
    }
    await flow.validateNote(note, req.user.id);
    await logAudit(req, { company: note.company, action: "update", resourceType: "DeliveryNote", resourceId: note._id, resourceLabel: `${note.number} validé (sortie de stock)` });
    res.json({ success: true, data: await DeliveryNote.findById(note._id).populate(NOTE_POPULATE) });
  } catch (error) {
    fail(res, error, "Error validating the delivery note");
  }
});

const markDelivered = (note, body, actorId) => flow.markDelivered(note, body, actorId);

router.post("/delivery-notes/:id/deliver", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    if (note.status === "draft" && !hasPerm(req.user, "logistics.notes.validate")) return res.status(403).json({ success: false, message: "Validate the BL first", permission: "logistics.notes.validate" });
    await markDelivered(note, req.body, req.user.id);
    res.json({ success: true, data: await DeliveryNote.findById(note._id).populate(NOTE_POPULATE) });
  } catch (error) {
    fail(res, error, "Error updating the delivery note");
  }
});

router.post("/delivery-notes/:id/cancel", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    await flow.cancelNote(note, req.user.id, str(req.body.reason, 500));
    await logAudit(req, { company: note.company, action: "update", resourceType: "DeliveryNote", resourceId: note._id, resourceLabel: `${note.number} annulé` });
    res.json({ success: true, data: await DeliveryNote.findById(note._id).populate(NOTE_POPULATE) });
  } catch (error) {
    fail(res, error, "Error cancelling the delivery note");
  }
});

router.delete("/delivery-notes/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    if (note.status !== "draft") return bad(res, "Only a draft can be deleted — cancel it instead");
    await note.deleteOne();
    res.json({ success: true });
  } catch (error) {
    fail(res, error, "Error deleting the delivery note");
  }
});

router.get("/delivery-notes/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id).populate("customer").populate("warehouse", "name").populate("salesOrder", "number").populate("round", "number");
    if (!note) return bad(res, "Delivery note not found", 404);
    const company = await Company.findById(note.company);
    const valued = req.query.valued === "true" && hasPerm(req.user, "finance.amounts.view");
    const doc = generateDeliveryNotePdf({ note, company, customer: note.customer, logoBuffer: await fetchLogoBuffer(company), valued });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${note.number}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    fail(res, error, "Error generating the PDF");
  }
});

router.post("/delivery-notes/invoice", async (req, res) => {
  try {
    if (!hasPerm(req.user, "sales.invoices.create")) return res.status(403).json({ success: false, message: "You don't have the permission for this action", permission: "sales.invoices.create" });
    const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).filter(isId);
    const notes = await DeliveryNote.find({ _id: { $in: ids } }).sort({ date: 1 });
    if (notes.length !== ids.length || !ids.length) return bad(res, "Delivery note not found");
    const invoice = await flow.invoiceDraftFromNotes(notes, req.user.id);
    await logAudit(req, { company: invoice.company, action: "create", resourceType: "SalesInvoice", resourceId: invoice._id, resourceLabel: `Facture (brouillon) — ${notes.map((n) => n.number).join(", ")}` });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    fail(res, error, "Error creating the invoice");
  }
});

// ================================================================ rounds
const ROUND_POPULATE = [{ path: "warehouse", select: "code name" }, { path: "driverUser", select: "firstName lastName" }];

async function roundWithNotes(id) {
  const round = await DeliveryRound.findById(id).populate(ROUND_POPULATE).lean();
  if (!round) return null;
  const notes = await DeliveryNote.find({ round: id }).populate("customer", "name code phone city zone address deliveryAddress gps").select("-history").sort({ roundOrder: 1 }).lean();
  return { ...round, notes, weightKg: Math.round(notes.reduce((s, n) => s + (n.weightKg || 0), 0) * 10) / 10, cashCollected: notes.reduce((s, n) => s + (n.cashCollected || 0), 0) };
}

async function setStops(round, noteIds) {
  const ids = (noteIds || []).filter(isId).map(String);
  const notes = await DeliveryNote.find({ _id: { $in: ids }, company: round.company });
  for (const n of notes) {
    if (n.type !== "delivery" || !["draft", "validated"].includes(n.status)) throw flow.httpError(`${n.number} can't go in a round (${n.status})`);
    if (n.round && String(n.round) !== String(round._id)) throw flow.httpError(`${n.number} is already in another round`);
  }
  await DeliveryNote.updateMany({ round: round._id, _id: { $nin: ids } }, { $set: { round: null, roundOrder: 0 } });
  for (const n of notes) {
    n.round = round._id;
    n.roundOrder = ids.indexOf(String(n._id)) + 1;
    n.driver = round.driver;
    await n.save(); // eslint-disable-line no-await-in-loop
  }
}

router.get("/rounds", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "A valid companyId is required");
    const filter = { company: req.query.companyId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from);
      if (req.query.to) { const to = new Date(req.query.to); to.setHours(23, 59, 59, 999); filter.date.$lte = to; }
    }
    const rounds = await DeliveryRound.find(filter).populate(ROUND_POPULATE).sort({ date: -1 }).limit(200).lean();
    const counts = await DeliveryNote.aggregate([{ $match: { round: { $in: rounds.map((r) => r._id) } } }, { $group: { _id: "$round", stops: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } }, weightKg: { $sum: "$weightKg" } } }]);
    const byId = new Map(counts.map((c) => [String(c._id), c]));
    res.json({ success: true, data: rounds.map((r) => ({ ...r, stops: byId.get(String(r._id))?.stops || 0, delivered: byId.get(String(r._id))?.delivered || 0, weightKg: byId.get(String(r._id))?.weightKg || 0 })) });
  } catch (error) {
    fail(res, error, "Error loading rounds");
  }
});

router.get("/rounds/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const round = await roundWithNotes(req.params.id);
    if (!round) return bad(res, "Round not found", 404);
    res.json({ success: true, data: round });
  } catch (error) {
    fail(res, error, "Error loading the round");
  }
});

function roundFields(body) {
  const out = {};
  for (const [k, max] of [["zone", 80], ["vehicle", 60], ["driver", 120], ["driverPhone", 40], ["notes", 1000]]) if (body[k] !== undefined) out[k] = str(body[k], max);
  if (body.date !== undefined) out.date = new Date(body.date);
  if (body.warehouse !== undefined) out.warehouse = isId(body.warehouse) ? body.warehouse : null;
  if (body.driverUser !== undefined) out.driverUser = isId(body.driverUser) ? body.driverUser : null;
  if (body.vehicleCapacityKg !== undefined) out.vehicleCapacityKg = body.vehicleCapacityKg === "" ? null : Number(body.vehicleCapacityKg);
  return out;
}

router.post("/rounds", async (req, res) => {
  try {
    const { company } = req.body;
    if (!isId(company)) return bad(res, "A valid company is required");
    if (!req.body.date) return bad(res, "Choose the date of the round");
    const round = await createWithNumber(DeliveryRound, { company, ...roundFields(req.body), createdBy: req.user.id }, "TR");
    if (req.body.noteIds) await setStops(round, req.body.noteIds);
    res.status(201).json({ success: true, data: await roundWithNotes(round._id) });
  } catch (error) {
    fail(res, error, "Error creating the round");
  }
});

router.put("/rounds/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const round = await DeliveryRound.findById(req.params.id);
    if (!round) return bad(res, "Round not found", 404);
    if (["done", "cancelled"].includes(round.status)) return bad(res, "This round is closed");
    Object.assign(round, roundFields(req.body));
    await round.save();
    if (req.body.noteIds) await setStops(round, req.body.noteIds);
    else if (req.body.driver !== undefined) await DeliveryNote.updateMany({ round: round._id }, { $set: { driver: round.driver } });
    res.json({ success: true, data: await roundWithNotes(round._id) });
  } catch (error) {
    fail(res, error, "Error updating the round");
  }
});

router.post("/rounds/:id/start", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const round = await DeliveryRound.findById(req.params.id);
    if (!round) return bad(res, "Round not found", 404);
    if (round.status !== "planned") return bad(res, "This round has already left");
    // Every BL leaves the warehouse with the truck.
    const notes = await DeliveryNote.find({ round: round._id, status: "draft" });
    for (const n of notes) await flow.validateNote(n, req.user.id); // eslint-disable-line no-await-in-loop
    round.status = "in_progress";
    round.startedAt = new Date();
    if (req.body.kmStart !== undefined) round.kmStart = Number(req.body.kmStart) || null;
    await round.save();
    res.json({ success: true, data: await roundWithNotes(round._id) });
  } catch (error) {
    fail(res, error, "Error starting the round");
  }
});

router.post("/rounds/:id/finish", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const round = await DeliveryRound.findById(req.params.id);
    if (!round) return bad(res, "Round not found", 404);
    if (round.status !== "in_progress") return bad(res, "Start the round first");
    const results = new Map((Array.isArray(req.body.results) ? req.body.results : []).map((r) => [String(r.noteId), r]));
    const notes = await DeliveryNote.find({ round: round._id, status: "validated" });
    for (const n of notes) {
      const r = results.get(String(n._id)) || { delivered: true };
      // eslint-disable-next-line no-await-in-loop
      if (r.delivered !== false) await markDelivered(n, r, req.user.id);
      else {
        // Not delivered: back to "to plan" (the goods are back in the truck → warehouse decides).
        n.round = null;
        n.roundOrder = 0;
        n.history.push({ status: "not_delivered", note: str(r.reason, 300), by: req.user.id });
        await n.save(); // eslint-disable-line no-await-in-loop
      }
    }
    round.status = "done";
    round.finishedAt = new Date();
    if (req.body.kmEnd !== undefined) round.kmEnd = Number(req.body.kmEnd) || null;
    if (req.body.cost !== undefined) round.cost = Math.max(Number(req.body.cost) || 0, 0);
    await round.save();
    res.json({ success: true, data: await roundWithNotes(round._id) });
  } catch (error) {
    fail(res, error, "Error closing the round");
  }
});

router.post("/rounds/:id/cancel", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const round = await DeliveryRound.findById(req.params.id);
    if (!round) return bad(res, "Round not found", 404);
    if (round.status !== "planned") return bad(res, "Only a planned round can be cancelled");
    await DeliveryNote.updateMany({ round: round._id }, { $set: { round: null, roundOrder: 0 } });
    round.status = "cancelled";
    await round.save();
    res.json({ success: true, data: round });
  } catch (error) {
    fail(res, error, "Error cancelling the round");
  }
});

module.exports = router;
