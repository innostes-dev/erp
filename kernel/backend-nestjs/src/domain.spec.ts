import { ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiKeyRow, toApiKeyRead } from './auth/api-keys.service';
import { AuthGuard } from './auth/auth.guard';
import { computeFieldDiff } from './audit/audit.service';
import { InvalidTokenError, AccountSuspendedError, ForbiddenError } from './common/errors';
import { loadConfig } from './config/env';
import { TokenService } from './crypto/tokens';
import { DatabaseService, isUniqueViolation } from './db/database.service';
import { PERMISSION_KEY, PermissionGuard } from './rbac/permission.guard';
import { applyScope } from './rbac/rbac.service';
import { InstallStateService } from './setup/install-state.service';
import { DEFAULT_PERMISSIONS, ROLE_DEFINITIONS } from './setup/seed-data';
import { SetupTokenService } from './setup/setup-token.service';
import { SetupRequiredGuard, isAllowedBeforeSetup } from './setup/setup-required.guard';
import { UserRow, isBlocked } from './users/user.types';

beforeAll(() => Logger.overrideLogger(false));

const ctx = (req: object): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;
const user = (over: Partial<UserRow> = {}): UserRow =>
  ({
    id: '3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f',
    status: 'active',
    blocked_until: null,
    token_version: 1,
    is_super_admin: false,
    deleted_at: null,
    ...over,
  }) as UserRow;

describe('account state', () => {
  it('isBlocked: suspended or lock in the future', () => {
    expect(isBlocked({ status: 'suspended', blocked_until: null })).toBe(true);
    expect(isBlocked({ status: 'active', blocked_until: new Date(Date.now() + 60_000) })).toBe(true);
    expect(isBlocked({ status: 'active', blocked_until: new Date(Date.now() - 60_000) })).toBe(false);
    expect(isBlocked({ status: 'active', blocked_until: null })).toBe(false);
  });
});

describe('API key presentation', () => {
  const row = (prefix: string): ApiKeyRow => ({
    id: 'i',
    tenant_id: 't',
    user_id: 'u',
    name: 'n',
    key_prefix: prefix,
    key_hash: 'h',
    scopes: ['*'],
    expires_at: null,
    last_used_at: null,
    is_revoked: false,
    revoked_at: null,
    created_at: new Date(0),
  });
  it('never exposes the hash and renders `<14 chars>...`', () => {
    const r = toApiKeyRead(row('inno_live_abcd'));
    expect(r.key_prefix).toBe('inno_live_abcd...');
    expect(r).not.toHaveProperty('key_hash');
    expect(toApiKeyRead(row('inno_live_abcd...')).key_prefix).toBe('inno_live_abcd...');
  });
});

describe('audit diff', () => {
  it('returns changed fields only and masks sensitive keys', () => {
    expect(
      computeFieldDiff({ name: 'a', slug: 's', password: 'x' }, { name: 'b', slug: 's', password: 'y', token: 'z' }),
    ).toEqual({ name: { old: 'a', new: 'b' } });
    expect(computeFieldDiff(null, null)).toEqual({});
  });
});

describe('RBAC data scope', () => {
  const base = { userId: 'u1', departmentId: 'd1' };
  it('ORGANIZATION is unrestricted, DEPARTMENT uses the department column, OWN/TEAM the owner column', () => {
    expect(applyScope({ ...base, scope: 'ORGANIZATION' }, { owner: 'owner_id' })).toEqual({ clause: '', params: [] });
    expect(applyScope({ ...base, scope: 'DEPARTMENT' }, { owner: 'owner_id', department: 'dept_id' }, 2)).toEqual({
      clause: 'dept_id = $2',
      params: ['d1'],
    });
    expect(
      applyScope({ ...base, scope: 'DEPARTMENT', departmentId: null }, { owner: 'owner_id', department: 'dept_id' }),
    ).toEqual({ clause: 'owner_id = $1', params: ['u1'] });
    expect(applyScope({ ...base, scope: 'OWN' }, { owner: 't.owner_id' })).toEqual({
      clause: 't.owner_id = $1',
      params: ['u1'],
    });
  });
  it('rejects unsafe column identifiers (no SQL injection through the helper)', () => {
    expect(() => applyScope({ ...base, scope: 'OWN' }, { owner: 'id; DROP TABLE users' })).toThrow(/Unsafe column/);
  });
});

describe('seed data', () => {
  it('matches the reference catalogue', () => {
    expect(DEFAULT_PERMISSIONS).toHaveLength(30);
    expect(new Set(DEFAULT_PERMISSIONS.map((p) => p[0])).size).toBe(30);
    expect(ROLE_DEFINITIONS.map((r) => r.code)).toEqual([
      'super_admin',
      'owner',
      'admin',
      'member',
      'sales_manager',
      'sales_rep',
      'hr_manager',
      'employee',
      'telemetry_engineer',
    ]);
    const codes = new Set(DEFAULT_PERMISSIONS.map((p) => p[0]));
    for (const r of ROLE_DEFINITIONS)
      if (r.granted !== 'ALL') for (const c of r.granted) expect(codes.has(c)).toBe(true);
  });
});

