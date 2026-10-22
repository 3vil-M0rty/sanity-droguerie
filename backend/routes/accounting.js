const express = require("express");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { has } = require("../services/permissionService");
const SalesSettings = require("../models/SalesSettings");
const accounting = require("../services/accountingService");
const { logAudit } = require("../services/auditLogger");

/**
 * ============================================================
 * ACCOUNTING — /api/accounting
 * ============================================================
 * GET /settings?companyId=            accounts, journals, VAT regime, e-invoicing
 * PUT /settings?companyId=            (finance.accounting.settings)
 * GET /journal?companyId=&from=&to=&format=json|csv|sage|xlsx
 *                                      journal entries for the accountant
 * GET /vat?companyId=&from=&to=&format=json|xlsx
 *                                      VAT collected / deductible / to pay
 * Files need finance.accounting.export.
 * ============================================================
 */
const router = express.Router();
router.use(auth, guard(ROUTE_PERMISSIONS.accounting));

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));
const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

function period(q) {
  const now = new Date();
  const from = q.from ? new Date(q.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = q.to ? new Date(q.to) : now;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}
const fr = (d) => new Date(d).toLocaleDateString("fr-FR");
const ACCOUNT_KEYS = ["customers", "suppliers", "sales", "purchases", "vatCollected", "vatDeductible", "bank", "cash", "valuesToCollect", "cardClearing", "rebates"];

router.get("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const acc = await accounting.accountsOf(req.query.companyId);
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("einvoicing").lean();
    res.json({ success: true, data: { accounting: acc, einvoicing: s?.einvoicing || { enabled: false, provider: "simulation", autoSubmit: false }, defaults: accounting.DEFAULTS } });
  } catch (error) {
    console.error("GET accounting settings error:", error);
    res.status(500).json({ success: false, message: "Error loading the accounting settings", error: error.message });
  }
});

router.put("/settings", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const set = {};
    const a = req.body?.accounting || {};
    for (const k of ACCOUNT_KEYS) {
      if (a[k] === undefined) continue;
      const v = String(a[k] || "").trim();
      if (!/^[0-9A-Za-z]{2,20}$/.test(v)) return bad(res, `Invalid account number for ${k}`);
      set[`accounting.${k}`] = v;
    }
    for (const j of ["sales", "purchases", "bank", "cash"]) {
      if (a.journals?.[j] === undefined) continue;
      const v = String(a.journals[j] || "").trim().toUpperCase();
      if (!/^[0-9A-Z]{1,6}$/.test(v)) return bad(res, `Invalid journal code for ${j}`);
      set[`accounting.journals.${j}`] = v;
    }
    if (a.salesByRate && typeof a.salesByRate === "object") {
      const map = {};
      for (const [rate, acc] of Object.entries(a.salesByRate)) if ([0, 7, 10, 14, 20].includes(Number(rate)) && /^[0-9A-Za-z]{2,20}$/.test(String(acc || ""))) map[String(Number(rate))] = String(acc);
      set["accounting.salesByRate"] = map;
    }
    if (["encaissement", "debit"].includes(a.vatRegime)) set["accounting.vatRegime"] = a.vatRegime;
    const e = req.body?.einvoicing || {};
    if (e.enabled !== undefined) set["einvoicing.enabled"] = e.enabled === true;
    if (e.autoSubmit !== undefined) set["einvoicing.autoSubmit"] = e.autoSubmit === true;
    if (["simulation", "http"].includes(e.provider)) set["einvoicing.provider"] = e.provider;
    await SalesSettings.updateOne({ company: req.query.companyId }, { $set: { ...set, updatedBy: req.user.id } }, { upsert: true });
    const saved = await SalesSettings.findOne({ company: req.query.companyId }).select("_id").lean();
    await logAudit(req, { company: req.query.companyId, action: "update", resourceType: "SalesSettings", resourceId: saved._id, resourceLabel: "Comptabilité / facturation électronique" });
    const acc = await accounting.accountsOf(req.query.companyId);
    const s = await SalesSettings.findOne({ company: req.query.companyId }).select("einvoicing").lean();
    res.json({ success: true, data: { accounting: acc, einvoicing: s?.einvoicing } });
  } catch (error) {
    console.error("PUT accounting settings error:", error);
    res.status(500).json({ success: false, message: "Error saving the accounting settings", error: error.message });
  }
});

