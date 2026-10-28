/**
 * Sanity (négoce) translations — key namespace "ng" + menu entries.
 * French and English are complete; Arabic covers menus and titles and
 * falls back to French for the rest (see context/i18nContext.jsx).
 */

const fr = {
  ng: {
    brand: { tagline: "Négoce · stock · ventes · caisse" },
    menu: { dashboard: "Tableau de bord", sales: "Ventes", stock: "Stock", pos: "Caisse", logistics: "Logistique", reps: "Commerciaux" },
    common: {
      reference: "Réf.", warehouse: "Dépôt", allWarehouses: "Tous les dépôts", defaultWarehouse: "Dépôt par défaut", deliveryWarehouse: "Dépôt de réception",
      salesRep: "Commercial", margin: "Marge", saved: "Enregistré.", notFound: "Aucun article avec ce code", scanPlaceholder: "Scanner un code-barres (article ou carton) puis Entrée",
      from: "Du", to: "Au", days: "jours",
    },
    dashboard: {
      title: "Tableau de bord", hello: "Bonjour", subtitle: "Ventes, comptoir, livraisons et alertes de stock en un coup d'œil.",
      salesToday: "Ventes du jour", salesMonth: "Ventes du mois", counter: "Comptoir aujourd'hui", today: "aujourd'hui", todo: "À traiter",
      ordersToPrepare: "Commandes à préparer", toDeliver: "BL à livrer", toInvoice: "BL à facturer", lowStock: "Articles sous le minimum", expiring: "Lots bientôt périmés",
    },
    articles: {
      title: "Articles", subtitle: "Catalogue : références, codes-barres, cartons, tarifs, stock par dépôt.", new: "Nouvel article", search: "Nom, référence, code-barres…",
      family: "Famille", pickFamily: "Choisir une famille", brand: "Marque", name: "Désignation", show: "Afficher", showStock: "Articles", showModels: "Modèles (avec variantes)", showLow: "Sous le stock minimum",
      empty: "Aucun article", emptyHint: "Créez vos articles ou importez votre catalogue.", model: "Modèle", publicPrice: "Prix public", cmup: "CMUP",
      identity: "Identification", barcode: "Code-barres", manufacturerRef: "Réf. fabricant", unitsTitle: "Unités & conditionnements", baseUnit: "Unité de base", weight: "Poids (kg / unité)",
      packaging: "Conditionnement", factor: "Unités par cond.", addPackaging: "Ajouter un conditionnement (carton, palette…)",
      pricesTitle: "Prix de vente", vat: "TVA", minPrice: "Prix plancher", stockTitle: "Stock & traçabilité", threshold: "Stock minimum", maxQuantity: "Stock maximum",
      trackingLabel: "Traçabilité", tracking: { none: "Aucune", lot: "Par lot", serial: "N° de série" }, hasExpiry: "Date de péremption", shelfLife: "Durée de vie (jours)",
      isService: "Prestation / service (pas de stock)", isActive: "Article actif", isModel: "Modèle avec variantes (couleurs, tailles…)",
      opening: "Stock d'ouverture", unitCost: "Coût unitaire HT", keepCmup: "vide = CMUP inchangé", lastPurchase: "Dernier achat",
      variants: "Variantes", variantsHint: "Couleur: Chromé, Noir mat ; Taille: 1/2\", 3/4\"", makeVariants: "Créer les variantes", variantOf: "Variante de",
      deleteMessage: "Supprimer cet article ? Impossible s'il a du stock ou figure sur des documents (désactivez-le alors).",
    },
    stock: {
      quantity: "Quantité", reserved: "Réservé", available: "Disponible", inWarehouse: "Dans le dépôt", value: "Valeur du stock", byWarehouse: "Stock par dépôt", none: "Pas de stock", location: "Emplacement",
      in: "Entrée", out: "Sortie", setCount: "Corriger (inventaire)", counted: "Quantité comptée", reason: "Motif", lotNumber: "N° de lot", expiry: "Péremption", lots: "Lots", serials: "N° de série",
      serialsHint: "Un numéro par ligne ou séparés par des virgules", movements: "Mouvements de stock", movement: "Mouvement", movementsSubtitle: "Chaque entrée et sortie, avec son document.",
      origin: "Origine", after: "Stock après", levelsTitle: "Stock par dépôt", levelsSubtitle: "Quantités par dépôt / magasin, réservations et valeur au CMUP.", inStockOnly: "En stock",
      valuationXlsx: "Valorisation (Excel)",
      types: { in: "Entrée", out: "Sortie", adjustment: "Inventaire", transfer_in: "Transfert reçu", transfer_out: "Transfert envoyé" },
      kinds: { purchase: "Réception achat", purchase_return: "Retour fournisseur", delivery: "BL", delivery_return: "Retour client", invoice: "Facture directe", credit_note: "Avoir", pos: "Ticket caisse", pos_refund: "Remboursement caisse", transfer: "Transfert", count: "Inventaire", manual: "Manuel", opening: "Stock d'ouverture" },
    },
    transfers: {
      title: "Transferts entre dépôts", subtitle: "Envoyer du stock d'un dépôt à un autre (ou au showroom) et le réceptionner.", new: "Nouveau transfert", from: "Depuis", to: "Vers",
      createSend: "Créer et envoyer", send: "Envoyer", receive: "Réceptionner", sent: "Envoyé", received: "Reçu", needTwo: "Créez au moins deux dépôts pour faire des transferts.",
      status: { draft: "Brouillon", sent: "En transit", received: "Reçu", cancelled: "Annulé" },
    },
    counts: {
      title: "Inventaires", subtitle: "Comptage physique d'un dépôt ou d'une famille ; les écarts ajustent le stock au CMUP.", new: "Nouvel inventaire", one: "Inventaire",
      wholeWarehouse: "Tout le dépôt", label: "Libellé", labelHint: "Inventaire annuel, tournant…", start: "Démarrer le comptage", scope: "Périmètre", progress: "Compté", gap: "Écart",
      expected: "Théorique", validate: "Valider l'inventaire", validateMessage: "Les écarts deviennent des mouvements de stock. Les articles non comptés restent inchangés.", validatedOn: "Validé le",
      status: { draft: "En cours", validated: "Validé", cancelled: "Annulé" },
    },
    expiring: { title: "Péremptions", subtitle: "Lots qui arrivent à expiration : à vendre en priorité ou à sortir.", within: "Dans les", expired: "périmé", none: "Aucun lot proche de sa péremption." },
    warehouses: {
      title: "Dépôts & magasins", subtitle: "Où se trouve le stock ; un magasin avec comptoir peut ouvrir une caisse.", new: "Nouveau dépôt", code: "Code", name: "Nom", kind: "Type",
      kinds: { warehouse: "Dépôt", store: "Magasin / showroom" }, counter: "comptoir", hasCounter: "Vente au comptoir (caisse)", active: "Ouvert", default: "Par défaut", closed: "Fermé", makeDefault: "Par défaut",
    },
    brands: { title: "Marques", subtitle: "Grohe, Legrand, Colorado… pour filtrer le catalogue et les tarifs.", name: "Marque", add: "Ajouter", rename: "Nouveau nom" },
    customers: {
      code: "Code", codeAuto: "auto (CL-0001)", type: "Type", types: { reseller: "Revendeur", installer: "Installateur", company: "Entreprise / BTP", retail: "Particulier", walk_in: "Comptoir" },
      discount: "Remise client %", noRep: "Sans commercial", creditLimit: "Plafond de crédit", noLimit: "sans plafond", flow: "Circuit", flows: { full: "Commande → BL → facture", direct: "Facture directe" },
      zone: "Zone / secteur", deliveryAddress: "Adresse de livraison", exposure: "Encours", creditLeft: "Reste autorisé", blocked: "Bloqué", block: "Bloquer", unblock: "Débloquer",
      blockReason: "Motif du blocage (impayés…)", due: "Doit",
    },
    pricing: {
      title: "Tarifs", subtitle: "Niveaux de prix (revendeur, gros, détail, comptoir), règles de prix et tarif par niveau.", level: "Niveau de prix", levelShort: "Tarif", levels: "Niveaux de prix",
      levelsHint: "Un article sans prix pour un niveau prend son CMUP × (1 + marge %) puis son prix public.", levelName: "Nom", markup: "Marge sur CMUP %", addLevel: "Ajouter un niveau",
      defaultLevel: "Niveau par défaut (nouveaux clients)", posLevel: "Niveau comptoir", rules: "Règles", blockBelowCost: "Interdire la vente sous le prix de revient / plancher (sauf responsable)",
      blockCredit: "Bloquer au-delà du plafond de crédit (sauf dérogation)", priceList: "Tarif par niveau", exportAll: "Tarif Excel", bulkMode: "Méthode", bulkMarkup: "CMUP + %", bulkPercent: "Prix actuel ± %",
      bulkApply: "Appliquer", bulkDone: "{n} articles mis à jour.", originLabel: "Origine", origin: { article: "prix de l'article", markup: "CMUP + marge", public: "prix public", none: "—" },
    },
    orders: {
      title: "Commandes clients", one: "Commande", subtitle: "Commandes des revendeurs, des commerciaux et du téléphone : réservation du stock, livraisons, facturation.",
      new: "Nouvelle commande", edit: "Modifier la commande", search: "N°, réf. client, client…", empty: "Aucune commande", fromQuote: "Transformer en commande", convertedPill: "Commandé",
      status: { draft: "Brouillon", confirmed: "Confirmée", partially_delivered: "Livrée en partie", delivered: "Livrée", invoiced: "Facturée", cancelled: "Annulée" },
      customerReference: "Réf. commande client", expectedDate: "Livraison souhaitée", deliveryMode: "Livraison", modes: { delivery: "Livraison", pickup: "Enlèvement au dépôt" },
      saveDraft: "Enregistrer (brouillon)", saveConfirm: "Enregistrer et confirmer", confirm: "Confirmer (réserver le stock)", cancel: "Annuler la commande",
      cancelMessage: "Annuler cette commande ? Le stock réservé est libéré.", deleteMessage: "Supprimer ce brouillon ?", delivered: "Livré", toDeliver: "À livrer", makeBL: "Créer un BL",
      blDraft: "BL brouillon", blValidate: "BL validé (sortie de stock)", overrideHint: "Plafond dépassé ou compte bloqué : vous pouvez déroger.", override: "Confirmer quand même", overrideReason: "Motif de la dérogation",
    },
    delivery: {
      notes: "Bons de livraison", one: "BL", subtitle: "Préparation, sortie de stock, livraison signée, facturation groupée.", new: "Nouveau BL", newReturn: "Retour client",
      return: "Retour", returnHint: "Marchandise rendue par le client : elle rentre en stock à la validation.", freeHint: "BL sans commande (comptoir revendeur, dépannage).",
      views: { toPlan: "À planifier", toInvoice: "À facturer", draft: "À préparer", validated: "Sortis", delivered: "Livrés", cancelled: "Annulés" },
      status: { draft: "À préparer", validated: "Sorti du stock", delivered: "Livré", cancelled: "Annulé" },
      round: "Tournée", invoiced: "facturé", groupHint: "Cochez les BL d'un même client pour les regrouper sur une facture.", invoiceSelected: "Facturer la sélection",
      validate: "Valider (sortie de stock)", validateReturn: "Valider (retour en stock)", markDelivered: "Marquer livré", invoice: "Facturer ce BL", valuedPdf: "PDF chiffré",
      receivedBy: "Reçu par", reserves: "Réserves du client", cashCollected: "Espèces encaissées", weight: "Poids", deliveredOn: "Livré le",
      cancelMessage: "Annuler ce BL ? La marchandise revient en stock.", deleteMessage: "Supprimer ce BL brouillon ?",
    },
    rounds: {
      title: "Tournées", one: "Tournée", subtitle: "Un camion, un chauffeur, une journée : les BL dans l'ordre de passage.", new: "Nouvelle tournée", zone: "Zone", vehicle: "Véhicule", driver: "Chauffeur",
      stops: "Arrêts", stopsTitle: "Ordre de passage", toPlan: "BL à planifier", nothingToPlan: "Aucun BL à planifier.", saveStops: "Enregistrer les arrêts", start: "Départ (sortie des BL)",
      finish: "Clôturer la tournée", delivered: "Livré", status: { planned: "Planifiée", in_progress: "En cours", done: "Terminée", cancelled: "Annulée" },
    },
    invoices: {
      creditReturn: "Avoir avec retour en stock", creditReturnHint: "La marchandise revient dans le dépôt à l'émission de l'avoir.", directHint: "Facture directe : la marchandise sort du stock à l'émission.",
      stock: "Stock", stockOnIssue: "sortira à l'émission", stockOut: "sorti", stockBack: "rentré", chequeDue: "Échéance chèque / effet",
    },
    pos: {
      title: "Caisse", sessions: "Sessions de caisse", session: "Session", sessionsSubtitle: "Ouvertures, clôtures (Z) et écarts de caisse.", closedHint: "Aucune session ouverte : ouvrez la caisse avec votre fond de caisse.",
      open: "Ouvrir la caisse", close: "Clôturer", closeConfirm: "Clôturer la caisse", store: "Magasin", register: "Caisse", openingFloat: "Fond de caisse", tickets: "tickets", ticket: "Ticket",
      reprint: "Réimprimer", sessionDetail: "Détail / Z", cashOut: "Sortie d'espèces", cashOutPrompt: "Montant retiré de la caisse (remise en banque, dépense…)",
      scanPlaceholder: "Scanner ou chercher un article (nom, réf., code-barres)", emptyCart: "Scannez un article pour commencer.", unitTTC: "P.U. TTC",
      walkIn: "Client comptoir", customerName: "Nom du client (facultatif)", invoice: "Faire une facture", paid: "Payé", rest: "Mettre le reste ici", change: "À rendre", missing: "Manque", checkout: "Encaisser",
      methods: { especes: "Espèces", carte: "Carte", cheque: "Chèque", virement: "Virement", credit: "En compte" }, method: "Mode", expected: "Attendu", counted: "Compté", difference: "Écart",
      zReport: "Rapport Z", printZ: "Imprimer", opened: "Ouverture", cashier: "Caissier", cashMoves: "mouvements d'espèces", time: "Heure", payments: "Paiements",
      refund: "Rembourser", refundReason: "Motif du remboursement", maxAnonymous: "Au-delà (TTC), nom du client obligatoire", ticketHeader: "En-tête du ticket", ticketFooter: "Pied du ticket",
      sessionStatus: { open: "Ouverte", closed: "Clôturée" }, saleStatus: { completed: "Encaissé", refunded: "Remboursé" },
    },
    reps: {
      title: "Commerciaux", subtitle: "Chiffre d'affaires, marge et encaissements du mois par commercial, objectifs et commissions.", period: "Mois",
      invoiced: "CA facturé HT", target: "Objectif", collected: "Encaissé", commissions: "Commissions", commission: "Commission", marginRate: "Taux de marge", newCustomers: "Nouveaux clients",
      collectionTarget: "Objectif encaissement", rate: "Taux %", bonus: "Prime objectif", defaultRate: "Taux par défaut %", commissionBase: "Commission calculée sur",
      bases: { collected: "l'encaissé", invoiced: "le facturé", margin: "la marge" }, clickToSet: "Cliquez sur un commercial pour fixer ses objectifs du mois.",
    },
    collections: {
      title: "Recouvrement", subtitle: "Ce que chaque client doit, du plus ancien au plus récent ; appels, visites, promesses de paiement.", toCollect: "À encaisser", customers: "clients",
      oldest: "Plus ancien", lastAction: "Dernière action", newAction: "Nouvelle action", action: "Action", type: "Type", promiseDate: "Date promise",
      actions: { call: "Appel", visit: "Visite", reminder: "Relance écrite", promise: "Promesse", dispute: "Litige", note: "Note" },
    },
  },
  sidebar: { dashboard: "Tableau de bord", salesOrders: "Commandes", pricing: "Tarifs", collections: "Recouvrement", reps: "Commerciaux", articles: "Articles", stockLevels: "Stock par dépôt", stockMovements: "Mouvements", transfers: "Transferts", counts: "Inventaires", expiring: "Péremptions", warehouses: "Dépôts & magasins", brands: "Marques", articleCategories: "Familles", pos: "Caisse", posSessions: "Sessions de caisse", rounds: "Tournées", stockMenu: "Stock", posMenu: "Caisse", purchaseRequests: "Demandes d'achat" },
};

