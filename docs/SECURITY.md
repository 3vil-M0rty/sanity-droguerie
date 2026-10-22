# Sanity — security file

For you, for buyers who ask "is it secure?", and for the firm that will run the independent penetration test. Keep it in sync with annex 2 of `docs/legal/03-Accord-sous-traitance-DPA.md`.

---

## 1. Architecture in one paragraph

A single Node.js / Express API (`backend/`) serves every client from one MongoDB database. The React web app (`frontend/`) is static files on a CDN host. **Each client is a "tenant"**: every business record carries its company, every company carries its tenant, and **one central plugin (`backend/services/tenantScope.js`) adds the caller's tenant and companies to every database query, update, delete, aggregation and insert**. A route can't forget it. Platform staff use separate routes (`/api/platform/*`) behind a `platform_admin` role that can't be granted through the API.

## 2. Controls in place

| Area | Control | Where |
|---|---|---|
| Client isolation | Central query scoping; upserts can't create records in another client's company; strict mode (a query without a context throws) | `services/tenantScope.js` |
| … tested | **Automated cross-client attack**: logged in as client A's admin, the test calls *every* route with client B's ids, then proves nothing of B leaked, changed or got created | `routes/tenantIsolation.test.js` (runs in CI) |
| Authentication | bcrypt (cost 10); login rate limit (10 failures / 15 min per IP); optional TOTP 2FA with backup codes; 7-day sessions; **a password change ends every other session** (`tokenVersion`); deactivated users and suspended clients are cut off on the next request | `controllers/authController.js`, `middleware/auth.js`, `routes/twoFactor.js` |
| Authorisation | Fine-grained permission per route (table + coverage test that fails if a route has none); HR tiers can't be self-raised; only an owner manages the owner role | `config/routePermissions.js`, `routes/permissionGuard.coverage.test.js` |
| Input | MongoDB operators (`$ne`, `$regex`, `$rename`…) refused in any query or body; user search text escaped before regex use; request body ≤ 2 MB; uploads size-limited, kept in memory; images re-encoded by the server (WebP, ≤ 1000 px — nothing executable survives); documents in a **private** Cloudflare R2 bucket reachable only through 5-minute signed links; a storage quota per client | `middleware/rejectOperators.js`, `utils/escapeRegex.js`, `routes/files.js` |
| Output | Strict security headers on the API (CSP `default-src 'none'`, nosniff, DENY framing, no-referrer, no-store, HSTS in production); a CSP for the web app; internal error details never sent to the browser in production; spreadsheet-formula neutralisation in CSV exports | `middleware/securityHeaders.js`, `frontend/vercel.json`, `public/_headers`, `utils/csvHelpers.js` |
| Public endpoints | Document links: HMAC-signed, expiring, constant-time check, no built-in key; WhatsApp webhook: Meta signature required (closed without `WHATSAPP_APP_SECRET`); reseller portal: separate token type, locked after 8 failures, temporary password must be changed before use | `services/publicLinks.js`, `routes/publicDocs.js`, `routes/portal.js` |
| Proxies | `TRUST_PROXY` so rate limits see real client IPs behind the host's load balancer | `middleware/securityHeaders.js` |
| Secrets | Production refuses to start with a missing or short `JWT_SECRET`; demo seeds refuse `NODE_ENV=production`; no secrets in the repository (`.env` git-ignored) | `server.js`, `scripts/seed*.js` |
| AI assistant | Read-only tools, each re-checked against the asking user's permissions and tenant; amounts hidden from users without the money permission; API key server-side only | `services/assistantTools.js` |
| Monitoring | Server 500s (with stack), crashes, failed jobs and browser errors grouped, with an alert on each new error; `/health` returns 503 when the database is down (for an uptime monitor) | `services/monitoringService.js`, Platform → Erreurs |
| Backups | Daily, verified (per-collection content hash), weekly automatic **restore drill** into a scratch database, plus a restore drill on a real MongoDB in CI | `scripts/BACKUP_RESTORE.md` |
| Change control | CI on every push: unit and route tests, real-MongoDB smoke test, restore drill, dependency audit (high/critical fail the build) | `.github/workflows/ci.yml` |
| Audit trail | Sensitive actions logged (who, what, before/after) | `services/auditLogger.js` |