describe('setup-required allow-list', () => {
  it.each([
    '/',
    '/health',
    '/docs',
    '/docs/',
    '/docs/swagger-ui.css',
    '/redoc',
    '/openapi.json',
    '/setup',
    '/setup/status',
    '/setup/checks',
  ])('allows %s', (p) => {
    expect(isAllowedBeforeSetup(p)).toBe(true);
  });
  it.each(['/config', '/tenants', '/auth/login', '/users/1', '/setupx', '/healthz', '/metrics'])('blocks %s', (p) => {
    expect(isAllowedBeforeSetup(p)).toBe(false);
  });
  it('guard throws setup_required until installed', async () => {
    const state = {
      isInstalled: jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true),
    } as unknown as InstallStateService;
    const guard = new SetupRequiredGuard(state);
    await expect(guard.canActivate(ctx({ path: '/tenants' }))).rejects.toMatchObject({
      status: 503,
      code: 'setup_required',
    });
    await expect(guard.canActivate(ctx({ path: '/tenants' }))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ path: '/health' }))).resolves.toBe(true);
  });
});

describe('InstallStateService caching', () => {
  it('caches "installed" forever, re-checks "not installed", and never reports a DB failure as "not installed"', async () => {
    const query = jest.fn();
    const svc = new InstallStateService({ query } as unknown as DatabaseService);
    svc.recheckMs = 0;
    query.mockResolvedValue({ rows: [{ ok: false }] });
    expect(await svc.isInstalled()).toBe(false);
    query.mockRejectedValue(new Error('down'));
    await expect(svc.isInstalled()).rejects.toMatchObject({ status: 503, code: 'database_unavailable' });
    query.mockReset();
    query.mockResolvedValue({ rows: [{ ok: true }] });
    expect(await svc.isInstalled()).toBe(true);
    query.mockClear();
    expect(await svc.isInstalled()).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });
});

describe('SetupTokenService', () => {
  const cfg = (over: Record<string, string> = {}): ReturnType<typeof loadConfig> =>
    loadConfig({ SETUP_TOKEN_FILE: join(mkdtempSync(join(tmpdir(), 'setup-')), 'tok'), ...over });

  it('verifies the configured token in constant time and rate limits wrong guesses', () => {
    const svc = new SetupTokenService(cfg({ SETUP_TOKEN: 'secret-token' }));
    expect(svc.verify('secret-token')).toBe(true);
    expect(svc.verify('secret-tokeX')).toBe(false);
    expect(svc.verify(undefined)).toBe(false);
    for (let i = 0; i < 10; i++) {
      expect(svc.retryAfter('1.2.3.4')).toBeNull();
      svc.recordFailure('1.2.3.4');
    }
    expect(svc.retryAfter('1.2.3.4')).toBeGreaterThan(0);
    expect(svc.retryAfter('5.6.7.8')).toBeNull();
    svc.reset('1.2.3.4');
    expect(svc.retryAfter('1.2.3.4')).toBeNull();
  });

  it('caps total failures across all client addresses so address rotation cannot enable unbounded guessing', () => {
    const svc = new SetupTokenService(cfg({ SETUP_TOKEN: 'secret-token' }));
    for (let i = 0; i < svc.maxGlobalAttempts; i++) {
      expect(svc.retryAfter(`10.0.${i}.1`)).toBeNull(); // every address is fresh (spoofed/rotated)
      svc.recordFailure(`10.0.${i}.1`);
    }
    expect(svc.retryAfter('192.0.2.77')).toBeGreaterThan(0);
  });

  it('bounds the number of tracked client addresses', () => {
    const svc = new SetupTokenService(cfg({ SETUP_TOKEN: 'secret-token' }));
    Object.assign(svc, { maxTrackedClients: 50, maxGlobalAttempts: 1_000_000 });
    for (let i = 0; i < 500; i++) svc.recordFailure(`c${i}`);
    expect((svc as unknown as { failures: Map<string, number[]> }).failures.size).toBeLessThanOrEqual(51);
  });

  it('generates a 0600 token file once, reuses it, and discards it', () => {
    const c = cfg();
    const svc = new SetupTokenService(c);
    const t = svc.getToken();
    expect(t.fromEnv).toBe(false);
    expect(t.value.length).toBeGreaterThanOrEqual(32);
    expect(svc.getToken().value).toBe(t.value);
    expect(readFileSync(c.setup.tokenFile, 'utf8').trim()).toBe(t.value);
    svc.discard();
    expect(existsSync(c.setup.tokenFile)).toBe(false);
  });
});

