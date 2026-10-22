const express = require("express");
const mongoose = require("mongoose");
const Warehouse = require("../models/Warehouse");
const StockLevel = require("../models/StockLevel");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { logAudit } = require("../services/auditLogger");
const { defaultWarehouse } = require("../services/stockService");

/**
 * WAREHOUSES (dépôts / magasins) — /api/warehouses
 * GET /?companyId=  · POST / · PUT /:id · PATCH /:id/default · DELETE /:id (empty only)
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.warehouses));

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

function clean(body) {
  const out = {};
  for (const k of ["name", "address", "city", "phone"]) if (body[k] !== undefined) out[k] = String(body[k] || "").trim();
  if (body.code !== undefined) out.code = String(body.code || "").trim().toUpperCase().slice(0, 12);
  if (body.kind !== undefined) out.kind = body.kind === "store" ? "store" : "warehouse";
  for (const k of ["hasCounter", "isActive"]) if (body[k] !== undefined) out[k] = body[k] === true || body[k] === "true";
  if (body.manager !== undefined) out.manager = isId(body.manager) ? body.manager : null;
  return out;
}

router.get("/", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!isId(companyId)) return bad(res, "companyId is required");
    await defaultWarehouse(companyId); // a company always has at least one
    const list = await Warehouse.find({ company: companyId }).populate("manager", "firstName lastName").sort({ isDefault: -1, code: 1 }).lean();
    const totals = await StockLevel.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: "$warehouse", articles: { $sum: { $cond: [{ $gt: ["$quantity", 0] }, 1, 0] } }, reserved: { $sum: "$reserved" } } },
    ]);
    const byId = new Map(totals.map((t) => [String(t._id), t]));
    res.json({ success: true, data: list.map((w) => ({ ...w, articles: byId.get(String(w._id))?.articles || 0 })) });
  } catch (error) {
    console.error("GET warehouses error:", error);
    res.status(500).json({ success: false, message: "Error fetching warehouses", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!isId(req.body.company)) return bad(res, "A valid company is required");
    const data = clean(req.body);
    if (!data.code || !data.name) return bad(res, "Code and name are required");
    const w = await Warehouse.create({ ...data, company: req.body.company, isDefault: false, createdBy: req.user.id });
    await logAudit(req, { company: w.company, action: "create", resourceType: "Warehouse", resourceId: w._id, resourceLabel: `${w.code} ${w.name}` });
    res.status(201).json({ success: true, data: w });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This code is already used", 409);
    console.error("POST warehouse error:", error);
    res.status(500).json({ success: false, message: "Error creating the warehouse", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const w = await Warehouse.findById(req.params.id);
    if (!w) return bad(res, "Warehouse not found", 404);
    const data = clean(req.body);
    if (data.isActive === false && w.isDefault) return bad(res, "Choose another default warehouse before closing this one");
    Object.assign(w, data, { updatedBy: req.user.id });
    await w.save();
    res.json({ success: true, data: w });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This code is already used", 409);
    console.error("PUT warehouse error:", error);
    res.status(500).json({ success: false, message: "Error updating the warehouse", error: error.message });
  }
});

router.patch("/:id/default", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const w = await Warehouse.findById(req.params.id);
    if (!w) return bad(res, "Warehouse not found", 404);
    if (!w.isActive) return bad(res, "This warehouse is closed");
    await Warehouse.updateMany({ company: w.company, _id: { $ne: w._id } }, { $set: { isDefault: false } });
    w.isDefault = true;
    await w.save();
    res.json({ success: true, data: w });
  } catch (error) {
    console.error("PATCH warehouse default error:", error);
    res.status(500).json({ success: false, message: "Error updating the warehouse", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const w = await Warehouse.findById(req.params.id);
    if (!w) return bad(res, "Warehouse not found", 404);
    if (w.isDefault) return bad(res, "The default warehouse can't be deleted");
    if (await StockLevel.exists({ warehouse: w._id, $or: [{ quantity: { $ne: 0 } }, { reserved: { $gt: 0 } }] })) return bad(res, "This warehouse still holds stock — transfer it first, or close the warehouse");
    await StockLevel.deleteMany({ warehouse: w._id });
    await Warehouse.deleteOne({ _id: w._id });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE warehouse error:", error);
    res.status(500).json({ success: false, message: "Error deleting the warehouse", error: error.message });
  }
});

module.exports = router;
