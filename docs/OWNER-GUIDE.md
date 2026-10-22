# Sanity — owner's implementation guide

What you need to switch on, pay for and check before selling each of the new features. Everything works out of the box in **demo / simulation mode**, with no account and no cost, so you can demo the whole product today. This guide covers going live.

> Prices below are indicative (October 2026) and change often. Check each provider's pricing page before quoting a client. Amounts in MAD use ≈ 10 MAD per USD/EUR.

---

## 0. The 30-second view

| Feature | Works without paying? | What it needs to go live | Who pays |
|---|---|---|---|
| E-invoicing (DGI) | Yes, simulation | DGI access or a certified e-invoicing provider + the client's identifiers | Client (provider subscription), you integrate |
| Accounting export + VAT summary | **Yes, fully** | Nothing — the accountant checks the account numbers once | — |
| Excel import | **Yes, fully** | Nothing | — |
| WhatsApp | Yes (wa.me links, a person presses Send) | Meta WhatsApp Business Platform for direct sending and automatic reminders | Client (per-message fees to Meta) |
| Landed costs | **Yes, fully** | Nothing | — |
| Field app (reps, drivers) | **Yes, fully** | HTTPS on your domain; phones with Chrome/Safari | — |
| Reseller portal | **Yes, fully** | HTTPS; optional sub-domain `commande.client.ma` | — |
| Cheques & LCN | **Yes, fully** | Nothing | — |
| Promotions & rebates | **Yes, fully** | Nothing | — |
| Purchase forecast | **Yes, fully** | Suppliers' lead time filled in (Achats › Fournisseurs) | — |
| Assistant on the client's figures | Guide-only answers without a key | Anthropic API key | You (resell inside the subscription) |

Seven of the ten features cost nothing to run. The three that touch outside services — DGI, WhatsApp and the AI — are designed as plug-ins: if the key is missing they fall back to a working mode, never to an error.

---

## 1. Hosting and the base platform (needed for any client in production)

| Item | Recommended | Indicative cost |
|---|---|---|
| Backend (Node 22) | Render / Railway / a VPS (Hetzner, OVH, Contabo) with Docker or PM2 + Nginx | VPS 60–250 MAD/month; managed 70–250 MAD/month per instance |
| Database | MongoDB Atlas, region **eu-west (Paris/Frankfurt)**; M10 for production (backups, monitoring) | Flex ≈ 80–300 MAD/month; M10 ≈ 600 MAD/month (shareable by many tenants: Sanity is multi-tenant) |
| Frontend | Vercel / Netlify / the same VPS (static files) | 0–200 MAD/month |
| Domain + SSL | `.ma` via an ANRT-accredited registrar (Genious, Maroc Telecom…); SSL free with Let's Encrypt | ≈ 200–400 MAD/year |
| File storage (photos, scans, proofs of delivery) | **Cloudflare R2** (wired, with a quota per client — §11 c) | First 10 GB free, then ≈ 0.015 USD (≈ 0.15 MAD) per GB per month; no download fees |
| E-mail (invoices, purchase orders) | Brevo, Mailjet, or Google Workspace SMTP | 0–250 MAD/month |
| Backups | Atlas backups + a weekly `mongodump` to another provider | included / ≈ 50 MAD/month |

**One platform serves all your clients** (tenant isolation is enforced on every query), so these costs are shared. A sensible start: one VPS + Atlas M10 + R2 ≈ 1,000–1,200 MAD/month for your first 10–20 clients.

Environment variables: see `backend/.env.example` — set at least `MONGODB_URI`, `JWT_SECRET` (long random string), `CORS_ORIGINS`, `PUBLIC_API_URL`, `NODE_ENV=production`.

---

## 2. E-invoicing (DGI) + accounting export + VAT summary

