# Accord de sous-traitance des données à caractère personnel

> **Projet à valider par un avocat marocain.** Annexe aux Conditions générales d'abonnement (document 02). Fondement : article 23 de la loi n° 09-08 (obligations du sous-traitant).

**Entre** le **Client** (responsable du traitement), identifié dans le bon de commande,
**et** [À COMPLÉTER : raison sociale de l'éditeur], ICE [À COMPLÉTER], ci-après « **le Sous-traitant** ».

---

## 1. Objet

Le Sous-traitant traite des données à caractère personnel **pour le compte du Client** et **sur ses instructions**, dans le seul but de fournir la plateforme Sanity et les services associés. Le présent accord fixe les obligations du Sous-traitant.

## 2. Description des traitements

| Élément | Description |
|---|---|
| Nature des opérations | Hébergement, stockage, consultation, calcul (paie, factures, statistiques), sauvegarde, restauration, envoi de documents (e-mail, WhatsApp si activé), suppression. |
| Finalités | Celles du Client, décrites dans ses déclarations CNDP (document 01, partie B) : gestion RH et paie, gestion commerciale, achats, stock, logistique, portail revendeurs, assistant IA (si activé). |
| Personnes concernées | Salariés et anciens salariés du Client ; clients, prospects et fournisseurs du Client (personnes physiques ou contacts) ; utilisateurs du portail revendeurs ; réceptionnaires des livraisons. |
| Catégories de données | Identité et coordonnées ; CIN ; n° CNSS ; situation familiale et personnes à charge ; RIB ; éléments de salaire ; absences, **y compris arrêts maladie (données de santé, si le Client les saisit)** ; données commerciales (commandes, factures, encours, chèques et effets) ; position GPS au moment d'une visite ou d'une livraison ; signature numérisée et photo de livraison ; identifiants de connexion. |
| Durée | Durée du contrat, puis restitution et suppression (article 10). |

## 3. Instructions du Client

Le Sous-traitant ne traite les données que sur **instruction documentée** du Client : le contrat, la configuration de la Plateforme par le Client et ses demandes écrites. Il informe le Client si une instruction lui paraît contraire à la loi.

## 4. Confidentialité

Le personnel du Sous-traitant autorisé à accéder aux données est soumis à une obligation de confidentialité. L'accès aux données d'un Client n'a lieu que pour le support, à la demande du Client, ou pour la sécurité et la continuité du service ; il est **tracé**.

## 5. Sécurité

Le Sous-traitant met en œuvre les mesures techniques et organisationnelles décrites en **annexe 2**, adaptées aux risques, et les maintient à jour.

## 6. Sous-traitants ultérieurs

6.1. Le Client autorise le recours aux sous-traitants ultérieurs listés en **annexe 1**.
6.2. Le Sous-traitant informe le Client par écrit **[30] jours** avant tout ajout ou remplacement. Le Client peut s'y opposer pour un motif raisonnable lié à la protection des données ; à défaut d'accord, il peut résilier le contrat sans frais.
6.3. Le Sous-traitant impose à ses sous-traitants des obligations de protection équivalentes et reste responsable de leur exécution envers le Client.
6.4. Les fonctions faisant intervenir **Meta (WhatsApp Business API)** et **Anthropic (assistant IA)** ne sont activées que sur **demande écrite du Client**. Sans activation, aucune donnée ne leur est transmise par la Plateforme.

## 7. Transferts hors du Maroc

Les transferts vers les pays indiqués en annexe 1 sont réalisés dans le respect des articles 43 et 44 de la loi n° 09-08. Le Client, responsable du traitement, sollicite le cas échéant l'**autorisation de transfert de la CNDP** ; le Sous-traitant lui fournit toutes les informations nécessaires (prestataires, pays, garanties).

## 8. Assistance au Client

Le Sous-traitant aide le Client, par des moyens techniques appropriés, à :
- répondre aux demandes d'**accès, de rectification et d'opposition** des personnes concernées (art. 7 à 9) : toute demande reçue directement est transmise au Client sous **48 heures** ;
- remplir ses obligations de sécurité et ses formalités auprès de la CNDP (kit du document 01).

## 9. Violation de données

9.1. Le Sous-traitant notifie au Client toute violation de données à caractère personnel le concernant **dans les 48 heures** après en avoir pris connaissance, en indiquant : la nature de la violation, les catégories et le nombre approximatif de personnes et d'enregistrements concernés, les conséquences probables, les mesures prises ou proposées, et un contact.
9.2. Il prend sans délai les mesures pour limiter la violation et en éviter le renouvellement, et documente l'incident.

## 10. Fin du contrat : restitution et suppression

10.1. Pendant **[30] jours** après la fin du contrat, le Client peut exporter l'intégralité de ses données (exports Excel ; export complet JSON sur demande).
10.2. Ensuite, le Sous-traitant supprime les données de la base de production dans les **[30] jours** ; elles disparaissent des sauvegardes au terme de leur cycle de conservation (**[14] jours**). Il confirme la suppression par écrit sur demande.
10.3. Exception : données que le Sous-traitant doit conserver pour ses propres obligations légales (ex. ses factures au Client).

## 11. Audits

Le Sous-traitant met à disposition du Client les informations nécessaires pour démontrer le respect du présent accord : description des mesures de sécurité, synthèse du dernier **audit de sécurité indépendant**, résultats des tests de restauration. Le Client peut faire réaliser un audit **une fois par an**, à ses frais, par un auditeur tenu au secret, avec un préavis de [30] jours, sans perturber le service ni accéder aux données des autres clients.

## 12. Responsabilité

La responsabilité de chaque partie au titre du présent accord suit les règles et le plafond de l'article 13 des Conditions générales.

---

## Annexe 1 — Sous-traitants ultérieurs

| Sous-traitant | Service | Données concernées | Localisation | Activation |
|---|---|---|---|---|
| [À COMPLÉTER : ex. MongoDB, Inc. — MongoDB Atlas] | Base de données (stockage chiffré) | Toutes | [Région UE : à préciser] | Toujours |
| [À COMPLÉTER : ex. Render / Railway / OVHcloud] | Serveur d'application | Toutes (en transit) | [Région] | Toujours |
| Cloudflare, Inc. (Cloudflare R2) | Stockage de fichiers (photos d'articles, documents RH, preuves de livraison, PDF) | Fichiers | UE (buckets créés en « Europe ») | Toujours |
| [À COMPLÉTER : fournisseur SMTP] | Envoi d'e-mails (bons de commande, factures) | Adresses e-mail, contenu des e-mails et pièces jointes | [Région] | Si l'e-mail est configuré |
| Meta Platforms (WhatsApp Business API) | Envoi de messages WhatsApp (factures, relevés, relances) | N° de téléphone, contenu des messages, liens vers les documents | UE / États-Unis | **Sur demande écrite du Client** |
| Anthropic PBC (API Claude) | Assistant IA : réponses aux questions des utilisateurs | Questions posées et données de gestion nécessaires à la réponse, dans la limite des droits de l'utilisateur | États-Unis | **Sur demande écrite du Client** — conditions de conservation et de non-utilisation pour l'entraînement selon les conditions commerciales d'Anthropic en vigueur [à vérifier et à joindre] |

## Annexe 2 — Mesures de sécurité

**Cloisonnement et accès**
- Cloisonnement des données entre clients appliqué centralement à chaque requête en base de données ; vérifié par un **test automatisé qui attaque toutes les routes** de l'application avec les identifiants d'un autre client, exécuté à chaque modification du code.
- Contrôle d'accès par rôle et par droit, appliqué côté serveur sur chaque fonction ; journal d'audit des actions sensibles.
- Mots de passe hachés (bcrypt) ; double authentification disponible ; limitation des tentatives de connexion ; sessions à durée limitée ; comptes désactivés coupés immédiatement.

**Communications et application**
- HTTPS / TLS obligatoire (HSTS) ; en-têtes de sécurité (politique de sécurité du contenu, interdiction de l'intégration dans un cadre, nosniff) ; limitation du débit des requêtes.
- Documents partagés par **liens signés et expirants**.
- Messages d'erreur sans détail technique pour l'utilisateur ; journal d'erreurs sans le contenu des formulaires, supprimé après 90 jours.

**Disponibilité et intégrité**
- Sauvegardes quotidiennes vérifiées (empreinte du contenu de chaque collection) ; **test de restauration automatique hebdomadaire** ; copie hors du serveur de production [À COMPLÉTER : où, chiffrée].
- Supervision : alerte à la première occurrence de chaque nouvelle erreur ; surveillance de disponibilité [À COMPLÉTER : outil].
- Tests automatisés et contrôle des dépendances vulnérables à chaque modification du code.

**Organisation**
- Accès de production limité à [À COMPLÉTER : nombre] personnes nommément désignées, avec double authentification sur les consoles d'hébergement.
- Procédure de gestion des incidents et de notification (article 9).
- Audit de sécurité indépendant [annuel / avant la commercialisation] — voir `docs/SECURITY.md`.

---

### Points à valider par l'avocat

1. Conformité de l'accord à l'article 23 de la loi n° 09-08 et au modèle éventuellement recommandé par la CNDP.
2. Délais (48 h pour la notification de violation, 30 jours pour les sous-traitants, restitution, suppression).
3. Répartition des démarches de transfert international entre le Client et le Sous-traitant.
4. Pour les données de santé (arrêts maladie) : mesures supplémentaires exigées, le cas échéant, par la CNDP.
