const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const imports = require("../services/importService");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * EXCEL IMPORTS — /api/imports
 * ============================================================
 * GET  /:kind/template?companyId=     the .xlsx model to fill (articles | customers | stock)
 * POST /:kind/preview?companyId=      file → what will happen, row by row (nothing written)
 * POST /:kind/commit?companyId=       file → create / update; rows with errors skipped and listed
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.imports));

const KINDS = ["articles", "customers", "stock"];
const XLSX = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream", "application/zip"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => (XLSX.includes(file.mimetype) || /\.xlsx$/i.test(file.originalname) ? cb(null, true) : cb(Object.assign(new Error("Envoyez un fichier Excel .xlsx"), { status: 400 }))),
}).single("file");

const check = (req, res) => {
  if (!KINDS.includes(req.params.kind)) { res.status(404).json({ success: false, message: "Unknown import" }); return false; }
  if (!mongoose.Types.ObjectId.isValid(String(req.query.companyId || ""))) { res.status(400).json({ success: false, message: "companyId is required" }); return false; }
  return true;
};
const withFile = (handler) => (req, res) => upload(req, res, async (err) => {
  if (err) return res.status(err.status || 400).json({ success: false, message: err.code === "LIMIT_FILE_SIZE" ? "Fichier trop lourd (10 Mo maximum)" : err.message });
  if (!check(req, res)) return undefined;
  if (!req.file) return res.status(400).json({ success: false, message: "Choisissez un fichier .xlsx" });
  try {
    return await handler(req, res);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    console.error("Import error:", error);
    return res.status(500).json({ success: false, message: "Error reading the file", error: error.message });
  }
});

const NAMES = { articles: "modele-articles.xlsx", customers: "modele-clients.xlsx", stock: "modele-stock-ouverture.xlsx" };

router.get("/:kind/template", async (req, res) => {
  if (!check(req, res)) return;
  try {
    const buf = await imports.template(req.params.kind, req.query.companyId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${NAMES[req.params.kind]}"`);
    res.send(Buffer.from(buf));
  } catch (error) {
    console.error("Import template error:", error);
    res.status(500).json({ success: false, message: "Error building the template", error: error.message });
  }
});

router.post("/:kind/preview", withFile(async (req, res) => {
  res.json({ success: true, data: await imports.preview(req.params.kind, req.query.companyId, req.file.buffer) });
}));

router.post("/:kind/commit", withFile(async (req, res) => {
  const out = await imports.commit(req.params.kind, req.query.companyId, req.file.buffer, req.user.id);
  await logAudit(req, { company: req.query.companyId, action: "create", resourceType: "Import", resourceId: req.query.companyId, resourceLabel: `Import ${req.params.kind} : ${out.created} créés, ${out.updated} mis à jour, ${out.skipped} ignorés` });
  res.json({ success: true, data: out });
}));

module.exports = router;
