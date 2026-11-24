import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../config/env';
import {
  AccountLockedError,
  AccountSuspendedError,
  DeviceWipedError,
  InvalidCredentialsError,
  InvalidTokenError,
  PasswordRecentlyUsedError,
  TemporaryPasswordExpiredError,
  TooManyRequestsError,
  ServiceError,
} from '../common/errors';
import { sha256Hex } from '../crypto/cipher';
import { DUMMY_BCRYPT_HASH, generateSecureTempPassword, hashPassword, verifyPassword } from '../crypto/password';
import { TokenService, generateRefreshToken } from '../crypto/tokens';
import { DatabaseService, Queryable } from '../db/database.service';
import { RbacService } from '../rbac/rbac.service';
import { DevicesService } from '../users/devices.service';
import { DeviceType, UserRead, UserRow, isBlocked } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';

export interface LoginInput {
  email: string;
  password: string;
  device_fingerprint?: string;
  device_name?: string | null;
  device_type?: DeviceType;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  must_change_password: boolean;
  user: UserRead;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
}

export interface AccessibleModule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  role: { code: string; name: string; hierarchy_level: number };
  data_scope: string;
  permissions: string[];
}

export interface UserProfile extends UserRead {
  active_tenant: TenantSummary | null;
  accessible_tenants: TenantSummary[];
  accessible_modules: AccessibleModule[];
}

interface SessionRow {
  id: string;
  user_id: string;
  device_id: string | null;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

const KNOWN_MODULES: Record<string, [string, string]> = {
  salesflow: ['SalesFlow CRM', 'High-velocity pipelines, quote-to-cash & revenue forecasting.'],
  peopleops: ['PeopleOps HRMS', 'Workforce directory, attendance & leave approvals.'],
  tracura: ['Tracura Telemetry', 'Universal API telemetry, distributed tracing & request logging.'],
  ledgerflow: ['LedgerFlow Finance', 'General ledger, multi-currency accounts & tax filing.'],
  docflow: ['DocFlow Documents', 'Compliant document generation & e-signature pipelines.'],
  stockflow: ['StockFlow Inventory', 'Real-time inventory, purchase orders & barcode tracking.'],
  hireflow: ['HireFlow Recruiting', 'Candidate pipeline, applicant tracking & scorecards.'],
  sprintflow: ['SprintFlow Agile', 'Agile sprint boards, backlog management & issue tracking.'],
};

const capitalize = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);
const MAX_UA = 4096;

