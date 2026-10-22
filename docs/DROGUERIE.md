# Sanity Droguerie — the edition for small shops

Sanity Droguerie is Sanity for a neighbourhood **droguerie / quincaillerie**: one owner, one or two sellers, one counter, craftsmen who buy on credit and pay at the end of the week, and goods bought from wholesalers in Derb Omar or Garage Allal.

It runs on **the same engine** as Sanity: the same database, security, backups and updates. It only changes what the shop sees.

| | Sanity (wholesaler) | Sanity Droguerie (shop) |
|---|---|---|
| Home | Analytics dashboard | **Ma boutique**: big buttons, today's takings, the carnet, what I owe, what to reorder |
| Menu | ~60 pages (sales, reps, logistics, HR, finance…) | 7 entries: Boutique, Caisse, Carnet, Achats, Articles & stock, Ventes, Réglages |
| Credit customers | Invoices, receivables, collections | **Le carnet**: who owes what, collect in one tap (oldest debts first), WhatsApp reminder |
| Purchases | Purchase order → reception → supplier invoice → payment | **Achat rapide**: one screen; stock in at cost, supplier bill, amount paid now |
| Counter | POS | Same POS, plus **"Article divers"** (a key cut, tinted paint…: a description and a price, no stock) |
| VAT | VAT-registered | Option **"not subject to VAT"**: new articles at 0 %, prices TTC = HT |
| Languages | FR / EN / AR | FR / EN / **AR complete** on every shop screen |

## 1. Selling it to a client

1. Platform → **Abonnements & factures → Offres → "Charger le catalogue Sanity"**. This adds the **Droguerie** (199 MAD HT/month) and **Droguerie Plus** (349 MAD HT/month) plans next to Essentiel, Pro and Entreprise. Your own prices are never overwritten.
2. **"Grille Droguerie (PDF)"** prints the shop flyer: both plans, the options (extra user, hardware pack, on-site training) and the terms. To print it without a server: `npm run price-list -- --edition=droguerie` → `docs/Sanity-Droguerie-Grille-tarifaire.pdf`.
3. Create the client (Platform → Clients) and choose **Édition: Sanity Droguerie**. You can also put them on a Droguerie plan: **the plan sets the edition**. A Droguerie plan switches the client to the shop interface; a Sanity plan switches them back to the full ERP. Their data stays in place either way.
4. In the client's account: Réglages → Société (name, ICE if any), then Réglages → Tarifs → untick **"Assujetti à la TVA"** if the shop isn't subject to VAT (most small drogueries aren't). This is the `vatRegistered` setting.

### Photos and documents (storage)

Each shop's photos and documents are stored in **your Cloudflare R2 account**, in a folder of their own, and count against a quota:
- Droguerie: 1 GB. That is about 8,000 article photos, since the server resizes each one to about 100 KB.
- Droguerie Plus: 3 GB.

You can change any shop's quota in Platform → Clients → *Photos et documents* → **Modifier le quota**. Sell extra space with the "Stockage supplémentaire" option (+5 GB for 29 MAD/month). Setting up R2 and the full rules are in `docs/OWNER-GUIDE.md` §11 c.

## 2. The first day in the shop (½ day, included in the set-up fee)

- **Articles**: type them in with **Achat rapide** as the goods arrive. Each new name becomes an article with its selling price. For a large stock, use the Excel import (Articles & stock → Import).
- **Customers on credit**: Carnet → *Nouveau client* (name + phone).
- **The till**: Caisse → open with the cash float. Sell by scanning or by searching a name. Choose the customer and pay **"Crédit"** to put the sale on their carnet.
- **Seller account**: Réglages → Utilisateurs. Give the *Caissier* role plus "customers" and "payments" rights. The seller can sell, put a sale on credit and collect, but sees no purchase prices.
- **Hardware**: any USB barcode reader works (it types like a keyboard). Tickets print on any 80 mm printer through the browser.

## 3. Demo

```bash
cd backend
npm run seed:droguerie      # "Droguerie Al Baraka (démo)" — Hay Mohammadi, Casablanca
npm run unseed:droguerie    # removes it (and only it)
```

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Gérant (Si Hassan) | droguerie@sanity.test | Droguerie@123 |
| Vendeur (Ayoub) | vendeur@sanity.test | Vendeur@123 |

The demo contains:
- 61 articles in six families: peinture, quincaillerie, plomberie, électricité, entretien, outillage;
- three wholesalers, each part paid;
- six craftsmen and neighbours on the carnet;
- two weeks of counter sales, today's till still open;
- a few articles to reorder.

It is created through the real API, so it holds exactly what the shop screens would have created.

**A 5-minute demo script:**
1. *Ma boutique*: "Here's your day: takings, who owes you, what you owe, what to reorder."
2. *Caisse*: scan an article, add an **article divers**, sell **on credit** to Mustapha.
3. *Carnet*: Mustapha owes X. Tap **WhatsApp** and the reminder is ready to send. Tap **Encaisser** to record a payment.
4. *Achat rapide*: the wholesaler just delivered. Enter three lines, and "Payé maintenant: 500". Everything is in stock, and the rest is under *Fournisseurs à payer*.
5. Switch the language to **العربية**.

## 4. Where it is in the code

| What | File |
|---|---|
| Shop API (home, carnet, quick purchase, quick article, supplier payments) | `backend/routes/droguerie.js` (+ `droguerie.test.js`) |
| Edition flag | `Tenant.edition`, `Plan.edition` (set by the plan in `routes/billing.js`), `/api/users/me` → `edition` |
| Not subject to VAT | `SalesSettings.vatRegistered` |
| "Article divers" at the till | `routes/pos.js` (lines without an article keep their typed price), `frontend/src/pages/pos/Pos.jsx` |
| Shop pages | `frontend/src/pages/droguerie/` (Boutique, Carnet, Achat, Fournisseurs) |
| Shop menu | `frontend/src/components/Sidebar.jsx` (`shopMenu`) |
| Translations | `frontend/src/config/i18n.droguerie.js` |
| Plans, options, flyer | `backend/config/defaultCatalog.js` (`DROGUERIE_*`), `services/priceListPdf.js` |
| Demo | `backend/scripts/seedDroguerie.js` (+ test) |

## 5. Prospecting drogueries

They are not reached by e-mail. They are reached **on foot**: walk a street of shops (Derb Omar, Hay Mohammadi, Bab Doukkala…) with the flyer printed and the demo on a tablet or phone.

The pitch:

> « Votre carnet de crédit sur le téléphone, avec le rappel WhatsApp ; vous savez chaque soir ce que vous avez vendu, ce qu'on vous doit et ce que vous devez au grossiste. 199 DH par mois, un mois d'essai. »

Another way in is the **wholesalers**. One wholesaler who recommends Sanity Droguerie to the shops they supply is worth fifty visits. Offer them a referral month per shop that signs.
