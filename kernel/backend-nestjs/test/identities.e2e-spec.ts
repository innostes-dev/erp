import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { EmailService } from '../src/auth/email.service';
import { DatabaseService } from '../src/db/database.service';
import { Migrator } from '../src/db/migrator';
import { IDENTITIES_CREDENTIALS_SQL } from '../src/migrations/0003-identities-credentials';
import { UsersService } from '../src/users/users.service';
import { createApp, resetE2eDatabase } from './e2e-helpers';

/**
 * Identities + credentials (migration 0003, shared SQL 0010): dual writes, lookup order, legacy fallback, the
 * "never resurrect" rule and migrator behaviour, on a real PostgreSQL database. Mostly negative scenarios.
 */
const SETUP_TOKEN = process.env.SETUP_TOKEN ?? 'test-setup-token';
const ADMIN = { email: 'idadmin@e2e.example.com', password: 'Str0ng-Passw0rd!' };

describe('identities + credentials (e2e, real PostgreSQL)', () => {
  let app: NestExpressApplication;
  let db: DatabaseService;
  let users: UsersService;
  let adminToken = '';
  let n = 0;

  const api = (): ReturnType<typeof request> => request(app.getHttpServer());
  const login = (email: string, password: string) => api().post('/auth/login').send({ email, password });
  const q = async <T extends object = Record<string, unknown>>(sql: string, p: unknown[] = []): Promise<T[]> =>
    (await db.query(sql, p)).rows as T[];
  const count = async (table: 'users' | 'identities' | 'credentials'): Promise<number> =>
    Number((await q<{ c: string }>(`SELECT count(*) AS c FROM ${table}`))[0].c);

  async function makeUser(mobile?: string): Promise<{ id: string; email: string; password: string }> {
    n += 1;
    const u = { email: `u${n}-${randomUUID().slice(0, 8)}@e2e.example.com`, password: `U-Passw0rd!${n}x` };
    const r = await api()
      .post('/users')
      .set({ Authorization: `Bearer ${adminToken}` })
      .send({ first_name: 'U', ...u, ...(mobile ? { mobile } : {}) });
    expect(r.status).toBe(201);
    return { id: r.body.id as string, ...u };
  }

  beforeAll(async () => {
    await resetE2eDatabase();
    app = await createApp((b) =>
      b.overrideProvider(EmailService).useValue({ sendPasswordReset: () => Promise.resolve() }),
    );
    db = app.get(DatabaseService);
    users = app.get(UsersService);
    const r = await api()
      .post('/setup')
      .set('X-Setup-Token', SETUP_TOKEN)
      .send({ organization: { name: 'Id Org', slug: 'id-org' }, admin: { first_name: 'Ada', ...ADMIN, mobile: '+911234567890' } });
    expect(r.status).toBe(201);
    adminToken = (await login(ADMIN.email, ADMIN.password)).body.access_token;
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('migrator', () => {
    it('applies the shared SQL verbatim and reports nothing pending afterwards', async () => {
      const canonical = readFileSync(join(__dirname, '../../backend/migrations/sql/0010_identities_credentials.sql'), 'utf8');
      expect(IDENTITIES_CREDENTIALS_SQL).toBe(canonical);
      const m = new Migrator(db);
      expect(await m.identitiesMissing()).toBe(false);
      expect(await m.pending()).toBe(0);
    });

    it('re-running is a no-op and never fails', async () => {
      await makeUser();
      const m = new Migrator(db);
      await m.run();
      const before = [await count('identities'), await count('credentials')];
      expect(await m.run()).toBe(false);
      await m.applyIdentitiesCredentials();
      expect([await count('identities'), await count('credentials')]).toEqual(before);
    });

    it('recreates the tables and backfills when another backend created the database without them', async () => {
      const u = await makeUser('+919700000001');
      await db.query('DROP TABLE credentials');
      await db.query('DROP TABLE identities');
      const m = new Migrator(db);
      expect(await m.identitiesMissing()).toBe(true);
      expect(await m.pending()).toBe(1);
      expect(await m.applyIdentitiesCredentials()).toBe(true);
      const ids = await q<{ type: string }>('SELECT type FROM identities WHERE user_id = $1 ORDER BY type', [u.id]);
      expect(ids.map((r) => r.type)).toEqual(['email', 'phone']);
      expect((await login(u.email, u.password)).status).toBe(200);
    });

    it('serialises concurrent runs (advisory lock): no duplicate backfill, no error', async () => {
      const u = await makeUser();
      await db.query('DELETE FROM identities WHERE user_id = $1', [u.id]);
      await db.query('DELETE FROM credentials WHERE user_id = $1', [u.id]);
      const m = new Migrator(db);
      await Promise.all([m.applyIdentitiesCredentials(), m.applyIdentitiesCredentials(), m.applyIdentitiesCredentials()]);
      expect(await q('SELECT 1 FROM identities WHERE user_id = $1', [u.id])).toHaveLength(1);
      expect(await q('SELECT 1 FROM credentials WHERE user_id = $1', [u.id])).toHaveLength(1);
    });
  });

  describe('writes', () => {
    it('creates one primary email, one primary phone and one active password that match the legacy columns', async () => {
      const u = await makeUser('+919700000002');
      const [row] = await q<{ email_hash: string; mobile_hash: string; password_hash: string }>(
        'SELECT email_hash, mobile_hash, password_hash FROM users WHERE id = $1',
        [u.id],
      );
      const ids = await q<{ type: string; value_hash: string; is_primary: boolean }>(
        'SELECT type, value_hash, is_primary FROM identities WHERE user_id = $1 ORDER BY type',
        [u.id],
      );
      expect(ids).toEqual([
        { type: 'email', value_hash: row.email_hash, is_primary: true },
        { type: 'phone', value_hash: row.mobile_hash, is_primary: true },
      ]);
      const pw = await q<{ secret_hash: string }>(`SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password'`, [u.id]);
      expect(pw).toEqual([{ secret_hash: row.password_hash }]);
    });

    it('rejects a duplicate email (other case) and a duplicate mobile without leaving orphan rows', async () => {
      const u = await makeUser('+919700000003');
      const before = [await count('users'), await count('identities'), await count('credentials')];
      const auth = { Authorization: `Bearer ${adminToken}` };
      expect((await api().post('/users').set(auth).send({ first_name: 'D', email: u.email.toUpperCase(), password: 'Dup-Passw0rd!1' })).status).toBe(409);
      const dupMobile = await api().post('/users').set(auth).send({ first_name: 'D', email: 'dupm@e2e.example.com', password: 'Dup-Passw0rd!1', mobile: '+919700000003' });
      expect(dupMobile.status).toBe(409);
      expect(dupMobile.body.code).toBe('mobile_already_exists');
      expect([await count('users'), await count('identities'), await count('credentials')]).toEqual(before);
    });

    it('concurrent setPasswordCredential calls never create a second active password', async () => {
      const u = await makeUser();
      await Promise.all(
        Array.from({ length: 8 }, (_, i) => db.tx((tx) => users.setPasswordCredential(tx, u.id, `$2b$04$${String(i).repeat(53)}`))),
      );
      expect(await q(`SELECT 1 FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL`, [u.id])).toHaveLength(1);
    });

    it('change-password and forgot-password keep the credential and the legacy column equal', async () => {
      const u = await makeUser();
      const t = (await login(u.email, u.password)).body.access_token;
      expect((await api().post('/auth/change-password').set({ Authorization: `Bearer ${t}` }).send({ current_password: u.password, new_password: 'Next-Passw0rd!9' })).status).toBe(200);
      const same = async () =>
        (await q<{ ok: boolean }>(
          `SELECT (SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL) = u.password_hash AS ok FROM users u WHERE u.id = $1`,
          [u.id],
        ))[0].ok;
      expect(await same()).toBe(true);
      expect((await login(u.email, u.password)).status).toBe(401);
      expect((await api().post('/auth/forgot-password').send({ email: u.email })).status).toBe(200);
      expect(await same()).toBe(true);
      expect((await login(u.email, 'Next-Passw0rd!9')).status).toBe(401);
    });
  });

  describe('reads', () => {
    it('the credential wins over a stale legacy password', async () => {
      const a = await makeUser();
      const b = await makeUser();
      await db.query(
        `UPDATE credentials SET secret_hash = (SELECT secret_hash FROM credentials WHERE user_id = $2 AND type = 'password') WHERE user_id = $1`,
        [a.id, b.id],
      );
      expect((await login(a.email, b.password)).status).toBe(200);
      expect((await login(a.email, a.password)).status).toBe(401);
    });

    it('falls back to the legacy columns only when there is no row at all', async () => {
      const u = await makeUser('+919700000004');
      await db.query('DELETE FROM identities WHERE user_id = $1', [u.id]);
      await db.query('DELETE FROM credentials WHERE user_id = $1', [u.id]);
      expect((await login(u.email, u.password)).status).toBe(200);
      expect((await users.findUserByIdentifier('phone', '+919700000004'))?.id).toBe(u.id);
      expect(await users.findUserByIdentifier('username', u.email)).toBeNull();
    });

    it('never resurrects a soft-deleted email identity', async () => {
      const u = await makeUser();
      await db.query(`UPDATE identities SET deleted_at = now() WHERE user_id = $1 AND type = 'email'`, [u.id]);
      const r = await login(u.email, u.password);
      expect(r.status).toBe(401);
      expect(r.body.code).toBe('invalid_credentials');
      expect(await users.getByEmail(u.email)).toBeNull();
    });

    it('never resurrects a soft-deleted password (counted as a failed login)', async () => {
      const u = await makeUser();
      await db.query(`UPDATE credentials SET deleted_at = now() WHERE user_id = $1`, [u.id]);
      expect(await users.getPasswordHash({ id: u.id, password_hash: 'legacy' })).toBeNull();
      expect((await login(u.email, u.password)).status).toBe(401);
      const [row] = await q<{ failed_login_attempts: number }>('SELECT failed_login_attempts FROM users WHERE id = $1', [u.id]);
      expect(row.failed_login_attempts).toBe(1);
    });

    it('a soft-deleted user cannot log in through an active identity', async () => {
      const u = await makeUser();
      await db.query('UPDATE users SET deleted_at = now() WHERE id = $1', [u.id]);
      expect((await login(u.email, u.password)).status).toBe(401);
    });

    it('blank identifiers never match and are never stored', async () => {
      for (const blank of ['', '   ']) expect(await users.findUserByIdentifier('email', blank)).toBeNull();
      await expect(db.tx((tx) => users.addIdentity(tx, randomUUID(), 'username', '   '))).rejects.toThrow('cannot be empty');
    });
  });
});
