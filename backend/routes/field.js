const express = require("express");
const storage = require("../services/storageService");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const DeliveryRound = require("../models/DeliveryRound");
const DeliveryProof = require("../models/DeliveryProof");
const Visit = require("../models/Visit");
const Warehouse = require("../models/Warehouse");
const InventoryCategory = require("../models/InventoryCategory");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { has } = require("../services/permissionService");
const { canSeeFinancials, seesAllCustomers } = require("../permissions/permissions");
const { isId, bad, normalizeSalesLines } = require("../utils/salesHelpers");
const flow = require("../services/salesFlowService");
const pricing = require("../services/pricingService");
const promotions = require("../services/promotionService");
const { createWithNumber } = require("../services/documentNumberService");
const { amountDue } = require("../services/salesCalc");
const SalesInvoice = require("../models/SalesInvoice");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * FIELD APP — /api/field   (the phone app at /m)
 * ============================================================
 * Reps work offline at the customer's counter: the app downloads its
 * customers and the catalogue (with each price level's price), queues
 * orders and visits on the phone, and sends the queue when the network
 * is back. Each queued item carries a `clientRef` made on the phone:
 * sending it twice never creates two orders / visits.
 *
 * GET  /bootstrap?companyId=&since=   customers, catalogue (delta with since), levels, promotions
 * POST /sync   { companyId, orders: [...], visits: [...] }  → per item { clientRef, ok, id, number, error }
 * GET  /visits?companyId=&from=&to=&rep=
 * Drivers:
 * GET  /deliveries?companyId=&date=   my rounds of the day and their BLs
 * POST /deliveries/:id/proof  { signature, photo, receivedBy, reserves, gps, cashCollected, clientRef }
 * GET  /deliveries/:id/proof  (office)
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.field));
router.use(express.json({ limit: "8mb" })); // photo + signature

