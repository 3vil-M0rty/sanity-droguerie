// FIRST: client-isolation plugin + request context. Must be loaded
// before any model (see services/tenantScope.js).
const tenantScope = require('./services/tenantScope');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const { syncEmployeeIndexes } = require('./utils/syncEmployeeIndexes');
const cors = require('cors');
const compression = require('compression');

// Load .env from THIS file's directory explicitly, rather than
// relying on `dotenv`'s default (the process's current working
// directory). If the server is ever started from a different cwd
// (a root-level npm script, a process manager, a monorepo task
// runner, ...), the bare `require('dotenv').config()` silently
// finds no .env file and every var — including TRANSLATION_PROVIDER
// — is just missing, with no error. This is a common source of
// "I edited .env but nothing changed" bugs.
//
// `override: true`: by default dotenv NEVER overwrites a variable
// that already exists in process.env — including one that's already
// set to an EMPTY string. On Windows especially, it's easy to end up
// with a stray TRANSLATION_PROVIDER="" (or any other var) already
// sitting in the shell/session/system environment from earlier
// experimentation, which then silently wins over .env forever, no
// matter how many times .env is edited or the server is restarted.
// For a project-local .env like this one, the file should always be
// the source of truth, so we force it to win.
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

// One-line startup diagnostic: makes a misconfigured/missing .env
// immediately visible in the server console instead of only
// surfacing later as a confusing 503 on a translation request.
console.log(
  `[env] Loaded .env from ${path.join(__dirname, '.env')} — ` +
  `TRANSLATION_PROVIDER=${JSON.stringify(process.env.TRANSLATION_PROVIDER || '')}`
);

const { runDailyHRChecks } = require('./services/scheduledNotificationsService');
const { generalRateLimiter } = require('./middleware/rateLimitMiddleware');

const authRoutes = require('./routes/auth');
const { router: twoFactorRoutes } = require('./routes/twoFactor');
const userRoutes = require('./routes/users');
const companyRoutes = require("./routes/companies");  
const employeeRoutes = require("./routes/employees");
const salaryRoutes = require("./routes/salaries");
const absenceRoutes = require("./routes/absences");
const advanceRoutes = require("./routes/advances");
const payrollRoutes = require("./routes/payroll");
const contractRoutes = require("./routes/contracts");
const documentRoutes = require("./routes/documents");
const attendanceRoutes = require("./routes/attendance");
const notificationRoutes = require("./routes/notifications");
const auditLogRoutes = require("./routes/auditLogs");
const reportRoutes = require("./routes/reports");
const meRoutes = require("./routes/me");
const workScheduleRoutes = require("./routes/workSchedule");
const inventoryCategoryRoutes = require("./routes/inventoryCategories");
const departmentRoutes = require("./routes/departments");
const jobPositionRoutes = require("./routes/jobPositions");
const productRoutes = require("./routes/products");
const purchaseRequestRoutes = require("./routes/purchaseRequests");
const performanceReviewRoutes = require("./routes/performanceReviews");
const disciplinaryActionRoutes = require("./routes/disciplinaryActions");
const holidayRoutes = require("./routes/holidays");
const supplierRoutes = require("./routes/suppliers");
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const priceRequestRoutes = require("./routes/priceRequests");
const platformRoutes = require("./routes/platform");
const fileRoutes = require("./routes/files");
const leaveRoutes = require("./routes/leave");
const declarationRoutes = require("./routes/declarations");
const customerRoutes = require("./routes/customers");
const quoteRoutes = require("./routes/quotes");
const salesInvoiceRoutes = require("./routes/salesInvoices");
const salesOrderRoutes = require("./routes/salesOrders");
const salesSettingsRoutes = require("./routes/salesSettings");
const salesRepRoutes = require("./routes/salesReps");
const posRoutes = require("./routes/pos");
const warehouseRoutes = require("./routes/warehouses");
const brandRoutes = require("./routes/brands");
const stockRoutes = require("./routes/stock");
const dashboardRoutes = require("./routes/dashboard");
const assistantRoutes = require("./routes/assistant");
const accountingRoutes = require("./routes/accounting");
const importRoutes = require("./routes/imports");
const logisticsRoutes = require("./routes/logistics");
const permissionRoutes = require('./routes/permissions');
const { migrateLegacyDataToTenants } = require("./services/tenantService");

// Every model holding client data must carry the isolation plugin;
// refuse to start otherwise. From here on, a database query that runs
// with NO client context is treated as a bug and throws.
tenantScope.assertAllModelsScoped();
tenantScope.enableStrictMode(true);

