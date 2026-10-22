/**
 * SMOKE TEST — a running server, end to end (real database, real HTTP).
 *
 *   npm run smoke -- --url=https://api.your-domain.ma --email=admin@sanity.test --password=Admin@123
 *
 * Checks /health, logs in, then calls the main screens' endpoints for the
 * first company and fails (exit 1) on any answer other than 200. Used by CI
 * against a real MongoDB with the demo data (.github/workflows/ci.yml); run
 * it on a staging server after each deployment.
 */
function arg(name, fallback = '') {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : fallback;
}

const base = arg('url', process.env.SMOKE_URL || 'http://localhost:5000').replace(/\/$/, '');
const email = arg('email', process.env.SMOKE_EMAIL || 'admin@sanity.test');
const password = arg('password', process.env.SMOKE_PASSWORD || 'Admin@123');

const ENDPOINTS = [
  '/dashboard?companyId={c}',
  '/dashboard/analytics?companyId={c}',
  '/products?companyId={c}&limit=20',
  '/stock/levels?companyId={c}',
  '/stock/valuation?companyId={c}',
  '/warehouses?companyId={c}',
  '/customers?companyId={c}',
  '/quotes?companyId={c}',
  '/sales-orders?companyId={c}',
  '/sales-invoices?companyId={c}',
  '/sales-reps/performance?companyId={c}',
  '/suppliers?companyId={c}',
  '/purchase-orders?companyId={c}',
  '/employees?companyId={c}',
  '/salaries?companyId={c}&current=true',
  '/payroll/runs?companyId={c}',
  '/portfolio?companyId={c}',
  '/promotions?companyId={c}',
  '/notifications',
];

async function call(path, token, init = {}) {
  const started = Date.now();
  const res = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body, ms: Date.now() - started };
}

(async () => {
  const failures = [];
  const health = await fetch(`${base.replace(/\/api$/, '')}/health`).then((r) => r.json().then((b) => ({ status: r.status, body: b }))).catch((e) => ({ status: 0, body: { error: e.message } }));
  console.log(`health: ${health.status} ${JSON.stringify(health.body)}`);
  if (health.status !== 200) failures.push('GET /health');
  const api = base.endsWith('/api') ? base : `${base}/api`;
  const login = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
  const token = login.body?.token || login.body?.data?.token;
  if (login.status !== 200 || !token) {
    console.error(`✗ login as ${email}: HTTP ${login.status} ${JSON.stringify(login.body).slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`login: ok (${email})`);
  const apiCall = (p, init) => call(p.startsWith('/api') ? p : `/api${p}`.replace('/api/api', '/api'), token, init);
  const companies = await call(`${api.replace(base, '')}/companies`.replace(/^\/\//, '/'), token);
  const list = companies.body?.data || companies.body;
  const companyId = Array.isArray(list) && list[0]?._id;
  if (!companyId) {
    console.error(`✗ no company visible (GET /companies: ${companies.status})`);
    process.exit(1);
  }
  for (const pattern of ENDPOINTS) {
    const path = pattern.replace('{c}', companyId);
    // eslint-disable-next-line no-await-in-loop
    const r = await apiCall(path);
    const ok = r.status === 200;
    console.log(`${ok ? '✓' : '✗'} ${r.status} ${String(r.ms).padStart(5)} ms  GET ${path}`);
    if (!ok) failures.push(`GET ${path} → ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  }
  if (failures.length) {
    console.error(`\n✗ ${failures.length} failure(s):\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.log(`\n✓ Smoke test passed (${ENDPOINTS.length} endpoints).`);
  process.exit(0);
})().catch((e) => {
  console.error(`✗ Smoke test crashed: ${e.message}`);
  process.exit(1);
});
