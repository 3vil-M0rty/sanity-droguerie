# Guide d'utilisation de Sanity

Sanity est la plateforme de gestion d'un négociant / grossiste (quincaillerie, sanitaire, électricité, peinture) : stock multi-dépôts, ventes aux revendeurs et installateurs, comptoir (caisse), livraisons, commerciaux terrain, achats, RH & paie. Les menus sont dans la barre latérale gauche ; chacun ne voit que les menus et les boutons autorisés par ses droits (Organisation › Rôles & Permissions).

## Navigation et principes généraux
- Barre latérale : Tableau de bord, Organisation, Ressources humaines, Mon espace, Ventes, Caisse, Stock, Logistique, Achats, Aide & Support. Le bouton « < » la replie.
- En bas de la barre : déconnexion, thème clair / sombre (icône soleil / lune), langue (Français, English, العربية…).
- Plusieurs sociétés : un sélecteur « Entreprise » en haut des pages choisit la société affichée.
- Les montants sensibles (CMUP, prix d'achat, marges, valeur du stock) ne s'affichent qu'aux comptes qui ont le droit « Voir les montants » (finance.amounts.view). Un magasinier, un chauffeur ou un caissier ne les voit pas : c'est normal.
- Un message « Vous n'avez pas le droit : … » indique le droit manquant : le demander à son responsable ou à l'administrateur.
- Toutes les listes sont paginées et la recherche se fait côté serveur : taper un mot, un début de mot, une référence ou les derniers chiffres d'un code-barres.

## Tableau de bord
- Chemin : Tableau de bord (/dashboard).
- En haut : ventes du jour et du mois (HT), marge, comptoir du jour, à encaisser (dont en retard), valeur du stock au CMUP.
- « À traiter » : commandes à préparer, BL à livrer, BL à facturer, articles sous le minimum, lots bientôt périmés. Un clic ouvre la liste correspondante.
- « Analyses » (comptes qui voient les montants) : calculées sur les factures, avoirs, tickets et le stock au CMUP.
  - Les cartes « À retenir » : constats en langage clair (rythme du mois, baisse de marge, ruptures prévues, stock qui dort, factures échues, cycle de trésorerie, GMROI, commerciaux en retard). Un clic mène à l'écran où agir.
  - Fin de mois projetée : CA du mois au rythme actuel, comparé au mois dernier.
  - Cycle de trésorerie : jours de stock (DIO = valeur du stock / coût des ventes des 90 derniers jours × 90) + jours de crédit client (DSO = créances / ventes TTC des 90 derniers jours × 90). Plus il est court, moins il faut de trésorerie.
  - GMROI : marge brute des 12 derniers mois divisée par la valeur du stock au CMUP. 1,5 = chaque dirham de stock rapporte 1,5 DH de marge par an.
  - Ventes 12 mois : factures (revendeurs, pros) et tickets de comptoir par mois ; le mois en cours est en clair. Taux de marge : graphique séparé.
  - Analyse ABC : articles classés par marge des 12 derniers mois. Classe A = articles qui font 80 % de la marge (à ne jamais laisser en rupture), B = 15 % suivants, C = 5 % restants.
  - Familles : CA et taux de marge par famille. Âge du stock : valeur selon la dernière vente (moins de 90 jours, 90 jours à 1 an, plus d'un an, jamais vendu). Créances par ancienneté : restant dû par retard. Ruptures prévues : articles qui seront vides d'ici 21 jours au rythme des 90 derniers jours, avec la date et la quantité à commander. Commerciaux : réalisé, projection et objectif du mois.
  - Chaque graphique a un bouton « tableau » (icône grille) pour lire les chiffres. « Recalculer » force le calcul (sinon il est gardé 5 minutes).

## Articles (catalogue)
- Chemin : Stock › Articles (/stock/articles).
- Vue « Cartes » : d'abord les familles (Sanitaire, Électricité, Peinture, Quincaillerie…) puis les sous-familles, puis les articles avec photo, état du stock (En stock / Stock bas / Rupture), stock et prix public TTC. Le fil « Toutes les familles › … » remonte d'un niveau. Vue « Tableau » : une ligne par article.
- Recherche : nom, début de mot (« chrom » trouve « chromé »), référence (« GRO-ES »), code-barres ou ses derniers chiffres (« 4570 »), référence fournisseur. Filtres : marque, dépôt, « Sous le stock minimum ».
- Sur chaque carte, trois boutons :
  - Demande d'achat : quantité (proposée jusqu'au stock maximum) et note, envoyée au service achats (droit inventory.requests.create).
  - Prix fournisseurs : prix d'achat chez tous les fournisseurs (prix catalogue, dernière commande, dernier devis), le meilleur prix en tête et l'écart en %. Réservé aux comptes qui voient les montants.
  - Prix de vente : chaque niveau de prix (P1 Revendeur, P2 Gros/installateur, P3 Détail, P4 Comptoir) HT, TTC, au carton, avec l'origine du prix et la marge.
- Créer un article : bouton « Nouvel article ». Renseigner désignation, famille, marque, référence interne, code-barres, unité de base, conditionnements (Carton de 12, Palette…, chacun avec son code-barres), TVA, prix public HT, prix par niveau, prix plancher, stock minimum / maximum, traçabilité (aucune, par lot avec péremption, par n° de série). Un stock d'ouverture peut être saisi à la création.
- Photo : sur la fiche article, « Téléverser une photo » (réduite automatiquement) ou coller un lien https. « Retirer la photo » l'enlève. Sans photo, une illustration aux couleurs de la famille s'affiche.
- Variantes : cocher « Modèle avec variantes », puis saisir par exemple « Couleur: Chromé, Noir mat ; Taille: 1/2", 3/4" » et « Créer les variantes ».
- Entrée / sortie / correction de stock manuelle : boutons « Entrée », « Sortie », « Corriger (inventaire) » en haut de la fiche (droit inventory.articles.adjust).

## Stock par dépôt
- Chemin : Stock › Stock par dépôt (/stock/levels).
- Cartes des dépôts en haut (Tous les dépôts, Dépôt Casablanca, Dépôt Marrakech, Showroom…) : articles en stock, nombre « à réassortir », valeur. Cliquer une carte affiche ce dépôt ; cliquer le badge orange « à réassortir » montre directement ce qui est sous le minimum.
- Cartes articles : quantité dans le dépôt, minimum, jauge, réservé, disponible, et « Ailleurs : CASA 1 850 · MRK 500 » pour savoir d'où transférer. Pour « Tous les dépôts », des barres montrent la répartition.
- Filtres : En stock / Tous / Sous le minimum, famille, recherche. Vue tableau disponible. « Valorisation (Excel) » exporte le stock au CMUP.
- Minimum d'un dépôt : sur la fiche article, tableau « Stock par dépôt », colonne « Min. » (vide = pas de minimum). C'est ce minimum qui rend un article « à réassortir » dans ce dépôt. Le stock minimum de la fiche article vaut pour toute la société.

## CMUP, mouvements et traçabilité
- Le CMUP (coût moyen unitaire pondéré) est recalculé à chaque réception d'achat. Chaque sortie (BL, facture directe, ticket) garde son coût : la marge est réelle.
- Stock › Mouvements (/stock/movements) : chaque entrée / sortie avec son document d'origine.
- Lots et péremption : à la réception, saisir n° de lot et date de péremption. Les sorties prennent les lots qui périment en premier (FEFO). Stock › Péremptions (/stock/expiring) liste les lots bientôt périmés.
- N° de série : un numéro par unité, saisi à la réception et choisi à la sortie.

## Transferts entre dépôts
- Chemin : Stock › Transferts (/stock/transfers).
- « Nouveau transfert » : dépôt de départ, dépôt d'arrivée, articles (recherche par nom / référence / code-barres) et quantités. « Créer et envoyer » sort le stock du départ (en transit) ; le dépôt d'arrivée clique « Réceptionner » et saisit les quantités reçues (les écarts reviennent au départ).

## Inventaires
- Chemin : Stock › Inventaires (/stock/counts).
- Créer un inventaire (dépôt, famille éventuelle) : les quantités théoriques sont figées. Saisir le compté, enregistrer, puis « Valider » : les écarts deviennent des ajustements au CMUP.

## Familles, marques, dépôts
- Stock › Familles (/stock/families) : arbre famille › sous-famille, avec icône et couleur.
- Stock › Marques (/stock/brands).
- Stock › Dépôts & magasins (/stock/warehouses) : code, nom, type (dépôt ou magasin), comptoir, dépôt par défaut.

## Clients
- Chemin : Ventes › Clients (/sales/customers).
- Fiche : code, type (revendeur, installateur, entreprise/BTP, particulier), niveau de prix (P1…P4), remise, commercial attitré, plafond de crédit, délai de paiement, circuit documentaire (« complet » : commande → BL → facture, ou « direct » : facture directe), zone et jours de livraison, dépôt par défaut. Un client peut être bloqué (bouton « Bloquer », avec un motif) : plus de nouvelles commandes.
- Un commercial ne voit que ses clients (sauf droit « voir tous les clients »).

## Devis et commandes clients
- Devis : Ventes › Devis (/sales/quotes) › « Nouveau devis ». Un devis accepté se transforme en commande (bouton « Transformer en commande »).
- Commandes : Ventes › Commandes (/sales/orders) › « Nouvelle commande » (aussi depuis le tableau de bord). Choisir le client, le dépôt, puis les lignes.
- Lignes : chercher l'article dans le champ « Article » (tapez le nom, la référence ou le code-barres : les résultats viennent du serveur), ou scanner un code-barres (article ou carton) dans la zone de scan puis Entrée. Le prix du niveau du client et sa remise sont appliqués ; l'unité peut être la pièce ou un conditionnement (le prix suit). Le disponible du dépôt s'affiche sous l'article.
- « Enregistrer (brouillon) » ou « Enregistrer et confirmer ». La confirmation réserve le stock et contrôle le plafond de crédit (un responsable peut accorder une dérogation, tracée).

## Bons de livraison (BL)
- Depuis une commande confirmée : « Créer un BL » (quantités à livrer, livraison partielle possible), en brouillon ou validé. Ou Logistique › Bons de livraison (/logistics/delivery-notes) › nouveau BL.
- Valider le BL sort le stock au CMUP (lots FEFO). Le BL se marque livré (réceptionnaire, réserves, espèces encaissées). PDF chiffré ou non chiffré.
- « BL à facturer » : BL livrés pas encore facturés.

## Factures, avoirs et encaissements
- Ventes › Factures (/sales/invoices). Une facture peut regrouper un ou plusieurs BL du même client, ou être une facture directe (elle sort le stock à l'émission).
- La numérotation est légale et sans trou : une facture émise ne se modifie pas ; on fait un avoir (bouton « Faire un avoir », avec ou sans retour en stock).
- Encaissement : sur la facture, « Enregistrer un règlement » (virement, chèque / effet avec échéance, espèces, carte, compensation). Le statut passe à partiellement payée / payée.
- Ventes › Encaissements (/sales/receivables) : créances par ancienneté.

## Recouvrement et commerciaux
- Ventes › Recouvrement (/sales/collections) : ce que doit chaque client, du plus ancien au plus récent. Noter un appel, une visite, une relance, une promesse de paiement (date, montant) ou un litige.
- Ventes › Commerciaux (/sales/reps) : objectifs mensuels (CA, encaissement, nouveaux clients), commissions (sur l'encaissé, le facturé ou la marge) et prime. Cliquer un commercial pour fixer ses objectifs du mois.

## Tarifs
- Ventes › Tarifs (/sales/pricing) : niveaux de prix (P1 Revendeur, P2 Gros/installateur, P3 Détail, P4 Comptoir, modifiables) avec leur marge sur CMUP.
- Prix d'un article pour un niveau = son prix propre, sinon CMUP × (1 + marge du niveau), sinon le prix public.
- Export Excel du tarif par niveau ; mise à jour en masse (CMUP + x % ou prix actuel ± x %). Vente sous le prix plancher ou sous le coût bloquée sauf responsable.

## Caisse (comptoir / showroom)
- Ouvrir une session : Caisse › Caisse (/pos), saisir le fond de caisse puis « Ouvrir la caisse ».
- Vendre : scanner le code-barres (article ou carton) ou chercher l'article ; le prix du niveau comptoir s'applique. « Encaisser » : paiements mixtes (espèces + carte + chèque…), le rendu monnaie est calculé ; « = » remplit le reste. Ticket 80 mm imprimé. Vente « en compte » pour un client connu (une facture est générée).
- Sorties d'espèces pendant la session. Clôture : comptage par mode de paiement → rapport Z et écart de caisse. Caisse › Sessions de caisse (/pos/sessions). Remboursement d'un ticket par un responsable.

## Tournées de livraison
- Logistique › Tournées (/logistics/rounds) : date, véhicule, chauffeur, BL à livrer dans l'ordre. « Départ (sortie des BL) » sort les BL du stock ; « Clôturer la tournée » : saisir livré / non livré, réceptionnaire, espèces encaissées. Le poids chargé est calculé.

## Achats
- Demandes d'achat : venues du stock (bouton « Demande d'achat » d'un article) ; Achats › Demandes d'achat (/purchasing/requests) pour les traiter.
- Demandes de prix (/purchasing/price-requests) : envoyer aux fournisseurs, saisir les prix proposés, convertir en commande.
- Bons de commande (/purchasing/orders) › « Nouveau » : fournisseur, articles (recherche serveur), prix repris du prix fournisseur de l'article. Approbation si nécessaire. Réception dans un dépôt choisi, avec lots / n° de série : la réception met à jour le CMUP.
- Factures et règlements fournisseurs (/purchasing/invoices), réapprovisionnement (/purchasing/restock : propositions selon le stock minimum), rapports achats, fournisseurs, historique d'un article (/purchasing/article-history).

## Ressources humaines et paie
- Ressources humaines : employés, contrats, salaires, paie marocaine (CNSS, AMO, IR), déclarations (Damancom, virements, Simpl-IR), absences, congés et soldes, pointage (présence), évaluations, actions disciplinaires, organigramme, jours fériés, rapports, journal d'audit.
- Calcul du salaire (RH → Salaires → Ajouter un salaire / Augmentation) : choisir « Je connais le salaire de base » (→ net à payer) ou « Je connais le net à payer » (→ salaire de base à saisir, au centime près). Le calcul est celui de la paie : prime d'ancienneté automatique (5 % dès 2 ans, 10 % dès 5, 15 % dès 12, 20 % dès 20, 25 % dès 25, mesurée à la fin du mois de la date d'effet), CNSS 4,48 % plafonnée à 6 000, AMO 2,26 %, frais professionnels 35 % (brut imposable ≤ 6 500 / mois) ou 25 % plafonnés à 2 916,67, barème IR 2025-2026, réduction charges de famille (500 DH/an par personne en 2025, 600 DH en 2026, 6 personnes max).
- Indemnités non imposables : choisir le « Traitement » de chaque prime — transport (exonéré jusqu'à 500 DH/mois, 750 hors périmètre urbain), panier (2 × SMIG horaire par jour travaillé), représentation (10 % du salaire de base). Au-delà, l'excédent est imposable. Une ligne libellée « Prime d'ancienneté » saisie à la main remplace la prime automatique.
- Primes du mois (Paie → ouvrir le mois → Primes du mois) : primes versées une seule fois (prime exceptionnelle, Aïd, 13e mois, bilan, objectifs). Ajoutées au bulletin du mois avec CNSS, AMO et IR ; la paie brouillon est recalculée aussitôt ; un mois clôturé est verrouillé. « Importer les commissions » reprend les commissions des commerciaux (ce mois ou le mois précédent) ; le compte utilisateur du commercial doit être relié à sa fiche salarié.
- Simulation d'une prime exceptionnelle : dans le calcul du salaire, bloc « Prime exceptionnelle » — saisir le brut ou le net voulu ; affiche le brut à verser, la CNSS, l'AMO et l'IR dessus, ce que le salarié touche et le coût employeur.
- Mon espace : mon profil, mes bulletins de paie, mes absences, mes avances, ma présence, mon dossier, mon département.

## Organisation, utilisateurs et droits
- Organisation › Entreprise : informations légales, logo, préférences (thème par défaut…).
- Organisation › Utilisateurs : créer un compte, l'associer à un employé, un département et un rôle.
- Organisation › Rôles & Permissions : rôles prêts à l'emploi (Directeur commercial, ADV, Commercial terrain, Caissier, Responsable caisse, Chef de dépôt, Magasinier, Responsable logistique, Chauffeur, Acheteur, RH) et droits fins par action (voir, créer, modifier, supprimer, valider…). « Voir les montants » contrôle l'affichage des coûts et marges.
- Organisation › Départements : « Ajouter les départements par défaut » (Commercial, Magasin & Dépôts, Comptoir & Showroom, Logistique, Achats, RH…). Accès par département.
- Organisation › Horaires de travail.
- Sécurité : double authentification (2FA) dans le profil.

## Comptabilité, TVA et facture électronique
- Finance › Comptabilité & TVA (/finance/accounting). Onglet « Déclaration de TVA » : TVA collectée et déductible par taux sur la période, au régime des encaissements ou des débits, TVA à payer ou crédit ; bouton « Déclaration (Excel) ». À vérifier avec le comptable avant SIMPL-TVA.
- Onglet « Écritures comptables » : export des écritures (ventes, avoirs, tickets comptoir par jour, règlements, achats, chèques encaissés / impayés) en CSV, au format Sage 100 ou en Excel. Chaque écriture est équilibrée.
- Onglet « Paramètres » (droit Comptabilité › Paramétrer) : numéros de comptes (Plan Comptable Marocain par défaut), codes journaux, régime de TVA, facturation électronique (activer, simulation ou plateforme réelle, transmission automatique).
- Facture électronique DGI : sur une facture émise, encadré « Facture électronique » : ce qu'il faut corriger (ICE de l'entreprise, IF, RC, ICE du client B2B, taux de TVA légaux), bouton « Transmettre à la DGI », « Fichier UBL (XML) ». En simulation rien n'est réellement envoyé.

## Import Excel
- Bouton « Importer (Excel) » sur Stock › Articles, Ventes › Clients et Stock › Stock par dépôt (stock d'ouverture). 1. Télécharger le modèle, 2. choisir le fichier .xlsx, 3. lire la vérification ligne par ligne (créations, mises à jour, erreurs), 4. « Importer ». Rien n'est écrit avant l'étape 4. Les lignes en erreur sont ignorées.
- Articles : familles « Sanitaire > Robinetterie » créées automatiquement, conditionnements « Carton:6:code-barres », prix par niveau, prix d'achat fournisseur. Une cellule vide garde la valeur existante.
- Stock d'ouverture : article par référence ou code-barres (celui d'un carton multiplie la quantité), dépôt par code, coût unitaire (entre dans le CMUP), lot et péremption ou numéros de série.

## WhatsApp : factures, relevés, relances
- Sur une facture émise : bouton « WhatsApp ». Sur une fiche client : « Relevé (PDF) » et « Envoyer le relevé par WhatsApp ». Le PDF part sous forme de lien sécurisé.
- Ventes › Relances WhatsApp (/sales/reminders) : clients en retard (montant échu, plus ancienne échéance, dernière relance). Cocher puis « Relancer la sélection ». Onglets Historique et Relances automatiques (jours de retard, signature).
- Sans WhatsApp Business connecté, WhatsApp s'ouvre avec le message prêt : il reste à appuyer sur Envoyer ; si plusieurs clients sont relancés, « Ouvrir la relance suivante ». Les relances automatiques demandent WhatsApp Business.
- Numéro WhatsApp d'un client : champ « Numéro WhatsApp » de la fiche (sinon son téléphone). Décocher « Relances automatiques » pour un client qui ne doit pas en recevoir.

## Chèques et LCN (portefeuille)
- Finance › Chèques & LCN (/finance/portfolio). Un règlement par chèque ou effet sur une facture (avec échéance, banque, tireur) entre dans le portefeuille.
- Cocher des valeurs du même type puis « Remettre en banque » : bordereau de remise en PDF (LCN à l'encaissement ou à l'escompte). Un chèque ne peut pas être remis avant sa date.
- Encaissé : bouton ✓ sur la ligne ou « Tout encaissé » sur le bordereau. Impayé : bouton ✕, motif, frais, blocage du client possible ; le règlement est retiré de la facture qui redevient à payer, et le commercial est prévenu.

## Promotions et remises de fin d'année
- Ventes › Promotions & RFA (/sales/promotions). Une promotion a des dates, un type (remise %, prix promo, unités gratuites « 10 + 1 »), des articles / familles / marques, des clients (types, niveaux) et des canaux (ventes, comptoir). Elle s'applique toute seule aux devis, commandes, factures, à la caisse, à l'application terrain et au portail ; la ligne gratuite est ajoutée automatiquement.
- Remises de fin d'année : accord avec paliers (ex. 100 000 MAD → 1 %, 250 000 → 2 %). Cliquer l'accord pour voir chaque client : CA, palier atteint, ce qui manque pour le palier suivant. « Générer les avoirs » crée des avoirs brouillon à émettre dans Factures.

## Frais d'approche (achats importés)
- Sur un bon de commande, « Réceptionner » : section « Frais d'approche ». Taux de change si le prix est en devise, puis les frais (fret, douane, transitaire…) en montant ou en % de la valeur, répartis à la valeur, à la quantité ou au poids. Le tableau montre le coût de revient de chaque article ; il entre dans le CMUP.
- Facture du transitaire reçue après : sous la réception, « Ajouter des frais » ; le stock encore présent est revalorisé.

## Prévision d'achat
- Achats › Prévision d'achat (/purchasing/forecast) : articles qui vont manquer avant qu'une livraison puisse arriver (ventes des 90 derniers jours, stock, commandes en cours, délai du fournisseur), quantité conseillée arrondie au carton, fournisseur le moins cher. Ajuster puis « Créer les bons de commande » : un bon brouillon par fournisseur.
- Renseigner le délai de livraison de chaque fournisseur (Achats › Fournisseurs) pour une prévision juste.

## Application terrain (commerciaux et livreurs)
- Sur le téléphone, ouvrir l'adresse de Sanity suivie de /m, se connecter, puis « Ajouter à l'écran d'accueil ». Elle fonctionne sans réseau.
- Commercial : « Prendre une commande » (client, recherche ou code-barres, pièce ou carton, vérifier, enregistrer), « Noter une visite » (résultat, notes, prochaine visite, position GPS). Tout attend dans la « File d'envoi » et part au retour du réseau, sans doublon.
- Livreur : « Mes livraisons » : tournée du jour, chaque BL avec adresse et itinéraire ; nom de la personne qui reçoit, signature à l'écran, photo, réserves, espèces encaissées, « Confirmer la livraison ». La preuve apparaît sur le BL au bureau.
- Bureau : Ventes › Visites terrain (/sales/visits) : visites par commercial, avec commande, distance du client et carte.

## Portail revendeurs
- Ventes › Portail revendeurs (/sales/portal) : ouvrir le portail, choisir l'affichage du stock, minimum de commande, message d'accueil ; « Donner un accès » à un revendeur (e-mail, droits Commande ou Consultation) : le mot de passe provisoire s'affiche une seule fois, à transmettre (bouton WhatsApp).
- Le revendeur se connecte sur /portail : catalogue à son tarif (promotions comprises), panier, commandes, factures en PDF, solde. Ses commandes arrivent dans Ventes › Commandes en brouillon (source « en ligne ») et son commercial est prévenu.

## Assistant et chiffres de l'entreprise
- L'assistant peut répondre avec vos chiffres : « Qu'a acheté [client] ce trimestre ? », « Quels articles sont en baisse ? », « Qui me doit le plus ? », « Ventes par mois depuis janvier », « Que dois-je commander ? ». Il ne voit que ce que votre compte a le droit de voir et ne modifie rien.

## Questions fréquentes
- Je ne vois pas les prix d'achat / la marge : votre compte n'a pas « Voir les montants ». Demandez-le à l'administrateur.
- Je ne trouve pas un article : tapez le début d'un mot du nom, la référence ou les derniers chiffres du code-barres ; vérifiez le filtre de famille, de dépôt ou « Sous le stock minimum ».
- Pourquoi un article est « à réassortir » : sa quantité dans ce dépôt est au niveau ou sous le minimum de ce dépôt (colonne « Min. » de la fiche article).
- Pourquoi la commande est bloquée : le client dépasse son plafond de crédit ou est bloqué ; un responsable peut accorder une dérogation.
- Corriger une facture émise : faire un avoir (Ventes › Factures › la facture › « Faire un avoir »), puis une nouvelle facture.
- Le stock ne correspond pas : faire un inventaire (Stock › Inventaires) ou une correction depuis la fiche article ; consulter Stock › Mouvements pour l'historique.
- Changer de langue ou de thème : en bas de la barre latérale.
