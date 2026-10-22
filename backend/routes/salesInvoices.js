const express = require("express");
const notifications = require("../services/businessNotifications");
const ExcelJS = require("exceljs");
const SalesInvoice = require("../models/SalesInvoice");
const Customer = require("../models/Customer");
const Company = require("../models/Company");
const DeliveryNote = require("../models/DeliveryNote");
const flow = require("../services/salesFlowService");
const { hideMoney } = require("../middleware/hideMoney");
const auth = require("../middleware/auth");
const { guard } = require("../middleware/permissionGuard");
const { ROUTE_PERMISSIONS } = require("../config/routePermissions");
const { isId, bad, normalizeSalesLines, addDays, validationMessage } = require("../utils/salesHelpers");
const { nextNumber } = require("../services/documentNumberService");
const { amountDue, receivables, vatCollected, round2 } = require("../services/salesCalc");
const { generateInvoicePdf } = require("../services/salesPdfService");
const { fetchLogoBuffer } = require("../services/pdfHelpers");
const { sendMail, pdfToBuffer, isEmail } = require("../services/mailService");
const { logAudit } = require("../services/auditLogger");
const einvoice = require("../services/einvoiceService");
const portfolio = require("../services/portfolioService");

/**
 * ============================================================
 * CUSTOMER INVOICES — /api/sales-invoices
 * ============================================================
 * GET    /?companyId=&status=&type=&customer=&search=&overdue=true&page=
 * GET    /:id
 * POST   /                      { company, customer, type (invoice|credit_note), creditedInvoice?, moveStock?, warehouse?, date, lines, ... }
 *                                moveStock: direct invoice — the goods leave `warehouse` when it is issued
 *                                (credit note: they come back in)
 * PUT    /:id                   drafts only
 * DELETE /:id                   drafts only
 * POST   /:id/issue             gives the number (no gaps), fixes the due date
 * POST   /:id/payments          { date, amount, method, reference }
 * DELETE /:id/payments/:paymentId
 * POST   /:id/credit-note       draft credit note copying the invoice
 * POST   /:id/apply-credit      (credit note) { invoice, amount } — settles an invoice with it
 * GET    /:id/pdf · POST /:id/email
 * GET    /reports/receivables?companyId=
 * GET    /reports/vat?companyId=&from=&to=&format=xlsx
 * ============================================================
 */
const router = express.Router();
// Fine-grained permissions of every endpoint: config/routePermissions.js
router.use(auth, guard(ROUTE_PERMISSIONS.salesInvoices));
router.use(hideMoney(["unitCost", "costTotal"]));

const PREFIX = { invoice: "FA", deposit: "AC", credit_note: "AV" };
const PAYMENT_METHODS = ["virement", "cheque", "especes", "effet", "carte", "compensation", "autre"];

const DETAIL_POPULATE = [
  { path: "customer" },
  { path: "quote", select: "number subject totalHT totalTTC" },
  { path: "salesRep", select: "firstName lastName" },
  { path: "salesOrder", select: "number" },
  { path: "warehouse", select: "code name" },
  { path: "deliveryNotes", select: "number date status" },
  { path: "payments.collectedBy", select: "firstName lastName" },
  { path: "creditedInvoice", select: "number totalTTC" },
  { path: "depositInvoices", select: "number totalHT totalTTC status" },
  { path: "payments.by", select: "firstName lastName" },
];

// ---------------- reports (declared before /:id) ----------------
router.get("/reports/receivables", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const invoices = await SalesInvoice.find({ company: companyId, status: { $in: ["issued", "partially_paid", "paid"] } })
      .populate("customer", "name").lean();
    const openInvoices = invoices
      .filter((i) => amountDue(i) > 0)
      .map((i) => ({ _id: i._id, number: i.number, type: i.type, customer: i.customer, date: i.date, dueDate: i.dueDate, totalTTC: i.totalTTC, amountPaid: i.amountPaid, due: amountDue(i) }))
      .sort((a, b) => new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date));
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const collectedThisMonth = round2(invoices.flatMap((i) => i.payments || []).filter((p) => new Date(p.date) >= monthStart).reduce((s, p) => s + p.amount, 0));
    const invoicedThisMonth = round2(invoices.filter((i) => new Date(i.date) >= monthStart)
      .reduce((s, i) => s + (i.type === "credit_note" ? -1 : 1) * i.totalTTC, 0));
    res.json({ success: true, data: { ...receivables(invoices), openInvoices, collectedThisMonth, invoicedThisMonth } });
  } catch (error) {
    console.error("GET receivables error:", error);
    res.status(500).json({ success: false, message: "Error computing receivables", error: error.message });
  }
});

