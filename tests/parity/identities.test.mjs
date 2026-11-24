// Identities + credentials (migration 0010 / Laravel 000003 / NestJS 0003): schema, constraints, migration
// idempotency, backfill, legacy fallback and the "never resurrect" rule, exercised against ALL THREE backends
// sharing ONE database. Most tests are negative / breaking scenarios.
//
// Run (starts FastAPI, Laravel and NestJS on one fresh DB; PERF=1 lifts rate limits for the many logins):
//   PGPASSWORD=admin PERF=1 TEST_FILE=tests/parity/identities.test.mjs bash scripts/parity/run-cross-backend.sh
// Needs direct DB access (env PGHOST PGPORT PGUSER PGPASSWORD DB, exported by the runner).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const require = createRequire(process.env.PG_MODULE_FROM || new URL('../../kernel/backend-nestjs/package.json', import.meta.url).pathname);
const { Client } = require('pg');

const URLS = {
  fastapi: process.env.FASTAPI_URL || 'http://127.0.0.1:8201',
  laravel: process.env.LARAVEL_URL || 'http://127.0.0.1:8202',
  nestjs: process.env.NEST_URL || 'http://127.0.0.1:8203',
};
const NAMES = Object.keys(URLS);
const SETUP_TOKEN = process.env.SETUP_TOKEN || 'parity-setup-token';
const SHARED_SQL = readFileSync(new URL('../../kernel/backend/migrations/sql/0010_identities_credentials.sql', import.meta.url), 'utf8');
const run = Date.now().toString(36);
const ADMIN = { email: `idadmin-${run}@parity.example.com`, password: 'Str0ng-Passw0rd!' };
const tokens = {};
let db;
let seq = 0;