// Secrets: a production server never starts with a missing or short
// session key (anyone could forge sessions and document links).
{
  const jwtSecret = process.env.JWT_SECRET || '';
  if (process.env.NODE_ENV === 'production' && jwtSecret.length < 32) {
    console.error('✗ JWT_SECRET must be set to a random value of at least 32 characters (e.g. `openssl rand -hex 32`). Refusing to start.');
    process.exit(1);
  }
  if (!jwtSecret) console.warn('⚠ JWT_SECRET is not set: logins will fail.');
  if (process.env.NODE_ENV === 'production' && !process.env.PUBLIC_LINK_SECRET) {
    console.warn('⚠ PUBLIC_LINK_SECRET is not set: document links use a key derived from JWT_SECRET. Set a separate random value.');
  }
}

// Error monitoring: keep the errors routes log, record crashes
// (services/monitoringService.js). Before anything can fail.
const monitoring = require('./services/monitoringService');
monitoring.captureConsoleErrors();
monitoring.installProcessHandlers();

const app = express();

// Security: real client IPs behind the host's proxy, no framework
// banner, strict headers on every answer (middleware/securityHeaders.js).
const { securityHeaders, trustProxySetting } = require('./middleware/securityHeaders');
app.set('trust proxy', trustProxySetting());
app.disable('x-powered-by');
app.use(securityHeaders());

// Middleware
// gzip/brotli-compresses every JSON response before it goes over
// the wire — free bandwidth/latency win on every request, not just
// initial page load, since API responses (employee lists, payroll
// runs, reports) are plain JSON and compress very well. Placed
// before express.json() so it also covers static/other middleware
// output, not just the API routes below.
// Event streams (the assistant's answers) must reach the browser as they
// are written, not when a compression buffer fills.
app.use(compression({ filter: (req, res) => (req.path === '/api/assistant/chat' ? false : compression.filter(req, res)) }));
app.use(express.json({
  limit: "2mb",
  // Meta signs the raw body of its webhook calls (routes/publicDocs.js)
  verify: (req, res, buf) => { if (req.originalUrl.startsWith('/api/public/whatsapp')) req.rawBody = buf; },
})); // article photos can travel as small data: URLs

// Requests start in the "system" context (login, 2FA, health check).
// middleware/auth.js replaces it with the caller's client context
// for every authenticated route.
app.use((req, res, next) => tenantScope.bindRequest(req, tenantScope.SYSTEM, next));
// No MongoDB operators ($ne, $regex, $rename…) in queries or bodies.
app.use(require('./middleware/rejectOperators').rejectOperators);
// Records every answer ≥ 500 with the stack the route logged.
app.use(monitoring.requestMonitor());

// ------------------------------------------------------------
// SCHEDULED JOBS
// ------------------------------------------------------------
// Runs the daily HR expiry check (contracts, employee documents —
// see scheduledNotificationsService.js) once at startup, then every
// 24h after that. A plain setInterval is enough for "once a day" —
// no need for a cron library or its extra dependency for a schedule
// this simple. Started only after MongoDB actually connects (see
// the mongoose.connect().then() below), so it can't run queries
// against a database that isn't ready yet.
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const { runDailyPurchasingChecks } = require('./services/purchasingScheduledChecks');
const { runDailyBusinessChecks } = require('./services/businessNotifications');

// Background jobs see every client (system context); each one picks
// the right people per company itself (services/notificationService.js).
function runDailyJobs() {
  return tenantScope.runAsSystem(async () => {
    await runDailyHRChecks();
    await runDailyPurchasingChecks();
    await runDailyBusinessChecks();
    await require('./services/messagingService').runDailyReminders();
    // Unpaid platform invoices: past due / suspension / reopening (services/billingService.js).
    await require('./services/billingService').runDaily();
  }).catch((err) => {
    console.error('Daily jobs failed:', err);
    monitoring.record({ source: 'job', route: 'daily jobs', message: err?.message, stack: err?.stack });
  });
}

