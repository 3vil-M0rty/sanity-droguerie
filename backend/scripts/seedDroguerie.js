/**
 * ============================================================
 * SANITY DROGUERIE — DEMO SEED: a neighbourhood droguerie
 * ============================================================
 * "Droguerie Al Baraka", a small shop in Casablanca (Hay Mohammadi)
 * selling paint, hardware, plumbing, electrical supplies, cleaning
 * products and tools to households and local craftsmen:
 *   - the owner (Si Hassan) and one shop assistant
 *   - ~60 articles with their prices and stock, a few to reorder
 *   - 3 wholesalers (Derb Omar, Garage Allal) with purchases part paid
 *   - craftsmen buying on credit (the "carnet"), with part payments
 *   - two weeks of counter sales (cash, card, credit, misc. items),
 *     today's till still open
 * Not VAT-registered (most small drogueries aren't): prices are TTC = HT.
 *
 * Everything goes through the real API (routes/droguerie.js, routes/pos.js…),
 * so the demo holds exactly what the shop screens would have created.
 *
 * Run:   npm run seed:droguerie        (from backend/, MONGODB_URI in .env)
 * Undo:  npm run unseed:droguerie
 * The seed refuses to run twice: unseed first.
 * ============================================================
 */
const tenantScope = require("../services/tenantScope");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const express = require("express");

const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Company = require("../models/Company");
const InventoryCategory = require("../models/InventoryCategory");
const PosSale = require("../models/PosSale");
const SalesInvoice = require("../models/SalesInvoice");
const CashSession = require("../models/CashSession");
const InventoryMovement = require("../models/InventoryMovement");
const { signSessionToken } = require("../services/sessionToken");

const DEMO_TENANT = "Droguerie Al Baraka (démo)";
const DOMAIN = "@sanity.test";
const DAY = 86400000;
const PAST_DAYS = 14;

const ACCOUNTS = [
  ["Gérant (Si Hassan)", "droguerie", "Droguerie@123"],
  ["Vendeur (Ayoub)", "vendeur", "Vendeur@123"],
];