router.get("/journal", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const format = String(req.query.format || "json");
    if (format !== "json" && !has(req.user, "finance.accounting.export")) return bad(res, "You don't have the permission for this action", 403);
    const { from, to } = period(req.query);
    const out = await accounting.journalEntries(req.query.companyId, from, to);
    const name = `ecritures-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}`;
    if (format === "csv" || format === "sage") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${name}${format === "sage" ? "-sage" : ""}.csv"`);
      return res.send(accounting.toCsv(out.entries, format));
    }
    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Écritures");
      ws.addRow([`Écritures comptables du ${fr(from)} au ${fr(to)}`]).font = { bold: true };
      ws.addRow(["Journal", "Date", "Pièce", "Compte", "Tiers", "Libellé", "Débit", "Crédit"]).font = { bold: true };
      for (const r of accounting.flatRows(out.entries)) ws.addRow([r.journal, new Date(r.date), r.piece, r.account, r.tiers, r.label, r.debit || null, r.credit || null]);
      ws.addRow([]);
      ws.addRow(["", "", "", "", "", "Totaux", out.totals.debit, out.totals.credit]).font = { bold: true };
      ws.getColumn(2).numFmt = "dd/mm/yyyy";
      [7, 8].forEach((c) => { ws.getColumn(c).numFmt = "#,##0.00"; ws.getColumn(c).width = 14; });
      ws.getColumn(6).width = 52;
      ws.getColumn(3).width = 16;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${name}.xlsx"`);
      await wb.xlsx.write(res);
      return res.end();
    }
    res.json({ success: true, data: { from, to, ...out } });
  } catch (error) {
    console.error("GET journal error:", error);
    res.status(500).json({ success: false, message: "Error building the journal entries", error: error.message });
  }
});

router.get("/vat", async (req, res) => {
  try {
    if (!isId(req.query.companyId)) return bad(res, "companyId is required");
    const { from, to } = period(req.query);
    const out = await accounting.vatSummary(req.query.companyId, from, to);
    if (req.query.format !== "xlsx") return res.json({ success: true, data: out });
    if (!has(req.user, "finance.accounting.export")) return bad(res, "You don't have the permission for this action", 403);
    const wb = new ExcelJS.Workbook();
    for (const [key, title] of [["encaissement", "Régime encaissements"], ["debit", "Régime débits"]]) {
      const r = out.regimes[key];
      const ws = wb.addWorksheet(title);
      ws.addRow([`Déclaration de TVA — ${title} — du ${fr(from)} au ${fr(to)}`]).font = { bold: true };
      ws.addRow([]);
      ws.addRow(["TVA collectée", "Taux", "Base HT", "TVA"]).font = { bold: true };
      r.collected.forEach((x) => ws.addRow(["", `${x.rate} %`, x.baseHT, x.vat]));
      ws.addRow(["Total collectée", "", "", r.totalCollected]).font = { bold: true };
      ws.addRow([]);
      ws.addRow(["TVA déductible (achats)", "Taux", "Base HT", "TVA"]).font = { bold: true };
      r.deductible.forEach((x) => ws.addRow(["", `${x.rate} %`, x.baseHT, x.vat]));
      ws.addRow(["Total déductible", "", "", r.totalDeductible]).font = { bold: true };
      ws.addRow([]);
      ws.addRow([r.net >= 0 ? "TVA due" : "Crédit de TVA", "", "", Math.abs(r.net)]).font = { bold: true };
      [3, 4].forEach((c) => { ws.getColumn(c).numFmt = "#,##0.00"; ws.getColumn(c).width = 16; });
      ws.getColumn(1).width = 26;
    }
    const det = wb.addWorksheet("Achats (détail)");
    det.addRow(["Fournisseur", "ICE", "Facture", "Date", "Taux", "Base HT", "TVA"]).font = { bold: true };
    out.purchaseRows.forEach((x) => det.addRow([x.supplier, x.ice || "", x.invoice, new Date(x.date), `${x.rate} %`, x.baseHT, x.vat]));
    det.getColumn(4).numFmt = "dd/mm/yyyy";
    [6, 7].forEach((c) => { det.getColumn(c).numFmt = "#,##0.00"; });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="tva-${from.toISOString().slice(0, 7)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("GET VAT summary error:", error);
    res.status(500).json({ success: false, message: "Error computing the VAT summary", error: error.message });
  }
});

module.exports = router;
