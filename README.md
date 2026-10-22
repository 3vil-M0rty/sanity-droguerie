# Sanity — plateforme de négoce

Sanity est une plateforme de gestion pour les **négociants / grossistes** (quincaillerie, sanitaire,
électricité, peinture…) qui achètent et revendent sans fabriquer — le modèle d'un distributeur comme
Smart Way qui sert un réseau de revendeurs, des installateurs et des clients de comptoir.

Elle remplace complètement le module « menuiserie aluminium » de l'ancienne plateforme **xframe**
(châssis, profilés, ateliers, débit, projets, suivi chantier). Le code xframe est conservé dans
[`archive/xframe-legacy/`](archive/xframe-legacy) (et dans l'historique git) ; il n'est plus chargé
par l'application.

Les modules transverses de xframe sont conservés : **multi-sociétés / multi-clients**, **droits fins**,
**Achats & fournisseurs**, **RH & paie** (CNSS, IR, congés, pointage), notifications, PDF, traductions
fr / en / ar.

---

## Ce que fait Sanity

### Stock (multi-dépôts)
- **Dépôts & magasins** : dépôt principal, dépôts régionaux, showroom avec comptoir.
- **Articles** : famille › sous-famille, **marque**, référence interne, **code-barres EAN**, référence fabricant,
  unité de base et **conditionnements** (carton de 12, palette de 40 sacs… chacun avec son code-barres),
  **variantes** (un modèle → « chromé », « noir mat », 1/2", 3/4"…), poids, stock mini / maxi, TVA.
- **Catalogue en cartes** : familles → sous-familles → cartes articles avec **photo** (téléversée ou lien ; à défaut
  une illustration aux couleurs de la famille), état du stock, prix public TTC, et sur chaque carte :
  **Demande d'achat**, **Prix fournisseurs** (prix catalogue, dernière commande et dernier devis de chaque fournisseur,
  meilleur prix en tête, écart en %) et **Prix de vente** (chaque niveau HT / TTC, au carton, marge). Vue tableau en un clic.
- **Traçabilité** : aucune, **par lot** (avec **date de péremption** : peintures, colles, silicones) ou **par
  n° de série** (chauffe-eau, outillage). Les sorties prennent les lots en **FEFO** (premier périmé, premier sorti).
- **CMUP** : le coût moyen pondéré est recalculé à chaque réception d'achat ; chaque sortie (BL, ticket,
  facture directe) garde son coût → **marge réelle** par document, par commercial, par mois.
- Stock **par dépôt**, **réservé** (commandes confirmées) et **disponible** ; **mouvements** avec leur document
  d'origine ; **transferts inter-dépôts** (envoi → transit → réception, écarts renvoyés) ;
  **inventaires** (quantités théoriques figées, saisie du compté, validation → ajustements au CMUP) ;
  **péremptions** ; **valorisation** du stock (écran + Excel).

### Catalogue de 100 000+ articles : le navigateur ne reçoit jamais le catalogue
Principe : **interroger moins, transférer moins, afficher moins**.

| Couche | Ce qui se passe |
|---|---|
| MongoDB | recherche, filtres, tri, pagination et comptage côté base, sur index préfixés par `company` |
| API | une page (≤ 100, 50 par défaut) de **lignes légères** : champs de la liste + vignette ; la fiche complète est `GET /products/:id` |
| Navigateur | une page à la fois (24 cartes / 50 lignes), cache court des pages vues, page suivante préchargée |

- **Recherche indexée** (`utils/searchTokens.js`) : chaque article garde des `searchTokens` normalisés (mots sans accents,
  références entières / compactées / par segment, codes-barres et leurs 4 à 8 derniers chiffres, réf. fournisseurs).
  Une saisie devient des préfixes ancrés (`^chrom`) sur l'index `{ company, searchTokens }` — rapide quel que soit le volume,
  sans moteur externe. Les articles existants sont indexés au démarrage du serveur (ou `npm run reindex:products`).
- **Liste** `GET /api/products?page&limit&search&category&brand&supplier&unit&status&stockStatus&warehouse` →
  `{ data, pagination: { total, page, limit, pages, hasNext, hasPrevious } }`, sans prix fournisseurs, traductions, notes,
  photo pleine taille ; `limit` plafonné à 100.
- **Sélecteurs d'articles** (commandes, devis, factures, BL, transferts, bons de commande, demandes de prix) :
  recherche serveur (`/products/suggestions`, ≤ 20 résultats, saisie temporisée 300 ms) ; les articles déjà sur un
  document sont relus en un appel (`/products/brief?ids=`, ≤ 100). Plus aucun écran ne télécharge le catalogue.