function startScheduledJobs() {
  runDailyJobs();
  setInterval(runDailyJobs, ONE_DAY_MS);
  // Daily backup + weekly restore drill when BACKUP_DIR is set (services/backupScheduler.js).
  require('./services/backupScheduler').start();
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    await tenantScope.runAsSystem(async () => {
      // Attaches data created before client isolation to a client
      // (no-op once done) — see services/tenantService.js.
      await migrateLegacyDataToTenants();
      await syncEmployeeIndexes();
    });
    // Articles saved before the indexed search get their search tokens
    // (in batches, in the background; nothing to do once done).
    tenantScope.runAsSystem(() => require('./services/productSearchIndex').backfillSearchTokens())
      .then((n) => n && console.log(`✓ Search tokens built for ${n} article(s)`))
      .catch((err) => console.error('Article search backfill failed:', err));
    startScheduledJobs();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// CORS_ORIGINS is a comma-separated list, e.g.
// "https://your-app.vercel.app,https://your-app-git-preview.vercel.app".
// FRONTEND_URL (a single URL) is also supported as a fallback — it
// was already documented in .env.example for exactly this purpose,
// but nothing actually read it before now; this line is what
// finally makes it do something. Defaults to the local Vite dev
// server so nothing changes for local development without a .env —
// this only needs setting once the frontend is actually deployed
// somewhere other than localhost. Requests with no Origin header at
// all (server-to-server calls, curl, health checks) are always
// allowed through, since CORS is a browser-enforced concept —
// there's nothing to protect against for a request that was never
// going to carry a browser's cookies in the first place.
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS: rejected request from origin "${origin}" — not in CORS_ORIGINS`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true  // ← Important!
}));

// General, defense-in-depth rate limiting across the whole API —
// see middleware/rateLimitMiddleware.js. The stricter, brute-force-
// specific limiter for POST /api/auth/login is applied directly on
// that route instead (routes/auth.js), since it needs a much lower
// threshold than everything else in the app.
app.use('/api', generalRateLimiter);

// Photos stored on this server's disk when Cloudflare R2 isn't configured
// (development, demo — services/storageService.js). With R2 they are served
// by Cloudflare and this folder stays empty. Images only (WebP made by the
// server); private documents are never here (see /api/files/raw).
if (require('./services/storageService').driver() === 'local') {
  app.use('/uploads', express.static(require('./services/storageService').localPublicDir(), {
    fallthrough: false, index: false, dotfiles: 'deny', maxAge: '30d', immutable: true,
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/salaries", salaryRoutes);
app.use("/api/absences", absenceRoutes);
app.use("/api/advances", advanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/me", meRoutes);
app.use("/api/work-schedule", workScheduleRoutes);
app.use("/api/inventory-categories", inventoryCategoryRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/job-positions", jobPositionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchase-requests", purchaseRequestRoutes);
app.use("/api/performance-reviews", performanceReviewRoutes);
app.use("/api/disciplinary-actions", disciplinaryActionRoutes);
app.use("/api/holidays", holidayRoutes);
// Purchasing module (service achats)
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/price-requests", priceRequestRoutes);
// Short-lived links to private documents.
app.use("/api/files", fileRoutes);
// Paid-leave balances (Code du travail).
app.use("/api/leave", leaveRoutes);
// Payroll declarations: Damancom (CNSS), bank transfer, Simpl-IR (DGI).
app.use("/api/declarations", declarationRoutes);
// Négoce: stock (articles, dépôts, transferts, inventaires), ventes
// (clients, tarifs, devis, commandes, factures), caisse, commerciaux, logistique.
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales-settings", salesSettingsRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/sales-invoices", salesInvoiceRoutes);
app.use("/api/sales-reps", salesRepRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/messaging", require("./routes/messaging"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/promotions", require("./routes/promotions"));
app.use("/api/field", require("./routes/field"));
app.use("/api/droguerie", require("./routes/droguerie"));
app.use("/api/portal-admin", require("./routes/portalAdmin"));
app.use("/api/portal", require("./routes/portal"));
app.use("/api/public", require("./routes/publicDocs"));
// Errors from users' browsers (frontend/src/utils/errorReporter.js).
app.use("/api/monitoring", require("./routes/monitoring"));
app.use("/api/permissions", permissionRoutes);
// Platform operator — platform_admin only: invoicing the clients, then client management.
app.use("/api/platform/billing", require("./routes/billing"));
app.use("/api/platform", platformRoutes);
// A client's own subscription and platform invoices ("Mon abonnement").
app.use("/api/subscription", require("./routes/subscription"));

// Health check
const BUILD = 'sanity-negoce 2026-10-05';
app.get('/health', (req, res) => {
  // build: lets you check which version of the code is actually running.
  // 503 while the database is unreachable, so an uptime monitor
  // (UptimeRobot, Better Stack… see docs/SECURITY.md) raises the alarm.
  const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
  res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'Sanity server is running' : 'Database unreachable', build: BUILD, db });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    // Never show internals (stack, database messages) to the browser on a 500.
    message: status >= 500 ? 'Server error' : err.message || 'Error',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 5000;
const httpServer = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT} — build ${BUILD}`);
});
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // An older server still holds the port: it keeps answering with the old code.
    console.error(`✗ Port ${PORT} is already used by another process (probably an older server still running). Stop it, then start again.`);
    process.exit(1);
  }
  throw err;
});