/** Result of a transaction that must commit its writes even though the request ends in an error. */
type Outcome<T> = { ok: true; value: T } | { ok: false; error: ServiceError };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly db: DatabaseService,
    private readonly users: UsersService,
    private readonly devices: DevicesService,
    private readonly rbac: RbacService,
    private readonly tokens: TokenService,
    private readonly email: EmailService,
  ) {}

  private issueAccessToken(user: UserRow): string {
    return this.tokens.createAccessToken({
      sub: user.id,
      email: this.users.decryptEmail(user),
      token_version: user.token_version,
      is_super_admin: user.is_super_admin,
    });
  }

  // ---------------------------------------------------------------- login

  async login(data: LoginInput, ip: string | null, userAgent: string | null): Promise<TokenResponse> {
    const now = new Date();
    const user = await this.users.getByEmail(data.email);

    // Equalise timing so unknown accounts are indistinguishable from wrong passwords.
    if (!user) {
      await verifyPassword(data.password, DUMMY_BCRYPT_HASH);
      throw new InvalidCredentialsError();
    }

    if (isBlocked(user, now)) {
      if (user.status === 'suspended') throw new AccountSuspendedError();
      const retry = user.blocked_until
        ? Math.max(1, Math.ceil((user.blocked_until.getTime() - now.getTime()) / 1000))
        : 900;
      throw new AccountLockedError(retry);
    }
    if (user.status !== 'active') throw new AccountSuspendedError();

    // Everything from the lock-state check to the counter update runs under a per-account lock, so the failure counter is
    // exact: N parallel wrong guesses give exactly MAX_FAILED_LOGIN_ATTEMPTS verifications, while N parallel correct
    // logins all succeed (nothing is counted until a password has actually been found wrong).
    const rawRefresh = generateRefreshToken();
    const outcome = await this.withAccountLock<Outcome<UserRow>>(user.id, async (tx) => {
      const fresh = await this.users.getById(user.id, tx);
      if (!fresh) return { ok: false, error: new InvalidCredentialsError() };
      const t = new Date();
      if (isBlocked(fresh, t)) {
        if (fresh.status === 'suspended') return { ok: false, error: new AccountSuspendedError() };
        const retry = fresh.blocked_until
          ? Math.max(1, Math.ceil((fresh.blocked_until.getTime() - t.getTime()) / 1000))
          : 900;
        return { ok: false, error: new AccountLockedError(retry) };
      }
      if (fresh.status !== 'active') return { ok: false, error: new AccountSuspendedError() };
      const passwordHash = await this.users.getPasswordHash(fresh, tx);
      if (!passwordHash) await verifyPassword(data.password, DUMMY_BCRYPT_HASH);
      if (!passwordHash || !(await verifyPassword(data.password, passwordHash))) {
        await this.recordFailedLogin(tx, fresh.id);
        return { ok: false, error: new InvalidCredentialsError() };
      }
      if (
        fresh.must_change_password &&
        fresh.temp_password_expires_at &&
        fresh.temp_password_expires_at.getTime() < t.getTime()
      ) {
        return { ok: false, error: new TemporaryPasswordExpiredError() };
      }
      await tx.query(
        'UPDATE users SET failed_login_attempts = 0, blocked_until = NULL, updated_at = now() WHERE id = $1',
        [fresh.id],
      );
      const device = await this.devices.registerOrTouch(
        tx,
        fresh.id,
        {
          fingerprint: data.device_fingerprint ?? 'browser-client-default',
          name: data.device_name || 'Web Client',
          type: data.device_type ?? 'desktop',
        },
        ip,
      );
      if (device.status === 'wiped') throw new DeviceWipedError();
      await tx.query(
        'UPDATE user_security SET last_login_at = now(), last_login_ip = $2, updated_at = now() WHERE user_id = $1',
        [fresh.id, ip],
      );
      await tx.query(
        `INSERT INTO user_sessions (id, user_id, device_id, refresh_token_hash, ip_address, user_agent, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6, now() + $7 * interval '1 day')`,
        [
          randomUUID(),
          fresh.id,
          device.id,
          sha256Hex(rawRefresh),
          ip,
          userAgent?.slice(0, MAX_UA) ?? null,
          this.cfg.jwt.refreshDays,
        ],
      );
      return { ok: true, value: fresh };
    });
    if (!outcome.ok) throw outcome.error;

    return {
      access_token: this.issueAccessToken(outcome.value),
      refresh_token: rawRefresh,
      token_type: 'bearer',
      expires_in: this.cfg.jwt.accessMinutes * 60,
      must_change_password: Boolean(user.must_change_password),
      user: this.users.toUserRead(user),
    };
  }

  /** Count a wrong password and lock the account at the threshold (an expired lock restarts the counter). */
  private async recordFailedLogin(db: Queryable, userId: string): Promise<void> {
    const base = 'CASE WHEN blocked_until IS NOT NULL AND blocked_until <= now() THEN 0 ELSE failed_login_attempts END';
    await db.query(
      `UPDATE users SET
         failed_login_attempts = (${base}) + 1,
         blocked_until = CASE WHEN (${base}) + 1 >= $2 THEN now() + $3 * interval '1 minute'
                              WHEN blocked_until IS NOT NULL AND blocked_until <= now() THEN NULL
                              ELSE blocked_until END,
         updated_at = now()
       WHERE id = $1`,
      [userId, this.cfg.auth.maxFailedAttempts, this.cfg.auth.lockoutMinutes],
    );
  }

  private readonly loginQueues = new Map<string, { tail: Promise<void>; size: number }>();
  private static readonly MAX_QUEUED_LOGINS_PER_ACCOUNT = 64;
  private static readonly LOGIN_LOCK_TIMEOUT = '10s';

  /**
   * Serialises login attempts per account: first in-process (waiters hold no database connection, so a burst against
   * one account cannot exhaust the pool; the queue is capped, excess gets 429), then with a transaction-scoped
   * advisory lock for other processes (bounded by lock_timeout, also 429). The transaction commits whatever `fn`
   * returns, so failure counters persist even when the outcome is an error.
   */
  private async withAccountLock<T>(userId: string, fn: (tx: Queryable) => Promise<T>): Promise<T> {
    let entry = this.loginQueues.get(userId);
    if (!entry) this.loginQueues.set(userId, (entry = { tail: Promise.resolve(), size: 0 }));
    if (entry.size >= AuthService.MAX_QUEUED_LOGINS_PER_ACCOUNT)
      throw new TooManyRequestsError('Too many concurrent login attempts for this account. Try again shortly.', 5);
    const q = entry;
    q.size++;
    const prev = q.tail;
    let release!: () => void;
    q.tail = new Promise<void>((r) => (release = r));
    await prev;
    try {
      return await this.db.tx(async (tx) => {
        await tx.query(`SET LOCAL lock_timeout = '${AuthService.LOGIN_LOCK_TIMEOUT}'`);
        await tx.query("SELECT pg_advisory_xact_lock(hashtextextended('login:' || $1::text, 0))", [userId]);
        return fn(tx);
      });
    } catch (err) {
      if ((err as { code?: string }).code === '55P03')
        throw new TooManyRequestsError('Too many concurrent login attempts for this account. Try again shortly.', 5);
      throw err;
    } finally {
      release();
      if (--q.size === 0) this.loginQueues.delete(userId);
    }
  }

  // -------------------------------------------------------------- refresh

  async refresh(refreshToken: string, ip: string | null, userAgent: string | null): Promise<RefreshResponse> {
    const tokenHash = sha256Hex(refreshToken);

    const outcome = await this.db.tx<Outcome<{ user: UserRow; refresh: string }>>(async (tx) => {
      const s = await tx.query<SessionRow>('SELECT * FROM user_sessions WHERE refresh_token_hash = $1 FOR UPDATE', [
        tokenHash,
      ]);
      const session = s.rows[0];
      if (!session) return { ok: false, error: new InvalidTokenError('Invalid refresh token') };

      // Reuse detection: a revoked token being replayed means it may have been stolen. The revocation is committed.
      if (session.revoked_at !== null) {
        await tx.query(
          'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
          [session.user_id],
        );
        return {
          ok: false,
          error: new InvalidTokenError('Refresh token was previously revoked. All active sessions invalidated.'),
        };
      }

      const revokeThis = (): Promise<unknown> =>
        tx.query('UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE id = $1', [session.id]);

      if (session.expires_at.getTime() < Date.now()) {
        await revokeThis();
        return { ok: false, error: new InvalidTokenError('Refresh token expired') };
      }

      const user = await this.users.getById(session.user_id, tx);
      if (!user || user.status !== 'active' || isBlocked(user)) {
        await revokeThis();
        return { ok: false, error: new InvalidTokenError('User account inactive or locked') };
      }

      if (session.device_id) {
        const dev = await tx.query<{ status: string }>('SELECT status FROM user_devices WHERE id = $1', [
          session.device_id,
        ]);
        if (dev.rows[0]?.status === 'wiped') return { ok: false, error: new DeviceWipedError() };
      }

      await revokeThis();
      const newRefresh = generateRefreshToken();
      await tx.query(
        `INSERT INTO user_sessions (id, user_id, device_id, refresh_token_hash, ip_address, user_agent, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6, now() + $7 * interval '1 day')`,
        [
          randomUUID(),
          user.id,
          session.device_id,
          sha256Hex(newRefresh),
          ip,
          userAgent?.slice(0, MAX_UA) ?? null,
          this.cfg.jwt.refreshDays,
        ],
      );
      return { ok: true, value: { user, refresh: newRefresh } };
    });

    if (!outcome.ok) throw outcome.error;
    return {
      access_token: this.issueAccessToken(outcome.value.user),
      refresh_token: outcome.value.refresh,
      token_type: 'bearer',
      expires_in: this.cfg.jwt.accessMinutes * 60,
    };
  }

  // ------------------------------------------------------ password flows

  async forgotPassword(emailAddress: string): Promise<void> {
    const user = await this.users.getByEmail(emailAddress);
    if (!user || user.status !== 'active') {
      await verifyPassword('dummy-password', DUMMY_BCRYPT_HASH);
      return;
    }

    const tempPassword = generateSecureTempPassword(16);
    const tempHash = await hashPassword(tempPassword);
    const updated = await this.db.tx(async (tx) => {
      const r = await tx.query<{ token_version: number }>(
        `UPDATE users SET password_hash = $2, must_change_password = true,
                temp_password_expires_at = now() + $3 * interval '1 hour', token_version = token_version + 1, updated_at = now()
          WHERE id = $1 RETURNING token_version`,
        [user.id, tempHash, this.cfg.auth.tempPasswordHours],
      );
      await this.users.setPasswordCredential(tx, user.id, tempHash);
      await tx.query(
        'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [user.id],
      );
      return r.rows[0];
    });

    const resetToken = this.tokens.createPasswordResetToken(user.id, updated.token_version);
    const plainEmail = this.users.decryptEmail(user);
    const resetLink = `${this.cfg.auth.frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(plainEmail)}`;
    // Fire and forget: delivery latency/failure must not reveal whether the account exists.
    void this.email
      .sendPasswordReset({
        recipient: plainEmail,
        recipientName: this.users.displayName(user),
        tempPassword,
        resetLink,
        tempPasswordHours: this.cfg.auth.tempPasswordHours,
        resetLinkMinutes: this.cfg.jwt.resetMinutes,
      })
      .catch((err: unknown) => this.logger.error({ err }, 'Failed to send password reset email'));
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    let payload: ReturnType<TokenService['decode']>;
    try {
      payload = this.tokens.decode(token);
    } catch {
      throw new InvalidTokenError('Password reset link is invalid or has expired.');
    }
    if (payload.type !== 'password_reset') throw new InvalidTokenError('Invalid token type');
    const userId = typeof payload.sub === 'string' ? payload.sub : '';
    if (!userId) throw new InvalidTokenError('Invalid subject claim');
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new InvalidTokenError('Invalid subject claim');

    await this.db.tx(async (tx) => {
      const r = await tx.query<UserRow>('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [
        userId,
      ]);
      const user = r.rows[0];
      if (!user || user.status !== 'active') throw new InvalidTokenError('User account not found or inactive');
      if (user.token_version !== payload.token_version)
        throw new InvalidTokenError('This password reset link has already been used.');
      await this.checkPasswordHistory(tx, user.id, newPassword);
      await this.applyNewPassword(tx, user.id, await hashPassword(newPassword));
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.db.tx(async (tx) => {
      const r = await tx.query<UserRow>('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE', [
        userId,
      ]);
      const user = r.rows[0];
      if (!user || user.status !== 'active') throw new InvalidCredentialsError('User account not found or inactive.');
      const currentHash = await this.users.getPasswordHash(user, tx);
      if (!currentHash || !(await verifyPassword(currentPassword, currentHash)))
        throw new InvalidCredentialsError('Current password is incorrect.');
      await this.checkPasswordHistory(tx, user.id, newPassword);
      await this.applyNewPassword(tx, user.id, await hashPassword(newPassword));
    });
  }

  private async checkPasswordHistory(db: Queryable, userId: string, candidate: string, limit = 5): Promise<void> {
    const h = await db.query<{ password_hash: string }>(
      'SELECT password_hash FROM password_histories WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    for (const row of h.rows) {
      if (await verifyPassword(candidate, row.password_hash)) throw new PasswordRecentlyUsedError();
    }
  }

  /** Persist a new password hash, bump token_version (invalidating access/reset tokens) and revoke every session. */
  private async applyNewPassword(db: Queryable, userId: string, newHash: string): Promise<void> {
    await db.query(
      `UPDATE users SET password_hash = $2, must_change_password = false, temp_password_expires_at = NULL,
              token_version = token_version + 1, updated_at = now() WHERE id = $1`,
      [userId, newHash],
    );
    await this.users.setPasswordCredential(db, userId, newHash, userId);
    await db.query('INSERT INTO password_histories (id, user_id, password_hash) VALUES ($1,$2,$3)', [
      randomUUID(),
      userId,
      newHash,
    ]);
    await db.query('UPDATE user_security SET password_changed_at = now(), updated_at = now() WHERE user_id = $1', [
      userId,
    ]);
    await db.query(
      'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  }

  // --------------------------------------------------------------- logout

  async logout(userId: string, body: { refresh_token?: string | null; logout_all?: boolean }): Promise<void> {
    await this.db.tx(async (tx) => {
      if (body.logout_all) {
        await tx.query(
          'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
          [userId],
        );
        // Bump token_version so in-flight access tokens die immediately.
        await tx.query('UPDATE users SET token_version = token_version + 1, updated_at = now() WHERE id = $1', [
          userId,
        ]);
      } else if (body.refresh_token) {
        await tx.query(
          'UPDATE user_sessions SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND refresh_token_hash = $2 AND revoked_at IS NULL',
          [userId, sha256Hex(body.refresh_token)],
        );
      }
    });
  }

  // -------------------------------------------------------------- profile

  async getUserProfile(user: UserRow, tenantId?: string): Promise<UserProfile> {
    const base = this.users.toUserRead(user);

    const tenants = user.is_super_admin
      ? await this.db.query<TenantSummary>(
          'SELECT id, name, slug FROM tenants WHERE deleted_at IS NULL ORDER BY created_at ASC',
        )
      : await this.db.query<TenantSummary>(
          `SELECT t.id, t.name, t.slug FROM tenants t JOIN tenant_members tm ON tm.tenant_id = t.id
            WHERE tm.user_id = $1 AND tm.status = 'active' AND t.deleted_at IS NULL ORDER BY t.created_at ASC`,
          [user.id],
        );
    const accessible = tenants.rows;
    const active = (tenantId ? accessible.find((t) => t.id === tenantId) : undefined) ?? accessible[0] ?? null;
    if (!active) return { ...base, active_tenant: null, accessible_tenants: [], accessible_modules: [] };

    const tm = await this.db.query<{ module_id: string }>(
      'SELECT module_id FROM tenant_modules WHERE tenant_id = $1 AND is_active = true AND deleted_at IS NULL',
      [active.id],
    );
    const activeModuleIds = new Set(tm.rows.map((r) => r.module_id));

    const roles = await this.rbac.getUserRoles(user.id, active.id);
    const perms = await this.rbac.getUserPermissions(user.id, active.id);
    const isOwnerOrAdmin = user.is_super_admin || roles.some((r) => ['owner', 'admin', 'super_admin'].includes(r.code));

    let entitled: Set<string>;
    if (isOwnerOrAdmin) {
      entitled = activeModuleIds;
    } else {
      const grants = await this.rbac.getUserModuleGrants(user.id, active.id);
      entitled = new Set([...grants, ...roles.map((r) => r.module_code).filter((m): m is string => !!m)]);
    }

    const modules: AccessibleModule[] = [];
    for (const code of [...activeModuleIds].filter((m) => entitled.has(m)).sort()) {
      const [title, desc] = KNOWN_MODULES[code] ?? [capitalize(code), `${capitalize(code)} business module.`];
      const modRole = roles.find((r) => r.module_code === code);
      let role: { code: string; name: string; hierarchy_level: number };
      if (!modRole && user.is_super_admin)
        role = { code: 'super_admin', name: 'Super Administrator', hierarchy_level: 100 };
      else if (!modRole && roles.some((r) => r.code === 'owner'))
        role = { code: 'owner', name: 'Organization Owner', hierarchy_level: 80 };
      else if (!modRole && roles.some((r) => r.code === 'admin'))
        role = { code: 'admin', name: 'Administrator', hierarchy_level: 50 };
      else if (modRole) role = { code: modRole.code, name: modRole.name, hierarchy_level: modRole.hierarchy_level };
      else role = { code: 'member', name: 'Member', hierarchy_level: 10 };

      let modPerms = perms.filter((p) => p.module === code).map((p) => p.code);
      if (isOwnerOrAdmin && modPerms.length === 0) {
        const all = await this.db.query<{ code: string }>('SELECT code FROM permissions WHERE module = $1', [code]);
        modPerms = all.rows.map((r) => r.code);
      }

      let scope = 'OWN';
      if (isOwnerOrAdmin) scope = 'ORGANIZATION';
      else {
        const modScopes = perms.filter((p) => p.module === code).map((p) => p.scope);
        scope = ['ORGANIZATION', 'DEPARTMENT', 'TEAM', 'OWN'].find((s) => modScopes.includes(s)) ?? 'OWN';
      }

      modules.push({ id: code, code, name: title, description: desc, role, data_scope: scope, permissions: modPerms });
    }

    return { ...base, active_tenant: active, accessible_tenants: accessible, accessible_modules: modules };
  }
}