- **Stock par dépôt** : cartes des dépôts (articles en stock, **à réassortir**, valeur — agrégés par MongoDB), puis les
  articles du dépôt choisi en cartes (photo, quantité ici, minimum, jauge, où est le reste du stock) ou en tableau.
  Filtres « en stock » / « sous le minimum », pagination, total et valeur calculés dans MongoDB. Chaque dépôt a son
  **propre minimum** par article (fiche article › stock par dépôt) ; le minimum général de l'article vaut pour la société.
- **Images** : vignette (`image.thumbUrl`, 160 px pour une photo téléversée) dans les listes, chargée en différé ;
  la photo complète seulement sur la fiche article.
- Pas de liste virtualisée : une page (≤ 50 lignes) se rend instantanément ; le volume reste dans la base.

### Tableau de bord — Analyses (ce qui distingue Sanity)
Calculées par MongoDB sur les documents eux-mêmes (factures, avoirs, tickets, stock au CMUP), réservées aux comptes qui
voient les montants, limitées à ses propres clients pour un commercial :
- **Constats automatiques** en langage clair, classés par urgence, chacun menant à l'écran où agir : rythme du mois,
  marge qui glisse, ruptures prévues, stock qui dort, factures échues, cycle de trésorerie, GMROI, commerciaux en retard,
  famille la moins marginée.
- **Fin de mois projetée** (au rythme du mois, vs mois dernier) · **Cycle de trésorerie** = jours de stock (DIO) + jours
  de crédit client (DSO) · **GMROI** (marge annuelle par dirham de stock) · marge 12 mois.
- **Ventes HT sur 12 mois** par canal (factures / comptoir) et **taux de marge** au coût réel de chaque vente.
- **Analyse ABC de la marge** (courbe de Pareto, classes A/B/C, top articles) · **familles** (CA et taux de marge).
- **Âge du stock** selon la dernière vente (< 90 j, 90 j–1 an, > 1 an, jamais vendu) et les articles dormants les plus lourds.
- **Créances par ancienneté** · **ruptures prévues** sous 21 jours au rythme des 90 derniers jours (date, quantité à commander)
  · **commerciaux** : réalisé, projection, objectif.
- Chaque graphique a sa vue tableau ; couleurs validées (daltonisme, contraste) en thème clair et sombre.

### Assistant Sanity (aide intégrée)
Bouton « Assistant » en bas à droite de chaque écran : on demande « comment… ? », il répond avec le chemin de menu et les
étapes, en tenant compte de la page ouverte et des droits du compte (suggestions de questions par écran, conversation gardée
pendant la session). Réponses de **Claude** (modèle `claude-opus-5-5`, en streaming) fondées sur le guide
`backend/config/assistantGuide.md` (mis en cache côté API) ; il ne voit **aucune donnée de l'entreprise** et ne peut rien
modifier. Sans clé `ANTHROPIC_API_KEY`, il répond avec les sections du guide correspondantes (mode hors ligne).
Pour l'enrichir : compléter le guide (sections `## …`).

### Ventes (revendeurs B2B, installateurs, entreprises)
- **Clients** : code, type (revendeur, installateur, entreprise/BTP, particulier), **niveau de prix**,
  remise client, **commercial attitré**, **plafond de crédit**, blocage, **circuit documentaire**
  (*commande → BL → facture* ou *facture directe* — « les deux selon le client »), zone / jours de livraison,
  dépôt par défaut, relevé de compte.
- **Tarifs** : plusieurs **niveaux de prix** (P1 Revendeur, P2 Gros/installateur, P3 Détail, P4 Comptoir — modifiables).
  Prix d'un article pour un niveau = son prix propre, sinon **CMUP × (1 + marge du niveau)**, sinon son prix public.
  Tarif par niveau exportable en Excel ; mise à jour en masse (CMUP + x % ou prix actuel ± x %) ;
  prix plancher / vente sous le prix de revient bloquée sauf responsable.
- **Devis** → **commande client** (réservation du stock, contrôle du plafond de crédit avec dérogation tracée)
  → **BL** partiels (sortie de stock au CMUP, lots) → **facture groupant un ou plusieurs BL** ;
  ou **facture directe** qui sort le stock à l'émission. **Avoirs** avec ou sans **retour en stock**,
  retours clients (BR). Numérotation légale sans trou, PDF (devis, commande, BL chiffré ou non, facture).
- **Encaissements** (virement, chèque / effet avec échéance, espèces, carte, compensation), créances
  par ancienneté, TVA collectée.

