import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, AppConfig } from '../config/env';
import { BlindIndex, FieldCipher } from '../crypto/cipher';
import { hashPassword } from '../crypto/password';
import { EmailAlreadyExistsError, MobileAlreadyExistsError, UserNotFoundError } from '../common/errors';
import { DatabaseService, isUniqueViolation, Queryable } from '../db/database.service';
import { UserRead, UserRow } from './user.types';

export type IdentityType = 'email' | 'phone' | 'username';

/** Legacy lookup column for identifier types that existed before migration 0003/0010 (fixed names, not input). */
const LEGACY_IDENTITY_COLUMN: Partial<Record<IdentityType, 'email_hash' | 'mobile_hash'>> = {
  email: 'email_hash',
  phone: 'mobile_hash',
};

export interface NewUser {
  first_name: string;
  last_name?: string | null;
  email: string;
  password: string;
  mobile?: string | null;
}

@Injectable()
export class UsersService {
  readonly cipher: FieldCipher;
  readonly blindIndex: BlindIndex;

  constructor(
    @Inject(APP_CONFIG) cfg: AppConfig,
    private readonly db: DatabaseService,
  ) {
    this.cipher = new FieldCipher(cfg.crypto.keys, cfg.crypto.currentVersion);
    this.blindIndex = new BlindIndex(cfg.crypto.blindIndexPepper);
  }

