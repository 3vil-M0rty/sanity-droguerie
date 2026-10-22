/**
 * ============================================================
 * PERMISSION CATALOGUE — every action a login can be allowed to do
 * ============================================================
 * Keys are "module.resource.action" (e.g. "sales.quotes.create").
 * Admins and owners have them all. Everyone else gets:
 *   - their department's default profile (while nobody customised
 *     them — see services/permissionService.js → legacyDefaults), or
 *   - exactly the permissions their manager ticked for them
 *     (User.permissionsMode = "custom", User.permissions), plus
 *   - every permission of the modules of the departments they manage.
 *
 * A manager can only hand out permissions they have themselves, to
 * the people under them (their departments + everyone reporting to
 * them). "team.permissions.manage" lets a sub-manager do the same for
 * their own team.
 *
 * Labels are French / English; the UI falls back to them for the
 * other languages.
 * ============================================================
 */

const A = {
  view: { fr: "Voir", en: "View" },
  create: { fr: "Créer", en: "Create" },
  edit: { fr: "Modifier", en: "Edit" },
  delete: { fr: "Supprimer", en: "Delete" },
  export: { fr: "Exporter", en: "Export" },
  approve: { fr: "Approuver / refuser", en: "Approve / reject" },
  print: { fr: "Imprimer / PDF", en: "Print / PDF" },
};
const crud = () => ({ view: A.view, create: A.create, edit: A.edit, delete: A.delete });

