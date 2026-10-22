/**
 * ============================================================
 * DEFAULT DEPARTMENT TEMPLATES
 * ============================================================
 * Static starter definitions offered from the Departments page as
 * a quick-start option ("Add default departments") instead of
 * making a new company build its department list one at a time by
 * hand. Each entry becomes one Department record if the admin
 * picks it — name and description are canonical French (both
 * fields go through the translatable plugin already, same as any
 * other department — see models/Department.js), and permissionKey
 * is only set on the two categories that actually unlock a module.
 *
 * `positions` entries are either a plain title string, or
 * { title, grantsModuleAccess } for a position that should unlock
 * its department's module (see models/JobPosition.js).
 *
 * `positions` seeds a starter set of real JobPosition records for
 * that department (see models/JobPosition.js) — this is what the
 * Employee form's Job Title field actually offers once a
 * department is selected (see frontend/src/pages/hr/Employees.jsx),
 * not a hardcoded list living only here. Seeding these titles is
 * what makes a freshly-seeded department immediately usable instead
 * of technically existing but offering nothing to pick from.
 *
 * The "hr" category's 4 titles are exact, load-bearing strings —
 * see config/hrJobTitles.js's hrRoleForJobTitle: creating a login
 * for an employee whose job title is one of these 4 exact strings
 * automatically grants the matching HR permission tier. Every other
 * category's positions are plain descriptive titles with no such
 * mapping.
 * ============================================================
 */

const DEFAULT_DEPARTMENTS = [
  { category: "management", name: "Direction Générale", description: "Pilotage stratégique et direction générale de l'entreprise.", permissionKey: null,
    positions: ["Directeur Général", "Directeur Général Adjoint", "Chef de Département"] },
  { category: "administration", name: "Administration", description: "Gestion administrative et support aux autres départements.", permissionKey: null,
    positions: ["Responsable Administratif", "Assistant(e) Administratif(ve)", "Secrétaire"] },
  { category: "hr", name: "Ressources Humaines", description: "Gestion du personnel, recrutement, paie et administration RH.", permissionKey: "hr",
    positions: [
      { title: "Assistant RH", grantsModuleAccess: true },
      { title: "Chargé RH", grantsModuleAccess: true },
      { title: "Responsable RH", grantsModuleAccess: true },
      { title: "Directeur RH", grantsModuleAccess: true },
    ] },
  { category: "finance", name: "Finance", description: "Gestion financière, trésorerie et planification budgétaire.", permissionKey: null,
    positions: ["Directeur Financier", "Responsable Financier", "Analyste Financier", "Contrôleur de Gestion"] },
  { category: "accounting", name: "Comptabilité", description: "Tenue des comptes, facturation et déclarations fiscales.", permissionKey: null,
    positions: ["Chef Comptable", "Comptable", "Aide-Comptable"] },
  { category: "sales", name: "Commercial", description: "Réseau de revendeurs, commerciaux terrain, devis, commandes et recouvrement.", permissionKey: "sales",
    positions: [
      { title: "Directeur Commercial", grantsModuleAccess: true },
      { title: "Responsable des Ventes", grantsModuleAccess: true },
      { title: "Commercial(e)", grantsModuleAccess: true },
      { title: "Commercial(e) Terrain", grantsModuleAccess: true },
      { title: "Assistant(e) ADV", grantsModuleAccess: true },
    ] },
  { category: "purchasing", name: "Achats", description: "Sélection des fournisseurs et gestion des commandes d'achat.", permissionKey: "purchasing",
    positions: [
      { title: "Responsable des Achats", grantsModuleAccess: true },
      { title: "Acheteur(se)", grantsModuleAccess: true },
      "Assistant(e) Achats",
    ] },
  { category: "marketing", name: "Marketing", description: "Stratégie de marque, communication et promotion des produits.", permissionKey: null,
    positions: ["Directeur Marketing", "Responsable Marketing", "Chargé(e) de Marketing", "Community Manager"] },
  { category: "warehouse", name: "Magasin & Dépôts", description: "Réception, stockage, préparation des commandes et inventaires des dépôts.", permissionKey: "warehouse",
    positions: [
      { title: "Chef de Dépôt", grantsModuleAccess: true },
      { title: "Magasinier(ère)", grantsModuleAccess: true },
      "Préparateur(trice) de Commandes",
      "Cariste",
    ] },
  { category: "pos", name: "Comptoir & Showroom", description: "Vente au comptoir, caisse et accueil des clients de passage.", permissionKey: "pos",
    positions: [
      { title: "Responsable Showroom", grantsModuleAccess: true },
      { title: "Caissier(ère)", grantsModuleAccess: true },
      "Vendeur(se) Comptoir",
    ] },
  { category: "logistics", name: "Logistique", description: "Coordination du transport et de la distribution.", permissionKey: "logistics",
    positions: [
      { title: "Responsable Logistique", grantsModuleAccess: true },
      { title: "Coordinateur(trice) Logistique", grantsModuleAccess: true },
      "Chauffeur Livreur",
      "Agent Logistique",
    ] },
  { category: "procurement", name: "Approvisionnement", description: "Sécurisation des matières premières et composants.", permissionKey: null,
    positions: ["Responsable Approvisionnement", "Agent d'Approvisionnement"] },
  { category: "it", name: "Informatique", description: "Gestion des systèmes d'information et support technique.", permissionKey: null,
    positions: ["Directeur des Systèmes d'Information", "Responsable IT", "Développeur(se)", "Technicien(ne) Informatique"] },
  { category: "customer_service", name: "Service Client", description: "Support et assistance aux clients.", permissionKey: null,
    positions: ["Responsable Service Client", "Conseiller(ère) Client", "Agent Service Client"] },
  { category: "health_safety_environment", name: "Hygiène, Sécurité & Environnement", description: "Prévention des risques et conformité environnementale.", permissionKey: null,
    positions: ["Responsable HSE", "Technicien(ne) HSE", "Agent HSE"] },
  { category: "security", name: "Sécurité", description: "Sécurité des locaux et des biens de l'entreprise.", permissionKey: null,
    positions: ["Responsable Sécurité", "Agent de Sécurité"] },
];

module.exports = { DEFAULT_DEPARTMENTS };
