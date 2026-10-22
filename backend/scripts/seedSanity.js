/**
 * ============================================================
 * SANITY — DEMO SEED: a Smart Way-type wholesaler (négoce)
 * ============================================================
 * A Moroccan wholesaler of sanitaire, électricité, peinture and
 * quincaillerie selling to a network of resellers, installers and at
 * the counter:
 *   - 3 sites: Dépôt Casablanca (Aïn Sebaâ), Showroom Casablanca
 *     (counter), Dépôt Marrakech
 *   - families › sub-families, brands, ~40 articles with cartons,
 *     price levels P1-P4, barcodes, lots (paints, silicones) and
 *     serial numbers (water heaters)
 *   - opening stock bought from suppliers (CMUP), purchase orders
 *   - resellers / installers with their rep, price level, credit limit
 *   - devis, commandes, BLs, invoices, payments, a delivery round,
 *     a counter session, monthly targets
 *   - logins for every role (printed at the end)
 *
 * Run:   npm run seed          (from backend/, MONGODB_URI in .env)
 * Undo:  npm run unseed        (removes only the demo client)
 * The seed refuses to run twice: unseed first.
 * ============================================================
 */
const tenantScope = require("../services/tenantScope");
const mongoose = require("mongoose");
const path = require("path");

const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Company = require("../models/Company");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const Salary = require("../models/Salary");
const Warehouse = require("../models/Warehouse");
const Brand = require("../models/Brand");
const InventoryCategory = require("../models/InventoryCategory");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const Customer = require("../models/Customer");
const Quote = require("../models/Quote");
const SalesOrder = require("../models/SalesOrder");
const DeliveryNote = require("../models/DeliveryNote");
const DeliveryRound = require("../models/DeliveryRound");
const SalesInvoice = require("../models/SalesInvoice");
const SalesTarget = require("../models/SalesTarget");
const CashSession = require("../models/CashSession");
const PosSale = require("../models/PosSale");
const PublicHoliday = require("../models/PublicHoliday");
const { MOROCCO_FIXED_HOLIDAYS } = require("../config/moroccoFixedHolidays");
const stock = require("../services/stockService");
const pricing = require("../services/pricingService");
const flow = require("../services/salesFlowService");

const DEMO_TENANT = "Smart Way (démo Sanity)";
const DOMAIN = "@sanity.test";
const DAY = 86400000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

// ---------------------------------------------------------------- data
const FAMILIES = {
  "Sanitaire": ["Robinetterie", "Céramique sanitaire", "Tuyauterie & raccords PPR", "Chauffe-eau"],
  "Électricité": ["Câbles & fils", "Appareillage", "Protection (disjoncteurs)", "Éclairage LED"],
  "Peinture": ["Peintures murales", "Enduits & préparation", "Accessoires peintre"],
  "Quincaillerie": ["Visserie & fixation", "Serrurerie", "Outillage", "Colles & mastics"],
};

// Icon (lucide name) and colour of each top family — sub-families inherit them.
const FAMILY_LOOK = {
  "Sanitaire": { icon: "Droplet", color: "#2f80ed" },
  "Électricité": { icon: "Bolt", color: "#f2a900" },
  "Peinture": { icon: "PaintBucket", color: "#e5484d" },
  "Quincaillerie": { icon: "Wrench", color: "#6b7a90" },
};
const SUB_ICON = {
  "Robinetterie": "Droplet", "Céramique sanitaire": "Container", "Tuyauterie & raccords PPR": "Wrench", "Chauffe-eau": "Flame",
  "Câbles & fils": "Paperclip", "Appareillage": "CircuitBoard", "Protection (disjoncteurs)": "Battery", "Éclairage LED": "Star",
  "Peintures murales": "PaintBucket", "Enduits & préparation": "Layers", "Accessoires peintre": "Palette",
  "Visserie & fixation": "Nut", "Serrurerie": "Hexagon", "Outillage": "Hammer", "Colles & mastics": "Beaker",
};

const BRANDS = ["Grohe", "Roca", "Jacob Delafon", "Legrand", "Schneider Electric", "Ingelec", "Nexans", "Colorado", "Astral", "Sika", "Bosch", "Stanley", "Fischer", "Ariston", "Atlas PPR"];

// [family › sub, brand, name, ref, unit, carton, cost HT, P1, P3, threshold, stock Casa, stock Marrakech, opts]
const ARTICLES = [
  ["Sanitaire › Robinetterie", "Grohe", "Mitigeur lavabo Eurosmart chromé", "GRO-ES-LAV", "pièce", 6, 520, 640, 790, 12, 60, 18],
  ["Sanitaire › Robinetterie", "Grohe", "Mitigeur douche Eurosmart", "GRO-ES-DCH", "pièce", 6, 610, 750, 930, 10, 40, 12],
  ["Sanitaire › Robinetterie", "Roca", "Mélangeur évier Victoria", "ROC-VIC-EV", "pièce", 6, 340, 420, 520, 10, 50, 20],
  ["Sanitaire › Robinetterie", "Roca", "Robinet d'arrêt 1/2\" chromé", "ROC-RA-12", "pièce", 50, 28, 36, 48, 100, 600, 200],
  ["Sanitaire › Céramique sanitaire", "Roca", "WC suspendu The Gap Rimless", "ROC-GAP-WCS", "pièce", null, 1450, 1780, 2190, 5, 24, 6],
  ["Sanitaire › Céramique sanitaire", "Jacob Delafon", "Lavabo Odéon 60 cm", "JD-ODE-60", "pièce", null, 690, 850, 1050, 5, 30, 8],
  ["Sanitaire › Céramique sanitaire", "Jacob Delafon", "Receveur de douche 80×80", "JD-REC-80", "pièce", null, 820, 1010, 1240, 4, 16, 4],
  ["Sanitaire › Tuyauterie & raccords PPR", "Atlas PPR", "Tube PPR PN20 Ø20 (barre 4 m)", "PPR-T20", "barre", 50, 22, 28, 36, 200, 1500, 400],
  ["Sanitaire › Tuyauterie & raccords PPR", "Atlas PPR", "Tube PPR PN20 Ø25 (barre 4 m)", "PPR-T25", "barre", 40, 34, 43, 55, 150, 900, 300],
  ["Sanitaire › Tuyauterie & raccords PPR", "Atlas PPR", "Coude PPR 90° Ø20", "PPR-C20", "pièce", 200, 1.2, 1.7, 2.5, 1000, 8000, 2000],
  ["Sanitaire › Tuyauterie & raccords PPR", "Atlas PPR", "Té PPR égal Ø20", "PPR-TE20", "pièce", 200, 1.5, 2.1, 3, 1000, 6000, 1500],
  ["Sanitaire › Chauffe-eau", "Ariston", "Chauffe-eau électrique 80 L Pro1", "ARI-PRO1-80", "pièce", null, 1380, 1650, 1990, 4, 20, 6, { tracking: "serial" }],
  ["Sanitaire › Chauffe-eau", "Ariston", "Chauffe-bain gaz 11 L Fast", "ARI-FAST-11", "pièce", null, 1190, 1450, 1790, 4, 15, 5, { tracking: "serial" }],
  ["Électricité › Câbles & fils", "Nexans", "Fil H07V-U 1,5 mm² bleu (couronne 100 m)", "NEX-H07-15B", "couronne", 10, 115, 142, 175, 30, 250, 60],
  ["Électricité › Câbles & fils", "Nexans", "Fil H07V-U 2,5 mm² rouge (couronne 100 m)", "NEX-H07-25R", "couronne", 10, 185, 228, 279, 30, 220, 50],
  ["Électricité › Câbles & fils", "Nexans", "Câble U1000 R2V 3G2,5 (au mètre)", "NEX-R2V-3G25", "m", null, 9.8, 12.4, 15.5, 500, 3000, 800],
  ["Électricité › Appareillage", "Ingelec", "Interrupteur simple allumage Sara blanc", "ING-SAR-INT", "pièce", 20, 9.5, 12.5, 16, 200, 1200, 300],
  ["Électricité › Appareillage", "Ingelec", "Prise 2P+T Sara blanc", "ING-SAR-PC", "pièce", 20, 11, 14.5, 19, 200, 1400, 300],
  ["Électricité › Appareillage", "Legrand", "Interrupteur va-et-vient Niloé", "LEG-NIL-VV", "pièce", 10, 24, 30, 39, 80, 400, 100],
  ["Électricité › Protection (disjoncteurs)", "Schneider Electric", "Disjoncteur Easy9 1P+N 16 A", "SCH-EZ9-16", "pièce", 12, 38, 48, 62, 60, 500, 120],
  ["Électricité › Protection (disjoncteurs)", "Schneider Electric", "Interrupteur différentiel 40 A 30 mA", "SCH-EZ9-ID40", "pièce", 6, 265, 325, 399, 15, 80, 20],
  ["Électricité › Protection (disjoncteurs)", "Legrand", "Coffret 2 rangées 26 modules", "LEG-COF-26", "pièce", 4, 310, 385, 470, 8, 40, 10],
  ["Électricité › Éclairage LED", "Ingelec", "Ampoule LED E27 9 W", "ING-LED-E27-9", "pièce", 50, 8.5, 11, 15, 300, 2000, 500],
  ["Électricité › Éclairage LED", "Legrand", "Spot LED encastrable 7 W", "LEG-SPOT-7", "pièce", 20, 29, 37, 49, 100, 600, 150],
  ["Peinture › Peintures murales", "Colorado", "Peinture vinylique Colovinyl blanc 25 kg", "COL-VIN-25", "seau", null, 265, 318, 385, 30, 180, 50, { tracking: "lot", hasExpiry: true, shelfLifeDays: 540 }],
  ["Peinture › Peintures murales", "Colorado", "Peinture acrylique satinée 4 L", "COL-ACR-4", "pot", 4, 145, 178, 219, 40, 220, 60, { tracking: "lot", hasExpiry: true, shelfLifeDays: 540 }],
  ["Peinture › Peintures murales", "Astral", "Laque glycéro brillante 2,5 L", "AST-GLY-25", "pot", 6, 168, 205, 249, 20, 90, 25, { tracking: "lot", hasExpiry: true, shelfLifeDays: 720 }],
  ["Peinture › Enduits & préparation", "Colorado", "Enduit de lissage poudre 25 kg", "COL-END-25", "sac", null, 72, 89, 110, 50, 400, 100],
  ["Peinture › Accessoires peintre", "Stanley", "Rouleau anti-goutte 180 mm", "STA-ROU-180", "pièce", 24, 21, 27, 35, 50, 300, 80],
  ["Peinture › Accessoires peintre", "Stanley", "Brosse plate 50 mm", "STA-BRO-50", "pièce", 24, 9, 12, 16, 60, 400, 100],
  ["Quincaillerie › Visserie & fixation", "Fischer", "Chevilles nylon SX 8×40 (boîte 100)", "FIS-SX8-100", "boîte", 10, 38, 48, 62, 40, 250, 60],
  ["Quincaillerie › Visserie & fixation", "Fischer", "Vis agglo 4×40 (boîte 200)", "FIS-VA440", "boîte", 10, 31, 39, 52, 40, 260, 60],
  ["Quincaillerie › Serrurerie", "Stanley", "Cylindre de serrure 30/30 3 clés", "STA-CYL-3030", "pièce", 10, 78, 98, 125, 20, 120, 30],
  ["Quincaillerie › Serrurerie", "Stanley", "Cadenas laiton 40 mm", "STA-CAD-40", "pièce", 12, 42, 54, 69, 30, 150, 40],
  ["Quincaillerie › Outillage", "Bosch", "Perceuse à percussion 750 W", "BOS-PSB-750", "pièce", null, 590, 720, 879, 5, 25, 6, { tracking: "serial" }],
  ["Quincaillerie › Outillage", "Stanley", "Mètre ruban 5 m", "STA-MET-5", "pièce", 12, 34, 43, 55, 40, 220, 60],
  ["Quincaillerie › Colles & mastics", "Sika", "Silicone sanitaire blanc 280 ml", "SIK-SIL-280", "cartouche", 24, 24, 31, 42, 100, 900, 200, { tracking: "lot", hasExpiry: true, shelfLifeDays: 365 }],
  ["Quincaillerie › Colles & mastics", "Sika", "Mastic polyuréthane Sikaflex-11FC 300 ml", "SIK-11FC", "cartouche", 12, 49, 61, 79, 50, 300, 80, { tracking: "lot", hasExpiry: true, shelfLifeDays: 365 }],
];