const MODULES = [
  {
    key: "hr",
    label: { fr: "Ressources humaines", en: "Human resources" },
    department: "hr",
    resources: [
      { key: "employees", label: { fr: "Employés", en: "Employees" }, actions: { ...crud(), export: A.export, import: { fr: "Import en masse", en: "Bulk import" }, print: { fr: "Attestations / fiches PDF", en: "Certificates / PDF" } } },
      { key: "accounts", label: { fr: "Comptes de connexion des employés", en: "Employee logins" }, actions: { manage: { fr: "Créer / désactiver / réinitialiser", en: "Create / disable / reset" } } },
      { key: "contracts", label: { fr: "Contrats", en: "Contracts" }, actions: { ...crud(), renew: { fr: "Renouveler", en: "Renew" } } },
      { key: "documents", label: { fr: "Documents du personnel", en: "Staff documents" }, actions: crud() },
      { key: "salaries", label: { fr: "Salaires", en: "Salaries" }, actions: crud() },
      { key: "payroll", label: { fr: "Paie", en: "Payroll" }, actions: { view: A.view, run: { fr: "Calculer / recalculer", en: "Run / regenerate" }, validate: { fr: "Clôturer", en: "Close" }, delete: A.delete, export: A.export, markPaid: { fr: "Marquer payé", en: "Mark paid" } } },
      { key: "declarations", label: { fr: "Déclarations (CNSS, IR, virements)", en: "Declarations (CNSS, tax, transfers)" }, actions: { view: A.view, export: { fr: "Générer les fichiers", en: "Generate files" } } },
      { key: "absences", label: { fr: "Absences & congés", en: "Absences & leave" }, actions: { ...crud(), approve: A.approve } },
      { key: "advances", label: { fr: "Avances sur salaire", en: "Salary advances" }, actions: { ...crud(), approve: A.approve } },
      { key: "attendance", label: { fr: "Pointage", en: "Attendance" }, actions: { view: A.view, edit: A.edit } },
      { key: "leave", label: { fr: "Soldes de congés", en: "Leave balances" }, actions: { view: A.view, edit: { fr: "Soldes d'ouverture", en: "Opening balances" }, export: A.export } },
      { key: "holidays", label: { fr: "Jours fériés", en: "Public holidays" }, actions: { ...crud(), import: { fr: "Importer", en: "Import" } } },
      { key: "reviews", label: { fr: "Évaluations", en: "Performance reviews" }, actions: { ...crud(), submit: { fr: "Soumettre", en: "Submit" } } },
      { key: "discipline", label: { fr: "Sanctions disciplinaires", en: "Disciplinary actions" }, actions: crud() },
      { key: "reports", label: { fr: "Rapports RH", en: "HR reports" }, actions: { view: A.view } },
      { key: "auditLogs", label: { fr: "Journal d'audit", en: "Audit log" }, actions: { view: A.view } },
      { key: "staffRoles", label: { fr: "Niveaux du personnel RH", en: "HR staff levels" }, actions: { manage: { fr: "Attribuer", en: "Assign" } } },
    ],
  },
  {
    key: "sales",
    label: { fr: "Ventes", en: "Sales" },
    department: "sales",
    resources: [
      { key: "customers", label: { fr: "Clients", en: "Customers" }, actions: { ...crud(), viewAll: { fr: "Tous les clients (pas seulement les siens)", en: "Every customer (not only one's own)" }, credit: { fr: "Plafond de crédit / débloquer", en: "Credit limit / override" }, import: { fr: "Import Excel", en: "Excel import" } } },
      { key: "pricing", label: { fr: "Tarifs (niveaux de prix, remises)", en: "Pricing (price levels, discounts)" }, actions: { view: A.view, edit: A.edit } },
      { key: "quotes", label: { fr: "Devis", en: "Quotes" }, actions: { ...crud(), send: { fr: "Envoyer / marquer envoyé", en: "Send / mark sent" }, decide: { fr: "Accepter / refuser", en: "Accept / refuse" }, convert: { fr: "Transformer (commande / facture)", en: "Convert (order / invoice)" } } },
      { key: "orders", label: { fr: "Commandes clients", en: "Sales orders" }, actions: { ...crud(), confirm: { fr: "Confirmer (réserver le stock)", en: "Confirm (reserve stock)" }, cancel: { fr: "Annuler", en: "Cancel" } } },
      { key: "invoices", label: { fr: "Factures", en: "Invoices" }, actions: { ...crud(), issue: { fr: "Émettre", en: "Issue" }, send: { fr: "Envoyer (e-mail / WhatsApp)", en: "Send (email / WhatsApp)" }, creditNote: { fr: "Avoirs", en: "Credit notes" } } },
      { key: "einvoicing", label: { fr: "Facturation électronique (DGI)", en: "E-invoicing (DGI)" }, actions: { submit: { fr: "Transmettre à la DGI", en: "Submit to the DGI" } } },
      { key: "portfolio", label: { fr: "Chèques & effets (portefeuille)", en: "Cheques & bills (portfolio)" }, actions: { view: A.view, deposit: { fr: "Remettre en banque", en: "Bank deposit" }, settle: { fr: "Encaissé / impayé", en: "Cleared / unpaid" } } },
      { key: "promotions", label: { fr: "Promotions & remises de fin d'année", en: "Promotions & year-end rebates" }, actions: { view: A.view, manage: { fr: "Créer / modifier / calculer", en: "Create / edit / compute" } } },
      { key: "visits", label: { fr: "Visites clients (terrain)", en: "Customer visits (field)" }, actions: { view: A.view, create: { fr: "Enregistrer", en: "Log" } } },
      { key: "portal", label: { fr: "Portail revendeurs", en: "Reseller portal" }, actions: { manage: { fr: "Ouvrir / fermer les accès clients", en: "Open / close customer access" } } },
      { key: "payments", label: { fr: "Encaissements", en: "Payments received" }, actions: { create: { fr: "Enregistrer", en: "Record" }, delete: A.delete } },
      { key: "reps", label: { fr: "Commerciaux (objectifs, commissions)", en: "Sales reps (targets, commissions)" }, actions: { view: { fr: "Voir toute l'équipe", en: "View the whole team" }, manage: { fr: "Fixer objectifs et taux", en: "Set targets and rates" } } },
      { key: "collections", label: { fr: "Recouvrement", en: "Collections" }, actions: { view: A.view, manage: { fr: "Relances / promesses", en: "Reminders / promises" } } },
      { key: "reports", label: { fr: "Rapports (créances, TVA, marges)", en: "Reports (receivables, VAT, margins)" }, actions: { view: A.view } },
    ],
  },
  {
    key: "purchasing",
    label: { fr: "Achats", en: "Purchasing" },
    department: "purchasing",
    resources: [
      { key: "suppliers", label: { fr: "Fournisseurs", en: "Suppliers" }, actions: { ...crud(), documents: { fr: "Documents", en: "Documents" } } },
      { key: "priceRequests", label: { fr: "Demandes de prix", en: "Price requests" }, actions: { ...crud(), send: { fr: "Envoyer", en: "Send" }, convert: { fr: "Convertir en commande", en: "Convert to order" } } },
      { key: "orders", label: { fr: "Bons de commande", en: "Purchase orders" }, actions: { ...crud(), send: { fr: "Envoyer / changer le statut", en: "Send / change status" }, approve: A.approve, receive: { fr: "Réceptionner", en: "Receive" } } },
      { key: "invoices", label: { fr: "Factures fournisseurs", en: "Supplier invoices" }, actions: { view: A.view, create: { fr: "Enregistrer", en: "Record" }, delete: A.delete } },
      { key: "payments", label: { fr: "Règlements fournisseurs", en: "Supplier payments" }, actions: { create: { fr: "Enregistrer", en: "Record" }, delete: A.delete } },
      { key: "requests", label: { fr: "Demandes d'achat reçues", en: "Purchase requests received" }, actions: { view: A.view, process: { fr: "Traiter", en: "Process" } } },
      { key: "reports", label: { fr: "Rapports achats", en: "Purchasing reports" }, actions: { view: A.view } },
    ],
  },
  {
    key: "inventory",
    label: { fr: "Stock", en: "Stock" },
    department: "warehouse",
    resources: [
      { key: "articles", label: { fr: "Articles", en: "Articles" }, actions: { ...crud(), adjust: { fr: "Entrées / sorties de stock", en: "Stock in / out" }, import: { fr: "Import Excel (articles, stock d'ouverture)", en: "Excel import (articles, opening stock)" } } },
      { key: "categories", label: { fr: "Familles & marques", en: "Families & brands" }, actions: crud() },
      { key: "warehouses", label: { fr: "Dépôts / magasins", en: "Warehouses / stores" }, actions: { view: A.view, manage: { fr: "Créer / modifier", en: "Create / edit" } } },
      { key: "transfers", label: { fr: "Transferts entre dépôts", en: "Transfers between warehouses" }, actions: { view: A.view, create: A.create, receive: { fr: "Réceptionner", en: "Receive" } } },
      { key: "counts", label: { fr: "Inventaires (comptages)", en: "Stock counts" }, actions: { view: A.view, create: { fr: "Saisir", en: "Enter" }, validate: { fr: "Valider (ajuster le stock)", en: "Validate (adjust stock)" } } },
      { key: "requests", label: { fr: "Demandes d'achat", en: "Purchase requests" }, actions: { view: A.view, create: A.create, delete: { fr: "Annuler", en: "Cancel" } } },
    ],
  },
  {
    key: "pos",
    label: { fr: "Caisse (comptoir)", en: "Point of sale" },
    department: "pos",
    resources: [
      { key: "sessions", label: { fr: "Sessions de caisse", en: "Cash sessions" }, actions: { open: { fr: "Ouvrir / clôturer la sienne", en: "Open / close one's own" }, viewAll: { fr: "Voir toutes les sessions", en: "View every session" } } },
      { key: "sales", label: { fr: "Ventes comptoir", en: "Counter sales" }, actions: { view: A.view, create: { fr: "Encaisser", en: "Ring up" }, refund: { fr: "Rembourser / annuler un ticket", en: "Refund / void a ticket" }, discount: { fr: "Remise manuelle", en: "Manual discount" } } },
    ],
  },
  {
    key: "logistics",
    label: { fr: "Logistique", en: "Logistics" },
    department: "logistics",
    resources: [
      { key: "notes", label: { fr: "Bons de livraison", en: "Delivery notes" }, actions: { ...crud(), validate: { fr: "Valider (sortie de stock)", en: "Validate (stock out)" }, deliver: { fr: "Marquer livré", en: "Mark delivered" }, cancel: { fr: "Annuler / retour", en: "Cancel / return" }, print: A.print } },
      { key: "rounds", label: { fr: "Tournées de livraison", en: "Delivery rounds" }, actions: { view: A.view, manage: { fr: "Planifier / clôturer", en: "Plan / close" } } },
    ],
  },
  {
    key: "organization",
    label: { fr: "Organisation", en: "Organisation" },
    department: null,
    resources: [
      { key: "departments", label: { fr: "Départements", en: "Departments" }, actions: crud() },
      { key: "positions", label: { fr: "Postes", en: "Job positions" }, actions: crud() },
      { key: "schedule", label: { fr: "Horaires de travail", en: "Work schedule" }, actions: { edit: A.edit } },
    ],
  },
  {
    key: "finance",
    label: { fr: "Montants", en: "Amounts" },
    department: null,
    resources: [
      { key: "amounts", label: { fr: "Prix, coûts, marges, budgets", en: "Prices, costs, margins, budgets" }, actions: { view: A.view } },
      { key: "accounting", label: { fr: "Comptabilité & TVA (exports)", en: "Accounting & VAT (exports)" }, actions: { view: A.view, export: A.export, settings: { fr: "Paramétrer les comptes", en: "Set up accounts" } } },
    ],
  },
  {
    key: "team",
    label: { fr: "Équipe", en: "Team" },
    department: null,
    resources: [
      { key: "permissions", label: { fr: "Droits de son équipe", en: "Team permissions" }, actions: { manage: { fr: "Distribuer (ce qu'on a soi-même)", en: "Hand out (what one has)" } } },
    ],
  },
];

