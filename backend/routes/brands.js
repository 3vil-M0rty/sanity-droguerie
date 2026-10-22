const express = require("express");
const mongoose = require("mongoose");
const Brand = require("../models/Brand");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");

/** BRANDS (marques) — /api/brands: GET /?companyId= · POST / · PUT /:id · DELETE /:id */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.brands));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

router.get("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const brands = await Brand.find({ company: req.query.companyId }).sort({ name: 1 }).lean();
    const counts = await Product.aggregate([{ $match: { company: new mongoose.Types.ObjectId(req.query.companyId), brand: { $ne: null } } }, { $group: { _id: "$brand", n: { $sum: 1 } } }]);
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json({ success: true, data: brands.map((b) => ({ ...b, articles: byId.get(String(b._id)) || 0 })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching brands", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!isId(req.body.company)) return bad(res, "A valid company is required");
    const name = String(req.body.name || "").trim();
    if (!name) return bad(res, "The brand name is required");
    const b = await Brand.create({ company: req.body.company, name, country: req.body.country, notes: req.body.notes, createdBy: req.user.id });
    res.status(201).json({ success: true, data: b });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This brand already exists", 409);
    res.status(500).json({ success: false, message: "Error creating the brand", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    const b = await Brand.findById(req.params.id);
    if (!b) return bad(res, "Brand not found", 404);
    for (const k of ["name", "country", "notes"]) if (req.body[k] !== undefined) b[k] = String(req.body[k] || "").trim();
    if (req.body.isActive !== undefined) b.isActive = !!req.body.isActive;
    await b.save();
    res.json({ success: true, data: b });
  } catch (error) {
    if (error.code === 11000) return bad(res, "This brand already exists", 409);
    res.status(500).json({ success: false, message: "Error updating the brand", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid ID");
    if (await Product.exists({ brand: req.params.id })) return bad(res, "Articles use this brand — deactivate it instead");
    await Brand.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting the brand", error: error.message });
  }
});

module.exports = router;