const en = {
  ng: {
    brand: { tagline: "Wholesale · stock · sales · point of sale" },
    menu: { dashboard: "Dashboard", sales: "Sales", stock: "Stock", pos: "Point of sale", logistics: "Logistics", reps: "Sales reps" },
    common: {
      reference: "Ref.", warehouse: "Warehouse", allWarehouses: "All warehouses", defaultWarehouse: "Default warehouse", deliveryWarehouse: "Receiving warehouse",
      salesRep: "Sales rep", margin: "Margin", saved: "Saved.", notFound: "No article with this code", scanPlaceholder: "Scan a barcode (article or carton) then Enter",
      from: "From", to: "To", days: "days",
    },
    dashboard: {
      title: "Dashboard", hello: "Hello", subtitle: "Sales, counter, deliveries and stock alerts at a glance.", salesToday: "Sales today", salesMonth: "Sales this month",
      counter: "Counter today", today: "today", todo: "To do", ordersToPrepare: "Orders to prepare", toDeliver: "Delivery notes to deliver", toInvoice: "Delivery notes to invoice",
      lowStock: "Articles below minimum", expiring: "Lots expiring soon",
    },
    articles: {
      title: "Articles", subtitle: "Catalogue: references, barcodes, cartons, prices, stock per warehouse.", new: "New article", search: "Name, reference, barcode…",
      family: "Family", pickFamily: "Choose a family", brand: "Brand", name: "Description", show: "Show", showStock: "Articles", showModels: "Models (with variants)", showLow: "Below minimum stock",
      empty: "No article", emptyHint: "Create your articles or import your catalogue.", model: "Model", publicPrice: "Public price", cmup: "Avg. cost",
      identity: "Identification", barcode: "Barcode", manufacturerRef: "Manufacturer ref.", unitsTitle: "Units & packagings", baseUnit: "Base unit", weight: "Weight (kg / unit)",
      packaging: "Packaging", factor: "Units per pack", addPackaging: "Add a packaging (carton, pallet…)", pricesTitle: "Selling prices", vat: "VAT", minPrice: "Floor price",
      stockTitle: "Stock & traceability", threshold: "Minimum stock", maxQuantity: "Maximum stock", trackingLabel: "Traceability", tracking: { none: "None", lot: "By lot", serial: "Serial numbers" },
      hasExpiry: "Expiry date", shelfLife: "Shelf life (days)", isService: "Service (no stock)", isActive: "Active", isModel: "Model with variants (colours, sizes…)",
      opening: "Opening stock", unitCost: "Unit cost (excl. VAT)", keepCmup: "empty = average cost unchanged", lastPurchase: "Last purchase",
      variants: "Variants", variantsHint: "Colour: Chrome, Matt black ; Size: 1/2\", 3/4\"", makeVariants: "Create the variants", variantOf: "Variant of",
      deleteMessage: "Delete this article? Not possible if it has stock or appears on documents (deactivate it instead).",
    },
    stock: {
      quantity: "Quantity", reserved: "Reserved", available: "Available", inWarehouse: "In warehouse", value: "Stock value", byWarehouse: "Stock per warehouse", none: "No stock", location: "Location",
      in: "Stock in", out: "Stock out", setCount: "Correct (count)", counted: "Counted quantity", reason: "Reason", lotNumber: "Lot number", expiry: "Expiry", lots: "Lots", serials: "Serial numbers",
      serialsHint: "One per line or comma-separated", movements: "Stock movements", movement: "Movement", movementsSubtitle: "Every in and out, with its document.", origin: "Origin", after: "Stock after",
      levelsTitle: "Stock per warehouse", levelsSubtitle: "Quantities per warehouse / store, reservations and value at average cost.", inStockOnly: "In stock", valuationXlsx: "Valuation (Excel)",
      types: { in: "In", out: "Out", adjustment: "Count", transfer_in: "Transfer received", transfer_out: "Transfer sent" },
      kinds: { purchase: "Purchase receipt", purchase_return: "Supplier return", delivery: "Delivery note", delivery_return: "Customer return", invoice: "Direct invoice", credit_note: "Credit note", pos: "Counter ticket", pos_refund: "Counter refund", transfer: "Transfer", count: "Stock count", manual: "Manual", opening: "Opening stock" },
    },
    transfers: {
      title: "Warehouse transfers", subtitle: "Send stock from one warehouse to another (or to the showroom) and receive it.", new: "New transfer", from: "From", to: "To",
      createSend: "Create and send", send: "Send", receive: "Receive", sent: "Sent", received: "Received", needTwo: "Create at least two warehouses to transfer stock.",
      status: { draft: "Draft", sent: "In transit", received: "Received", cancelled: "Cancelled" },
    },
    counts: {
      title: "Stock counts", subtitle: "Physical count of a warehouse or family; gaps adjust the stock at average cost.", new: "New count", one: "Count", wholeWarehouse: "Whole warehouse",
      label: "Label", labelHint: "Yearly count, cycle count…", start: "Start counting", scope: "Scope", progress: "Counted", gap: "Gap", expected: "Expected", validate: "Validate the count",
      validateMessage: "Gaps become stock movements. Articles not counted stay unchanged.", validatedOn: "Validated on", status: { draft: "In progress", validated: "Validated", cancelled: "Cancelled" },
    },
    expiring: { title: "Expiry", subtitle: "Lots reaching their expiry date: sell first or take out.", within: "Within", expired: "expired", none: "No lot close to its expiry." },
    warehouses: {
      title: "Warehouses & stores", subtitle: "Where the stock sits; a store with a counter can open a cash register.", new: "New warehouse", code: "Code", name: "Name", kind: "Type",
      kinds: { warehouse: "Warehouse", store: "Store / showroom" }, counter: "counter", hasCounter: "Counter sales (cash register)", active: "Open", default: "Default", closed: "Closed", makeDefault: "Make default",
    },
    brands: { title: "Brands", subtitle: "Grohe, Legrand, Colorado… to filter the catalogue and price lists.", name: "Brand", add: "Add", rename: "New name" },
    customers: {
      code: "Code", codeAuto: "auto (CL-0001)", type: "Type", types: { reseller: "Reseller", installer: "Installer", company: "Company / contractor", retail: "Individual", walk_in: "Walk-in" },
      discount: "Customer discount %", noRep: "No sales rep", creditLimit: "Credit limit", noLimit: "no limit", flow: "Flow", flows: { full: "Order → delivery → invoice", direct: "Direct invoice" },
      zone: "Zone / area", deliveryAddress: "Delivery address", exposure: "Outstanding", creditLeft: "Credit left", blocked: "Blocked", block: "Block", unblock: "Unblock",
      blockReason: "Reason (unpaid invoices…)", due: "Owes",
    },
    pricing: {
      title: "Price lists", subtitle: "Price levels (reseller, wholesale, retail, counter), pricing rules and price list per level.", level: "Price level", levelShort: "Level", levels: "Price levels",
      levelsHint: "An article with no price for a level uses its average cost × (1 + markup %), then its public price.", levelName: "Name", markup: "Markup on cost %", addLevel: "Add a level",
      defaultLevel: "Default level (new customers)", posLevel: "Counter level", rules: "Rules", blockBelowCost: "Refuse selling below cost / floor price (managers excepted)",
      blockCredit: "Block beyond the credit limit (unless overridden)", priceList: "Price list per level", exportAll: "Price list (Excel)", bulkMode: "Method", bulkMarkup: "Cost + %", bulkPercent: "Current price ± %",
      bulkApply: "Apply", bulkDone: "{n} articles updated.", originLabel: "Origin", origin: { article: "article price", markup: "cost + markup", public: "public price", none: "—" },
    },
    orders: {
      title: "Sales orders", one: "Order", subtitle: "Orders from resellers, reps and the phone: stock reservation, deliveries, invoicing.", new: "New order", edit: "Edit the order",
      search: "No., customer ref., customer…", empty: "No order", fromQuote: "Turn into an order", convertedPill: "Ordered",
      status: { draft: "Draft", confirmed: "Confirmed", partially_delivered: "Partly delivered", delivered: "Delivered", invoiced: "Invoiced", cancelled: "Cancelled" },
      customerReference: "Customer PO ref.", expectedDate: "Requested delivery", deliveryMode: "Delivery", modes: { delivery: "Delivery", pickup: "Pick-up at the warehouse" },
      saveDraft: "Save (draft)", saveConfirm: "Save and confirm", confirm: "Confirm (reserve stock)", cancel: "Cancel the order", cancelMessage: "Cancel this order? The reserved stock is released.",
      deleteMessage: "Delete this draft?", delivered: "Delivered", toDeliver: "To deliver", makeBL: "Create a delivery note", blDraft: "Draft delivery note", blValidate: "Validated delivery note (stock out)",
      overrideHint: "Credit limit exceeded or account blocked: you may override.", override: "Confirm anyway", overrideReason: "Reason for the override",
    },
    delivery: {
      notes: "Delivery notes", one: "Delivery note", subtitle: "Picking, stock out, signed delivery, grouped invoicing.", new: "New delivery note", newReturn: "Customer return",
      return: "Return", returnHint: "Goods returned by the customer: they go back in stock when validated.", freeHint: "Delivery note without an order.",
      views: { toPlan: "To plan", toInvoice: "To invoice", draft: "To pick", validated: "Shipped", delivered: "Delivered", cancelled: "Cancelled" },
      status: { draft: "To pick", validated: "Out of stock", delivered: "Delivered", cancelled: "Cancelled" },
      round: "Round", invoiced: "invoiced", groupHint: "Tick delivery notes of one customer to group them on one invoice.", invoiceSelected: "Invoice the selection",
      validate: "Validate (stock out)", validateReturn: "Validate (back in stock)", markDelivered: "Mark delivered", invoice: "Invoice this note", valuedPdf: "Priced PDF",
      receivedBy: "Received by", reserves: "Customer remarks", cashCollected: "Cash collected", weight: "Weight", deliveredOn: "Delivered on",
      cancelMessage: "Cancel this delivery note? The goods go back in stock.", deleteMessage: "Delete this draft delivery note?",
    },
    rounds: {
      title: "Delivery rounds", one: "Round", subtitle: "One truck, one driver, one day: delivery notes in stop order.", new: "New round", zone: "Zone", vehicle: "Vehicle", driver: "Driver",
      stops: "Stops", stopsTitle: "Stop order", toPlan: "Notes to plan", nothingToPlan: "Nothing to plan.", saveStops: "Save the stops", start: "Departure (notes leave)", finish: "Close the round",
      delivered: "Delivered", status: { planned: "Planned", in_progress: "On the road", done: "Done", cancelled: "Cancelled" },
    },
    invoices: {
      creditReturn: "Credit note with return to stock", creditReturnHint: "The goods go back to the warehouse when the credit note is issued.", directHint: "Direct invoice: goods leave the stock when it is issued.",
      stock: "Stock", stockOnIssue: "leaves when issued", stockOut: "out", stockBack: "back in", chequeDue: "Cheque / bill due date",
    },
    pos: {
      title: "Point of sale", sessions: "Cash sessions", session: "Session", sessionsSubtitle: "Openings, closings (Z) and cash differences.", closedHint: "No open session: open the register with your float.",
      open: "Open the register", close: "Close", closeConfirm: "Close the register", store: "Store", register: "Register", openingFloat: "Opening float", tickets: "tickets", ticket: "Ticket",
      reprint: "Reprint", sessionDetail: "Detail / Z", cashOut: "Cash out", cashOutPrompt: "Amount taken from the drawer (bank deposit, expense…)",
      scanPlaceholder: "Scan or search an article (name, ref., barcode)", emptyCart: "Scan an article to start.", unitTTC: "Unit price incl. VAT", walkIn: "Walk-in customer",
      customerName: "Customer name (optional)", invoice: "Make an invoice", paid: "Paid", rest: "Put the rest here", change: "Change", missing: "Missing", checkout: "Checkout",
      methods: { especes: "Cash", carte: "Card", cheque: "Cheque", virement: "Transfer", credit: "On account" }, method: "Method", expected: "Expected", counted: "Counted", difference: "Difference",
      zReport: "Z report", printZ: "Print", opened: "Opened", cashier: "Cashier", cashMoves: "cash movements", time: "Time", payments: "Payments", refund: "Refund", refundReason: "Refund reason",
      maxAnonymous: "Above (incl. VAT), customer name required", ticketHeader: "Ticket header", ticketFooter: "Ticket footer",
      sessionStatus: { open: "Open", closed: "Closed" }, saleStatus: { completed: "Paid", refunded: "Refunded" },
    },
    reps: {
      title: "Sales reps", subtitle: "Monthly revenue, margin and collections per rep, targets and commissions.", period: "Month", invoiced: "Invoiced (excl. VAT)", target: "Target",
      collected: "Collected", commissions: "Commissions", commission: "Commission", marginRate: "Margin rate", newCustomers: "New customers", collectionTarget: "Collection target",
      rate: "Rate %", bonus: "Target bonus", defaultRate: "Default rate %", commissionBase: "Commission on", bases: { collected: "collected", invoiced: "invoiced", margin: "margin" },
      clickToSet: "Click a rep to set their monthly targets.",
    },
    collections: {
      title: "Collections", subtitle: "What each customer owes, oldest first; calls, visits, promises of payment.", toCollect: "To collect", customers: "customers", oldest: "Oldest",
      lastAction: "Last action", newAction: "New action", action: "Action", type: "Type", promiseDate: "Promised date",
      actions: { call: "Call", visit: "Visit", reminder: "Written reminder", promise: "Promise", dispute: "Dispute", note: "Note" },
    },
  },
  sidebar: { dashboard: "Dashboard", salesOrders: "Orders", pricing: "Price lists", collections: "Collections", reps: "Sales reps", articles: "Articles", stockLevels: "Stock per warehouse", stockMovements: "Movements", transfers: "Transfers", counts: "Stock counts", expiring: "Expiry", warehouses: "Warehouses & stores", brands: "Brands", articleCategories: "Families", pos: "Point of sale", posSessions: "Cash sessions", rounds: "Delivery rounds", stockMenu: "Stock", posMenu: "Point of sale", purchaseRequests: "Purchase requests" },
};