const ALL_KEYS = [];
for (const m of MODULES) for (const r of m.resources) for (const a of Object.keys(r.actions)) ALL_KEYS.push(`${m.key}.${r.key}.${a}`);
const KEY_SET = new Set(ALL_KEYS);

const keysOf = (prefix) => ALL_KEYS.filter((k) => k === prefix || k.startsWith(`${prefix}.`));
const without = (list, removed) => { const r = new Set(removed); return list.filter((k) => !r.has(k)); };

/**
 * What the manager of a department with this permissionKey gets —
 * and the default profile of its staff (see legacyDefaults).
 */
const DEPARTMENT_MODULES = {
  hr: () => [...keysOf("hr"), "organization.positions.view", "organization.departments.view"],
  // Magasin: articles, dépôts, transferts, inventaires; prepares the BL.
  warehouse: () => [...keysOf("inventory"), "logistics.notes.view", "logistics.notes.validate", "logistics.notes.print", "purchasing.orders.view", "purchasing.orders.receive", "purchasing.suppliers.view"],
  // Legacy key (xframe): departments still flagged "production" get the stock profile.
  production: () => DEPARTMENT_MODULES.warehouse(),
  sales: () => [...without(keysOf("sales"), ["sales.customers.viewAll", "sales.reps.manage", "sales.customers.import", "sales.einvoicing.submit", "sales.portfolio.deposit", "sales.portfolio.settle", "sales.promotions.manage", "sales.portal.manage"]), "inventory.articles.view", "inventory.categories.view", "inventory.warehouses.view", "logistics.notes.view", "logistics.notes.create", "logistics.notes.print", "finance.amounts.view"],
  purchasing: () => [...keysOf("purchasing"), "inventory.articles.view", "inventory.categories.view", "inventory.warehouses.view", "inventory.requests.view"],
  logistics: () => [...keysOf("logistics"), "inventory.articles.view", "inventory.warehouses.view", "inventory.transfers.view", "inventory.transfers.receive"],
  pos: () => [...without(keysOf("pos"), ["pos.sessions.viewAll", "pos.sales.refund"]), "inventory.articles.view", "sales.customers.view", "sales.customers.create"],
};

