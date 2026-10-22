# Dossier CNDP — Loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel

> **Projet à valider par un avocat marocain.** Les formulaires officiels (déclaration normale, demande d'autorisation, demande d'autorisation de transfert) sont disponibles et se déposent en ligne sur **www.cndp.ma**. Ce document prépare leur contenu ; il ne remplace pas les formulaires.

**Éditeur de la plateforme** : [À COMPLÉTER : raison sociale] — [forme juridique] au capital de [montant] MAD — siège : [adresse] — ICE [À COMPLÉTER] — RC [À COMPLÉTER] — IF [À COMPLÉTER]
**Contact données personnelles** : [nom, fonction] — [e-mail dédié, ex. donnees@votre-domaine.ma]

---

## 1. Qui est responsable de quoi

| Rôle (loi 09-08) | Qui | Pour quels traitements |
|---|---|---|
| **Responsable du traitement** | **Vous** (l'éditeur) | Vos propres traitements : prospects et clients de la plateforme, facturation des abonnements, comptes d'accès, journaux de sécurité et de supervision, support (partie A). |
| **Sous-traitant** (art. 23) | **Vous**, pour le compte de chaque client | Tout ce que vos clients enregistrent dans Sanity : salariés et paie, clients et fournisseurs du client, commerciaux, livraisons, portail revendeurs… |
| **Responsable du traitement** | **Chaque client** (l'entreprise qui utilise Sanity) | Ses propres traitements (partie B) : c'est **à lui** de les déclarer à la CNDP. Vous lui fournissez le kit de la partie B. |

Conséquence pratique : vous déclarez la **partie A** ; vous signez avec chaque client l'**accord de sous-traitance** (document 03) ; chaque client déclare la **partie B** (avec votre aide).

---

## 2. Partie A — Traitements dont l'éditeur est responsable (à déclarer par vous)

### A1. Gestion des clients et prospects, facturation des abonnements

| Rubrique | Contenu |
|---|---|
| Finalités | Prospection commerciale B2B ; gestion des contrats d'abonnement ; facturation, encaissement et recouvrement ; suivi de la relation client. |
| Personnes concernées | Dirigeants et interlocuteurs des entreprises clientes et prospects. |
| Données | Identité (nom, prénom, fonction), coordonnées professionnelles (e-mail, téléphone), données de l'entreprise (raison sociale, ICE, IF, RC, adresse), données de facturation et de paiement (montants, dates, références de virement / chèque), historique des échanges. **Aucune donnée de carte bancaire n'est conservée.** |
| Base légale | Exécution du contrat ; obligations légales comptables et fiscales ; intérêt légitime (prospection B2B). |
| Destinataires | Personnel habilité de l'éditeur ; expert-comptable ; administration fiscale sur demande. |
| Durée de conservation | Prospects : 3 ans après le dernier contact. Clients : durée du contrat + 5 ans. Pièces comptables (factures) : **10 ans** (art. 22 du Code de commerce). |
| Transfert hors du Maroc | Selon l'hébergeur choisi — voir section 5. |

### A2. Comptes d'accès à la plateforme, sécurité et supervision

| Rubrique | Contenu |
|---|---|
| Finalités | Authentification des utilisateurs ; gestion des droits ; sécurité (journal d'audit, limitation des tentatives de connexion, double authentification) ; supervision technique (journal des erreurs) ; sauvegardes. |
| Personnes concernées | Utilisateurs de la plateforme (salariés des clients, utilisateurs du portail revendeurs, personnel de l'éditeur). |
| Données | Identifiants (e-mail), mot de passe **haché** (bcrypt, jamais conservé en clair), rôle et droits, horodatage des actions sensibles (journal d'audit), adresse IP (limitation de débit, non conservée durablement), journal d'erreurs techniques (message, page, navigateur — **sans le contenu des formulaires**), conservé **90 jours**. |
| Base légale | Exécution du contrat ; intérêt légitime (sécurité du service). |
| Durée de conservation | Comptes : durée du contrat. Journal d'audit : [À COMPLÉTER, ex. 1 an]. Erreurs : 90 jours (suppression automatique). Sauvegardes : [14] jours glissants (paramètre `BACKUP_KEEP_DAYS`). |

### A3. Support et assistance

| Rubrique | Contenu |
|---|---|
| Finalités | Répondre aux demandes des clients, diagnostiquer les incidents. |
| Données | Identité et coordonnées du demandeur, contenu de la demande ; accès ponctuel aux données du client **uniquement sur sa demande et pour la résoudre** (tracé). |
| Durée | 3 ans après la clôture de la demande. |

---

## 3. Partie B — Kit de déclaration pour vos clients (responsables du traitement)

Remettez cette partie à chaque client, avec le nom de son interlocuteur CNDP. Chaque ligne correspond à un module de Sanity ; le client ne déclare que les modules qu'il utilise.

| Module | Finalité | Personnes concernées | Données | Points d'attention |
|---|---|---|---|---|
| **RH et paie** | Gestion du personnel, paie, déclarations CNSS / AMO / IR (Simpl-IR, Damancom), congés, absences, avances, contrats, évaluations, sanctions | Salariés, anciens salariés | Identité, CIN, n° CNSS, situation familiale et nombre de personnes à charge (calcul de l'IR), RIB, salaire et éléments de paie, ancienneté, absences, documents RH | **Les arrêts maladie avec justificatif médical sont des données de santé** (données sensibles) : cela relève de l'**autorisation** préalable de la CNDP, pas d'une simple déclaration — à faire valider. Conservation des éléments de paie : délais légaux sociaux et fiscaux [À VALIDER]. |
| **Pointage / présence** | Gestion des horaires et heures supplémentaires | Salariés | Heures d'arrivée et de départ, retards | Pas de biométrie dans Sanity. Informer les salariés (art. 5). |
| **Gestion commerciale** | Ventes, devis, factures, recouvrement, relances | Clients et prospects du client (personnes physiques : commerçants, artisans, installateurs), contacts des clients personnes morales | Identité, coordonnées, ICE, historique d'achats, encours, chèques et effets (n°, banque, échéance) | — |
| **Achats / fournisseurs** | Commandes, réceptions, factures fournisseurs | Contacts des fournisseurs | Identité, coordonnées professionnelles | — |
| **Application terrain** (commerciaux) | Organisation des tournées, prise de commande, **visites géolocalisées** | Commerciaux salariés | Position GPS **au moment d'enregistrer une visite ou une commande** (pas de suivi continu) | **Géolocalisation des salariés** : la CNDP encadre spécifiquement ce traitement (finalité, information préalable, pas de suivi en dehors du temps de travail, durée de conservation limitée). Déclaration / autorisation à faire valider. |
| **Livraisons** (chauffeurs) | Preuve de livraison | Chauffeurs ; personnes qui réceptionnent la marchandise | Nom du réceptionnaire, **signature manuscrite numérisée**, **photo** de la livraison, position GPS | Informer le réceptionnaire au moment de la signature. Éviter les photos de personnes. |
| **Portail revendeurs** | Commandes en ligne des revendeurs, consultation de leurs factures | Utilisateurs désignés par les revendeurs | Identité, e-mail, mot de passe haché, commandes | Publier la politique de confidentialité sur la page de connexion. |
| **WhatsApp** (si activé) | Envoi de factures, relevés et relances | Clients du client | N° WhatsApp, contenu des messages, liens vers les PDF | Avec l'API WhatsApp Business : **transfert vers Meta** (section 5). Sans l'API, Sanity prépare seulement des liens wa.me : rien ne passe par les serveurs de Meta via Sanity. |
| **Assistant IA** (si activé) | Répondre aux questions des utilisateurs sur les chiffres de l'entreprise | Toute personne dont les données figurent dans les chiffres demandés | Les questions posées et les données nécessaires à la réponse (ex. ventes d'un client) | **Transfert vers Anthropic (États-Unis)** (section 5). L'assistant respecte les droits de l'utilisateur qui pose la question. À activer seulement après accord écrit du client. |

Dans chaque déclaration, le client indique **l'éditeur de Sanity comme sous-traitant** (destinataire technique) et les sous-traitants ultérieurs (annexe 1 du document 03).

---

## 4. Sécurité (à reprendre dans les formulaires — rubrique « mesures de sécurité »)

Mesures **effectivement en place** dans la plateforme (détail : `docs/SECURITY.md`) :

- **Cloisonnement entre clients** appliqué centralement à chaque requête en base, vérifié par un test automatisé qui attaque toutes les routes de l'application avec les identifiants d'un autre client.
- **Contrôle d'accès par rôle et par droit**, appliqué côté serveur sur chaque route.
- **Mots de passe hachés** (bcrypt) ; **double authentification** disponible ; limitation des tentatives de connexion ; sessions à durée limitée.
- **Chiffrement en transit** (HTTPS / TLS, HSTS) et **au repos** (chiffrement du stockage par l'hébergeur de la base [À VÉRIFIER selon l'offre choisie]).
- En-têtes de sécurité HTTP ; documents partagés par **liens signés et expirants**.
- **Journal d'audit** des actions sensibles ; journal d'erreurs technique sans le contenu des formulaires (90 jours).
- **Sauvegardes quotidiennes vérifiées**, **test de restauration hebdomadaire automatique**, copie hors du serveur de production [À COMPLÉTER : où].
- Accès du personnel de l'éditeur aux données des clients limité au support, sur demande, et tracé.
- Tests automatisés à chaque modification du code (intégration continue).

---

## 5. Transferts de données hors du Maroc (art. 43 et 44)

La loi n'autorise le transfert vers un État étranger que s'il assure un **niveau de protection suffisant**. À défaut, il faut une **autorisation de la CNDP** ou l'une des exceptions de l'article 44 (notamment le consentement exprès de la personne, ou la nécessité pour l'exécution d'un contrat).

| Prestataire | Rôle | Localisation des données | Statut à prévoir |
|---|---|---|---|
| [À COMPLÉTER : ex. MongoDB Atlas] | Base de données | [Région UE, ex. Francfort / Paris / Irlande] | Pays de l'UE : généralement considérés comme adéquats — **vérifier la liste à jour de la CNDP** |
| [À COMPLÉTER : ex. Render / Railway / OVH] | Serveur d'application | [Région] | Idem |
| Cloudflare, Inc. (Cloudflare R2) | Fichiers (photos, PDF, documents RH) | UE (buckets créés en « Europe ») | Si hors UE ou Maroc : autorisation de transfert |
| [À COMPLÉTER : fournisseur SMTP] | E-mails | [Région] | Idem |
| Meta Platforms (WhatsApp Business API) | Messages WhatsApp — **si le module est activé** | Union européenne / États-Unis | **Autorisation de transfert** à demander ou exception art. 44 ; à défaut, utiliser le mode liens wa.me |
| Anthropic PBC (API Claude) | Assistant IA — **si le module est activé** | États-Unis | **Autorisation de transfert** à demander ou exception art. 44. Vérifier les conditions commerciales d'Anthropic en vigueur (non-utilisation des données de l'API pour l'entraînement, durée de conservation). |

**Option la plus simple** : héberger base, serveur et fichiers **au Maroc** ou dans l'**UE**, et n'activer WhatsApp API et l'assistant que pour les clients qui l'ont accepté par écrit, une fois l'autorisation de transfert obtenue.

---

## 6. Droits des personnes (art. 7 à 9)

Accès, rectification, opposition. **Procédure** :
1. La personne écrit à son employeur ou au fournisseur concerné (le client, responsable du traitement), ou à l'éditeur, qui transmet au client sous **48 h**.
2. Le client répond dans le délai légal. L'éditeur l'aide : export des données d'une personne, rectification, suppression (sauf obligations légales de conservation, ex. paie, factures).
3. Chaque demande est notée dans le registre.

---

## 7. Points à valider par l'avocat

1. Régime **déclaration ou autorisation** pour chaque traitement de la partie B, en particulier : arrêts maladie (données de santé), géolocalisation des commerciaux, signature et photo des réceptionnaires.
2. Pays d'hébergement retenus et **liste d'adéquation** de la CNDP à jour ; demandes d'autorisation de transfert (Anthropic, Meta, autres prestataires hors UE).
3. Durées de conservation des éléments de paie et des documents RH.
4. Mentions d'information des salariés (art. 5) — modèle de note interne à fournir aux clients.
5. Si un client est un **organisme public ou une infrastructure d'importance vitale**, exigences complémentaires de la **loi n° 05-20 relative à la cybersécurité** et de la DGSSI.