router.get("/reports/vat", async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    const invoices = await SalesInvoice.find({ company: companyId, status: { $in: ["issued", "partially_paid", "paid"] } })
      .populate("customer", "name ice identifiantFiscal").lean();
    const report = vatCollected(invoices, from, to);
    if (req.query.format !== "xlsx") return res.json({ success: true, data: { from, to, ...report } });

    const wb = new ExcelJS.Workbook();
    for (const [key, title] of [["onPayments", "Sur encaissements"], ["onInvoices", "Sur factures (débits)"]]) {
      const ws = wb.addWorksheet(title);
      ws.addRow([`TVA collectée ${title.toLowerCase()} — du ${from.toLocaleDateString("fr-FR")} au ${to.toLocaleDateString("fr-FR")}`]).font = { bold: true };
      ws.addRow(["Facture", "Date", "Client", "ICE client", "Taux", "Base HT", "TVA"]).font = { bold: true };
      report[key].rows.forEach((r) => ws.addRow([r.invoice, new Date(r.date), r.customer?.name || "", r.customer?.ice || "", `${r.rate}%`, r.baseHT, r.vat]));
      ws.addRow([]);
      report[key].byRate.forEach((r) => ws.addRow(["", "", "", "Total", `${r.rate}%`, r.baseHT, r.vat]).font = { bold: true });
      ws.getColumn(2).numFmt = "dd/mm/yyyy";
      [6, 7].forEach((c) => { ws.getColumn(c).numFmt = "#,##0.00"; ws.getColumn(c).width = 14; });
      ws.getColumn(3).width = 28;
      ws.getColumn(4).width = 18;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="tva-collectee.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("GET VAT collected error:", error);
    res.status(500).json({ success: false, message: "Error computing VAT collected", error: error.message });
  }
});

