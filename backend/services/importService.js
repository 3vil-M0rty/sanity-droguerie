const ExcelJS = require("exceljs");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const InventoryCategory = require("../models/InventoryCategory");
const Customer = require("../models/Customer");
const Warehouse = require("../models/Warehouse");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const pricing = require("./pricingService");
const stock = require("./stockService");

/**
 * ============================================================
 * EXCEL IMPORT — articles, customers, opening stock
 * ============================================================
 * Onboarding a wholesaler means thousands of articles and hundreds of
 * customers. Each import works in two steps:
 *
 *   preview(kind, buffer)  reads the sheet, recognises the columns by
 *                          their header (French or English, accents and
 *                          case ignored), checks every row and says what
 *                          will happen: create / update / error, per line.
 *   commit(kind, buffer)   does it — rows with errors are skipped and
 *                          reported; nothing else is half-written.
 *
 * Articles are matched by reference (else barcode), customers by code
 * (else ICE, else exact name): re-importing a corrected file updates
 * instead of duplicating. Opening stock goes through stockService.receive
 * (source "opening"), so CMUP, lots and serial numbers are right.
 * ============================================================
 */

const MAX_ROWS = 20000;
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

// column key → accepted headers (normalised)
const COLUMNS = {
  articles: {
    reference: ["reference", "ref", "reference interne", "code article", "code"],
    name: ["designation", "nom", "libelle", "article", "name", "description"],
    family: ["famille", "categorie", "family", "category"],
    brand: ["marque", "brand"],
    barcode: ["code barres", "code barre", "ean", "barcode", "gencod"],
    manufacturerReference: ["ref fabricant", "reference fabricant", "manufacturer ref"],
    unit: ["unite", "unit", "unite de base"],
    vatRate: ["tva", "taux tva", "vat"],
    sellingPrice: ["prix public ht", "prix public", "prix de vente ht", "prix vente", "public price"],
    minSellingPrice: ["prix plancher", "floor price"],
    threshold: ["stock min", "stock minimum", "minimum", "seuil"],
    maxQuantity: ["stock max", "stock maximum", "maximum"],
    tracking: ["tracabilite", "suivi", "tracking"],
    shelfLifeDays: ["duree de vie", "duree de vie jours", "shelf life"],
    packaging: ["conditionnement", "carton", "packaging"],
    imageUrl: ["photo", "image", "url photo", "lien photo"],
    purchasePrice: ["prix d achat", "prix achat ht", "prix d achat ht", "cout", "purchase price"],
    supplier: ["fournisseur", "supplier"],
    supplierReference: ["ref fournisseur", "reference fournisseur"],
    weightKg: ["poids", "poids kg", "weight"],
  },
  customers: {
    code: ["code", "code client"],
    name: ["nom", "raison sociale", "client", "name"],
    type: ["type", "categorie"],
    priceLevel: ["niveau de prix", "niveau", "tarif", "price level"],
    ice: ["ice"],
    identifiantFiscal: ["if", "identifiant fiscal"],
    rc: ["rc", "registre de commerce"],
    phone: ["telephone", "tel", "gsm", "phone", "whatsapp"],
    email: ["e mail", "email", "mail"],
    address: ["adresse", "address"],
    city: ["ville", "city"],
    zone: ["zone", "secteur", "tournee"],
    salesRep: ["commercial", "representant", "sales rep"],
    creditLimit: ["plafond", "plafond de credit", "encours max", "credit limit"],
    paymentDays: ["delai de paiement", "delai", "jours", "payment days"],
    documentFlow: ["circuit", "circuit documentaire"],
    discountPercent: ["remise", "remise client", "remise %", "discount"],
  },
  stock: {
    reference: ["reference", "ref", "code article", "code"],
    barcode: ["code barres", "code barre", "ean", "barcode"],
    warehouse: ["depot", "code depot", "magasin", "warehouse"],
    quantity: ["quantite", "qte", "quantity", "stock"],
    unitCost: ["cout unitaire", "cout unitaire ht", "prix d achat", "cmup", "unit cost", "cout"],
    lot: ["lot", "n de lot", "numero de lot"],
    expiryDate: ["peremption", "date de peremption", "dlc", "expiry"],
    serials: ["n de serie", "numeros de serie", "serie", "serials"],
  },
};
const REQUIRED = { articles: ["reference", "name", "family"], customers: ["name"], stock: ["warehouse", "quantity"] };

