// Performance smoke test: identical load against FastAPI, Laravel and NestJS (run via
// TEST_FILE=tests/parity/perf-smoke.mjs scripts/parity/run-cross-backend.sh). Not a benchmark:
// it detects gross regressions and prints comparable numbers. Dev servers, one machine, no tuning.
const URLS = {
  fastapi: process.env.FASTAPI_URL || 'http://127.0.0.1:8201',
  laravel: process.env.LARAVEL_URL || 'http://127.0.0.1:8202',
  nestjs: process.env.NEST_URL || 'http://127.0.0.1:8203',
};
const N = +(process.env.PERF_REQUESTS || 1500);
const C = +(process.env.PERF_CONCURRENCY || 20);
const LOGIN_N = +(process.env.PERF_LOGINS || 60);
const LOGIN_C = +(process.env.PERF_LOGIN_CONCURRENCY || 6);
const ADMIN = { email: `perf-${Date.now().toString(36)}@parity.example.com`, password: 'Str0ng-Passw0rd!' };

const json = (r) => r.json().catch(() => null);
async function load(total, conc, fn) {
  const lat = []; let next = 0; let errors = 0;
  const t0 = performance.now();
  await Promise.all(Array.from({ length: conc }, async () => {
    while (next < total) {
      next++;
      const s = performance.now();
      try { const r = await fn(); if (r.status >= 400) errors++; await r.arrayBuffer(); } catch { errors++; }
      lat.push(performance.now() - s);
    }
  }));
  const sec = (performance.now() - t0) / 1000;
  lat.sort((a, b) => a - b);
  const p = (q) => lat[Math.min(lat.length - 1, Math.floor(q * lat.length))];
  return { rps: total / sec, p50: p(0.5), p95: p(0.95), p99: p(0.99), errors };
}

const setup = await fetch(URLS.fastapi + '/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Setup-Token': process.env.SETUP_TOKEN || 'parity-setup-token' },
  body: JSON.stringify({ organization: { name: 'Perf', slug: `perf-${Date.now().toString(36)}` }, admin: { first_name: 'P', ...ADMIN } }),
});
if (setup.status !== 201) { console.error('setup failed', setup.status, await setup.text()); process.exit(1); }
await new Promise((r) => setTimeout(r, 2500));

const rows = [];
for (const [name, base] of Object.entries(URLS)) {
  const login = await (await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ADMIN) })).json();
  const auth = { Authorization: `Bearer ${login.access_token}` };
  await load(100, 5, () => fetch(base + '/health')); // warm-up
  const health = await load(N, C, () => fetch(base + '/health'));
  const me = await load(N, C, () => fetch(base + '/auth/me', { headers: auth }));
  const list = await load(N, C, () => fetch(base + '/tenants?limit=20', { headers: auth }));
  const logins = await load(LOGIN_N, LOGIN_C, () => fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ADMIN) }));
  rows.push({ name, health, me, list, logins });
}
const f = (x) => `${x.rps.toFixed(0).padStart(6)} rps  p50 ${x.p50.toFixed(1).padStart(6)}  p95 ${x.p95.toFixed(1).padStart(6)}  p99 ${x.p99.toFixed(1).padStart(6)} ms  err ${x.errors}`;
console.log(`\nrequests=${N} concurrency=${C} | login requests=${LOGIN_N} concurrency=${LOGIN_C}\n`);
for (const [label, key] of [['GET /health', 'health'], ['GET /auth/me', 'me'], ['GET /tenants', 'list'], ['POST /auth/login (bcrypt)', 'logins']]) {
  console.log(label);
  for (const r of rows) console.log(`  ${r.name.padEnd(8)} ${f(r[key])}`);
}
const bad = rows.flatMap((r) => ['health', 'me', 'list', 'logins'].filter((k) => r[k].errors > 0).map((k) => `${r.name}:${k}`));
if (bad.length) { console.error('\nFAILED (errors):', bad.join(', ')); process.exit(1); }