// No workshops in Sanity (négoce) — kept for API compatibility.
const WORKSHOP_MANAGER_KEYS = () => [];

// HR levels (User.hrRole) = ready-made HR profiles.
const HR_EMPLOYEE_RECORDS = ["hr.employees.create", "hr.employees.edit", "hr.employees.import", "hr.holidays.create", "hr.holidays.edit", "hr.holidays.delete", "hr.holidays.import", "hr.leave.edit", "hr.reviews.create", "hr.reviews.edit", "hr.reviews.delete"];
const HR_MANAGER_ONLY = ["hr.absences.approve", "hr.advances.approve", "hr.reviews.submit", "hr.reviews.delete", "hr.discipline.create", "hr.discipline.edit", "hr.discipline.delete", "hr.salaries.create", "hr.salaries.edit", "hr.salaries.delete", "hr.employees.delete"];
const HR_DIRECTOR_ONLY = ["hr.staffRoles.manage"];
function hrProfile(hrRole) {
  const all = DEPARTMENT_MODULES.hr();
  switch (hrRole) {
    case "hr_assistant": return without(all, [...HR_EMPLOYEE_RECORDS, ...HR_MANAGER_ONLY, ...HR_DIRECTOR_ONLY]);
    case "hr_officer": return without(all, [...HR_MANAGER_ONLY, ...HR_DIRECTOR_ONLY]);
    case "hr_director": return all;
    default: return without(all, HR_DIRECTOR_ONLY); // hr_manager (and unset)
  }
}