const ar = {
  ng: {
    brand: { tagline: "تجارة الجملة · المخزون · المبيعات · الصندوق" },
    menu: { dashboard: "لوحة القيادة", sales: "المبيعات", stock: "المخزون", pos: "الصندوق", logistics: "اللوجستيك", reps: "المندوبون" },
    articles: { title: "المواد", new: "مادة جديدة" },
    orders: { title: "طلبيات الزبناء", new: "طلبية جديدة" },
    delivery: { notes: "وصولات التسليم" },
    rounds: { title: "جولات التوصيل" },
    pos: { title: "الصندوق", sessions: "جلسات الصندوق", checkout: "تحصيل" },
    pricing: { title: "الأسعار" },
    reps: { title: "المندوبون التجاريون" },
    collections: { title: "التحصيل" },
    warehouses: { title: "المستودعات والمحلات" },
    transfers: { title: "التحويلات بين المستودعات" },
    counts: { title: "الجرد" },
    dashboard: { title: "لوحة القيادة", hello: "مرحبا" },
  },
  sidebar: { dashboard: "لوحة القيادة", salesOrders: "الطلبيات", pricing: "الأسعار", collections: "التحصيل", reps: "المندوبون", articles: "المواد", stockLevels: "المخزون حسب المستودع", stockMovements: "الحركات", transfers: "التحويلات", counts: "الجرد", expiring: "انتهاء الصلاحية", warehouses: "المستودعات", brands: "العلامات", articleCategories: "الأصناف", pos: "الصندوق", posSessions: "جلسات الصندوق", rounds: "الجولات", stockMenu: "المخزون", posMenu: "الصندوق", purchaseRequests: "طلبات الشراء" },
};