const fail = (res, e, what) => {
  if (e.status && e.status < 500) return bad(res, e.message, e.status);
  console.error(`${what} error:`, e);
  return res.status(500).json({ success: false, message: e.message });
};
const ref = (v) => String(v || "").trim().slice(0, 64);
const gpsOf = (g) => (g && Number.isFinite(Number(g.lat)) && Number.isFinite(Number(g.lng)) ? { lat: Number(g.lat), lng: Number(g.lng), accuracy: Number(g.accuracy) || null } : undefined);
function meters(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

router.get("/bootstrap", async (req, res) => {
  try {
    const companyId = req.query.companyId;
    if (!isId(companyId)) return bad(res, "companyId is required");
    const can = {
      orders: has(req.user, "sales.orders.create"),
      visits: has(req.user, "sales.visits.create"),
      deliveries: has(req.user, "logistics.notes.deliver"),
      money: canSeeFinancials(req.user),
    };
    const out = { serverTime: new Date(), can };
    if (can.orders || can.visits) {
      const scope = seesAllCustomers(req.user) ? {} : { salesRep: req.user.id };
      const customers = await Customer.find({ company: companyId, isActive: { $ne: false }, type: { $ne: "walk_in" }, ...scope })
        .select("name code type city address phone whatsapp gps priceLevel discountPercent creditLimit blocked blockedReason zone").sort({ name: 1 }).limit(3000).lean();
      const open = await SalesInvoice.find({ company: companyId, customer: { $in: customers.map((c) => c._id) }, type: { $ne: "credit_note" }, status: { $in: ["issued", "partially_paid"] } }).select("customer totalTTC amountPaid dueDate status type").lean();
      const owed = new Map();
      const late = new Map();
      for (const i of open) {
        const k = String(i.customer);
        owed.set(k, (owed.get(k) || 0) + amountDue(i));
        if (i.dueDate && new Date(i.dueDate) < new Date()) late.set(k, (late.get(k) || 0) + amountDue(i));
      }
      out.customers = customers.map((c) => ({ ...c, balance: can.money ? Math.round((owed.get(String(c._id)) || 0) * 100) / 100 : undefined, overdue: can.money ? Math.round((late.get(String(c._id)) || 0) * 100) / 100 : undefined }));
    }
    if (can.orders) {
      const settings = await pricing.getSettings(companyId);
      const since = req.query.since ? new Date(req.query.since) : null;
      const filter = { company: companyId, isVariantParent: { $ne: true }, isActive: { $ne: false }, ...(since && !Number.isNaN(since.getTime()) ? { updatedAt: { $gt: since } } : {}) };
      const products = await Product.find(filter).select("name internalReference barcode unit packagings vatRate priceLevels sellingPrice avgCost minSellingPrice quantity category image.thumbUrl isService updatedAt").limit(20000).lean();
      const cats = new Map((await InventoryCategory.find({ company: companyId }).select("name").lean()).map((c) => [String(c._id), c.name]));
      out.catalogue = products.map((p) => ({
        _id: p._id, name: p.name, ref: p.internalReference || "", barcode: p.barcode || "", unit: p.unit, vat: p.vatRate ?? 20,
        packs: (p.packagings || []).map((x) => ({ unit: x.unit, factor: x.factor, barcode: x.barcode || "" })),
        prices: Object.fromEntries(pricing.allLevelPrices(p, settings).map((l) => [l.code, l.price])),
        stock: p.isService ? null : Math.max(p.quantity || 0, 0), family: cats.get(String(p.category)) || "", thumb: p.image?.thumbUrl || "",
      }));
      out.catalogueComplete = !since;
      out.levels = (settings.priceLevels || []).map((l) => ({ code: l.code, label: l.label }));
      out.defaultLevel = settings.defaultPriceLevel;
      out.promotions = (await promotions.activeFor(companyId)).map((p) => ({ _id: p._id, name: p.name, type: p.type, value: p.value, buyQuantity: p.buyQuantity, freeQuantity: p.freeQuantity, endDate: p.endDate, products: p.products, categories: p.categories, brands: p.brands, customerTypes: p.customerTypes, priceLevels: p.priceLevels }));
      out.warehouses = await Warehouse.find({ company: companyId, isActive: { $ne: false } }).select("code name isDefault").lean();
    }
    res.json({ success: true, data: out });
  } catch (e) { fail(res, e, "GET field bootstrap"); }
});

async function syncOrder(req, companyId, o) {
  const clientRef = ref(o.clientRef);
  if (!clientRef) throw flow.httpError("clientRef missing");
  const existing = await SalesOrder.findOne({ company: companyId, clientRef }).select("number").lean();
  if (existing) return { id: existing._id, number: existing.number, duplicate: true };
  if (!has(req.user, "sales.orders.create")) throw flow.httpError("You can't create orders", 403);
  const customer = isId(o.customer) ? await Customer.findOne({ _id: o.customer, company: companyId }) : null;
  if (!customer) throw flow.httpError("Customer not found");
  if (!flow.canSeeCustomer(req, customer)) throw flow.httpError("This customer is assigned to another sales rep", 403);
  const { lines, error } = await normalizeSalesLines(await flow.priceLines(o.lines || [], customer, companyId), companyId);
  if (error) throw flow.httpError(error);
  await flow.checkFloors(req, lines, companyId);
  const order = await createWithNumber(SalesOrder, {
    company: companyId, customer: customer._id, salesRep: customer.salesRep || req.user.id, priceLevel: customer.priceLevel,
    warehouse: isId(o.warehouse) ? o.warehouse : customer.defaultWarehouse || null, source: "rep", clientRef, gps: gpsOf(o.gps),
    customerReference: o.customerReference, date: o.takenAt ? new Date(o.takenAt) : new Date(), expectedDate: o.expectedDate || null,
    deliveryMode: o.deliveryMode === "pickup" ? "pickup" : "delivery", deliveryAddress: customer.deliveryAddress || customer.address,
    lines: lines.map((l) => ({ ...l, deliveredQuantity: 0 })), notes: o.notes, createdBy: req.user.id, updatedBy: req.user.id,
  }, "CC");
  await logAudit(req, { company: companyId, action: "create", resourceType: "SalesOrder", resourceId: order._id, resourceLabel: `${order.number} — ${customer.name} (terrain)` });
  return { id: order._id, number: order.number, totalTTC: order.totalTTC };
}

async function syncVisit(req, companyId, v, ordersByRef) {
  const clientRef = ref(v.clientRef);
  if (!clientRef) throw flow.httpError("clientRef missing");
  const existing = await Visit.findOne({ company: companyId, clientRef }).select("_id").lean();
  if (existing) return { id: existing._id, duplicate: true };
  if (!has(req.user, "sales.visits.create")) throw flow.httpError("You can't log visits", 403);
  const customer = isId(v.customer) ? await Customer.findOne({ _id: v.customer, company: companyId }).select("salesRep gps").lean() : null;
  if (!customer) throw flow.httpError("Customer not found");
  if (!flow.canSeeCustomer(req, customer)) throw flow.httpError("This customer is assigned to another sales rep", 403);
  const gps = gpsOf(v.gps);
  const orderId = v.orderClientRef ? ordersByRef.get(ref(v.orderClientRef)) || (await SalesOrder.findOne({ company: companyId, clientRef: ref(v.orderClientRef) }).select("_id").lean())?._id : null;
  const visit = await Visit.create({
    company: companyId, customer: customer._id, rep: req.user.id, visitedAt: v.visitedAt ? new Date(v.visitedAt) : new Date(),
    outcome: ["order", "no_order", "closed", "collection", "prospect", "other"].includes(v.outcome) ? v.outcome : orderId ? "order" : "other",
    notes: String(v.notes || "").slice(0, 2000), gps, distanceMeters: meters(gps, customer.gps), order: orderId || null,
    nextVisitAt: v.nextVisitAt ? new Date(v.nextVisitAt) : null, clientRef,
  });
  // first visit with a position: the customer's location is learned
  if (gps && (customer.gps?.lat == null) && (gps.accuracy == null || gps.accuracy <= 100)) await Customer.updateOne({ _id: customer._id }, { $set: { gps: { lat: gps.lat, lng: gps.lng } } });
  return { id: visit._id, distanceMeters: visit.distanceMeters };
}

router.post("/sync", async (req, res) => {
  try {
    const companyId = req.body?.companyId;
    if (!isId(companyId)) return bad(res, "companyId is required");
    const orders = Array.isArray(req.body.orders) ? req.body.orders.slice(0, 200) : [];
    const visits = Array.isArray(req.body.visits) ? req.body.visits.slice(0, 500) : [];
    const out = { orders: [], visits: [] };
    const ordersByRef = new Map();
    for (const o of orders) {
      try {
        const r = await syncOrder(req, companyId, o);
        ordersByRef.set(ref(o.clientRef), r.id);
        out.orders.push({ clientRef: o.clientRef, ok: true, ...r });
      } catch (e) {
        out.orders.push({ clientRef: o.clientRef, ok: false, error: e.message, code: e.code, retry: !(e.status && e.status < 500) });
      }
    }
    for (const v of visits) {
      try {
        out.visits.push({ clientRef: v.clientRef, ok: true, ...(await syncVisit(req, companyId, v, ordersByRef)) });
      } catch (e) {
        out.visits.push({ clientRef: v.clientRef, ok: false, error: e.message, retry: !(e.status && e.status < 500) });
      }
    }
    res.json({ success: true, data: out });
  } catch (e) { fail(res, e, "POST field sync"); }
});

router.get("/visits", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const q = { company: req.query.companyId };
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);
    const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 30 * 86400000);
    q.visitedAt = { $gte: from, $lte: to };
    const manager = has(req.user, "sales.reps.view") || seesAllCustomers(req.user);
    if (!manager) q.rep = req.user.id;
    else if (isId(req.query.rep)) q.rep = req.query.rep;
    if (isId(req.query.customer)) q.customer = req.query.customer;
    const rows = await Visit.find(q).sort({ visitedAt: -1 }).limit(1000).populate("customer", "name code city").populate("rep", "firstName lastName").populate("order", "number totalTTC").lean();
    const summary = { visits: rows.length, withOrder: rows.filter((r) => r.order).length, far: rows.filter((r) => r.distanceMeters > 500).length };
    res.json({ success: true, data: { rows, summary } });
  } catch (e) { fail(res, e, "GET visits"); }
});