describe('AuthGuard', () => {
  const tokens = new TokenService({
    secret: 'g'.repeat(40),
    algorithm: 'HS256',
    accessMinutes: 30,
    refreshDays: 7,
    resetMinutes: 60,
  });
  const make = (u: UserRow | null, key: object | null = null) => {
    const users = { getById: jest.fn().mockResolvedValue(u) };
    const apiKeys = { verify: jest.fn().mockResolvedValue(key) };
    return { guard: new AuthGuard(users as never, apiKeys as never, tokens), users, apiKeys };
  };
  const access = (over: Record<string, unknown> = {}) =>
    tokens.createAccessToken({
      sub: '3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f',
      email: 'a@b.co',
      token_version: 1,
      is_super_admin: false,
      ...over,
    } as never);
  const bearer = (t: string) => ({ headers: { authorization: `Bearer ${t}` } });

  it('requires a token', async () => {
    await expect(make(user()).guard.canActivate(ctx({ headers: {} }))).rejects.toBeInstanceOf(InvalidTokenError);
  });
  it('accepts Bearer tokens and the access_token cookie', async () => {
    const { guard } = make(user());
    const r1 = { ...bearer(access()) } as { auth?: unknown };
    await expect(guard.canActivate(ctx(r1))).resolves.toBe(true);
    expect(r1.auth).toBeDefined();
    const r2 = { headers: {}, cookies: { access_token: access() } } as { auth?: unknown };
    await expect(guard.canActivate(ctx(r2))).resolves.toBe(true);
  });
  it('rejects bad signature, wrong type and stale token_version', async () => {
    const { guard } = make(user({ token_version: 2 }));
    await expect(guard.canActivate(ctx(bearer('garbage')))).rejects.toThrow('Invalid access token.');
    await expect(guard.canActivate(ctx(bearer(access())))).rejects.toThrow('Token version invalidated');
    const reset = tokens.createPasswordResetToken('3f2b1c9e-5d8a-4f6b-9c2e-1a3b5c7d9e0f', 1);
    await expect(guard.canActivate(ctx(bearer(reset)))).rejects.toThrow('expected access token');
  });
  it('rejects unknown, suspended and locked users with 403', async () => {
    await expect(make(null).guard.canActivate(ctx(bearer(access())))).rejects.toBeInstanceOf(AccountSuspendedError);
    await expect(make(user({ status: 'suspended' })).guard.canActivate(ctx(bearer(access())))).rejects.toBeInstanceOf(
      AccountSuspendedError,
    );
    await expect(
      make(user({ blocked_until: new Date(Date.now() + 1e5) })).guard.canActivate(ctx(bearer(access()))),
    ).rejects.toBeInstanceOf(AccountSuspendedError);
  });
  it('authenticates inno_live_ API keys and rejects revoked ones', async () => {
    const key = { id: 'k', tenant_id: 't', user_id: 'u', scopes: ['*'] };
    const ok = make(user(), key);
    const req = bearer('inno_live_abc') as { auth?: { apiKey?: unknown } };
    await expect(ok.guard.canActivate(ctx(req))).resolves.toBe(true);
    expect(req.auth?.apiKey).toBe(key);
    await expect(make(user(), null).guard.canActivate(ctx(bearer('inno_live_abc')))).rejects.toThrow(
      'Invalid, expired, or revoked API key.',
    );
  });
});

describe('PermissionGuard', () => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue('user.users.create') } as unknown as Reflector;
  const rbac = { hasPermission: jest.fn() };
  const tenancy = { resolveCurrentTenantId: jest.fn().mockResolvedValue('11111111-1111-4111-8111-111111111111') };
  const guard = new PermissionGuard(reflector, rbac as never, tenancy as never);

  it('has a stable metadata key', () => expect(PERMISSION_KEY).toBe('required_permission'));
  it('API keys need the exact scope or *', async () => {
    await expect(
      guard.canActivate(ctx({ headers: {}, auth: { user: user(), apiKey: { scopes: ['*'] } } })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctx({ headers: {}, auth: { user: user(), apiKey: { scopes: ['user.users.create'] } } })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctx({ headers: {}, auth: { user: user(), apiKey: { scopes: ['other'] } } })),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
  it('delegates to RBAC for users', async () => {
    rbac.hasPermission.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(guard.canActivate(ctx({ headers: {}, auth: { user: user() } }))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ headers: {}, auth: { user: user() } }))).rejects.toMatchObject({
      status: 403,
      code: 'permission_denied',
    });
  });
});

describe('DatabaseService', () => {
  it('ping reports UNHEALTHY (without leaking details) when the database is unreachable', async () => {
    const cfg = loadConfig({ DATABASE_URL: 'postgresql://postgres:x@127.0.0.1:1/none', DB_POOL_TIMEOUT: '1' });
    const db = new DatabaseService(cfg);
    const r = await db.ping(1500);
    expect(r.status).toBe('UNHEALTHY');
    expect(JSON.stringify(r)).not.toContain('postgresql://');
    await db.onModuleDestroy();
  });
  it('isUniqueViolation matches SQLSTATE 23505 and optionally the constraint', () => {
    expect(isUniqueViolation({ code: '23505', constraint: 'uq_a' })).toBe(true);
    expect(isUniqueViolation({ code: '23505', constraint: 'uq_a' }, 'uq_b')).toBe(false);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
  });
});
