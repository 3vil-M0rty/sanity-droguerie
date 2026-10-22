# Legal pack — Sanity (drafts to finalise with a Moroccan lawyer)

> **These are drafts, not legal advice.** They are built on Moroccan law (law 09-08 on personal data, the Dahir des obligations et contrats, the Code de commerce and the General Tax Code) and on what the platform actually does today. A Moroccan business lawyer must review them before you sign anything with a client. Budget about 1 to 3 days of a lawyer's time, much less than drafting from scratch. Every `[À COMPLÉTER]` marks something only you can fill in (company name, ICE, prices, hosting provider…).

## The four documents

| File | What it is | Who signs or uses it | When |
|---|---|---|---|
| `01-CNDP-dossier.md` | Prepares your **CNDP filings** (law 09-08). Part A: what **you** declare, for your own processing (prospects, billing, user accounts, security logs). Part B: a **ready-made kit for your clients**, who are the data controllers for their employees and customers and must declare their own processing. | You (part A); you give each client part B | Before the first paying client |
| `02-Contrat-abonnement-CGV.md` | **General terms of subscription and use** (SaaS contract): price, term, availability, data, reversibility, and the **liability clause, especially for payroll, tax, CNSS and VAT figures**. | You + each client (signed quote referring to the terms, or electronic acceptance) | At each sale |
| `03-Accord-sous-traitance-DPA.md` | **Data processing agreement** (law 09-08, art. 23): you process your clients' data on their behalf. Lists your sub-processors (hosting, files, e-mail, **WhatsApp/Meta**, **the assistant / Anthropic**) and the security measures. | You + each client (annex to the contract) | At each sale |
| `04-Politique-confidentialite.md` | **Privacy policy** for the people whose data the platform holds (your clients' users, reseller-portal users, sales reps using the field app) and for your website visitors. | Published (website + link in the app) | Before go-live |

## Steps, in order

1. **Fill in the `[À COMPLÉTER]` markers**: company name, ICE, IF, RC, address, the hosting provider you actually chose, prices, support hours.
2. **Pick your hosting** before filing with the CNDP. Hosting outside Morocco is a **transfer of data abroad** (art. 43-44 of law 09-08): EU countries are generally treated as giving adequate protection, while the **United States** (Anthropic, and Meta depending on the setup) needs a CNDP authorisation or one of the exceptions in art. 44. Section 5 of the CNDP file explains this.
3. **Have the lawyer review**. The points to check are listed at the end of each document ("Points à valider par l'avocat").
4. **File with the CNDP** (part A of `01`) online at www.cndp.ma. Keep the receipt numbers.
5. **Give each client** part B of `01`: it is their filing obligation, but a ready-made kit is a real sales argument.
6. **Sign** the contract (`02`) and the data processing agreement (`03`) with each client. The simplest way is a quote or order form signed by the client stating "le Client accepte les Conditions générales d'abonnement et l'Accord de sous-traitance des données, version du [date]", plus a dated PDF of both kept in your files.
7. **Publish** the privacy policy (`04`) on your website and link it in the app's footer and on the reseller portal's login page.

## Product settings that go with these documents

| Commitment in the documents | Where it lives in the product |
|---|---|
| Daily backups, verified, restore-tested every week | `BACKUP_DIR`, `BACKUP_DRILL_URI` — `backend/scripts/BACKUP_RESTORE.md` |
| Isolation between clients | `backend/services/tenantScope.js` + automated cross-client attack test (`routes/tenantIsolation.test.js`) |
| Security measures in the DPA annex | `docs/SECURITY.md` (keep both in sync) |
| The assistant only sends data to Anthropic if the client turns it on | The assistant is off without `ANTHROPIC_API_KEY`; turn it on **per client** only after it has accepted annex 1 of the DPA |
| WhatsApp only if the client turns it on | Without `WHATSAPP_TOKEN`, the app only prepares wa.me links: nothing goes through Meta's servers |
| Data export when the contract ends | `npm run backup -- --tenant=<clientId>` (all of one client's data, JSON) + Excel exports from the screens |
| Payroll rules kept up to date (Loi de Finances) | `backend/config/payrollConfig.js` — commitment: updated within 15 days of publication (contract, art. 9) |

## Keep a "register" (Excel is enough)

The CNDP, a lawyer or a large client may ask for it:
- processing activities declared (receipt numbers);
- sub-processors and where they host data;
- security incidents (date, impact, actions, clients informed);
- restore drills (date, result);
- access requests from individuals (date, answer).
