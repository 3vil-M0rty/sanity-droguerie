// UI dictionary — fr. Split out of i18n.config.js so each language
// is its own module (see loadLanguage there).
export default { quota: { title: "Quotas", hint: "Laisser vide = illimité. Les employés sortis (licenciés / démissionnaires) ne comptent pas. Baisser un quota ne supprime rien : le client ne peut simplement plus en créer.", maxCompanies: "Nombre max. de sociétés", maxEmployees: "Nombre max. d'employés", unlimited: "Illimité", edit: "Modifier les quotas", saved: "Quotas enregistrés.", companies: "Sociétés", employees: "Employés", companiesFull: "Limite de sociétés atteinte — contactez la plateforme pour l'augmenter.", employeesFull: "Limite d'employés atteinte — contactez la plateforme pour l'augmenter. Un employé sorti libère une place.", employeesHint: "Employés utilisés / autorisés (les employés sortis ne comptent pas).", newCompany: "Nouvelle société", }, prodPlan: { barsOf: "barres de {length} mm", }, wsMulti: { departmentSchedule: "Horaire de travail", useDefault: "Horaire par défaut ({name})", departmentScheduleHint: "Les horaires se créent dans Organisation › Horaire de travail.", deleteConfirm: "Supprimer l'horaire « {name} » ? Ses départements reviennent à l'horaire par défaut.", namePlaceholder: "ex. Atelier – coupure, samedi matin", copyCurrent: "Copier l'horaire affiché", new: "Nouvel horaire", name: "Nom de l'horaire", default: "Horaire par défaut", makeDefault: "Définir par défaut", departments: "Départements", noDepartments: "Aucun département dans cette société.", leaveDefaultHint: "Déjà sur l'horaire par défaut — affectez-le à un autre horaire pour le déplacer.", currently: "Actuellement : {name}", defaultHint: "L'horaire par défaut s'applique à tous les départements qui n'ont pas leur propre horaire.", assignHint: "Cochez les départements qui suivent cet horaire ; ceux décochés reviennent à l'horaire par défaut.", splitDay: "Coupure", splitDayHint: "Journée en coupure (matin + après-midi). Décochez pour une demi-journée ou une journée continue.", splitOn: "Coupure", splitOff: "Continue", }, platformCo: { companyTitle: "Sociétés", companyAdd: "Ajouter une société", companyNone: "Aucune société pour l'instant.", companyAdminHint: "Un client peut avoir plusieurs sociétés (groupe, filiales). Son administrateur peut aussi en créer depuis Organisation › Entreprise ; chaque écran a un sélecteur « Entreprise ».", companyFirst: "Première société (facultatif)", companyFirstHint: "D'autres sociétés pourront être ajoutées ensuite, ici ou par l'administrateur du client.", companyName: "Nom de la société", companyNamePlaceholder: "ex. Atlas Menuiserie SARL", companyLegalForm: "Forme juridique", companyOtherForm: "Autre", companyIndustry: "Activité", companyIndustryPlaceholder: "ex. Menuiserie aluminium", companyCity: "Ville", companyAdded: "Société « {name} » ajoutée.", }, perm: { teamMenu: "Droits de mon équipe", title: "Droits d'accès", subtitleAll: "Les droits de chaque personne, action par action. Les responsables distribuent ensuite ceux qu'ils ont à leur équipe.", subtitleTeam: "Donnez à chaque personne de votre équipe les droits dont elle a besoin — parmi ceux que vous avez vous-même.", searchPeople: "Chercher une personne…", emptyTeam: "Personne sous votre responsabilité dans cette société.", manager: "Responsable", pickSomeone: "Choisissez une personne à gauche.", rules: "Chaque département a un responsable, qui reçoit tous les droits de son module. Un responsable ne donne que les droits qu'il a lui-même, aux personnes de son département et à celles qui lui sont rattachées (tous niveaux). Il peut aussi permettre à un chef d'équipe de distribuer à son tour (« Équipe › Droits de son équipe »).", noLoginHint: "Cette personne n'a pas de compte de connexion : créez-le depuis sa fiche employé (RH) pour lui donner des droits.", selfHint: "Vous ne pouvez pas modifier vos propres droits — c'est votre responsable qui les gère.", fullAccessHint: "Administrateur / propriétaire : accès complet à tout.", managesHint: "Responsable de {deps} : les droits de ce module sont automatiques.", applyPreset: "Appliquer un profil…", resetHint: "Revenir au profil par défaut de son département / poste", reset: "Profil du poste", legendOn: "Accordé", legendAuto: "Automatique (responsable)", legendOff: "Non accordé", legendGrantable: "Les cases grisées sont des droits que vous n'avez pas vous-même.", all: "Tout", none: "Aucun", toggleRow: "tout / rien", autoHint: "Automatique : cette personne est responsable du département", notGrantable: "Vous n'avez pas ce droit : vous ne pouvez pas le donner ni le retirer", noLogin: "Pas de compte", fullAccess: "Accès complet", custom: "Personnalisé", roleProfile: "Profil du poste", saved: "Droits enregistrés : {added} ajouté(s), {removed} retiré(s).", resetConfirm: "Remettre le profil par défaut de son département / poste ? Ses droits personnalisés seront perdus.", resetDone: "Profil par défaut rétabli.", errors: { load: "Impossible de charger les droits.", save: "Impossible d'enregistrer les droits.", }, }, cv: { parentCategory: "Catégorie parente", noParent: "Aucune (catégorie principale)", parentHint: "Ex. « Profilés aluminium » › « Série ATLAS 78 — coulissants ». Une sous-catégorie sans compte comptable reprend celui de sa catégorie parente.", addSubCategory: "Ajouter une sous-catégorie", articlesCount: "{n} article(s)", subCount: "{n} sous-catégorie(s)", amountsLabel: "Montants", amountsCheckbox: "Voir les montants : prix, coûts, marges et budgets (toujours visibles pour les administrateurs, propriétaires, ventes, finance, comptabilité et direction)", visual: "Visuel", visualHint: "L'aspect du modèle dans le catalogue, les projets et le PDF du devis : un schéma dessiné à l'échelle depuis L × H — ou votre propre image (photo, dessin du catalogue fournisseur), qui remplace alors le schéma partout.", schematic: "Schéma généré", picture: "Image (facultative)", noPicture: "Aucune image", changePicture: "Changer l'image", uploadPicture: "Téléverser une image", drawingType: "Type de schéma", leaves: "Vantaux", opening: "Ouverture", layers: "Nombre de verres", grid_nx: "Colonnes", grid_ny: "Rangées", solidLeaf: "Vantail plein (panneau, sans vitrage)", railingBars: "Barreaudage (au lieu d'un remplissage verre)", drawingParamsHint: "Les paramètres nommés n (vantaux), nx / ny (trame), lf, hi / ha (composés) ou ent (entraxe des poteaux) remplacent ces valeurs ligne par ligne.", ralPick: "Choisir dans le nuancier RAL", ralPickPh: "Chercher un RAL (9016, anthracite…)", ralNone: "Aucun RAL trouvé", projectFinish: "Couleur par défaut (RAL)", drawingTypes: { sliding: "Coulissant", casement: "Fenêtre à la française", door: "Porte", folding: "Accordéon / pliant", fixed: "Fixe", grid: "Trame / mur rideau", combo: "Composé", shutter: "Volet roulant", louvre: "Persienne / brise-soleil", railing: "Garde-corps", pergola: "Pergola", glass: "Vitrage", garage: "Porte de garage", panel: "Panneau", cladding: "Bardage", generic: "Générique", }, openings: { side: "À la française", ob: "Oscillo-battant", soufflet: "Soufflet", projetant: "Projetant", basculant: "Basculant", pivotant: "Pivotant", }, }, logi: { sizeHint: "Dimension de l'élément imprimée sur le bon de livraison (ex. vantail : wv × hv, vitrage : gw × gh). Vide = dimension du châssis.", startedShort: "démarré", onePerPiece: "Un élément par pièce", perPiece: "Un élément par pièce", perPieceHint: "Suivre chaque pièce séparément : « Vantail 1 », « Vantail 2 »… au lieu de « Vantaux ×2 »", pieceLabelPh: "Nom d'une pièce (ex. Vantail)", settingReady: "Seuls les éléments « prêts à livrer » (contrôlés / emballés) peuvent partir en livraison — décocher pour livrer tout élément fabriqué", done: "Suivi mis à jour.", synced: "Suivi recalculé depuis les ouvrages.", cancelled: "Châssis annulé.", partsSaved: "Découpage enregistré.", saved: "Bon de livraison enregistré.", errors: { load: "Chargement impossible.", save: "Enregistrement impossible.", }, stages: { to_make: "Pas entamé", in_production: "En cours", made: "Fabriqué", ready: "Prêt à livrer", partially_delivered: "Livré en partie", delivered: "Livré", installed: "Posé", received: "Réceptionné", cancelled: "Annulé", }, pipeline: { made: "Fabriqués", ready: "Prêts", delivered: "Livrés", installed: "Posés", received: "Réceptionnés", }, kinds: { complete: "Châssis complet", frame: "Dormant / cadre", sash: "Vantaux / ouvrants", glass: "Vitrage", module: "Module", screen: "Moustiquaire", panel: "Panneau", accessory: "Accessoires", other: "Autre", }, actions: { started: "Démarré (en cours)", unstarted: "Annuler « démarré »", made: "Fabriqué", ready: "Prêt à livrer", deliver: "Créer un bon de livraison", installed: "Posé", received: "Réceptionné", unmade: "Annuler « fabriqué »", unready: "Annuler « prêt »", uninstalled: "Annuler « posé »", unreceived: "Annuler « réceptionné »", clear_modified: "Modification vérifiée", }, historyActions: { started: "Démarré", unstarted: "« Démarré » annulé", created: "Créé", cancelled: "Annulé", reactivated: "Réactivé", modified: "Modifié", made: "Fabriqué", ready: "Prêt à livrer", installed: "Posé", received: "Réceptionné", delivered: "Livré", returned: "Retourné", unmade: "« Fabriqué » annulé", unready: "« Prêt » annulé", uninstalled: "« Posé » annulé", unreceived: "« Réceptionné » annulé", parts_edited: "Découpage modifié", modification_checked: "Modification vérifiée", production_started: "Fabrication démarrée", }, noteStatus: { draft: "Brouillon", planned: "Planifié", shipped: "En livraison", delivered: "Livré", cancelled: "Annulé", }, noteStatusDone: { planned: "Livraison planifiée.", shipped: "Livraison partie.", delivered: "Livraison confirmée : les châssis sont marqués livrés.", cancelled: "Bon de livraison annulé.", }, transportModes: { own: "Véhicule de la société", carrier: "Transporteur", pickup: "Enlèvement client", }, modified: "Modifié", modifiedHint: "Cote, modèle ou options changés après le début de la fabrication : à refaire / vérifier", modifiedBanner: "{n} châssis modifié(s) après le début de la fabrication : à refaire ou vérifier (filtre « Modifié »).", sync: "Recalculer", syncHint: "Reconstruit le suivi depuis les ouvrages (quantités, cotes, découpage)", select: "Sélection rapide :", selectAll: "Tout", selectFrames: "Dormants / châssis", selectSashes: "Vantaux + moustiquaires", selectGlass: "Vitrages / modules", clear: "Effacer", noUnits: "Aucun châssis à suivre : ajoutez des ouvrages au projet.", noneForFilter: "Aucun châssis pour ce filtre.", status: "Statut", parts: "Éléments (cliquez pour sélectionner)", part: "Élément", pieces: "pièces", deliveredShort: "livré(s)", reservedOn: "réservé(s) sur", history: "Historique", historyTitle: "Historique de {ref}", editParts: "Découper / modifier les éléments", cancelUnit: "Annuler ce châssis", cancelPrompt: "Annuler le châssis {ref} ? La quantité de l'ouvrage baisse de 1. Motif :", selected: "{n} sélection(s)", partial: "Quantité partielle…", partialTitle: "Quantité partielle", action: "Action", undo: "Annuler une étape…", nothingAvailable: "Rien de disponible à livrer dans la sélection (pas encore prêt, ou déjà sur un bon de livraison).", deliveryNotes: "Bons de livraison du projet", editPartsTitle: "Éléments de {ref}", editPartsHint: "Découpez le châssis comme vous le livrez : dormant d'abord, vantaux ensuite, modules par étage… Les quantités déjà fabriquées ou livrées sont conservées.", addPart: "Ajouter un élément", splitInTwo: "Couper en deux lots", partProgress: "déjà fabriqué : {made} · livré : {delivered}", overview: { title: "Suivi des projets", subtitle: "Chaque projet actif : ses châssis étape par étape (fabriqués, prêts, livrés, posés), ses livraisons et ce qui est en retard.", empty: "Aucun projet à suivre.", chassis: "Châssis", progress: "Avancement", deliveries: "Livraisons", next: "Prochaine :", last: "Dernière :", notTracked: "suivi non démarré", readyPieces: "{n} élément(s) prêts à livrer", filters: { ready: "Prêts à livrer", late: "En retard", modified: "Modifiés", }, }, toDeliver: { title: "À livrer", subtitle: "Les éléments de châssis prêts à livrer (contrôlés / emballés), projet par projet. Cochez ce qui part : dormants seuls, sans vitrage, quelques modules…", subtitleMade: "Les éléments de châssis fabriqués et pas encore livrés, projet par projet.", empty: "Rien à livrer pour le moment.", emptyHint: "Les éléments marqués « prêts » dans le suivi d'un projet apparaissent ici.", available: "prêts", reserved: "sur un BL en cours", notYet: "pas encore prêts", allAvailable: "Tout le disponible", withoutGlass: "Sans vitrage", state: "État", availableCol: "Disponible", toShip: "À livrer", selected: "{n} élément(s) sélectionné(s)", create: "Créer le bon de livraison", }, notes: { title: "Bons de livraison", subtitle: "Planning des livraisons, transport, signatures et réserves.", new: "Nouveau bon de livraison", newHint: "Choisissez le projet, les éléments à livrer et le transport.", search: "N°, projet, client, transporteur, repère…", empty: "Aucun bon de livraison ici.", views: { upcoming: "À venir", today: "Aujourd'hui", late: "En retard", delivered: "Livrés", draft: "Brouillons", cancelled: "Annulés", all: "Tous", }, chassis: "Châssis", transport: "Transport", reserves: "Réserves", saveDraft: "Enregistrer le brouillon", plan: "Planifier", ship: "Marquer parti", deliver: "Confirmer la livraison", return: "Retour / annuler", cancelPrompt: "Motif de l'annulation :", returnPrompt: "Retour de marchandise : les éléments redeviennent « à livrer ». Motif :", deleteConfirm: "Supprimer ce brouillon ?", deliveredOn: "Livré le {date}", receivedBy: "Reçu par", pickProject: "Choisir un projet", pickProjectFirst: "Choisissez d'abord le projet.", delivery: "Livraison", date: "Date prévue", timeSlot: "Créneau", address: "Adresse du chantier", addressPh: "Adresse de livraison", siteContact: "Contact sur site", sitePhone: "Téléphone", carrier: "Transporteur", carrierPh: "Nom du transporteur", vehicle: "Véhicule / immatriculation", driver: "Chauffeur", pickupBy: "Enlevé par", driverPhone: "Téléphone chauffeur", trackingRef: "Réf. transporteur", cost: "Coût du transport HT (MAD)", costHint: "À la confirmation de la livraison, ce coût est ajouté aux frais du projet.", packages: "Colis / chevalets", weight: "Poids (kg)", lines: "Éléments livrés", nothingReady: "Aucun élément disponible pour ce projet (marquez-les « prêts » dans le suivi du projet).", extraLines: "Fournitures livrées", extraHint: "Accessoires de pose, visserie, silicone, joints… livrés avec les châssis.", extraPh: "ex. Pattes de fixation", addExtra: "Ajouter une fourniture", notes: "Remarques (imprimées sur le BL)", notesPh: "ex. Décharger côté façade nord, prévoir chevalets", internalNotes: "Notes internes (non imprimées)", deliverTitle: "Confirmer la livraison", deliveredAt: "Livré le", reservesPh: "Casse, rayure, manquant… (laisser vide si reçu en bon état)", deliverHint: "Les éléments du bon passent « livrés » dans le suivi du projet.", }, }, notificationEvents: { permissionsChanged: { title: "Vos droits ont été modifiés", message: "{added} ajouté(s), {removed} retiré(s)", }, quoteAcceptedProd: { title: "Devis {number} accepté", message: "{customer} — le projet va arriver en production", }, orderPlanned: { title: "Nouvel ordre de fabrication {number}", message: "{workshop} · {project}", }, orderPlannedWaiting: { title: "Nouvel ordre de fabrication {number}", message: "{workshop} · {project} — en attente des ateliers en amont", }, orderCreated: { title: "Nouvel ordre de fabrication {number}", message: "{workshop} · {title}", }, orderReady: { title: "{number} peut démarrer", message: "{workshop} : les ateliers en amont ont terminé.", }, orderDone: { title: "{number} terminé", message: "{workshop} · {project}", }, orderClosedShort: { title: "{number} clôturé avec du stock manquant", message: "{count} article(s) : {articles}", }, orderCancelled: { title: "{number} annulé", message: "{workshop} {reason}", }, orderLate: { title: "{number} en retard", message: "{workshop} · échéance {date}", }, stockLow: { title: "Stock bas : {article}", message: "{quantity} {unit} en stock (seuil {threshold})", }, quoteAccepted: { title: "Devis {number} accepté", message: "{customer} · {amount} HT", }, quoteRefused: { title: "Devis {number} refusé", message: "{customer} · {amount} HT {reason}", }, quoteExpiring: { title: "Le devis {number} expire le {date}", message: "{customer} · à relancer", }, paymentReceived: { title: "Encaissement sur {number}", message: "{customer} · {amount}", }, invoicePaid: { title: "Facture {number} soldée", message: "{customer} · {amount}", }, invoiceOverdue: { title: "Facture {number} impayée", message: "{customer} · {amount} échu depuis le {date}", }, projectDueSoon: { title: "Projet {number} : échéance dans {days} j", message: "{name} · OF non terminés : {open}", }, projectOverdue: { title: "Projet {number} en retard", message: "{name} · échéance {date} · OF non terminés : {open}", }, }, prod: { active: "Actif", inactive: "Inactif", default: "Par défaut", saved: "Enregistré.", deleted: "Supprimé.", duplicate: "Dupliquer", model: "Modèle", family: "Famille", series: "Série", finish: "Couleur / finition", noFinish: "Sans couleur (brut)", ref: "Repère", width: "Largeur", height: "Hauteur", quantity: "Quantité", workshop: "Atelier", stock: "Stock", planned: "Prévu", late: "En retard", waiting: "En attente", due: "échéance", dueDate: "Échéance", priority: "Priorité", pieces: "pièces", cuts: "coupes", bars: "barres", efficiency: "rendement", margin: "Marge", pricing: "Calcul du prix", proposedPrice: "Prix proposé HT", useProposed: "Reprendre le prix proposé", missingPrices: "Articles sans prix", pickModel: "Choisir un modèle de châssis", pickArticle: "Choisir un article", noModels: "Aucun modèle de châssis : la production doit d'abord créer le catalogue (Production → Catalogue châssis).", outOfLimits: "Dimensions hors des limites du modèle", addChassisLine: "Ajouter un châssis", editChassisLine: "Modifier le châssis", addToQuote: "Ajouter la ligne", cost: { materials: "Matières", lacquer: "Laquage (poudre)", labour: "Main d'œuvre", total: "Coût de revient", }, errors: { load: "Chargement impossible.", save: "Enregistrement impossible.", price: "Calcul du prix impossible.", size: "Indiquez la largeur et la hauteur.", quantity: "La quantité doit être d'au moins 1.", description: "Indiquez une désignation.", }, kinds: { profile: "Profilé", gasket: "Joint", glass: "Verre", panel: "Panneau / tôle", accessory: "Accessoire", consumable: "Consommable", model: "Sous-ensemble", }, materialTypes: { profile: "Profilés (barres)", powder: "Poudre", glass: "Verre", accessory: "Accessoires", gasket: "Joints", panel: "Tôles, MDF, panneaux", consumable: "Consommables", other: "Autres", }, stockModes: { unit: "À l'unité (pièce, boîte, cartouche…)", bar: "En barres", meter: "Au mètre", m2: "Au m²", sheet: "En plaques", kg: "Au kg", }, measures: { length: "Longueur (coupe)", area: "Surface (L × H)", count: "Nombre", }, finishModes: { project: "Couleur du châssis", raw: "Toujours brut", none: "Sans couleur", }, finishKinds: { raw: "Brut", lacquer: "Laqué (chez nous)", anodized: "Anodisé (acheté)", wood: "Effet bois", other: "Autre (acheté)", }, workshopKinds: { laquage: "Laquage", aluminium: "Aluminium (débit / assemblage)", vitrage: "Vitrage", other: "Autre (pose, finition…)", }, paramTypes: { number: "Nombre", boolean: "Oui / Non", choice: "Liste de choix", product: "Article du stock", model: "Autre modèle (vitrage…)", }, pricingModes: { cost_plus: "Coût de revient × coefficient", per_m2: "Prix au m²", per_ml: "Prix au mètre linéaire", per_unit: "Prix à l'unité", }, priorities: { low: "Basse", normal: "Normale", high: "Haute", urgent: "Urgente", }, orderStatus: { draft: "Brouillon", planned: "Planifié", in_progress: "En cours", done: "Terminé", cancelled: "Annulé", }, tech: { title: "Données techniques (menuiserie aluminium)", hint: "Pour que le catalogue calcule les débits : type d'article, façon de le compter en stock et dimensions utiles.", materialType: "Type d'article", stockMode: "Compté en stock", none: "— Non défini —", packUnit: "quantité par unité", barLength: "Longueur de barre", sheetWidth: "Largeur de plaque", sheetHeight: "Hauteur de plaque", packSize: "Conditionnement", weightPerMeter: "Poids au mètre", perimeter: "Périmètre laquable (développé)", paintSurface: "Surface laquée par unité", powderPerUnit: "Poudre par unité", coverage: "Consommation", thickness: "Épaisseur", }, workshops: { title: "Ateliers", subtitle: "Les ordres de fabrication de chaque atelier : laquage, aluminium, vitrage… Chaque responsable suit sa file.", newOrder: "Nouvel ordre de fabrication", configure: "Configurer les ateliers", people: "personnes", done30: "terminés (30 j)", noOrders: "Aucun ordre en cours.", blockedHint: "Attend la fin d'un atelier en amont (laquage, vitrage…)", orderTitle: "Intitulé", laqTitlePh: "ex. Laquage 40 barres pour Menuiserie X", customerMaterial: "Barres fournies par le client (on ne consomme que la poudre)", barsToLacquer: "Barres à laquer", addLine: "Ajouter une ligne", toProduce: "À produire", itemPh: "Désignation", materials: "Matières à consommer", addMaterial: "Ajouter une matière", create: "Créer l'ordre", }, order: { pdf: "Fiche de fabrication", start: "Démarrer", startAnyway: "Démarrer quand même ?", complete: "Terminer", completeTitle: "Terminer l'ordre de fabrication", started: "Ordre démarré.", booked: "Consommation enregistrée.", cancelled: "Ordre annulé.", completed: "Ordre terminé.", cancelReason: "Motif de l'annulation :", customerMaterial: "Matière du client", blocked: "Cet ordre attend la fin des ateliers en amont.", produced: "Produit", consumedCost: "Coût consommé", labour: "Temps prévu", barsToLacquer: "Barres à laquer", panes: "Vitrages à fabriquer", toProduce: "Ouvrages à fabriquer", designation: "Désignation", done: "Faits", outputs: "Production du laquage", raw: "Article brut", lacquered: "Article laqué (stock)", producedCol: "Produit", rejected: "Rebut", costPrice: "coût de revient", materials: "Matières", bookAll: "Sortir tout le reste à consommer", laqCostHint: "Les barres brutes et la poudre consommées forment le coût de revient des barres laquées (elles ne sont pas imputées au projet ici : c'est l'atelier aluminium qui impute les barres laquées).", materialsHint: "Quantités prévues par le catalogue. Saisissez ce qui sort réellement du stock (un nombre négatif = retour en stock). À la clôture, le reste prévu est sorti automatiquement.", consumed: "Consommé", remaining: "Reste", book: "Sortir du stock", bookShort: "Sortir", negativeReturn: "Nombre négatif = retour en stock", extraLine: "hors nomenclature", extra: "Consommation hors nomenclature", cuttingList: "Fiche de débit", length: "Longueur", position: "Position", offcut: "chute", keep: "à garder", oversize: "{n} pièce(s) plus longue(s) qu'une barre : prévoir un raccord ou des barres plus longues.", glassList: "Liste de coupe des verres", panelList: "Liste de coupe des panneaux", movements: "Mouvements de stock", unitCost: "Coût unitaire", by: "Par", consumeRemaining: "Sortir du stock tout ce qui reste à consommer (quantités prévues)", note: "Remarque", shortages: "Stock insuffisant pour :", needed: "besoin", completeAnyway: "Terminer en sortant le disponible", }, config: { title: "Configuration de la production", subtitle: "Ateliers et responsables, couleurs de laquage et paramètres de calcul.", tabs: { workshops: "Ateliers", finishes: "Couleurs", settings: "Paramètres", }, workshopsHint: "Chaque atelier a un responsable et une équipe (qui voient ses ordres de fabrication). « Alimente » indique le flux : Laquage → Aluminium, Vitrage → Aluminium.", newWorkshop: "Nouvel atelier", code: "Code", name: "Nom", kind: "Type", hourlyRate: "Coût horaire (MAD/h)", color: "Couleur", order: "Ordre", manager: "Responsable", pickPerson: "Choisir une personne", status: "Statut", members: "Équipe", addMember: "Ajouter une personne", feeds: "Alimente", addFeed: "Ajouter un atelier alimenté", feedsHint: "Les ordres des ateliers alimentés attendent la fin de celui-ci.", description: "Description", noManager: "Aucun responsable", deleteWorkshop: "Supprimer cet atelier ? (désactivé s'il a déjà des ordres)", finishesHint: "Les couleurs proposées sur les devis et les projets. Une couleur « laquée » est produite par l'atelier de laquage à partir des barres brutes et de sa poudre ; les autres doivent être achetées.", newFinish: "Nouvelle couleur", finishNamePh: "ex. Blanc, Gris anthracite", processWorkshop: "Atelier de laquage", autoLaquage: "Le premier atelier de laquage", powder: "Poudre", pickPowder: "Article poudre (kg)", noPowder: "Aucun article de type poudre — créez-le dans l'inventaire", noPowderLinked: "Aucune poudre liée", surcharge: "Plus-value sur le prix (%)", surchargeShort: "Plus-value", defaultFinish: "Couleur par défaut", deleteFinish: "Supprimer cette couleur ? (désactivée si elle est utilisée)", finishKindHint: { raw: "Brut : l'article brut est utilisé tel quel.", lacquer: "Laqué chez nous : les barres brutes + la poudre passent par l'atelier de laquage, qui met en stock les barres laquées.", anodized: "Anodisé : acheté déjà traité — l'article dans cette couleur doit être en stock ou commandé.", wood: "Effet bois : acheté ou sous-traité — l'article dans cette couleur doit être en stock ou commandé.", other: "Acheté déjà traité — l'article dans cette couleur doit être en stock ou commandé.", }, }, settings: { powderMethod: "Calcul de la poudre", methods: { surface: "Surface laquée × consommation (kg/m²)", per_unit: "Poudre par barre / plaque (article)", manual: "Saisie manuelle", }, methodHint: { surface: "Surface laquée de chaque article (périmètre × longueur de barre, ou surface saisie) × consommation de la poudre (kg/m²), + pertes.", per_unit: "Chaque article indique sa quantité de poudre par barre / plaque, + pertes.", manual: "Aucune estimation : le responsable du laquage saisit les kg réellement consommés.", }, defaultBarLength: "Longueur de barre par défaut", kerf: "Épaisseur de lame de scie", trimAllowance: "Recoupe en bout de barre", minReusableOffcut: "Chute réutilisable à partir de", defaultCoverage: "Consommation de poudre par défaut", powderWastePercent: "Pertes de poudre", glassWastePercent: "Pertes de verre", pricingProfileWaste: "Chutes de profilés (devis)", defaultCoefficient: "Coefficient de vente par défaut", lacquerFromStockFirst: "Utiliser d'abord les barres déjà laquées en stock (on ne laque que le manque)", consumeOnComplete: "À la clôture d'un ordre, sortir automatiquement du stock le reste prévu", }, catalog: { title: "Catalogue châssis", subtitle: "Vos séries de profilés, vos modèles de châssis et leurs formules de débit : chaque modèle calcule ses profilés, accessoires, joints, verres… selon L et H.", blankModel: "Modèle vierge", fromLibrary: "Depuis la bibliothèque", newModelName: "Nouveau modèle", tabs: { models: "Modèles", series: "Séries", library: "Bibliothèque", }, searchModels: "Nom, code…", emptyTitle: "Aucun modèle", emptyMessage: "Importez un modèle standard de la bibliothèque (coulissant, fenêtre, porte…) puis associez vos articles.", components: "Composants", parameters: "Paramètres", unmapped: "sans article", unmappedHint: "Composants à associer à un article du stock", deleteModel: "Supprimer ce modèle ? (désactivé s'il est utilisé)", libraryHint: "Modèles standard de menuiserie aluminium : importez-les dans une série, puis associez vos articles et ajustez les formules à votre système.", import: "Importer", importTitle: "Importer dans le catalogue", noSeries: "Sans série", modelName: "Nom du modèle", importHint: "Les variables du modèle (jeux, recouvrements, déductions…) sont ajoutées à la série si elles n'y sont pas déjà.", seriesHint: "Une série = un système de profilés (ex. Coulissant 67, Ouvrant RPT 50). Ses variables sont partagées par tous ses modèles : changez un jeu ici, tous les débits suivent.", newSeries: "Nouvelle série", supplier: "Fournisseur / gammiste", families: "Familles", variables: "Variables", variablesHint: "Nom court utilisable dans les formules (lettres, chiffres, _), libellé et valeur en mm.", deleteSeries: "Supprimer cette série ?", }, editor: { general: "Général", fromTemplate: "modèle", unsaved: "Modifications non enregistrées.", unmappedBanner: "{n} composant(s) sans article du stock : ils ne seront ni chiffrés ni consommés.", defaultWorkshop: "Atelier par défaut", limits: { minL: "L min (mm)", maxL: "L max (mm)", minH: "H min (mm)", maxH: "H max (mm)", }, variablesHint: "Variables de la série (lecture seule ici) et variables propres à ce modèle (elles remplacent celles de la série).", parametersHint: "Ce que l'on choisit sur la ligne du devis / du projet : nombre de vantaux, moustiquaire, vitrage… Utilisables dans les formules par leur clé.", addParameter: "Ajouter un paramètre", key: "Clé", label: "Libellé", type: "Type", default: "Par défaut", min: "Min", max: "Max", unit: "Unité", fixed: "Fixe", fixedHint: "Non modifiable sur la ligne", addOption: "Ajouter un choix", materialFilter: "Articles proposés", familyFilter: "Modèles proposés", derived: "Valeurs intermédiaires", derivedHint: "Calculées dans l'ordre et réutilisables ensuite (ex. largeur vantail wv = (L - jl + (n-1)*rc) / n).", addDerived: "Ajouter une valeur", formula: "Formule", componentsHint: "Tout ce qu'un châssis consomme. Quantité par châssis ; longueur de coupe (mm) pour les profilés et joints ; largeur × hauteur (mm) pour verres et panneaux.", toggleAll: "Tout ouvrir / fermer", addComponent: "Ajouter un composant", insertHint: "Insérer dans la formule en cours", qtyShort: "qté", if: "si", untitled: "Sans nom", toDefine: "à définir", noArticle: "article à définir", fromParam: "paramètre", up: "Monter", down: "Descendre", role: "Rôle (clé)", measure: "Mesure", source: "Source", fixedModel: "Modèle fixe", stockArticle: "Article du stock", subModel: "Sous-modèle", article: "Article", noArticleFound: "Aucun article — renseignez le type d'article dans l'inventaire", qty: "Quantité par châssis", length: "Longueur de coupe (mm)", widthF: "Largeur (mm)", heightF: "Hauteur (mm)", angle: "Coupe", finish: "Couleur", workshop: "Atelier", modelDefault: "Défaut du modèle", condition: "Condition", always: "Toujours", waste: "Pertes (%)", labour: "Main d'œuvre", labourHint: "Minutes par châssis et par atelier (formule), valorisées au coût horaire de l'atelier.", addLabour: "Ajouter", minutes: "Minutes (formule)", pricing: "Prix de vente", pricingMode: "Mode de calcul", coefficient: "Coefficient sur coût", pricePerM2: "Prix au m² HT", pricePerMl: "Prix au mètre linéaire HT", pricePerUnit: "Prix unitaire HT", minArea: "Surface minimum facturée (m²)", minPrice: "Prix minimum HT", pricingHint: { cost_plus: "Prix = coût de revient (matières + laquage + main d'œuvre) × coefficient, + plus-value de la couleur.", per_m2: "Prix = surface L × H (au moins la surface minimum) × prix au m², + plus-value de la couleur. Sans prix au m², le coefficient s'applique.", per_ml: "Prix = L en mètres × prix au mètre linéaire, + plus-value de la couleur.", per_unit: "Prix fixe par châssis, + plus-value de la couleur.", }, test: "Tester le modèle", run: "Calculer", saveAndTest: "Enregistrer et calculer", needs: "Besoins (unités de stock)", lines: "Détail des composants", size: "Dimension", values: "Valeurs des variables", addVariable: "Ajouter une variable", value: "Valeur", delivery: "Découpage de livraison", deliveryHint: "Comment un châssis est suivi et livré : dormant, vantaux, vitrages, modules… Quantité et condition sont des formules (ex. n vantaux ; vitrages seulement si un vitrage est choisi).", deliveryDefault: "Aucun découpage : chaque châssis est suivi et livré en un seul élément « Châssis complet ».", addDeliveryPart: "Ajouter un élément", deliveryPartPh: "ex. Dormant, Vantaux, Modules", }, project: { tabs: { ouvrages: "Ouvrages", fabrication: "Fabrication", suivi: "Suivi", }, defaultFinish: "Couleur du projet", chassis: "châssis", addItem: "Ajouter un châssis", editItem: "Modifier le châssis", itemLabel: "Désignation / remarque", noItems: "Aucun ouvrage. Les châssis d'un devis accepté arrivent ici ; ajoutez-en après la prise de côtes.", deleteItem: "Retirer ce châssis du projet ?", fabricationHint: "Besoins calculés depuis les ouvrages et le catalogue, atelier par atelier. « Lancer la fabrication » crée les ordres de fabrication (laquage et vitrage avant l'aluminium).", launch: "Lancer la fabrication", replan: "Recalculer les ordres", replanConfirm: "Remplacer les ordres de fabrication non commencés par un nouveau calcul ?", planned: "{n} ordre(s) de fabrication créé(s).", orders: "Ordres de fabrication", shortages: "Manques de stock", shortagesHint: "Ce qu'il faut acheter (ou laquer) pour produire le projet, au stock actuel.", missing: "Manque", variantToBuy: "couleur à acheter (non laquée chez nous)", lines: "lignes", after: "après", detail: "Détail", sizes: "dimensions", fromStock: "du stock", toLacquer: "à laquer", consumption: "Consommations du projet", consumptionHint: "Prévu (catalogue) et réellement consommé par les ateliers, article par article.", type: "Type", gap: "Écart", cost: "Coût", allDone: "Tous les ordres de fabrication sont terminés.", }, }, projects: { title: "Projets", subtitle: "Les affaires clients : budget prévu et coût réel (matières, achats, heures, frais), avancement et marge.", new: "Nouveau projet", create: "Créer le projet", search: "Numéro, nom, lieu…", fromQuoteHint: "Astuce : un projet se crée en général depuis un devis accepté (Ventes → Devis → Créer le projet) : son chiffre d'affaires est rempli.", name: "Nom du projet", location: "Chantier / adresse", startDate: "Début", dueDate: "Échéance", due: "échéance", manager: "Chef de projet", team: "Équipe", pickManager: "Choisir une personne", pickPerson: "Choisir une personne", noCustomer: "Aucun client (projet interne)", progress: "Avancement", revenue: "CA HT", actualCost: "Coût réel", margin: "Marge", hours: "Heures", invoiced: "Facturé", toInvoice: "à facturer", planned: "prévue", actual: "Réel", difference: "Reste", total: "Total", budgetVsActual: "Budget et coût réel", editBudget: "Modifier le budget", late: "En retard", overBudget: "Budget dépassé", saved: "Projet enregistré.", editDetails: "Modifier les informations (nom, dates, chef de projet, équipe)", statuses: { active: "En cours", planned: "Planifié", in_progress: "En cours", on_hold: "En pause", completed: "Terminé", cancelled: "Annulé", }, taskStatuses: { todo: "À faire", in_progress: "En cours", done: "Fait", blocked: "Bloqué", }, budget: { title: "Budget", revenue: "CA HT", materials: "Matières", labour: "Main-d'œuvre", purchases: "Achats", other: "Autres frais", }, tabs: { tasks: "Tâches", hours: "Heures", materials: "Matières", purchases: "Achats", expenses: "Frais", invoices: "Factures", }, add: { tasks: "Ajouter une tâche", hours: "Saisir des heures", materials: "Sortir du stock", expenses: "Ajouter un frais", purchases: "Nouveau bon de commande pour ce projet", }, task: { title: "Tâche", estimatedHours: "Heures prévues", assignee: "Assignée à", }, time: { employee: "Salarié", hours: "Heures", task: "Tâche", rate: "Coût / heure", cost: "Coût", costHint: "Coût horaire = coût mensuel du salarié pour l'entreprise (brut + CNSS, AMO et taxe de formation patronales) ÷ heures mensuelles. Il est figé au moment de la saisie.", }, materials: { article: "Article", inStock: "en stock", unitCost: "Coût unitaire HT", unitCostAuto: "auto : prix fournisseur", direction: "Mouvement", out: "Sortie pour le projet", return: "Retour en stock", taken: "Matière sortie du stock.", returned: "Matière remise en stock.", }, expense: { label: "Frais", placeholder: "Transport, sous-traitance, location…", amount: "Montant HT", }, empty: { tasks: "Aucune tâche pour l'instant.", hours: "Aucune heure saisie.", materials: "Aucune matière sortie du stock.", purchases: "Aucun bon de commande lié à ce projet.", expenses: "Aucun frais.", invoices: "Aucune facture pour l'instant.", }, purchasesHint: "Les bons de commande liés au projet (commandés ou reçus) comptent dans son coût, en HT. Liez un bon à sa création, ou depuis le bon de commande.", forProject: "Pour le projet", noProject: "Aucun projet", deleteTitle: "Supprimer ce projet ?", deleteMessage: "Possible seulement tant que rien n'y est enregistré (heures, matières, achats, factures). Sinon, annulez-le.", emptyTitle: "Aucun projet ici", emptyMessage: "Acceptez un devis et créez son projet, ou créez-en un ici.", planning: { title: "Planning", subtitle: "Tous les projets en cours et leurs tâches sur une frise.", range: "Période", weeks: "{n} semaines", today: "Aujourd'hui", unscheduled: "non planifiée", empty: "Aucun projet en cours.", }, errors: { load: "Impossible de charger les projets.", save: "Impossible d'enregistrer.", }, }, sales: { all: "Tous", number: "Numéro", date: "Date", customer: "Client", subject: "Objet", status: "Statut", type: "Type", validUntil: "Valable jusqu'au", dueDate: "Échéance", project: "Projet", amount: "Montant", method: "Mode", reference: "Référence", referencePlaceholder: "N° de virement ou de chèque", notes: "Remarques", paymentTerms: "Conditions de paiement", paymentTermsPlaceholder: "ex. 30 % à la commande, solde à la livraison", pickCustomer: "Choisir un client", noCustomer: "Aucun client — ajoutez-en un dans Ventes → Clients", emailTo: "Destinataire", emailMessage: "Message", emailDefault: "Laisser vide pour le message standard", send: "Envoyer", emailSent: "E-mail envoyé.", emailSimulated: "E-mail NON envoyé : aucun serveur d'e-mail n'est encore configuré. Il a été enregistré dans la boîte d'envoi — configurez SMTP dans le .env du backend pour envoyer réellement.", lines: { title: "Lignes", article: "Article", description: "Désignation", descriptionPlaceholder: "Produit, prestation, travaux…", quantity: "Qté", unit: "Unité", unitPrice: "P.U. HT", discount: "Remise %", vat: "TVA", totalHT: "Total HT", pickArticle: "De l'inventaire (facultatif)", addLine: "Ajouter une ligne", }, totals: { ht: "Total HT", vat: "TVA", ttc: "Total TTC", }, quoteStatus: { draft: "Brouillon", sent: "Envoyé", accepted: "Accepté", refused: "Refusé", expired: "Expiré", cancelled: "Annulé", }, invoiceStatus: { draft: "Brouillon", issued: "Émise", partially_paid: "Payée en partie", paid: "Payée", cancelled: "Annulée", }, invoiceTypes: { invoice: "Facture", deposit: "Facture d'acompte", credit_note: "Avoir", }, customers: { title: "Clients", subtitle: "Les coordonnées de vos clients pour les devis et factures (ICE, IF, RC), leurs contacts et délais de paiement — et ce que chacun vous doit.", new: "Nouveau client", search: "Rechercher un client, ICE, ville…", name: "Nom", kind: "Type", kinds: { company: "Société", individual: "Particulier", }, iceHint: "Obligatoire sur les factures entre sociétés", paymentDays: "Délai de paiement (jours)", paymentDaysShort: "Délai", email: "E-mail", phone: "Téléphone", address: "Adresse", city: "Ville", contacts: "Contacts", contactName: "Nom", contactRole: "Fonction", addContact: "Ajouter un contact", notes: "Remarques", invoiced: "Facturé (TTC)", due: "Doit", overdue: "En retard", inactive: "Inactif", saved: "Client enregistré.", deleted: "Client supprimé.", deactivated: "Ce client a des devis ou des factures : désactivé au lieu d'être supprimé.", deleteTitle: "Supprimer ce client ?", deleteMessage: "« {name} » sera supprimé — ou désactivé s'il a déjà des devis ou des factures.", emptyTitle: "Aucun client pour l'instant", emptyMessage: "Ajoutez votre premier client pour faire un devis.", }, quotes: { title: "Devis", one: "Devis", subtitle: "Devis numérotés avec TVA par taux, envoyés en PDF ; un devis accepté devient un projet et se facture (acomptes, puis facture finale).", new: "Nouveau devis", edit: "Modifier le devis", search: "Numéro, client, objet…", validDefault: "Vide : valable 30 jours.", emptyTitle: "Aucun devis ici", emptyMessage: "Créez un devis pour un client.", duplicate: "Dupliquer", sendEmail: "Envoyer par e-mail", markSent: "Marquer comme envoyé", accept: "Accepté", refuse: "Refusé", refuseReason: "Motif (facultatif)", refusedBecause: "Refusé", sentOn: "Envoyé le", cancel: "Annuler le devis", cancelMessage: "Le devis sera annulé. Il reste dans la liste, marqué annulé.", toProject: "Créer le projet", createProject: "Créer le projet", toProjectHint: "Le chiffre d'affaires du projet sera le HT du devis ({amount}). Vous ajouterez son budget, ses tâches et son équipe sur la page du projet.", deposit: "Facture d'acompte", depositPercent: "Acompte (% du devis)", depositAmount: "soit {amount} TTC", createDeposit: "Créer la facture d'acompte", finalInvoice: "Facture finale", deleteTitle: "Supprimer ce brouillon ?", deleteMessage: "Le devis brouillon sera supprimé.", }, invoices: { title: "Factures", subtitle: "Factures clients, factures d'acompte et avoirs. Le numéro est attribué à l'émission : jamais de trou dans la numérotation.", new: "Nouvelle facture", newCredit: "Nouvel avoir", edit: "Modifier le brouillon", search: "Numéro, client, objet…", fromQuoteHint: "Astuce : les factures d'un devis se font depuis le devis (acompte, puis facture finale) — les acomptes sont alors déduits automatiquement.", filters: { all: "Toutes", unpaid: "À encaisser", overdue: "En retard", draft: "Brouillons", paid: "Payées", credit_note: "Avoirs", }, emptyTitle: "Aucune facture ici", remaining: "Reste à payer", overdue: "En retard", paid: "Payé", dueDefault: "Vide : calculée à l'émission, selon le délai de paiement du client.", dueOnIssue: "Calculée à l'émission", issue: "Émettre la facture", issueMessage: "La facture reçoit son numéro définitif et ne peut plus être modifiée ni supprimée (seulement corrigée par un avoir). Vérifiez la date : les numéros doivent suivre les dates.", issued: "Facture émise.", draftHint: "Brouillon : pas encore de numéro, modifiable. Émettez-la pour lui donner son numéro et l'envoyer.", deleteMessage: "Le brouillon sera supprimé.", addPayment: "Enregistrer un règlement", paymentSaved: "Règlement enregistré.", payments: "Règlements", usage: "Imputé sur", applyCredit: "Imputer sur une facture", apply: "Imputer", applied: "Avoir imputé.", applyHint: "{amount} disponibles sur cet avoir.", pickInvoice: "Choisir la facture", noOpenInvoice: "Aucune facture impayée pour ce client", sendEmail: "Envoyer par e-mail", makeCredit: "Faire un avoir", creditedInvoice: "Corrige la facture", creditNotes: "Avoirs", noIce: "Pas d'ICE sur la fiche client (obligatoire entre sociétés)", depositsDeducted: "Acomptes déjà facturés (HT)", netHT: "Net HT", netToPay: "Net à payer TTC", depositsList: "Acomptes déduits", }, receivables: { title: "Encaissements", subtitle: "Ce que vos clients vous doivent, par ancienneté, les factures à relancer et la TVA collectée.", toCollect: "À encaisser", overdue: "En retard", invoicedMonth: "Facturé ce mois (TTC)", collectedMonth: "Encaissé ce mois", byCustomer: "Par client", nothingDue: "Rien à encaisser.", credits: "Avoirs", total: "Total", buckets: { notDue: "Non échu", d1_30: "1–30 j de retard", d31_60: "31–60 j", d61_90: "61–90 j", d90plus: "> 90 j", }, toChase: "Factures à encaisser", lateDays: "{days} j de retard", }, vat: { title: "TVA collectée", hint: "Par défaut au Maroc, la TVA sur les ventes est due à l'ENCAISSEMENT (régime des encaissements) ; les entreprises ayant opté pour le régime des débits la déclarent sur les factures émises. Les deux sont affichés.", rate: "Taux", onPayments: "Sur encaissements", onInvoices: "Sur factures émises", baseOnPayments: "Base HT (encaissements)", }, errors: { load: "Impossible de charger les données.", save: "Impossible d'enregistrer.", }, }, leaveBalances: { title: "Soldes de congés", subtitle: "Congés payés par salarié, calculés selon le Code du travail.", rules: "Code du travail : 1,5 jour ouvrable par mois de service (2 pour les moins de 18 ans), +1,5 jour par période de 5 ans d'ancienneté, 30 jours par an au maximum (art. 231–232). Les congés se comptent en jours ouvrables : les jours de repos hebdomadaire et les jours fériés chômés ne sont pas décomptés.", extraDays: "Jours en plus par an (politique de l'entreprise)", policySaved: "Politique de congés enregistrée.", saved: "Solde d'ouverture enregistré.", emptyTitle: "Aucun salarié actif.", columns: { employee: "Salarié", hired: "Embauche", perYear: "Jours / an", opening: "Solde d'ouverture", accrued: "Acquis", taken: "Pris", thisYear: "Cette année", remaining: "Solde", }, years: "{n} an(s)", bonusHint: "Dont {n} jour(s) d'ancienneté", minor: "moins de 18 ans", carryOverHint: "Plus de 2 ans de congés accumulés : le report des congés nécessite un accord (art. 240).", missingHireDate: "Pas de date d'embauche sur la fiche : rien ne peut être calculé.", editOpening: "Solde d'ouverture", openingHint: "Jours restant au salarié à une date donnée, d'après votre ancien système ou vos registres. Les congés s'acquièrent à partir de cette date ; les congés pris avant ne sont pas décomptés une seconde fois.", openingDays: "Jours restants", openingDate: "Au (date)", note: "Note", clearOpening: "Supprimer", errors: { load: "Impossible de charger les soldes de congés.", save: "Impossible d'enregistrer.", }, }, declarations: { title: "Déclarations de paie", subtitle: "CNSS (Damancom), virement des salaires et IR (Simpl-IR), préparés à partir de votre paie.", payroll: "Paie", year: "Année", noRun: "Choisir une paie", draft: "brouillon", noRunTitle: "Aucune paie pour l'instant", noRunMessage: "Générez d'abord une paie (RH → Paie).", noProblem: "Tout est en ordre.", problemsTitle: "{count} problème(s) à corriger avant de générer le fichier", warningsTitle: "À vérifier", tabs: { cnss: "CNSS — Damancom", bank: "Virement bancaire", irMonthly: "IR — versement mensuel", irAnnual: "IR — déclaration annuelle", }, cnss: { step1: "Sur Damancom, téléchargez le préétabli du mois (la liste de vos salariés assurés préparée par la CNSS).", step2: "Chargez-le ici : chaque salarié est rapproché de la paie, et les nouveaux salariés sont ajoutés.", step3: "Corrigez ce qui est signalé, générez le fichier, puis déposez-le sur Damancom (Échange de fichiers) et validez.", choose: "Choisir le préétabli", noFile: "Aucun fichier choisi", check: "Vérifier", employees: "Salariés", days: "Jours déclarés", gross: "Salaire brut", capped: "Salaire plafonné", daysShort: "Jours", insuredTitle: "Salariés assurés (du préétabli)", entrantsTitle: "Nouveaux salariés (absents du préétabli)", name: "Nom", cnssNumber: "N° CNSS", situation: "Situation", situationNone: "— aucune —", paid: "Payé ce mois", generate: "Générer le fichier Damancom", formatNote: "Le fichier suit le format d'échange BDS de la CNSS (lignes de longueur fixe, montants en centimes). Avant votre première déclaration réelle, déposez-le sur Damancom et vérifiez le rapport de contrôle — ou faites-le comparer une fois par votre comptable.", }, bank: { count: "Virements", total: "Total", debited: "Compte débité", beneficiary: "Bénéficiaire", bank: "Banque", amount: "Montant", executionDate: "Date d'exécution", otherPayments: "{count} salarié(s) payé(s) en espèces ou par chèque ({amount} MAD) — listés dans le fichier Excel, pas dans les virements.", note: "Chaque RIB est vérifié (24 chiffres et clé de contrôle) avant la génération du fichier. Importez le fichier Excel ou CSV dans le portail entreprise de votre banque (virement de masse) ; au premier import, associez les colonnes une seule fois.", }, ir: { toPay: "IR retenu à verser", deadline: "Échéance", taxed: "Salariés imposés", taxable: "Total net imposable", taxableShort: "Net imposable", draftWarning: "Cette paie est encore un brouillon : les montants peuvent encore changer.", howTo: "Versez ce montant sur Simpl-IR (DGI) avant l'échéance : l'IR retenu sur les salaires d'un mois est versé avant la fin du mois suivant.", }, annual: { grossTaxable: "Brut imposable", netTaxable: "Net imposable", ir: "IR retenu", months: "Mois", deductions: "Déductions", xml: "Fichier XML (Simpl-IR)", note: "Déclaration annuelle des traitements et salaires (état 9421), à déposer sur Simpl-IR avant le 1er mars. Construite à partir des paies CLÔTURÉES de l'année. Avant le premier dépôt, déposez le XML sur Simpl-IR et vérifiez qu'il est accepté — ou faites relire la version Excel par votre comptable.", }, errors: { load: "Impossible de charger les données.", generic: "Impossible de générer le fichier.", }, }, platform: { rename: "Renommer le client", title: "Clients", subtitle: "Tous les clients de la plateforme, avec leurs sociétés et leurs comptes. Vous ne voyez que des totaux — jamais les données RH ou achats d'un client.", new: "Nouveau client", create: "Créer le client", details: "Détails", created: "Client « {name} » créé. Son administrateur peut se connecter dès maintenant avec {email} et le mot de passe défini.", firstAdmin: "Premier compte administrateur", firstAdminHint: "L'administrateur du client : il crée les sociétés, départements, employés et comptes. Transmettez-lui le mot de passe par un canal sûr ; il pourra le changer dans son profil.", fields: { name: "Nom du client", namePlaceholder: "ex. Groupe Atlas", notes: "Notes (internes)", firstName: "Prénom", lastName: "Nom", email: "E-mail", password: "Mot de passe provisoire", passwordHint: "Au moins 8 caractères.", }, columns: { client: "Client", companies: "Sociétés", accounts: "Comptes", employees: "Employés", status: "Statut", created: "Créé le", }, status: { active: "Actif", suspended: "Suspendu", }, suspend: "Suspendre", reactivate: "Réactiver", suspendTitle: "Suspendre ce client ?", suspendMessage: "Tous les comptes de « {name} » seront déconnectés et bloqués, y compris les sessions ouvertes. Rien n'est supprimé ; vous pouvez le réactiver à tout moment.", reactivateTitle: "Réactiver ce client ?", reactivateMessage: "Les comptes de « {name} » pourront de nouveau se connecter.", suspendedNotice: "« {name} » est suspendu.", reactivatedNotice: "« {name} » est de nouveau actif.", admins: "Comptes administrateurs", addAdmin: "Ajouter un administrateur", noAdmins: "Aucun compte administrateur.", adminAdded: "Compte administrateur {email} créé.", roles: { admin: "Administrateur", owner: "Propriétaire", }, privacyNote: "Isolation des clients : cette page n'affiche que les comptes qui administrent le client. Ses employés, sa paie, ses documents et ses achats restent visibles par le client seulement.", emptyTitle: "Aucun client pour l'instant", emptyMessage: "Créez le premier client et son compte administrateur.", orphans: { title: "Données rattachées à aucun client", hint: "Créées avant l'isolation des clients et non rattachées automatiquement. Tant qu'elles ne sont pas rattachées, personne ne les voit. Choisissez le client auquel elles appartiennent.", companies: "Sociétés", users: "Comptes", chooseClient: "Choisir un client", assign: "Rattacher à ce client", done: "{companies} société(s) et {users} compte(s) rattaché(s).", }, errors: { load: "Impossible de charger les clients.", save: "Impossible d'enregistrer cette modification.", }, }, files: { open: "Ouvrir le fichier", openFailed: "Impossible d'ouvrir le fichier", }, login: { useBackupCode: "Utiliser plutôt un code de secours", useAuthenticator: "Utiliser plutôt le code de l'application", invalidCode: "Code invalide", verifying: "Vérification...", verify: "Vérifier", backupCodeHint: "Saisissez l'un de vos codes de secours.", authenticatorHint: "Saisissez le code à 6 chiffres de votre application d'authentification.", failed: "Échec de la connexion", signingIn: "Connexion...", signIn: "Se connecter", password: "Mot de passe", email: "E-mail", }, purchasing: { supplierPayment: { done: "Règlement de {amount} enregistré sur {count} facture(s) — référence {ref}.", confirm: "Enregistrer le règlement", total: "Total du règlement", title: "Règlement à {supplier}", settle: "Régler la sélection", selection: "{count} facture(s) sélectionnée(s) — reste à payer {amount}", pickSupplierHint: "Choisissez un fournisseur ci-dessus pour régler plusieurs de ses factures en un seul paiement.", }, invoiceVat: { oldestFirst: "Factures les plus anciennes d'abord (automatique)", settlesInvoice: "Facture réglée", hintCredit: "Recopiez les montants de l'avoir du fournisseur, taux par taux.", hintInvoice: "Recopiez le HT et la TVA par taux exactement comme sur la facture du fournisseur. Attendu d'après les réceptions : {amount}.", estimated: "TVA estimée (pas de détail saisi)", addRate: "Ajouter un taux de TVA", vatAmount: "TVA", }, missingInvoice: { badge: "Sans facture", banner: "Marchandise reçue ({amount}) mais aucune facture fournisseur saisie : ajoutez-la pour planifier le paiement et déduire la TVA.", }, dueDate: { supplierFieldHint: "Vide : les factures prendront le délai légal par défaut de 60 jours, avec un avertissement.", savedNoTerms: "(délai légal par défaut de 60 jours : le fournisseur n'a pas de délai de paiement renseigné)", savedNotice: "Facture {number} enregistrée — échéance le {date}.", manual: "Échéance saisie manuellement.", noSupplierTerms: "Aucun délai de paiement renseigné pour {supplier} : échéance fixée au délai légal par défaut de 60 jours (Loi 69-21). Renseignez-le dans Fournisseurs pour qu'elle soit exacte la prochaine fois.", fromSupplier: "Échéance calculée : {days} jours, selon les conditions de {supplier}.", }, supplierDocs: { types: { other: "Autre", patente: "Patente / taxe professionnelle", rib: "RIB", cnss: "Attestation CNSS", rc: "Registre de commerce (RC)", attestation_fiscale: "Attestation de régularité fiscale", }, state: { ok: "Valide", expiring: "Expire bientôt", expired: "Expiré", }, alertHint: "L'équipe achats est alertée 30 jours avant l'expiration d'un document.", deleteConfirm: "Supprimer ce document ?", noExpiry: "Sans expiration", expiryDate: "Date d'expiration", issueDate: "Date d'émission", number: "Numéro", label: "Nom", type: "Type", add: "Ajouter un document", empty: "Aucun document.", title: "Documents fournisseur", }, statement: { types: { payment: "Règlement", credit_note: "Avoir", invoice: "Facture", }, balance: "Solde", credit: "Crédit", debit: "Débit", reference: "Référence", operation: "Opération", empty: "Aucun mouvement sur cette période.", closing: "Solde dû", settled: "Réglé / avoirs", invoiced: "Facturé", opening: "Solde d'ouverture", title: "Relevé fournisseur", }, restock: { suggested: "À commander", requested: "Demandé", incoming: "En commande", minimum: "Minimum", stock: "En stock", createOrder: "Créer le bon de commande", noSupplier: "Aucun prix fournisseur enregistré", empty: "Rien à réapprovisionner : tous les articles sont au-dessus de leur minimum ou déjà commandés.", subtitle: "Articles au niveau ou sous leur stock minimum, après ce qui est déjà commandé — regroupés par fournisseur le moins cher.", title: "Réapprovisionnement", }, reports: { withoutInvoiceReason: { overpaid: "payé au-delà du facturé", no_invoice: "aucune facture saisie", }, agedHint: "Basée sur les factures fournisseurs et leurs échéances — les commandes sans facture ne sont pas encore comptées.", withoutInvoiceHint: "La TVA se déduit sur FACTURE fournisseur. Ajoutez la facture sur le bon de commande (Factures → Ajouter une facture) et le paiement apparaîtra dans le relevé.", withoutInvoiceTitle: "{count} paiement(s) absent(s) de ce relevé", aged: { total: "Total dû", d90plus: "> 90 j", d61_90: "61–90 j", d31_60: "31–60 j", d1_30: "1–30 j", notDue: "Non échu", }, agedEmpty: "Rien n'est dû aux fournisseurs.", agedTitle: "Balance âgée fournisseurs", accounts: { a5161: "Caisse", a5141: "Banque", a4411: "Fournisseurs", a34552: "TVA récupérable", a6111: "Achats", }, accountingHint: "Factures, avoirs et règlements fournisseurs de la période en écritures comptables, selon le plan comptable marocain :", accountingTitle: "Export comptable (journal)", paymentDate: "Date de paiement", missingIds: "IF / ICE manquants", supplierIds: "IF / ICE fournisseur", vatEmpty: "Aucun règlement fournisseur sur cette période.", vatDeductible: "TVA déductible", vatHint: "Factures RÉGLÉES sur la période (la TVA se déduit au paiement), avec l'IF et l'ICE du fournisseur — à joindre à la déclaration de TVA.", vatTitle: "Relevé des déductions de TVA", downloadXlsx: "Télécharger Excel", subtitle: "Les fichiers pour votre comptable et votre déclaration de TVA.", title: "Rapports achats", }, compare: { hint: "Le moins cher par ligne en vert. Choisir un fournisseur crée le bon de commande et clôture les autres offres.", choose: "Choisir", incomplete: "Incomplète", title: "Comparaison des offres", button: "Comparer", created: "{count} demandes de prix créées (une par fournisseur). Utilisez « Comparer » quand ils auront répondu.", multiHint: "Une demande de prix par fournisseur ({count}) sera créée — vous pourrez comparer leurs réponses.", addSupplier: "Ajouter un fournisseur", suppliers: "Fournisseurs", }, email: { simulatedShort: "non envoyé (pas de SMTP)", simulated: "E-mail NON envoyé : aucun serveur d'e-mail n'est encore configuré. Il a été enregistré dans la boîte d'envoi — configurez SMTP dans le .env du backend pour envoyer réellement.", sent: "E-mail envoyé à {to}.", defaultMessageHint: "Laisser vide pour utiliser le message standard", message: "Message", cc: "Copie (CC)", to: "Destinataire", titleDp: "Envoyer {number} au fournisseur", title: "Envoyer {number} au fournisseur", send: "Envoyer par e-mail", }, approval: { approvedOn: "Approuvé le {date}", refusedBanner: "Approbation refusée : {reason}", waitingForApprover: "Un admin, le propriétaire ou le responsable des achats doit l'approuver.", pendingBanner: "En attente d'approbation depuis le {date}.", approvedNotice: "BC approuvé — il peut maintenant être envoyé au fournisseur.", requested: "Ce BC dépasse le seuil d'approbation : il a été soumis pour approbation. Les approbateurs ont été notifiés.", refuseReason: "Motif du refus", refuseTitle: "Refuser", refuse: "Refuser", approve: "Approuver", }, supplierInvoices: { title: "Factures fournisseurs", subtitle: "Toutes les factures fournisseurs par échéance — ce qui reste à payer et ce qui est en retard.", overdue: "En retard", overdueCount: "{count} facture(s)", dueIn30: "À payer sous 30 jours", empty: "Aucune facture ici.", filters: { unpaid: "À payer", overdue: "En retard", all: "Toutes" } }, legal: { needs_agreementHint: "Délai de paiement supérieur à 60 jours : autorisé seulement par accord écrit (Loi 69-21).", over_maxHint: "Délai de paiement supérieur à 120 jours : au-delà du maximum légal (Loi 69-21)." }, invoiceStatus: { overdue: "En retard de {days} j" }, invoices: { type: "Type", types: { invoice: "Facture", credit_note: "Avoir" }, applied: "Déduit" }, match: { notInvoiced: "Pas encore facturé", matched: "Conforme aux réceptions", toInvoice: "{amount} restent à facturer", overInvoiced: "{amount} facturés en trop", creditExpected: "Un avoir de {amount} est attendu du fournisseur pour la marchandise retournée.", overInvoicedHint: "Le fournisseur a facturé {amount} de plus que ce qui a été reçu et conservé — vérifiez la facture avant de payer." }, kpi: { ordered: "Commandé", received: "Réceptionné", ofOrder: "de la commande", invoiced: "Facturé (net)", paid: "Payé", settled: "Soldé" }, pdf: { download: "Télécharger le PDF" }, supplierSelect: { choose: "Choisir un fournisseur", none: "Aucun fournisseur — ajoutez-en un dans Achats > Fournisseurs", notInList: "absent de la liste des fournisseurs" }, supplierPrices: { open: "Prix et références fournisseurs", internalReference: "Référence interne", internalReferencePlaceholder: "ex. RM-GANTS-01", referenceLocked: "Seule la production peut modifier une référence interne existante.", referenceMissing: "Cet article n'a pas encore de référence interne — vous pouvez l'ajouter.", supplierReference: "Référence fournisseur", none: "Aucun prix fournisseur pour l'instant.", addSupplier: "Ajouter un fournisseur", noReference: "Sans référence" }, addToInventory: { button: "Ajouter à l'inventaire", title: "Ajouter cet article à l'inventaire", category: "Catégorie", referenceOptional: "Facultatif — peut être ajoutée plus tard", threshold: "Stock minimum (alerte)", stockNow: "{count} déjà reçu(s) seront mis en stock maintenant.", stockLater: "Les prochaines réceptions de cette ligne iront en stock.", confirm: "Ajouter à l'inventaire" }, errors: { load: "Impossible de charger les données.", save: "Impossible d'enregistrer cette modification." }, columns: { number: "Numéro", date: "Date", supplier: "Fournisseur", status: "Statut", payment: "Paiement", paid: "Payé", received: "Reçu", note: "Note", article: "Article", quantity: "Quantité", requestedBy: "Demandé par" }, filters: { missingInvoice: "Reçus sans facture", late: "Livraisons en retard", all: "Tous", number: "Numéro de BC" }, lines: { closed: "Soldée", complete: "Complète", closedBecause: "Soldée", receivedShort: "reçus", returnedShort: "retournés", expectedShort: "encore attendus", close: "Solder", closeHint: "Accepter la quantité reçue comme définitive — plus rien ne sera attendu sur cette ligne", reopen: "Rouvrir", closeTitle: "Solder la ligne", closeSummary: "{received} reçus sur {ordered} commandés — les {missing} manquants ne seront plus attendus.", closeReason: "Motif (facultatif)", closeReasonPlaceholder: "ex. reliquat annulé avec le fournisseur", closeEffect: "Quand toutes les lignes sont reçues ou soldées, le BC passe en « Réceptionné » et ses demandes d'achat sont clôturées. Vous pourrez rouvrir la ligne.", priceFromArticle: "Prix repris du prix fournisseur de l'article (inventaire) — modifiable si besoin", noPriceShort: "Aucun prix", pickSupplierForPrices: "Choisissez le fournisseur : les prix des articles seront repris de l'inventaire.", missingPrices: "{count} article(s) sans prix pour {supplier} dans l'inventaire — saisissez-le sur la ligne.", article: "Article", pickArticle: "Article de l'inventaire (facultatif)", description: "Désignation", descriptionPlaceholder: "Article ou prestation", quantity: "Qté", unit: "Unité", unitPrice: "Prix unitaire HT", quotedPrice: "Prix proposé HT", vat: "TVA", addLine: "Ajouter une ligne" }, totals: { ht: "Total HT", vat: "TVA", ttc: "Total TTC" }, orderStatus: { pending_approval: "En attente d'approbation", draft: "Brouillon", sent: "Commandé", partially_received: "Réception partielle", received: "Réceptionné", cancelled: "Annulé" }, paymentStatus: { unpaid: "Non payé", partially_paid: "Partiellement payé", paid: "Payé" }, requestStatus: { pending: "En attente", delayed: "Retardée", ordered: "Commandée", declined: "Refusée", received: "Reçue" }, priceStatus: { draft: "Brouillon", sent: "Envoyée", answered: "Répondue", accepted: "Acceptée", rejected: "Refusée" }, paymentMethods: { virement: "Virement", cheque: "Chèque", especes: "Espèces", effet: "Effet de commerce", carte: "Carte", autre: "Autre" }, summary: { missingInvoice: "Reçus sans facture", totalOrdered: "Total commandé (TTC)", totalPaid: "Total payé", remaining: "Reste à payer", overdue: "BC avec factures échues", byStatus: "BC par statut" }, requests: { title: "Demandes d'achat", subtitle: "Les demandes de la production. Traitez-les une par une, ou sélectionnez-en plusieurs pour créer un bon de commande.", createOrder: "Créer un bon de commande ({count})", empty: "Aucune demande d'achat ici.", select: "Sélectionner", stock: "Stock", threshold: "seuil", productionNote: "Note de la production", purchasingAnswer: "Réponse des achats", filters: { open: "À traiter", ordered: "Commandées", declined: "Refusées", received: "Reçues", all: "Toutes" }, actions: { ordered: "Marquer comme commandée", delayed: "Retarder (avec un motif)", declined: "Refuser (avec un motif)", note: "Ajouter une note pour la production" }, dialog: { linkOrder: "Lier à un bon de commande existant (facultatif)", noOrder: "— Sans lien (commandé autrement) —", notifyHint: "La production est notifiée de votre réponse.", orderedTitle: "Marquer comme commandée", orderedLabel: "Note (facultatif)", orderedPlaceholder: "ex. livraison prévue lundi", delayedTitle: "Retarder la demande", delayedLabel: "Pourquoi est-elle retardée ?", delayedPlaceholder: "ex. fournisseur en rupture jusqu'au 15", declinedTitle: "Refuser la demande", declinedLabel: "Motif du refus", declinedPlaceholder: "ex. article arrêté, utiliser la nouvelle référence", noteTitle: "Note pour la production", noteLabel: "Note", notePlaceholder: "ex. en attente du devis du fournisseur" } }, orders: { title: "Bons de commande", subtitle: "Commandes, réceptions, factures et paiements — le récapitulatif des achats.", new: "Nouveau bon de commande", empty: "Aucun bon de commande.", form: { editTitle: "Modifier le bon de commande", supplierRequired: "Choisissez un fournisseur.", pickSupplier: "Choisir un fournisseur", noSuppliers: "Aucun fournisseur actif — ajoutez-en un dans Fournisseurs.", expectedDate: "Livraison prévue", fromRequests: "Créé à partir de {count} demande(s) d'achat : l'enregistrement les lie et notifie la production.", saveDraft: "Enregistrer en brouillon", saveAndSend: "Enregistrer et marquer commandé", noCompany: "Ouvrez cette page depuis la liste des bons de commande." } }, detail: { paymentWithoutInvoice: "Payé, mais aucune facture fournisseur n'est encore saisie : ajoutez-la (Factures ci-dessus) pour que ce paiement compte dans le relevé de TVA et la balance âgée.", lines: "Lignes", addCreditNote: "Ajouter un avoir", creditNoteNumber: "N° d'avoir", dueDateAuto: "Laisser vide : date de facture + {days} jours (conditions du fournisseur)", expectedFromReceptions: "Attendu d'après les réceptions : {amount}", markSent: "Marquer comme commandé", cancelOrder: "Annuler le BC", deleteConfirm: "Supprimer ce brouillon ?", cancelledBecause: "Annulé", cancelReason: "Motif de l'annulation", cancelRequestsHint: "Les demandes d'achat de ce BC reviennent dans la file des achats.", ordered: "Commandé", received: "Reçu", returned: "Retourné", outstanding: "Reste à recevoir", kept: "Reçu et conservé", noStock: "hors stock (ligne libre)", receptions: "Réceptions et retours", receive: "Réceptionner", returnGoods: "Retour fournisseur", sendFirst: "Marquez le BC comme commandé avant de réceptionner.", receptionTitle: "Réceptionner la marchandise", returnTitle: "Retourner la marchandise au fournisseur", blNumber: "N° du bon de livraison (BL)", returnReference: "Référence du retour", scan: "Scan (facultatif)", file: "Fichier", stockInHint: "Les quantités reçues sont ajoutées à l'inventaire.", stockOutHint: "Les quantités retournées sont retirées de l'inventaire.", noReceptions: "Rien de réceptionné pour l'instant.", type: { reception: "Réception", return: "Retour" }, invoices: "Factures", addInvoice: "Ajouter une facture", invoiceNumber: "N° de facture", dueDate: "Échéance", amountTTC: "Montant TTC", noInvoices: "Aucune facture.", deleteInvoiceConfirm: "Supprimer cette facture ?", payments: "Paiements", addPayment: "Enregistrer un paiement", amount: "Montant", method: "Mode de paiement", paymentReference: "Référence", paymentReferencePlaceholder: "N° de chèque / virement", noPayments: "Aucun paiement.", deletePaymentConfirm: "Supprimer ce paiement ?", linkedRequests: "Demandes d'achat de ce BC" }, priceRequests: { noPricesHint: "Indiquez ce dont vous voulez le prix — c'est le fournisseur qui propose les prix dans sa réponse. Une ligne peut être un article de l'inventaire, ou simplement saisie pour un article que vous n'avez pas encore.", enterPricesHint: "Saisissez les prix de la réponse du fournisseur, puis créez le bon de commande — ou refusez-la.", title: "Demandes de prix", subtitle: "Demandez des devis aux fournisseurs, saisissez leurs prix, et transformez le meilleur en bon de commande.", new: "Nouvelle demande de prix", empty: "Aucune demande de prix.", deadline: "Réponse attendue le", quote: "Devis du fournisseur", uploadQuote: "Joindre le devis", markSent: "Marquer envoyée", markAnswered: "Marquer répondue", reject: "Refuser", convert: "Créer le bon de commande", deleteConfirm: "Supprimer cette demande de prix ?" }, suppliers: { title: "Fournisseurs", subtitle: "Vos fournisseurs et leurs coordonnées.", new: "Nouveau fournisseur", empty: "Aucun fournisseur.", search: "Rechercher", searchPlaceholder: "Nom, contact, ville, ICE…", active: "Actif", inactive: "Inactif", deleteConfirm: "Supprimer « {name} » ?", deactivated: "Ce fournisseur a des commandes : il a été désactivé au lieu d'être supprimé.", fields: { paymentDays: "Délai de paiement (jours)", name: "Raison sociale", contactName: "Contact", phone: "Téléphone", email: "E-mail", city: "Ville", address: "Adresse", ice: "ICE", identifiantFiscal: "Identifiant fiscal (IF)", rc: "Registre de commerce (RC)", paymentTerms: "Conditions de paiement" } }, history: { title: "Historique article", subtitle: "Tous les bons de commande et demandes d'un article de l'inventaire.", pickHint: "Choisissez un article pour voir son historique d'achat.", inStock: "En stock", orders: "Commandes", totalOrdered: "Total commandé", totalReceived: "Total reçu", averagePrice: "Prix moyen", lastPrice: "Dernier prix", noOrders: "Cet article ne figure sur aucun bon de commande.", noRequests: "Aucune demande d'achat pour cet article.", openForArticle: "Historique d'achat" } }, holidays: { title: "Jours fériés", subtitle: "Les jours fériés de l'année : l'entreprise travaille-t-elle, et comment les heures travaillées sont payées.", downloadTemplate: "Télécharger le modèle", import: "Importer Excel", add: "Ajouter un jour férié", year: "Année", howItWorks: "Chaque année : téléchargez le modèle (les fêtes à date fixe sont déjà remplies), ajoutez les fêtes religieuses avec leurs dates officielles, puis importez-le. Jour chômé : personne n'est attendu, et les heures de ceux qui pointent sont comptées en heures de jour férié. Paiement « double » : une heure supplémentaire payée par heure travaillée ; « normal » : aucune majoration.", importDone: "Import terminé : {created} ajouté(s), {updated} mis à jour.", namePlaceholder: "Nom du jour férié (ex. Aïd al-Fitr)", previewTitle: "Aperçu de {file}", previewErrors: "{count} ligne(s) à corriger — corrigez le fichier et importez-le à nouveau", previewReady: "{count} ligne(s) prêtes à importer", columns: { row: "Ligne", date: "Date", name: "Nom", open: "Entreprise", pay: "Paiement si travaillé", check: "Contrôle" }, defaultClosed: "Fermée (par défaut)", defaultDouble: "Double (par défaut)", open: "Ouverte", closed: "Fermée", payDouble: "Double", payNormal: "Normal", confirmImport: "Importer", emptyTitle: "Aucun jour férié pour {year}", emptyMessage: "Téléchargez le modèle, complétez-le et importez-le.", deleteTitle: "Supprimer le jour férié", deleteMessage: "Supprimer « {name} » ? Les pointages déjà enregistrés pour ce jour sont conservés.", errors: { load: "Impossible de charger les jours fériés.", save: "Impossible d'enregistrer cette modification.", template: "Impossible de télécharger le modèle.", read: "Impossible de lire ce fichier.", import: "L'import a échoué." } }, myDepartment: { adminTitle: "Accès par département", adminSubtitle: "Tous les départements que vous supervisez : leur responsable, les postes qui donnent accès au module et qui y a accès.", adminEmptyTitle: "Aucun département pour l'instant.", noManagerAssigned: "Aucun responsable désigné", title: "Mon département", subtitle: "Votre équipe, et les postes qui donnent accès au module du département.", loadError: "Impossible de charger votre département.", saveError: "Impossible d'enregistrer cette modification.", saved: "Enregistré.", accountsUpdated: "Enregistré — {count} compte(s) mis à jour.", emptyTitle: "Vous ne gérez encore aucun département.", positionsTitle: "Postes et accès", positionsHint: "Activez un poste pour donner à tous ses titulaires l'accès au module du département. Les autres ne voient que Mon espace.", noModule: "Ce département ne donne accès à aucun module : il n'y a pas d'accès à distribuer.", noPositions: "Aucun poste défini pour ce département.", holders: "{count} employé(s)", toggleLabel: "Donne accès au module", teamTitle: "Équipe", noEmployees: "Aucun employé dans ce département.", columns: { name: "Nom", jobTitle: "Poste", access: "Accès" }, noLogin: "Pas de compte", moduleAccess: "Accès module", mySpaceOnly: "Mon espace uniquement" },
  powered: "⬡ SANITY réalisé par: ",  
  sidebar: { logistics: "Logistique", toDeliver: "À livrer", deliveryNotes: "Bons de livraison", tracking: "Suivi des projets", workshops: "Ateliers", chassisCatalog: "Catalogue châssis", productionConfig: "Configuration production", sales: "Ventes", quotes: "Devis", salesInvoices: "Factures", receivables: "Encaissements", customers: "Clients", projects: "Projets", planning: "Planning", declarations: "Déclarations", leaveBalances: "Soldes de congés", platform: "Plateforme", clients: "Clients", purchasingReports: "Rapports achats", restock: "Réapprovisionnement", supplierInvoices: "Factures fournisseurs", purchasing: "Achats", purchaseRequestsQueue: "Demandes d'achat", purchaseOrders: "Bons de commande", priceRequests: "Demandes de prix", suppliers: "Fournisseurs", purchasingInventory: "Inventaire", articleHistory: "Historique article", holidays: "Jours fériés", departmentAccess: "Accès par département", myDepartment: "Mon département", myRecords: "Mon dossier",
      leaveCalendar: "Calendrier des congés",
      performanceReviews: "Évaluations",
      disciplinaryActions: "Actions disciplinaires",
      admin: "Admin",
      settings: "Paramètres",
      help: "Aide & Support",
      profile: "Profil",
      hr: "Ressources humaines",

      companies: "Entreprises",
      organization: "Organisation",
      company: "Entreprise",
      employees: "Employés",
      payroll: "Paie",
      contracts: "Contrats",
      employeeDocuments: "Documents",
      attendance: "Présence",
      orgChart: "Organigramme",
      reports: "Rapports",
      auditLog: "Journal d'audit",
      mySpace: "Mon espace",
      myProfile: "Mon profil",
      myPayslips: "Mes bulletins de paie",
      myAbsences: "Mes absences",
      myAdvances: "Mes avances",
      myAttendance: "Ma présence",
      salaries: "Salaires",
      absences: "Absences",
      advances: "Avances",
      users: "Utilisateurs",
      workSchedule: "Horaires de travail",
      production: "Production",
      inventory: "Inventaire",
      purchaseRequests: "Demandes d'achat",
      inventorySettings: "Paramètres",
      departments: "Départements",
      jobPositions: "Postes",
      rolesPermissions: "Rôles & Permissions",
      locations: "Emplacements",
      documents: "Documents",
      preferences: "Préférences",
      integrations: "Intégrations",

      dark: "Sombre",
      light: "Clair",

      logout: "Déconnexion",

      closeSidebar:
        "Fermer la barre latérale",

      openSidebar:
        "Ouvrir la barre latérale",

      switchTheme:
        "Passer au mode {theme}",

      dashboard:
        "Tableau de bord",
    },

    common: { yes: "Oui", no: "Non", home: "Accueil", breadcrumb: "Fil d'Ariane", clear: "Effacer", clearSearch: "Effacer la recherche", nextPage: "Page suivante", previousPage: "Page précédente", pagination: "Pagination", hidePassword: "Masquer le mot de passe", showPassword: "Afficher le mot de passe", somethingWentWrong: "Une erreur est survenue", confirmAction: "Confirmer l'action", pageNotFoundHint: "Cette page n'existe pas ou a été déplacée.", pageNotFound: "Page introuvable", status: "Statut", save: "Enregistrer", back: "Retour",
      welcome: "Bienvenue",
      goodbye: "Au revoir",

      loading: "Chargement...",

      error: "Erreur",
      fail: "Échec",
      success: "Succès",

      update: "Modifier",
      cancel: "Annuler",
      delete: "Supprimer",
      confirm: "Confirmer",
      close: "Fermer",
      edit: "Modifier",
      reset: "Réinitialiser",
      create: "Créer",
      noResults: "Aucun résultat trouvé",
      chooseFile: "Choisir un fichier",
      noFileChosen: "Aucun fichier choisi",
      dateFrom: "Du",
      dateTo: "Au",
    },

    profile: { loadFailed: "Impossible de charger le profil",
      settings: "Paramètres",

      firstName: "Prénom",
      lastName: "Nom",
      email: "E-mail",
      password: "Mot de passe",

      currentPassword:
        "Mot de passe actuel",

      newPassword:
        "Nouveau mot de passe",

      updateSureMessage:
        "Voulez-vous vraiment modifier votre profil ?",

      updateFailMessage:
        "Impossible de modifier votre profil. Veuillez réessayer.",

      updateSuccessMessage:
        "Votre profil a été modifié avec succès.",

      bothPasswords:
        "Le mot de passe actuel et le nouveau mot de passe sont requis.",

      info:
        "Informations",
    },

    company: { workflow: { accountInvalid: "Un compte comptable comporte 4 à 10 chiffres.", purchaseAccountHint: "Utilisé dans l'export comptable pour les articles dont la catégorie n'a pas de compte, et pour les lignes saisies (ex. 6111, 6121, 6125).", purchaseAccount: "Compte d'achat par défaut", purchaseThresholdHint: "Les BC d'un montant TTC supérieur ou égal doivent être approuvés par un admin, le propriétaire ou le responsable des achats avant d'être commandés. 0 = pas d'approbation.", purchaseThreshold: "Seuil d'approbation des bons de commande", title: "Circuit de validation", sequentialApproval: "Validation du manager avant les RH", sequentialApprovalHint: "Si activé, les demandes d'absence et d'avance doivent d'abord être validées par le manager de l'employé, puis recevoir la validation finale des RH. Les employés sans manager passent directement par les RH.", saveFailed: "Impossible d'enregistrer ce paramètre." },
      title:
        "Entreprise",

      subtitle:
        "Gérez les informations de votre entreprise",

      emptySubtitle:
        "Aucune entreprise configurée",

      emptyTitle:
        "Aucune entreprise",

      emptyMessage:
        "Configurez le profil de votre entreprise pour commencer.",

      create:
        "Créer l'entreprise",

      editTitle:
        "Modifier l'entreprise",

      name:
        "Nom de l'entreprise",

      tradeName:
        "Nom commercial",

      legalForm:
        "Forme juridique",

      industry:
        "Secteur d'activité",

      ice:
        "ICE",

      taxId:
        "Identifiant fiscal",

      registrationNumber:
        "Registre de commerce",

      email:
        "E-mail",

      phone:
        "Téléphone",

      website:
        "Site web",

      street:
        "Rue",

      city:
        "Ville",

      postalCode:
        "Code postal",

      logo:
        "Logo de l'entreprise",

      employeeCount:
        "Employés",

      section: {
        identity:
          "Identité",

        legal:
          "Informations légales",

        contact:
          "Contact",
      },

      createTitle:
        "Créer l'entreprise",

      createSureMessage:
        "Voulez-vous vraiment créer cette entreprise ?",

      createSuccessTitle:
        "Entreprise créée",

      createSuccessMessage:
        "L'entreprise a été créée avec succès.",

      createFailTitle:
        "Échec de la création",

      updateSureMessage:
        "Voulez-vous vraiment enregistrer ces modifications ?",

      updateSuccessMessage:
        "L'entreprise a été mise à jour avec succès.",

      saveFailMessage:
        "Une erreur est survenue lors de l'enregistrement de l'entreprise.",

      loadFailTitle:
        "Échec du chargement",

      loadFailMessage:
        "Impossible de charger les informations de l'entreprise.",

      downloadFiche:
        "Télécharger la fiche",

      deleteCompany:
        "Supprimer l'entreprise",

      deleteTitle:
        "Supprimer l'entreprise",

      deleteSureMessage:
        "Voulez-vous vraiment supprimer cette entreprise ? Cette action est irréversible.",

      deleteSuccessTitle:
        "Entreprise supprimée",

      deleteSuccessMessage:
        "L'entreprise a été supprimée avec succès.",

      deleteFailTitle:
        "Échec de la suppression",

      deleteFailMessage:
        "Une erreur est survenue lors de la suppression de l'entreprise.",

      errors: {
        deleteAdminOnly:
          "Seuls les administrateurs ou le propriétaire de l'entreprise peuvent supprimer cette entreprise.",

        notFound:
          "Entreprise introuvable.",

        deleteNotAuthorized:
          "Vous n'êtes pas autorisé à supprimer cette entreprise.",

        updateNotAuthorized:
          "Vous n'êtes pas autorisé à modifier cette entreprise.",

        viewNotAuthorized:
          "Vous n'êtes pas autorisé à consulter cette entreprise.",

        ficheDownloadFailed:
          "Erreur lors de la génération de la fiche de l'entreprise.",

        duplicateCompany:
          "Une entreprise avec cet ICE, identifiant fiscal, numéro d'immatriculation ou numéro CNSS existe déjà.",

        createFailed:
          "Erreur lors de la création de l'entreprise.",

        updateFailed:
          "Erreur lors de la modification de l'entreprise.",

        deleteFailed:
          "Erreur lors de la suppression de l'entreprise.",

        logoNotFound:
          "Logo de l'entreprise introuvable.",

        logoRequired:
          "Veuillez sélectionner un logo.",

        logoUploadFailed:
          "Erreur lors du téléchargement du logo.",

        logoDeleteFailed:
          "Erreur lors de la suppression du logo.",
      },
    },

    users: {
      title:
        "Utilisateurs",

      subtitle:
        "Gérez les comptes utilisateurs et leurs accès.",

      addUser:
        "Ajouter un utilisateur",

      newUser:
        "Nouvel utilisateur",

      createSubtitle:
        "Créer un nouveau compte utilisateur.",

      information:
        "Informations utilisateur",

      role:
        "Rôle",

      status:
        "Statut",

      userId:
        "ID utilisateur",

      roles: {
        admin:
          "Administrateur",

        owner:
          "Propriétaire",

        user:
          "Utilisateur",
      },

      statuses: {
        active:
          "Actif",

        inactive:
          "Inactif",

        suspended:
          "Suspendu",
      },

      emptyTitle:
        "Aucun utilisateur",

      emptyMessage:
        "Il n'y a actuellement aucun utilisateur dans votre organisation.",

      backToUsers:
        "Utilisateurs",

      createTitle:
        "Créer un utilisateur",

      createSureMessage:
        "Voulez-vous vraiment créer cet utilisateur ?",

      createSuccessTitle:
        "Utilisateur créé",

      createSuccessMessage:
        "L'utilisateur a été créé avec succès.",

      createFailTitle:
        "Échec de la création",

      createFailMessage:
        "Impossible de créer l'utilisateur.",

      loadFailTitle:
        "Échec du chargement",

      loadFailMessage:
        "Impossible de charger les utilisateurs. Veuillez réessayer.",

      deleteUser:
        "Supprimer l'utilisateur",

      deleteTitle:
        "Supprimer l'utilisateur",

      deleteSureMessage:
        "Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.",

      deleteSuccessTitle:
        "Utilisateur supprimé",

      deleteSuccessMessage:
        "L'utilisateur a été supprimé avec succès.",

      deleteFailTitle:
        "Échec de la suppression",

      deleteFailMessage:
        "Une erreur est survenue lors de la suppression de l'utilisateur.",

      errors: {
        deleteAdminOnly:
          "Seuls les administrateurs peuvent supprimer des utilisateurs.",

        notFound:
          "Utilisateur introuvable.",

        updateNotAuthorized:
          "Vous n'êtes pas autorisé à modifier cet utilisateur.",

        passwordNotAuthorized:
          "Vous n'êtes pas autorisé à modifier ce mot de passe.",

        requiredCreateFields:
          "Veuillez fournir le prénom, le nom, l'e-mail et le mot de passe.",

        requiredUpdateFields:
          "Veuillez fournir le prénom, le nom et l'e-mail.",

        requiredPasswordFields:
          "Veuillez fournir le mot de passe actuel et le nouveau mot de passe.",

        emailExists:
          "Un utilisateur avec cet e-mail existe déjà.",

        currentPasswordIncorrect:
          "Le mot de passe actuel est incorrect.",
      },

      editUser: "Modifier l'utilisateur",
      editSubtitle: "Mettez à jour les informations du compte de cet utilisateur.",
      inheritedFromEmployee: "Le département et le rôle RH sont hérités de l'employé lié {name} ({department} — {jobTitle}). Pour les modifier, mettez à jour le Département ou le Poste de l'employé.",

      updateTitle: "Modifier l'utilisateur",
      updateSureMessage: "Voulez-vous vraiment enregistrer ces modifications ?",

      updateSuccessTitle: "Utilisateur mis à jour",
      updateSuccessMessage: "L'utilisateur a été mis à jour avec succès.",

      updateFailTitle: "Échec de la mise à jour",
      updateFailMessage: "Impossible de mettre à jour l'utilisateur. Veuillez réessayer.",

      hrRole: {
        label: "Poste RH",
        notApplicable: "Non applicable (hors RH)",
        assistant: "Assistant(e) RH",
        officer: "Chargé(e) RH",
        manager: "Responsable RH",
        director: "Directeur/Directrice RH",
      },

      department: "Département",
      departments: {
          management: "Direction",
          hr: "Ressources humaines",
          finance: "Finance",
          accounting: "Comptabilité",
          sales: "Ventes",
          purchasing: "Achats",
          marketing: "Marketing",
          production: "Production",
          production_planning: "Planification de la production",
          quality_control: "Contrôle qualité",
          maintenance: "Maintenance",
          warehouse: "Entrepôt",
          logistics: "Logistique",
          procurement: "Approvisionnement",
          engineering: "Ingénierie",
          design: "Conception",
          research_development: "Recherche & Développement",
          it: "Informatique",
          customer_service: "Service client",
          administration: "Administration",
          health_safety_environment: "Hygiène, sécurité & environnement",
          security: "Sécurité",
      },

      emptySearchTitle: "Aucun résultat",
      emptySearchMessage: "Aucun utilisateur ne correspond à votre recherche.",

      toolbar: {
        searchPlaceholder: "Rechercher des utilisateurs...",
      },
    },
    employees: {
      title: "Employés",
      subtitle: "Gérez les employés de votre entreprise et leurs informations RH.",
      addEmployee: "Ajouter un employé",
      backToEmployees: "Retour aux employés",
      editEmployee: "Modifier l'employé",
      newEmployee: "Nouvel employé",
      employeeInformation: "Informations de l'employé",
      loadFailTitle: "Impossible de charger les employés",
      loadFailMessage: "Une erreur est survenue lors du chargement des employés. Veuillez réessayer.",
      loadCompaniesFailMessage: "Une erreur est survenue lors du chargement des entreprises. Veuillez réessayer.",

      createTitle: "Ajouter un employé",
      createSureMessage: "Voulez-vous vraiment créer cet employé ?",
      createSuccessTitle: "Employé créé",
      createSuccessMessage: "L'employé a été créé avec succès.",
      createFailTitle: "Impossible de créer l'employé",
      createFailMessage: "Une erreur est survenue lors de la création de l'employé.",

      updateTitle: "Modifier l'employé",
      updateSureMessage: "Voulez-vous vraiment enregistrer ces modifications ?",
      updateSuccessTitle: "Employé mis à jour",
      updateSuccessMessage: "L'employé a été mis à jour avec succès.",
      updateFailTitle: "Impossible de mettre à jour l'employé",
      updateFailMessage: "Une erreur est survenue lors de la mise à jour de l'employé.",

      deleteTitle: "Supprimer l'employé",
      deleteSureMessage: "Voulez-vous vraiment supprimer {name} ? Cette action est irréversible.",
      deleteSuccessTitle: "Employé supprimé",
      deleteSuccessMessage: "L'employé a été supprimé.",
      deleteFailTitle: "Impossible de supprimer l'employé",
      deleteFailMessage: "Une erreur est survenue lors de la suppression de l'employé.",

      selectCompanyRequired: "Veuillez sélectionner une entreprise.",
      invalidPhotoType: "Veuillez sélectionner un fichier image.",

      toolbar: {
        company: "Entreprise",
        selectCompany: "Sélectionner une entreprise",
        loadingCompanies: "Chargement des entreprises...",
        searchPlaceholder: "Rechercher des employés...",
      },

      companyInfo: {
        employeeCount_one: "{count} employé",
        employeeCount_other: "{count} employés",
      },

      emptyNoCompany: {
        title: "Aucune entreprise trouvée",
        message: "Créez d'abord une entreprise avant d'ajouter des employés.",
      },

      emptyNoEmployees: {
        title: "Aucun employé trouvé",
        messageSearch: "Aucun employé ne correspond à votre recherche.",
        messageDefault: "Cette entreprise n'a pas encore d'employés.",
        cta: "Ajouter un employé",
      },

      loading: "Chargement des employés...",

      photo: {
        label: "Photo de l'employé",
        choose: "Choisir une photo",
        change: "Changer la photo",
        remove: "Supprimer",
      },

      company: {
        label: "Entreprise",
        selectPlaceholder: "Sélectionner une entreprise",
        unnamed: "Entreprise sans nom",
      },

      sections: {
        personalInformation: "Informations personnelles",
        contactInformation: "Coordonnées",
        employment: "Emploi",
        identification: "Identification",
        company: "Entreprise",
        notes: "Notes",
      },

      documents: {
        menuButton: "Documents",
        attestationTravail: "Attestation de travail",
        attestationSalaire: "Attestation de salaire",
        certificatTravail: "Certificat de travail",
        contratTravail: "Contrat de travail",
        soldeToutCompte: "Reçu pour solde de tout compte",
        generationFailed: "Erreur lors de la génération du document.",
      },

      bulkImport: {
        exportButton: "Exporter (CSV)",
        exportFailed: "Impossible d'exporter les employés.",
        openButton: "Importer (CSV)",
        title: "Importer des employés en masse",
        helpText: "Téléversez un fichier CSV pour créer plusieurs employés à la fois. Chaque ligne est d'abord vérifiée — rien n'est créé avant votre confirmation.",
        downloadTemplate: "Télécharger le modèle CSV",
        preview: "Vérifier le fichier",
        previewing: "Vérification...",
        previewFailed: "Impossible de lire ce fichier.",
        summaryValid: "{count} prêt(s) à importer",
        summaryErrors: "{count} avec des erreurs",
        summaryWarnings: "{count} avec des avertissements",
        rowOk: "Tout est correct",
        fixErrorsFirst: "Corrigez les lignes en erreur et retéléversez le fichier avant d'importer — les lignes avec seulement des avertissements seront quand même importées.",
        importButton: "Importer {count} employé(s)",
        committing: "Importation...",
        commitFailed: "Impossible de terminer l'importation.",
        commitSuccess: "{count} employé(s) importé(s) avec succès.",
      },

      fields: { manager: "Responsable (N+1)", noManagerCandidates: "Aucun autre employé dans cette entreprise",
        employeeNumber: "Matricule",
        employeeNumberPlaceholder: "EMP-001",

        firstName: "Prénom",
        firstNamePlaceholder: "Prénom",

        lastName: "Nom",
        lastNamePlaceholder: "Nom",

        firstNameArabic: "Prénom (arabe)",
        firstNameArabicPlaceholder: "الاسم الأول",

        lastNameArabic: "Nom (arabe)",
        lastNameArabicPlaceholder: "اسم العائلة",

        gender: "Genre",
        genderPlaceholder: "Sélectionner le genre",

        dateOfBirth: "Date de naissance",

        placeOfBirth: "Lieu de naissance",
        placeOfBirthPlaceholder: "Ville",

        nationality: "Nationalité",
        nationalityPlaceholder: "Marocaine",

        maritalStatus: "Situation familiale",
        maritalStatusPlaceholder: "Sélectionner un statut",

        numberOfDependents: "Personnes à charge",

        cin: "CIN",
        cinPlaceholder: "AB123456",

        passportNumber: "Numéro de passeport",
        passportNumberPlaceholder: "Numéro de passeport",

        passportExpiryDate: "Expiration du passeport",

        workPermitNumber: "Numéro de permis de travail",
        workPermitNumberPlaceholder: "Numéro de permis",

        workPermitExpiryDate: "Expiration du permis de travail",

        personalEmail: "E-mail personnel",
        personalEmailPlaceholder: "personnel@email.com",

        workEmail: "E-mail professionnel",
        workEmailPlaceholder: "employe@entreprise.com",

        phone: "Téléphone",
        phonePlaceholder: "+212...",

        secondaryPhone: "Téléphone secondaire",
        secondaryPhonePlaceholder: "+212...",

        street: "Rue",
        streetPlaceholder: "Adresse",

        city: "Ville",
        cityPlaceholder: "Ville",

        region: "Région",
        regionPlaceholder: "Région",

        postalCode: "Code postal",
        postalCodePlaceholder: "40000",

        country: "Pays",
        countryPlaceholder: "Maroc",

        emergencyName: "Contact d'urgence",
        emergencyNamePlaceholder: "Nom complet",

        emergencyRelationship: "Lien de parenté",
        emergencyRelationshipPlaceholder: "Conjoint, parent...",

        emergencyPhone: "Téléphone d'urgence",
        emergencyPhonePlaceholder: "+212...",

        emergencyEmail: "E-mail d'urgence",
        emergencyEmailPlaceholder: "email@exemple.com",

        hireDate: "Date d'embauche",
        terminationDate: "Date de fin de contrat",

        employmentStatus: "Statut d'emploi",
        employmentStatusPlaceholder: "Sélectionner un statut",

        employmentType: "Type de contrat",
        employmentTypePlaceholder: "Sélectionner un type",

        jobTitle: "Intitulé du poste",
        jobTitlePlaceholder: "Responsable de production",

        department: "Département",
        departmentPlaceholder: "Production",
        noDepartments: "Aucun département défini pour l'instant — ajoutez-en un depuis Organisation > Départements",

        service: "Service",
        servicePlaceholder: "Assemblage",

        position: "Poste",
        positionPlaceholder: "Opérateur",

        workLocation: "Lieu de travail",
        workLocationPlaceholder: "Usine",

        cnssNumber: "Numéro CNSS",
        cnssNumberPlaceholder: "Numéro CNSS",

        cnssRegistrationDate: "Date d'immatriculation CNSS",

        taxIdentificationNumber: "Identifiant fiscal",
        taxIdentificationNumberPlaceholder: "Identifiant fiscal",

        taxStatus: "Statut fiscal",
        taxStatusPlaceholder: "Statut fiscal",

        numberOfChildren: "Nombre d'enfants",

        spouseWorking: "Conjoint actif",
        spouseWorkingCheckboxLabel: "Le conjoint travaille actuellement",

        bankName: "Nom de la banque",
        bankNamePlaceholder: "Banque",

        accountName: "Titulaire du compte",
        accountNamePlaceholder: "Titulaire du compte",

        rib: "RIB",
        ribPlaceholder: "RIB",

        iban: "IBAN",
        ibanPlaceholder: "IBAN",

        paymentMethod: "Mode de paiement",
        paymentMethodPlaceholder: "Sélectionner un mode",

        notes: "Notes",
        notesPlaceholder: "Notes complémentaires...",

        isActive: "Actif",
        isActiveCheckboxLabel: "L'employé est actif",
        createLogin: "Accès self-service",
        createLoginCheckboxLabel: "Créer aussi un accès self-service pour cet employé (utilise son e-mail professionnel)",
      },

      genders: {
        male: "Homme",
        female: "Femme",
        other: "Autre",
      },

      maritalStatuses: {
        single: "Célibataire",
        married: "Marié(e)",
        divorced: "Divorcé(e)",
        widowed: "Veuf/Veuve",
        other: "Autre",
      },

      taxStatus: {
        taxable: "Imposable",
        nonTaxable: "Non imposable",
        exempt: "Exonéré",
      },

      statuses: {
        active: "Actif",
        inactive: "Inactif",
        on_leave: "En congé",
        suspended: "Suspendu",
        terminated: "Fin de contrat",
        unknown: "Inconnu",
      },

      employmentTypes: {
        permanent: "CDI",
        fixed_term: "CDD",
        temporary: "Temporaire",
        intern: "Stagiaire",
        apprentice: "Apprenti",
        freelance: "Freelance",
        part_time: "Temps partiel",
        other: "Autre",
      },

      paymentMethods: {
        bank_transfer: "Virement bancaire",
        cash: "Espèces",
        check: "Chèque",
      },

      card: {
        view: "Voir",
        edit: "Modifier",
      },

      detail: {
        employeeLabel: "Employé",
        firstName: "Prénom",
        lastName: "Nom",
        gender: "Genre",
        dateOfBirth: "Date de naissance",
        nationality: "Nationalité",
        maritalStatus: "Situation familiale",
        phone: "Téléphone",
        email: "E-mail",
        address: "Adresse",
        jobTitle: "Intitulé du poste",
        department: "Département",
        employmentType: "Type de contrat",
        hireDate: "Date d'embauche",
        workLocation: "Lieu de travail",
        service: "Service",
        cin: "CIN",
        passport: "Passeport",
        cnssNumber: "Numéro CNSS",
        taxId: "Identifiant fiscal",
        empty: "—",
      },

      buttons: {
        save: "Enregistrement...",
        createEmployee: "Créer l'employé",
        updateEmployee: "Mettre à jour l'employé",
        cancel: "Annuler",
      },

      breadcrumbs: {
        hr: "RH",
        employees: "Employés",
        addEmployee: "Ajouter un employé",
        editEmployee: "Modifier l'employé",
      },

      errors: {
        companyRequired: "Veuillez sélectionner une entreprise.",
        invalidPhoto: "Veuillez sélectionner un fichier image.",
        fetchCompaniesFailed: "Échec du chargement des entreprises",
        fetchEmployeesFailed: "Échec du chargement des employés",
        createFailed: "Échec de la création de l'employé",
        updateFailed: "Échec de la mise à jour de l'employé",
        deleteFailed: "Échec de la suppression de l'employé",
        notFound: "Employé introuvable",
        duplicateEmployeeNumber: "Un employé avec ce matricule existe déjà",
        requiredFields: "Veuillez renseigner tous les champs obligatoires",
      },

      linkedUser: {
        title: "Accès self-service",
        linkedTo: "Lié à :",
        link: "Lier",
        unlink: "Délier",
        linkTitle: "Lier un compte utilisateur",
        linkSureMessage: "Lier ce compte utilisateur à cet employé ? Il aura accès à Mon espace (bulletins de paie, demandes d'absence/avance, présence).",
        unlinkTitle: "Délier le compte utilisateur",
        unlinkSureMessage: "Délier ce compte utilisateur de cet employé ? Il perdra l'accès à Mon espace.",
        searchPlaceholder: "Rechercher des utilisateurs par nom ou e-mail...",
        actionFailed: "Une erreur est survenue. Veuillez réessayer.",
        orCreateNew: "ou",
        createLogin: "Créer un nouvel accès",
        createLoginTitle: "Créer un accès",
        createLoginSureMessage: "Créer un nouvel accès self-service pour cet employé ? Un mot de passe temporaire sera généré et affiché une seule fois — pensez à le noter.",
        loginCreatedTitle: "Accès créé",
        loginCreatedMessage: "E-mail : {email}\nMot de passe temporaire : {password}\n\nPartagez-le avec l'employé — il ne sera plus affiché ensuite. Il devra le changer après sa première connexion (depuis sa page Profil).",
        loginNotCreatedTitle: "Employé créé, mais pas encore d'accès",
        resetPassword: "Réinitialiser le mot de passe",
        resetPasswordTitle: "Réinitialiser le mot de passe",
        resetPasswordSureMessage: "Générer un nouveau mot de passe temporaire pour le compte de cet employé ? Son mot de passe actuel cessera de fonctionner immédiatement.",
      },

      related: {
        empty: "Rien à afficher pour le moment.",
        tabs: {
          salary: "Salaire",
          absences: "Absences",
          advances: "Avances",
          contracts: "Contrats",
          documents: "Documents",
          attendance: "Présence",
        },
      },
    },
    workSchedule: { shiftType: "Type d'horaire", continuous: "Journée continue", split: "Journée coupée (pause de midi)", continuousHint: "Les employés pointent une fois à l'arrivée et une fois au départ, ex. 09:00 → 16:00. Tout temps travaillé au-delà des heures prévues compte en heures supplémentaires.", splitHint: "Les employés pointent deux fois à l'arrivée et deux fois au départ, ex. 08:00 → 12:00 et 14:00 → 18:00. La pause de midi n'est pas comptée ; les heures supplémentaires sont calculées au-delà des heures prévues, et le retard est vérifié aux deux arrivées.", morningIn: "Arrivée", middayOut: "Sortie midi", middayIn: "Retour midi", finalOut: "Départ", scheduledHours: "Heures", applyToAll: "Copier les horaires de ce jour sur tous les jours travaillés", applyToAllShort: "Appliquer à tous", invalidTimes: "les heures doivent se suivre (arrivée, sortie midi, retour midi, puis départ).", invalidShort: "Vérifier les heures",
      title: "Horaires de travail",
      subtitle: "Définissez les heures d'arrivée attendues, les heures de travail et les tolérances par jour — utilisées pour calculer les retards et les heures supplémentaires.",
      fields: { day: "Jour", workingDay: "Jour travaillé", startTime: "Heure de début", workHours: "Heures de travail", grace: "Tolérance (min)" },
      days: {
        monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi",
        friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche",
      },
      working: "Jour travaillé",
      dayOff: "Jour de repos",
      hoursUnit: "h",
      minutesUnit: "min",
      footnote: "Pointer après l'heure de début plus la tolérance marque la journée comme « en retard ». Les heures supplémentaires correspondent à tout ce qui est travaillé au-delà des heures configurées.",
      savedTitle: "Horaires enregistrés",
      savedMessage: "Les horaires de travail ont été mis à jour avec succès.",
      saveFailed: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
      hoursManagement: {
        title: "Gestion des heures",
        subtitle: "Contrôlez comment la présence affecte la paie — chaque option ci-dessous est indépendante.",
        payOvertime: "Payer les heures supplémentaires",
        payOvertimeHint: "Ajoute une rémunération pour les heures travaillées au-delà des heures prévues.",
        deductLateArrival: "Déduire pour retard",
        deductLateArrivalHint: "Réduit la rémunération pour le temps perdu à cause des retards.",
        deductEarlyLeave: "Déduire pour départ anticipé",
        deductEarlyLeaveHint: "Réduit la rémunération pour le temps perdu en partant avant l'heure de fin prévue.",
        deductionRate: "Taux de déduction",
        deductionRateHint: "Multiplicateur appliqué au taux horaire pour les déductions de retard/départ anticipé — 1× correspond à une déduction directe du temps non travaillé.",
        monthlyStandardHours: "Heures mensuelles standard",
        monthlyStandardHoursHint: "Utilisé pour calculer le taux horaire à partir du salaire de base (salaire de base ÷ ce nombre).",
        rateSuffix: "×",
      },
    },


    production: {
      title: "Production",
    },

    inventory: {
      title: "Inventaire",
      subtitle: "Suivez le stock, les seuils et les prix fournisseurs.",
      addProduct: "Ajouter un produit",
      editProduct: "Modifier le produit",
      searchPlaceholder: "Rechercher par nom ou référence...",
      lowStockOnly: "Stock faible uniquement",
      lowStock: "Stock faible",
      asOfDate: "À la date du",
      viewingAsOf: "Affichage de l'inventaire au {date}.",
      deleteTitle: "Supprimer le produit",
      deleteSureMessage: "Voulez-vous vraiment supprimer ce produit ? Son historique de mouvements sera également supprimé. Cette action est irréversible.",
      emptyTitle: "Aucun produit",
      emptyMessage: "Ajoutez votre premier produit pour commencer à suivre l'inventaire.",
      purchaseRequestSuccess: "Demande d'achat soumise avec succès.",
      fields: {
        category: "Rubrique", selectCategory: "Sélectionner une rubrique", name: "Nom",
        internalReference: "Référence interne", quantity: "Quantité", unit: "Unité",
        threshold: "Seuil", sellingPrice: "Prix de vente", image: "Image",
        prices: "Prix fournisseurs", supplierName: "Fournisseur", price: "Prix",
        supplierReference: "Référence fournisseur", reason: "Motif", notes: "Notes",
        search: "Recherche", orderedQuantity: "Quantité commandée",
      },
      actions: {
        add: "Ajouter au stock", remove: "Retirer du stock", requestPurchase: "Demander l'achat",
        submitRequest: "Envoyer la demande",
      },
      errors: {
        fetchFailed: "Échec du chargement de l'inventaire", saveFailed: "Une erreur est survenue lors de l'enregistrement.",
        deleteFailed: "Une erreur est survenue lors de la suppression.", adjustFailed: "Une erreur est survenue lors de la mise à jour de la quantité.",
        missingFields: "Veuillez renseigner la rubrique, le nom et la référence interne.",
        invalidQuantity: "Veuillez saisir une quantité valide.", purchaseRequestFailed: "Une erreur est survenue lors de l'envoi de la demande.",
      },
    },

    inventorySettings: {
      title: "Paramètres de l'inventaire",
      subtitle: "Définissez les rubriques utilisées dans votre inventaire.",
      addCategory: "Ajouter une rubrique",
      editCategory: "Modifier la rubrique",
      deleteTitle: "Supprimer la rubrique",
      deleteSureMessage: "Voulez-vous vraiment supprimer cette rubrique ? Les produits qui l'utilisent encore doivent d'abord être réaffectés ou supprimés.",
      emptyTitle: "Aucune rubrique",
      emptyMessage: "Ajoutez votre première rubrique d'inventaire (ex. « Matière première », « Produit fini »).",
      fields: { fixedAssetOff: "Non — TVA en 34552", fixedAssetOn: "Oui — TVA en 34551", fixedAsset: "Immobilisation", accountingAccountHint: "Compte des achats de cette catégorie dans l'export comptable — ex. 6121 matières premières, 6122 matières consommables, 2332 matériel. Vide : compte par défaut de l'entreprise.", accountingAccount: "Compte comptable (achats)",
        name: "Nom", namePlaceholder: "ex. Matière première",
        icon: "Icône", description: "Description", descriptionPlaceholder: "Facultatif",
      },
      errors: {
        nameRequired: "Le nom de la rubrique est requis", saveFailed: "Une erreur est survenue lors de l'enregistrement.",
        deleteFailed: "Une erreur est survenue lors de la suppression.",
      },
    },

    purchaseRequests: {
      title: "Demandes d'achat",
      subtitle: "Les demandes de réapprovisionnement envoyées aux Achats, et leur réponse.",
      emptyTitle: "Aucune demande d'achat",
      emptyMessage: "Aucune demande d'achat ne correspond à vos filtres.",
      markReceived: "Marquer comme reçue",
      fields: { product: "Produit", quantity: "Quantité", requestedBy: "Demandé par" },
      status: { received: "Reçue" },
    },

    departments: { noManagerBadge: "Sans responsable", managerLabel: "Responsable", moduleAccessBadge: "Accès module",
      title: "Départements",
      subtitle: "Définissez les départements de votre organisation et les postes qui les composent.",
      addDepartment: "Ajouter un département",
      addDefaults: "Ajouter des départements par défaut",
      defaultsModal: {
        title: "Ajouter des départements par défaut",
        helpText: "Choisissez les départements à ajouter — chacun est créé avec un nom, une description standard et (pour RH/Production) l'accès au module déjà défini. Vous pourrez toujours les modifier ou en ajouter d'autres ensuite.",
        adding: "Ajout en cours...",
        addButton: "Ajouter {count} département(s)",
      },
      editDepartment: "Modifier le département",
      addPosition: "Ajouter un poste",
      editPosition: "Modifier le poste",
      deleteTitle: "Supprimer le département",
      deleteSureMessage: "Voulez-vous vraiment supprimer ce département ? Les employés et postes qui l'utilisent encore doivent d'abord être réaffectés.",
      deletePositionTitle: "Supprimer le poste",
      deletePositionSureMessage: "Voulez-vous vraiment supprimer ce poste ? Les employés qui l'occupent encore, ou les autres postes qui lui sont rattachés, doivent d'abord être réaffectés.",
      emptyTitle: "Aucun département",
      emptyMessage: "Ajoutez votre premier département pour commencer à structurer votre organisation.",
      searchPlaceholder: "Rechercher un département...",
      noSearchResults: "Aucun département ne correspond à votre recherche.",
      noPositions: "Aucun poste défini dans ce département pour l'instant.",
      fields: { salesAccess: "Accès au module Ventes (devis, factures)", logisticsAccess: "Accès au module Logistique (livraisons, suivi)", purchasingAccess: "Accès au module Achats", manager: "Responsable du département", noManager: "Aucun responsable", managerHint: "Supervise tout le département : accès complet au module, valide les demandes de l'équipe et décide quels postes donnent accès au module.", grantsModuleAccess: "Donne accès au module", grantsModuleAccessHint: "Les titulaires de ce poste accèdent au module du département (ex. RH ou Inventaire). Laissez désactivé pour le personnel qui ne doit voir que Mon espace.",
        name: "Nom", description: "Description", permissionKey: "Accès au module",
        permissionKeyHint: "Facultatif — à définir sur UN SEUL département si les employés qui y travaillent (et leurs accès créés automatiquement) doivent avoir accès au module RH ou Production. La plupart des départements doivent rester sur « Aucun accès spécial ».",
        category: "Fonction",
        noCategory: "Aucune fonction spécifique",
        categoryHint: "Facultatif — permet au formulaire employé de suggérer des intitulés de poste standard pour ce département au lieu de laisser un champ libre. Une simple suggestion, sans lien avec les accès contrairement au champ Accès au module ci-dessus.",
        noSpecialAccess: "Aucun accès spécial", hrAccess: "Accès au module RH", productionAccess: "Accès au module Production",
        positionTitle: "Intitulé du poste", reportsTo: "Rattaché à", noReportsTo: "Aucun (poste de tête)",
        salaryMin: "Salaire — min", salaryMax: "Salaire — max", salaryBand: "Fourchette salariale",
        requiredSkills: "Compétences requises", requiredSkillsPlaceholder: "Séparées par des virgules, ex. Excel, Leadership",
      },
      errors: {
        nameRequired: "Le nom du département est requis", titleRequired: "L'intitulé du poste est requis",
        saveFailed: "Une erreur est survenue lors de l'enregistrement.", deleteFailed: "Une erreur est survenue lors de la suppression.",
      },
    },

    salaries: {
      title: "Salaires",
      subtitle: "Gérez la rémunération et l'historique salarial des employés.",
      addSalary: "Ajouter un salaire",
      giveRaise: "Donner une augmentation",

      createTitle: "Nouvel enregistrement salarial",
      createSureMessage: "Voulez-vous vraiment enregistrer ce salaire ? Le salaire actuel de cet employé sera clôturé à cette date d'effet.",
      createSuccessTitle: "Salaire enregistré",
      createSuccessMessage: "L'enregistrement salarial a été créé avec succès.",

      deleteTitle: "Supprimer l'enregistrement",
      deleteSureMessage: "Voulez-vous vraiment supprimer cet enregistrement salarial ? Cette action est irréversible.",

      emptyTitle: "Aucun salaire",
      emptyMessage: "Cette entreprise n'a pas encore d'enregistrement salarial.",

      fields: {
        employee: "Employé",
        employeeSearchPlaceholder: "Rechercher par nom, matricule, CIN, CNSS...",
        baseSalary: "Salaire de base",
        effectiveDate: "Date d'effet",
        notes: "Notes",
        notesPlaceholder: "Motif de ce changement, contexte supplémentaire...",
      },

      table: {
        base: "Base",
        gross: "Brut",
        net: "Net",
        endDate: "Date de fin",
        status: "Statut",
        ongoing: "En cours",
      },

      actions: {
        history: "Voir l'historique",
      },

      history: { deleteRecord: "Supprimer cet historique de salaire",
        titleFor: "Historique salarial — {name}",
        empty: "Aucun historique salarial pour cet employé.",
        current: "Actuel",
        past: "Passé",
      },

      breadcrumbs: {
        hr: "RH",
        salaries: "Salaires",
      },

      buttons: {
        create: "Enregistrer le salaire",
      },

      errors: {
        fetchFailed: "Échec du chargement des salaires",
        actionFailed: "Une erreur est survenue. Veuillez réessayer.",
      },
    },
    absences: {
      title: "Absences",
      subtitle: "Consultez et gérez les demandes de congé et d'absence.",
      addAbsence: "Nouvelle demande d'absence",

      createTitle: "Nouvelle demande d'absence",
      createSureMessage: "Voulez-vous vraiment soumettre cette demande d'absence ?",
      createSuccessTitle: "Demande soumise",
      createSuccessMessage: "La demande d'absence a été soumise avec succès.",

      acceptTitle: "Accepter l'absence",
      acceptSureMessage: "Voulez-vous vraiment accepter cette demande d'absence ?",

      rejectTitle: "Refuser l'absence",
      rejectSureMessage: "Voulez-vous vraiment refuser cette demande d'absence ?",

      deleteTitle: "Supprimer l'absence",
      deleteSureMessage: "Voulez-vous vraiment supprimer cet enregistrement d'absence ? Cette action est irréversible.",

      emptyTitle: "Aucune absence",
      emptyMessage: "Aucune demande d'absence ne correspond à vos filtres.",

      unjustified: "Non justifiée",

      fields: {
        employee: "Employé",
        employeeSearchPlaceholder: "Rechercher par nom, matricule, CIN, CNSS...",
        type: "Type",
        startDate: "Date de début",
        endDate: "Date de fin",
        halfDay: "Demi-journée",
        justified: "Justifiée",
        reason: "Motif",
        reasonPlaceholder: "Motif ou contexte supplémentaire...",
        reviewComment: "Commentaire de révision",
        status: "Statut",
      },

      types: {
        paid_leave: "Congé payé",
        unpaid_leave: "Congé sans solde",
        sick_leave: "Congé maladie",
        absence: "Absence",
        other: "Autre",
      },

      status: { manager_approved: "Validée par le manager",
        pending: "En attente",
        accepted: "Acceptée",
        rejected: "Refusée",
      },

      filters: {
        allStatuses: "Tous les statuts",
        allTypes: "Tous les types",
      },

      table: {
        period: "Période",
        days: "Jours",
      },

      actions: {
        accept: "Accepter",
        reject: "Refuser",
      },

      breadcrumbs: {
        hr: "RH",
        absences: "Absences",
      },

      buttons: {
        create: "Soumettre la demande",
      },

      errors: {
        fetchFailed: "Échec du chargement des absences",
        actionFailed: "Une erreur est survenue. Veuillez réessayer.",
      },
    },
    advances: {
      title: "Avances",
      subtitle: "Consultez et gérez les demandes d'avance sur salaire.",
      addAdvance: "Nouvelle demande d'avance",

      createTitle: "Nouvelle demande d'avance",
      createSureMessage: "Voulez-vous vraiment soumettre cette demande d'avance ?",
      createSuccessTitle: "Demande soumise",
      createSuccessMessage: "La demande d'avance a été soumise avec succès.",

      acceptTitle: "Accepter l'avance",
      acceptSureMessage: "Voulez-vous vraiment accepter cette demande d'avance ?",

      rejectTitle: "Refuser l'avance",
      rejectSureMessage: "Voulez-vous vraiment refuser cette demande d'avance ?",

      markRepaidTitle: "Marquer comme remboursée",
      markRepaidSureMessage: "Voulez-vous vraiment marquer cette avance comme entièrement remboursée ?",

      deleteTitle: "Supprimer l'avance",
      deleteSureMessage: "Voulez-vous vraiment supprimer cet enregistrement d'avance ? Cette action est irréversible.",

      emptyTitle: "Aucune avance",
      emptyMessage: "Aucune demande d'avance ne correspond à vos filtres.",

      fields: {
        employee: "Employé",
        employeeSearchPlaceholder: "Rechercher par nom, matricule, CIN, CNSS...",
        amount: "Montant",
        requestDate: "Date de la demande",
        reason: "Motif",
        reasonPlaceholder: "Motif ou contexte supplémentaire...",
        reviewComment: "Commentaire de révision",
        status: "Statut",
      },

      status: { manager_approved: "Validée par le manager",
        pending: "En attente",
        accepted: "Acceptée",
        rejected: "Refusée",
      },

      filters: {
        allStatuses: "Tous les statuts",
      },

      table: {
        remaining: "Restant",
        fullyRepaid: "Entièrement remboursée",
      },

      actions: {
        accept: "Accepter",
        reject: "Refuser",
        markRepaid: "Marquer comme remboursée",
      },

      breadcrumbs: {
        hr: "RH",
        advances: "Avances",
      },

      buttons: {
        create: "Soumettre la demande",
      },

      errors: {
        fetchFailed: "Échec du chargement des avances",
        actionFailed: "Une erreur est survenue. Veuillez réessayer.",
      },
    },
    payroll: {
      title: "Paie",
      subtitle: "Générez la paie mensuelle et gérez les bulletins de salaire.",
      generateRun: "Générer la paie",
      createTitle: "Générer un cycle de paie",
      createSureMessage: "Générer la paie pour cette période ? Un bulletin sera créé pour chaque employé actif ayant un salaire enregistré.",
      createSuccessTitle: "Cycle de paie créé",
      createSuccessMessage: "Le cycle de paie a été généré avec succès.",
      completeTitle: "Clôturer le cycle de paie",
      completeSureMessage: "Clôturer ce cycle de paie ? Une fois clôturés, les bulletins sont verrouillés et les employés sont notifiés.",
      deleteTitle: "Supprimer le cycle de paie",
      deleteSureMessage: "Supprimer ce cycle de paie (brouillon) et tous ses bulletins ? Cette action est irréversible.",
      emptyTitle: "Aucun cycle de paie",
      emptyMessage: "Générez le premier cycle de paie pour cette entreprise.",
      noPayslips: "Aucun bulletin dans ce cycle.",
      fields: { month: "Mois", year: "Année", status: "Statut" },
      table: { period: "Période", employees: "Employés", gross: "Brut", net: "Net", searchPlaceholder: "Rechercher des employés..." },
      status: { draft: "Brouillon", completed: "Clôturé", voided: "Annulé" },
      payslipStatus: { draft: "Brouillon", validated: "Validé", paid: "Payé" },
      actions: { view: "Voir", complete: "Clôturer", regenerate: "Régénérer", markPaid: "Marquer comme payé", downloadPdf: "Télécharger le bulletin" },
      exports: {
        cnss: "Export CNSS",
        cnssHint: "Feuille de déclaration — à vérifier avec le format Damancom actuel avant téléversement",
        register: "État de paie",
        bankTransfer: "Fichier de virement",
      },
      buttons: { generate: "Générer", saving: "Enregistrement..." },
      breadcrumbs: { hr: "RH", payroll: "Paie" },
      months: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
      errors: { fetchFailed: "Échec du chargement des cycles de paie", actionFailed: "Une erreur est survenue. Veuillez réessayer." },
    },

    contracts: {
      title: "Contrats",
      subtitle: "Suivez les contrats de travail, leurs renouvellements et leurs échéances.",
      addContract: "Nouveau contrat",
      createTitle: "Nouveau contrat",
      createSureMessage: "Voulez-vous vraiment créer ce contrat ?",
      createSuccessTitle: "Contrat créé",
      createSuccessMessage: "Le contrat a été créé avec succès.",
      renewTitle: "Renouveler le contrat",
      renewSureMessage: "Renouveler ce contrat ? Le contrat actuel sera clôturé et un nouveau démarrera.",
      deleteTitle: "Supprimer le contrat",
      deleteSureMessage: "Voulez-vous vraiment supprimer ce contrat ? Cette action est irréversible.",
      emptyTitle: "Aucun contrat",
      emptyMessage: "Cette entreprise n'a pas encore de contrat enregistré.",
      expiringBanner: "{count} contrat(s) arrivant à échéance dans les 30 jours.",
      fields: { employee: "Employé", type: "Type de contrat", startDate: "Date de début", endDate: "Date de fin" },
      status: { active: "Actif", expired: "Expiré", terminated: "Résilié", renewed: "Renouvelé" },
      actions: { renew: "Renouveler" },
      buttons: { create: "Enregistrer le contrat" },
      breadcrumbs: { hr: "RH", contracts: "Contrats" },
      errors: { fetchFailed: "Échec du chargement des contrats", actionFailed: "Une erreur est survenue. Veuillez réessayer." },
    },

    documents: {
      title: "Documents",
      subtitle: "Stockez les documents des employés et suivez leurs échéances.",
      uploadDocument: "Téléverser un document",
      editDocument: "Modifier le document",
      deleteTitle: "Supprimer le document",
      deleteSureMessage: "Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.",
      emptyTitle: "Aucun document",
      emptyMessage: "Cette entreprise n'a pas encore de document enregistré.",
      expiringBanner: "{count} document(s) arrivant à échéance dans les 30 jours.",
      fields: { employee: "Employé", type: "Type", label: "Libellé", labelPlaceholder: "ex. Carte d'identité nationale", expiryDate: "Date d'expiration", file: "Fichier", replaceFile: "Remplacer le fichier (facultatif)" },
      table: { file: "Fichier" },
      types: {
        cin: "CIN", passport: "Passeport", work_permit: "Permis de travail",
        residence_permit: "Titre de séjour", contract: "Contrat", diploma: "Diplôme",
        cv: "CV", medical_certificate: "Certificat médical", other: "Autre",
      },
      actions: { view: "Voir", loadMore: "Charger plus", loadMoreCount: "{loaded} sur {total} affichés" },
      buttons: { upload: "Téléverser" },
      breadcrumbs: { hr: "RH", documents: "Documents" },
      errors: {
        fetchFailed: "Échec du chargement des documents", actionFailed: "Une erreur est survenue. Veuillez réessayer.",
        missingFields: "Veuillez choisir un employé et un fichier.", uploadFailed: "Échec du téléversement du document.",
      },
    },

    attendance: {
      title: "Présence",
      subtitle: "Consultez les pointages d'entrée et de sortie.",
      emptyTitle: "Aucun pointage",
      emptyMessage: "Aucun pointage ne correspond à vos filtres.",
      filterAllEmployees: "Tous les employés",
      fields: { employee: "Employé", date: "Date", clockIn: "Entrée", clockOut: "Sortie", notes: "Notes" },
      status: { present: "Présent", late: "En retard", absent: "Absent", half_day: "Demi-journée", holiday: "Jour férié" },
      breadcrumbs: { hr: "RH", attendance: "Présence" },
      errors: { fetchFailed: "Échec du chargement des présences" },
    },

    reports: { chart: { zoomHint: "Faites glisser les poignées sous le graphique pour zoomer", yearly: "Annuel", monthly: "Mensuel", view: "Affichage", lastMonths: "{n} derniers mois", range: "Période", },
      title: "Rapports",
      subtitle: "Effectif, turnover, absentéisme et évolution de la masse salariale.",
      stats: { totalHeadcount: "Effectif total", activeEmployees: "Employés actifs", currentGross: "Brut mensuel actuel (est.)", currentNet: "Net mensuel actuel (est.)", missingSalaryNote: "{count} employé(s) actif(s) n'ont pas encore de salaire enregistré — non inclus dans cette estimation." },
      expand: "Agrandir",
      charts: {
        headcountByDepartment: "Effectif par département", turnover: "Turnover (12 derniers mois)",
        hires: "Embauches", terminations: "Départs", absenteeism: "Taux d'absentéisme (6 derniers mois)",
        absenteeismRate: "Taux d'absentéisme", payrollCost: "Masse salariale (12 derniers mois)",
        estimatedFootnote: "* Le mois en cours, marqué d'un astérisque, est une estimation en direct basée sur les salaires actuels — la paie n'a pas encore été exécutée pour cette période.",
      },
      breadcrumbs: { hr: "RH", reports: "Rapports" },
      loadError: "Certaines données du rapport n'ont pas pu être chargées. Veuillez réessayer, ou consulter la console pour plus de détails.",
      rankings: {
        title: "Classement des employés",
        last30Days: "30 derniers jours",
        last90Days: "90 derniers jours",
        last365Days: "12 derniers mois",
        mostAbsenceDays: "Le plus de jours d'absence",
        bestAttendanceRate: "Meilleur taux de présence",
        mostOvertimeHours: "Le plus d'heures supplémentaires",
        mostLateDays: "Le plus de retards",
        noData: "Aucune donnée pour cette période.",
        days: "jours",
      },
    },

    auditLog: {
      title: "Journal d'audit",
      subtitle: "Qui a changé quoi, et quand.",
      deleteTitle: "Supprimer l'entrée du journal",
      deleteSureMessage: "Voulez-vous vraiment supprimer cette entrée du journal d'audit ? Cette action est irréversible.",
      emptyTitle: "Aucune activité",
      emptyMessage: "Aucune modification n'a encore été enregistrée pour ce filtre.",
      fields: { action: "Action", resourceType: "Type", resource: "Enregistrement", actor: "Par", date: "Date" },
      resourceTypes: {
        Employee: "Employé", Salary: "Salaire", Absence: "Absence", Advance: "Avance",
        Contract: "Contrat", EmployeeDocument: "Document", PayrollRun: "Cycle de paie", WorkSchedule: "Horaires de travail",
      },
      actions: { create: "Créé", update: "Modifié", delete: "Supprimé", review: "Examiné" },
      breadcrumbs: { hr: "RH", auditLog: "Journal d'audit" },
      errors: { actionFailed: "Cette action a échoué. Veuillez réessayer.", fetchFailed: "Échec du chargement du journal d'audit" },
    },

    orgChart: {
      title: "Organigramme",
      subtitle: "Structure hiérarchique, construite à partir du responsable de chaque employé.",
      emptyTitle: "Aucun organigramme",
      emptyMessage: "Définissez un responsable pour les employés afin de construire la structure hiérarchique.",
      breadcrumbs: { hr: "RH", orgChart: "Organigramme" },
    },

    mySpace: {
      title: "Mon espace",
      subtitle: "Votre profil, vos bulletins de paie et vos demandes.",
      tabs: { profile: "Profil", payslips: "Bulletins de paie", absences: "Absences", advances: "Avances", attendance: "Présence", records: "Dossier" },
      records: {
        performanceReviews: "Évaluations de performance",
        disciplinaryActions: "Dossier disciplinaire",
        noReviews: "Vous n'avez encore aucune évaluation de performance.",
        noDisciplinaryActions: "Vous n'avez aucune action disciplinaire enregistrée.",
        reviewedBy: "Évalué par",
        acknowledge: "Accuser réception",
        acknowledgeTitle: "Accuser réception",
        acknowledgeReviewMessage: "Ceci confirme que vous avez lu cette évaluation de performance. Continuer ?",
        acknowledgeDisciplineMessage: "Ceci confirme que vous avez lu cette fiche. Continuer ?",
        loadError: "Échec du chargement de votre dossier.",
        acknowledgeError: "Erreur lors de l'accusé de réception.",
      },
      leaveBalance: { title: "Solde de congés payés", accrued: "Acquis", used: "Utilisé", remaining: "Restant" },
      teamRequests: { advance: "Avance sur salaire", days: "{count} jour(s)", reviewFailed: "Impossible d'enregistrer cette décision. Veuillez réessayer.", title: "Demandes en attente de votre équipe" },
      payslips: { emptyTitle: "Aucun bulletin de paie", emptyMessage: "Vos bulletins de paie apparaîtront ici une fois la paie effectuée." },
      absences: { cancelTitle: "Annuler la demande", cancelSureMessage: "Annuler cette demande d'absence ?" },
      attendance: { holidayToday: "Jour férié aujourd'hui : {name}", holidayDouble: "heures travaillées payées double", clockOutLunch: "Pointer la pause", clockInAfternoon: "Pointer le retour", dayComplete: "Journée terminée ✓", scheduleToday: "Aujourd'hui", restDay: "Jour de repos", morning: "Matin", afternoon: "Après-midi", punchFailed: "Impossible d'enregistrer ce pointage. Veuillez réessayer.", todayStatus: "Aujourd'hui", clockIn: "Entrée", clockOut: "Sortie" },
    },

    notifications: {
      title: "Notifications",
      empty: "Aucune notification.",
      markAllRead: "Tout marquer comme lu",
      now: "à l'instant",
      minutesShort: "min",
      hoursShort: "h",
      daysShort: "j",
    },

    units: {
      unit: "Unité",
      piece: "Pièce",
      pair: "Paire",
      dozen: "Douzaine",
      set: "Ensemble",
      kg: "Kilogramme (kg)",
      g: "Gramme (g)",
      t: "Tonne (t)",
      lb: "Livre (lb)",
      oz: "Once (oz)",
      quintal: "Quintal (q)",
      l: "Litre (L)",
      ml: "Millilitre (mL)",
      m3: "Mètre cube (m³)",
      gal: "Gallon (gal)",
      m: "Mètre (m)",
      cm: "Centimètre (cm)",
      mm: "Millimètre (mm)",
      km: "Kilomètre (km)",
      ft: "Pied (ft)",
      in: "Pouce (in)",
      yd: "Yard (yd)",
      m2: "Mètre carré (m²)",
      ft2: "Pied carré (ft²)",
      ha: "Hectare (ha)",
      box: "Boîte",
      carton: "Carton",
      pallet: "Palette",
      bag: "Sac",
      sack: "Sac",
      bottle: "Bouteille",
      can: "Boîte de conserve",
      roll: "Rouleau",
      sheet: "Feuille",
      bundle: "Faisceau",
      case: "Caisse",
      drum: "Fût",
      barrel: "Baril",
      container: "Conteneur",
      hour: "Heure",
      day: "Jour",
      month: "Mois",
    },

    contentTranslation: {
      title: "Traductions",
      editButton: "Traductions",
      original: "Original",
      auto: "Traduit automatiquement",
      manual: "Modifié manuellement",
      missing: "Pas encore traduit",
      regenerate: "Régénérer",
      originalHint: "Ceci est le texte original — modifiez le champ lui-même pour le changer.",
      save: "Enregistrer",
      saving: "Enregistrement…",
      close: "Fermer",
      placeholder: "Saisissez la traduction…",
      errors: {
        loadFailed: "Échec du chargement des traductions.",
        saveFailed: "Échec de l'enregistrement de la traduction.",
        regenerateFailed: "Échec de la régénération de la traduction.",
      },
    },
  twoFactor: { qrAlt: "QR code 2FA",
    title: "Authentification à deux facteurs",
    disabledHint: "Ajoutez une couche de sécurité supplémentaire à votre compte — après votre mot de passe, un code provenant d'une application d'authentification sera aussi requis pour vous connecter.",
    enabledHint: "L'authentification à deux facteurs est activée sur votre compte. Un code de votre application d'authentification vous sera demandé à chaque connexion.",
    enableButton: "Activer l'authentification à deux facteurs",
    disableButton: "Désactiver l'authentification à deux facteurs",
    disabling: "Désactivation...",
    scanTitle: "Scannez le code QR",
    scanHint: "Scannez-le avec une application d'authentification (Google Authenticator, Authy, etc.), puis saisissez le code à 6 chiffres affiché pour confirmer.",
    manualEntryLabel: "Impossible de scanner ? Saisissez ce code manuellement :",
    confirmAndEnable: "Confirmer et activer",
    verifying: "Vérification...",
    backupCodesTitle: "Enregistrez vos codes de secours",
    backupCodesHint: "Chaque code peut être utilisé une fois pour vous connecter si vous perdez l'accès à votre application d'authentification. Conservez-les en lieu sûr — ils ne seront plus jamais affichés.",
    copyBackupCodes: "Copier les codes",
    copied: "Copié",
    iSavedThem: "J'ai enregistré ces codes",
    confirmPasswordLabel: "Confirmez votre mot de passe pour continuer",
    errors: {
      statusFailed: "Impossible de vérifier l'état de l'authentification à deux facteurs.",
      setupFailed: "Impossible de démarrer la configuration de l'authentification à deux facteurs.",
      invalidCode: "Ce code ne correspond pas — vérifiez votre application d'authentification et réessayez.",
      disableFailed: "Impossible de désactiver l'authentification à deux facteurs.",
    },
  },

  disciplinaryActions: {
    title: "Actions disciplinaires",
    subtitle: "Suivez les avertissements et mesures correctives émis aux employés.",
    addAction: "Ajouter une fiche",
    editAction: "Modifier la fiche",
    emptyTitle: "Aucune action disciplinaire",
    emptyMessage: "Cette entreprise n'a aucune action disciplinaire enregistrée.",
    deleteTitle: "Supprimer la fiche",
    deleteSureMessage: "Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible.",
    acknowledged: "Accusé de réception",
    notAcknowledged: "Non encore accusé",
    breadcrumbs: {
      hr: "RH",
      disciplinaryActions: "Actions disciplinaires",
    },
    fields: {
      employee: "Employé",
      type: "Type",
      date: "Date",
      reason: "Motif",
      description: "Description",
      suspensionDays: "Suspension (jours)",
      issuedBy: "Émis par",
      notes: "Notes",
    },
    types: {
      verbal_warning: "Avertissement verbal",
      written_warning: "Avertissement écrit",
      final_warning: "Dernier avertissement",
      suspension: "Mise à pied",
      termination_notice: "Notification de licenciement",
    },
    errors: {
      fetchFailed: "Échec du chargement des actions disciplinaires",
      saveFailed: "Erreur lors de l'enregistrement",
      deleteFailed: "Erreur lors de la suppression",
    },
  },
  performanceReviews: {
    title: "Évaluations de performance",
    subtitle: "Cycles d'évaluation, objectifs et notes pour vos employés.",
    addReview: "Nouvelle évaluation",
    editReview: "Modifier l'évaluation",
    emptyTitle: "Aucune évaluation pour l'instant",
    emptyMessage: "Cette entreprise n'a aucune évaluation enregistrée.",
    deleteTitle: "Supprimer l'évaluation",
    deleteSureMessage: "Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.",
    reviewedBy: "Évalué par",
    submitButton: "Envoyer à l'employé",
    breadcrumbs: {
      hr: "RH",
      performanceReviews: "Évaluations",
    },
    fields: {
      employee: "Employé",
      reviewer: "Évaluateur",
      periodLabel: "Période d'évaluation",
      periodLabelPlaceholder: "ex. Évaluation annuelle 2026",
      reviewDate: "Date d'évaluation",
      goals: "Objectifs (un par ligne)",
      goalsPlaceholder: "Améliorer le temps de réponse sur les tickets\nTerminer la certification d'intégration",
      strengths: "Points forts",
      areasForImprovement: "Axes d'amélioration",
      comments: "Commentaires",
    },
    criteria: {
      jobKnowledge: "Connaissance du poste",
      qualityOfWork: "Qualité du travail",
      communication: "Communication",
      teamwork: "Travail d'équipe",
      initiative: "Initiative",
      punctuality: "Ponctualité",
    },
    statuses: {
      draft: "Brouillon",
      submitted: "Envoyée",
      acknowledged: "Accusée réception",
    },
    errors: {
      fetchFailed: "Échec du chargement des évaluations",
      saveFailed: "Erreur lors de l'enregistrement",
      submitFailed: "Erreur lors de l'envoi",
      deleteFailed: "Erreur lors de la suppression",
    },
  },
  leaveCalendar: {
    title: "Calendrier des congés",
    subtitle: "Visualisez en un coup d'œil qui est en congé approuvé.",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    breadcrumbs: {
      hr: "RH",
      leaveCalendar: "Calendrier des congés",
    },
    weekdays: {
      0: "Lun",
      1: "Mar",
      2: "Mer",
      3: "Jeu",
      4: "Ven",
      5: "Sam",
      6: "Dim",
    },
    errors: {
      fetchFailed: "Échec du chargement du calendrier des congés",
    },
  },
};