// Card catalogue (familles → articles) and the article shortcuts.
const catalog = {
  fr: {
    labels: {
      button: "Étiquettes", title: "Imprimer des étiquettes code-barres",
      hint: "Choisissez les articles et le nombre d'étiquettes. Les articles sans code reçoivent un code-barres maison (EAN-13), lisible tout de suite à la caisse.",
      search: "Ajouter un article : nom, référence, code-barres…", empty: "Aucun article. Cherchez-en un ci-dessus, ou ouvrez une famille avant de cliquer sur « Étiquettes ».",
      newCode: "code créé à l'impression", copies: "Nombre d'étiquettes", asStock: "Une étiquette par article en stock",
      format: "Format", roll: "Rouleau thermique 40 × 30 mm (imprimante d'étiquettes)", a4: "Planche A4 de 24 étiquettes 70 × 37 mm (imprimante bureau)",
      skip: "Cases déjà utilisées", print: "Imprimer {n} étiquette(s)",
    },
    subtitle: "Familles, articles en photo, stock, prix d'achat fournisseurs et prix de vente.",
    cards: "Cartes", table: "Tableau", allFamilies: "Toutes les familles", subFamilies: "Sous-familles", articlesCount: "articles", subFamiliesCount: "sous-familles",
    state: { ok: "En stock", low: "Stock bas", out: "Rupture" }, reservedShort: "réservé", publicTtc: "prix public TTC",
    request: "Demande d'achat", buyPrices: "Prix fournisseurs", sellPrices: "Prix de vente",
    requestTitle: "Demande d'achat", requestSent: "Demande d'achat envoyée aux achats.", inStock: "En stock", quantity: "Quantité demandée", notes: "Note pour les achats", notesHint: "Urgence, client en attente, fournisseur souhaité…",
    send: "Envoyer la demande", cancel: "Annuler", close: "Fermer",
    supplierTitle: "Prix d'achat chez tous les fournisseurs", supplier: "Fournisseur", catalogPrice: "Prix catalogue", lastOrder: "Dernière commande", lastQuote: "Dernier devis", gap: "Écart",
    best: "Meilleur prix", ref: "réf.", days: "j", orders: "commande(s)", noSupplier: "Aucun fournisseur n'a encore de prix pour cet article.", htPer: "prix HT par",
    sellingTitle: "Nos prix de vente", level: "Niveau", margin: "Marge", origin: { article: "prix de l'article", markup: "CMUP + marge du niveau", public: "prix public", none: "pas de prix" },
    photo: "Photo", photoUrl: "Lien de la photo (https://…)", photoUpload: "Téléverser une photo", photoRemove: "Retirer la photo", photoSaved: "Photo enregistrée.",
  },
  en: {
    labels: {
      button: "Labels", title: "Print barcode labels",
      hint: "Choose the articles and how many labels each. Articles without a code get an in-store barcode (EAN-13) that scans at the till right away.",
      search: "Add an article: name, reference, barcode…", empty: "No article yet. Search one above, or open a family before clicking “Labels”.",
      newCode: "code created when printing", copies: "Number of labels", asStock: "One label per unit in stock",
      format: "Format", roll: "Thermal roll 40 × 30 mm (label printer)", a4: "A4 sheet of 24 labels 70 × 37 mm (office printer)",
      skip: "Positions already used", print: "Print {n} label(s)",
    },
    subtitle: "Families, articles with pictures, stock, supplier buying prices and selling prices.",
    cards: "Cards", table: "Table", allFamilies: "All families", subFamilies: "Sub-families", articlesCount: "articles", subFamiliesCount: "sub-families",
    state: { ok: "In stock", low: "Low stock", out: "Out of stock" }, reservedShort: "reserved", publicTtc: "public price incl. VAT",
    request: "Purchase request", buyPrices: "Supplier prices", sellPrices: "Selling prices",
    requestTitle: "Purchase request", requestSent: "Purchase request sent to purchasing.", inStock: "In stock", quantity: "Requested quantity", notes: "Note for purchasing", notesHint: "Urgency, customer waiting, preferred supplier…",
    send: "Send the request", cancel: "Cancel", close: "Close",
    supplierTitle: "Buying prices from every supplier", supplier: "Supplier", catalogPrice: "Catalogue price", lastOrder: "Last order", lastQuote: "Last quote", gap: "Gap",
    best: "Best price", ref: "ref.", days: "d", orders: "order(s)", noSupplier: "No supplier has a price for this article yet.", htPer: "prices excl. VAT per",
    sellingTitle: "Our selling prices", level: "Level", margin: "Margin", origin: { article: "article price", markup: "avg. cost + level markup", public: "public price", none: "no price" },
    photo: "Picture", photoUrl: "Picture link (https://…)", photoUpload: "Upload a picture", photoRemove: "Remove the picture", photoSaved: "Picture saved.",
  },
  ar: {
    labels: {
      button: "الملصقات", title: "طباعة ملصقات الباركود",
      hint: "اختر السلع وعدد الملصقات لكل واحدة. السلع التي ليس لها رمز تحصل على باركود خاص بالمحل (EAN-13) يُقرأ في الصندوق مباشرة.",
      search: "أضف سلعة: الاسم، المرجع، الباركود…", empty: "لا توجد سلع. ابحث عن سلعة أعلاه، أو افتح صنفا قبل الضغط على « الملصقات ».",
      newCode: "رمز يُنشأ عند الطباعة", copies: "عدد الملصقات", asStock: "ملصق لكل وحدة في المخزون",
      format: "الحجم", roll: "لفافة حرارية 40 × 30 مم (طابعة ملصقات)", a4: "ورقة A4 من 24 ملصقا 70 × 37 مم (طابعة عادية)",
      skip: "خانات مستعملة", print: "طباعة {n} ملصق",
    },
    cards: "بطاقات", table: "جدول", allFamilies: "كل الأصناف", request: "طلب شراء", buyPrices: "أسعار الموردين", sellPrices: "أسعار البيع",
    requestTitle: "طلب شراء", supplierTitle: "أسعار الشراء لدى الموردين", sellingTitle: "أسعار البيع", close: "إغلاق", cancel: "إلغاء", send: "إرسال",
    state: { ok: "متوفر", low: "مخزون منخفض", out: "نفد" },
  },
};