// [name, unit, sale price TTC, purchase cost TTC, stock bought, minimum, family, barcode?]
const ARTICLES = [
  ["Peinture Colorado Vinylique blanc 15 kg", "seau", 420, 330, 8, 3, "Peinture", "6111250010015"],
  ["Peinture Colorado Vinylique blanc 4 kg", "pot", 125, 96, 15, 5, "Peinture", "6111250010046"],
  ["Peinture Astral Glycéro blanc 2,5 L", "pot", 165, 128, 6, 2, "Peinture"],
  ["Peinture façade Colorado 15 kg", "seau", 520, 410, 4, 2, "Peinture"],
  ["Laque Colorado brillante 1 L", "pot", 75, 56, 12, 4, "Peinture"],
  ["Enduit de lissage 25 kg", "sac", 110, 82, 10, 3, "Peinture"],
  ["Plâtre 25 kg", "sac", 45, 33, 20, 6, "Peinture"],
  ["Diluant 1 L", "bouteille", 28, 19, 24, 6, "Peinture"],
  ["Colorant universel 50 ml", "tube", 15, 9, 40, 10, "Peinture"],
  ["Rouleau peinture 18 cm", "pièce", 30, 18, 20, 5, "Peinture"],
  ["Pinceau plat 50 mm", "pièce", 18, 10, 30, 8, "Peinture"],
  ["Bac à peinture", "pièce", 22, 13, 10, 3, "Peinture"],
  ["Papier abrasif grain 120", "feuille", 4, 2, 100, 20, "Peinture"],
  ["Ruban de masquage 48 mm", "rouleau", 16, 10, 24, 6, "Peinture"],
  ["Vis à bois 4×40 (boîte 100)", "boîte", 25, 15, 20, 5, "Quincaillerie"],
  ["Chevilles nylon 8 mm (sachet 50)", "sachet", 15, 8, 30, 8, "Quincaillerie"],
  ["Clous 60 mm (1 kg)", "kg", 22, 14, 15, 4, "Quincaillerie"],
  ["Cadenas laiton 40 mm", "pièce", 45, 28, 12, 3, "Quincaillerie"],
  ["Serrure porte intérieure", "pièce", 85, 58, 6, 2, "Quincaillerie"],
  ["Charnière acier 100 mm", "pièce", 12, 7, 40, 10, "Quincaillerie"],
  ["Silicone sanitaire blanc", "cartouche", 35, 22, 24, 6, "Quincaillerie"],
  ["Colle forte Pattex 50 g", "tube", 32, 21, 15, 4, "Quincaillerie"],
  ["Mastic vitrier 1 kg", "pot", 20, 12, 10, 3, "Quincaillerie"],
  ["Robinet lavabo simple", "pièce", 95, 62, 8, 2, "Plomberie"],
  ["Mitigeur évier", "pièce", 240, 170, 4, 2, "Plomberie"],
  ["Flexible douche 1,5 m", "pièce", 35, 21, 12, 3, "Plomberie"],
  ["Pomme de douche", "pièce", 45, 28, 10, 3, "Plomberie"],
  ["Siphon lavabo PVC", "pièce", 28, 16, 10, 3, "Plomberie"],
  ["Téflon (rouleau)", "rouleau", 5, 2.5, 60, 15, "Plomberie"],
  ["Tube PVC Ø 40 (3 m)", "barre", 38, 26, 15, 4, "Plomberie"],
  ["Coude PVC Ø 40", "pièce", 4, 2, 50, 10, "Plomberie"],
  ["Colle PVC 250 ml", "pot", 30, 19, 10, 3, "Plomberie"],
  ["Mécanisme chasse d'eau", "pièce", 85, 55, 6, 2, "Plomberie"],
  ["Ampoule LED 9 W E27", "pièce", 15, 8, 60, 15, "Électricité", "6111250090093"],
  ["Ampoule LED 15 W E27", "pièce", 25, 14, 30, 8, "Électricité"],
  ["Réglette LED 120 cm", "pièce", 75, 48, 8, 2, "Électricité"],
  ["Prise murale 2P+T", "pièce", 18, 10, 30, 8, "Électricité"],
  ["Interrupteur simple", "pièce", 16, 9, 30, 8, "Électricité"],
  ["Multiprise 4 prises", "pièce", 45, 27, 10, 3, "Électricité"],
  ["Rallonge 5 m", "pièce", 60, 38, 6, 2, "Électricité"],
  ["Fil électrique 1,5 mm² (couronne 100 m)", "couronne", 260, 195, 3, 1, "Électricité"],
  ["Ruban isolant", "rouleau", 6, 3, 50, 12, "Électricité"],
  ["Pile alcaline AA (lot de 4)", "lot", 20, 12, 20, 6, "Électricité"],
  ["Javel 1 L", "bouteille", 8, 5, 48, 12, "Entretien"],
  ["Javel 5 L", "bidon", 30, 20, 12, 4, "Entretien"],
  ["Esprit de sel 1 L", "bouteille", 12, 7, 24, 6, "Entretien"],
  ["Savon liquide 5 L", "bidon", 45, 30, 8, 3, "Entretien"],
  ["Détergent sol 1 L", "bouteille", 18, 11, 24, 6, "Entretien"],
  ["Éponges (lot de 5)", "lot", 10, 5, 30, 8, "Entretien"],
  ["Serpillière", "pièce", 15, 8, 20, 5, "Entretien"],
  ["Balai coco", "pièce", 30, 18, 10, 3, "Entretien"],
  ["Raclette sol 45 cm", "pièce", 25, 14, 10, 3, "Entretien"],
  ["Sacs poubelle 100 L (rouleau)", "rouleau", 18, 10, 25, 6, "Entretien"],
  ["Insecticide 400 ml", "bombe", 35, 23, 12, 4, "Entretien"],
  ["Marteau 500 g", "pièce", 55, 34, 6, 2, "Outillage"],
  ["Tournevis (jeu de 6)", "jeu", 60, 38, 6, 2, "Outillage"],
  ["Pince universelle", "pièce", 45, 28, 6, 2, "Outillage"],
  ["Mètre ruban 5 m", "pièce", 25, 14, 12, 3, "Outillage"],
  ["Cutter + 5 lames", "pièce", 15, 8, 20, 5, "Outillage"],
  ["Niveau à bulle 40 cm", "pièce", 50, 32, 4, 2, "Outillage"],
  ["Gants de travail", "paire", 15, 8, 2, 6, "Outillage"],
];

const SUPPLIERS = [
  { name: "Comptoir Derb Omar Peintures", families: ["Peinture"] },
  { name: "Quincaillerie Générale Garage Allal", families: ["Quincaillerie", "Plomberie", "Outillage"] },
  { name: "Distrib Électro & Hygiène Casa", families: ["Électricité", "Entretien"] },
];

// [name, phone, credit limit] — craftsmen and neighbours on the carnet
const CUSTOMERS = [
  ["Mustapha Saïdi (peintre)", "0661234501", 5000],
  ["Abdelkader (plombier)", "0662345602", 3000],
  ["Brahim Électricité", "0663456703", 3000],
  ["Mme Khadija Benali", "0664567804", 1000],
  ["Café Al Amal", "0522612345", 2000],
  ["Rachid (maçon)", "0665678905", 2000],
];