// ---------------------------------------------------------------- drivers
router.get("/deliveries", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const day = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    const roundFilter = { company: req.query.companyId, date: { $gte: start, $lte: end }, status: { $in: ["planned", "in_progress", "done"] } };
    if (!has(req.user, "logistics.rounds.manage")) roundFilter.driverUser = req.user.id;
    const rounds = await DeliveryRound.find(roundFilter).sort({ date: 1 }).lean();
    const notes = await DeliveryNote.find({ round: { $in: rounds.map((r) => r._id) }, status: { $in: ["validated", "delivered"] } })
      .select("number round roundOrder status customer deliveryAddress totalTTC cashCollected receivedBy deliveredAt lines packages weightKg proof invoice")
      .populate("customer", "name code phone gps city address").sort({ roundOrder: 1 }).lean();
    const money = canSeeFinancials(req.user) || has(req.user, "sales.payments.create");
    res.json({
      success: true,
      data: rounds.map((r) => ({
        ...r,
        notes: notes.filter((n) => String(n.round) === String(r._id)).map((n) => ({
          ...n, totalTTC: money ? n.totalTTC : undefined, hasProof: !!n.proof,
          lines: (n.lines || []).map((l) => ({ description: l.description, quantity: l.quantity, unit: l.unit })), // no prices / costs on the driver's phone
        })),
      })),
    });
  } catch (e) { fail(res, e, "GET deliveries"); }
});

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

