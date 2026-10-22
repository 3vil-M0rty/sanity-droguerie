/**
 * ============================================================
 * UBL 2.1 — the invoice as a structured XML document
 * ============================================================
 * Morocco's e-invoicing (CGI art. 145-IX, Loi de Finances 2024) works by
 * clearance: each invoice is sent as a structured file (UBL / CII) to the
 * DGI platform, which validates it before it is valid. This builds the
 * UBL 2.1 Invoice (or CreditNote) from a Sanity invoice:
 *
 *   seller / buyer  name, ICE, IF, RC, taxe professionnelle, address
 *   lines           quantity + UN/ECE unit code, price, discount, VAT
 *   totals          per VAT rate, HT, TTC, deposits already invoiced
 *   payment         due date, terms, RIB
 *
 * The DGI's own profile (CustomizationID, any extra mandatory fields) is
 * set by EINVOICE_CUSTOMIZATION_ID once the official specification is
 * published; the structure here is plain UBL 2.1 and validates against
 * the OASIS schema.
 * ============================================================
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const amt = (n) => round2(n).toFixed(2);
const esc = (v) => String(v ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const digits = (v) => String(v || "").replace(/\D/g, "");

// Base units → UN/ECE Recommendation 20 codes.
const UNIT_CODES = { "pièce": "H87", piece: "H87", pce: "H87", m: "MTR", "m²": "MTK", m2: "MTK", kg: "KGM", l: "LTR", sac: "BG", seau: "BJ", pot: "CA", "boîte": "BX", boite: "BX", rouleau: "RO", couronne: "RO", barre: "BR", cartouche: "CQ", lot: "LO", carton: "CT", palette: "PF" };
const unitCode = (u) => UNIT_CODES[String(u || "").toLowerCase()] || "C62";

const LEGAL_VAT_RATES = [0, 7, 10, 14, 20];

function lineHT(l) {
  return round2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100));
}

/** Legal checks before sending (errors block, warnings inform). */
function validateForEInvoice(invoice, company, customer) {
  const errors = [];
  const warnings = [];
  if (!invoice?.number) errors.push("La facture n'est pas encore émise (pas de numéro).");
  if (!company?.name) errors.push("Raison sociale de l'entreprise manquante.");
  if (!/^\d{15}$/.test(digits(company?.ice))) errors.push("ICE de l'entreprise manquant ou invalide (15 chiffres) — Organisation › Entreprise.");
  if (!company?.taxId) errors.push("Identifiant fiscal (IF) de l'entreprise manquant — Organisation › Entreprise.");
  if (!company?.registrationNumber) errors.push("Registre de commerce (RC) de l'entreprise manquant — Organisation › Entreprise.");
  if (!company?.address?.city) errors.push("Ville de l'entreprise manquante — Organisation › Entreprise.");
  if (!company?.professionalTaxNumber) warnings.push("Numéro de taxe professionnelle (patente) non renseigné.");
  if (!customer?.name) errors.push("Nom du client manquant.");
  const b2b = customer && customer.type !== "walk_in" && customer.kind !== "individual";
  if (b2b && !/^\d{15}$/.test(digits(customer.ice))) errors.push(`ICE du client « ${customer.name} » manquant ou invalide (15 chiffres) — fiche client.`);
  if (!b2b && !customer?.ice) warnings.push("Client particulier sans ICE : facture B2C.");
  if (!(invoice?.lines || []).length) errors.push("La facture n'a aucune ligne.");
  for (const [i, l] of (invoice?.lines || []).entries()) {
    if (!LEGAL_VAT_RATES.includes(Number(l.vatRate))) errors.push(`Ligne ${i + 1} : taux de TVA ${l.vatRate} % non légal au Maroc.`);
    if (!(Number(l.quantity) > 0) && invoice.type !== "credit_note") errors.push(`Ligne ${i + 1} : quantité nulle.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

function party(tag, p) {
  const ids = [
    p.ice && `<cac:PartyIdentification><cbc:ID schemeID="ICE">${esc(digits(p.ice))}</cbc:ID></cac:PartyIdentification>`,
    p.taxId && `<cac:PartyIdentification><cbc:ID schemeID="IF">${esc(p.taxId)}</cbc:ID></cac:PartyIdentification>`,
    p.rc && `<cac:PartyIdentification><cbc:ID schemeID="RC">${esc(p.rc)}</cbc:ID></cac:PartyIdentification>`,
    p.patente && `<cac:PartyIdentification><cbc:ID schemeID="TP">${esc(p.patente)}</cbc:ID></cac:PartyIdentification>`,
  ].filter(Boolean).join("");
  return `<cac:${tag}><cac:Party>${ids}<cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>`
    + `<cac:PostalAddress>${p.street ? `<cbc:StreetName>${esc(p.street)}</cbc:StreetName>` : ""}${p.city ? `<cbc:CityName>${esc(p.city)}</cbc:CityName>` : ""}`
    + `<cac:Country><cbc:IdentificationCode>MA</cbc:IdentificationCode></cac:Country></cac:PostalAddress>`
    + `${p.taxId ? `<cac:PartyTaxScheme><cbc:CompanyID>${esc(p.taxId)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}`
    + `<cac:PartyLegalEntity><cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName>${p.ice ? `<cbc:CompanyID schemeID="ICE">${esc(digits(p.ice))}</cbc:CompanyID>` : ""}</cac:PartyLegalEntity>`
    + `${p.email || p.phone ? `<cac:Contact>${p.phone ? `<cbc:Telephone>${esc(p.phone)}</cbc:Telephone>` : ""}${p.email ? `<cbc:ElectronicMail>${esc(p.email)}</cbc:ElectronicMail>` : ""}</cac:Contact>` : ""}`
    + `</cac:Party></cac:${tag}>`;
}

const taxCategory = (rate) => `<cac:TaxCategory><cbc:ID>${Number(rate) > 0 ? "S" : "Z"}</cbc:ID><cbc:Percent>${amt(rate)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>`;

/**
 * UBL XML of an issued invoice / credit note.
 * company: Company doc; customer: Customer doc; credited: the invoice a
 * credit note refers to (number, date), if any.
 */
function buildUbl(invoice, company, customer, { credited = null, currency = "MAD" } = {}) {
  const isCredit = invoice.type === "credit_note";
  const root = isCredit ? "CreditNote" : "Invoice";
  const ns = isCredit ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
  const cur = esc(currency);
  const seller = {
    name: company.name, ice: company.ice, taxId: company.taxId, rc: company.registrationNumber, patente: company.professionalTaxNumber,
    street: [company.address?.street, company.address?.additionalLine].filter(Boolean).join(", "), city: company.address?.city, email: company.email, phone: company.phone,
  };
  const buyer = {
    name: customer.name, ice: customer.ice, taxId: customer.identifiantFiscal, rc: customer.rc,
    street: customer.address, city: customer.city, email: customer.email, phone: customer.phone,
  };
  const lines = (invoice.lines || []).map((l, i) => {
    const ht = lineHT(l);
    const gross = round2((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
    const discount = round2(gross - ht);
    const qtyTag = isCredit ? "CreditedQuantity" : "InvoicedQuantity";
    return `<cac:${root}Line><cbc:ID>${i + 1}</cbc:ID>`
      + `<cbc:${qtyTag} unitCode="${unitCode(l.unit)}">${Number(l.quantity) || 0}</cbc:${qtyTag}>`
      + `<cbc:LineExtensionAmount currencyID="${cur}">${amt(ht)}</cbc:LineExtensionAmount>`
      + (discount > 0 ? `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:AllowanceChargeReason>Remise ${Number(l.discount)} %</cbc:AllowanceChargeReason><cbc:Amount currencyID="${cur}">${amt(discount)}</cbc:Amount></cac:AllowanceCharge>` : "")
      + `<cac:Item><cbc:Description>${esc(l.description)}</cbc:Description><cbc:Name>${esc(String(l.description || "").slice(0, 120))}</cbc:Name>`
      + (l.reference ? `<cac:SellersItemIdentification><cbc:ID>${esc(l.reference)}</cbc:ID></cac:SellersItemIdentification>` : "")
      + `<cac:ClassifiedTaxCategory><cbc:ID>${Number(l.vatRate) > 0 ? "S" : "Z"}</cbc:ID><cbc:Percent>${amt(l.vatRate)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>`
      + `<cac:Price><cbc:PriceAmount currencyID="${cur}">${amt(l.unitPrice)}</cbc:PriceAmount><cbc:BaseQuantity unitCode="${unitCode(l.unit)}">1</cbc:BaseQuantity></cac:Price>`
      + `</cac:${root}Line>`;
  }).join("");
  const linesHT = round2((invoice.lines || []).reduce((s, l) => s + lineHT(l), 0));
  const deposits = round2(invoice.depositsDeductedHT || 0);
  const subtotals = (invoice.vatBreakdown || []).map((r) => `<cac:TaxSubtotal><cbc:TaxableAmount currencyID="${cur}">${amt(r.baseHT)}</cbc:TaxableAmount><cbc:TaxAmount currencyID="${cur}">${amt(r.vat)}</cbc:TaxAmount>${taxCategory(r.rate)}</cac:TaxSubtotal>`).join("");
  const rib = company.bank?.rib || company.bank?.iban;
  const typeCode = isCredit ? `<cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>` : `<cbc:InvoiceTypeCode>${invoice.type === "deposit" ? "386" : "380"}</cbc:InvoiceTypeCode>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<${root} xmlns="${ns}" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">`
    + `<cbc:UBLVersionID>2.1</cbc:UBLVersionID>`
    + `<cbc:CustomizationID>${esc(process.env.EINVOICE_CUSTOMIZATION_ID || "urn:ma:dgi:einvoice:ubl:2.1")}</cbc:CustomizationID>`
    + `<cbc:ID>${esc(invoice.number)}</cbc:ID>`
    + `<cbc:IssueDate>${day(invoice.date)}</cbc:IssueDate>`
    + (!isCredit && invoice.dueDate ? `<cbc:DueDate>${day(invoice.dueDate)}</cbc:DueDate>` : "")
    + typeCode
    + (invoice.subject ? `<cbc:Note>${esc(invoice.subject)}</cbc:Note>` : "")
    + `<cbc:DocumentCurrencyCode>${cur}</cbc:DocumentCurrencyCode>`
    + (credited ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${esc(credited.number)}</cbc:ID><cbc:IssueDate>${day(credited.date)}</cbc:IssueDate></cac:InvoiceDocumentReference></cac:BillingReference>` : "")
    + party("AccountingSupplierParty", seller)
    + party("AccountingCustomerParty", buyer)
    + (!isCredit ? `<cac:PaymentMeans><cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>${invoice.dueDate ? `<cbc:PaymentDueDate>${day(invoice.dueDate)}</cbc:PaymentDueDate>` : ""}${rib ? `<cac:PayeeFinancialAccount><cbc:ID>${esc(rib)}</cbc:ID>${company.bank?.bankName ? `<cbc:Name>${esc(company.bank.bankName)}</cbc:Name>` : ""}</cac:PayeeFinancialAccount>` : ""}</cac:PaymentMeans>` : "")
    + (invoice.paymentTerms ? `<cac:PaymentTerms><cbc:Note>${esc(invoice.paymentTerms)}</cbc:Note></cac:PaymentTerms>` : "")
    + (deposits > 0 ? `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator><cbc:AllowanceChargeReason>Acomptes déjà facturés</cbc:AllowanceChargeReason><cbc:Amount currencyID="${cur}">${amt(deposits)}</cbc:Amount></cac:AllowanceCharge>` : "")
    + `<cac:TaxTotal><cbc:TaxAmount currencyID="${cur}">${amt(invoice.totalVAT)}</cbc:TaxAmount>${subtotals}</cac:TaxTotal>`
    + `<cac:LegalMonetaryTotal>`
    + `<cbc:LineExtensionAmount currencyID="${cur}">${amt(linesHT)}</cbc:LineExtensionAmount>`
    + `<cbc:TaxExclusiveAmount currencyID="${cur}">${amt(invoice.totalHT)}</cbc:TaxExclusiveAmount>`
    + `<cbc:TaxInclusiveAmount currencyID="${cur}">${amt(invoice.totalTTC)}</cbc:TaxInclusiveAmount>`
    + (deposits > 0 ? `<cbc:AllowanceTotalAmount currencyID="${cur}">${amt(deposits)}</cbc:AllowanceTotalAmount>` : "")
    + `<cbc:PayableAmount currencyID="${cur}">${amt(invoice.totalTTC)}</cbc:PayableAmount>`
    + `</cac:LegalMonetaryTotal>`
    + lines
    + `</${root}>\n`;
}

module.exports = { buildUbl, validateForEInvoice, unitCode, LEGAL_VAT_RATES };
