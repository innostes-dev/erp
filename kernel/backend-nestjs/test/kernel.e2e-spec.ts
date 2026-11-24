import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { EmailService, PasswordResetEmail } from '../src/auth/email.service';
import { AuditService } from '../src/audit/audit.service';
import { DatabaseService } from '../src/db/database.service';
import { SetupTokenService } from '../src/setup/setup-token.service';
import { UsersService } from '../src/users/users.service';
import { createApp, resetE2eDatabase } from './e2e-helpers';

const vectors = JSON.parse(readFileSync(join(__dirname, 'fixtures/python-vectors.json'), 'utf8'));
const SETUP_TOKEN = process.env.SETUP_TOKEN ?? 'test-setup-token';
const ADMIN = { email: 'admin@e2e.example.com', password: 'Str0ng-Passw0rd!' };

describe('kernel API (e2e, real PostgreSQL)', () => {
  let app: NestExpressApplication;
  let db: DatabaseService;
  let http: ReturnType<typeof request>;
  const sent: PasswordResetEmail[] = [];
  const s: Record<string, string> = {};

  const api = (): ReturnType<typeof request> => request(app.getHttpServer());
  const login = (email = ADMIN.email, password = ADMIN.password) => api().post('/auth/login').send({ email, password });
  const auth = (t: string = s.access) => ({ Authorization: `Bearer ${t}` });
  const q = async <T extends object = Record<string, unknown>>(sql: string, p: unknown[] = []): Promise<T[]> =>
    (await db.query(sql, p)).rows as T[];

  beforeAll(async () => {
    await resetE2eDatabase();
    app = await createApp((b) =>
      b.overrideProvider(EmailService).useValue({
        sendPasswordReset: (m: PasswordResetEmail) => {
          sent.push(m);
          return Promise.resolve();
        },
      }),
    );
    db = app.get(DatabaseService);
    http = api();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('before setup', () => {
    it('serves /, /health and /setup/status; blocks everything else with 503 setup_required', async () => {
      expect((await http.get('/')).body).toMatchObject({ service: expect.any(String), status: 'online' });
      expect((await http.get('/health')).body).toMatchObject({ status: 'pass', database: { status: 'HEALTHY' } });
      expect((await http.get('/setup/status')).body).toEqual({ installed: false });
      const r = await http.get('/tenants');
      expect(r.status).toBe(503);
      expect(r.body).toEqual({ detail: 'Setup has not been completed', code: 'setup_required' });
      expect((await http.get('/config')).status).toBe(503);
    });

    it('setup endpoints demand the token (constant-time) and report pending migrations', async () => {
      const bad = await http.get('/setup/checks').set('X-Setup-Token', 'wrong');
      expect(bad.status).toBe(401);
      expect(bad.body.code).toBe('invalid_setup_token');
      expect(bad.headers['www-authenticate']).toBe('SetupToken header="X-Setup-Token"');
      const ok = await http.get('/setup/checks').set('X-Setup-Token', SETUP_TOKEN);
      expect(ok.body).toEqual({ database_connected: true, migrations_pending: 3 });
    });

    it('blocks the setup token after 10 wrong guesses (429 + Retry-After)', async () => {
      let last = await http.get('/setup/checks').set('X-Setup-Token', 'wrong');
      for (let i = 0; i < 10; i++) last = await http.get('/setup/checks').set('X-Setup-Token', 'wrong');
      expect(last.status).toBe(429);
      expect(Number(last.headers['retry-after'])).toBeGreaterThan(0);
      // reset the limiter state for the following tests
      app.get(SetupTokenService).reset();
    });

    it('rejects an install without admin (no default credentials) and invalid bodies with 422', async () => {
      const r = await http
        .post('/setup')
        .set('X-Setup-Token', SETUP_TOKEN)
        .send({ organization: { name: 'X', slug: 'x' } });
      expect(r.status).toBe(422);
      expect(r.body.detail).toContainEqual({ loc: ['body', 'admin'], msg: 'Field required', type: 'missing' });
    });
  });

  describe('setup', () => {
    it('installs: tenant, super admin, RBAC seed, settings and installation row', async () => {
      const r = await http
        .post('/setup')
        .set('X-Setup-Token', SETUP_TOKEN)
        .send({
          organization: { name: 'E2E Org', slug: 'e2e-org', country: 'IN', timezone: 'Asia/Kolkata' },
          admin: { first_name: 'Ada', last_name: 'Lovelace', ...ADMIN, mobile: '+911234567890' },
          branding: { primary_color: '#112233' },
        });
      expect(r.status).toBe(201);
      s.tenantId = r.body.tenant.id;
      s.adminId = r.body.admin.id;
      expect(r.body.admin).toMatchObject({
        email: ADMIN.email,
        mobile: '+911234567890',
        is_super_admin: true,
        status: 'active',
        token_version: 1,
      });
      expect(r.body.admin).not.toHaveProperty('password_hash');

      expect((await q<{ n: number }>('SELECT count(*)::int AS n FROM permissions'))[0].n).toBe(30);
      expect((await q<{ n: number }>('SELECT count(*)::int AS n FROM roles'))[0].n).toBe(9);
      expect((await q<{ n: number }>('SELECT count(*)::int AS n FROM role_permissions'))[0].n).toBe(
        30 * 2 + 15 + 5 + 6 + 4 + 5 + 3 + 3,
      );
      expect(
        (await q<{ n: number }>('SELECT count(*)::int AS n FROM user_roles WHERE user_id = $1', [s.adminId]))[0].n,
      ).toBe(2);
      const settings = await q<{ namespace: string; config: Record<string, unknown> }>(
        'SELECT namespace, config FROM tenant_settings WHERE tenant_id = $1 ORDER BY namespace',
        [s.tenantId],
      );
      expect(settings.map((x) => x.namespace)).toEqual(['auth', 'branding', 'localization']);
      expect(settings[1].config).toMatchObject({ primary_color: '#112233', company_display_name: 'E2E Org' });
      expect((await q<{ n: number }>('SELECT count(*)::int AS n FROM installation'))[0].n).toBe(1);
      expect(
        (await q<{ email_encrypted: string }>('SELECT email_encrypted FROM users WHERE id = $1', [s.adminId]))[0]
          .email_encrypted,
      ).toMatch(/^v1:[A-Za-z0-9+/=]{16}:[A-Za-z0-9+/=]+$/);
    });

    it('is one-shot (404 setup_not_available) and the setup-required gate opens', async () => {
      const r = await http.post('/setup').set('X-Setup-Token', SETUP_TOKEN).send({});
      expect(r.status).toBe(404);
      expect(r.body.code).toBe('setup_not_available');
      expect((await http.get('/setup/status')).body).toEqual({ installed: true });
      expect((await http.get('/config')).status).toBe(200);
    });
  });

  describe('authentication', () => {
    it('login sets HttpOnly cookies; the access_token cookie alone authenticates', async () => {
      const r = await login();
      expect(r.status).toBe(200);
      s.access = r.body.access_token;
      s.refresh = r.body.refresh_token;
      const cookies = (r.headers['set-cookie'] as unknown as string[]).join('\n');
      const [access, refresh] = cookies.split('\n');
      for (const part of ['Path=/', 'Max-Age=900', 'HttpOnly', 'SameSite=Lax']) expect(access).toContain(part);
      for (const part of ['Path=/auth', 'Max-Age=604800', 'HttpOnly', 'SameSite=Lax']) expect(refresh).toContain(part);
      const me = await http.get('/auth/me').set('Cookie', `access_token=${s.access}`);
      expect(me.status).toBe(200);
      expect(me.body.email).toBe(ADMIN.email);
      expect(me.body.accessible_tenants).toHaveLength(1);
      expect(me.headers.etag).toBe('"1"');
    });

    it('/auth/me honours If-None-Match with 304 and an empty body', async () => {
      const r = await http.get('/auth/me').set(auth()).set('If-None-Match', '"1"');
      expect(r.status).toBe(304);
      expect(r.text).toBe('');
      expect((await http.get('/auth/me').set(auth()).set('If-None-Match', '"7"')).status).toBe(200);
    });

    it('an Authorization header wins over the cookie', async () => {
      const r = await http
        .get('/auth/me')
        .set('Cookie', `access_token=${s.access}`)
        .set('Authorization', 'Bearer garbage');
      expect(r.status).toBe(401);
      expect(r.body.code).toBe('invalid_token');
    });

    it('persists the failed-login counter and the lockout even though the request is a 401', async () => {
      const u = { email: 'locky@e2e.example.com', password: 'Locky-Passw0rd!!' };
      expect(
        (
          await http
            .post('/users')
            .set(auth())
            .send({ first_name: 'Locky', ...u })
        ).status,
      ).toBe(201);
      for (let i = 1; i <= 4; i++) {
        expect((await login(u.email, 'wrong-wrong')).status).toBe(401);
        expect(
          (
            await q<{ failed_login_attempts: number; blocked_until: Date | null }>(
              'SELECT failed_login_attempts, blocked_until FROM users WHERE email_hash = $1',
              [app.get(UsersService).blindIndex.compute(u.email)],
            )
          )[0],
        ).toMatchObject({ failed_login_attempts: i, blocked_until: null });
      }
      expect((await login(u.email, 'wrong-wrong')).status).toBe(401); // 5th failure -> locked
      const row = (
        await q<{ failed_login_attempts: number; blocked_until: Date }>(
          'SELECT failed_login_attempts, blocked_until FROM users WHERE id = (SELECT id FROM users WHERE first_name = $1)',
          ['Locky'],
        )
      )[0];
      expect(row.failed_login_attempts).toBe(5);
      expect(row.blocked_until.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
      const locked = await login(u.email, u.password);
      expect(locked.status).toBe(401);
      expect(locked.body.code).toBe('account_locked');
      expect(Number(locked.headers['retry-after'])).toBeGreaterThan(14 * 60 - 5);
      // lock expiry: counter restarts and success clears it
      await db.query("UPDATE users SET blocked_until = now() - interval '1 minute' WHERE first_name = 'Locky'");
      expect((await login(u.email, 'wrong-wrong')).status).toBe(401);
      expect(
        (
          await q<{ failed_login_attempts: number }>(
            "SELECT failed_login_attempts FROM users WHERE first_name = 'Locky'",
          )
        )[0].failed_login_attempts,
      ).toBe(1);
      expect((await login(u.email, u.password)).status).toBe(200);
      expect(
        (
          await q<{ failed_login_attempts: number }>(
            "SELECT failed_login_attempts FROM users WHERE first_name = 'Locky'",
          )
        )[0].failed_login_attempts,
      ).toBe(0);
    });

    it('refresh-token reuse revokes every session and the revocation persists', async () => {
      const l1 = await login();
      const l2 = await login();
      const rotated = await http.post('/auth/refresh').send({ refresh_token: l1.body.refresh_token });
      expect(rotated.status).toBe(200);
      expect(
        (
          await q<{ n: number }>(
            'SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL',
            [s.adminId],
          )
        )[0].n,
      ).toBeGreaterThan(1);
      const reuse = await http.post('/auth/refresh').send({ refresh_token: l1.body.refresh_token });
      expect(reuse.status).toBe(401);
      expect(reuse.body.detail).toMatch(/previously revoked/);
      expect(
        (
          await q<{ n: number }>(
            'SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL',
            [s.adminId],
          )
        )[0].n,
      ).toBe(0);
      expect((await http.post('/auth/refresh').send({ refresh_token: rotated.body.refresh_token })).status).toBe(401);
      expect((await http.post('/auth/refresh').send({ refresh_token: l2.body.refresh_token })).status).toBe(401);
    });

    it('refresh falls back to the refresh_token cookie when the body value is empty', async () => {
      const l = await login();
      const r = await http
        .post('/auth/refresh')
        .set('Cookie', `refresh_token=${l.body.refresh_token}`)
        .send({ refresh_token: '' });
      expect(r.status).toBe(200);
      const none = await http.post('/auth/refresh').send({ refresh_token: '' });
      expect(none.status).toBe(401);
      expect(none.body.detail).toBe('Refresh token missing.');
      const l2 = await login();
      s.access = l2.body.access_token;
      s.refresh = l2.body.refresh_token;
    });

    it('rows written by FastAPI/Laravel work: Python envelope + blind index + $2y$ bcrypt hash', async () => {
      const row = vectors.defaultRow;
      const id = '7a1d2c3e-4b5f-4a6b-8c7d-9e0f1a2b3c4d';
      await db.query(
        `INSERT INTO users (id, first_name, last_name, email_hash, email_encrypted, mobile_hash, mobile_encrypted, password_hash)
         VALUES ($1,'Py','Thon',$2,$3,$4,$5,$6)`,
        [id, row.email_hash, row.email_encrypted, row.mobile_hash, row.mobile_encrypted, row.password_hash_2y],
      );
      await db.query('INSERT INTO user_security (id, user_id) VALUES (gen_random_uuid(), $1)', [id]);
      const r = await login(row.email.toLowerCase(), row.password); // blind index is case-insensitive
      expect(r.status).toBe(200);
      expect(r.body.user).toMatchObject({ id, email: row.email, mobile: row.mobile });
      const got = await http.get(`/users/${id}`).set(auth());
      expect(got.body).toMatchObject({ email: row.email, mobile: row.mobile });
      // $2b$ variant
      await db.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, row.password_hash_2b]);
      expect((await login(row.email, row.password)).status).toBe(200);
    });

    it('wiped devices are blocked and temporary-password expiry is enforced', async () => {
      const u = { email: 'wipe@e2e.example.com', password: 'Wipe-Passw0rd!!' };
      await http
        .post('/users')
        .set(auth())
        .send({ first_name: 'Wipe', ...u });
      expect((await login(u.email, u.password)).status).toBe(200);
      await db.query(
        "UPDATE user_devices SET status = 'wiped' WHERE user_id = (SELECT id FROM users WHERE first_name = 'Wipe')",
      );
      const w = await login(u.email, u.password);
      expect(w.status).toBe(403);
      expect(w.body.code).toBe('device_wiped');
      await db.query(
        "UPDATE user_devices SET status = 'active' WHERE user_id = (SELECT id FROM users WHERE first_name = 'Wipe')",
      );
      await db.query(
        "UPDATE users SET must_change_password = true, temp_password_expires_at = now() - interval '1 hour' WHERE first_name = 'Wipe'",
      );
      const t = await login(u.email, u.password);
      expect(t.status).toBe(401);
      expect(t.body.code).toBe('temporary_password_expired');
      await db.query("UPDATE users SET status = 'suspended' WHERE first_name = 'Wipe'");
      expect((await login(u.email, u.password)).body.code).toBe('account_suspended');
    });
  });

  describe('password reset flow', () => {
    const user = { email: 'reset@e2e.example.com', password: 'Reset-Passw0rd!!' };

    it('forgot-password mails a temp password + single-use reset link and invalidates sessions', async () => {
      await http
        .post('/users')
        .set(auth())
        .send({ first_name: 'Reset', ...user });
      const l = await login(user.email, user.password);
      const before = await http.post('/auth/forgot-password').send({ email: user.email });
      expect(before.status).toBe(200);
      await new Promise((r) => setTimeout(r, 50));
      expect(sent).toHaveLength(1);
      expect(sent[0].resetLink).toMatch(/\/reset-password\?token=.+&email=reset%40e2e\.example\.com$/);
      expect(sent[0].tempPassword).toHaveLength(16);
      expect((await http.get('/auth/me').set(auth(l.body.access_token))).status).toBe(401);
      expect((await http.post('/auth/refresh').send({ refresh_token: l.body.refresh_token })).status).toBe(401);
      expect((await login(user.email, user.password)).status).toBe(401); // old password gone
      const temp = await login(user.email, sent[0].tempPassword);
      expect(temp.status).toBe(200);
      expect(temp.body.must_change_password).toBe(true);
      // unknown / suspended accounts get the same response and no mail
      const unknown = await http.post('/auth/forgot-password').send({ email: 'nobody@e2e.example.com' });
      expect(unknown.body).toEqual(before.body);
      expect(sent).toHaveLength(1);
    });

    it('reset-password consumes the token once, enforces history and clears must_change_password', async () => {
      const token = new URL(sent[0].resetLink).searchParams.get('token') as string;
      expect((await http.post('/auth/reset-password').send({ token, new_password: 'short' })).status).toBe(422);
      const ok = await http.post('/auth/reset-password').send({ token, new_password: 'Brand-New-Passw0rd!' });
      expect(ok.status).toBe(200);
      expect(ok.body.message).toMatch(/successfully reset/);
      const reuse = await http.post('/auth/reset-password').send({ token, new_password: 'Another-Passw0rd!!' });
      expect(reuse.status).toBe(401);
      expect(reuse.body.detail).toMatch(/already been used/);
      const l = await login(user.email, 'Brand-New-Passw0rd!');
      expect(l.status).toBe(200);
      expect(l.body.must_change_password).toBe(false);
      // an access token is not a reset token
      expect(
        (
          await http
            .post('/auth/reset-password')
            .send({ token: l.body.access_token, new_password: 'Whatever-Passw0rd!' })
        ).body.detail,
      ).toBe('Invalid token type');
      // history: the new password cannot be re-used via change-password
      const same = await http
        .post('/auth/change-password')
        .set(auth(l.body.access_token))
        .send({ current_password: 'Brand-New-Passw0rd!', new_password: 'Brand-New-Passw0rd!' });
      expect(same.status).toBe(409);
      expect(same.body.code).toBe('password_recently_used');
    });
  });

  describe('API keys', () => {
    it('are tenant-bound, scoped, hashed at rest, and revocable', async () => {
      const c = await http
        .post('/auth/api-keys')
        .set(auth())
        .send({ name: 'ci', scopes: ['tenancy.tenant.read'], expires_in_days: 1 });
      expect(c.status).toBe(201);
      expect(c.body.raw_key).toMatch(/^inno_live_[A-Za-z0-9_-]{43}$/);
      expect(c.body.key_prefix).toBe(`${c.body.raw_key.slice(0, 14)}...`);
      expect(c.body.scopes).toEqual(['tenancy.tenant.read']);
      const stored = (
        await q<{ key_hash: string; key_prefix: string; tenant_id: string }>(
          'SELECT key_hash, key_prefix, tenant_id FROM api_keys WHERE id = $1',
          [c.body.id],
        )
      )[0];
      expect(stored.key_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(stored.key_prefix).toHaveLength(17);
      expect(stored.tenant_id).toBe(s.tenantId);
      expect(JSON.stringify(stored)).not.toContain(c.body.raw_key);

      const other = await http.post('/tenants').set(auth()).send({ name: 'Other', slug: 'other-org' });
      // an API key cannot hop to another tenant with X-Tenant-ID
      const cur = await http.get('/tenants/current').set(auth(c.body.raw_key)).set('X-Tenant-ID', other.body.id);
      expect(cur.status).toBe(200);
      expect(cur.body.id).toBe(s.tenantId);
      // last_used_at is recorded
      expect(
        (await q<{ last_used_at: Date | null }>('SELECT last_used_at FROM api_keys WHERE id = $1', [c.body.id]))[0]
          .last_used_at,
      ).not.toBeNull();
      // keys are listed per tenant, newest first, without secrets
      const list = await http.get('/auth/api-keys').set(auth());
      expect(list.body.items[0].id).toBe(c.body.id);
      expect(JSON.stringify(list.body)).not.toContain('key_hash');
      expect((await http.post('/auth/api-keys').set(auth()).send({ name: 'bad', expires_in_days: 999 })).status).toBe(
        422,
      );
      expect(
        (await http.get('/auth/api-keys').set(auth()).set('X-Tenant-ID', '00000000-0000-4000-8000-000000000000')).body
          .code,
      ).toBe('tenant_not_found');

      expect((await http.delete(`/auth/api-keys/${c.body.id}`).set(auth())).body.is_revoked).toBe(true);
      expect((await http.get('/auth/me').set(auth(c.body.raw_key))).status).toBe(401);
      expect(
        (await http.delete(`/auth/api-keys/${'0'.repeat(8)}-0000-4000-8000-${'0'.repeat(12)}`).set(auth())).status,
      ).toBe(404);
      expect((await http.delete('/auth/api-keys/not-a-uuid').set(auth())).status).toBe(422);
    });

    it('expired keys are rejected', async () => {
      const c = await http.post('/auth/api-keys').set(auth()).send({ name: 'short' });
      await db.query("UPDATE api_keys SET expires_at = now() - interval '1 second' WHERE id = $1", [c.body.id]);
      expect((await http.get('/auth/me').set(auth(c.body.raw_key))).status).toBe(401);
    });
  });

  describe('tenancy & users', () => {
    it('validates pagination and bodies with FastAPI-style 422 items', async () => {
      const r = await http.get('/tenants?limit=0&offset=-1').set(auth());
      expect(r.status).toBe(422);
      expect(r.body.detail[0]).toMatchObject({ loc: ['query', 'offset'] });
      const bad = await http.post('/tenants').set(auth()).send({ name: '', slug: 'Bad Slug!', country: 'USA' });
      expect(bad.status).toBe(422);
      expect(bad.body.detail.map((d: { loc: string[] }) => d.loc[1]).sort()).toEqual(['country', 'name', 'slug']);
      expect((await http.get('/tenants/not-a-uuid').set(auth())).body.detail[0]).toMatchObject({
        loc: ['path', 'tenant_id'],
        type: 'uuid_parsing',
      });
      expect((await http.get('/tenants/current').set(auth()).set('X-Tenant-ID', 'zzz')).status).toBe(422);
    });

    it('include_deleted lists soft-deleted tenants; PATCH can clear nullable fields', async () => {
      const t = await http
        .post('/tenants')
        .set(auth())
        .send({ name: 'Temp', slug: 'temp-org', country: 'US', timezone: 'UTC' });
      expect((await http.patch(`/tenants/${t.body.id}`).set(auth()).send({ country: null })).body.country).toBeNull();
      await http.delete(`/tenants/${t.body.id}`).set(auth());
      expect((await http.delete(`/tenants/${t.body.id}`).set(auth())).status).toBe(404);
      const hidden = await http.get('/tenants?limit=200').set(auth());
      const shown = await http.get('/tenants?limit=200&include_deleted=true').set(auth());
      expect(hidden.body.items.find((x: { id: string }) => x.id === t.body.id)).toBeUndefined();
      expect(shown.body.items.find((x: { id: string }) => x.id === t.body.id).deleted_at).not.toBeNull();
      // slugs stay reserved after soft delete
      expect((await http.post('/tenants').set(auth()).send({ name: 'Again', slug: 'temp-org' })).body.code).toBe(
        'slug_taken',
      );
    });

    it('duplicate mobile numbers are a 409, not a 500', async () => {
      const m = '+19998887777';
      await http
        .post('/users')
        .set(auth())
        .send({ first_name: 'M1', email: 'm1@e2e.example.com', password: 'Mobile-Passw0rd!', mobile: m });
      const r = await http
        .post('/users')
        .set(auth())
        .send({ first_name: 'M2', email: 'm2@e2e.example.com', password: 'Mobile-Passw0rd!', mobile: m });
      expect(r.status).toBe(409);
      expect(r.body.code).toBe('mobile_already_exists');
    });

    it('membership, RBAC and module activation resolve through /auth/me', async () => {
      await http.post('/tenants/current/modules/peopleops/activate').set(auth());
      const me = await http.get('/auth/me').set(auth());
      const mod = me.body.accessible_modules.find((m: { code: string }) => m.code === 'peopleops');
      expect(mod).toMatchObject({
        name: 'PeopleOps HRMS',
        data_scope: 'ORGANIZATION',
        role: { code: 'super_admin', hierarchy_level: 100 },
      });
      expect(mod.permissions).toContain('peopleops.payroll.manage');
      // a member holding a module-tagged role sees only that module
      const u = await http
        .post('/users')
        .set(auth())
        .send({ first_name: 'Emp', email: 'emp@e2e.example.com', password: 'Employee-Passw0rd!' });
      await db.query(
        "INSERT INTO tenant_members (id, tenant_id, user_id, status) VALUES (gen_random_uuid(), $1, $2, 'active')",
        [s.tenantId, u.body.id],
      );
      await db.query(
        "INSERT INTO user_roles (id, user_id, role_id, tenant_id) SELECT gen_random_uuid(), $1, id, $2 FROM roles WHERE code = 'employee'",
        [u.body.id, s.tenantId],
      );
      const el = await login('emp@e2e.example.com', 'Employee-Passw0rd!');
      const emp = await http.get('/auth/me').set(auth(el.body.access_token));
      expect(emp.body.accessible_tenants).toHaveLength(1);
      expect(emp.body.accessible_modules).toHaveLength(1);
      expect(emp.body.accessible_modules[0]).toMatchObject({
        code: 'peopleops',
        role: { code: 'employee' },
        data_scope: 'OWN',
      });
      expect(emp.body.accessible_modules[0].permissions.sort()).toEqual([
        'peopleops.directory.read',
        'peopleops.leave.apply',
        'peopleops.payroll.view',
      ]);
    });
  });

  describe('audit trail', () => {
    it('records the reference actions with actor, entity and request metadata', async () => {
      const rows = await q<{
        action: string;
        entity_type: string;
        status: string;
        ip_address: string | null;
        user_agent: string | null;
      }>('SELECT action, entity_type, status, ip_address, user_agent FROM audit_logs ORDER BY created_at');
      const pairs = new Set(rows.map((r) => `${r.action}:${r.entity_type}`));
      for (const p of [
        'LOGIN:user',
        'CREATE:user',
        'CREATE:tenant',
        'CREATE:api_key',
        'DELETE:api_key',
        'UPDATE:tenant',
        'DELETE:tenant',
        'RBAC_CHANGE:tenant_module',
      ])
        expect(pairs).toContain(p);
      expect(rows.every((r) => r.status === 'SUCCESS')).toBe(true);
      expect(rows.find((r) => r.action === 'LOGIN')?.ip_address).toBeTruthy();
      const sensitive = await q('SELECT 1 FROM audit_logs WHERE changes::text ILIKE ANY (ARRAY[$1, $2])', [
        '%Passw0rd%',
        '%raw_key%',
      ]);
      expect(sensitive).toHaveLength(0);
    });

    it('logout and password change are audited; audit failures never fail the request', async () => {
      const l = await login();
      expect(
        (await http.post('/auth/logout').set(auth(l.body.access_token)).send({ refresh_token: l.body.refresh_token }))
          .status,
      ).toBe(200);
      expect(
        (await q("SELECT 1 FROM audit_logs WHERE action = 'LOGOUT' AND actor_id = $1", [s.adminId])).length,
      ).toBeGreaterThan(0);

      const audit = app.get(AuditService);
      const spy = jest.spyOn(audit, 'record').mockRejectedValue(new Error('audit table on fire'));
      try {
        const r = await login();
        expect(r.status).toBe(200);
        s.access = r.body.access_token;
        s.refresh = r.body.refresh_token;
        expect((await http.post('/tenants').set(auth()).send({ name: 'No Audit', slug: 'no-audit' })).status).toBe(201);
        expect(spy).toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('password lifecycle & sessions', () => {
    it('change-password bumps token_version, revokes sessions and logout_all kills access tokens', async () => {
      const l = await login();
      const ch = await http
        .post('/auth/change-password')
        .set(auth(l.body.access_token))
        .send({ current_password: ADMIN.password, new_password: 'Changed-Passw0rd!' });
      expect(ch.status).toBe(200);
      expect((await http.get('/auth/me').set(auth(l.body.access_token))).body.code).toBe('invalid_token');
      expect((await http.post('/auth/refresh').send({ refresh_token: l.body.refresh_token })).status).toBe(401);
      const l2 = await login(ADMIN.email, 'Changed-Passw0rd!');
      expect((await http.get('/auth/me').set(auth(l2.body.access_token))).headers.etag).toBe('"2"');
      expect((await http.post('/auth/logout').set(auth(l2.body.access_token)).send({ logout_all: true })).status).toBe(
        200,
      );
      expect((await http.get('/auth/me').set(auth(l2.body.access_token))).status).toBe(401);
      expect(
        (
          await q<{ n: number }>(
            'SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL',
            [s.adminId],
          )
        )[0].n,
      ).toBe(0);
      const cleared = await http
        .post('/auth/logout')
        .set(auth((await login(ADMIN.email, 'Changed-Passw0rd!')).body.access_token))
        .send({});
      expect((cleared.headers['set-cookie'] as unknown as string[]).join('\n')).toMatch(
        /access_token=;.*Expires=Thu, 01 Jan 1970/,
      );
    });
  });

  describe('transport behaviour', () => {
    it('malformed JSON is a 422 json_invalid; unknown routes are JSON 404s; errors carry a correlation id', async () => {
      const bad = await http.post('/auth/login').set('Content-Type', 'application/json').send('{oops');
      expect(bad.status).toBe(422);
      expect(bad.body.detail[0]).toMatchObject({ loc: ['body'], type: 'json_invalid' });
      const nf = await http.get('/definitely/not/here');
      expect(nf.status).toBe(404);
      expect(nf.body).toEqual({ detail: 'Not Found' });
      const cid = await http.get('/').set('X-Correlation-ID', 'abc-123');
      expect(cid.headers['x-correlation-id']).toBe('abc-123');
    });

    it('sets security headers and exposes OpenAPI at /openapi.json with the kernel tags', async () => {
      const r = await http.get('/openapi.json');
      expect(r.status).toBe(200);
      expect(r.headers['x-content-type-options']).toBe('nosniff');
      expect(r.headers['x-powered-by']).toBeUndefined();
      const tags = new Set(
        Object.values(r.body.paths as Record<string, Record<string, { tags: string[] }>>).flatMap((p) =>
          Object.values(p).map((o) => o.tags[0]),
        ),
      );
      expect([...tags].sort()).toEqual([
        'Authentication',
        'General',
        'Observability',
        'Setup',
        'Tenancy',
        'User management',
      ]);
    });

    it('/metrics is disabled by default', async () => {
      expect((await http.get('/metrics')).status).toBe(404);
    });
  });

  describe('migrations', () => {
    it('are a no-op when the schema already exists', async () => {
      const { Migrator } = await import('../src/db/migrator');
      const m = new Migrator(db);
      expect(await m.pending()).toBe(0);
      expect(await m.run()).toBe(false);
      // a database created by another backend still has VARCHAR(16): widened idempotently
      await db.query('DELETE FROM api_keys');
      await db.query('ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(16)');
      expect(await m.pending()).toBe(1);
      expect(await m.run()).toBe(true);
      expect(await m.run()).toBe(false);
    });
  });
});