### What is built
* **UBL 2.1 invoice/credit note** generated from each issued invoice (`GET /api/sales-invoices/:id/ubl`), with the company's ICE / IF / RC / TP, the buyer's ICE, VAT per rate, totals, RIB.
* **Pre-check** before sending: tells the user in plain French what is missing (company ICE 15 digits, IF, RC, city; buyer's ICE for B2B; only legal VAT rates 0/7/10/14/20).
* **Connector** with two modes (Comptabilité & TVA › Paramètres):
  * *Simulation* — the full flow (status, reference, QR link) without sending anything. Use it for demos and staff training.
  * *Plateforme réelle* — POSTs the XML to `EINVOICE_API_URL` with `EINVOICE_API_KEY`, stores the platform's answer (accepted / rejected / pending + reference + QR). "Transmettre automatiquement" submits every invoice as soon as it is issued.
* **Journal entries export** (CSV, Sage 100 import format, Excel): sales, credit notes, counter tickets grouped per day, receipts by method, supplier invoices and payments, cheques cleared / unpaid. Every entry balances. Accounts follow the Moroccan chart (3421, 4411, 7111, 6111, 4455, 34552, 5141, 5161, 5111…) and are editable per client.
* **VAT summary** for any period, on both regimes (encaissements — the default — and débits), collected vs deductible per rate, net to pay or credit, with an Excel file (and the purchases detail with supplier ICE for the *relevé des déductions*).

### What you must do to go live
1. **Follow the DGI calendar.** Morocco is rolling out mandatory e-invoicing in phases (large companies first, then the rest). The technical specification (exact XML profile, platform URL, authentication, whether certified intermediaries "PDP"-style are used) is published by the DGI; check `tax.gov.ma` and your client's accountant for the dates that apply to each client's size.
2. **Pick the route for each client:**
   * *Direct* to the DGI platform: the client registers on the DGI portal (simpl-TVA account, electronic certificate if required), and you get the API credentials.
   * *Through a certified provider* (Moroccan operators and the international ones that will be accredited): simpler — they give one API URL + key, handle certificates and archiving. Cost typically a monthly fee or a price per invoice (expect roughly 0.5–2 MAD per invoice, or 300–1,500 MAD/month depending on volume).
3. **Adapt the connector once** to the chosen platform: `backend/services/einvoiceService.js` → `mapAnswer()` (how the platform's answer is read) and, if needed, the authentication header. `EINVOICE_CUSTOMIZATION_ID` sets the UBL profile identifier the platform requires. This is a half-day job per platform, then reused for every client on it.
4. **Fill the identifiers** in Organisation › Entreprise: ICE, IF, RC, TP (patente), CNSS, full address, RIB. And the ICE of every business customer (the Excel import helps).
5. Switch the client from *Simulation* to *Plateforme réelle*, send one test invoice, check it on the platform, then turn on automatic submission.

**Legal points:** keep invoices for 10 years (Sanity keeps them; the XML hash is stored); sequential numbering without gaps is already enforced; a cancelled invoice is corrected by a credit note, never deleted.

**Selling point:** "Your invoices are already DGI-ready; when your date comes, we flip a switch." Charge the integration (setup fee) and include the connector in the subscription.

### Accounting export — onboarding with the accountant
Send the accountant the Excel journal for one month; let them adjust the account numbers in Comptabilité & TVA › Paramètres (they can set a sales account per VAT rate and their journal codes). The *Sage* CSV has no header and dates as ddmmyy, the layout most Sage 100 Maroc import models use; for other software the generic CSV (`;`, decimal comma) imports in a couple of clicks.

---

## 3. WhatsApp — invoices, statements, payment reminders

### What is built
* "WhatsApp" button on each invoice and on each customer (statement for the year), a **Relances WhatsApp** page listing late customers (amount overdue, oldest due date, last reminder) to remind several at once, a message history, and **automatic reminders** at chosen delays (default 3, 15, 30 days late).
* The PDF travels as a **signed link that expires** (30 days by default) — nobody can guess another customer's invoice.
* Phone numbers are normalised (06…/07… → 2126…); a customer can have a dedicated WhatsApp number.

### Two modes
| | wa.me links (default, free) | WhatsApp Business Platform (Meta Cloud API) |
|---|---|---|
| Setup | none | Meta Business account + verified business + a dedicated number |
| Sending | WhatsApp opens with the text ready; the user presses Send | sent directly by Sanity |
| Delivery / read receipts | no | yes (history shows delivered / read / failed) |
| Automatic daily reminders | no | yes |
| Cost | 0 | Meta's per-message fees |

### Going live with the Business Platform
1. Create a **Meta Business Manager** account for the client, verify the business (RC, ICE documents), add a phone number that is **not** already used in the WhatsApp app.
2. In developers.facebook.com create an app → add WhatsApp → note the **Phone number ID**; create a **System User** with a permanent token (`whatsapp_business_messaging`, `whatsapp_business_management`).
3. Create and get approved three **message templates** (category *Utility*, language French), each with a **document header** for the PDF:
   * `facture` — "Bonjour {{1}}, veuillez trouver notre facture {{2}} d'un montant de {{3}} TTC, payable avant le {{4}}."
   * `releve` — "Bonjour {{1}}, voici votre relevé de compte : solde {{2}}, dont {{3}} échus."
   * `relance` — "Bonjour {{1}}, sauf erreur, {{2}} restent impayés ({{3}} facture(s), échéance la plus ancienne {{4}}). Merci de régulariser ou de nous contacter."
4. Webhook: URL `https://<PUBLIC_API_URL>/api/public/whatsapp/webhook`, verify token = `WHATSAPP_VERIFY_TOKEN`, subscribe to `messages`. Set `WHATSAPP_APP_SECRET` so Sanity checks Meta's signature.
5. Set the variables (`backend/.env.example` → WHATSAPP section) and restart. The Relances page then says "envoi direct".

**Costs:** Meta charges per delivered template message, by category and country. Utility messages to Morocco cost a few US cents each (roughly 0.1–0.5 MAD); replies inside a 24-hour customer-initiated conversation are free. A wholesaler sending 1,500 invoices/reminders a month pays roughly 150–700 MAD/month. Alternatively a Business Solution Provider (360dialog, Twilio, Infobip, local BSPs) adds a monthly fee (≈ 50–500 MAD) but handles onboarding. Bill it to the client at cost or as a "WhatsApp pack".

**Legal points (CNDP, law 09-08):** customers must have given their number for this purpose (put a line in the general terms of sale / account opening form); offer an opt-out (Clients › "Relances automatiques" can be unticked per customer); keep reminder messages factual and polite (no threats; law 69-21 sets the late-payment penalties shown on invoices).

---

## 4. Excel import (articles, customers, opening stock)

Nothing to buy. Each screen (Articles, Clients, Stock par dépôt) has **Importer (Excel)**: download the template (with the client's own price levels as columns and an *Aide* sheet), fill it, upload, read the line-by-line check (what will be created, updated, refused and why), then import. Families "Sanitaire > Robinetterie" are created on the fly, cartons "Carton:6:barcode", supplier prices, lots and serial numbers for opening stock (which enters the CMUP at the given unit cost).

**How to sell it:** this is your onboarding tool. Offer a fixed "mise en route" price: you (or the client) convert their old export (Sage, Excel, another ERP) into the templates. Count half a day for a 5,000-article catalogue. Up to 20,000 rows per file.

---

## 5. Field app for reps and drivers (`/m`)

### What is built
* An installable web app (PWA) at `https://<your-domain>/m`: on the phone, open it, then "Ajouter à l'écran d'accueil". No App Store / Play Store needed.
* **Reps:** their customers (balance, overdue, call, WhatsApp, route) and the whole catalogue at each customer's price level are stored on the phone, so orders are taken **offline** at the counter (barcode or name search, cartons). Orders and visits wait in a queue and are sent when the network returns, **never twice** (each carries an id made on the phone). Visits are logged with GPS; the office sees distance from the customer (Ventes › Visites terrain).
* **Drivers:** the day's round, each BL with address/route/phone, **signature on screen + photo + name of who received + reserves + cash collected**; also queued offline. The signature and photo appear on the BL in the back office.

### To go live
* HTTPS is mandatory (camera, GPS and offline mode only work on HTTPS).
* Give each rep/driver a login with the *Commercial(e) terrain* or *Chauffeur / livreur* role.
* Phones: any Android with Chrome or iPhone with Safari from the last 5 years.
* The delivery photo goes to file storage (Cloudflare R2, §11 c), counted in the client's quota but **never refused** when the quota is full (a delivery must not be lost). The signature (a few KB) stays with the delivery record.

**Optional, later:** a native store app (wrapper with Capacitor) only if a client insists: Google Play developer account 25 USD once; Apple developer 99 USD/year. Not needed to sell.

---

## 6. Reseller ordering portal (`/portail`)

### What is built
* A separate, light-themed shop for the client's resellers: catalogue with photos, **their own price** (level + discount + current promotions, including "10 + 1"), stock shown as *En stock / Stock limité / Sur commande* (or exact, or hidden), cart, orders history and status, invoices to download, balance and available credit, statement PDF.
* Orders arrive in Ventes › Commandes as drafts (source *online*) and notify the customer's rep. Prices are always recomputed by the server.
* Office side (Ventes › Portail revendeurs): open/close the portal, minimum order, welcome message, give logins per reseller (buyer or view-only), reset passwords (temporary password shown once, shareable by WhatsApp), disable access instantly.
* Security: portal logins are separate from staff logins and can't reach the back office; each reseller only sees its own data; lock-out after repeated wrong passwords.

### To go live
* Nothing to buy. Optionally a sub-domain per client (`commande.client.ma` → your frontend) and their logo in Organisation › Entreprise.
* Write in the client's general terms that online orders are confirmed by the sales team (the portal says it too).

**Selling point:** resellers order at 11 pm without calling; reps stop taking orders by phone and visit more.

---

## 7. Cheques & LCN portfolio

Nothing to buy. Every cheque/effet recorded on an invoice (with due date, bank, drawer) enters **Finance › Chèques & LCN**: what is in the safe, what is due (to deposit), deposit slips (bordereau PDF, "à l'encaissement" or "à l'escompte" for LCN), cleared, **unpaid** (the payment is removed from the invoice, which is due again, the rep is notified, the customer can be blocked). The accounting export includes cleared (5141/5111) and unpaid (3421/5111) entries.

Tip for the demo: show the "À remettre (échus)" amount — wholesalers often have tens of thousands of dirhams of cheques waiting in a drawer.

---

## 8. Promotions and year-end rebates (RFA)

Nothing to buy.
* **Promotions** (Ventes › Promotions & RFA): dated, by article / family / brand, for customer types / price levels / named customers, on sales and/or the counter; types: % discount (stackable or not), promo price, free goods "10 + 1" (the free line is added automatically and leaves the stock). Applied automatically in quotes, orders, invoices, the counter, the field app and the portal.
* **Rebates by tier:** agreement per period with tiers (e.g. 100,000 MAD → 1 %, 250,000 → 2 %, 500,000 → 3 %), on the whole turnover or progressive. The progress table shows each customer's turnover and **what is missing to reach the next tier** — give it to the reps. At year end, one click makes draft credit notes, split by VAT rate.

---

## 9. Purchasing from the stockout forecast

Nothing to buy. Achats › Prévision d'achat lists the articles that will run out **before a delivery could arrive** (90-day sales pace, stock, open purchase orders, supplier lead time, minimum stock), the quantity to order (rounded to cartons) and the cheapest supplier. Adjust quantities or switch supplier, then **one click creates one draft purchase order per supplier**.
To make it accurate: fill each supplier's *délai de livraison* (lead time) and each article's supplier prices (the Excel import does both).

---

## 10. The assistant that reads the client's own figures

### What is built
Users ask in plain language — "Qu'a acheté Al Amal ce trimestre ?", "Quels articles sont en baisse ?", "Qui me doit le plus ?", "Combien de mitigeurs Eurosmart en stock à Marrakech ?", "Qu'est-ce que je dois commander ?". Claude answers using seven read-only tools: customer purchases (with comparison to the previous period), article trends, stock by warehouse, customer balances, sales summary (by month / customer / family / rep / article), customer search, stockout forecast.

**Security, in three layers:** a tool is only offered if the user has the matching permission; each call re-checks the permission on the server; data is scoped like the screens (a rep only sees their own customers; people without "voir les montants" get quantities, never amounts). The assistant can't change anything. Tenant isolation applies to every query.

### To go live
1. Create an organisation on `console.anthropic.com`, add a payment method, create an API key. Set `ANTHROPIC_API_KEY` on the server.
2. Set a monthly spend limit in the console (start with 50–100 USD).
3. Default model `claude-opus-5-5`. To lower costs set `ASSISTANT_MODEL=claude-sonnet-5-5`.

**Costs (Claude API, per million tokens, Oct 2026):**

| Model | Input | Output | Cached input read |
|---|---|---|---|
| claude-opus-5-5 (default) | $4.00 | $20.00 | $0.20 |
| claude-sonnet-5-5 | $2.00 | $10.00 | $0.20 |
| claude-haiku-5-5 | $0.10 | $0.50 | — |

The user guide sent with each question is cached, so a typical data question (two tool calls) costs around **0.10–0.40 MAD with Opus 5.5**, about half with Sonnet 5.5. A client whose team asks 300 questions a month costs you ≈ 30–120 MAD/month. There is a per-user limit (30 questions / 10 min, `ASSISTANT_RATE_MAX`). Without a key, the assistant still answers usage questions from the guide.

**Data protection:** only the rows needed for the answer are sent to Anthropic (not the whole database); by default Anthropic does not train on API data. Mention it in your data-processing annex (CNDP declaration, see §11).

---

## 10 b. Salary calculator (base ↔ net) and the 2026 payroll rules

**What is built.** HR → Salaries → *Add salary* / *Give a raise* now opens a calculator next to the form. Type the base salary to see the payslip and the net. Or type the net agreed with a new employee, and it finds the base salary to enter, to the cent. Both run the **same code as the monthly payroll run** (`services/payrollCalculationService.js`), so the payslip pays exactly the net shown, for a full month with no absence or overtime. Nothing is saved until you click *Save salary*.

**Rules applied (re-check every January, Loi de Finances):**

| Item | Rule | Where to change it |
|---|---|---|
| CNSS employee | 4.48 % of taxable gross, capped at 6,000 | `config/payrollConfig.js` → `CNSS` |
| AMO employee | 2.26 %, no cap | `AMO` |
| Frais professionnels | 35 % if taxable gross ≤ 78,000/yr (6,500/month), else 25 % capped at 35,000/yr | `PROFESSIONAL_EXPENSES` |
| IR | 2025-2026 scale: 0 % to 40,000, 10/20/30/34 %, 37 % above 180,000 | `IR_BRACKETS` |
| Family deduction | 500 MAD/yr per dependent in 2025, **600 MAD in 2026** (LF 2026, CGI art. 74-I), 6 max — chosen by the payslip's year | `FAMILY_DEDUCTION.PER_DEPENDENT_ANNUAL_BY_YEAR` |
| Seniority bonus (art. 350) | 5 % from 2 years, 10 % from 5, 15 % from 12, 20 % from 20, 25 % from 25, on the base salary, measured at the end of the pay month. Added automatically unless the salary already has a line labelled "Prime d'ancienneté". | `SENIORITY_STEPS` |
| Exempt allowances | transport 500/month (750 outside an urban area), panier 2 × hourly SMIG per worked day, représentation 10 % of base; the excess is taxed | `EXEMPT_ALLOWANCES` |
| SMIG | 17.92 MAD/hour (2026), × 191 h = 3,422.72/month — used for the panier limit and a warning | `SMIG_HOURLY` |

**What changed for existing payslips:**
* From 2026 the family deduction is 600 MAD a year per dependent, not 500, so IR goes down by 8.33 MAD a month per dependent.
* The seniority bonus is now added for employees with at least 2 years of service.
* Allowances marked as transport, panier or représentation are no longer taxed within their legal limits.

Payslips already in a draft run change only when you click *Regenerate*. Completed runs are never changed.

**Monthly bonuses (Payroll → open the month → "Primes du mois").** Use this for amounts paid **once**: exceptional bonus, Eid bonus, 13th month, year-end bonus, target bonus. You can add them before or after you generate the run. The draft run is recalculated immediately, with CNSS, AMO and IR. Once the month is completed it is locked. Fixed monthly allowances stay on the salary record.

**Sales commissions.** *Importer les commissions* takes each sales rep's commission for the month from the sales module (rate × the chosen base, plus the target bonus). It adds them as taxable bonuses that you can edit. You can import *this month's* or *last month's* commissions. Importing again replaces the commission lines only. A rep whose login isn't linked to an employee file is listed as "not imported": link the login under Users, then import again.

**One-off bonus in the calculator.** Below the simulated payslip you can enter a bonus, as gross or as the net the employee should receive. You see the gross to pay, the CNSS, AMO and IR on it, the net received and the employer cost. The calculator runs the payslip twice (with and without the bonus), so the CNSS ceiling and the higher tax bracket are taken into account.

**Not covered yet:**
* CIMR: the payroll run does not deduct it yet, so the calculator leaves it out to stay identical to the payslip.
* Mutuelle (private health insurance).
* Interest on a home loan (IR deduction).
* Overtime and absences: these vary by month and are added by the payroll run itself.

**Before the first real payroll:** take two or three payslips from your previous software (Synergie or other) and enter the same base, allowances, seniority and dependents. The nets must match to the cent. If one differs, the cause is almost always one of these:
* a rounding rule (for example, rounding the net to the dirham);
* an allowance treated differently;
* a mutuelle or CIMR line.

Send me that payslip and I'll align the engine.

## 11. Legal and compliance checklist (Morocco)

* **CNDP (law 09-08):** declare the processing of personal data (customers, employees, reps' GPS positions, drivers' delivery photos) — you as processor, each client as controller. Have a data-processing agreement in your contract: hosting location (EU region), sub-processors (MongoDB Atlas, Cloudinary/R2, Meta for WhatsApp, Anthropic for the assistant, the e-mail provider), retention, security.
* **GPS of reps:** inform employees in writing (internal note / contract annex); positions are recorded only when a visit or delivery is saved, never tracked continuously.
* **Invoices:** mandatory mentions are printed (ICE, IF, RC, TP, CNSS, amounts in words, VAT per rate, late-payment penalties law 69-21); 10-year retention.
* **Payment terms (law 69-21):** 60 days by default between companies, 120 days maximum by agreement; Sanity uses each customer's payment days.
* **VAT:** the summary is a working document; the declaration stays the responsibility of the client and their accountant (SIMPL-TVA).

---

## 11 c. File storage (Cloudflare R2) and a quota per client

Every photo (articles, logos, employees, delivery photos) and document (HR files, supplier documents, delivery notes, supplier invoices, quotes) goes to **Cloudflare R2**. R2 is your storage account, shared by all clients, with one folder per client (`services/storageService.js`).

**What each client gets:**
- Photos are resized on the server before they are stored: 1000 px maximum, WebP, plus a 320 px thumbnail. A 4 MB phone photo becomes about 100 KB.
- Documents are stored in a **private** bucket. They open only through a link that expires after 5 minutes.
- **Quota.** The quota a client gets is decided in this order:
  1. the quota you set for that client: Platform → Clients → the client → *Photos et documents* → **Modifier le quota** (in GB);
  2. otherwise, its plan's quota: Platform → Abonnements & factures → Offres → *Stockage inclus (Go)*;
  3. otherwise, `STORAGE_DEFAULT_QUOTA_MB` (default 1 GB).

  | Plan | Storage loaded with the catalogue |
  |---|---|
  | Droguerie | 1 GB |
  | Droguerie Plus | 3 GB |
  | Essentiel | 5 GB |
  | Pro | 20 GB |
  | Entreprise | 50 GB |

- **Over the quota**, new photos and documents are refused with a clear message ("Espace de stockage plein : … utilisés sur …"). Nothing is deleted. Delivery photos are the exception: they are counted but never refused.
- **What you see:** each client's gauge on Platform → Clients. The client sees its own gauge on Réglages → Mon abonnement.
- **Freeing space:** replacing or deleting a photo or document frees its space at once. **Recompter** (or `npm run storage:recount` for all clients) rebuilds the figure from the list of stored files.
- **Selling more space:** "Stockage supplémentaire" is on the price list, +5 GB for 29 MAD/month for drogueries and +20 GB for 99 MAD/month for the ERP plans. Raise that client's quota when they buy it.

**Setting up Cloudflare R2 (about 15 minutes):**
1. Create a Cloudflare account. Go to **R2** and enable it (a card is required, but the first 10 GB per month are free).
2. Create two buckets in a European location:
   - `sanity-public` (photos and logos). In Settings → Public access, either enable the `r2.dev` address or connect a custom domain such as `files.your-domain.ma` (better: cached and branded).
   - `sanity-private` (documents). Leave public access **off**.
3. Go to R2 → **Manage API tokens** → create a token with "Object Read & Write" on both buckets.
4. In `backend/.env`, set:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET=sanity-public`
   - `R2_PRIVATE_BUCKET=sanity-private`
   - `R2_PUBLIC_URL=https://files.your-domain.ma` (or the `r2.dev` address)

   Then restart the server.

Without these variables, files are kept on the server's own disk (`backend/uploads`). That is fine on your computer or for a demo. **It is not fine in production**: the files are lost when the server is rebuilt, and they are not in the database backups.

**Cost:** storage is about 0.015 USD per GB per month after the free 10 GB, and R2 charges nothing for downloads. The uploads and views themselves are free up to millions per month.

| Clients | Typical storage | Indicative cost |
|---|---|---|
| 100 drogueries | ≈ 20 GB | ≈ 0.15 USD/month |
| 500 clients | ≈ 100–200 GB | ≈ 1.50–3 USD/month |

That is a few dirhams a month in total, against at least 199 MAD per client.

## 11 b. Running the platform as a business

| Need | What exists | Where |
|---|---|---|
| **Contracts and CNDP** | Drafts in French to finalise with a Moroccan lawyer: CNDP filing pack (yours + a kit for your clients), terms of subscription with the payroll/tax liability clause, data processing agreement listing your sub-processors (incl. WhatsApp/Meta and the assistant/Anthropic), privacy policy | `docs/legal/` (start with its README) |
| **Billing your clients** | Plans, each client's subscription (negotiated price, discount, trial, monthly or yearly), monthly invoice run, numbered invoices (SAN-2026-0001) with legal mentions and PDF, e-mailed, payments, credit notes, overdue tracking, optional automatic suspension after a grace period that **reopens itself when the payment is recorded**; clients see their plan and invoices under Organisation → Mon abonnement | Platform → Abonnements & factures |
| **Error monitoring** | Server and browser errors grouped, with the stack; an e-mail / Slack alert on every *new* error; `/health` for an uptime monitor | Platform → Erreurs; `ALERT_EMAIL`, `ALERT_WEBHOOK_URL` |
| **Backups** | Daily, verified, weekly automatic restore drill, manual drill command | `backend/scripts/BACKUP_RESTORE.md`; status on Platform → Erreurs |
| **Automatic checks before each update** | GitHub Actions: tests, build, real-MongoDB smoke test, restore drill, dependency audit | `.github/workflows/ci.yml` (turn on branch protection) |
| **Security** | Headers, hardening, internal review (15 findings fixed with regression tests), production checklist, incident plan, brief for the independent pentest | `docs/SECURITY.md` |

**Your price list** (`backend/config/defaultCatalog.js`, loaded with Platform → Abonnements & factures → Offres → *Charger le catalogue Sanity*, or `npm run seed:plans`):

| Plan | For | Monthly HT | Yearly HT (2 months free) | Set-up fee HT (once) |
|---|---|---|---|---|
| **Essentiel** | Trader / small wholesaler, one site, 5 users | 1,490 | 14,900 | 9,900 |
| **Pro** (recommended) | Wholesaler with reps and deliveries, 3 warehouses, 15 users | 2,990 | 29,900 | 19,900 |
| **Entreprise** | Multi-site / multi-company group, 40 users, HR & payroll included | 5,990 | 59,900 | from 39,000 |

Options: extra user 120/month · extra warehouse 290/month · HR & payroll (Essentiel/Pro) 990/month · WhatsApp Business API 290/month + Meta's message costs · on-site training day 3,500 · data migration from another software: on quote.

* **Printable price list**: *Grille tarifaire (PDF)* on the Offres tab prints your current prices with your company details (fill Paramètres first). A ready-made copy is `docs/Sanity-Grille-tarifaire.pdf`; regenerate it with `npm run price-list -- --name="…" --phone="…" --email=…`.
* **When a client signs**: Clients tab → choose the plan → *Activer* (or *Démarrer l'essai*) → *Facturer la mise en service* (optional launch discount, e.g. 50 % for your first 3–5 clients against a testimonial) → issue the draft under Factures. The monthly run then bills the subscription.
* **Users and warehouses included** are contractual (printed on the price list and in the contract); the software enforces the number of **companies** per plan, not users or warehouses — count them at renewal and bill the options.
* **Your margin**: hosting for 10–20 clients ≈ 1,000–1,200 MAD/month in total; a Pro client pays 2,990/month. The assistant (≈ 30–120 MAD/month per active client) and WhatsApp messages are the only per-client costs.

**Monthly routine (30 minutes):**
1. Platform → Abonnements & factures → Factures → *Préparer les factures* for the month, check, *Émettre*.
2. Record the payments as they arrive. Overdue clients show in red.
3. Look at Platform → Erreurs: resolve or fix.
4. Check that the backup panel says "À jour" and the Sunday drill passed.

## 12. Go-live checklist for a new client (½ to 2 days)

1. Create the client (Platform › Clients), their company with ICE/IF/RC/TP/address/RIB/logo.
2. Import articles, customers, opening stock (Excel templates). Check 10 articles with the client.
3. Price levels and rules (Ventes › Tarifs); suppliers with lead times.
4. Users and roles (Organisation › Rôles & permissions): admin, ADV, reps, cashier, storekeeper, driver, accountant.
5. Accountant: account numbers + journal codes; regime encaissements/débits.
6. E-invoicing in simulation; switch to real when the client's date comes.
7. WhatsApp: start in link mode; propose the Business Platform after the first month.
8. Field app installed on each rep's and driver's phone; one test order offline (airplane mode) and one signed delivery.
9. Portal: open it for 2–3 friendly resellers first.
10. Assistant: show 3 questions on their own data during training.

---

## 13. Where things are in the code

| Feature | Backend | Frontend |
|---|---|---|
| E-invoicing | `utils/ublInvoice.js`, `services/einvoiceService.js` | `pages/fx/Widgets.jsx` (panel on the invoice) |
| Accounting & VAT | `services/accountingService.js`, `routes/accounting.js` | `pages/fx/Accounting.jsx` |
| Excel import | `services/importService.js`, `routes/imports.js` | `pages/fx/ImportModal.jsx` |
| WhatsApp | `services/whatsappService.js`, `messagingService.js`, `publicLinks.js`, `routes/messaging.js`, `routes/publicDocs.js` | `pages/fx/Reminders.jsx`, `Widgets.jsx` |
| Landed costs | `services/landedCost.js`, `routes/purchaseOrders.js` | `pages/fx/LandedCost.jsx` |
| Field app | `routes/field.js`, `models/Visit.js`, `DeliveryProof.js` | `pages/field/*`, `public/sw.js`, `public/manifest-field.webmanifest` |
| Reseller portal | `routes/portal.js`, `routes/portalAdmin.js`, `models/PortalUser.js` | `pages/portal/*`, `pages/fx/PortalAdmin.jsx` |
| Cheques & LCN | `services/portfolioService.js`, `routes/portfolio.js` | `pages/fx/Portfolio.jsx` |
| Promotions & RFA | `services/promotionService.js`, `routes/promotions.js` | `pages/fx/Promotions.jsx` |
| Purchase forecast | `services/replenishmentService.js` | `pages/fx/Forecast.jsx` |
| Assistant data tools | `services/assistantTools.js`, `services/assistantService.js` | `components/assistant/AssistantWidget.jsx` |

Tests: `cd backend && npx vitest run` — one test file per feature (`routes/accounting.test.js`, `imports.test.js`, `messaging.test.js`, `landedCost.test.js`, `portfolio.test.js`, `promotions.test.js`, `forecast.test.js`, `field.test.js`, `portal.test.js`, `assistantTools.test.js`).
