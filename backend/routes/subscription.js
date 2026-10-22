const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Tenant = require("../models/Tenant");
const Plan = require("../models/Plan");
const PlatformInvoice = require("../models/PlatformInvoice");
const { invoicePdf } = require("../services/billingService");

/**
 * /api/subscription — "Mon abonnement" for a client's administrators:
 * its plan, its status and its invoices from the platform (PDF). The
 * isolation plugin restricts PlatformInvoice to the caller's client.
 */
const router = express.Router();

router.use(auth, (req, res, next) => {
  if (!req.user?.tenant || !["admin", "owner"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Only the client's administrators see the subscription" });
  }
  return next();
});

router.get("/", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant).select("name status suspendedReason subscription limits storage").lean();
    if (!tenant) return res.status(404).json({ success: false, message: "Client not found" });
    const sub = tenant.subscription || {};
    const plan = sub.plan ? await Plan.findById(sub.plan).select("code name description monthlyPriceHT yearlyPriceHT features limits").lean() : null;
    const invoices = await PlatformInvoice.find({ status: { $ne: "draft" } })
      .select("number type status issueDate dueDate totalHT vatAmount totalTTC paidAmount periodFrom periodTo")
      .sort({ issueDate: -1 })
      .limit(100)
      .lean();
    const now = Date.now();
    const open = invoices.filter((i) => i.type === "invoice" && i.status === "issued");
    res.json({
      success: true,
      data: {
        name: tenant.name,
        status: sub.status || "none",
        cycle: sub.cycle,
        trialEndsAt: sub.trialEndsAt,
        plan,
        limits: tenant.limits,
        storage: await require("../services/storageService").usage(tenant),
        balance: Math.round(open.reduce((t, i) => t + i.totalTTC - i.paidAmount, 0) * 100) / 100,
        overdue: open.some((i) => i.dueDate && new Date(i.dueDate).getTime() < now),
        invoices: invoices.map((i) => ({ ...i, overdue: i.type === "invoice" && i.status === "issued" && i.dueDate && new Date(i.dueDate).getTime() < now })),
      },
    });
  } catch (error) {
    console.error("GET subscription error:", error);
    res.status(500).json({ success: false, message: "Error loading the subscription" });
  }
});

router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const inv = await PlatformInvoice.findOne({ _id: req.params.id, status: { $ne: "draft" } }).lean();
    if (!inv) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${inv.number}.pdf"`);
    const doc = invoicePdf(inv);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("GET subscription invoice pdf error:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
});

module.exports = router;