/** Ready-made profiles offered on the Permissions page (applied, then fine-tuned). */
const SALES_REP_KEYS = () => [
  "sales.customers.view", "sales.customers.create", "sales.customers.edit",
  "sales.pricing.view",
  "sales.quotes.view", "sales.quotes.create", "sales.quotes.edit", "sales.quotes.send", "sales.quotes.decide", "sales.quotes.convert",
  "sales.orders.view", "sales.orders.create", "sales.orders.edit", "sales.orders.confirm",
  "sales.invoices.view", "sales.invoices.send", "sales.payments.create", "sales.collections.view", "sales.collections.manage",
  "sales.visits.view", "sales.visits.create", "sales.promotions.view", "sales.portfolio.view",
  "inventory.articles.view", "inventory.warehouses.view", "logistics.notes.view", "finance.amounts.view",
];

const PRESETS = [
  { key: "hr_assistant", label: { fr: "Assistant(e) RH", en: "HR assistant" }, keys: () => hrProfile("hr_assistant") },
  { key: "hr_officer", label: { fr: "Chargé(e) RH", en: "HR officer" }, keys: () => hrProfile("hr_officer") },
  { key: "hr_manager", label: { fr: "Responsable RH", en: "HR manager" }, keys: () => hrProfile("hr_manager") },
  { key: "sales_rep", label: { fr: "Commercial(e) terrain", en: "Field sales rep" }, keys: SALES_REP_KEYS },
  { key: "sales_admin", label: { fr: "ADV (administration des ventes)", en: "Sales administration" }, keys: () => [...DEPARTMENT_MODULES.sales(), "sales.customers.viewAll", "sales.customers.import", "sales.einvoicing.submit", "sales.portfolio.deposit", "sales.portfolio.settle", "sales.portal.manage"] },
  { key: "accountant", label: { fr: "Comptable", en: "Accountant" }, keys: () => [...keysOf("finance"), "sales.invoices.view", "sales.reports.view", "sales.portfolio.view", "sales.portfolio.deposit", "sales.portfolio.settle", "sales.einvoicing.submit", "purchasing.invoices.view", "purchasing.orders.view"] },
  { key: "sales_manager", label: { fr: "Directeur commercial", en: "Sales director" }, keys: () => [...keysOf("sales"), ...DEPARTMENT_MODULES.sales()] },
  { key: "cashier", label: { fr: "Caissier(ère) comptoir", en: "Cashier" }, keys: () => DEPARTMENT_MODULES.pos() },
  { key: "pos_manager", label: { fr: "Responsable caisse / showroom", en: "Store manager" }, keys: () => [...keysOf("pos"), "inventory.articles.view", "sales.customers.view", "sales.customers.create", "sales.invoices.view", "finance.amounts.view"] },
  { key: "buyer", label: { fr: "Acheteur", en: "Buyer" }, keys: () => without(DEPARTMENT_MODULES.purchasing(), ["purchasing.orders.approve", "purchasing.payments.create", "purchasing.payments.delete", "purchasing.suppliers.delete", "purchasing.orders.delete"]) },
  { key: "storekeeper", label: { fr: "Magasinier", en: "Storekeeper" }, keys: () => without(DEPARTMENT_MODULES.warehouse(), ["inventory.articles.delete", "inventory.warehouses.manage", "inventory.counts.validate"]) },
  { key: "warehouse_manager", label: { fr: "Chef de dépôt", en: "Warehouse manager" }, keys: () => DEPARTMENT_MODULES.warehouse() },
  { key: "logistics_manager", label: { fr: "Responsable logistique", en: "Logistics manager" }, keys: () => DEPARTMENT_MODULES.logistics() },
  { key: "driver", label: { fr: "Chauffeur / livreur", en: "Driver" }, keys: () => ["logistics.notes.view", "logistics.notes.print", "logistics.notes.deliver", "logistics.rounds.view", "sales.payments.create"] },
];

function catalogForClient() {
  return {
    modules: MODULES.map((m) => ({
      key: m.key,
      label: m.label,
      department: m.department,
      resources: m.resources.map((r) => ({
        key: r.key,
        label: r.label,
        actions: Object.entries(r.actions).map(([k, label]) => ({ key: k, perm: `${m.key}.${r.key}.${k}`, label })),
      })),
    })),
    presets: PRESETS.map((p) => ({ key: p.key, label: p.label, keys: p.keys().filter((k) => KEY_SET.has(k)) })),
  };
}

module.exports = { MODULES, ALL_KEYS, KEY_SET, keysOf, without, DEPARTMENT_MODULES, WORKSHOP_MANAGER_KEYS, SALES_REP_KEYS, hrProfile, PRESETS, catalogForClient };