const SUPPLIERS = [
  { name: "Grohe Maroc (distributeur officiel)", city: "Casablanca", paymentDays: 60, brands: ["Grohe"] },
  { name: "Roca Maroc", city: "Casablanca", paymentDays: 60, brands: ["Roca", "Jacob Delafon"] },
  { name: "Nexans Maroc", city: "Mohammedia", paymentDays: 90, brands: ["Nexans"] },
  { name: "Ingelec SA", city: "Casablanca", paymentDays: 60, brands: ["Ingelec"] },
  { name: "Schneider Electric Maroc", city: "Casablanca", paymentDays: 60, brands: ["Schneider Electric", "Legrand"] },
  { name: "Colorado SA", city: "Casablanca", paymentDays: 60, brands: ["Colorado", "Astral"] },
  { name: "Atlas Plast Industrie", city: "Tanger", paymentDays: 45, brands: ["Atlas PPR"] },
  { name: "Quincaillerie Import Sud", city: "Agadir", paymentDays: 30, brands: ["Stanley", "Fischer", "Bosch", "Sika", "Ariston"] },
];

// [name, type, city, level, rep key, credit limit, flow, zone]
const CUSTOMERS = [
  ["Quincaillerie Al Amal", "reseller", "Casablanca", "P1", "rep1", 80000, "full", "Casa Est"],
  ["Droguerie Nour", "reseller", "Casablanca", "P1", "rep1", 50000, "full", "Casa Est"],
  ["Comptoir du Bâtiment Hay Hassani", "reseller", "Casablanca", "P1", "rep1", 120000, "full", "Casa Ouest"],
  ["Sanitaire Belle Vue", "reseller", "Mohammedia", "P1", "rep1", 60000, "full", "Mohammedia"],
  ["Électro Souss", "reseller", "Agadir", "P1", "rep2", 70000, "full", "Sud"],
  ["Quincaillerie Ménara", "reseller", "Marrakech", "P1", "rep2", 90000, "full", "Marrakech"],
  ["Bricolage Gueliz", "reseller", "Marrakech", "P2", "rep2", 40000, "full", "Marrakech"],
  ["Plomberie Moderne Benali", "installer", "Casablanca", "P2", "rep1", 20000, "direct", "Casa Ouest"],
  ["Électricité Générale Tazi", "installer", "Rabat", "P2", "rep1", 25000, "direct", "Rabat"],
  ["Atelier Peinture Ouarzazi", "installer", "Marrakech", "P2", "rep2", 15000, "direct", "Marrakech"],
  ["Promotion Immobilière Anfa Living", "company", "Casablanca", "P2", "rep1", 250000, "full", "Casa Ouest"],
  ["BTP Atlas Construction", "company", "Marrakech", "P2", "rep2", 200000, "full", "Marrakech"],
];