## 3. Internal review (October 2026): findings and status

An internal, code-level review (three reviewers: auth and injection; files, public links and webhooks; frontend and isolation) found:

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | High | An upsert keyed on another client's company could create settings in that company (e.g. turn on WhatsApp reminders to its customers) | **Fixed**: central check in `tenantScope.js` + test |
| 2 | High | An HR officer could raise their own HR tier by editing their own employee record's job title | **Fixed**: no self-edit of job title or department; no granting a tier above one's own + test |
| 3 | Medium | Operator injection in staff login (`{"email":{"$regex":…}}`) to spray a password across accounts | **Fixed**: global operator refusal + string cast + test |
| 4 | Medium | Unescaped regex in user and employee search (ReDoS) | **Fixed** + test |
| 5 | Medium | Sessions survived a password change (7 days) | **Fixed**: `tokenVersion` (staff and portal) + test |
| 6 | Medium | Hard-coded fallback key for document links | **Fixed**: no fallback; key derived from `JWT_SECRET` or `PUBLIC_LINK_SECRET`; start refused without `JWT_SECRET` in production + test |
| 7 | Medium | WhatsApp webhook accepted unsigned posts when the app secret was not set | **Fixed**: closed without the secret |
| 8 | Medium | CSV exports (accounting, payroll, bank transfer, employees) open to spreadsheet formula injection | **Fixed** + test |
| 9 | Medium | A driver could sign off, and read the proof of, deliveries not on their round | **Fixed** + test |
| 10 | Low-Med | Portal temporary password never forced to change | **Fixed** + test |
| 11 | Low | An admin could make anyone (including themselves) owner | **Fixed** (an admin may appoint the *first* owner only) + test |
| 12 | Low | `javascript:` URL possible in a company's website field | **Fixed**: server validation + safe rendering |
| 13 | Low | Assistant answer could contain a `//host` link leaving the app | **Fixed** |
| 14 | Low | Update operators in the company update body | **Fixed** by #3 (global operator refusal) |
| 15 | Low | Seeds with published passwords could run on production | **Fixed** |

**Residual risks (accepted for now, to revisit):**

- **Session token in `localStorage`.** Any XSS could read it. Mitigations: strict CSP, no HTML rendering of user data, no `dangerouslySetInnerHTML` in the codebase. Long-term fix: an httpOnly cookie with CSRF protection.
- **Staff passwords need only 6 characters** (the demo accounts rely on it). Raise to 10 or more in production, and make 2FA compulsory for admins and owners.
- **Turning 2FA off needs only the password**, not a code.
- **Within one client, a company is not an access boundary.** Users of a multi-company client can reach every company of that client. This is by design (groups); add per-company assignment if a client needs it.
- **Document uploads trust the browser's file type** (stored in a private R2 bucket, never served from the API's domain; images are re-encoded, so this concerns PDFs and scans only). Add magic-byte checking.
- **The duplicate-email check confirms whether an address exists on the platform** (needed because e-mails are unique platform-wide).
- **4 moderate npm advisories:**
  - `uuid` via `exceljs`: not reachable, because the app never passes a buffer to uuid;
  - `react-router` 6: open redirect via a backslash in `<Link>`, but the app has no user-controlled redirects.

  Plan the react-router 7 upgrade.
- **The automated tests use an in-memory database stand-in.** CI also runs a real-MongoDB smoke test and restore drill, but the full suite is not run on real MongoDB.

## 4. Production checklist