// Stock par dépôt: warehouse cards, stock cards.
const levels = {
  fr: {
    subtitle: "Choisissez un dépôt : ce qu'il contient, ce qui est à réassortir, et où se trouve chaque article.",
    allWarehouses: "Tous les dépôts", articlesInStock: "articles en stock", toRestock: "à réassortir", outOfStock: "en rupture", value: "valeur",
    store: "Magasin", warehouse: "Dépôt", counter: "comptoir", inStock: "En stock", all: "Tous", low: "Sous le minimum",
    here: "Dans ce dépôt", total: "Stock total", minimum: "min.", elsewhere: "Ailleurs", reserved: "réservé", available: "disponible",
    nowhere: "Aucun stock", emptyHere: "Rien à afficher pour ce dépôt avec ces filtres.", perWarehouse: "Répartition",
    minHint: "Minimum de ce dépôt (vide = pas de minimum) : en dessous, l'article apparaît « à réassortir ».",
    noneLow: "Rien à réassortir", noneLowHint: "Aucun article n'est sous son minimum ici. Le minimum d'un dépôt se règle sur la fiche article (stock par dépôt).",
  },
  en: {
    subtitle: "Pick a warehouse: what it holds, what needs restocking, and where each article is.",
    allWarehouses: "All warehouses", articlesInStock: "articles in stock", toRestock: "to restock", outOfStock: "out of stock", value: "value",
    store: "Store", warehouse: "Warehouse", counter: "counter", inStock: "In stock", all: "All", low: "Below minimum",
    here: "In this warehouse", total: "Total stock", minimum: "min.", elsewhere: "Elsewhere", reserved: "reserved", available: "available",
    nowhere: "No stock", emptyHere: "Nothing to show for this warehouse with these filters.", perWarehouse: "Breakdown",
    minHint: "This warehouse's minimum (empty = none): at or below it, the article shows as \"to restock\".",
    noneLow: "Nothing to restock", noneLowHint: "No article is below its minimum here. A warehouse's minimum is set on the article page (stock per warehouse).",
  },
  ar: { allWarehouses: "كل المستودعات", inStock: "متوفر", all: "الكل", low: "تحت الحد الأدنى", toRestock: "للتزويد" },
};