/** A small hand-drawn-looking signature (PNG data URL) for the demo proof of delivery. */
function signaturePng(w = 320, h = 120) {
  const zlib = require("zlib");
  const px = Buffer.alloc((w + 1) * h, 255); // grayscale rows, filter byte 0
  for (let y = 0; y < h; y += 1) px[y * (w + 1)] = 0;
  const dot = (x, y) => {
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const xx = Math.round(x + dx); const yy = Math.round(y + dy);
      if (xx >= 0 && xx < w && yy >= 0 && yy < h) px[yy * (w + 1) + 1 + xx] = 20;
    }
  };
  for (let t = 0; t <= 1; t += 0.0008) {
    const x = 20 + t * 280;
    dot(x, 64 + Math.sin(t * 19) * 26 * (1 - t * 0.6) + Math.sin(t * 61) * 6);
  }
  for (let t = 0; t <= 1; t += 0.002) dot(150 + t * 150, 98 - t * 6); // underline
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(px)), chunk("IEND", Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

// ---------------------------------------------------------------- seed
async function seedSanityClient({ log = console.log } = {}) {
  if (await Tenant.exists({ name: DEMO_TENANT })) throw new Error(`"${DEMO_TENANT}" already exists — run "npm run unseed" first`);
  const tenant = await Tenant.create({ name: DEMO_TENANT });
  const ctx = tenantScope.tenantContext({ tenantId: tenant._id, companyIds: [] });
  return tenantScope.runInTenant(ctx, async () => {
    // ---------------- logins
    const mk = (firstName, lastName, key, role, department, password, extra = {}) =>
      User.create({ firstName, lastName, email: `${key}${DOMAIN}`, password, role, department, ...extra });
    const users = {
      admin: await mk("Youssef", "Admin", "admin", "admin", "management", "Admin@123"),
      dg: await mk("Hicham", "Directeur", "direction", "owner", "management", "Direction@123"),
    };
    const company = await Company.create({
      name: "Smart Way Distribution", legalForm: "SARL", industry: "Négoce — quincaillerie, sanitaire, électricité, peinture", size: "medium", currency: "MAD",
      owner: users.dg._id, email: "contact@smart-way.test", phone: "+212522000000", website: "https://smart-way.ma",
      address: { street: "Zone industrielle Aïn Sebaâ, lot 12", city: "Casablanca", region: "Casablanca-Settat", country: "Maroc" },
      // legal identifiers: invoices pass the DGI e-invoicing check out of the box
      ice: "002345678000091", taxId: "52384716", registrationNumber: "RC 487213 Casablanca", professionalTaxNumber: "35281947", cnssNumber: "8834127",
      bank: { bankName: "Attijariwafa bank — Aïn Sebaâ", accountName: "Smart Way Distribution SARL", rib: "007 780 0001234567890123 45" },
      employeeCount: 0,
    });
    ctx.companyIds.push(company._id);
    users.salesDirector = await mk("Samira", "Commerciale", "commercial", "user", "sales", "Commercial@123", { permissionsMode: "custom" });
    users.rep1 = await mk("Karim", "Terrain", "karim", "user", "sales", "Karim@123", { permissionsMode: "custom" });
    users.rep2 = await mk("Leila", "Terrain", "leila", "user", "sales", "Leila@123", { permissionsMode: "custom" });
    users.adv = await mk("Sara", "ADV", "adv", "user", "sales", "Adv@123", { permissionsMode: "custom" });
    users.cashier = await mk("Omar", "Caisse", "caisse", "user", "pos", "Caisse@123");
    users.store = await mk("Rachid", "Magasin", "magasin", "user", "warehouse", "Magasin@123");
    users.buyer = await mk("Nadia", "Achats", "achats", "user", "purchasing", "Achats@123");
    users.logistics = await mk("Hamid", "Logistique", "logistique", "user", "logistics", "Logistique@123");
    users.driver = await mk("Said", "Chauffeur", "chauffeur", "user", "logistics", "Chauffeur@123", { permissionsMode: "custom" });
    users.hr = await mk("Fatima", "RH", "rh", "user", "hr", "Rh@123", { hrRole: "hr_director" });
    users.accountant = await mk("Khadija", "Comptable", "comptable", "user", "accounting", "Comptable@123", { permissionsMode: "custom" });
    const { PRESETS, keysOf } = require("../config/permissionCatalog");
    const preset = (k) => PRESETS.find((p) => p.key === k).keys();
    await User.updateOne({ _id: users.salesDirector._id }, { permissions: [...new Set([...preset("sales_manager"), "team.permissions.manage"])] });
    await User.updateOne({ _id: users.rep1._id }, { permissions: preset("sales_rep") });
    await User.updateOne({ _id: users.rep2._id }, { permissions: preset("sales_rep") });
    await User.updateOne({ _id: users.adv._id }, { permissions: preset("sales_admin") });
    await User.updateOne({ _id: users.driver._id }, { permissions: preset("driver") });
    await User.updateOne({ _id: users.accountant._id }, { permissions: preset("accountant") });
    void keysOf;
    log("✓ Company & logins");

    // ---------------- departments & a few employees
    const deps = {};
    for (const [key, name, perm] of [["management", "Direction Générale", null], ["sales", "Commercial", "sales"], ["warehouse", "Magasin & Dépôts", "warehouse"], ["pos", "Comptoir & Showroom", "pos"], ["purchasing", "Achats", "purchasing"], ["logistics", "Logistique", "logistics"], ["hr", "Ressources Humaines", "hr"], ["accounting", "Comptabilité", null]]) {
      deps[key] = await Department.create({ company: company._id, name, category: key, permissionKey: perm, createdBy: users.admin._id });
    }
    const staff = [
      ["EMP-001", "Hicham", "Directeur", "management", "Directeur Général", 30000, "dg"],
      ["EMP-002", "Samira", "Commerciale", "sales", "Directeur Commercial", 18000, "salesDirector"],
      ["EMP-003", "Karim", "Terrain", "sales", "Commercial(e) Terrain", 7500, "rep1"],
      ["EMP-004", "Leila", "Terrain", "sales", "Commercial(e) Terrain", 7500, "rep2"],
      ["EMP-005", "Sara", "ADV", "sales", "Assistant(e) ADV", 6000, "adv"],
      ["EMP-006", "Omar", "Caisse", "pos", "Caissier(ère)", 4500, "cashier"],
      ["EMP-007", "Rachid", "Magasin", "warehouse", "Chef de Dépôt", 8000, "store"],
      ["EMP-008", "Youssef", "Cariste", "warehouse", "Cariste", 3800, null],
      ["EMP-009", "Nadia", "Achats", "purchasing", "Responsable des Achats", 11000, "buyer"],
      ["EMP-010", "Hamid", "Logistique", "logistics", "Responsable Logistique", 9000, "logistics"],
      ["EMP-011", "Said", "Chauffeur", "logistics", "Chauffeur Livreur", 4200, "driver"],
      ["EMP-012", "Fatima", "RH", "hr", "Directeur RH", 14000, "hr"],
    ];
    const employees = {};
    for (const [num, first, last, dep, title, salary, userKey] of staff) {
      const e = await Employee.create({ company: company._id, employeeNumber: num, firstName: first, lastName: last, gender: ["Samira", "Leila", "Sara", "Nadia", "Fatima"].includes(first) ? "female" : "male", hireDate: daysAgo(400 + Number(num.slice(4)) * 40), employmentStatus: "active", employmentType: "permanent", jobTitle: title, department: deps[dep]._id, nationality: "Moroccan", cin: `BK${100000 + Number(num.slice(4))}`, cnssNumber: `1${String(num.slice(4)).padStart(8, "0")}` });
      employees[num] = e;
      await Salary.create({ company: company._id, employee: e._id, baseSalary: salary, effectiveDate: e.hireDate, allowances: [] });
      if (userKey) await User.updateOne({ _id: users[userKey]._id }, { employee: e._id });
    }
    for (const [mgr, list] of [["EMP-002", ["EMP-003", "EMP-004", "EMP-005"]], ["EMP-007", ["EMP-008"]], ["EMP-010", ["EMP-011"]]]) {
      await Employee.updateMany({ _id: { $in: list.map((n) => employees[n]._id) } }, { manager: employees[mgr]._id });
    }
    await Department.updateOne({ _id: deps.sales._id }, { manager: employees["EMP-002"]._id });
    await Department.updateOne({ _id: deps.warehouse._id }, { manager: employees["EMP-007"]._id });
    await Department.updateOne({ _id: deps.logistics._id }, { manager: employees["EMP-010"]._id });
    await PublicHoliday.insertMany(MOROCCO_FIXED_HOLIDAYS.map((hd) => ({ company: company._id, name: hd.name, date: new Date(new Date().getFullYear(), hd.month - 1, hd.day), recurring: true, type: "national" }))).catch(() => {});
    log("✓ Departments, 12 employees, salaries");

    // ---------------- sites
    const wh = {
      casa: await Warehouse.create({ company: company._id, code: "CASA", name: "Dépôt Casablanca — Aïn Sebaâ", kind: "warehouse", city: "Casablanca", isDefault: true, manager: users.store._id }),
      show: await Warehouse.create({ company: company._id, code: "SHOW", name: "Showroom Casablanca — Bd Ghandi", kind: "store", city: "Casablanca", hasCounter: true }),
      mrk: await Warehouse.create({ company: company._id, code: "MRK", name: "Dépôt Marrakech — Sidi Ghanem", kind: "warehouse", city: "Marrakech" }),
    };
    const settings = await pricing.getSettings(company._id);
    settings.ticketHeader = "SMART WAY DISTRIBUTION\nShowroom Bd Ghandi — Casablanca\nTél. 05 22 00 00 00";
    settings.defaultCommissionRate = 2;
    await settings.save();
    log("✓ 3 sites & price levels P1-P4");

    // ---------------- families, brands, suppliers
    const cats = {};
    for (const [top, subs] of Object.entries(FAMILIES)) {
      const look = FAMILY_LOOK[top] || {};
      const parent = await InventoryCategory.create({ company: company._id, name: top, icon: look.icon, color: look.color });
      cats[top] = parent;
      for (const sub of subs) cats[`${top} › ${sub}`] = await InventoryCategory.create({ company: company._id, name: sub, parent: parent._id, icon: SUB_ICON[sub] || look.icon, color: look.color });
    }
    const brands = {};
    for (const b of BRANDS) brands[b] = await Brand.create({ company: company._id, name: b, country: ["Ingelec", "Colorado", "Astral", "Atlas PPR"].includes(b) ? "Maroc" : "" });
    // Wholesale importers who carry every brand (for price comparisons).
    const generalists = [];
    for (const [name, city, days] of [["Bati-Import Casablanca", "Casablanca", 60], ["Comptoir Atlas Distribution", "Marrakech", 45]]) {
      generalists.push(await Supplier.create({ company: company._id, name, city, paymentDays: days, paymentTerms: `${days} jours` }));
    }
    const suppliers = {};
    for (const s of SUPPLIERS) {
      const doc = await Supplier.create({ company: company._id, name: s.name, city: s.city, paymentDays: s.paymentDays, paymentTerms: `${s.paymentDays} jours`, ice: `00${Math.floor(1e12 + Math.random() * 8e12)}` });
      for (const b of s.brands) suppliers[b] = doc;
    }
    log(`✓ ${Object.keys(cats).length} families, ${BRANDS.length} brands, ${SUPPLIERS.length + 2} suppliers`);

    // ---------------- articles + opening stock (purchase price → CMUP)
    const products = {};
    let ean = 6111000000000;
    for (const [fam, brand, name, ref, unit, carton, cost, p1, p3, threshold, qCasa, qMrk, opts = {}] of ARTICLES) {
      ean += 17;
      const p = await Product.create({
        company: company._id, category: cats[fam]._id, brand: brands[brand]._id, name, internalReference: ref, barcode: String(ean), unit,
        packagings: carton ? [{ unit: "Carton", factor: carton, barcode: String(ean + 1) }] : [],
        vatRate: 20, sellingPrice: p3, threshold, maxQuantity: threshold * 6,
        priceLevels: [{ level: "P1", price: p1 }, { level: "P3", price: p3 }],
        minSellingPrice: Math.round(cost * 1.05 * 100) / 100,
        prices: [
          { supplierName: suppliers[brand].name, supplier: suppliers[brand]._id, price: cost },
          { supplierName: generalists[0].name, supplier: generalists[0]._id, price: Math.round(cost * 1.04 * 100) / 100 },
          { supplierName: generalists[1].name, supplier: generalists[1]._id, price: Math.round(cost * (ean % 2 ? 0.98 : 1.07) * 100) / 100 },
        ],
        weightKg: unit === "seau" || unit === "sac" ? 25 : unit === "couronne" ? 1.6 : 0.5,
        tracking: opts.tracking || "none", hasExpiry: !!opts.hasExpiry, shelfLifeDays: opts.shelfLifeDays || null,
        createdBy: users.admin._id,
      });
      products[ref] = p;
      const lotsFor = (q, site) => {
        if (p.tracking === "serial") return Array.from({ length: q }, (_, i) => ({ number: `${ref}-${site}-${String(i + 1).padStart(4, "0")}`, quantity: 1 }));
        if (p.tracking === "lot") {
          const a = Math.ceil(q / 2);
          return [{ number: `L${new Date().getFullYear()}-${site}-A`, quantity: a, expiryDate: daysFromNow(opts.shelfLifeDays ? Math.round(opts.shelfLifeDays / 3) : 120) }, { number: `L${new Date().getFullYear()}-${site}-B`, quantity: q - a, expiryDate: daysFromNow(opts.shelfLifeDays || 365) }].filter((l) => l.quantity > 0);
        }
        return [];
      };
      // Two purchases at slightly different prices → a real CMUP.
      const first = Math.round(qCasa * 0.4);
      await stock.receive({ product: p, warehouse: wh.casa, quantity: first, unitCost: Math.round(cost * 0.96 * 100) / 100, lots: lotsFor(first, "C1"), reason: "Stock d'ouverture", source: { kind: "opening" }, actorId: users.store._id, supplier: suppliers[brand]._id, isPurchase: true });
      await stock.receive({ product: p, warehouse: wh.casa, quantity: qCasa - first, unitCost: cost, lots: lotsFor(qCasa - first, "C2"), reason: "Réception fournisseur", source: { kind: "purchase" }, actorId: users.store._id, supplier: suppliers[brand]._id, isPurchase: true });
      if (qMrk) await stock.receive({ product: p, warehouse: wh.mrk, quantity: qMrk, unitCost: cost, lots: lotsFor(qMrk, "M1"), reason: "Réception fournisseur", source: { kind: "purchase" }, actorId: users.store._id, supplier: suppliers[brand]._id, isPurchase: true });
    }
    // Showroom stock comes from Casablanca by transfer.
    const StockTransfer = require("../models/StockTransfer");
    const showLines = ["GRO-ES-LAV", "ROC-VIC-EV", "ROC-RA-12", "ING-SAR-INT", "ING-SAR-PC", "ING-LED-E27-9", "STA-ROU-180", "STA-MET-5", "FIS-SX8-100", "SCH-EZ9-16", "COL-ACR-4", "SIK-SIL-280"];
    const tf = await StockTransfer.create({ company: company._id, number: `TF-${new Date().getFullYear()}-0001`, from: wh.casa._id, to: wh.show._id, lines: showLines.map((r) => ({ product: products[r]._id, quantity: Math.max(4, Math.round(products[r].threshold / 2)) })), createdBy: users.store._id });
    for (const l of tf.lines) {
      const out = await stock.issue({ product: l.product, warehouse: wh.casa, quantity: l.quantity, reason: `Transfert ${tf.number} (envoi)`, source: { kind: "transfer", id: tf._id, number: tf.number }, actorId: users.store._id });
      await stock.receive({ product: l.product, warehouse: wh.show, quantity: l.quantity, lots: out.lots, reason: `Transfert ${tf.number} (réception)`, source: { kind: "transfer", id: tf._id, number: tf.number }, actorId: users.store._id });
      l.lots = out.lots;
      l.receivedQuantity = l.quantity;
    }
    Object.assign(tf, { status: "received", sentAt: daysAgo(3), receivedAt: daysAgo(3), sentBy: users.store._id, receivedBy: users.store._id });
    await tf.save();
    // The showroom's own minimums (shelf stock): most are fine, three need a refill.
    const StockLevel = require("../models/StockLevel");
    for (const [i, l] of tf.lines.entries()) {
      const min = i < 3 ? l.quantity + Math.max(2, Math.round(l.quantity / 2)) : Math.max(2, Math.round(l.quantity / 3));
      await StockLevel.updateOne({ product: l.product, warehouse: wh.show._id }, { $set: { minQuantity: min } });
    }
    log(`✓ ${ARTICLES.length} articles with opening stock (CMUP), showroom supplied`);

    // ---------------- a purchase order in progress
    await PurchaseOrder.create({
      company: company._id, number: `BC-${new Date().getFullYear()}-0001`, supplier: suppliers.Grohe._id, warehouse: wh.casa._id, status: "sent", date: daysAgo(4), expectedDate: daysFromNow(6),
      lines: [{ product: products["GRO-ES-LAV"]._id, description: products["GRO-ES-LAV"].name, quantity: 60, unit: "pièce", unitPrice: 525, vatRate: 20 }, { product: products["GRO-ES-DCH"]._id, description: products["GRO-ES-DCH"].name, quantity: 30, unit: "pièce", unitPrice: 615, vatRate: 20 }],
      createdBy: users.buyer._id,
    });

    // ---------------- customers
    const customers = {};
    let n = 0;
    for (const [name, type, city, level, repKey, credit, docFlow, zone] of CUSTOMERS) {
      n += 1;
      customers[name] = await Customer.create({
        company: company._id, code: `CL-${String(n).padStart(4, "0")}`, name, kind: type === "installer" ? "individual" : "company", type, city, zone, priceLevel: level,
        salesRep: users[repKey]._id, creditLimit: credit, documentFlow: docFlow, paymentDays: type === "reseller" ? 60 : 30,
        defaultWarehouse: city === "Marrakech" || city === "Agadir" ? wh.mrk._id : wh.casa._id,
        ice: type === "installer" ? "" : `00${1534000000000 + n}`, phone: `+2126610000${String(n).padStart(2, "0")}`, address: `${n * 7} rue ${["Ibn Batouta", "Al Massira", "Hassan II", "Moulay Youssef"][n % 4]}, ${city}`,
        deliveryDays: [1, 3, 5], discountPercent: type === "company" ? 3 : 0,
      });
    }
    log(`✓ ${CUSTOMERS.length} customers (resellers, installers, companies)`);

    // ---------------- sales: devis, commandes, BL, factures
    const req = { user: { id: String(users.admin._id), role: "admin", perms: new Set(["*"]) } };
    const { createWithNumber } = require("../services/documentNumberService");
    const { normalizeSalesLines } = require("../utils/salesHelpers");
    const lines = async (customer, items) => (await normalizeSalesLines(await flow.priceLines(items.map(([ref, q, unit]) => ({ product: products[ref]._id, quantity: q, unit })), customer, company._id), company._id)).lines;

    await createWithNumber(Quote, { company: company._id, customer: customers["Promotion Immobilière Anfa Living"]._id, salesRep: users.rep1._id, date: daysAgo(2), validUntil: daysFromNow(28), subject: "Résidence Anfa Living — lot sanitaire 40 appartements", status: "sent", sentAt: daysAgo(2), lines: await lines(customers["Promotion Immobilière Anfa Living"], [["ROC-GAP-WCS", 40], ["JD-ODE-60", 40], ["GRO-ES-LAV", 40], ["GRO-ES-DCH", 40], ["ARI-PRO1-80", 40]]), createdBy: users.rep1._id }, "DV");

    const orderSpecs = [
      ["Quincaillerie Al Amal", wh.casa, [["ROC-RA-12", 2, "Carton"], ["PPR-T20", 100], ["PPR-C20", 2, "Carton"], ["SIK-SIL-280", 2, "Carton"]], "delivered"],
      ["Comptoir du Bâtiment Hay Hassani", wh.casa, [["NEX-H07-15B", 20], ["NEX-H07-25R", 20], ["SCH-EZ9-16", 2, "Carton"], ["ING-SAR-PC", 5, "Carton"], ["ING-SAR-INT", 5, "Carton"]], "delivered"],
      ["Quincaillerie Ménara", wh.mrk, [["COL-VIN-25", 20], ["COL-END-25", 40], ["STA-ROU-180", 1, "Carton"]], "partial"],
      ["Électro Souss", wh.mrk, [["NEX-R2V-3G25", 500], ["LEG-COF-26", 4], ["SCH-EZ9-ID40", 6]], "confirmed"],
      ["Droguerie Nour", wh.casa, [["COL-ACR-4", 2, "Carton"], ["AST-GLY-25", 6], ["STA-BRO-50", 1, "Carton"]], "draft"],
    ];
    const notesToInvoice = [];
    for (const [cname, w, items, state] of orderSpecs) {
      const c = customers[cname];
      const order = await createWithNumber(SalesOrder, { company: company._id, customer: c._id, salesRep: c.salesRep, warehouse: w._id, priceLevel: c.priceLevel, source: "rep", date: daysAgo(state === "delivered" ? 12 : 2), deliveryAddress: c.address, lines: (await lines(c, items)).map((l) => ({ ...l, deliveredQuantity: 0 })), createdBy: c.salesRep }, "CC");
      if (state === "draft") continue;
      order.status = "confirmed";
      order.confirmedAt = order.date;
      await order.save();
      for (const l of order.lines) await stock.reserve({ product: l.product, warehouse: w._id, quantity: l.quantity * l.unitFactor });
      if (state === "confirmed") continue;
      const blLines = flow.remainingLines(order).map((l) => (state === "partial" ? { ...l, quantity: Math.ceil(l.quantity / 2) } : l));
      const note = await createWithNumber(DeliveryNote, { company: company._id, type: "delivery", customer: c._id, salesOrder: order._id, salesRep: c.salesRep, warehouse: w._id, date: daysAgo(state === "delivered" ? 10 : 1), address: c.address, lines: blLines, history: [{ status: "draft" }], createdBy: users.store._id }, "BL");
      await flow.validateNote(note, users.store._id);
      if (state === "delivered") {
        Object.assign(note, { status: "delivered", deliveredAt: daysAgo(9), receivedBy: "Le gérant" });
        await note.save();
        notesToInvoice.push(note);
      }
    }
    // One invoice per delivered BL, issued, partly paid.
    let fa = 0;
    for (const note of notesToInvoice) {
      const inv = await flow.invoiceDraftFromNotes([note], users.adv._id);
      fa += 1;
      Object.assign(inv, { number: `FA-${new Date().getFullYear()}-${String(fa).padStart(4, "0")}`, status: "issued", issuedAt: daysAgo(9), date: daysAgo(9), dueDate: fa === 1 ? daysAgo(2) : daysFromNow(50) });
      if (fa === 2) inv.payments.push({ date: daysAgo(3), amount: Math.round(inv.totalTTC * 0.5 * 100) / 100, method: "cheque", reference: "CHQ 0045871", dueDate: daysFromNow(25), collectedBy: inv.salesRep, by: users.adv._id });
      await inv.save();
    }
    // A direct invoice for an installer.
    const benali = customers["Plomberie Moderne Benali"];
    const direct = await SalesInvoice.create({ company: company._id, type: "invoice", customer: benali._id, salesRep: benali.salesRep, warehouse: wh.casa._id, moveStock: true, date: daysAgo(5), subject: "Chantier villa Californie", lines: await lines(benali, [["GRO-ES-DCH", 2], ["PPR-T25", 20], ["PPR-TE20", 30], ["ROC-RA-12", 6]]), status: "draft", createdBy: users.adv._id });
    direct.number = `FA-${new Date().getFullYear()}-${String(fa + 1).padStart(4, "0")}`;
    direct.status = "issued";
    direct.issuedAt = daysAgo(5);
    direct.dueDate = daysFromNow(25);
    await flow.moveInvoiceStock(direct, users.adv._id);
    await direct.save();
    log("✓ Devis, 5 commandes, BLs, 3 factures (1 échue, 1 en partie réglée)");

    // ---------------- a delivery round for tomorrow
    const toPlan = await DeliveryNote.find({ company: company._id, status: "validated" });
    const round = await createWithNumber(DeliveryRound, { company: company._id, date: daysFromNow(1), warehouse: wh.mrk._id, zone: "Marrakech", vehicle: "45871-A-40", driver: "Said Chauffeur", driverUser: users.driver._id, driverPhone: "+212661000099", createdBy: users.logistics._id }, "TR");
    let stop = 0;
    for (const nd of toPlan) { stop += 1; Object.assign(nd, { round: round._id, roundOrder: stop, driver: round.driver }); await nd.save(); }

    // ---------------- counter: an open session with a few tickets
    const session = await createWithNumber(CashSession, { company: company._id, warehouse: wh.show._id, register: "Caisse 1", cashier: users.cashier._id, openingFloat: 1000, openedAt: new Date(new Date().setHours(8, 30, 0, 0)) }, "CS");
    const walkIn = await Customer.create({ company: company._id, name: "Client comptoir", kind: "individual", type: "walk_in", code: "CL-COMPTOIR", priceLevel: "P4", paymentDays: 0, documentFlow: "direct" });
    const tickets = [
      [[["ING-LED-E27-9", 6], ["ING-SAR-INT", 2]], [["especes", 200]]],
      [[["GRO-ES-LAV", 1], ["SIK-SIL-280", 2]], [["carte", 600], ["especes", 300]]],
      [[["STA-MET-5", 1], ["FIS-SX8-100", 1]], [["especes", 150]]],
    ];
    for (const [items, pays] of tickets) {
      const l = await lines(walkIn, items);
      const totals = require("../services/salesCalc").computeLineTotals(l);
      const paid = pays.reduce((s, [, a]) => s + a, 0);
      const sale = await createWithNumber(PosSale, { company: company._id, session: session._id, warehouse: wh.show._id, cashier: users.cashier._id, customer: walkIn._id, lines: l, payments: pays.map(([method, amount]) => ({ method, amount })), amountTendered: pays.filter(([m]) => m === "especes").reduce((s, [, a]) => s + a, 0), change: Math.max(Math.round((paid - totals.totalTTC) * 100) / 100, 0) }, "TK");
      for (const line of sale.lines) {
        const out = await stock.issue({ product: line.product, warehouse: wh.show._id, quantity: line.quantity * line.unitFactor, reason: `Ticket ${sale.number}`, source: { kind: "pos", id: sale._id, number: sale.number }, actorId: users.cashier._id });
        line.unitCost = out.unitCost;
        line.lots = out.lots;
      }
      await sale.save();
    }
    log("✓ Tournée de demain, session de caisse ouverte (3 tickets)");

    // ---------------- 11 months of history (analytics)
    // Paid invoices and counter tickets of the previous months, with a
    // seasonal curve (spring building season, summer lull), slow growth,
    // a cost increase not yet passed on to prices (margin slips in the last
    // 3 months), a few late payers, fast movers about to run out and a few
    // articles that never sell. History doesn't move today's stock.
    {
      let seedState = 20260101;
      const rnd = () => { seedState = (seedState * 1664525 + 1013904223) % 4294967296; return seedState / 4294967296; };
      const pick = (list) => list[Math.floor(rnd() * list.length)];
      const SEASON = [0.85, 0.9, 1.05, 1.12, 1.15, 1.05, 0.8, 0.72, 1.0, 1.1, 1.05, 0.95];
      const NEVER = new Set(["BOS-PSB-750", "STA-CYL-3030", "JD-REC-80", "FIS-VA440"]);
      const HOT = ["ARI-FAST-11", "ARI-PRO1-80", "GRO-ES-DCH", "JD-ODE-60"];
      const refs = Object.keys(products).filter((r) => !NEVER.has(r));
      const b2bCustomers = Object.values(customers).filter((c) => c.type !== "walk_in");
      const LATE = new Set(["Bricolage Gueliz", "Atelier Peinture Ouarzazi", "Électro Souss"]);
      const today0 = new Date();
      let invNo = 0;
      let tkNo = 0;
      for (let back = 11; back >= 0; back -= 1) {
        const monthStart = new Date(today0.getFullYear(), today0.getMonth() - back, 1);
        const fullDays = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        // this month: only the days already past
        const days = back === 0 ? today0.getDate() - 1 : fullDays;
        if (days < 1) continue;
        const volume = SEASON[monthStart.getMonth()] * (1 + 0.015 * (11 - back)) * (days / fullDays);
        const costFactor = back <= 3 ? 0.99 : 0.94; // supplier increase, prices unchanged
        const nInvoices = back === 0 ? Math.ceil(13 * volume) + 1 : Math.max(3, Math.round(13 * volume));
        for (let i = 0; i < nInvoices; i += 1) {
          const c = pick(b2bCustomers);
          const big = c.type === "company";
          const items = [];
          const nLines = 3 + Math.floor(rnd() * 4);
          for (let k = 0; k < nLines; k += 1) {
            const ref = back <= 3 && rnd() < 0.3 ? pick(HOT) : pick(refs);
            if (items.some(([r]) => r === ref)) continue;
            const base = products[ref].sellingPrice > 500 ? 2 + Math.floor(rnd() * 6) : 10 + Math.floor(rnd() * 40);
            items.push([ref, Math.max(1, Math.round(base * (big ? 2.5 : 1) * volume))]);
          }
          const date = new Date(monthStart.getTime() + Math.floor(rnd() * days) * 86400000 + 10 * 3600000);
          const l = (await lines(c, items)).map((line) => ({ ...line, unitCost: Math.round((products[Object.keys(products).find((r) => String(products[r]._id) === String(line.product))].avgCost || 0) * costFactor * 100) / 100 }));
          const dueDate = new Date(date.getTime() + (c.paymentDays || 30) * 86400000);
          invNo += 1;
          const inv = new SalesInvoice({
            company: company._id, number: `FA-H${String(invNo).padStart(4, "0")}`, type: "invoice", customer: c._id, salesRep: c.salesRep, warehouse: c.defaultWarehouse,
            moveStock: false, date, dueDate, lines: l, status: "issued", issuedAt: date, createdBy: users.adv._id,
          });
          const ttc = require("../services/salesCalc").computeLineTotals(l).totalTTC;
          const late = LATE.has(c.name) && back >= 2 && back <= 4 && rnd() < 0.6;
          const paidAt = new Date(Math.min(dueDate.getTime() + Math.floor(rnd() * 20) * 86400000, today0.getTime() - 86400000));
          if (!late && dueDate < today0) {
            const method = pick(["virement", "cheque", "effet"]);
            // cheques & LCN carry a number, a bank and a due date (portfolio)
            const instrument = method === "cheque" ? { reference: `CHQ ${String(4170000 + invNo * 37).slice(-7)}`, dueDate: paidAt }
              : method === "effet" ? { reference: `LCN ${String(880000 + invNo * 53).slice(-6)}`, dueDate: new Date(paidAt.getTime() + (30 + (invNo % 3) * 15) * 86400000) } : {};
            inv.payments.push({ date: paidAt, amount: ttc, method, ...instrument, collectedBy: c.salesRep, by: users.adv._id });
          } else if (late && rnd() < 0.4) {
            inv.payments.push({ date: paidAt, amount: Math.round(ttc * 0.3 * 100) / 100, method: "cheque", collectedBy: c.salesRep, by: users.adv._id });
          }
          await inv.save();
        }
        // counter tickets (showroom)
        const nTickets = Math.round(28 * volume);
        const small = ["ING-LED-E27-9", "ING-SAR-INT", "ING-SAR-PC", "SIK-SIL-280", "STA-MET-5", "FIS-SX8-100", "STA-ROU-180", "STA-BRO-50", "ROC-RA-12", "LEG-SPOT-7", "COL-ACR-4", "GRO-ES-LAV"];
        for (let i = 0; i < nTickets; i += 1) {
          const items = [];
          for (let k = 0; k < 1 + Math.floor(rnd() * 3); k += 1) {
            const ref = pick(small);
            if (!items.some(([r]) => r === ref)) items.push([ref, 1 + Math.floor(rnd() * 4)]);
          }
          const date = new Date(monthStart.getTime() + Math.floor(rnd() * days) * 86400000 + 15 * 3600000);
          const l = (await lines(walkIn, items)).map((line) => ({ ...line, unitCost: Math.round((products[Object.keys(products).find((r) => String(products[r]._id) === String(line.product))].avgCost || 0) * costFactor * 100) / 100 }));
          tkNo += 1;
          const sale = new PosSale({ company: company._id, number: `TK-H${String(tkNo).padStart(5, "0")}`, session: session._id, warehouse: wh.show._id, cashier: users.cashier._id, customer: walkIn._id, date, lines: l, status: "completed" });
          sale.payments = [{ method: rnd() < 0.6 ? "especes" : "carte", amount: require("../services/salesCalc").computeLineTotals(l).totalTTC }];
          await sale.save();
        }
      }
      log(`✓ Historique 12 mois : ${invNo} factures, ${tkNo} tickets`);
      // Fast movers about to run out, whatever today's date: their stock is
      // set to ~8 days at their own 90-day pace (the dashboard's stockout card
      // and the purchase forecast always have something to show).
      const sold = await require("../services/analyticsService").articleSales(company._id, {}, true, daysAgo(90));
      for (const ref of ["JD-ODE-60", "GRO-ES-DCH", "SIK-SIL-280", "SCH-EZ9-16", "PPR-T20"]) {
        if (!products[ref]) continue;
        const p = await Product.findById(products[ref]._id);
        if (p.tracking && p.tracking !== "none") continue; // lots / serials: not taken out blindly
        const perDay = (sold.get(String(p._id))?.units || 0) / 90;
        let excess = Math.floor((p.quantity || 0) - Math.ceil(perDay * 8));
        for (const w of [wh.casa, wh.mrk, wh.show]) {
          const take = Math.min(excess, await stock.available(p._id, w._id));
          if (!(perDay > 0) || take <= 0) continue;
          await stock.issue({ product: p._id, warehouse: w._id, quantity: take, reason: "Ventes du dépôt (avant Sanity)", source: { kind: "manual" }, actorId: users.store._id });
          excess -= take;
        }
      }
    }

    // ---------------- advanced features: something to see on every new screen
    {
      const SalesSettings = require("../models/SalesSettings");
      const Promotion = require("../models/Promotion");
      const RebateAgreement = require("../models/RebateAgreement");
      const PaymentInstrument = require("../models/PaymentInstrument");
      const PortalUser = require("../models/PortalUser");
      const Visit = require("../models/Visit");
      const DeliveryProof = require("../models/DeliveryProof");
      const MessageLog = require("../models/MessageLog");
      const portfolio = require("../services/portfolioService");
      const landedCost = require("../services/landedCost");
      const { applyReceptionToLines, deriveReceptionStatus } = require("../services/purchaseOrderCalc");
      const year = new Date().getFullYear();

      // settings: e-invoicing in simulation, WhatsApp signature, portal open
      await pricing.getSettings(company._id); // creates the defaults
      await SalesSettings.updateOne({ company: company._id }, { $set: {
        "einvoicing.enabled": true, "einvoicing.provider": "simulation", "einvoicing.autoSubmit": false,
        "whatsapp.autoReminders": false, "whatsapp.reminderDays": [3, 15, 30], "whatsapp.signature": "Smart Way Distribution — service clients 05 22 00 00 00",
        "portal.enabled": true, "portal.showStock": "level", "portal.minOrderAmount": 1500, "portal.message": "Livraison offerte dès 5 000 MAD HT à Casablanca — commandes avant 16 h livrées le lendemain.",
      } });

      // suppliers' lead times (purchase forecast)
      for (const [i, sup] of [...new Set(Object.values(suppliers))].entries()) await Supplier.updateOne({ _id: sup._id }, { $set: { leadTimeDays: [7, 10, 15, 20][i % 4] } });
      for (const g of generalists) await Supplier.updateOne({ _id: g._id }, { $set: { leadTimeDays: 5 } });

      // customers' location (field app: route, distance of visits)
      const CITY = { Casablanca: [33.5731, -7.5898], Mohammedia: [33.6866, -7.3830], Agadir: [30.4278, -9.5981], Marrakech: [31.6295, -7.9811], Rabat: [34.0209, -6.8416] };
      const custList = Object.values(customers);
      for (const [i, c] of custList.entries()) {
        const base = CITY[c.city];
        if (!base) continue;
        c.gps = { lat: base[0] + ((i * 7) % 11 - 5) * 0.004, lng: base[1] + ((i * 5) % 9 - 4) * 0.004 };
        await Customer.updateOne({ _id: c._id }, { $set: { gps: c.gps, whatsapp: c.phone } });
      }

      // cheques & LCN: everything received goes to the portfolio; older ones cleared through
      // deposit slips, a few at the bank, one unpaid
      await portfolio.sync(company._id);
      const DepositSlip = require("../models/DepositSlip");
      const all = await PaymentInstrument.find({ company: company._id, status: "in_portfolio" }).sort({ dueDate: 1 });
      const now0 = new Date();
      const old = all.filter((x) => x.dueDate < daysAgo(20));
      const recent = all.filter((x) => x.dueDate >= daysAgo(20) && x.dueDate <= daysAgo(2));
      const byMonth = new Map();
      for (const x of old) {
        const k = `${x.kind}-${x.dueDate.getFullYear()}-${x.dueDate.getMonth()}`;
        if (!byMonth.has(k)) byMonth.set(k, []);
        byMonth.get(k).push(x);
      }
      for (const list of byMonth.values()) {
        const at = new Date(Math.max(...list.map((x) => x.dueDate.getTime())) + 2 * DAY);
        const slip = await portfolio.deposit(company._id, { instruments: list.map((x) => x._id), date: at, bankAccount: "Attijariwafa — compte courant" }, users.adv._id);
        for (const x of list) await portfolio.clear(await PaymentInstrument.findById(x._id), { date: new Date(Math.min(at.getTime() + 3 * DAY, now0.getTime())) }, users.adv._id);
        void slip;
      }
      if (recent.length >= 2) {
        const cheques = recent.filter((x) => x.kind === "cheque");
        if (cheques.length) {
          await portfolio.deposit(company._id, { instruments: cheques.map((x) => x._id), date: daysAgo(1), bankAccount: "Attijariwafa — compte courant" }, users.adv._id);
          // one comes back unpaid
          const bad = await PaymentInstrument.findById(cheques[0]._id);
          await portfolio.unpaid(bad, { date: new Date(), reason: "Provision insuffisante", fees: 50, block: false }, users.adv._id);
        }
      }
      const slips = await DepositSlip.countDocuments({ company: company._id });

      // an import reception with landed costs (freight, customs, transit agent) in the CMUP
      const importer = await Supplier.create({ company: company._id, name: "Foshan Sanitary Ware Co. (Chine)", city: "Foshan", paymentDays: 0, paymentTerms: "Crédit documentaire", leadTimeDays: 60 });
      const imp = await PurchaseOrder.create({
        company: company._id, number: `BC-${year}-0002`, supplier: importer._id, warehouse: wh.casa._id, status: "sent", date: daysAgo(70), expectedDate: daysAgo(10),
        notes: "Conteneur 20' — prix en USD (FOB Shenzhen)",
        lines: [
          { product: products["ROC-GAP-WCS"]._id, description: `${products["ROC-GAP-WCS"].name} (import)`, quantity: 40, unit: "pièce", unitPrice: 92, vatRate: 20 },
          { product: products["ROC-RA-12"]._id, description: `${products["ROC-RA-12"].name} (import)`, quantity: 600, unit: "pièce", unitPrice: 1.6, vatRate: 20 },
        ],
        createdBy: users.buyer._id,
      });
      const entries = imp.lines.map((l) => ({ lineId: String(l._id), quantity: l.quantity }));
      const { costs } = landedCost.normalizeCosts([
        { label: "Fret maritime Shenzhen → Casablanca", kind: "freight", amount: 9800, allocation: "weight" },
        { label: "Droits d'importation (2,5 %)", kind: "customs", percent: 2.5, allocation: "value" },
        { label: "Transitaire + magasinage port", kind: "transit", amount: 3200, allocation: "quantity" },
      ]);
      const allocation = landedCost.allocate(imp.lines.map((l) => ({ key: String(l._id), quantity: l.quantity, unitPrice: l.unitPrice, weightKg: products[l.product.equals(products["ROC-GAP-WCS"]._id) ? "ROC-GAP-WCS" : "ROC-RA-12"].weightKg })), costs, { exchangeRate: 10.05 });
      for (const l of imp.lines) {
        const a = allocation.lines.find((x) => x.key === String(l._id));
        await stock.receive({ product: l.product, warehouse: wh.casa, quantity: l.quantity, unitCost: a.unitCost, reason: `Réception ${imp.number} (BL CNT-77820)`, source: { kind: "purchase", id: imp._id, number: imp.number }, actorId: users.store._id, supplier: importer._id, isPurchase: true });
      }
      applyReceptionToLines(imp, "reception", entries);
      imp.receptions.push({
        type: "reception", reference: "CNT-77820", date: daysAgo(8), lines: entries.map((e) => ({ lineId: e.lineId, quantity: e.quantity })), notes: "Conteneur dédouané le " + daysAgo(9).toLocaleDateString("fr-FR"), by: users.store._id,
        landed: { exchangeRate: 10.05, allocation: "value", costs: allocation.costs, lines: allocation.lines.map((x) => ({ lineId: x.key, quantity: x.quantity, goodsUnitCost: x.goodsUnitCost, extraUnitCost: x.extraUnitCost, unitCost: x.unitCost })), totalGoods: allocation.totalGoods, totalCosts: allocation.totalCosts },
      });
      imp.status = deriveReceptionStatus(imp);
      await imp.save();

      // promotions (none on Grohe: those prices stay the reference in the demo)
      await Promotion.create({ company: company._id, name: "Legrand Céliane / Niloé −12 %", type: "percent", value: 12, startDate: daysAgo(5), endDate: daysFromNow(25), brands: [brands.Legrand._id], channels: ["sales", "pos"], createdBy: users.salesDirector._id });
      await Promotion.create({ company: company._id, name: "Colorado 10 + 1", type: "free_goods", buyQuantity: 10, freeQuantity: 1, startDate: daysAgo(10), endDate: daysFromNow(20), brands: [brands.Colorado._id], customerTypes: ["reseller", "installer"], channels: ["sales"], createdBy: users.salesDirector._id });
      await Promotion.create({ company: company._id, name: "Ampoules LED — prix comptoir", type: "price", value: 8.5, startDate: daysAgo(3), endDate: daysFromNow(11), products: [products["ING-LED-E27-9"]._id], channels: ["pos"], createdBy: users.salesDirector._id });
      await Promotion.create({ company: company._id, name: "Rentrée chantiers — Schneider −8 %", type: "percent", value: 8, startDate: daysFromNow(15), endDate: daysFromNow(45), brands: [brands["Schneider Electric"]._id], customerTypes: ["company", "installer"], channels: ["sales"], createdBy: users.salesDirector._id });
      // year-end rebate for resellers, by tier
      await RebateAgreement.create({
        company: company._id, name: `RFA revendeurs ${year}`, from: new Date(year - 1, now0.getMonth(), 1), to: new Date(year, now0.getMonth() + 2, 0), customerTypes: ["reseller"], mode: "whole",
        tiers: [{ threshold: 50000, percent: 1 }, { threshold: 120000, percent: 2 }, { threshold: 250000, percent: 3 }], createdBy: users.salesDirector._id,
      });

      // field app: orders taken on the road and visits with GPS (last 2 weeks)
      const repCustomers = custList.filter((c) => c.salesRep && c.type !== "walk_in" && c.gps);
      const OUTCOMES = ["order", "no_order", "collection", "no_order", "order", "closed", "prospect", "order"];
      let v = 0;
      for (let d = 13; d >= 1; d -= 1) {
        if (new Date(Date.now() - d * DAY).getDay() === 0) continue; // no visits on Sunday
        for (let k = 0; k < 2; k += 1) {
          const c = repCustomers[(d * 3 + k * 5) % repCustomers.length];
          const outcome = OUTCOMES[(d + k) % OUTCOMES.length];
          const far = (d + k) % 9 === 0; // a visit logged far from the shop
          const when = new Date(Date.now() - d * DAY); when.setHours(9 + k * 3, 15 + d, 0, 0);
          let order = null;
          if (outcome === "order") {
            order = await createWithNumber(SalesOrder, {
              company: company._id, customer: c._id, salesRep: c.salesRep, warehouse: c.defaultWarehouse || wh.casa._id, priceLevel: c.priceLevel, source: "rep",
              clientRef: `seed-ord-${d}-${k}`, gps: { lat: c.gps.lat + 0.0003, lng: c.gps.lng - 0.0002, accuracy: 12 }, date: when,
              lines: (await lines(c, [[["SIK-SIL-280", "PPR-T20", "ING-SAR-INT", "LEG-NIL-VV"][d % 4], 12 + d], [["ROC-RA-12", "COL-ACR-4", "STA-MET-5"][k % 3], 6]])).map((l) => ({ ...l, deliveredQuantity: 0 })),
              notes: "Prise sur l'application terrain", createdBy: c.salesRep,
            }, "CC");
          }
          v += 1;
          await Visit.create({
            company: company._id, customer: c._id, rep: c.salesRep, visitedAt: when, outcome, order: order?._id || null, clientRef: `seed-vis-${v}`,
            gps: far ? { lat: c.gps.lat + 0.02, lng: c.gps.lng + 0.015, accuracy: 30 } : { lat: c.gps.lat + 0.0003, lng: c.gps.lng - 0.0002, accuracy: 12 },
            distanceMeters: far ? 2650 : 40,
            notes: ["Demande le catalogue Grohe 2027", "Concurrent moins cher sur les câbles Nexans", "Promet un règlement vendredi", "Magasin fermé (inventaire)", "Intéressé par le portail de commande", "Stock de silicone bas", "", "Veut une remise sur Legrand"][v % 8],
            nextVisitAt: outcome === "no_order" ? daysFromNow(7) : null,
          });
        }
      }

      // proof of delivery on the delivered BLs (signature taken on the driver's phone)
      const delivered = await DeliveryNote.find({ company: company._id, status: "delivered", proof: null });
      for (const note of delivered) {
        const cust = custList.find((c) => String(c._id) === String(note.customer));
        const proof = await DeliveryProof.create({ company: company._id, note: note._id, signature: signaturePng(), receivedBy: note.receivedBy || "Le gérant", gps: cust?.gps ? { ...cust.gps, accuracy: 15 } : undefined, takenAt: note.deliveredAt || new Date(), by: users.driver._id });
        note.proof = proof._id;
        await note.save();
      }

      // reseller portal: a login for Quincaillerie Al Amal, and an order placed online
      const alamal = customers["Quincaillerie Al Amal"];
      await PortalUser.create({ company: company._id, customer: alamal._id, name: "Hassan (achats Al Amal)", email: `revendeur${DOMAIN}`, phone: alamal.phone, password: "Revendeur@123", role: "buyer", mustChangePassword: false, createdBy: users.adv._id });
      await createWithNumber(SalesOrder, {
        company: company._id, customer: alamal._id, salesRep: alamal.salesRep, warehouse: wh.casa._id, priceLevel: alamal.priceLevel, source: "online", customerReference: "BC-AA-1187",
        date: daysAgo(1), deliveryMode: "delivery", deliveryAddress: alamal.address,
        lines: (await lines(alamal, [["SIK-SIL-280", 24], ["COL-ACR-4", 10], ["ROC-RA-12", 50]])).map((l) => ({ ...l, deliveredQuantity: 0 })),
        notes: "Commande portail — Hassan (achats Al Amal)",
      }, "CC");

      // WhatsApp history (prepared links: WhatsApp Business not connected in the demo)
      const sentInvoices = await SalesInvoice.find({ company: company._id, type: "invoice", status: { $in: ["issued", "partially_paid"] }, number: /^FA-\d{4}-/ }).limit(3).lean();
      for (const inv of sentInvoices) {
        const c = custList.find((x) => String(x._id) === String(inv.customer));
        if (!c?.phone) continue;
        await MessageLog.create({ company: company._id, kind: "invoice", customer: c._id, invoices: [inv._id], to: c.phone.replace(/\D/g, ""), text: `Bonjour ${c.name}, veuillez trouver notre facture ${inv.number}.`, status: "link", provider: "link", sentBy: users.adv._id });
      }
      const st = custList.find((c) => c.name === "Comptoir du Bâtiment Hay Hassani");
      await MessageLog.create({ company: company._id, kind: "statement", customer: st._id, to: st.phone.replace(/\D/g, ""), text: `Bonjour ${st.name}, voici votre relevé de compte.`, status: "link", provider: "link", sentBy: users.rep1._id });

      // DGI e-invoicing (simulation): the recent invoices of business customers are cleared
      const einvoice = require("../services/einvoiceService");
      let cleared = 0;
      for (const inv of await SalesInvoice.find({ company: company._id, type: "invoice", status: { $in: ["issued", "partially_paid"] }, number: /^FA-\d{4}-/ }).select("_id").lean()) {
        try { await einvoice.submit(inv._id); cleared += 1; } catch { /* a buyer without ICE: shown as "à corriger" */ }
      }
      log(`✓ Fonctions avancées : ${slips} bordereaux de remise, 4 promotions, RFA, frais d'approche (${imp.number}), ${v} visites, ${delivered.length} preuve(s) de livraison, portail (revendeur${DOMAIN}), ${cleared} facture(s) électronique(s)`);
    }

    // ---------------- targets
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await SalesTarget.create({ company: company._id, salesRep: users.rep1._id, period, revenueTarget: 170000, collectionTarget: 160000, newCustomersTarget: 4, commissionRate: 2, bonus: 2000 });
    await SalesTarget.create({ company: company._id, salesRep: users.rep2._id, period, revenueTarget: 140000, collectionTarget: 130000, newCustomersTarget: 3, commissionRate: 2, bonus: 1500 });
    log("✓ Objectifs du mois");

    return { tenant, company, users, warehouses: wh, products, customers };
  });
}

const ACCOUNTS = [
  ["Admin (tout)", "admin", "Admin@123"],
  ["Gérant / propriétaire", "direction", "Direction@123"],
  ["Directeur commercial", "commercial", "Commercial@123"],
  ["Commercial terrain (Casa)", "karim", "Karim@123"],
  ["Commerciale terrain (Sud)", "leila", "Leila@123"],
  ["ADV (facturation)", "adv", "Adv@123"],
  ["Caissier showroom", "caisse", "Caisse@123"],
  ["Chef de dépôt", "magasin", "Magasin@123"],
  ["Acheteuse", "achats", "Achats@123"],
  ["Responsable logistique", "logistique", "Logistique@123"],
  ["Chauffeur", "chauffeur", "Chauffeur@123"],
  ["Directrice RH", "rh", "Rh@123"],
  ["Comptable (TVA, écritures, chèques & LCN)", "comptable", "Comptable@123"],
];

async function run() {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  // Demo accounts with published passwords: never on a production database.
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("✗ NODE_ENV=production: the demo seed (published passwords) is refused. Add --force only for a demo server.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB");
  try {
    await seedSanityClient();
    console.log("\n============================================================");
    console.log(" Sanity — démo Smart Way Distribution");
    console.log("============================================================");
    for (const [label, key, pwd] of ACCOUNTS) console.log(`  ${label.padEnd(28)} ${`${key}${DOMAIN}`.padEnd(26)} / ${pwd}`);
    console.log("============================================================\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  }
  await mongoose.disconnect();
}

if (require.main === module) run();

module.exports = { seedSanityClient, DEMO_TENANT, DOMAIN, ACCOUNTS };