- [ ] `NODE_ENV=production`, `JWT_SECRET` = `openssl rand -hex 32`, `PUBLIC_LINK_SECRET` = another one
- [ ] `TRUST_PROXY` matches the hosting (usually 1)
- [ ] `CORS_ORIGINS` = the web app's exact URL only
- [ ] HTTPS only; HSTS active (automatic in production)
- [ ] MongoDB Atlas: network access restricted to the server's IPs; a dedicated database user with least privilege; cloud backups on
- [ ] `BACKUP_DIR` on a volume copied off-site; `BACKUP_DRILL_URI` set; first drill run by hand and logged
- [ ] `ALERT_EMAIL` and/or `ALERT_WEBHOOK_URL` set; uptime monitor on `/health` (UptimeRobot, Better Stack…: free tiers are enough)
- [ ] 2FA on: every platform-admin account, the hosting, Atlas, Cloudflare (R2), GitHub, the domain registrar
- [ ] GitHub branch protection: CI must pass before merging
- [ ] `WHATSAPP_APP_SECRET` set before turning on the WhatsApp API
- [ ] The assistant (`ANTHROPIC_API_KEY`) only for clients who accepted it in writing (DPA annex 1)
- [ ] No demo seed in production

## 5. If something happens (incident response)

1. **Contain**:
   - suspend the affected client (Platform → Clients);
   - rotate the secrets: changing `JWT_SECRET` logs everybody out;
   - revoke cloud keys.
2. **Assess** with Platform → Erreurs, the audit log and the hosting logs: what, since when, which clients, which data.
3. **Notify** affected clients **within 48 h** (DPA art. 9) with the facts known so far; they handle their own obligations towards the CNDP.
4. **Fix**, add a regression test, deploy through CI.
5. **Record** the incident in the register: timeline, impact, actions.

**Vulnerability reports:** publish `security@[your domain]` on the website (and a `/.well-known/security.txt`). Reply within 72 h.

---

## 6. Independent penetration test: brief for the provider

Send this section to two or three providers and ask for a quote. Prefer a firm **qualified by the DGSSI** (Direction Générale de la Sécurité des Systèmes d'Information), or with testers holding recognised certifications (OSCP, OSWE, CREST). Ask for a **re-test** of the fixes in the price.

**Goal:** an independent assessment before selling, with a report you can show to buyers and to the CNDP if asked.

**Scope:**
- Web app (`https://[app domain]`), API (`https://[api domain]/api`), reseller portal (`/portail`), field app (`/m`).
- **Grey box**: you provide the accounts below and this file; source code on request.
- Out of scope: denial-of-service, social engineering, third-party platforms (MongoDB Atlas, Cloudflare R2, Meta, Anthropic, DGI).

**Environment:** a **staging** copy with demo data (`npm run seed`), never production. Two clients (tenants), so that cross-client attacks can be tested.

**Accounts to provide, for each of the two clients:**
- owner, admin, HR director, HR officer, sales rep, driver, accountant, cashier;
- a reseller-portal account;
- one platform-admin account.

**Priorities (most valuable first):**
1. **Cross-client data access**: read or change another client's data through any route, id, parameter, upload, export, portal or assistant question.
2. **Privilege escalation inside a client**: rep → admin, HR officer → HR director, driver → sales, user → owner; money fields visible without the permission.
3. **Authentication and sessions**: login, 2FA, password change and reset, portal login and lockout, token reuse, rate limits behind the proxy.
4. **Public surfaces**: signed document links, WhatsApp webhook, `/api/monitoring/client-errors`, `/health`.
5. **Files**: upload type and size checks, access to other clients' files, signed-link lifetime.
6. **Payroll, billing and exports**: tampering with amounts through the API, CSV/Excel injection, invoice numbering.
7. **The AI assistant**: prompt injection stored in customer or article names, trying to obtain data beyond the user's rights.
8. **Web**: XSS (stored or reflected), CSP effectiveness, clickjacking, open redirects.

**Deliverables:**
- a report with severity (CVSS), reproduction steps and recommendations;
- a short executive summary you can share with clients;
- a re-test within 30 days.

**Duration:** typically 5 to 8 tester-days for this scope. Get several quotes; prices vary a lot between providers.