const TEMPLATE_HEADERS = {
  articles: ["Référence", "Désignation", "Famille", "Marque", "Code-barres", "Réf. fabricant", "Unité", "TVA", "Prix public HT", "Prix plancher", "Stock min", "Stock max", "Traçabilité", "Conditionnement", "Photo", "Prix d'achat HT", "Fournisseur", "Réf. fournisseur", "Poids kg"],
  customers: ["Code", "Nom", "Type", "Niveau de prix", "ICE", "IF", "RC", "Téléphone", "E-mail", "Adresse", "Ville", "Zone", "Commercial", "Plafond de crédit", "Délai de paiement", "Circuit", "Remise %"],
  stock: ["Référence", "Code-barres", "Dépôt", "Quantité", "Coût unitaire HT", "Lot", "Péremption", "N° de série"],
};
const TEMPLATE_EXAMPLES = {
  articles: [["GRO-ES-LAV", "Mitigeur lavabo Eurosmart chromé", "Sanitaire > Robinetterie", "Grohe", "4005176000001", "33265002", "pièce", 20, 780, 650, 10, 60, "aucune", "Carton:6:4005176000018", "https://exemple.ma/photos/mitigeur.jpg", 520, "Grohe Maroc", "GR-33265", 1.2]],
  customers: [["CL-0100", "Quincaillerie Al Amal", "revendeur", "P1", "001534000000012", "40123456", "RC 98765", "0661 23 45 67", "contact@alamal.ma", "12 rue Ibn Batouta", "Casablanca", "Casa Est", "karim@societe.ma", 80000, 60, "complet", 0]],
  stock: [["GRO-ES-LAV", "", "CASA", 40, 520, "", "", ""], ["COL-ACR-4", "", "CASA", 120, 85, "L2026-A", "2027-06-30", ""]],
};
const NOTES = {
  articles: [
    "Famille : « Famille > Sous-famille » — créée si elle n'existe pas. Marque créée si besoin.",
    "TVA : 0, 7, 10, 14 ou 20. Traçabilité : aucune, lot, lot+péremption, série.",
    "Conditionnement : Unité:quantité:code-barres, plusieurs séparés par « ; » (ex. Carton:12:611…; Palette:480).",
    "Les colonnes P1, P2, P3, P4 (codes de vos niveaux de prix) donnent un prix propre par niveau.",
    "Une référence déjà connue met l'article à jour.",
  ],
  customers: [
    "Type : revendeur, installateur, entreprise, particulier. Circuit : complet (commande → BL → facture) ou direct.",
    "Commercial : e-mail ou nom de l'utilisateur. Un code déjà connu met le client à jour (sinon ICE, sinon nom exact).",
  ],
  stock: [
    "Stock d'ouverture : ajouté au stock du dépôt au coût indiqué (sinon CMUP actuel).",
    "Articles suivis par lot : une ligne par lot (Lot + Péremption). Par n° de série : la liste séparée par des virgules.",
  ],
};

async function template(kind, companyId) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet({ articles: "Articles", customers: "Clients", stock: "Stock d'ouverture" }[kind]);
  let headers = TEMPLATE_HEADERS[kind];
  let example = TEMPLATE_EXAMPLES[kind][0];
  if (kind === "articles" && companyId) {
    const settings = await pricing.getSettings(companyId);
    const codes = (settings?.priceLevels || []).map((l) => l.code);
    headers = [...headers, ...codes];
    example = [...example, ...codes.map(() => "")];
  }
  ws.addRow(headers).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A78D6" } };
  for (const ex of kind === "articles" ? [example] : TEMPLATE_EXAMPLES[kind]) ws.addRow(ex);
  headers.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(12, h.length + 4); });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const help = wb.addWorksheet("Aide");
  help.addRow(["Comment remplir ce fichier"]).font = { bold: true, size: 13 };
  for (const n of NOTES[kind]) help.addRow([n]);
  help.getColumn(1).width = 120;
  return wb.xlsx.writeBuffer();
}

const cellValue = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v instanceof Date) return v;
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.text !== undefined) return v.text; // hyperlink
    if (v.result !== undefined) return v.result; // formula
  }
  return v;
};