// Dashboard › Analyses.
const analytics = {
  fr: {
    title: "Analyses", subtitle: "Calculées sur vos factures, avoirs, tickets et votre stock au CMUP — les chiffres qui pilotent un négoce.",
    refresh: "Recalculer", inProgress: "en cours", showTable: "Voir en tableau", showChart: "Voir le graphique",
    tone: { critical: "Urgent", warning: "Attention", good: "Bonne nouvelle", info: "À savoir" },
    projection: "Fin de mois projetée", toDate: "À ce jour", dayOf: "jour {d}/{n}", lastMonth: "Mois dernier", vsLastMonth: "vs mois dernier",
    cashCycle: "Cycle de trésorerie", days: "jours", daysShort: "j", cashCycleHint: "Temps qu'un dirham passe en stock puis chez le client avant de revenir en caisse.",
    dio: "En stock", dso: "Chez le client", gmroiHint: "DH de marge brute rapportés par an par DH de stock (au CMUP).",
    margin12: "Marge 12 mois", ofSales: "de", receivables: "À encaisser",
    sales12: "Ventes HT sur 12 mois", sales12Hint: "Factures et avoirs (B2B) et tickets de comptoir. Le mois en cours est en clair.",
    b2b: "Revendeurs & pros (factures)", counter: "Comptoir (tickets)", month: "Mois", total: "CA HT",
    marginRate: "Taux de marge", marginRateHint: "Marge brute / CA HT, au coût réel (CMUP) de chaque vente.",
    abc: "Analyse ABC de la marge", abcHint: "{a} articles font 80 % de la marge sur les {n} vendus en 12 mois : à ne jamais laisser en rupture.",
    classA: "80 % — classe A", articlesShare: "Articles", marginShare: "Marge cumulée", class: "Classe", ofMargin: "de la marge",
    families: "Familles", familiesHint: "CA HT 12 mois et taux de marge par famille.",
    stockAge: "Âge du stock", stockAgeHint: "Valeur du stock selon la dernière vente de chaque article.", lastSale: "Dernière vente",
    age: { active: "< 90 jours", slow: "90 j – 1 an", dormant: "> 1 an", never: "Jamais vendu" },
    aging: "Créances par ancienneté", agingHint: "Montants TTC restant dus, selon le retard sur l'échéance.", overdueBy: "Retard", due: "Restant dû", invoices: "Factures",
    agingBucket: { notDue: "Non échu", d30: "1–30 j", d60: "31–60 j", d90: "61–90 j", d90plus: "> 90 j" },
    stockouts: "Ruptures prévues", stockoutsHint: "{n} article(s) à court de stock d'ici 21 jours au rythme des ventes des 90 derniers jours.",
    noStockout: "Aucune rupture prévue dans les 3 semaines.", outOn: "rupture le", reorder: "commander",
    reps: "Commerciaux — objectif du mois", repsHint: "Réalisé, projection à fin de mois et objectif.", target: "Objectif", done: "Réalisé", projectedShort: "Projection", ofTarget: "de l'objectif",
    asOf: "Calculé le",
  },
  en: {
    title: "Analytics", subtitle: "Computed from your invoices, credit notes, tickets and stock at average cost — the figures that steer a wholesale business.",
    refresh: "Recompute", inProgress: "in progress", showTable: "Show as table", showChart: "Show chart",
    tone: { critical: "Urgent", warning: "Watch out", good: "Good news", info: "Good to know" },
    projection: "Projected month end", toDate: "To date", dayOf: "day {d}/{n}", lastMonth: "Last month", vsLastMonth: "vs last month",
    cashCycle: "Cash cycle", days: "days", daysShort: "d", cashCycleHint: "Time a dirham spends in stock, then at the customer, before coming back as cash.",
    dio: "In stock", dso: "At the customer", gmroiHint: "Gross margin earned per year for each dirham of stock (at average cost).",
    margin12: "12-month margin", ofSales: "of", receivables: "To collect",
    sales12: "Sales (excl. VAT), 12 months", sales12Hint: "Invoices and credit notes (B2B) and counter tickets. The current month is lighter.",
    b2b: "Resellers & trade (invoices)", counter: "Counter (tickets)", month: "Month", total: "Sales excl. VAT",
    marginRate: "Margin rate", marginRateHint: "Gross margin / sales, at each sale's real cost.",
    abc: "ABC analysis of margin", abcHint: "{a} articles make 80% of the margin out of {n} sold in 12 months: never let them run out.",
    classA: "80% — class A", articlesShare: "Articles", marginShare: "Cumulative margin", class: "Class", ofMargin: "of margin",
    families: "Families", familiesHint: "12-month sales and margin rate per family.",
    stockAge: "Stock age", stockAgeHint: "Stock value by each article's last sale.", lastSale: "Last sale",
    age: { active: "< 90 days", slow: "90 d – 1 yr", dormant: "> 1 year", never: "Never sold" },
    aging: "Receivables by age", agingHint: "Amounts still due (incl. VAT), by days past the due date.", overdueBy: "Overdue", due: "Due", invoices: "Invoices",
    agingBucket: { notDue: "Not due", d30: "1–30 d", d60: "31–60 d", d90: "61–90 d", d90plus: "> 90 d" },
    stockouts: "Forecast stockouts", stockoutsHint: "{n} article(s) running out within 21 days at the last 90 days' sales pace.",
    noStockout: "No stockout expected within 3 weeks.", outOn: "out on", reorder: "order",
    reps: "Sales reps — this month's target", repsHint: "Done, projected month end and target.", target: "Target", done: "Done", projectedShort: "Projected", ofTarget: "of target",
    asOf: "Computed on",
  },
  ar: { title: "التحليلات", refresh: "إعادة الحساب" },
};