// ---------------- list / detail ----------------
router.get("/", async (req, res) => {
  try {
    const { companyId, status, type, customer, search, overdue, salesRep } = req.query;
    if (!isId(companyId)) return bad(res, "A valid companyId is required");
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const filter = { company: companyId, ...(await flow.repFilter(req, companyId)) };
    if (status === "unpaid") filter.status = { $in: ["issued", "partially_paid"] };
    else if (status) filter.status = status;
    if (type) filter.type = type;
    if (customer && isId(customer)) filter.customer = filter.customer ? { $in: filter.customer.$in.filter((c) => String(c) === String(customer)) } : customer;
    if (salesRep && isId(salesRep)) filter.salesRep = salesRep;
    if (overdue === "true") {
      filter.status = { $in: ["issued", "partially_paid"] };
      filter.type = { $ne: "credit_note" };
      filter.dueDate = { $lt: new Date(new Date().setHours(0, 0, 0, 0)) };
    }
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const customers = await Customer.find({ company: companyId, name: rx }).select("_id").lean();
      filter.$or = [{ number: rx }, { subject: rx }, { customer: { $in: customers.map((c) => c._id) } }];
    }
    const [invoices, total] = await Promise.all([
      SalesInvoice.find(filter).populate("customer", "name code").populate("salesRep", "firstName lastName")
        .sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      SalesInvoice.countDocuments(filter),
    ]);
    const now = new Date();
    res.json({
      success: true,
      data: invoices.map((i) => ({ ...i, due: amountDue(i), overdue: amountDue(i) > 0 && i.dueDate && new Date(i.dueDate) < now })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("GET sales invoices error:", error);
    res.status(500).json({ success: false, message: "Error loading invoices", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id).populate(DETAIL_POPULATE);
    if (!invoice) return bad(res, "Invoice not found", 404);
    const creditNotes = invoice.type === "credit_note" ? [] : await SalesInvoice.find({ creditedInvoice: invoice._id, status: { $ne: "cancelled" } })
      .select("number status totalTTC").lean();
    if (!flow.canSeeCustomer(req, invoice.customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    res.json({ success: true, data: { ...invoice.toObject(), due: amountDue(invoice), creditNotes, margin: Math.round(((invoice.totalHT || 0) - (invoice.costTotal || 0)) * 100) / 100 } });
  } catch (error) {
    console.error("GET sales invoice error:", error);
    res.status(500).json({ success: false, message: "Error loading the invoice", error: error.message });
  }
});

// ---------------- create / edit / delete (drafts) ----------------
router.post("/", async (req, res) => {
  try {
    const { company } = req.body;
    if (!isId(company) || !(await Company.exists({ _id: company }))) return bad(res, "A valid company is required");
    const type = req.body.type === "credit_note" ? "credit_note" : "invoice";
    const customer = isId(req.body.customer) ? await Customer.findOne({ _id: req.body.customer, company }) : null;
    if (!customer) return bad(res, "Choose a customer");
    if (!flow.canSeeCustomer(req, customer)) return bad(res, "This customer is assigned to another sales rep", 403);
    const { lines, error } = await normalizeSalesLines(await flow.priceLines(req.body.lines || [], customer, company), company);
    if (error) return bad(res, error);
    if (type === "invoice") await flow.checkFloors(req, lines, company);
    let creditedInvoice = null;
    if (type === "credit_note" && req.body.creditedInvoice) {
      if (!isId(req.body.creditedInvoice)) return bad(res, "Invalid invoice");
      const orig = await SalesInvoice.findOne({ _id: req.body.creditedInvoice, company, type: { $ne: "credit_note" } }).select("_id");
      if (!orig) return bad(res, "Invoice to credit not found");
      creditedInvoice = orig._id;
    }
    // Direct invoice: the customer's "direct" flow by default.
    const moveStock = req.body.moveStock !== undefined ? !!req.body.moveStock : type === "invoice" && customer.documentFlow === "direct";
    const invoice = await SalesInvoice.create({
      company,
      type,
      customer: req.body.customer,
      creditedInvoice,
      salesRep: customer.salesRep || null,
      moveStock,
      warehouse: isId(req.body.warehouse) ? req.body.warehouse : customer.defaultWarehouse || null,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      dueDate: req.body.dueDate || null,
      subject: req.body.subject,
      lines,
      paymentTerms: req.body.paymentTerms,
      notes: req.body.notes,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: await SalesInvoice.findById(invoice._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code, issues: error.issues });
    console.error("POST sales invoice error:", error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: validationMessage(error, "Error creating the invoice") });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (invoice.status !== "draft") return bad(res, "An issued invoice can't be changed — make a credit note");
    if (req.body.lines !== undefined) {
      if ((invoice.deliveryNotes || []).length) return bad(res, "This invoice comes from delivery notes — its lines follow the BLs");
      const customer = await Customer.findById(invoice.customer);
      const { lines, error } = await normalizeSalesLines(await flow.priceLines(req.body.lines, customer, invoice.company), invoice.company);
      if (error) return bad(res, error);
      if (invoice.type === "invoice") await flow.checkFloors(req, lines, invoice.company);
      invoice.lines = lines;
    }
    if (req.body.moveStock !== undefined && !(invoice.deliveryNotes || []).length) invoice.moveStock = !!req.body.moveStock;
    if (req.body.warehouse !== undefined) invoice.warehouse = isId(req.body.warehouse) ? req.body.warehouse : null;
    if (req.body.customer !== undefined) {
      if (!isId(req.body.customer) || !(await Customer.exists({ _id: req.body.customer, company: invoice.company }))) return bad(res, "Choose a customer");
      invoice.customer = req.body.customer;
    }
    for (const f of ["subject", "paymentTerms", "notes"]) if (req.body[f] !== undefined) invoice[f] = req.body[f];
    if (req.body.date !== undefined) invoice.date = req.body.date;
    if (req.body.dueDate !== undefined) invoice.dueDate = req.body.dueDate || null;
    invoice.updatedBy = req.user.id;
    await invoice.save();
    res.json({ success: true, data: await SalesInvoice.findById(invoice._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code, issues: error.issues });
    console.error("PUT sales invoice error:", error);
    res.status(error.name === "ValidationError" ? 400 : 500).json({ success: false, message: validationMessage(error, "Error updating the invoice") });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (invoice.status !== "draft") return bad(res, "An issued invoice can't be deleted — make a credit note");
    // Its BLs go back to "to invoice".
    await DeliveryNote.updateMany({ invoice: invoice._id }, { $set: { invoice: null } });
    await invoice.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE sales invoice error:", error);
    res.status(500).json({ success: false, message: "Error deleting the invoice", error: error.message });
  }
});

// ---------------- issue ----------------
router.post("/:id/issue", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (invoice.status !== "draft") return bad(res, "This invoice is already issued");
    if (!(invoice.totalTTC > 0)) return bad(res, "The invoice total must be positive");

    const prefix = PREFIX[invoice.type];
    // Numbers must follow the dates: an invoice can't be dated before
    // the last one already issued in the same series.
    const last = await SalesInvoice.findOne({ company: invoice.company, type: invoice.type, number: { $type: "string" } })
      .sort({ date: -1 }).select("date number").lean();
    const date = new Date(invoice.date);
    if (last && new Date(last.date).setHours(0, 0, 0, 0) > new Date(date).setHours(0, 0, 0, 0)) {
      return bad(res, `The date can't be before the last issued one (${last.number}, ${new Date(last.date).toLocaleDateString("fr-FR")}): change the date.`);
    }
    if (invoice.type === "invoice" && invoice.quote) {
      const draftDeposit = await SalesInvoice.exists({ quote: invoice.quote, type: "deposit", status: "draft" });
      if (draftDeposit) return bad(res, "A deposit invoice of this devis is still a draft: issue or delete it first");
    }
    if (!invoice.dueDate && invoice.type !== "credit_note") {
      const customer = await Customer.findById(invoice.customer).select("paymentDays").lean();
      invoice.dueDate = addDays(date, customer?.paymentDays ?? 60);
    }

    // A direct invoice to a known customer goes through the credit check.
    if (invoice.type === "invoice" && invoice.moveStock && !invoice.posSale) {
      const customer = await Customer.findById(invoice.customer);
      await flow.checkCredit(req, customer, invoice.totalTTC, { override: !!req.body?.override });
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
      invoice.number = await nextNumber(SalesInvoice, invoice.company, prefix, date);
      invoice.status = "issued";
      invoice.issuedAt = new Date();
      invoice.updatedBy = req.user.id;
      try {
        await invoice.save();
        break;
      } catch (error) {
        if (error.code !== 11000 || attempt === 4) throw error;
      }
    }
    // Direct invoice / credit note with return: the stock moves now. If it
    // can't (not enough stock), the invoice goes back to draft — no gap in
    // numbers since nothing was printed.
    if (invoice.moveStock && !invoice.stockMovedAt) {
      try {
        await flow.moveInvoiceStock(invoice, req.user.id);
        await invoice.save();
      } catch (err) {
        await SalesInvoice.updateOne({ _id: invoice._id }, { $set: { status: "draft", number: null, issuedAt: null } });
        throw err;
      }
    }
    await logAudit(req, { company: invoice.company, action: "create", resourceType: "SalesInvoice", resourceId: invoice._id, resourceLabel: `${invoice.number} émise (${invoice.totalTTC} MAD TTC)` });
    await einvoice.afterIssue(invoice); // DGI clearance when the company enabled auto-submit
    res.json({ success: true, data: await SalesInvoice.findById(invoice._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code });
    console.error("POST issue invoice error:", error);
    res.status(500).json({ success: false, message: "Error issuing the invoice", error: error.message });
  }
});

// ---------------- e-invoicing (DGI) ----------------
// GET  /:id/einvoice          legal check + the UBL XML that would be sent
// GET  /:id/ubl              download the UBL XML
// POST /:id/einvoice          submit to the platform (clearance)
// POST /:id/einvoice/refresh  ask again for a pending one
const einvoiceError = (res, error, message) => {
  if (error.status) return res.status(error.status).json({ success: false, message: error.message, check: error.check });
  console.error(message, error);
  return res.status(500).json({ success: false, message, error: error.message });
};

router.get("/:id/einvoice", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const out = await einvoice.preview(req.params.id);
    const inv = await SalesInvoice.findById(req.params.id).select("einvoice").lean();
    res.json({ success: true, data: { ...out, einvoice: inv?.einvoice || null } });
  } catch (error) {
    einvoiceError(res, error, "Error preparing the e-invoice");
  }
});

router.get("/:id/ubl", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const { xml, number } = await einvoice.preview(req.params.id);
    if (!xml) return bad(res, "Issue the invoice first");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${String(number).replace(/[^\w.-]/g, "_")}.xml"`);
    res.send(xml);
  } catch (error) {
    einvoiceError(res, error, "Error building the UBL file");
  }
});

router.post("/:id/einvoice", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const out = await einvoice.submit(req.params.id, { force: req.body?.force === true });
    const inv = await SalesInvoice.findById(req.params.id).lean();
    await logAudit(req, { company: inv.company, action: "update", resourceType: "SalesInvoice", resourceId: inv._id, resourceLabel: `${inv.number} transmise (${out.einvoice.status})` });
    res.json({ success: true, data: out });
  } catch (error) {
    einvoiceError(res, error, "Error submitting the e-invoice");
  }
});

