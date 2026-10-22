const express = require("express");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { withDescendants } = require("../services/categoryTree");
const pricing = require("../services/pricingService");

/**
 * SALES SETTINGS & PRICE LISTS — /api/sales-settings
 * GET  /?companyId=                       price levels, counter & commission settings
 * PUT  /?companyId=                       (sales.pricing.edit)
 * GET  /price-list?companyId=&level=&category=&brand=&format=xlsx   tarif per level
 * POST /bulk-prices { company, level, category?, brand?, mode: "markup"|"percent", value }
 *      sets a level's price for many articles at once (CMUP + x %, or ± x % on the current price)
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.salesSettings));
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

router.get("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    res.json({ success: true, data: await pricing.getSettings(req.query.companyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error loading settings", error: error.message });
  }
});

router.put("/", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const s = await pricing.getSettings(req.query.companyId);
    const b = req.body || {};
    if (b.priceLevels !== undefined) {
      if (!Array.isArray(b.priceLevels) || !b.priceLevels.length) return bad(res, "Keep at least one price level");
      const seen = new Set();
      const levels = [];
      for (const [i, l] of b.priceLevels.entries()) {
        const code = String(l?.code || "").trim().toUpperCase().slice(0, 10);
        const label = String(l?.label || "").trim().slice(0, 60);
        if (!code || !label) return bad(res, "Every price level needs a code and a name");
        if (seen.has(code)) return bad(res, `Code ${code} is used twice`);
        seen.add(code);
        const markup = l.markupPercent === "" || l.markupPercent === null || l.markupPercent === undefined ? null : Number(l.markupPercent);
        if (markup !== null && !(markup >= 0)) return bad(res, `Invalid markup for ${code}`);
        levels.push({ code, label, markupPercent: markup, sortOrder: i + 1 });
      }
      s.priceLevels = levels;
    }
    const codes = new Set(s.priceLevels.map((l) => l.code));
    for (const k of ["defaultPriceLevel", "posPriceLevel"]) {
      if (b[k] === undefined) continue;
      const v = String(b[k] || "").toUpperCase();
      if (!codes.has(v)) return bad(res, `Unknown price level ${v}`);
      s[k] = v;
    }
    for (const k of ["blockOverCreditLimit", "blockBelowCost", "vatRegistered"]) if (b[k] !== undefined) s[k] = !!b[k];
    if (b.commissionBase !== undefined) {
      if (!["invoiced", "collected", "margin"].includes(b.commissionBase)) return bad(res, "Invalid commission base");
      s.commissionBase = b.commissionBase;
    }
    for (const k of ["defaultCommissionRate", "posMaxAnonymousAmount"]) if (b[k] !== undefined) s[k] = Math.max(Number(b[k]) || 0, 0);
    for (const k of ["ticketHeader", "ticketFooter"]) if (b[k] !== undefined) s[k] = String(b[k] || "").slice(0, 500);
    s.updatedBy = req.user.id;
    await s.save();
    res.json({ success: true, data: s });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving settings", error: error.message });
  }
});

async function listFilter(q) {
  const filter = { company: new mongoose.Types.ObjectId(q.companyId || q.company), isVariantParent: { $ne: true }, isActive: { $ne: false } };
  if (isId(q.category)) {
    const ids = await withDescendants(q.companyId || q.company, q.category);
    filter.category = { $in: (ids.length ? ids : [q.category]).map((id) => new mongoose.Types.ObjectId(String(id))) };
  }
  if (isId(q.brand)) filter.brand = new mongoose.Types.ObjectId(q.brand);
  return filter;
}

router.get("/price-list", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const settings = await pricing.getSettings(req.query.companyId);
    const products = await Product.find(await listFilter(req.query)).populate("category", "name").populate("brand", "name").sort({ name: 1 }).lean();
    const levels = req.query.level ? settings.priceLevels.filter((l) => l.code === String(req.query.level).toUpperCase()) : settings.priceLevels;
    const rows = products.map((p) => ({
      _id: p._id, reference: p.internalReference || "", name: p.name, brand: p.brand?.name || "", category: p.category?.name || "", unit: p.unit, vatRate: p.vatRate,
      prices: Object.fromEntries(levels.map((l) => [l.code, pricing.priceAtLevel(p, l.code, settings).price])),
    }));
    if (req.query.format !== "xlsx") return res.json({ success: true, data: { levels, rows } });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Tarif");
    ws.addRow([`Tarif ${levels.map((l) => `${l.code} ${l.label}`).join(" / ")} — prix HT — ${new Date().toLocaleDateString("fr-FR")}`]).font = { bold: true };
    ws.addRow(["Référence", "Désignation", "Marque", "Famille", "Unité", "TVA", ...levels.map((l) => `${l.code} HT`), ...levels.map((l) => `${l.code} TTC`)]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.reference, r.name, r.brand, r.category, r.unit, `${r.vatRate}%`, ...levels.map((l) => r.prices[l.code]), ...levels.map((l) => (r.prices[l.code] === null ? null : Math.round(r.prices[l.code] * (1 + r.vatRate / 100) * 100) / 100))]));
    ws.getColumn(2).width = 45;
    for (let c = 7; c < 7 + levels.length * 2; c += 1) { ws.getColumn(c).numFmt = "#,##0.00"; ws.getColumn(c).width = 12; }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="tarif.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: "Error building the price list", error: error.message });
  }
});

router.post("/bulk-prices", async (req, res) => {
  try {
    const { company, mode } = req.body;
    if (!isId(company)) return bad(res, "A valid company is required");
    const settings = await pricing.getSettings(company);
    const level = String(req.body.level || "").toUpperCase();
    if (!settings.priceLevels.some((l) => l.code === level)) return bad(res, "Unknown price level");
    const value = Number(req.body.value);
    if (!Number.isFinite(value)) return bad(res, "Enter a value");
    if (!["markup", "percent"].includes(mode)) return bad(res, "Invalid mode");
    const products = await Product.find(await listFilter({ company, category: req.body.category, brand: req.body.brand }));
    let changed = 0;
    for (const p of products) {
      let price;
      if (mode === "markup") {
        if (!(p.avgCost > 0)) continue;
        price = p.avgCost * (1 + value / 100);
      } else {
        const current = pricing.priceAtLevel(p, level, settings).price;
        if (current === null) continue;
        price = current * (1 + value / 100);
      }
      price = Math.round(price * 100) / 100;
      const others = (p.priceLevels || []).filter((x) => x.level !== level);
      p.priceLevels = [...others, { level, price }];
      p.updatedBy = req.user.id;
      await p.save(); // eslint-disable-line no-await-in-loop
      changed += 1;
    }
    res.json({ success: true, data: { changed } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating prices", error: error.message });
  }
});

module.exports = router;
