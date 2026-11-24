import { randomUUID } from 'node:crypto';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { DatabaseService } from '../src/db/database.service';
import { createApp, resetE2eDatabase } from './e2e-helpers';

/** Regression tests for the security review (docs/backend-parity/security/nestjs.md). */
describe('security regressions (e2e, real PostgreSQL)', () => {
  let app: NestExpressApplication;
  let db: DatabaseService;
  const api = (): ReturnType<typeof request> => request(app.getHttpServer());
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const run = Date.now();
  const PASSWORD = 'Sec-Passw0rd!x';
  const s: Record<string, string> = {};

  const login = async (email: string, password = PASSWORD): Promise<string> => {
    const r = await api().post('/auth/login').send({ email, password });
    expect(r.status).toBe(200);
    return r.body.access_token as string;
  };

  const newUser = async (name: string): Promise<{ id: string; email: string; token: string }> => {
    const email = `${name}-${run}@sec.example.com`;
    const r = await api().post('/users').set(bearer(s.root)).send({ first_name: name, email, password: PASSWORD });
    expect(r.status).toBe(201);
    return { id: r.body.id, email, token: await login(email) };
  };

  const join = async (userId: string, tenantId: string, roleCode?: string): Promise<void> => {
    await db.query(`INSERT INTO tenant_members (id, tenant_id, user_id, status) VALUES ($1,$2,$3,'active')`, [
      randomUUID(),
      tenantId,
      userId,
    ]);
    if (roleCode) {
      await db.query(
        `INSERT INTO user_roles (id, user_id, role_id, tenant_id, assigned_at)
         SELECT $1, $2, id, $3, now() FROM roles WHERE code = $4 AND tenant_id IS NULL`,
        [randomUUID(), userId, tenantId, roleCode],
      );
    }
  };

  beforeAll(async () => {
    process.env.RATE_LIMIT_LOGIN_PER_MINUTE = '1000'; // these tests fire hundreds of logins from one address
    await resetE2eDatabase();
    app = await createApp();
    db = app.get(DatabaseService);
    const email = `root-${run}@sec.example.com`;
    const setup = await api()
      .post('/setup')
      .set('X-Setup-Token', process.env.SETUP_TOKEN ?? 'test-setup-token')
      .send({
        organization: { name: 'Org A', slug: `org-a-${run}` },
        admin: { first_name: 'Root', email, password: PASSWORD },
      });
    expect(setup.status).toBe(201);
    s.tenantA = setup.body.tenant.id;
    s.root = await login(email);
    const b = await api()
      .post('/tenants')
      .set(bearer(s.root))
      .send({ name: 'Org B', slug: `org-b-${run}` });
    s.tenantB = b.body.id;
  });

  afterAll(async () => {
    await app?.close();
    delete process.env.RATE_LIMIT_LOGIN_PER_MINUTE;
  });

  describe('tenant isolation and authorization (broken access control)', () => {
    it('a user without membership cannot see, change, delete or create tenants', async () => {
      const u = await newUser('outsider');
      const list = await api().get('/tenants').set(bearer(u.token));
      expect(list.status).toBe(200);
      expect(list.body).toMatchObject({ items: [], total: 0 });
      expect((await api().get(`/tenants/${s.tenantA}`).set(bearer(u.token))).status).toBe(404);
      expect((await api().patch(`/tenants/${s.tenantA}`).set(bearer(u.token)).send({ name: 'x' })).status).toBe(404);
      expect((await api().delete(`/tenants/${s.tenantA}`).set(bearer(u.token))).status).toBe(404);
      expect((await api().post(`/tenants/${s.tenantA}/restore`).set(bearer(u.token))).status).toBe(404);
      const create = await api()
        .post('/tenants')
        .set(bearer(u.token))
        .send({ name: 'Squat', slug: `sq-${run}` });
      expect(create.status).toBe(403);
      expect(create.body.code).toBe('permission_denied');
      // ...and the tenant is untouched.
      const still = await api().get(`/tenants/${s.tenantA}`).set(bearer(s.root));
      expect(still.body.name).toBe('Org A');
    });

    it('no "oldest tenant" fallback and no X-Tenant-ID override for non-members', async () => {
      const u = await newUser('nofallback');
      const cur = await api().get('/tenants/current').set(bearer(u.token));
      expect(cur.status).toBe(404);
      for (const path of ['/tenants/current', '/tenants/current/modules', '/tenants/current/plugins']) {
        const r = await api().get(path).set(bearer(u.token)).set('X-Tenant-ID', s.tenantB);
        expect(r.status).toBe(403);
      }
    });

    it('members see only their tenants; RBAC decides who may update/delete', async () => {
      const plain = await newUser('plainmember');
      const admin = await newUser('tenantadmin');
      await join(plain.id, s.tenantA);
      await join(admin.id, s.tenantA, 'admin');

      const mine = await api().get('/tenants').set(bearer(plain.token));
      expect(mine.body.items.map((t: { id: string }) => t.id)).toEqual([s.tenantA]);
      expect((await api().get(`/tenants/${s.tenantA}`).set(bearer(plain.token))).status).toBe(200);
      expect((await api().get(`/tenants/${s.tenantB}`).set(bearer(plain.token))).status).toBe(404);
      expect((await api().get('/tenants/current').set(bearer(plain.token))).body.id).toBe(s.tenantA);

      const denied = await api().patch(`/tenants/${s.tenantA}`).set(bearer(plain.token)).send({ name: 'nope' });
      expect(denied.status).toBe(403);
      expect(denied.body.code).toBe('permission_denied');
      expect((await api().delete(`/tenants/${s.tenantA}`).set(bearer(plain.token))).status).toBe(403);

      const ok = await api().patch(`/tenants/${s.tenantA}`).set(bearer(admin.token)).send({ timezone: 'UTC' });
      expect(ok.status).toBe(200);
      // admin holds tenancy.tenant.update but not tenancy.tenant.delete, and has no rights in tenant B.
      expect((await api().delete(`/tenants/${s.tenantA}`).set(bearer(admin.token))).status).toBe(403);
      expect((await api().patch(`/tenants/${s.tenantB}`).set(bearer(admin.token)).send({ name: 'x' })).status).toBe(
        404,
      );
      // include_deleted is a platform-operator feature
      expect((await api().get('/tenants?include_deleted=true').set(bearer(plain.token))).status).toBe(200);
    });

    it('module activation stays super-admin only', async () => {
      const admin = await newUser('modadmin');
      await join(admin.id, s.tenantA, 'admin');
      const r = await api().post('/tenants/current/modules/peopleops/activate').set(bearer(admin.token));
      expect(r.status).toBe(403);
    });

    it('POST /users needs user.users.create; GET /users/:id needs self or user.users.read within a shared tenant', async () => {
      const outsider = await newUser('outsider2');
      const plain = await newUser('plain2');
      const admin = await newUser('admin2');
      await join(plain.id, s.tenantA);
      await join(admin.id, s.tenantA, 'admin');

      const body = { first_name: 'X', email: `x-${run}@sec.example.com`, password: PASSWORD, is_super_admin: true };
      expect((await api().post('/users').set(bearer(outsider.token)).send(body)).status).toBe(403);
      expect((await api().post('/users').set(bearer(plain.token)).send(body)).status).toBe(403);
      const created = await api().post('/users').set(bearer(admin.token)).send(body);
      expect(created.status).toBe(201);
      expect(created.body.is_super_admin).toBe(false); // mass-assignment of is_super_admin is ignored

      expect((await api().get(`/users/${plain.id}`).set(bearer(plain.token))).status).toBe(200); // self
      const hidden = await api().get(`/users/${admin.id}`).set(bearer(plain.token));
      expect(hidden.status).toBe(404);
      expect(hidden.body.code).toBe('user_not_found');
      expect((await api().get(`/users/${plain.id}`).set(bearer(outsider.token))).status).toBe(404);
      expect((await api().get(`/users/${plain.id}`).set(bearer(admin.token))).status).toBe(200);
      // a tenant admin cannot read an account that is not in their tenant
      expect((await api().get(`/users/${outsider.id}`).set(bearer(admin.token))).status).toBe(404);
      expect((await api().get(`/users/${randomUUID()}`).set(bearer(outsider.token))).status).toBe(404);
    });
  });

  describe('API keys', () => {
    it('are confined to the caller membership, private to their creator and cannot mint further keys', async () => {
      const outsider = await newUser('keyoutsider');
      expect((await api().get('/auth/api-keys').set(bearer(outsider.token))).status).toBe(404);
      const forced = await api()
        .post('/auth/api-keys')
        .set(bearer(outsider.token))
        .set('X-Tenant-ID', s.tenantA)
        .send({ name: 'evil' });
      expect(forced.status).toBe(403);

      const m1 = await newUser('keymember1');
      const m2 = await newUser('keymember2');
      await join(m1.id, s.tenantA);
      await join(m2.id, s.tenantA);
      const k1 = await api()
        .post('/auth/api-keys')
        .set(bearer(m1.token))
        .send({ name: 'm1', scopes: ['x.read'] });
      expect(k1.status).toBe(201);
      const k2 = await api().post('/auth/api-keys').set(bearer(m2.token)).send({ name: 'm2' });

      const l1 = await api().get('/auth/api-keys').set(bearer(m1.token));
      expect(l1.body.items.map((k: { name: string }) => k.name)).toEqual(['m1']);
      // m2 cannot revoke m1's key (404, not 200)
      expect((await api().delete(`/auth/api-keys/${k1.body.id}`).set(bearer(m2.token))).status).toBe(404);
      // super-admin sees everything in the tenant
      const all = await api().get('/auth/api-keys').set(bearer(s.root)).set('X-Tenant-ID', s.tenantA);
      expect(all.body.items.map((k: { id: string }) => k.id)).toEqual(expect.arrayContaining([k1.body.id, k2.body.id]));

      // a (narrowly scoped) key cannot create or list keys
      const mint = await api()
        .post('/auth/api-keys')
        .set(bearer(k1.body.raw_key))
        .send({ name: 'minted', scopes: ['*'] });
      expect(mint.status).toBe(403);
      expect((await api().get('/auth/api-keys').set(bearer(k1.body.raw_key))).status).toBe(403);
      expect((await api().get('/auth/me').set(bearer(k1.body.raw_key))).status).toBe(200);
    });
  });

  describe('authentication hardening', () => {
    it('parallel wrong-password guesses are capped by the lockout threshold (no check-then-act race)', async () => {
      const v = await newUser('racevictim');
      const results = await Promise.all(
        Array.from({ length: 30 }, (_, i) =>
          api()
            .post('/auth/login')
            .send({ email: v.email, password: `wrong-guess-${i}` }),
        ),
      );
      const codes = results.map((r) => r.body.code as string);
      expect(codes.filter((c) => c === 'invalid_credentials')).toHaveLength(5);
      expect(codes.filter((c) => c === 'account_locked')).toHaveLength(25);
      // correct password is refused while locked
      const locked = await api().post('/auth/login').send({ email: v.email, password: PASSWORD });
      expect(locked.body.code).toBe('account_locked');
      expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('parallel CORRECT logins (several tabs/devices) all succeed and never trip the lockout', async () => {
      const u = await newUser('multitab');
      const results = await Promise.all(
        Array.from({ length: 12 }, () => api().post('/auth/login').send({ email: u.email, password: PASSWORD })),
      );
      expect(results.map((r) => r.status)).toEqual(Array(12).fill(200));
      const row = await db.query('SELECT failed_login_attempts AS n, blocked_until FROM users WHERE id = $1', [u.id]);
      expect(row.rows[0]).toMatchObject({ n: 0, blocked_until: null });
    });

    it('mixed parallel logins: the correct password still works until the 5th wrong guess locks the account', async () => {
      const u = await newUser('mixed');
      const wrong = Array.from({ length: 4 }, (_, i) =>
        api()
          .post('/auth/login')
          .send({ email: u.email, password: `wrong-guess-${i}` }),
      );
      const right = Array.from({ length: 4 }, () =>
        api().post('/auth/login').send({ email: u.email, password: PASSWORD }),
      );
      const res = await Promise.all([...wrong, ...right]);
      expect(res.slice(0, 4).every((r) => r.body.code === 'invalid_credentials')).toBe(true);
      expect(res.slice(4).every((r) => r.status === 200)).toBe(true);
    });

    it('a successful login clears the reserved attempts', async () => {
      const u = await newUser('resetcounter');
      for (let i = 0; i < 3; i++) await api().post('/auth/login').send({ email: u.email, password: 'wrong-wrong' });
      await login(u.email);
      const row = await db.query('SELECT failed_login_attempts AS n FROM users WHERE id = $1', [u.id]);
      expect(row.rows[0].n).toBe(0);
    });

    it('does not trust a forged X-Forwarded-For for the recorded client address', async () => {
      const u = await newUser('xffuser');
      await api().post('/auth/login').set('X-Forwarded-For', '6.6.6.6').send({ email: u.email, password: PASSWORD });
      const rows = await db.query(`SELECT ip_address FROM audit_logs WHERE action = 'LOGIN' AND entity_id = $1`, [
        u.id,
      ]);
      expect(rows.rows.length).toBeGreaterThan(0);
      for (const r of rows.rows) expect(r.ip_address).not.toBe('6.6.6.6');
      const sec = await db.query('SELECT last_login_ip FROM user_security WHERE user_id = $1', [u.id]);
      expect(sec.rows[0].last_login_ip).not.toBe('6.6.6.6');
    });

    it('rejects tokens that are unsigned, wrongly typed or lack token_version', async () => {
      const secret = process.env.JWT_SECRET_KEY as string;
      const rootId = (await api().get('/auth/me').set(bearer(s.root))).body.id as string;
      const base = { sub: rootId, email: 'x@y.co', is_super_admin: true, type: 'access' };
      const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(
        JSON.stringify({ ...base, token_version: 1 }),
      ).toString('base64url')}.`;
      const noVersion = jwt.sign(base, secret, { algorithm: 'HS256', expiresIn: 60 });
      const wrongType = jwt.sign({ ...base, type: 'password_reset', token_version: 1 }, secret, { expiresIn: 60 });
      const hs512 = jwt.sign({ ...base, token_version: 1 }, secret, { algorithm: 'HS512', expiresIn: 60 });
      const wrongKey = jwt.sign({ ...base, token_version: 1 }, 'another-secret-another-secret-123456', {
        expiresIn: 60,
      });
      for (const t of [none, noVersion, wrongType, hs512, wrongKey]) {
        expect((await api().get('/auth/me').set(bearer(t))).status).toBe(401);
      }
    });

    it('serialises concurrent refreshes of one token: exactly one wins, the replay revokes the family', async () => {
      const email = `refresh-${run}@sec.example.com`;
      await api().post('/users').set(bearer(s.root)).send({ first_name: 'R', email, password: PASSWORD });
      const l = await api().post('/auth/login').send({ email, password: PASSWORD });
      const rt = l.body.refresh_token as string;
      const rs = await Promise.all(
        Array.from({ length: 6 }, () => api().post('/auth/refresh').send({ refresh_token: rt })),
      );
      expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
      const winner = rs.find((r) => r.status === 200);
      // the winner's fresh token was revoked by the reuse detection triggered by the losers
      expect((await api().post('/auth/refresh').send({ refresh_token: winner?.body.refresh_token })).status).toBe(401);
    });
  });

  describe('input validation', () => {
    it("rejects passwords above bcrypt's 72-byte limit instead of silently truncating them", async () => {
      const long = `${'A'.repeat(70)}b1!xyz`;
      const r = await api()
        .post('/users')
        .set(bearer(s.root))
        .send({ first_name: 'L', email: `long-${run}@sec.example.com`, password: long });
      expect(r.status).toBe(422);
      expect(r.body.detail[0]).toMatchObject({ loc: ['body', 'password'], type: 'string_too_long' });
      // multi-byte characters count by bytes (30 x 3 bytes = 90 > 72)
      const mb = await api()
        .post('/users')
        .set(bearer(s.root))
        .send({ first_name: 'L', email: `mb-${run}@sec.example.com`, password: '密'.repeat(30) });
      expect(mb.status).toBe(422);
      const change = await api()
        .post('/auth/change-password')
        .set(bearer(s.root))
        .send({ current_password: PASSWORD, new_password: long });
      expect(change.status).toBe(422);
    });

    it('a huge offset is a 422, not a 500', async () => {
      const r = await api().get('/tenants?offset=99999999999999999999').set(bearer(s.root));
      expect(r.status).toBe(422);
      expect((await api().get('/tenants?offset=2147483648').set(bearer(s.root))).status).toBe(422);
    });

    it('ignores __proto__/constructor keys in bodies and rejects oversized bodies', async () => {
      const r = await api()
        .post('/tenants')
        .set(bearer(s.root))
        .set('Content-Type', 'application/json')
        .send(`{"name":"P","slug":"p-${run}","__proto__":{"isSuperAdmin":true},"constructor":{"prototype":{"x":1}}}`);
      expect(r.status).toBe(201);
      expect(({} as Record<string, unknown>).isSuperAdmin).toBeUndefined();
      expect(({} as Record<string, unknown>).x).toBeUndefined();
      const big = await api()
        .post('/auth/login')
        .send({ email: 'a@b.co', password: 'x'.repeat(2 * 1024 * 1024) });
      expect(big.status).toBe(413);
    });
  });
});
