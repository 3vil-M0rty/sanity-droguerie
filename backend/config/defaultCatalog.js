/**
 * ============================================================
 * SANITY — DEFAULT PRICE CATALOGUE (MAD, excl. VAT)
 * ============================================================
 * Loaded once by the platform owner (Platform → Abonnements &
 * factures → Offres → "Charger le catalogue Sanity", or
 * `npm run seed:plans`). Existing plans with the same code are left
 * untouched, so your own price changes are never overwritten.
 * Edit prices afterwards in the platform, not here.
 *
 * Yearly = 10 months (2 months free). The set-up fee is invoiced once,
 * when the client signs (import, configuration, training).
 * ============================================================
 */

const PLANS = [
  {
    code: "ESSENTIEL",
    storageQuotaMB: 5120,
    name: "Essentiel",
    sort: 1,
    audience: "Commerçant ou petit grossiste, un seul site",
    monthlyPriceHT: 1490,
    yearlyPriceHT: 14900,
    setupFeeHT: 9900,
    includedUsers: 5,
    includedWarehouses: 1,
    limits: { maxCompanies: 1, maxEmployees: null },
    features: [
      "1 dépôt + caisse comptoir, 5 utilisateurs",
      "Articles, cartons, lots et n° de série, CMUP",
      "Devis, commandes, bons de livraison, factures, avoirs",
      "Caisse comptoir et tickets",
      "Achats, fournisseurs, réceptions",
      "Tarifs par niveau de client",
      "Import Excel des articles, clients et stock",
      "Factures prêtes pour la facture électronique DGI",
      "Export comptable et déclaration de TVA",
      "Support par e-mail (jours ouvrés)",
    ],
  },
  {
    code: "PRO",
    storageQuotaMB: 20480,
    name: "Pro",
    sort: 2,
    highlight: true,
    audience: "Grossiste ou distributeur avec commerciaux et livraisons",
    monthlyPriceHT: 2990,
    yearlyPriceHT: 29900,
    setupFeeHT: 19900,
    includedUsers: 15,
    includedWarehouses: 3,
    limits: { maxCompanies: 1, maxEmployees: null },
    features: [
      "Tout Essentiel, avec 3 dépôts et 15 utilisateurs",
      "Commerciaux : objectifs, commissions, recouvrement",
      "Application terrain : commandes hors ligne, visites GPS",
      "Tournées et livraisons avec preuve signée",
      "Chèques et LCN : portefeuille, remises, impayés",
      "Promotions, « 10 + 1 » et remises de fin d'année",
      "Prévision d'achat et frais d'approche (import)",
      "Portail de commande pour vos revendeurs",
      "Factures et relances par WhatsApp",
      "Tableaux de bord et assistant IA sur vos chiffres",
      "Support prioritaire (e-mail, téléphone, WhatsApp)",
    ],
  },
  {
    code: "ENTREPRISE",
    storageQuotaMB: 51200,
    name: "Entreprise",
    sort: 3,
    audience: "Groupe multi-sites ou multi-sociétés",
    monthlyPriceHT: 5990,
    yearlyPriceHT: 59900,
    setupFeeHT: 39000,
    includedUsers: 40,
    includedWarehouses: null,
    limits: { maxCompanies: 5, maxEmployees: null },
    features: [
      "Tout Pro, dépôts illimités et 40 utilisateurs",
      "Jusqu'à 5 sociétés (groupe et filiales)",
      "RH et paie marocaine incluses : CNSS, AMO, IR, Damancom, Simpl-IR",
      "Calcul du salaire brut et net, primes, ancienneté",
      "WhatsApp Business API (messages envoyés par Sanity)",
      "Interlocuteur dédié, prise en charge en 4 h ouvrées",
      "Revue trimestrielle de vos indicateurs",
    ],
  },
];

