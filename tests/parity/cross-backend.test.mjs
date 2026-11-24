// Cross-backend interoperability: three backends sharing ONE database must accept each other's
// tokens, password hashes, refresh sessions and encrypted data. See scripts/parity/run-cross-backend.sh.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const URLS = {
  fastapi: process.env.FASTAPI_URL || 'http://127.0.0.1:8201',
  laravel: process.env.LARAVEL_URL || 'http://127.0.0.1:8202',
  nestjs: process.env.NEST_URL || 'http://127.0.0.1:8203',
};
const NAMES = Object.keys(URLS);
const SETUP_TOKEN = process.env.SETUP_TOKEN || 'parity-setup-token';
const run = Date.now().toString(36);
const ADMIN = { email: `xadmin-${run}@parity.example.com`, password: 'Str0ng-Passw0rd!' };

async function call(name, method, path, { body, token, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(URLS[name] + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json, text };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { tokens: {}, refresh: {} };

describe('cross-backend interoperability (shared database)', () => {
  before(async () => {
    for (const n of NAMES) assert.equal((await call(n, 'GET', '/setup/status')).status, 200, `${n} not reachable at ${URLS[n]}`);
  });

  test('first-run setup on FastAPI is visible to every backend', async () => {
    const r = await call('fastapi', 'POST', '/setup', {
      headers: { 'X-Setup-Token': SETUP_TOKEN },
      body: { organization: { name: 'Shared Org', slug: `shared-${run}` }, admin: { first_name: 'Ada', ...ADMIN, mobile: '+911234567890' } },
    });
    assert.equal(r.status, 201, r.text);
    state.tenantId = r.json.tenant.id;
    state.adminId = r.json.admin.id;
    for (const n of NAMES) {
      let installed = false;
      for (let i = 0; i < 20 && !installed; i++) { installed = (await call(n, 'GET', '/setup/status')).json?.installed === true; if (!installed) await sleep(500); }
      assert.ok(installed, `${n} does not see the installation`);
    }
  });

  for (const n of NAMES) {
    test(`${n}: logs in the FastAPI-created admin (bcrypt + AES-GCM email + blind index)`, async () => {
      // FastAPI's own login is the reference; the others must read FastAPI-written rows.
      await sleep(2200); // FastAPI re-checks install state every 2s
      const r = await call(n, 'POST', '/auth/login', { body: ADMIN });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.json.user.email, ADMIN.email);
      assert.equal(r.json.user.mobile, '+911234567890');
      state.tokens[n] = r.json.access_token;
      state.refresh[n] = r.json.refresh_token;
    });
  }

  for (const issuer of NAMES) {
    for (const verifier of NAMES) {
      if (issuer === verifier) continue;
      test(`access token issued by ${issuer} is accepted by ${verifier}`, async () => {
        const r = await call(verifier, 'GET', '/auth/me', { token: state.tokens[issuer] });
        assert.equal(r.status, 200, r.text);
        assert.equal(r.json.email, ADMIN.email);
        assert.equal(r.json.active_tenant.id, state.tenantId);
      });
    }
  }

  test('refresh token issued by one backend rotates on another', async () => {
    const r = await call('nestjs', 'POST', '/auth/refresh', { body: { refresh_token: state.refresh.laravel } });
    assert.equal(r.status, 200, r.text);
    const r2 = await call('fastapi', 'POST', '/auth/refresh', { body: { refresh_token: r.json.refresh_token } });
    assert.equal(r2.status, 200, r2.text);
    const r3 = await call('laravel', 'POST', '/auth/refresh', { body: { refresh_token: r2.json.refresh_token } });
    assert.equal(r3.status, 200, r3.text);
  });

  for (const creator of NAMES) {
    test(`user created on ${creator} can log in and be read on every backend`, async () => {
      const u = { email: `u-${creator}-${run}@parity.example.com`, password: 'Cross-Passw0rd!1', mobile: `+9190000${Math.floor(10000 + Math.random() * 89999)}` };
      const c = await call(creator, 'POST', '/users', { token: state.tokens[creator], body: { first_name: 'X', last_name: creator, ...u } });
      assert.equal(c.status, 201, c.text);
      for (const n of NAMES) {
        const l = await call(n, 'POST', '/auth/login', { body: { email: u.email.toUpperCase(), password: u.password } });
        assert.equal(l.status, 200, `${n}: ${l.text}`);
        const g = await call(n, 'GET', `/users/${c.json.id}`, { token: state.tokens[n] });
        assert.equal(g.status, 200, `${n}: ${g.text}`);
        assert.equal(g.json.email, u.email);
        assert.equal(g.json.mobile, u.mobile);
      }
    });
  }

  for (const creator of ['laravel', 'nestjs']) {
    test(`tenant created on ${creator} is visible on every backend`, async () => {
      const slug = `t-${creator}-${run}`;
      const c = await call(creator, 'POST', '/tenants', { token: state.tokens[creator], body: { name: `T ${creator}`, slug } });
      assert.equal(c.status, 201, c.text);
      for (const n of NAMES) {
        const g = await call(n, 'GET', `/tenants/${c.json.id}`, { token: state.tokens[n] });
        assert.equal(g.status, 200, `${n}: ${g.text}`);
        assert.equal(g.json.slug, slug);
      }
      const dup = await call('fastapi', 'POST', '/tenants', { token: state.tokens.fastapi, body: { name: 'dup', slug } });
      assert.equal(dup.status, 409);
    });
  }

  test('password changed on one backend invalidates tokens on the others (shared token_version)', async () => {
    const u = { email: `pw-${run}@parity.example.com`, password: 'Cross-Passw0rd!1' };
    const c = await call('nestjs', 'POST', '/users', { token: state.tokens.nestjs, body: { first_name: 'P', ...u } });
    assert.equal(c.status, 201, c.text);
    const toks = {};
    for (const n of NAMES) toks[n] = (await call(n, 'POST', '/auth/login', { body: u })).json.access_token;
    const ch = await call('laravel', 'POST', '/auth/change-password', { token: toks.laravel, body: { current_password: u.password, new_password: 'Changed-Passw0rd!2' } });
    assert.equal(ch.status, 200, ch.text);
    for (const n of NAMES) assert.equal((await call(n, 'GET', '/auth/me', { token: toks[n] })).status, 401, `${n} still accepts the old token`);
    for (const n of NAMES) assert.equal((await call(n, 'POST', '/auth/login', { body: { email: u.email, password: 'Changed-Passw0rd!2' } })).status, 200, n);
  });
});