/**
 * One picture per article (its family's) and the shop logo, stored like uploaded
 * photos (services/storageService.js). A storage failure doesn't stop the seed.
 */
async function addPictures(company, families) {
  const storage = require("../services/storageService");
  const { articlePicture, shopLogo } = require("./demoPictures");
  const Product = require("../models/Product");
  const familyOf = new Map(Object.entries(families).map(([name, id]) => [String(id), name]));
  const products = await Product.find({ company: company._id }).select("category").lean();
  let stored = 0;
  try {
    const logo = await storage.uploadImage(await shopLogo(), `companies/${company._id}/logo`, { companyId: company._id });
    await Company.updateOne({ _id: company._id }, { $set: { logo: { url: logo.secure_url, publicId: logo.public_id } } });
    stored += 1;
    for (let i = 0; i < products.length; i += 4) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(products.slice(i, i + 4).map(async (p, j) => {
        const img = await storage.uploadImage(await articlePicture(familyOf.get(String(p.category)), i + j), `companies/${company._id}/products`, { companyId: company._id });
        await Product.updateOne({ _id: p._id }, { $set: { image: { url: img.secure_url, publicId: img.public_id, thumbUrl: img.thumb_url } } });
        stored += 1;
      }));
    }
  } catch (err) {
    console.warn(`  (pictures stopped: ${err.message})`);
  }
  return stored;
}

/** Small HTTP client over the in-process API. */
function client(base, token) {
  const call = async (method, url, body) => {
    const res = await fetch(`${base}${url}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${json.message || ""}`);
    return json.data;
  };
  return { get: (u) => call("GET", u), post: (u, b) => call("POST", u, b), put: (u, b) => call("PUT", u, b) };
}

function demoApp() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
  for (const [p, file] of [["droguerie", "droguerie"], ["pos", "pos"], ["customers", "customers"], ["sales-settings", "salesSettings"]]) app.use(`/api/${p}`, require(`../routes/${file}`));
  return app;
}

/** Moves documents made "now" back to a past day (same time of day). */
async function backdate(day, { sales, invoices, session, since }) {
  const shift = (d) => new Date(new Date(d).getTime() - day * DAY);
  for (const s of await PosSale.find({ _id: { $in: sales } }).select("date").lean()) {
    await PosSale.updateOne({ _id: s._id }, { $set: { date: shift(s.date) } }, { timestamps: false });
  }
  for (const inv of await SalesInvoice.find({ _id: { $in: invoices } }).select("date dueDate issuedAt payments").lean()) {
    const set = { date: shift(inv.date), dueDate: shift(inv.dueDate || inv.date), issuedAt: shift(inv.issuedAt || inv.date) };
    (inv.payments || []).forEach((p, i) => { set[`payments.${i}.date`] = shift(p.date); });
    await SalesInvoice.updateOne({ _id: inv._id }, { $set: set }, { timestamps: false });
  }
  if (session) {
    const s = await CashSession.findById(session).select("openedAt closedAt").lean();
    await CashSession.updateOne({ _id: session }, { $set: { openedAt: shift(s.openedAt), ...(s.closedAt ? { closedAt: shift(s.closedAt) } : {}) } }, { timestamps: false });
  }
  // Stock history: the movement's date is its creation date.
  try {
    const moves = await InventoryMovement.find({ createdAt: { $gte: since } }).select("createdAt").lean();
    for (const m of moves) await InventoryMovement.collection.updateOne({ _id: m._id }, { $set: { createdAt: shift(m.createdAt) } });
  } catch { /* in-memory test database: history dates stay as they are */ }
}

// Deterministic "random" so every demo looks the same.
function rng(seed) {
  let x = seed;
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
}