// Office staff (dispatch) may handle any delivery; a driver only those
// on a round assigned to them — a note on no round is not "theirs".
const isDispatcher = (user) => has(user, "logistics.rounds.manage") || has(user, "logistics.notes.validate");
async function driverOwns(user, note) {
  if (isDispatcher(user)) return true;
  if (!note.round) return false;
  const round = await DeliveryRound.findById(note.round).select("driverUser").lean();
  return !!round && (!round.driverUser || String(round.driverUser) === String(user.id));
}
router.post("/deliveries/:id/proof", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id);
    if (!note) return bad(res, "Delivery note not found", 404);
    const clientRef = ref(req.body?.clientRef);
    if (note.proof) {
      const prev = await DeliveryProof.findById(note.proof).select("clientRef").lean();
      if (clientRef && prev?.clientRef === clientRef) return res.json({ success: true, data: { note: note._id, status: note.status, duplicate: true } });
      return bad(res, "This delivery already has its proof");
    }
    if (!(await driverOwns(req.user, note))) return bad(res, "This delivery is not on one of your rounds", 403);
    const signature = String(req.body?.signature || "");
    const photo = String(req.body?.photo || "");
    if (!signature && !photo) return bad(res, "Take the customer's signature or a photo");
    for (const [name, v] of [["signature", signature], ["photo", photo]]) {
      if (v && (!DATA_URL.test(v) || v.length > 3_000_000)) return bad(res, `Invalid ${name} image`);
    }
    if (!String(req.body?.receivedBy || "").trim()) return bad(res, "Enter the name of who received the goods");
    // The photo goes to file storage; a full quota never blocks a delivery.
    const photoFile = photo ? await storage.uploadPrivateFile(Buffer.from(photo.split(",")[1], "base64"), `companies/${note.company}/deliveries`, `${note.number}-livraison.${photo.startsWith("data:image/png") ? "png" : photo.startsWith("data:image/webp") ? "webp" : "jpg"}`, photo.slice(5, photo.indexOf(";")), { companyId: note.company, enforceQuota: false }) : undefined;
    const proof = await DeliveryProof.create({
      company: note.company, note: note._id, signature, photo: "", photoFile, receivedBy: String(req.body.receivedBy).trim().slice(0, 120),
      gps: gpsOf(req.body.gps), takenAt: req.body.takenAt ? new Date(req.body.takenAt) : new Date(), by: req.user.id, clientRef: clientRef || undefined,
    });
    note.proof = proof._id;
    if (note.status !== "delivered") await flow.markDelivered(note, { receivedBy: req.body.receivedBy, reserves: req.body.reserves, cashCollected: req.body.cashCollected, deliveredAt: req.body.takenAt }, req.user.id);
    else await note.save();
    await logAudit(req, { company: note.company, action: "update", resourceType: "DeliveryNote", resourceId: note._id, resourceLabel: `${note.number} livré — signé par ${proof.receivedBy}` });
    res.json({ success: true, data: { note: note._id, status: note.status, proof: proof._id } });
  } catch (e) { fail(res, e, "POST delivery proof"); }
});

router.get("/deliveries/:id/proof", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const note = await DeliveryNote.findById(req.params.id).select("proof number round").lean();
    if (!note?.proof) return bad(res, "No proof of delivery for this BL", 404);
    // Signatures, photos and GPS: office staff, or the driver of that round.
    if (!has(req.user, "logistics.notes.view") && !(await driverOwns(req.user, note))) return bad(res, "Not your delivery", 403);
    const proof = await DeliveryProof.findById(note.proof).populate("by", "firstName lastName").lean();
    if (proof?.photoFile?.publicId) proof.photo = await storage.privateFileUrl(proof.photoFile);
    if (proof) delete proof.photoFile;
    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: proof });
  } catch (e) { fail(res, e, "GET delivery proof"); }
});

module.exports = router;
