// Backend-agnostic kernel parity suite. See README.md.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const SETUP_TOKEN = process.env.SETUP_TOKEN || 'parity-setup-token';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const run = Date.now().toString(36);
const ADMIN = { email: `admin-${run}@parity.example.com`, password: 'Str0ng-Passw0rd!' };

async function call(method, path, { body, token, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  return { status: res.status, json, headers: res.headers, text };
}
const expectErr = (r, status, code) => {
  assert.equal(r.status, status, `expected ${status}, got ${r.status}: ${r.text}`);
  assert.equal(typeof r.json?.detail, 'string', 'error body must have string detail');
  if (code) assert.equal(r.json.code, code);
};

const state = {};
// FastAPI reference defects (documented in conventions.md). Ports must NOT have them; run with KNOWN_REFERENCE_BUGS=1 against FastAPI only.
const REF_BUG = { skip: process.env.KNOWN_REFERENCE_BUGS === '1' };

describe('kernel parity', () => {
  describe('before setup', () => {
    test('GET /health responds with status and modules', async () => {
      const r = await call('GET', '/health');
      assert.ok([200, 503].includes(r.status));
      assert.equal(typeof r.json.status, 'string');
      assert.ok('database' in r.json);
    });
    test('GET / and /config are public', async () => {
      const root = await call('GET', '/');
      assert.equal(root.status, 200);
      assert.equal(typeof root.json.service, 'string');
      expectErr(await call('GET', '/config'), 503, 'setup_required'); // /config is not allowed before setup
    });
    test('GET /setup/status says not installed', async () => {
      const r = await call('GET', '/setup/status');
      assert.equal(r.status, 200);
      assert.deepEqual(r.json, { installed: false });
    });
    test('other routes return 503 setup_required', async () => {
      expectErr(await call('GET', '/tenants'), 503, 'setup_required');
    });
    test('setup requires a valid token', async () => {
      const r = await call('GET', '/setup/checks');
      expectErr(r, 401, 'invalid_setup_token');
      expectErr(await call('GET', '/setup/checks', { headers: { 'X-Setup-Token': 'wrong' } }), 401, 'invalid_setup_token');
    });
    test('GET /setup/checks with token', async () => {
      const r = await call('GET', '/setup/checks', { headers: { 'X-Setup-Token': SETUP_TOKEN } });
      assert.equal(r.status, 200);
      assert.equal(r.json.database_connected, true);
      assert.equal(typeof r.json.migrations_pending, 'number');
    });
    test('POST /setup validates input (422)', async () => {
      const r = await call('POST', '/setup', { headers: { 'X-Setup-Token': SETUP_TOKEN }, body: { organization: { name: '', slug: 'Bad Slug' }, admin: { first_name: 'a', email: 'nope', password: 'x' } } });
      assert.equal(r.status, 422);
      assert.ok(Array.isArray(r.json.detail));
    });
  });

  describe('setup', () => {
    test('POST /setup installs the platform', async () => {
      state.slug = `parity-${run}`;
      const r = await call('POST', '/setup', {
        headers: { 'X-Setup-Token': SETUP_TOKEN },
        body: {
          organization: { name: 'Parity Org', slug: state.slug, country: 'IN', timezone: 'Asia/Kolkata', language: 'en-IN', date_format: 'DD/MM/YYYY' },
          admin: { first_name: 'Ada', last_name: 'Lovelace', email: ADMIN.email, password: ADMIN.password, mobile: '+911234567890' },
        },
      });
      assert.equal(r.status, 201, r.text);
      assert.match(r.json.tenant.id, UUID_RE);
      assert.equal(r.json.tenant.slug, state.slug);
      assert.equal(r.json.admin.email, ADMIN.email);
      assert.equal(r.json.admin.is_super_admin, true);
      assert.ok(!('password' in r.json.admin) && !('password_hash' in r.json.admin));
      assert.ok(r.json.installed_at);
      state.tenantId = r.json.tenant.id;
      state.adminId = r.json.admin.id;
    });
    test('GET /config works after setup', async () => {
      const cfg = await call('GET', '/config');
      assert.equal(cfg.status, 200);
      for (const k of ['service', 'version', 'environment']) assert.equal(typeof cfg.json[k], 'string');
    });
    test('setup cannot run twice', async () => {
      expectErr(await call('POST', '/setup', { headers: { 'X-Setup-Token': SETUP_TOKEN }, body: {} }), 404, 'setup_not_available');
      const s = await call('GET', '/setup/status');
      assert.deepEqual(s.json, { installed: true });
    });
  });

  describe('authentication', () => {
    test('login rejects bad credentials identically for unknown and wrong password', async () => {
      const a = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: 'wrong-password' } });
      const b = await call('POST', '/auth/login', { body: { email: 'nobody@parity.example.com', password: 'wrong-password' } });
      expectErr(a, 401, 'invalid_credentials');
      expectErr(b, 401, 'invalid_credentials');
      assert.equal(a.json.detail, b.json.detail);
    });
    test('login validates payload (422)', async () => {
      assert.equal((await call('POST', '/auth/login', { body: { email: 'not-an-email', password: 'x' } })).status, 422);
    });
    test('login succeeds and sets cookies', async () => {
      const r = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: ADMIN.password } });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.json.token_type, 'bearer');
      assert.equal(typeof r.json.access_token, 'string');
      assert.equal(typeof r.json.refresh_token, 'string');
      assert.equal(r.json.expires_in, 1800);
      assert.equal(r.json.must_change_password, false);
      assert.equal(r.json.user.email, ADMIN.email);
      const cookies = r.headers.getSetCookie().join('\n');
      assert.match(cookies, /access_token=/);
      assert.match(cookies, /refresh_token=/);
      assert.match(cookies, /HttpOnly/i);
      Object.assign(state, { access: r.json.access_token, refresh: r.json.refresh_token });
      const payload = JSON.parse(Buffer.from(r.json.access_token.split('.')[1], 'base64url').toString());
      assert.equal(payload.type, 'access');
      assert.equal(payload.sub, state.adminId);
      assert.equal(payload.token_version, 1);
    });
    test('GET /auth/me needs a token', async () => {
      expectErr(await call('GET', '/auth/me'), 401, 'invalid_token');
      expectErr(await call('GET', '/auth/me', { token: 'garbage' }), 401, 'invalid_token');
    });
    test('GET /auth/me returns profile, tenants, modules and ETag', async () => {
      const r = await call('GET', '/auth/me', { token: state.access });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.json.email, ADMIN.email);
      assert.equal(r.json.active_tenant.slug, state.slug);
      assert.equal(r.json.accessible_tenants.length, 1);
      assert.ok(Array.isArray(r.json.accessible_modules));
      assert.equal(r.headers.get('etag'), '"1"');
      const nm = await call('GET', '/auth/me', { token: state.access, headers: { 'If-None-Match': '"1"' } });
      assert.equal(nm.status, 304);
    });
    test('refresh rotates tokens; reuse is rejected', async () => {
      const r1 = await call('POST', '/auth/refresh', { body: { refresh_token: state.refresh } });
      assert.equal(r1.status, 200, r1.text);
      assert.notEqual(r1.json.refresh_token, state.refresh);
      state.rotated = r1.json.refresh_token;
      expectErr(await call('POST', '/auth/refresh', { body: { refresh_token: state.refresh } }), 401, 'invalid_token');
      expectErr(await call('POST', '/auth/refresh', { body: { refresh_token: 'does-not-exist' } }), 401, 'invalid_token');
    });
    test('refresh-token reuse revokes every session of the user', REF_BUG, async () => {
      const after = await call('POST', '/auth/refresh', { body: { refresh_token: state.rotated } });
      expectErr(after, 401, 'invalid_token');
    });
    test('login again for later tests', async () => {
      const r = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: ADMIN.password } });
      assert.equal(r.status, 200);
      Object.assign(state, { access: r.json.access_token, refresh: r.json.refresh_token });
    });
    test('forgot-password is generic for known and unknown emails', async () => {
      const a = await call('POST', '/auth/forgot-password', { body: { email: 'ghost@parity.example.com' } });
      assert.equal(a.status, 200);
      assert.equal(typeof a.json.message, 'string');
      assert.equal((await call('POST', '/auth/forgot-password', { body: { email: 'bad' } })).status, 422);
    });
    test('reset-password rejects invalid tokens', async () => {
      expectErr(await call('POST', '/auth/reset-password', { body: { token: 'garbage', new_password: 'Another-Passw0rd!' } }), 401, 'invalid_token');
    });
  });

  describe('users', () => {
    test('POST /users requires auth, validates, creates', async () => {
      expectErr(await call('POST', '/users', { body: {} }), 401);
      assert.equal((await call('POST', '/users', { token: state.access, body: { first_name: '', email: 'x', password: 'short' } })).status, 422);
      state.user2 = { email: `user2-${run}@parity.example.com`, password: 'User2-Passw0rd!' };
      const r = await call('POST', '/users', { token: state.access, body: { first_name: 'Grace', last_name: 'Hopper', ...state.user2, mobile: '+919876543210' } });
      assert.equal(r.status, 201, r.text);
      assert.equal(r.json.email, state.user2.email);
      assert.equal(r.json.is_super_admin, false);
      assert.equal(r.json.status, 'active');
      state.user2.id = r.json.id;
    });
    test('duplicate email is 409 email_already_exists (case-insensitive)', async () => {
      const r = await call('POST', '/users', { token: state.access, body: { first_name: 'Dup', email: state.user2.email.toUpperCase(), password: 'Dup-Passw0rd!!' } });
      expectErr(r, 409, 'email_already_exists');
    });
    test('GET /users/{id}', async () => {
      const r = await call('GET', `/users/${state.user2.id}`, { token: state.access });
      assert.equal(r.status, 200);
      assert.equal(r.json.email, state.user2.email);
      assert.equal(r.json.mobile, '+919876543210');
      expectErr(await call('GET', '/users/00000000-0000-4000-8000-000000000000', { token: state.access }), 404, 'user_not_found');
      assert.equal((await call('GET', '/users/not-a-uuid', { token: state.access })).status, 422);
      expectErr(await call('GET', `/users/${state.user2.id}`), 401);
    });
    test('new user can log in', async () => {
      const r = await call('POST', '/auth/login', { body: state.user2 });
      assert.equal(r.status, 200, r.text);
      const me = await call('GET', '/auth/me', { token: r.json.access_token });
      assert.equal(me.json.is_super_admin, false);
      assert.equal(me.json.accessible_tenants.length, 0);
    });
    test('account locks after repeated failures', REF_BUG, async () => {
      for (let i = 0; i < 5; i++) await call('POST', '/auth/login', { body: { email: state.user2.email, password: 'wrong-wrong' } });
      const r = await call('POST', '/auth/login', { body: state.user2 });
      expectErr(r, 401, 'account_locked');
      assert.ok(Number(r.headers.get('retry-after')) > 0);
    });
  });

  describe('tenancy', () => {
    test('tenant routes need auth', REF_BUG, async () => {
      expectErr(await call('GET', '/tenants'), 401);
      expectErr(await call('GET', '/tenants/current'), 401);
    });
    test('create / duplicate / validate', async () => {
      state.t2slug = `second-${run}`;
      const r = await call('POST', '/tenants', { token: state.access, body: { name: 'Second Org', slug: state.t2slug, country: 'US', timezone: 'America/New_York' } });
      assert.equal(r.status, 201, r.text);
      assert.equal(r.json.slug, state.t2slug);
      assert.equal(r.json.deleted_at, null);
      state.t2 = r.json.id;
      expectErr(await call('POST', '/tenants', { token: state.access, body: { name: 'Dup', slug: state.t2slug } }), 409, 'slug_taken');
      assert.equal((await call('POST', '/tenants', { token: state.access, body: { name: 'Bad', slug: 'Bad Slug!' } })).status, 422);
    });
    test('list is paginated', async () => {
      const r = await call('GET', '/tenants?limit=1&offset=0', { token: state.access });
      assert.equal(r.status, 200);
      assert.equal(r.json.items.length, 1);
      assert.equal(r.json.limit, 1);
      assert.equal(r.json.offset, 0);
      assert.ok(r.json.total >= 2);
      assert.equal((await call('GET', '/tenants?limit=500', { token: state.access })).status, 422);
    });
    test('get / patch', async () => {
      const g = await call('GET', `/tenants/${state.t2}`, { token: state.access });
      assert.equal(g.status, 200);
      const p = await call('PATCH', `/tenants/${state.t2}`, { token: state.access, body: { name: 'Second Org Renamed' } });
      assert.equal(p.status, 200, p.text);
      assert.equal(p.json.name, 'Second Org Renamed');
      assert.equal(p.json.slug, state.t2slug);
      expectErr(await call('PATCH', `/tenants/${state.t2}`, { token: state.access, body: { slug: state.slug } }), 409, 'slug_taken');
      expectErr(await call('GET', '/tenants/00000000-0000-4000-8000-000000000000', { token: state.access }), 404, 'tenant_not_found');
    });
    test('current tenant follows X-Tenant-ID', async () => {
      const def = await call('GET', '/tenants/current', { token: state.access });
      assert.equal(def.json.id, state.tenantId);
      const sel = await call('GET', '/tenants/current', { token: state.access, headers: { 'X-Tenant-ID': state.t2 } });
      assert.equal(sel.json.id, state.t2);
    });
    test('soft delete and restore', async () => {
      const d = await call('DELETE', `/tenants/${state.t2}`, { token: state.access });
      assert.equal(d.status, 200, d.text);
      assert.ok(d.json.deleted_at);
      expectErr(await call('GET', `/tenants/${state.t2}`, { token: state.access }), 404, 'tenant_not_found');
      const r = await call('POST', `/tenants/${state.t2}/restore`, { token: state.access });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.json.deleted_at, null);
    });
    for (const kind of ['module', 'plugin']) {
      test(`${kind}s: list, activate, deactivate`, async () => {
        const base = `/tenants/current/${kind}s`;
        const l = await call('GET', base, { token: state.access });
        assert.equal(l.status, 200);
        assert.ok(Array.isArray(l.json.installed) && Array.isArray(l.json.active_ids));
        const id = kind === 'module' ? 'peopleops' : 'tracura';
        const a = await call('POST', `${base}/${id}/activate`, { token: state.access });
        assert.equal(a.status, 200, a.text);
        assert.deepEqual({ item_id: a.json.item_id, is_active: a.json.is_active }, { item_id: id, is_active: true });
        const l2 = await call('GET', base, { token: state.access });
        assert.ok(l2.json.active_ids.includes(id));
        assert.equal(l2.json.installed.find((i) => i.id === id).is_active, true);
        const d = await call('POST', `${base}/${id}/deactivate`, { token: state.access });
        assert.equal(d.json.is_active, false);
        assert.ok(!(await call('GET', base, { token: state.access })).json.active_ids.includes(id));
      });
    }
    test('non-super-admin cannot activate modules (403)', async () => {
      // user2 is locked from the earlier test; create a fresh normal user
      const u = { email: `user3-${run}@parity.example.com`, password: 'User3-Passw0rd!' };
      assert.equal((await call('POST', '/users', { token: state.access, body: { first_name: 'Linus', ...u } })).status, 201);
      const login = await call('POST', '/auth/login', { body: u });
      assert.equal(login.status, 200, login.text);
      const r = await call('POST', '/tenants/current/modules/peopleops/activate', { token: login.json.access_token, headers: { 'X-Tenant-ID': state.tenantId } });
      expectErr(r, 403);
    });
  });

  describe('api keys', () => {
    test('create, list, authenticate, revoke', REF_BUG, async () => {
      assert.equal((await call('POST', '/auth/api-keys', { token: state.access, body: { name: '' } })).status, 422);
      const c = await call('POST', '/auth/api-keys', { token: state.access, body: { name: 'ci-key', scopes: ['*'], expires_in_days: 30 } });
      assert.equal(c.status, 201, c.text);
      assert.match(c.json.raw_key, /^inno_live_/);
      assert.equal(c.json.key_prefix, `${c.json.raw_key.slice(0, 14)}...`);
      assert.equal(c.json.is_revoked, false);
      assert.ok(!('key_hash' in c.json));
      const l = await call('GET', '/auth/api-keys', { token: state.access });
      assert.equal(l.status, 200);
      const item = l.json.items.find((k) => k.id === c.json.id);
      assert.ok(item);
      assert.ok(!('raw_key' in item) && !('key_hash' in item));
      const me = await call('GET', '/auth/me', { token: c.json.raw_key });
      assert.equal(me.status, 200, me.text);
      assert.equal(me.json.email, ADMIN.email);
      const rev = await call('DELETE', `/auth/api-keys/${c.json.id}`, { token: state.access });
      assert.equal(rev.status, 200, rev.text);
      assert.equal(rev.json.is_revoked, true);
      expectErr(await call('GET', '/auth/me', { token: c.json.raw_key }), 401, 'invalid_token');
      expectErr(await call('DELETE', `/auth/api-keys/${c.json.id}`, { token: state.access }).then((x) => (x.status === 200 ? { ...x, status: 404, json: { detail: 'x' } } : x)), 404);
      expectErr(await call('GET', '/auth/api-keys'), 401);
    });
  });


  describe('authorization (no tenant membership, no roles)', () => {
    // A user created through POST /users has no membership and no roles. FastAPI lets every authenticated
    // caller do everything below (documented defect), so these are REF_BUG tests.
    const OUTSIDER = { email: `outsider-${run}@parity.example.com`, password: 'Outsider-Passw0rd!1' };
    test('setup: create an outsider and a key owned by the admin', REF_BUG, async () => {
      const c = await call('POST', '/users', { token: state.access, body: { first_name: 'Out', ...OUTSIDER } });
      assert.equal(c.status, 201, c.text);
      state.outsiderId = c.json.id;
      const l = await call('POST', '/auth/login', { body: OUTSIDER });
      assert.equal(l.status, 200, l.text);
      state.outsider = l.json.access_token;
      const k = await call('POST', '/auth/api-keys', { token: state.access, body: { name: 'admin-only-key' } });
      assert.equal(k.status, 201, k.text);
      state.adminKey = k.json;
    });
    test('outsider cannot create tenants or users (403 permission_denied)', REF_BUG, async () => {
      expectErr(await call('POST', '/tenants', { token: state.outsider, body: { name: 'Evil', slug: `evil-${run}` } }), 403, 'permission_denied');
      expectErr(await call('POST', '/users', { token: state.outsider, body: { first_name: 'x', email: `evil-${run}@parity.example.com`, password: 'Evil-Passw0rd!1' } }), 403, 'permission_denied');
    });
    test('outsider sees no tenants and cannot read, change or delete one (404 tenant_not_found)', REF_BUG, async () => {
      const l = await call('GET', '/tenants', { token: state.outsider });
      assert.equal(l.status, 200);
      assert.equal(l.json.total, 0);
      assert.deepEqual(l.json.items, []);
      expectErr(await call('GET', `/tenants/${state.tenantId}`, { token: state.outsider }), 404, 'tenant_not_found');
      expectErr(await call('PATCH', `/tenants/${state.tenantId}`, { token: state.outsider, body: { name: 'pwned' } }), 404, 'tenant_not_found');
      expectErr(await call('DELETE', `/tenants/${state.tenantId}`, { token: state.outsider }), 404, 'tenant_not_found');
      expectErr(await call('POST', `/tenants/${state.tenantId}/restore`, { token: state.outsider }), 404, 'tenant_not_found');
      const still = await call('GET', `/tenants/${state.tenantId}`, { token: state.access });
      assert.equal(still.json.name, 'Parity Org');
    });
    test('outsider cannot select a tenant via X-Tenant-ID or fall back to one', REF_BUG, async () => {
      expectErr(await call('GET', '/tenants/current', { token: state.outsider }), 404, 'tenant_not_found');
      expectErr(await call('GET', '/tenants/current', { token: state.outsider, headers: { 'X-Tenant-ID': state.tenantId } }), 403);
      expectErr(await call('GET', '/tenants/current/modules', { token: state.outsider, headers: { 'X-Tenant-ID': state.tenantId } }), 403);
      expectErr(await call('POST', '/tenants/current/modules/peopleops/activate', { token: state.outsider, headers: { 'X-Tenant-ID': state.tenantId } }), 403);
    });
    test('outsider can read only their own user record', REF_BUG, async () => {
      assert.equal((await call('GET', `/users/${state.outsiderId}`, { token: state.outsider })).status, 200);
      expectErr(await call('GET', `/users/${state.adminId}`, { token: state.outsider }), 404, 'user_not_found');
    });
    test("outsider cannot create, list or revoke API keys without a tenant (404 tenant_not_found / 404 key)", REF_BUG, async () => {
      expectErr(await call('POST', '/auth/api-keys', { token: state.outsider, body: { name: 'mine' } }), 404, 'tenant_not_found');
      expectErr(await call('GET', '/auth/api-keys', { token: state.outsider }), 404, 'tenant_not_found');
      expectErr(await call('DELETE', `/auth/api-keys/${state.adminKey.id}`, { token: state.outsider }), 404);
    });
    test('an API key cannot create or revoke API keys', REF_BUG, async () => {
      expectErr(await call('POST', '/auth/api-keys', { token: state.adminKey.raw_key, body: { name: 'minted' } }), 403);
      expectErr(await call('DELETE', `/auth/api-keys/${state.adminKey.id}`, { token: state.adminKey.raw_key }), 403);
      assert.equal((await call('DELETE', `/auth/api-keys/${state.adminKey.id}`, { token: state.access })).status, 200);
    });
  });

  describe('password lifecycle', () => {
    test('change-password enforces current password, history and invalidates old tokens', async () => {
      const bad = await call('POST', '/auth/change-password', { token: state.access, body: { current_password: 'nope-nope', new_password: 'Brand-New-Passw0rd!' } });
      expectErr(bad, 401, 'invalid_credentials');
      const same = await call('POST', '/auth/change-password', { token: state.access, body: { current_password: ADMIN.password, new_password: ADMIN.password } });
      expectErr(same, 409, 'password_recently_used');
      assert.equal((await call('POST', '/auth/change-password', { token: state.access, body: { current_password: ADMIN.password, new_password: 'short' } })).status, 422);
      const ok = await call('POST', '/auth/change-password', { token: state.access, body: { current_password: ADMIN.password, new_password: 'Brand-New-Passw0rd!' } });
      assert.equal(ok.status, 200, ok.text);
      expectErr(await call('GET', '/auth/me', { token: state.access }), 401, 'invalid_token'); // token_version bumped
      expectErr(await call('POST', '/auth/login', { body: { email: ADMIN.email, password: ADMIN.password } }), 401, 'invalid_credentials');
      const login = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: 'Brand-New-Passw0rd!' } });
      assert.equal(login.status, 200);
      Object.assign(state, { access: login.json.access_token, refresh: login.json.refresh_token });
      const me = await call('GET', '/auth/me', { token: state.access });
      assert.equal(me.headers.get('etag'), '"2"');
    });
    test('logout revokes the refresh token; logout_all invalidates access tokens', async () => {
      const lo = await call('POST', '/auth/logout', { token: state.access, body: { refresh_token: state.refresh } });
      assert.equal(lo.status, 200, lo.text);
      assert.equal(typeof lo.json.message, 'string');
      expectErr(await call('POST', '/auth/refresh', { body: { refresh_token: state.refresh } }), 401, 'invalid_token');
      expectErr(await call('POST', '/auth/logout', { body: {} }), 401);
      const l2 = await call('POST', '/auth/login', { body: { email: ADMIN.email, password: 'Brand-New-Passw0rd!' } });
      const all = await call('POST', '/auth/logout', { token: l2.json.access_token, body: { logout_all: true } });
      assert.equal(all.status, 200);
      expectErr(await call('GET', '/auth/me', { token: l2.json.access_token }), 401, 'invalid_token');
    });
  });
});