async function seedDroguerieClient({ log = console.log } = {}) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  if (await Tenant.exists({ name: DEMO_TENANT })) throw new Error(`"${DEMO_TENANT}" already exists — run "npm run unseed:droguerie" first`);

  // ---------------- client, shop, logins
  const tenant = await Tenant.create({ name: DEMO_TENANT, edition: "droguerie" });
  const ctx = tenantScope.tenantContext({ tenantId: tenant._id, companyIds: [] });
  const { users, company, families } = await tenantScope.runInTenant(ctx, async () => {
    const mk = (firstName, lastName, key, role, department, password, extra = {}) =>
      User.create({ firstName, lastName, email: `${key}${DOMAIN}`, password, role, department, ...extra });
    const owner = await mk("Hassan", "Baraka", "droguerie", "owner", "management", "Droguerie@123");
    const shop = await Company.create({
      name: "Droguerie Al Baraka", legalForm: "OTHER", legalFormOther: "Personne physique", industry: "Droguerie — peinture, quincaillerie, plomberie, électricité, entretien",
      size: "small", currency: "MAD", owner: owner._id, phone: "+212522600000",
      address: { street: "Bd Ali Yaâta, n° 48, Hay Mohammadi", city: "Casablanca", region: "Casablanca-Settat", country: "Maroc" },
      ice: "003456789000012", professionalTaxNumber: "34871256",
    });
    ctx.companyIds.push(shop._id);
    const { PRESETS } = require("../config/permissionCatalog");
    const cashier = PRESETS.find((p) => p.key === "cashier").keys();
    const seller = await mk("Ayoub", "Vendeur", "vendeur", "user", "pos", "Vendeur@123", { permissionsMode: "custom" });
    await User.updateOne({ _id: seller._id }, { permissions: [...new Set([...cashier, "sales.customers.view", "sales.customers.create", "sales.payments.create", "inventory.articles.view"])] });
    const fam = {};
    for (const name of ["Peinture", "Quincaillerie", "Plomberie", "Électricité", "Entretien", "Outillage"]) fam[name] = (await InventoryCategory.create({ company: shop._id, name }))._id;
    return { users: { owner, seller }, company: shop, families: fam };
  });
  log("✓ Shop & logins");

  // ---------------- the API, in process
  const server = http.createServer(demoApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const api = client(base, signSessionToken(users.owner));
  const sellerApi = client(base, signSessionToken(users.seller));
  const companyId = String(company._id);
  const rand = rng(42);
  try {
    await api.put(`/sales-settings?companyId=${companyId}`, { companyId, vatRegistered: false, ticketFooter: "Merci de votre visite — Droguerie Al Baraka" });

    // ---------------- articles, bought from the wholesalers 3 weeks ago
    const articles = [];
    for (const [i, s] of SUPPLIERS.entries()) {
      const lines = ARTICLES.filter((a) => s.families.includes(a[6])).map(([name, unit, price, cost, qty, threshold, family, barcode]) => ({
        newArticle: { name, unit, salePriceTTC: price, threshold, category: String(families[family]), barcode }, quantity: qty, unitCost: cost,
      }));
      const date = new Date(Date.now() - (21 - i) * DAY);
      const total = lines.reduce((t, l) => t + l.quantity * l.unitCost, 0);
      // Paid part in cash, the rest owed (as most shops do with their wholesaler).
      await api.post("/droguerie/purchases", { companyId, supplierName: s.name, reference: `BL ${4500 + i * 37}`, date, lines, paid: { amount: Math.round(total * [0.6, 0.5, 1][i]), method: i === 1 ? "cheque" : "especes" } });
    }
    // A refill last week from the paint wholesaler.
    const suppliers = (await api.get(`/droguerie/suppliers?companyId=${companyId}`)).rows;
    const Product = require("../models/Product");
    for (const p of await tenantScope.runInTenant(ctx, () => Product.find({ company: company._id }).select("name sellingPrice avgCost unit").lean())) articles.push(p);
    const byName = new Map(articles.map((p) => [p.name, p]));
    const paintSupplier = suppliers.find((s) => s.name.startsWith("Comptoir Derb Omar"));
    await api.post("/droguerie/purchases", {
      companyId, supplier: paintSupplier._id, reference: "BL 4688", date: new Date(Date.now() - 6 * DAY),
      lines: [["Peinture Colorado Vinylique blanc 4 kg", 10, 96], ["Rouleau peinture 18 cm", 10, 18], ["Diluant 1 L", 12, 19]].map(([n, q, c]) => ({ product: String(byName.get(n)._id), quantity: q, unitCost: c })),
      paid: { amount: 0 },
    });
    log(`✓ ${articles.length} articles, ${SUPPLIERS.length} wholesalers`);

    // ---------------- pictures: article photos and the shop logo (Cloudinary when configured)
    const pictures = await tenantScope.runInTenant(ctx, () => addPictures(company, families));
    log(`✓ ${pictures} pictures stored (${require("../services/storageService").driver()})`);

    // ---------------- the carnet's customers
    const customers = [];
    for (const [name, phone, creditLimit] of CUSTOMERS) customers.push(await api.post("/customers", { company: companyId, name, phone, whatsapp: phone, type: name.includes("Mme") ? "retail" : "installer", creditLimit, city: "Casablanca" }));

    // ---------------- two weeks of counter sales
    const everyday = articles.filter((a) => (a.sellingPrice || 0) <= 60);
    const pick = (list) => list[Math.floor(rand() * list.length)];
    let tickets = 0;
    for (let day = PAST_DAYS; day >= 0; day -= 1) {
      const since = new Date();
      const actor = day % 3 === 1 ? sellerApi : api; // today: the owner's till
      const session = await actor.post("/pos/sessions/open", { company: companyId, register: "Comptoir", openingFloat: 300 });
      const sales = [];
      const count = day === 0 ? 5 : 4 + Math.floor(rand() * 5);
      for (let n = 0; n < count; n += 1) {
        const lines = [];
        const nLines = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < nLines; k += 1) {
          const p = rand() < 0.75 ? pick(everyday) : pick(articles);
          if (!lines.some((l) => l.product === String(p._id))) lines.push({ product: String(p._id), quantity: 1 + Math.floor(rand() * 2) });
        }
        if (rand() < 0.12) lines.push({ description: pick(["Clés reproduites", "Peinture teintée sur mesure", "Découpe de verre"]), quantity: 1, unitPrice: pick([15, 25, 40]), vatRate: 0 });
        const total = lines.reduce((t, l) => t + (l.product ? (articles.find((a) => String(a._id) === l.product).sellingPrice || 0) : l.unitPrice) * l.quantity, 0);
        const roll = rand();
        let body;
        if (roll < 0.28) {
          // on the carnet: a craftsman takes it now, pays later
          body = { customer: String(pick(customers)._id), payments: [{ method: "credit", amount: Math.round(total * 100) / 100 }] };
        } else if (roll < 0.36) {
          body = { payments: [{ method: "carte", amount: Math.round(total * 100) / 100 }] };
        } else {
          body = { payments: [{ method: "especes", amount: Math.ceil(total / 10) * 10 }] };
        }
        try {
          // eslint-disable-next-line no-await-in-loop
          sales.push(await actor.post("/pos/sales", { session: session._id, lines, ...body }));
          tickets += 1;
        } catch (err) {
          if (!/stock insuffisant|credit|crédit|plafond|limit/i.test(err.message)) throw err;
        }
      }
      if (day > 0) {
        const s = await actor.get(`/pos/sessions/current?companyId=${companyId}`);
        await actor.post(`/pos/sessions/${session._id}/close`, { counted: { especes: s?.expected?.especes || 0, carte: s?.expected?.carte || 0 } });
        await tenantScope.runInTenant(ctx, () => backdate(day, { sales: sales.map((x) => x._id), invoices: sales.map((x) => x.invoice?._id).filter(Boolean), session: session._id, since }));
      }
    }
    log(`✓ ${tickets} tickets over ${PAST_DAYS + 1} days (today's till open)`);

    // ---------------- some craftsmen paid part of their carnet
    const carnet = (await api.get(`/droguerie/carnet?companyId=${companyId}`)).rows;
    for (const [i, c] of carnet.entries()) {
      if (i % 2 === 1 || c.due < 50) continue;
      await api.post(`/droguerie/carnet/${c._id}/payment`, { amount: Math.round(c.due * 0.4), method: i === 0 ? "cheque" : "especes", reference: i === 0 ? "CHQ 0012457" : "", date: new Date(Date.now() - 2 * DAY) });
    }
    // and the shop paid the hardware wholesaler a bit more
    const hardware = suppliers.find((s) => s.name.startsWith("Quincaillerie"));
    if (hardware) await api.post(`/droguerie/suppliers/${hardware._id}/payment`, { amount: 500, method: "especes", date: new Date(Date.now() - 3 * DAY) });

    const home = await api.get(`/droguerie/home?companyId=${companyId}`);
    log(`✓ Carnet ${home.carnet.total} MAD (${home.carnet.customers} customers) · owed to suppliers ${home.suppliers.total} MAD · ${home.lowStock.length} articles to reorder`);
    return { tenant, company, users, home };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function run() {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("✗ NODE_ENV=production: the demo seed (published passwords) is refused. Add --force only for a demo server.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✓ Connected to MongoDB");
  try {
    await tenantScope.runAsSystem(() => seedDroguerieClient());
    console.log("\n============================================================");
    console.log(" Sanity Droguerie — démo Droguerie Al Baraka");
    console.log("============================================================");
    for (const [label, key, pwd] of ACCOUNTS) console.log(`  ${label.padEnd(22)} ${`${key}${DOMAIN}`.padEnd(26)} / ${pwd}`);
    console.log("============================================================\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  }
  await mongoose.disconnect();
}

if (require.main === module) run();

module.exports = { seedDroguerieClient, DEMO_TENANT, ACCOUNTS };