async function readSheet(kind, buffer, extraKeys = []) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    throw Object.assign(new Error("Fichier illisible : envoyez un fichier Excel .xlsx (utilisez le modèle)."), { status: 400 });
  }
  const ws = wb.worksheets[0];
  if (!ws) throw Object.assign(new Error("Le fichier ne contient aucune feuille."), { status: 400 });
  const headerRow = ws.getRow(1).values.slice(1).map((v) => norm(cellValue(v)));
  const map = {};
  const aliases = COLUMNS[kind];
  headerRow.forEach((h, i) => {
    for (const [key, names] of Object.entries(aliases)) if (!(key in map) && names.includes(h)) map[key] = i;
    for (const k of extraKeys) if (!(`level:${k}` in map) && h === norm(k)) map[`level:${k}`] = i;
  });
  const missing = REQUIRED[kind].filter((k) => !(k in map));
  if (kind === "stock" && !("reference" in map) && !("barcode" in map)) missing.unshift("reference");
  if (missing.length) {
    throw Object.assign(new Error(`Colonnes manquantes : ${missing.map((k) => TEMPLATE_HEADERS[kind][Object.keys(COLUMNS[kind]).indexOf(k)] || k).join(", ")}. Utilisez le modèle.`), { status: 400 });
  }
  const rows = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const values = row.values.slice(1).map(cellValue);
    if (values.every((v) => v === "" || v === null || v === undefined)) return;
    const data = {};
    for (const [key, idx] of Object.entries(map)) data[key] = values[idx] ?? "";
    rows.push({ line: n, data });
  });
  if (rows.length > MAX_ROWS) throw Object.assign(new Error(`Trop de lignes (${rows.length}) : ${MAX_ROWS} au maximum par fichier.`), { status: 400 });
  return rows;
}

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const num = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const dateOf = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const d = m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
const TRACKING = { "": "none", aucune: "none", none: "none", non: "none", lot: "lot", lots: "lot", "lot peremption": "lot", "lot+peremption": "lot", "lot dlc": "lot", serie: "serial", "n de serie": "serial", serial: "serial", "numero de serie": "serial" };
const TYPES = { revendeur: "reseller", reseller: "reseller", installateur: "installer", installer: "installer", entreprise: "company", btp: "company", company: "company", particulier: "retail", retail: "retail", detail: "retail" };
const FLOWS = { complet: "full", full: "full", "": "full", direct: "direct", "facture directe": "direct" };