async function call(name, method, path, { body, token, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(URLS[name] + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const one = async (sql, params = []) => (await q(sql, params))[0];
const login = (n, email, password) => call(n, 'POST', '/auth/login', { body: { email, password } });

/** Create a user through the API of `creator`; returns { id, email, password, mobile }. */
async function createUser(creator, { mobile = true } = {}) {
  seq += 1;
  const u = {
    first_name: 'Id',
    last_name: `${creator}-${seq}`,
    email: `id-${creator}-${seq}-${run}@parity.example.com`,
    password: `Id-Passw0rd!${seq}a`,
    ...(mobile ? { mobile: `+9188${String(Date.now() % 1e6).padStart(6, '0')}${String(seq).padStart(2, '0')}` } : {}),
  };
  const r = await call(creator, 'POST', '/users', { token: tokens[creator], body: u });
  assert.equal(r.status, 201, `${creator} create user: ${r.text}`);
  return { ...u, id: r.json.id };
}

/** Expect a SQL statement to fail with a given SQLSTATE (inside a savepoint so the connection stays usable). */
async function expectSqlError(code, sql, params = []) {
  await db.query('BEGIN');
  try {
    await assert.rejects(db.query(sql, params), (err) => {
      assert.equal(err.code, code, `expected SQLSTATE ${code}, got ${err.code}: ${err.message}`);
      return true;
    });
  } finally {
    await db.query('ROLLBACK');
  }
}

/** Insert a bare user row directly (no API), for pure database tests. */
async function rawUser() {
  const id = randomUUID();
  await db.query(
    `INSERT INTO users (id, first_name, email_hash, email_encrypted, password_hash, status, is_super_admin,
                        must_change_password, failed_login_attempts, token_version, key_version)
     VALUES ($1, 'Raw', $2, 'v1:x:y', '$2b$04$abcdefghijklmnopqrstuu', 'active', false, false, 0, 1, 1)`,
    [id, randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').slice(0, 32)],
  );
  return id;
}

async function assertConsistent(userId, label) {
  const u = await one('SELECT email_hash, mobile_hash, password_hash FROM users WHERE id = $1', [userId]);
  const emails = await q(`SELECT value_hash, is_primary FROM identities WHERE user_id = $1 AND type = 'email' AND deleted_at IS NULL`, [userId]);
  assert.equal(emails.length, 1, `${label}: exactly one active email identity`);
  assert.equal(emails[0].value_hash, u.email_hash, `${label}: email identity hash = users.email_hash`);
  assert.equal(emails[0].is_primary, true, `${label}: email identity is primary`);
  const phones = await q(`SELECT value_hash FROM identities WHERE user_id = $1 AND type = 'phone' AND deleted_at IS NULL`, [userId]);
  if (u.mobile_hash) {
    assert.equal(phones.length, 1, `${label}: exactly one active phone identity`);
    assert.equal(phones[0].value_hash, u.mobile_hash, `${label}: phone identity hash = users.mobile_hash`);
  } else {
    assert.equal(phones.length, 0, `${label}: no phone identity without a mobile`);
  }
  const pw = await q(`SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL`, [userId]);
  assert.equal(pw.length, 1, `${label}: exactly one active password credential`);
  assert.equal(pw[0].secret_hash, u.password_hash, `${label}: credential = users.password_hash`);
}

describe('identities + credentials across all backends (shared database)', () => {
  before(async () => {
    db = new Client({
      host: process.env.PGHOST || 'localhost', port: +(process.env.PGPORT || 5432), user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'admin', database: process.env.DB || process.env.SHARED_DB || 'erp_shared',
    });
    await db.connect();
    for (const n of NAMES) assert.equal((await call(n, 'GET', '/setup/status')).status, 200, `${n} not reachable`);
    const s = await call('fastapi', 'POST', '/setup', {
      headers: { 'X-Setup-Token': SETUP_TOKEN },
      body: { organization: { name: 'Id Org', slug: `id-${run}` }, admin: { first_name: 'Ada', ...ADMIN, mobile: '+919999900001' } },
    });
    assert.equal(s.status, 201, s.text);
    await sleep(2200); // FastAPI re-checks install state every 2s
    for (const n of NAMES) {
      const r = await login(n, ADMIN.email, ADMIN.password);
      assert.equal(r.status, 200, `${n} admin login: ${r.text}`);
      tokens[n] = r.json.access_token;
    }
  });
  after(async () => { await db?.end(); });

  // ------------------------------------------------------------------ schema & constraints
  describe('schema and constraints', () => {
    test('tables, indexes and constraints exist with the shared names', async () => {
      const idx = (await q(`SELECT indexname FROM pg_indexes WHERE tablename IN ('identities','credentials')`)).map((r) => r.indexname);
      for (const name of ['pk_identities', 'ix_identities_user_id', 'uq_identities_type_value_hash', 'uq_identities_provider_subject',
        'uq_identities_user_type_primary', 'pk_credentials', 'ix_credentials_user_id', 'ix_credentials_device_id', 'uq_credentials_user_password']) {
        assert.ok(idx.includes(name), `missing index ${name}`);
      }
      const ck = (await q(`SELECT conname FROM pg_constraint WHERE conrelid IN ('identities'::regclass, 'credentials'::regclass)`)).map((r) => r.conname);
      for (const name of ['ck_identities_type', 'ck_identities_value', 'fk_identities_user_id_users', 'ck_credentials_type',
        'ck_credentials_secret', 'fk_credentials_user_id_users', 'fk_credentials_device_id_user_devices']) {
        assert.ok(ck.includes(name), `missing constraint ${name}`);
      }
    });

    test('rejects an unknown identity type', async () => {
      const uid = await rawUser();
      await expectSqlError('23514', `INSERT INTO identities (id, user_id, type, value_hash, value_encrypted) VALUES ($1,$2,'fax','h','e')`, [randomUUID(), uid]);
    });

    test('rejects an email/phone identity without hash or ciphertext', async () => {
      const uid = await rawUser();
      await expectSqlError('23514', `INSERT INTO identities (id, user_id, type, value_encrypted) VALUES ($1,$2,'email','e')`, [randomUUID(), uid]);
      await expectSqlError('23514', `INSERT INTO identities (id, user_id, type, value_hash) VALUES ($1,$2,'phone','h')`, [randomUUID(), uid]);
    });

    test('rejects a social/sso identity without provider and subject', async () => {
      const uid = await rawUser();
      await expectSqlError('23514', `INSERT INTO identities (id, user_id, type, provider) VALUES ($1,$2,'social','google')`, [randomUUID(), uid]);
      await expectSqlError('23514', `INSERT INTO identities (id, user_id, type, provider_subject) VALUES ($1,$2,'sso','sub')`, [randomUUID(), uid]);
    });

    test('an identifier value belongs to one account only, even when the first is soft-deleted', async () => {
      const a = await rawUser();
      const b = await rawUser();
      const h = `dup-${randomUUID()}`;
      await db.query(`INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, deleted_at) VALUES ($1,$2,'email',$3,'e', now())`, [randomUUID(), a, h]);
      await expectSqlError('23505', `INSERT INTO identities (id, user_id, type, value_hash, value_encrypted) VALUES ($1,$2,'email',$3,'e')`, [randomUUID(), b, h]);
      // the same hash under a different type is a different identifier
      await db.query(`INSERT INTO identities (id, user_id, type, value_hash, value_encrypted) VALUES ($1,$2,'username',$3,'e')`, [randomUUID(), b, h]);
    });

    test('at most one primary identity per type per user; extra non-primary identities are allowed', async () => {
      const uid = await rawUser();
      await db.query(`INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary) VALUES ($1,$2,'email',$3,'e',true)`, [randomUUID(), uid, `p1-${randomUUID()}`]);
      await expectSqlError('23505', `INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary) VALUES ($1,$2,'email',$3,'e',true)`, [randomUUID(), uid, `p2-${randomUUID()}`]);
      await db.query(`INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary) VALUES ($1,$2,'email',$3,'e',false)`, [randomUUID(), uid, `p3-${randomUUID()}`]);
    });

    test('rejects an unknown credential type and a credential without any secret', async () => {
      const uid = await rawUser();
      await expectSqlError('23514', `INSERT INTO credentials (id, user_id, type, secret_hash) VALUES ($1,$2,'sms','h')`, [randomUUID(), uid]);
      await expectSqlError('23514', `INSERT INTO credentials (id, user_id, type) VALUES ($1,$2,'pin')`, [randomUUID(), uid]);
    });

    test('at most one active password per user; a soft-deleted one does not block a new one', async () => {
      const uid = await rawUser();
      await db.query(`INSERT INTO credentials (id, user_id, type, secret_hash, deleted_at) VALUES ($1,$2,'password','old', now())`, [randomUUID(), uid]);
      await db.query(`INSERT INTO credentials (id, user_id, type, secret_hash) VALUES ($1,$2,'password','new')`, [randomUUID(), uid]);
      await expectSqlError('23505', `INSERT INTO credentials (id, user_id, type, secret_hash) VALUES ($1,$2,'password','again')`, [randomUUID(), uid]);
      // several PINs (one per device) are fine
      for (let i = 0; i < 2; i++) await db.query(`INSERT INTO credentials (id, user_id, type, secret_hash) VALUES ($1,$2,'pin','p')`, [randomUUID(), uid]);
    });

    test('rejects rows pointing at a missing user or device', async () => {
      await expectSqlError('23503', `INSERT INTO identities (id, user_id, type, value_hash, value_encrypted) VALUES ($1,$2,'email','h','e')`, [randomUUID(), randomUUID()]);
      const uid = await rawUser();
      await expectSqlError('23503', `INSERT INTO credentials (id, user_id, type, secret_hash, device_id) VALUES ($1,$2,'pin','h',$3)`, [randomUUID(), uid, randomUUID()]);
    });

    test('deleting a user removes its identities and credentials; deleting a device removes its PIN', async () => {
      const uid = await rawUser();
      const dev = randomUUID();
      await db.query(`INSERT INTO user_devices (id, user_id, device_fingerprint, device_name, device_type, status) VALUES ($1,$2,'fp','phone','mobile','active')`, [dev, uid]);
      await db.query(`INSERT INTO identities (id, user_id, type, value_hash, value_encrypted) VALUES ($1,$2,'email',$3,'e')`, [randomUUID(), uid, `c-${randomUUID()}`]);
      await db.query(`INSERT INTO credentials (id, user_id, type, secret_hash) VALUES ($1,$2,'password','h')`, [randomUUID(), uid]);
      const pin = randomUUID();
      await db.query(`INSERT INTO credentials (id, user_id, type, secret_hash, device_id) VALUES ($1,$2,'pin','h',$3)`, [pin, uid, dev]);
      await db.query('DELETE FROM user_devices WHERE id = $1', [dev]);
      assert.equal((await q('SELECT 1 FROM credentials WHERE id = $1', [pin])).length, 0, 'PIN must go with its device');
      assert.equal((await q('SELECT 1 FROM credentials WHERE user_id = $1', [uid])).length, 1, 'password stays');
      await db.query('DELETE FROM users WHERE id = $1', [uid]);
      assert.equal((await q('SELECT 1 FROM identities WHERE user_id = $1 UNION ALL SELECT 1 FROM credentials WHERE user_id = $1', [uid])).length, 0);
    });
  });

  // ------------------------------------------------------------------ migration behaviour
  describe('migration (shared SQL)', () => {
    test('re-applying the shared SQL is a no-op (idempotent, no duplicate backfill)', async () => {
      await createUser('fastapi');
      // The first run may legitimately backfill legacy-only users inserted directly by the schema tests above.
      await db.query(SHARED_SQL);
      const before = await one('SELECT (SELECT count(*) FROM identities)::int AS i, (SELECT count(*) FROM credentials)::int AS c');
      await db.query(SHARED_SQL);
      await db.query(SHARED_SQL);
      const after = await one('SELECT (SELECT count(*) FROM identities)::int AS i, (SELECT count(*) FROM credentials)::int AS c');
      assert.deepEqual(after, before);
    });

    test('backfill restores rows for a legacy-only user and the user can log in before and after', async () => {
      const u = await createUser('laravel');
      await db.query('DELETE FROM identities WHERE user_id = $1', [u.id]);
      await db.query('DELETE FROM credentials WHERE user_id = $1', [u.id]);
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 200, `${n}: legacy fallback login`);
      await db.query(SHARED_SQL);
      await assertConsistent(u.id, 'after backfill');
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 200, `${n}: login after backfill`);
    });

    test('re-applying never fails or overwrites when a user\'s identity already differs from the legacy column', async () => {
      const u = await createUser('nestjs');
      // simulate a future email change: the identity holds a new value, the legacy column the old one
      await db.query(`UPDATE identities SET value_hash = $2 WHERE user_id = $1 AND type = 'email'`, [u.id, `changed-${randomUUID()}`.slice(0, 64)]);
      const before = await q(`SELECT id, value_hash FROM identities WHERE user_id = $1 ORDER BY id`, [u.id]);
      await db.query(SHARED_SQL); // must not raise uq_identities_user_type_primary
      assert.deepEqual(await q(`SELECT id, value_hash FROM identities WHERE user_id = $1 ORDER BY id`, [u.id]), before);
    });

    test('re-applying never brings back a soft-deleted email identity or password credential', async () => {
      const u = await createUser('fastapi');
      await db.query(`UPDATE identities SET deleted_at = now() WHERE user_id = $1 AND type = 'email'`, [u.id]);
      await db.query(`UPDATE credentials SET deleted_at = now() WHERE user_id = $1 AND type = 'password'`, [u.id]);
      await db.query(SHARED_SQL);
      assert.equal((await q(`SELECT 1 FROM identities WHERE user_id = $1 AND type = 'email' AND deleted_at IS NULL`, [u.id])).length, 0);
      assert.equal((await q(`SELECT 1 FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL`, [u.id])).length, 0);
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 401, `${n} logged in after re-apply`);
    });

    test('every backend reports no pending migration for this change on a migrated database', async () => {
      // NestJS counts its own migrations; it must not see 0003 as pending once the tables exist.
      const r = await call('nestjs', 'GET', '/setup/checks', { headers: { 'X-Setup-Token': SETUP_TOKEN } });
      if (r.status === 200) assert.equal(r.json.migrations_pending, 0, r.text);
    });
  });

  // ------------------------------------------------------------------ writes
  describe('writes go to the new tables and the legacy columns', () => {
    test('setup admin has identities and a password credential', async () => {
      const admin = await one('SELECT u.id FROM users u WHERE u.is_super_admin ORDER BY created_at DESC LIMIT 1');
      await assertConsistent(admin.id, 'setup admin');
    });

    for (const creator of NAMES) {
      test(`user created on ${creator}: one primary email, one primary phone, one active password`, async () => {
        const u = await createUser(creator);
        await assertConsistent(u.id, creator);
      });
      test(`user created on ${creator} without mobile has no phone identity`, async () => {
        const u = await createUser(creator, { mobile: false });
        await assertConsistent(u.id, `${creator} no-mobile`);
      });
    }

    for (const changer of NAMES) {
      test(`password changed on ${changer}: single credential updated, old password rejected everywhere`, async () => {
        const u = await createUser('nestjs');
        const t = (await login(changer, u.email, u.password)).json.access_token;
        const next = `Next-Passw0rd!${changer}`;
        const r = await call(changer, 'POST', '/auth/change-password', { token: t, body: { current_password: u.password, new_password: next } });
        assert.equal(r.status, 200, r.text);
        await assertConsistent(u.id, `after change on ${changer}`);
        for (const n of NAMES) {
          assert.equal((await login(n, u.email, u.password)).status, 401, `${n} still accepts the old password`);
          assert.equal((await login(n, u.email, next)).status, 200, `${n} rejects the new password`);
        }
      });

      test(`forgot-password on ${changer} replaces the credential (temp password) in both places`, async () => {
        const u = await createUser('fastapi');
        const before = await one(`SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password'`, [u.id]);
        const r = await call(changer, 'POST', '/auth/forgot-password', { body: { email: u.email } });
        assert.equal(r.status, 200, r.text);
        // NestJS sends the email asynchronously but writes the password synchronously; allow a moment anyway
        await sleep(200);
        await assertConsistent(u.id, `after forgot on ${changer}`);
        const afterRow = await one(`SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL`, [u.id]);
        assert.notEqual(afterRow.secret_hash, before.secret_hash, 'credential must change');
        for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 401, `${n}: old password still works`);
      });
    }

    test('concurrent password changes from all backends leave exactly one active credential that matches users', async () => {
      const u = await createUser('laravel');
      const toks = {};
      for (const n of NAMES) toks[n] = (await login(n, u.email, u.password)).json.access_token;
      const results = await Promise.all(NAMES.map((n) => call(n, 'POST', '/auth/change-password', {
        token: toks[n], body: { current_password: u.password, new_password: `Race-Passw0rd!${n}` },
      })));
      const ok = NAMES.filter((n, i) => results[i].status === 200);
      assert.ok(ok.length >= 1, `no change succeeded: ${results.map((r) => r.status)}`);
      await assertConsistent(u.id, 'after race');
      const works = [];
      for (const n of NAMES) if ((await login('fastapi', u.email, `Race-Passw0rd!${n}`)).status === 200) works.push(n);
      assert.equal(works.length, 1, `exactly one candidate password must win, got ${works}`);
      assert.ok(ok.includes(works[0]), 'the winning password came from a request that reported success');
      for (const n of NAMES) assert.equal((await login(n, u.email, `Race-Passw0rd!${works[0]}`)).status, 200, `${n} disagrees on the winner`);
    });

    for (const creator of NAMES) {
      test(`duplicate email (different case) on ${creator} is rejected and leaves no orphan rows`, async () => {
        const u = await createUser('fastapi');
        const users = (await one('SELECT count(*)::int AS n FROM users')).n;
        const idents = (await one('SELECT count(*)::int AS n FROM identities')).n;
        const r = await call(creator, 'POST', '/users', {
          token: tokens[creator], body: { first_name: 'Dup', email: u.email.toUpperCase(), password: 'Dup-Passw0rd!1' },
        });
        assert.equal(r.status, 409, `${creator}: ${r.text}`);
        assert.equal((await one('SELECT count(*)::int AS n FROM users')).n, users, 'no extra user row');
        assert.equal((await one('SELECT count(*)::int AS n FROM identities')).n, idents, 'no orphan identity');
      });

      test(`duplicate mobile on ${creator} is rejected and leaves no orphan rows`, async () => {
        const u = await createUser('nestjs');
        const users = (await one('SELECT count(*)::int AS n FROM users')).n;
        const idents = (await one('SELECT count(*)::int AS n FROM identities')).n;
        const creds = (await one('SELECT count(*)::int AS n FROM credentials')).n;
        const r = await call(creator, 'POST', '/users', {
          token: tokens[creator], body: { first_name: 'Dup', email: `dupm-${creator}-${run}@parity.example.com`, password: 'Dup-Passw0rd!1', mobile: u.mobile },
        });
        assert.equal(r.status, 409, `${creator}: ${r.text}`);
        assert.equal(r.json?.code, 'mobile_already_exists', `${creator}: ${r.text}`);
        assert.equal((await one('SELECT count(*)::int AS n FROM users')).n, users, 'no extra user row');
        assert.equal((await one('SELECT count(*)::int AS n FROM identities')).n, idents, 'no orphan identity');
        assert.equal((await one('SELECT count(*)::int AS n FROM credentials')).n, creds, 'no orphan credential');
      });
    }
  });

  // ------------------------------------------------------------------ reads
  describe('reads prefer the new tables and never resurrect removed rows', () => {
    test('the credential is the source of truth: its password works, the legacy column password does not', async () => {
      const a = await createUser('fastapi');
      const b = await createUser('fastapi');
      // a's credential now holds b's hash; a's legacy column still holds a's own hash
      await db.query(`UPDATE credentials SET secret_hash = (SELECT secret_hash FROM credentials WHERE user_id = $2 AND type = 'password')
                       WHERE user_id = $1 AND type = 'password'`, [a.id, b.id]);
      for (const n of NAMES) {
        assert.equal((await login(n, a.email, b.password)).status, 200, `${n} ignores the credentials table`);
        assert.equal((await login(n, a.email, a.password)).status, 401, `${n} accepts the stale legacy password`);
      }
    });

    test('the identity is the source of truth for email lookup', async () => {
      const a = await createUser('laravel');
      const b = await createUser('laravel');
      // move a's email identity to b (and give a's legacy column a value nobody uses)
      await db.query(`DELETE FROM identities WHERE user_id = $1 AND type = 'email'`, [b.id]);
      await db.query(`UPDATE identities SET user_id = $2, is_primary = true WHERE user_id = $1 AND type = 'email'`, [a.id, b.id]);
      await db.query(`UPDATE users SET email_hash = $2 WHERE id = $1`, [a.id, `stale-${randomUUID()}`.slice(0, 64)]);
      for (const n of NAMES) {
        assert.equal((await login(n, a.email, b.password)).status, 200, `${n} does not resolve the email through identities`);
        assert.equal((await login(n, a.email, a.password)).status, 401, `${n} resolved the email to the old owner`);
      }
    });

    test('legacy fallback: a user with no identity/credential rows can still log in', async () => {
      const u = await createUser('nestjs');
      await db.query('DELETE FROM identities WHERE user_id = $1', [u.id]);
      await db.query('DELETE FROM credentials WHERE user_id = $1', [u.id]);
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 200, `${n}: no legacy fallback`);
    });

    test('a soft-deleted email identity is not brought back through the legacy column', async () => {
      const u = await createUser('fastapi');
      await db.query(`UPDATE identities SET deleted_at = now() WHERE user_id = $1 AND type = 'email'`, [u.id]);
      for (const n of NAMES) {
        const r = await login(n, u.email, u.password);
        assert.equal(r.status, 401, `${n} logged in with a removed email: ${r.text}`);
        assert.equal(r.json?.code, 'invalid_credentials', `${n}: ${r.text}`);
      }
    });

    test('a soft-deleted password credential is not brought back through the legacy column', async () => {
      const u = await createUser('laravel');
      await db.query(`UPDATE credentials SET deleted_at = now() WHERE user_id = $1 AND type = 'password'`, [u.id]);
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 401, `${n} logged in with a removed password`);
      await db.query(`UPDATE users SET failed_login_attempts = 0, blocked_until = NULL WHERE id = $1`, [u.id]);
    });

    test('a soft-deleted user cannot log in even though its identity is active', async () => {
      const u = await createUser('nestjs');
      await db.query('UPDATE users SET deleted_at = now() WHERE id = $1', [u.id]);
      for (const n of NAMES) assert.equal((await login(n, u.email, u.password)).status, 401, `${n} logged in a deleted user`);
    });

    test('unknown email: same 401 invalid_credentials on every backend', async () => {
      for (const n of NAMES) {
        const r = await login(n, `nobody-${run}@parity.example.com`, 'Whatever-Passw0rd!1');
        assert.equal(r.status, 401, n);
        assert.equal(r.json?.code, 'invalid_credentials', `${n}: ${r.text}`);
      }
    });

    test('email lookup through identities is case-insensitive on every backend', async () => {
      const u = await createUser('laravel');
      for (const n of NAMES) assert.equal((await login(n, u.email.toUpperCase(), u.password)).status, 200, n);
    });
  });
});