// Sanity Droguerie — the shop edition (Plan.edition = "droguerie"): a
// client on these plans gets the simplified shop interface. Small shops,
// small prices; usually not VAT-registered themselves, but the
// subscription is invoiced HT + VAT like every Sanity plan.
const DROGUERIE_PLANS = [
  {
    code: "DROGUERIE",
    storageQuotaMB: 1024,
    name: "Droguerie",
    edition: "droguerie",
    sort: 10,
    audience: "Droguerie, quincaillerie ou petit commerce de quartier",
    monthlyPriceHT: 199,
    yearlyPriceHT: 1990,
    setupFeeHT: 990,
    includedUsers: 2,
    includedWarehouses: 1,
    limits: { maxCompanies: 1, maxEmployees: null },
    features: [
      "1 boutique, 1 caisse, 2 utilisateurs",
      "Caisse rapide : code-barres, article divers, monnaie rendue",
      "Le carnet : ventes à crédit, encaissements, rappel WhatsApp",
      "Achat rapide : la marchandise entre en stock en 1 écran",
      "Ce que vous devez à chaque fournisseur",
      "Stock et alertes « à racheter », inventaire",
      "En français et en arabe, sur PC, tablette ou téléphone",
      "1 Go de photos et documents, sauvegardes et mises à jour incluses",
    ],
  },
  {
    code: "DROGUERIE_PLUS",
    storageQuotaMB: 3072,
    name: "Droguerie Plus",
    edition: "droguerie",
    sort: 11,
    highlight: true,
    audience: "Boutique avec vendeurs, artisans en compte, chèques",
    monthlyPriceHT: 349,
    yearlyPriceHT: 3490,
    setupFeeHT: 1490,
    includedUsers: 4,
    includedWarehouses: 2,
    limits: { maxCompanies: 1, maxEmployees: null },
    features: [
      "Tout Droguerie, avec 4 utilisateurs, 2 caisses et 3 Go de stockage",
      "Arrière-boutique ou 2e magasin (stock séparé)",
      "Chèques et effets : échéances et remises en banque",
      "Factures aux artisans et entreprises (ICE)",
      "Droits par vendeur (remises, prix, caisse)",
      "Saisie de vos articles et de votre stock par nos soins",
      "Support prioritaire par téléphone et WhatsApp",
    ],
  },
];

const DROGUERIE_ADDONS = [
  { code: "DG_USER", name: "Utilisateur supplémentaire", priceHT: 49, unit: "month", note: "" },
  { code: "DG_STORAGE", name: "Stockage supplémentaire (+5 Go de photos et documents)", priceHT: 29, unit: "month", note: "" },
  { code: "DG_HARDWARE", name: "Pack caisse : lecteur code-barres + imprimante tickets", priceHT: 1490, unit: "one_time", note: "Installé et réglé" },
  { code: "DG_ONSITE", name: "Demi-journée de formation en boutique", priceHT: 500, unit: "one_time", note: "Casablanca, Rabat" },
];

const DROGUERIE_PRICE_LIST = {
  tagline: "La gestion simple des drogueries et quincailleries",
  terms: [
    "Prix en dirhams hors taxes (TVA 20 % en sus).",
    "Abonnement mensuel sans engagement, ou annuel : 2 mois offerts.",
    "Essai gratuit de 30 jours dans votre boutique.",
    "La mise en service comprend la création de vos articles et de vos prix, le stock de départ, vos clients au carnet et la formation sur place.",
    "Fonctionne sur votre PC, une tablette ou un téléphone : pas de serveur à acheter.",
    "Vos données vous appartiennent : export complet à tout moment.",
  ].join("\n"),
};

const ADDONS = [
  { code: "USER", name: "Utilisateur supplémentaire", priceHT: 120, unit: "month", note: "" },
  { code: "WAREHOUSE", name: "Dépôt ou magasin supplémentaire", priceHT: 290, unit: "month", note: "" },
  { code: "STORAGE", name: "Stockage supplémentaire (+20 Go de photos et documents)", priceHT: 99, unit: "month", note: "" },
  { code: "HR", name: "Module RH et paie (Essentiel, Pro)", priceHT: 990, unit: "month", note: "Inclus dans Entreprise" },
  { code: "WHATSAPP_API", name: "WhatsApp Business API (Essentiel, Pro)", priceHT: 290, unit: "month", note: "+ messages au coût Meta" },
  { code: "TRAINING", name: "Journée de formation sur site", priceHT: 3500, unit: "one_time", note: "" },
  { code: "MIGRATION", name: "Reprise de données complexe (autre logiciel)", priceHT: 0, unit: "quote", note: "Sur devis" },
];

const PRICE_LIST = {
  tagline: "Le logiciel de gestion des grossistes et distributeurs marocains",
  terms: [
    "Prix en dirhams hors taxes (TVA 20 % en sus).",
    "Abonnement mensuel sans engagement de durée, ou annuel : 2 mois offerts.",
    "Essai gratuit de 30 jours sur vos propres données.",
    "Les frais de mise en service comprennent l'import de vos articles, clients et stock, le paramétrage (dépôts, tarifs, droits) et la formation de vos équipes.",
    "Hébergement sécurisé, sauvegardes quotidiennes, mises à jour et évolutions réglementaires (paie, TVA, facture électronique) incluses.",
    "Vos données vous appartiennent : export complet à tout moment.",
  ].join("\n"),
};

module.exports = { PLANS, ADDONS, PRICE_LIST, DROGUERIE_PLANS, DROGUERIE_ADDONS, DROGUERIE_PRICE_LIST };