### Commerciaux terrain
- **Chacun ses clients** : un commercial ne voit que ses clients et leurs documents
  (sauf droit « voir tous les clients »).
- **Objectifs mensuels** (CA, encaissement, nouveaux clients), **commissions** sur l'encaissé, le facturé ou
  la marge, prime d'objectif.
- **Recouvrement** : ce que doit chaque client, du plus ancien au plus récent ; appels, visites, relances,
  **promesses de paiement**, litiges ; alertes quotidiennes des factures échues au commercial.

### Caisse (comptoir / showroom)
- **Sessions de caisse** : ouverture avec fond de caisse, sorties d'espèces, clôture avec comptage
  par mode de paiement → **rapport Z** et **écart de caisse**.
- Écran de caisse : **scan code-barres** (article ou carton), recherche, prix du niveau comptoir,
  **paiements mixtes** (espèces + carte + chèque…), **rendu monnaie**, vente **en compte** pour un client connu
  (facture générée), **ticket 80 mm imprimé**, remboursement.

### Logistique
- **BL** à préparer / sortis / livrés / à facturer ; livraison signée (réceptionnaire, réserves, espèces encaissées).
- **Tournées** : un véhicule, un chauffeur, une date, des arrêts ordonnés ; le départ sort les BL du stock,
  la clôture enregistre livré / non livré ; poids chargé.

### Achats & fournisseurs (conservé de xframe, adapté)
Demandes d'achat, demandes de prix, bons de commande avec approbation, **réceptions dans un dépôt choisi**
(saisie des lots / n° de série), retours, factures et règlements fournisseurs, réassort, rapports.
Le **prix d'achat de chaque réception alimente le CMUP**.

### RH & paie (conservé de xframe)
Employés, contrats, salaires, paie marocaine (CNSS, AMO, IR), déclarations (Damancom, virements, Simpl-IR),
absences, congés, pointage, évaluations, organigramme, espace personnel.

### Nouveautés (détail et mise en service : `docs/OWNER-GUIDE.md`)
- **Facture électronique DGI** prête : fichier UBL 2.1, contrôle des mentions (ICE, IF, RC, taux légaux), transmission en simulation ou vers la plateforme (DGI / prestataire agréé), automatique à l'émission.
- **Comptabilité & TVA** : export des écritures (CSV, Sage 100, Excel) au Plan Comptable Marocain, déclaration de TVA encaissements / débits.
- **Import Excel** des articles, clients et stock d'ouverture, avec vérification ligne par ligne avant import.
- **WhatsApp** : factures, relevés et relances (manuelles ou automatiques), PDF par lien signé.
- **Frais d'approche** sur les réceptions (fret, douane, transitaire…) répartis dans le CMUP, même après coup.
- **Application terrain** `/m` (hors ligne) : commandes et visites GPS des commerciaux, preuve de livraison signée et photographiée.
- **Portail revendeurs** `/portail` : catalogue au tarif du revendeur, commandes en ligne, factures, solde.
- **Chèques & LCN** : portefeuille, bordereaux de remise, encaissés, impayés.
- **Promotions datées et remises de fin d'année** par paliers.
- **Prévision d'achat** : un clic transforme les ruptures prévues en bons de commande par fournisseur.
- **Calcul du salaire base ↔ net** dans le formulaire Salaires : saisissez le net négocié, Sanity trouve le salaire de base au centime (même calcul que la paie : ancienneté, indemnités exonérées, CNSS, AMO, frais pro, IR 2025-2026, charges de famille 600 DH en 2026).
- **Primes du mois et commissions** : prime exceptionnelle, Aïd, 13e mois… ajoutées au bulletin d'un seul mois ; import des commissions des commerciaux dans la paie ; simulation brut ↔ net d'une prime.
- **Offres et tarifs** : Essentiel 1 490 / Pro 2 990 / Entreprise 5 990 MAD HT par mois (annuel = 2 mois offerts), mise en service 9 900 / 19 900 / 39 000 MAD HT, options ; grille tarifaire PDF imprimable (`docs/Sanity-Grille-tarifaire.pdf`, ou depuis la plateforme).
- **Exploitation** : facturation de vos clients (offres, abonnements, factures numérotées, impayés, suspension automatique levée au paiement), suivi des erreurs avec alertes, sauvegardes vérifiées et testées par restauration, CI GitHub, sécurité (`docs/SECURITY.md`) et dossier juridique à faire valider (`docs/legal/`).
- **Assistant sur vos chiffres** : « qu'a acheté Al Amal ce trimestre ? », « quels articles baissent ? » — dans la limite des droits de chacun.