router.post("/:id/einvoice/refresh", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    res.json({ success: true, data: await einvoice.refresh(req.params.id) });
  } catch (error) {
    einvoiceError(res, error, "Error refreshing the e-invoice");
  }
});

// ---------------- payments ----------------
router.post("/:id/payments", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (!["issued", "partially_paid"].includes(invoice.status)) return bad(res, "Only an issued, unpaid invoice can receive a payment");
    const amount = Math.round(Number(req.body.amount) * 100) / 100;
    if (!(amount > 0)) return bad(res, "Enter the amount received");
    const remaining = Math.round((invoice.totalTTC - invoice.amountPaid) * 100) / 100;
    if (amount > remaining + 0.009) return bad(res, `Only ${remaining.toFixed(2)} MAD remain to be paid on this ${invoice.type === "credit_note" ? "credit note" : "invoice"}`);
    const method = PAYMENT_METHODS.includes(req.body.method) ? req.body.method : "virement";
    invoice.payments.push({
      date: req.body.date ? new Date(req.body.date) : new Date(),
      amount,
      method,
      reference: req.body.reference,
      notes: req.body.notes,
      dueDate: req.body.dueDate || null,
      collectedBy: isId(req.body.collectedBy) ? req.body.collectedBy : invoice.salesRep || null,
      by: req.user.id,
    });
    invoice.updatedBy = req.user.id;
    await invoice.save();
    // Cheque / LCN: into the portfolio (due date, bank deposit, unpaid)
    await portfolio.onPayment(invoice, invoice.payments[invoice.payments.length - 1], { bank: req.body.bank, drawer: req.body.drawer });
    await notifications.onPaymentRecorded(invoice, amount, req.user.id);
    res.status(201).json({ success: true, data: await SalesInvoice.findById(invoice._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    console.error("POST invoice payment error:", error);
    res.status(500).json({ success: false, message: "Error recording the payment", error: error.message });
  }
});

router.delete("/:id/payments/:paymentId", async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.paymentId)) return bad(res, "Invalid ID");
    const invoice = await SalesInvoice.findById(req.params.id);
    if (!invoice) return bad(res, "Invoice not found", 404);
    const payment = invoice.payments.id(req.params.paymentId);
    if (!payment) return bad(res, "Payment not found", 404);
    if (payment.method === "autre" && /^AV-/.test(payment.reference || "")) {
      return bad(res, "This payment comes from a credit note — remove it from the credit note instead");
    }
    try {
      await portfolio.beforePaymentDeleted(invoice, payment._id);
    } catch (e) {
      return bad(res, e.message, e.status || 400);
    }
    payment.deleteOne();
    if (invoice.status === "paid" || invoice.status === "partially_paid") invoice.status = "issued";
    invoice.updatedBy = req.user.id;
    await invoice.save();
    res.json({ success: true, data: await SalesInvoice.findById(invoice._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    console.error("DELETE invoice payment error:", error);
    res.status(500).json({ success: false, message: "Error removing the payment", error: error.message });
  }
});