  async getById(id: string, db: Queryable = this.db): Promise<UserRow | null> {
    const r = await db.query<UserRow>('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    return r.rows[0] ?? null;
  }

  /** Find by email through the `identities` table (legacy users.email_hash as fallback). */
  async getByEmail(email: string, db: Queryable = this.db): Promise<UserRow | null> {
    return this.findUserByIdentifier('email', email, db);
  }

  // ------------------------------------------------ identities + credentials
  // Expand-step rules shared with the FastAPI and Laravel kernels (one database): reads use the new tables
  // first and fall back to the legacy users columns only when the new table has no row at all (a soft-deleted
  // identity or credential is never brought back); writes go to both.

  /** Active (not soft-deleted) owner of an email / phone / username, or null. */
  async findUserByIdentifier(type: IdentityType, value: string, db: Queryable = this.db): Promise<UserRow | null> {
    // The blind index would hash "   " like ""; blank identifiers never match.
    const hash = value.trim() ? this.blindIndex.compute(value) : null;
    if (!hash) return null;
    const r = await db.query<UserRow>(
      `SELECT u.* FROM users u
         JOIN identities i ON i.user_id = u.id
        WHERE i.type = $1 AND i.value_hash = $2 AND i.deleted_at IS NULL AND u.deleted_at IS NULL`,
      [type, hash],
    );
    if (r.rows[0]) return r.rows[0];
    // Known identifier whose identity (or user) is soft-deleted: do not resurrect it via the legacy column.
    const known = await db.query('SELECT 1 FROM identities WHERE type = $1 AND value_hash = $2 LIMIT 1', [type, hash]);
    if (known.rowCount) return null;
    const legacy = LEGACY_IDENTITY_COLUMN[type];
    if (!legacy) return null;
    const l = await db.query<UserRow>(`SELECT * FROM users WHERE ${legacy} = $1 AND deleted_at IS NULL`, [hash]);
    return l.rows[0] ?? null;
  }

  /** Store an email / phone / username identity (blind index + encrypted value). */
  async addIdentity(db: Queryable, userId: string, type: IdentityType, value: string, primary = false): Promise<void> {
    const hash = value.trim() ? this.blindIndex.compute(value) : null;
    if (!hash) throw new Error(`${type} cannot be empty.`);
    await db.query(
      `INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), userId, type, hash, this.cipher.encrypt(value), primary],
    );
  }

  /** Current password hash (credentials first, legacy users.password_hash as fallback); null if none. */
  async getPasswordHash(user: Pick<UserRow, 'id' | 'password_hash'>, db: Queryable = this.db): Promise<string | null> {
    const r = await db.query<{ secret_hash: string | null }>(
      `SELECT secret_hash FROM credentials WHERE user_id = $1 AND type = 'password' AND deleted_at IS NULL`,
      [user.id],
    );
    const hash = r.rows[0]?.secret_hash;
    if (hash) return hash;
    // A password credential existed but was removed: the user has no password (no legacy fallback).
    const removed = await db.query(`SELECT 1 FROM credentials WHERE user_id = $1 AND type = 'password' LIMIT 1`, [
      user.id,
    ]);
    if (removed.rowCount) return null;
    return user.password_hash || null;
  }

  /**
   * Upsert the password credential (conflict target: partial unique index uq_credentials_user_password).
   * Callers also update users.password_hash (legacy column) in the same transaction.
   */
  async setPasswordCredential(db: Queryable, userId: string, hash: string, actorId: string | null = null): Promise<void> {
    await db.query(
      `INSERT INTO credentials (id, user_id, type, secret_hash, created_by, updated_by)
       VALUES ($1, $2, 'password', $3, $4, $4)
       ON CONFLICT (user_id) WHERE type = 'password' AND deleted_at IS NULL
       DO UPDATE SET secret_hash = EXCLUDED.secret_hash, updated_at = now(), updated_by = EXCLUDED.updated_by`,
      [randomUUID(), userId, hash, actorId],
    );
  }

  async getByIdOrThrow(id: string): Promise<UserRow> {
    const user = await this.getById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  /** Creates the user plus profile, security and password-history rows (call inside a transaction). */
  async createUser(db: Queryable, data: NewUser, isSuperAdmin = false): Promise<UserRow> {
    const emailHash = this.blindIndex.compute(data.email);
    if (!emailHash) throw new Error('Email cannot be empty.');
    if (await this.getByEmail(data.email, db)) throw new EmailAlreadyExistsError(data.email);

    const mobile = data.mobile || null;
    const passwordHash = await hashPassword(data.password);
    const id = randomUUID();
    let row: UserRow;
    try {
      const r = await db.query<UserRow>(
        `INSERT INTO users (id, first_name, last_name, email_hash, email_encrypted, mobile_hash, mobile_encrypted,
                            password_hash, status, is_super_admin, must_change_password, failed_login_attempts, token_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',$9,false,0,1) RETURNING *`,
        [
          id,
          data.first_name,
          data.last_name ?? null,
          emailHash,
          this.cipher.encrypt(data.email),
          mobile ? this.blindIndex.compute(mobile) : null,
          mobile ? this.cipher.encrypt(mobile) : null,
          passwordHash,
          isSuperAdmin,
        ],
      );
      row = r.rows[0];
    } catch (err) {
      if (isUniqueViolation(err, 'uq_users_email_hash') || isUniqueViolation(err, 'ix_users_email_hash')) {
        throw new EmailAlreadyExistsError(data.email);
      }
      if (isUniqueViolation(err, 'uq_users_mobile_hash') || isUniqueViolation(err, 'ix_users_mobile_hash')) {
        throw new MobileAlreadyExistsError();
      }
      throw err;
    }
    // Login identifiers and password in the dedicated tables (the legacy columns above stay in sync).
    await this.addIdentity(db, id, 'email', data.email, true);
    if (mobile) await this.addIdentity(db, id, 'phone', mobile, true);
    await this.setPasswordCredential(db, id, passwordHash);
    await db.query('INSERT INTO user_profiles (id, user_id) VALUES ($1, $2)', [randomUUID(), id]);
    await db.query('INSERT INTO user_security (id, user_id, password_changed_at) VALUES ($1, $2, now())', [
      randomUUID(),
      id,
    ]);
    await db.query('INSERT INTO password_histories (id, user_id, password_hash) VALUES ($1, $2, $3)', [
      randomUUID(),
      id,
      passwordHash,
    ]);
    return row;
  }

  decryptEmail(user: UserRow): string {
    return this.cipher.decrypt(user.email_encrypted) ?? '';
  }

  decryptMobile(user: UserRow): string | null {
    return user.mobile_encrypted ? this.cipher.decrypt(user.mobile_encrypted) : null;
  }

  toUserRead(user: UserRow): UserRead {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: this.decryptEmail(user),
      mobile: this.decryptMobile(user),
      status: user.status,
      is_super_admin: user.is_super_admin,
      token_version: user.token_version,
      created_at: user.created_at.toISOString(),
      created_by: user.created_by,
      updated_at: user.updated_at.toISOString(),
      updated_by: user.updated_by,
      deleted_at: user.deleted_at ? user.deleted_at.toISOString() : null,
      deleted_by: user.deleted_by,
    };
  }

  displayName(user: Pick<UserRow, 'first_name' | 'last_name'>): string {
    return `${user.first_name} ${user.last_name ?? ''}`.trim();
  }
}