// Assistant Sanity (in-app help).
const assistantTexts = {
  fr: {
    button: "Assistant", open: "Ouvrir l'assistant", title: "Assistant Sanity", online: "IA · répond à partir du guide Sanity", offline: "Guide hors ligne (IA non configurée)",
    hello: "Bonjour {name} 👋", intro: "Demandez-moi comment faire quelque chose dans Sanity : je vous indique le menu et les étapes. Je ne vois pas les données de votre entreprise.",
    placeholder: "Comment… ? (Entrée pour envoyer)", send: "Envoyer", stop: "Arrêter", reset: "Nouvelle conversation", close: "Fermer",
    error: "L'assistant n'a pas pu répondre.", note: "L'assistant peut se tromper : vérifiez les étapes à l'écran.",
    q: {
      dashCycle: "Que veut dire le cycle de trésorerie ?", dashGmroi: "Comment lire le GMROI ?", dashAbc: "À quoi sert l'analyse ABC ?",
      artCreate: "Comment créer un article avec des cartons ?", artPhoto: "Comment ajouter une photo à un article ?", artSupplier: "Où voir les prix de tous les fournisseurs ?",
      lvlRestock: "Pourquoi un article est « à réassortir » ?", lvlMin: "Comment fixer le minimum d'un dépôt ?", lvlTransfer: "Comment transférer du stock vers le showroom ?",
      stockCount: "Comment faire un inventaire ?", stockTransfer: "Comment faire un transfert entre dépôts ?", stockCmup: "Comment est calculé le CMUP ?",
      orderCreate: "Comment créer une commande client ?", orderCredit: "Pourquoi ma commande est bloquée (plafond de crédit) ?", orderBl: "Comment livrer une commande en plusieurs BL ?",
      invPay: "Comment enregistrer un règlement par chèque ?", invCredit: "Comment corriger une facture émise ?", invGroup: "Comment facturer plusieurs BL ensemble ?",
      salesLevels: "Comment fonctionnent les niveaux de prix ?", salesCollect: "Comment suivre une promesse de paiement ?",
      posOpen: "Comment ouvrir la caisse ?", posMixed: "Comment encaisser en espèces et carte ?", posClose: "Comment clôturer la caisse (rapport Z) ?",
      logRound: "Comment préparer une tournée de livraison ?", logBl: "Comment marquer un BL livré ?",
      purOrder: "Comment passer une commande fournisseur ?", purReceive: "Comment réceptionner avec des lots ?", purRequest: "Comment traiter une demande d'achat ?",
      hrPayslip: "Où trouver mes bulletins de paie ?", hrLeave: "Comment demander un congé ?", hrPayroll: "Comment lancer la paie du mois ?",
      rights: "Pourquoi je ne vois pas les prix d'achat ?",
    },
  },
  en: {
    button: "Assistant", open: "Open the assistant", title: "Sanity Assistant", online: "AI · answers from the Sanity guide", offline: "Offline guide (AI not configured)",
    hello: "Hello {name} 👋", intro: "Ask me how to do something in Sanity: I'll show you the menu and the steps. I can't see your company's data.",
    placeholder: "How do I…? (Enter to send)", send: "Send", stop: "Stop", reset: "New conversation", close: "Close",
    error: "The assistant couldn't answer.", note: "The assistant can make mistakes: check the steps on screen.",
    q: {
      dashCycle: "What does the cash cycle mean?", dashGmroi: "How do I read GMROI?", dashAbc: "What is the ABC analysis for?",
      artCreate: "How do I create an article sold by the carton?", artPhoto: "How do I add a picture to an article?", artSupplier: "Where can I see every supplier's price?",
      lvlRestock: "Why is an article \"to restock\"?", lvlMin: "How do I set a warehouse's minimum?", lvlTransfer: "How do I transfer stock to the showroom?",
      stockCount: "How do I run a stock count?", stockTransfer: "How do I transfer between warehouses?", stockCmup: "How is the average cost computed?",
      orderCreate: "How do I create a customer order?", orderCredit: "Why is my order blocked (credit limit)?", orderBl: "How do I deliver an order in several delivery notes?",
      invPay: "How do I record a cheque payment?", invCredit: "How do I correct an issued invoice?", invGroup: "How do I invoice several delivery notes together?",
      salesLevels: "How do price levels work?", salesCollect: "How do I follow up a payment promise?",
      posOpen: "How do I open the till?", posMixed: "How do I take cash and card together?", posClose: "How do I close the till (Z report)?",
      logRound: "How do I plan a delivery round?", logBl: "How do I mark a delivery note as delivered?",
      purOrder: "How do I place a supplier order?", purReceive: "How do I receive goods with lots?", purRequest: "How do I handle a purchase request?",
      hrPayslip: "Where are my payslips?", hrLeave: "How do I request leave?", hrPayroll: "How do I run this month's payroll?",
      rights: "Why can't I see purchase prices?",
    },
  },
  ar: { button: "المساعد", title: "مساعد Sanity", close: "إغلاق", send: "إرسال" },
};

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== "object") target[k] = {};
      deepMerge(target[k], v);
    } else target[k] = v;
  }
  return target;
}

export function mergeSanityTranslations(translations) {
  if (translations.fr) deepMerge(translations.fr, fr);
  if (translations.en) deepMerge(translations.en, en);
  if (translations.ar) deepMerge(translations.ar, ar);
  for (const lang of ["fr", "en", "ar"]) if (translations[lang]) deepMerge(translations[lang], { ng: { catalog: catalog[lang], levels: levels[lang], analytics: analytics[lang], assistant: assistantTexts[lang] } });
  return translations;
}