// ---------------------------------------------------------------- articles
async function planArticles(companyId, rows) {
  const settings = await pricing.getSettings(companyId);
  const levelCodes = (settings?.priceLevels || []).map((l) => l.code);
  const refs = rows.map((r) => str(r.data.reference, 60).toUpperCase()).filter(Boolean);
  const codes = rows.map((r) => str(r.data.barcode, 40)).filter(Boolean);
  const [existing, byBarcode, categories, brands, suppliers] = await Promise.all([
    Product.find({ company: companyId, internalReference: { $in: refs } }).select("internalReference").lean(),
    codes.length ? Product.find({ company: companyId, barcode: { $in: codes } }).select("barcode internalReference").lean() : [],
    InventoryCategory.find({ company: companyId }).select("name parent").lean(),
    Brand.find({ company: companyId }).select("name").lean(),
    Supplier.find({ company: companyId }).select("name").lean(),
  ]);
  const known = new Map(existing.map((p) => [p.internalReference, p._id]));
  const knownBarcode = new Map(byBarcode.map((p) => [p.barcode, p._id]));
  const catPath = new Map();
  const byId = new Map(categories.map((c) => [String(c._id), c]));
  for (const c of categories) {
    const names = [];
    let cur = c;
    while (cur) { names.unshift(norm(cur.name)); cur = cur.parent ? byId.get(String(cur.parent)) : null; }
    catPath.set(names.join(" > "), c._id);
    if (!catPath.has(norm(c.name))) catPath.set(norm(c.name), c._id); // a unique sub-family name alone works too
  }
  const brandOf = new Map(brands.map((b) => [norm(b.name), b._id]));
  const supplierOf = new Map(suppliers.map((s) => [norm(s.name), s]));
  const seen = new Set();

  return rows.map(({ line, data }) => {
    const errors = [];
    const warnings = [];
    const reference = str(data.reference, 60).toUpperCase();
    const name = str(data.name, 200);
    if (!reference) errors.push("Référence manquante");
    if (!name) errors.push("Désignation manquante");
    if (reference && seen.has(reference)) errors.push(`Référence ${reference} en double dans le fichier`);
    seen.add(reference);
    const famRaw = str(data.family, 200);
    const famKey = famRaw.split(/>|›|\//).map((x) => norm(x)).filter(Boolean).join(" > ");
    if (!famKey) errors.push("Famille manquante");
    const vat = num(data.vatRate);
    if (vat !== null && ![0, 7, 10, 14, 20].includes(vat)) errors.push(`TVA ${data.vatRate} : 0, 7, 10, 14 ou 20`);
    const price = num(data.sellingPrice);
    if (Number.isNaN(price) || (price !== null && price < 0)) errors.push("Prix public invalide");
    const tracking = TRACKING[norm(data.tracking)];
    if (data.tracking && !tracking) errors.push(`Traçabilité « ${data.tracking} » inconnue (aucune, lot, série)`);
    const packagings = [];
    for (const part of str(data.packaging, 500).split(";").map((x) => x.trim()).filter(Boolean)) {
      const [unit, factor, barcode] = part.split(":").map((x) => x.trim());
      const f = num(factor);
      if (!unit || !(f > 0)) errors.push(`Conditionnement « ${part} » : Unité:quantité[:code-barres]`);
      else packagings.push({ unit: unit.slice(0, 30), factor: f, barcode: (barcode || "").slice(0, 40) });
    }
    const priceLevels = [];
    for (const code of levelCodes) {
      const v = num(data[`level:${code}`]);
      if (v === null) continue;
      if (Number.isNaN(v) || v < 0) errors.push(`Prix ${code} invalide`);
      else priceLevels.push({ level: code, price: v });
    }
    const img = str(data.imageUrl, 1000);
    if (img && !/^https?:\/\//i.test(img)) warnings.push("Photo ignorée : un lien http(s) est attendu");
    const purchase = num(data.purchasePrice);
    if (Number.isNaN(purchase)) errors.push("Prix d'achat invalide");
    const supplierName = str(data.supplier, 200);
    if (purchase !== null && !supplierName) warnings.push("Prix d'achat sans fournisseur : non enregistré");
    if (supplierName && !supplierOf.has(norm(supplierName))) warnings.push(`Fournisseur « ${supplierName} » créé`);
    const barcode = str(data.barcode, 40);
    const existingId = known.get(reference) || (barcode && knownBarcode.get(barcode)) || null;
    if (!famKey || catPath.has(famKey)) { /* known family */ } else warnings.push(`Famille « ${famRaw} » créée`);
    if (data.brand && !brandOf.has(norm(data.brand))) warnings.push(`Marque « ${str(data.brand, 80)} » créée`);
    const doc = {
      internalReference: reference, name, barcode, manufacturerReference: str(data.manufacturerReference, 60), unit: str(data.unit, 30) || null,
      vatRate: vat ?? null, sellingPrice: price, minSellingPrice: num(data.minSellingPrice) || null,
      threshold: num(data.threshold) === null ? null : Math.max(num(data.threshold) || 0, 0), maxQuantity: num(data.maxQuantity) || null,
      tracking: tracking || null, hasExpiry: str(data.tracking) ? norm(data.tracking).includes("peremption") || norm(data.tracking).includes("dlc") : null,
      shelfLifeDays: num(data.shelfLifeDays) || null, weightKg: num(data.weightKg) || null,
      packagings, priceLevels,
    };
    return {
      line, action: errors.length ? "error" : existingId ? "update" : "create", errors, warnings,
      label: `${reference} — ${name}`, existingId, doc, famKey, famRaw, brandName: str(data.brand, 80),
      imageUrl: /^https?:\/\//i.test(img) ? img : "", purchase: purchase !== null && supplierName ? { price: purchase, supplierName, supplierReference: str(data.supplierReference, 60) } : null,
    };
  });
}

async function ensureCategory(companyId, famRaw, cache) {
  const parts = famRaw.split(/>|›|\//).map((x) => x.trim()).filter(Boolean);
  let parent = null;
  let path = "";
  for (const part of parts) {
    path = path ? `${path} > ${norm(part)}` : norm(part);
    if (cache.has(path)) { parent = cache.get(path); continue; }
    const found = await InventoryCategory.findOne({ company: companyId, parent, name: new RegExp(`^${part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).select("_id").lean();
    const id = found ? found._id : (await InventoryCategory.create({ company: companyId, name: part.slice(0, 100), parent }))._id;
    cache.set(path, id);
    parent = id;
  }
  return parent;
}

async function commitArticles(companyId, plan, actorId) {
  const catCache = new Map();
  const brandCache = new Map((await Brand.find({ company: companyId }).select("name").lean()).map((b) => [norm(b.name), b._id]));
  const supCache = new Map((await Supplier.find({ company: companyId }).select("name").lean()).map((s) => [norm(s.name), s._id]));
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const row of plan) {
    if (row.action === "error") { result.skipped += 1; result.errors.push({ line: row.line, errors: row.errors }); continue; }
    try {
      const category = await ensureCategory(companyId, row.famRaw, catCache);
      let brand = null;
      if (row.brandName) {
        brand = brandCache.get(norm(row.brandName));
        if (!brand) { brand = (await Brand.create({ company: companyId, name: row.brandName }))._id; brandCache.set(norm(row.brandName), brand); }
      }
      const doc = { ...row.doc, category, brand };
      if (row.imageUrl) doc.image = { url: row.imageUrl, publicId: "", thumbUrl: row.imageUrl };
      let product = row.existingId ? await Product.findById(row.existingId) : null;
      if (product) {
        for (const [k, v] of Object.entries(doc)) {
          if (v === null || v === "" || (Array.isArray(v) && !v.length)) continue; // empty cells keep the current value
          product.set(k, v);
        }
        product.updatedBy = actorId;
      } else {
        const defaults = { unit: "pièce", vatRate: 20, threshold: 0, tracking: "none", hasExpiry: false };
        const fresh = Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null));
        product = new Product({ ...defaults, ...fresh, company: companyId, createdBy: actorId });
      }
      if (row.purchase) {
        let sup = supCache.get(norm(row.purchase.supplierName));
        if (!sup) { sup = (await Supplier.create({ company: companyId, name: row.purchase.supplierName }))._id; supCache.set(norm(row.purchase.supplierName), sup); }
        const prices = (product.prices || []).filter((p) => norm(p.supplierName) !== norm(row.purchase.supplierName));
        prices.push({ supplierName: row.purchase.supplierName, supplier: sup, price: row.purchase.price, supplierReference: row.purchase.supplierReference || undefined });
        product.prices = prices;
      }
      await product.save();
      result[row.existingId ? "updated" : "created"] += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push({ line: row.line, errors: [err.code === 11000 ? "Référence ou code-barres déjà utilisé" : err.message] });
    }
  }
  return result;
}

// ---------------------------------------------------------------- customers
async function planCustomers(companyId, rows) {
  const settings = await pricing.getSettings(companyId);
  const levels = new Set((settings?.priceLevels || []).map((l) => l.code));
  const [customers, users] = await Promise.all([
    Customer.find({ company: companyId }).select("code ice name").lean(),
    require("../models/Company").findById(companyId).select("tenant").lean()
      .then((co) => User.find(co?.tenant ? { tenant: co.tenant } : { _id: null }).select("email firstName lastName").lean()),
  ]);
  const byCode = new Map(customers.filter((c) => c.code).map((c) => [c.code, c._id]));
  const byIce = new Map(customers.filter((c) => c.ice).map((c) => [String(c.ice).replace(/\D/g, ""), c._id]));
  const byName = new Map(customers.map((c) => [norm(c.name), c._id]));
  const userOf = (v) => {
    const k = norm(v);
    if (!k) return null;
    const u = users.find((x) => norm(x.email) === k || norm(`${x.firstName} ${x.lastName}`) === k || norm(x.firstName) === k);
    return u?._id || undefined;
  };
  const seen = new Set();
  return rows.map(({ line, data }) => {
    const errors = [];
    const warnings = [];
    const name = str(data.name, 200);
    if (!name) errors.push("Nom manquant");
    const code = str(data.code, 20).toUpperCase();
    if (code && seen.has(code)) errors.push(`Code ${code} en double dans le fichier`);
    if (code) seen.add(code);
    const type = data.type ? TYPES[norm(data.type)] : "reseller";
    if (!type) errors.push(`Type « ${data.type} » : revendeur, installateur, entreprise ou particulier`);
    const level = str(data.priceLevel, 10).toUpperCase();
    if (level && !levels.has(level)) errors.push(`Niveau de prix « ${level} » inconnu (${[...levels].join(", ")})`);
    const ice = String(data.ice ?? "").replace(/\D/g, "");
    if (ice && ice.length !== 15) errors.push("ICE : 15 chiffres");
    if (!ice && type !== "retail") warnings.push("ICE manquant (obligatoire pour la facture électronique B2B)");
    const flow = FLOWS[norm(data.documentFlow)];
    if (data.documentFlow && !flow) errors.push("Circuit : complet ou direct");
    const credit = num(data.creditLimit);
    const days = num(data.paymentDays);
    const discount = num(data.discountPercent);
    for (const [v, label] of [[credit, "Plafond"], [days, "Délai"], [discount, "Remise"]]) if (Number.isNaN(v)) errors.push(`${label} invalide`);
    const rep = userOf(data.salesRep);
    if (rep === undefined) warnings.push(`Commercial « ${data.salesRep} » introuvable : client sans commercial`);
    const email = str(data.email, 200).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail invalide");
    const existingId = (code && byCode.get(code)) || (ice && byIce.get(ice)) || byName.get(norm(name)) || null;
    const doc = {
      name, code: code || undefined, type: type || "reseller", kind: type === "retail" ? "individual" : "company",
      priceLevel: level || null, ice, identifiantFiscal: str(data.identifiantFiscal, 30), rc: str(data.rc, 30),
      phone: str(data.phone, 50), email, address: str(data.address, 300), city: str(data.city, 100), zone: str(data.zone, 80),
      salesRep: rep || null, creditLimit: credit, paymentDays: days ?? 60, documentFlow: flow || "full", discountPercent: discount || 0,
    };
    return { line, action: errors.length ? "error" : existingId ? "update" : "create", errors, warnings, label: `${code ? `${code} — ` : ""}${name}`, existingId, doc };
  });
}

async function commitCustomers(companyId, plan, actorId) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  let next = (await Customer.countDocuments({ company: companyId })) + 1;
  for (const row of plan) {
    if (row.action === "error") { result.skipped += 1; result.errors.push({ line: row.line, errors: row.errors }); continue; }
    try {
      if (row.existingId) {
        const c = await Customer.findById(row.existingId);
        for (const [k, v] of Object.entries(row.doc)) if (v !== null && v !== "" && v !== undefined) c.set(k, v);
        c.updatedBy = actorId;
        await c.save();
        result.updated += 1;
      } else {
        const doc = { ...row.doc, company: companyId, createdBy: actorId };
        if (!doc.code) {
          for (;;) {
            const code = `CL-${String(next).padStart(4, "0")}`;
            next += 1;
            if (!(await Customer.exists({ company: companyId, code }))) { doc.code = code; break; }
          }
        }
        await Customer.create(doc);
        result.created += 1;
      }
    } catch (err) {
      result.skipped += 1;
      result.errors.push({ line: row.line, errors: [err.code === 11000 ? "Code client déjà utilisé" : err.message] });
    }
  }
  return result;
}

// ---------------------------------------------------------------- opening stock
async function planStock(companyId, rows) {
  const refs = rows.map((r) => str(r.data.reference, 60).toUpperCase()).filter(Boolean);
  const codes = rows.map((r) => str(r.data.barcode, 40)).filter(Boolean);
  const [products, warehouses] = await Promise.all([
    Product.find({ company: companyId, $or: [{ internalReference: { $in: refs } }, { barcode: { $in: codes } }, { "packagings.barcode": { $in: codes } }] })
      .select("internalReference barcode name tracking hasExpiry isService isVariantParent packagings").lean(),
    Warehouse.find({ company: companyId }).select("code name").lean(),
  ]);
  const byRef = new Map(products.map((p) => [p.internalReference, p]));
  const byCode = new Map();
  for (const p of products) { if (p.barcode) byCode.set(p.barcode, p); for (const k of p.packagings || []) if (k.barcode) byCode.set(k.barcode, { ...p, factor: k.factor }); }
  const wh = new Map();
  for (const w of warehouses) { wh.set(norm(w.code), w); wh.set(norm(w.name), w); }
  return rows.map(({ line, data }) => {
    const errors = [];
    const warnings = [];
    const ref = str(data.reference, 60).toUpperCase();
    const code = str(data.barcode, 40);
    const product = (ref && byRef.get(ref)) || (code && byCode.get(code)) || null;
    if (!product) errors.push(`Article ${ref || code || "?"} introuvable (importez d'abord les articles)`);
    else if (product.isService || product.isVariantParent) errors.push(`${product.name} : pas de stock pour un service ou un modèle`);
    const w = wh.get(norm(data.warehouse));
    if (!w) errors.push(`Dépôt « ${data.warehouse} » inconnu (${warehouses.map((x) => x.code).join(", ")})`);
    let qty = num(data.quantity);
    if (!(qty > 0)) errors.push("Quantité positive attendue");
    if (product?.factor && qty > 0) { qty *= product.factor; warnings.push(`Code-barres de conditionnement : ${qty} unités`); }
    const cost = num(data.unitCost);
    if (Number.isNaN(cost) || (cost !== null && cost < 0)) errors.push("Coût unitaire invalide");
    if (cost === null) warnings.push("Sans coût : le CMUP actuel est gardé");
    const expiry = dateOf(data.expiryDate);
    if (expiry === undefined) errors.push("Date de péremption illisible (JJ/MM/AAAA)");
    let lots = [];
    if (product?.tracking === "lot") {
      const lot = str(data.lot, 60);
      if (!lot) errors.push("Article suivi par lot : n° de lot obligatoire");
      if (product.hasExpiry && !expiry) errors.push("Date de péremption obligatoire pour cet article");
      lots = [{ number: lot, quantity: qty, expiryDate: expiry || null }];
    } else if (product?.tracking === "serial") {
      const serials = str(data.serials, 5000).split(/[\s,;]+/).filter(Boolean);
      if (serials.length !== qty) errors.push(`${qty} n° de série attendus (${serials.length} donnés)`);
      lots = serials.map((number) => ({ number, quantity: 1 }));
    }
    return {
      line, action: errors.length ? "error" : "create", errors, warnings,
      label: product ? `${product.internalReference || ""} ${product.name} → ${w?.code || "?"} : ${qty}` : ref || code,
      productId: product?._id, warehouseId: w?._id, quantity: qty, unitCost: cost, lots,
    };
  });
}

async function commitStock(companyId, plan, actorId) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const row of plan) {
    if (row.action === "error") { result.skipped += 1; result.errors.push({ line: row.line, errors: row.errors }); continue; }
    try {
      await stock.receive({ product: row.productId, warehouse: row.warehouseId, quantity: row.quantity, unitCost: row.unitCost, lots: row.lots, reason: "Stock d'ouverture (import Excel)", source: { kind: "opening" }, actorId, isPurchase: row.unitCost !== null });
      result.created += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push({ line: row.line, errors: [err.message] });
    }
  }
  return result;
}

const PLANNERS = { articles: planArticles, customers: planCustomers, stock: planStock };
const COMMITTERS = { articles: commitArticles, customers: commitCustomers, stock: commitStock };

async function plan(kind, companyId, buffer) {
  if (!PLANNERS[kind]) throw Object.assign(new Error("Unknown import"), { status: 400 });
  const extra = kind === "articles" ? ((await pricing.getSettings(companyId))?.priceLevels || []).map((l) => l.code) : [];
  const rows = await readSheet(kind, buffer, extra);
  return PLANNERS[kind](companyId, rows);
}

function summarize(planned) {
  const count = (a) => planned.filter((r) => r.action === a).length;
  return {
    total: planned.length, create: count("create"), update: count("update"), error: count("error"),
    warnings: planned.filter((r) => r.warnings.length).length,
  };
}

async function preview(kind, companyId, buffer) {
  const planned = await plan(kind, companyId, buffer);
  return {
    summary: summarize(planned),
    rows: planned.slice(0, 500).map(({ line, action, errors, warnings, label }) => ({ line, action, errors, warnings, label })),
    truncated: planned.length > 500,
  };
}

async function commit(kind, companyId, buffer, actorId) {
  const planned = await plan(kind, companyId, buffer);
  const res = await COMMITTERS[kind](companyId, planned, actorId);
  return { summary: summarize(planned), ...res };
}

module.exports = { template, preview, commit, readSheet, MAX_ROWS, isId };