### Tableau de bord
CA du jour / du mois, marge, comptoir, encours clients et échus, valeur du stock, commandes à préparer,
BL à livrer / à facturer, articles sous le minimum, lots bientôt périmés.

---

## Rôles prêts à l'emploi (Organisation › Rôles & permissions)

| Profil | Accès |
|---|---|
| Directeur commercial | toutes les ventes, tous les clients, objectifs & commissions, dérogations crédit |
| ADV (administration des ventes) | commandes, BL, factures, encaissements, tous les clients |
| Commercial(e) terrain | ses clients, devis, commandes, encaissements, recouvrement, ses résultats |
| Caissier(ère) / Responsable caisse | caisse, sessions (remboursements pour le responsable) |
| Chef de dépôt / Magasinier | articles, stock, transferts, inventaires, préparation des BL, réceptions |
| Responsable logistique / Chauffeur | BL, tournées / livraisons |
| Acheteur | achats, fournisseurs |
| RH (assistant → directeur) | module RH & paie |

Les montants sensibles (CMUP, prix d'achat, marges) sont masqués aux logins qui n'ont pas
« Voir les montants » (magasin, chauffeurs, caisse).

Départements prédéfinis : Commercial (`sales`), Magasin & Dépôts (`warehouse`), Comptoir & Showroom (`pos`),
Logistique, Achats, RH… (Organisation › Départements › « Ajouter les départements par défaut »).

---

## Démarrage

Prérequis : Node.js 18+ et MongoDB (local ou Atlas).

```bash
# backend
cd backend
cp .env.example .env          # MONGODB_URI, JWT_SECRET, CORS_ORIGINS…
npm install
npm run seed                  # données de démo « Smart Way Distribution » (12 mois d'historique)
npm run dev                   # http://localhost:5000

# frontend
cd ../frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

`npm run unseed` retire la démo (et seulement elle).

### Comptes de démonstration (`npm run seed`)

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Admin | admin@sanity.test | Admin@123 |
| Gérant / propriétaire | direction@sanity.test | Direction@123 |
| Directeur commercial | commercial@sanity.test | Commercial@123 |
| Commercial terrain (Casablanca) | karim@sanity.test | Karim@123 |
| Commerciale terrain (Sud) | leila@sanity.test | Leila@123 |
| ADV | adv@sanity.test | Adv@123 |
| Caissier showroom | caisse@sanity.test | Caisse@123 |
| Chef de dépôt | magasin@sanity.test | Magasin@123 |
| Acheteuse | achats@sanity.test | Achats@123 |
| Responsable logistique | logistique@sanity.test | Logistique@123 |
| Chauffeur | chauffeur@sanity.test | Chauffeur@123 |
| Directrice RH | rh@sanity.test | Rh@123 |
| Comptable (TVA, écritures, chèques & LCN) | comptable@sanity.test | Comptable@123 |
| **Portail revendeur** (sur `/portail`) | revendeur@sanity.test | Revendeur@123 |

Pour repartir de zéro : `npm run unseed && npm run seed` (dans `backend/`).

### Sanity Droguerie — l'édition pour les petites boutiques

La même plateforme avec une interface simplifiée pour les drogueries et quincailleries de quartier :
- **Ma boutique** comme accueil ;
- **le carnet** (crédit des clients, encaissement, rappel WhatsApp) ;
- **l'achat rapide** (stock, facture fournisseur et paiement en un écran) ;
- l'**article divers** à la caisse ;
- l'option « non assujetti à la TVA » ;
- l'arabe complet.

Offres à 199 et 349 MAD HT par mois. Guide complet : `docs/DROGUERIE.md`.

### Photos et documents : Cloudflare R2, avec un quota par client

Les photos et documents sont stockés sur Cloudflare R2 :
- les photos sont redimensionnées par le serveur ;
- les documents sont dans un espace privé, avec des liens qui expirent ;
- chaque client a un quota, que vous modifiez dans Plateforme › Clients.

Mise en place et coûts : `docs/OWNER-GUIDE.md` §11 c. Sans R2 configuré, les fichiers restent sur le disque du serveur (`backend/uploads`), ce qui convient au développement uniquement.

```bash
npm run seed:droguerie        # « Droguerie Al Baraka (démo) » : droguerie@sanity.test / Droguerie@123, vendeur@sanity.test / Vendeur@123
npm run unseed:droguerie
```

La démo contient : 3 sites (Dépôt Casablanca – Aïn Sebaâ, Showroom Casablanca, Dépôt Marrakech),
4 familles et 15 sous-familles, 15 marques, 38 articles (sanitaire, électricité, peinture, quincaillerie)
avec cartons, niveaux de prix, lots et n° de série, 8 fournisseurs, 12 clients (revendeurs, installateurs,
promoteurs), devis, commandes, BL, factures (dont une échue), une tournée planifiée, une session de caisse
ouverte avec des tickets, et les objectifs du mois des commerciaux.

Les fonctions avancées ont aussi leurs données de démo :

| Fonction | Où tester | Ce que le seed prépare |
|---|---|---|
| Facture électronique DGI | Facture émise → « Facture électronique » | Société avec ICE/IF/RC/RIB, mode simulation, 3 factures déjà validées |
| TVA & export comptable | Finance → Comptabilité (compte `comptable`) | Historique de factures et règlements sur plusieurs mois |
| Chèques & LCN | Finance → Portefeuille | Bordereaux de remise, effets encaissés, en portefeuille, remis, 1 chèque impayé |
| Frais d'approche | Achats → BC-AAAA-0002 (import Chine) | Fret, douane, transit répartis ; stock valorisé au coût de revient |
| Prévision d'achat | Achats → Prévision | 3 articles en rupture proche, fournisseurs avec délais |
| Promotions & RFA | Ventes → Promotions (`/sales/promotions`) | 4 promos (%, 10+1, prix promo, à venir) et un contrat RFA à paliers |
| WhatsApp | Client → Envoyer | Numéros WhatsApp, historique des envois, relances des clients en retard |
| App terrain | `/m` (karim@ / chauffeur@) | 22 visites GPS, commandes terrain, BL signés avec preuve de livraison |
| Portail revendeur | `/portail` (revendeur@) | Accès Quincaillerie Al Amal, commande en ligne en attente |
| Assistant | Bouton assistant | Répond sur les vrais chiffres de la démo |
| Import Excel | Bouton « Importer » sur Articles, Clients et Niveaux de stock | Fichiers d'exemple : `npm run demo:imports` → `docs/demo-imports/` (chaque fichier contient une ligne en erreur volontaire) |

---

## Tests

```bash
cd backend && npm test        # 557 tests (dont le parcours négoce complet : routes/negoce.flow.test.js)
cd frontend && npm test
```

Les tests d'intégration tournent sur un moteur MongoDB en mémoire (`backend/test/fakeMongo.js`) : vrais modèles,
vraies routes, vraie isolation entre clients.

---

## Architecture

- **Backend** : Node.js / Express / Mongoose. Isolation multi-clients appliquée à chaque requête
  (`services/tenantScope.js`), permissions fines par route (`config/routePermissions.js`,
  `config/permissionCatalog.js`).
  - `services/stockService.js` — **seul** code qui modifie le stock (CMUP, dépôts, lots FEFO, réservations, transferts, inventaires).
  - `services/pricingService.js` — niveaux de prix, prix client, planchers.
  - `services/salesFlowService.js` — portée commerciale, plafond de crédit, validation / annulation des BL, facturation des BL.
  - `services/salesRepService.js` — performances, commissions, recouvrement.
  - Routes négoce : `warehouses`, `brands`, `products`, `stock`, `customers`, `sales-settings`, `quotes`,
    `sales-orders`, `sales-invoices`, `logistics` (BL & tournées), `pos`, `sales-reps`, `dashboard`.
- **Frontend** : React 18 + Vite, pages négoce dans `src/pages/{stock,sales,pos,logistics,dashboard}`,
  API dans `src/services/negoceService.js`, traductions dans `src/config/i18n.sanity.js`.

- **Fonctions avancées** (voir `docs/OWNER-GUIDE.md` pour la mise en service, les services à payer et les coûts) :
  facturation électronique DGI (UBL 2.1, `utils/ublInvoice.js`, `services/einvoiceService.js`), écritures comptables et
  synthèse de TVA (`services/accountingService.js`), import Excel (`services/importService.js`), WhatsApp
  (`services/whatsappService.js`, `messagingService.js`), frais d'approche (`services/landedCost.js`), portefeuille
  chèques & LCN (`services/portfolioService.js`), promotions & RFA (`services/promotionService.js`), prévision d'achat
  (`services/replenishmentService.js`), application terrain hors ligne (`routes/field.js`, frontend `src/pages/field`,
  `/m`), portail revendeurs (`routes/portal.js`, frontend `src/pages/portal`, `/portail`), assistant sur les chiffres de
  l'entreprise (`services/assistantTools.js`). Pages bureau dans `src/pages/fx`, API dans `src/services/featuresService.js`,
  traductions dans `src/config/i18n.features.js`.