// ---------------- credit notes ----------------
router.post("/:id/credit-note", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const orig = await SalesInvoice.findById(req.params.id);
    if (!orig) return bad(res, "Invoice not found", 404);
    if (orig.type === "credit_note" || !["issued", "partially_paid", "paid"].includes(orig.status)) {
      return bad(res, "Only an issued invoice can be credited");
    }
    const credit = await SalesInvoice.create({
      company: orig.company,
      type: "credit_note",
      customer: orig.customer,
      quote: orig.quote,
      salesRep: orig.salesRep,
      creditedInvoice: orig._id,
      // returnToStock: the goods come back to the warehouse when the credit note is issued.
      moveStock: !!req.body?.returnToStock,
      warehouse: isId(req.body?.warehouse) ? req.body.warehouse : orig.warehouse || null,
      date: new Date(),
      subject: `Avoir sur facture ${orig.number}`,
      lines: orig.lines.map((l) => {
        const { _id, ...rest } = l.toObject();
        return rest;
      }),
      depositBreakdown: orig.depositBreakdown,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    res.status(201).json({ success: true, data: credit });
  } catch (error) {
    console.error("POST credit note error:", error);
    res.status(500).json({ success: false, message: "Error creating the credit note", error: error.message });
  }
});

router.post("/:id/apply-credit", async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.body.invoice)) return bad(res, "Invalid ID");
    const credit = await SalesInvoice.findById(req.params.id);
    if (!credit || credit.type !== "credit_note") return bad(res, "Credit note not found", 404);
    if (!["issued", "partially_paid"].includes(credit.status)) return bad(res, "Issue the credit note first — or it's already fully used");
    const invoice = await SalesInvoice.findOne({ _id: req.body.invoice, company: credit.company, customer: credit.customer, type: { $ne: "credit_note" } });
    if (!invoice) return bad(res, "Invoice of the same customer not found");
    if (!["issued", "partially_paid"].includes(invoice.status)) return bad(res, "That invoice has nothing left to pay");
    const available = Math.round((credit.totalTTC - credit.amountPaid) * 100) / 100;
    const due = Math.round((invoice.totalTTC - invoice.amountPaid) * 100) / 100;
    const amount = Math.round(Math.min(Number(req.body.amount) || Math.min(available, due), available, due) * 100) / 100;
    if (!(amount > 0)) return bad(res, "Nothing to apply");
    const now = new Date();
    invoice.payments.push({ date: now, amount, method: "autre", reference: credit.number, notes: "Imputation d'avoir", by: req.user.id });
    credit.payments.push({ date: now, amount, method: "autre", reference: invoice.number, notes: "Imputé sur facture", by: req.user.id });
    await invoice.save();
    await credit.save();
    res.json({ success: true, data: await SalesInvoice.findById(credit._id).populate(DETAIL_POPULATE) });
  } catch (error) {
    console.error("POST apply credit error:", error);
    res.status(500).json({ success: false, message: "Error applying the credit note", error: error.message });
  }
});

// ---------------- PDF & email ----------------
async function renderPdf(invoice) {
  const company = await Company.findById(invoice.company);
  const logoBuffer = await fetchLogoBuffer(company);
  return {
    company,
    doc: generateInvoicePdf({ invoice, company, customer: invoice.customer, quote: invoice.quote, creditedInvoice: invoice.creditedInvoice, logoBuffer, deliveryNotes: invoice.deliveryNotes || [] }),
  };
}

router.get("/:id/pdf", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id).populate(DETAIL_POPULATE);
    if (!invoice) return bad(res, "Invoice not found", 404);
    const { doc } = await renderPdf(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.number || "facture-brouillon"}.pdf"`);
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("GET invoice pdf error:", error);
    res.status(500).json({ success: false, message: "Error generating the PDF", error: error.message });
  }
});

router.post("/:id/email", async (req, res) => {
  try {
    if (!isId(req.params.id)) return bad(res, "Invalid invoice ID");
    const invoice = await SalesInvoice.findById(req.params.id).populate(DETAIL_POPULATE);
    if (!invoice) return bad(res, "Invoice not found", 404);
    if (invoice.status === "draft" || invoice.status === "cancelled") return bad(res, "Issue the invoice before sending it");
    const to = String(req.body?.to || "").trim();
    const cc = String(req.body?.cc || "").trim();
    if (!isEmail(to)) return bad(res, "Enter a valid recipient email");
    if (cc && !cc.split(",").every((x) => isEmail(x.trim()))) return bad(res, "Invalid CC email");
    const { company, doc } = await renderPdf(invoice);
    const pdf = await pdfToBuffer(doc);
    const kind = invoice.type === "credit_note" ? "Avoir" : invoice.type === "deposit" ? "Facture d'acompte" : "Facture";
    const subject = `${kind} ${invoice.number} — ${company.name}`;
    const text = String(req.body?.message || "").trim()
      || `Bonjour,\n\nVeuillez trouver ci-joint notre ${kind.toLowerCase()} ${invoice.number} d'un montant de ${invoice.totalTTC.toFixed(2)} MAD TTC${invoice.dueDate && invoice.type !== "credit_note" ? `, payable avant le ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}` : ""}.\n\nCordialement,\n${company.name}`;
    const result = await sendMail(
      { to, cc, subject, text, attachments: [{ filename: `${invoice.number}.pdf`, content: pdf, contentType: "application/pdf" }] },
      { company: company._id, relatedType: "SalesInvoice", relatedId: invoice._id, sentBy: req.user.id }
    );
    res.json({ success: true, simulated: result.status === "simulated" });
  } catch (error) {
    console.error("POST invoice email error:", error);
    res.status(502).json({ success: false, message: `The email could not be sent: ${error.message}` });
  }
});

module.exports = router;
