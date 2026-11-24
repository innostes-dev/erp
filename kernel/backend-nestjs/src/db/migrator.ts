import { Logger } from '@nestjs/common';
import { KERNEL_SCHEMA_SQL } from '../migrations/0001-kernel-schema';
import { IDENTITIES_CREDENTIALS_SQL } from '../migrations/0003-identities-credentials';
import { DatabaseService } from './database.service';

const LOCK_KEY = 7_201_126; // arbitrary, shared by every backend that wants to serialise schema creation

/**
 * Applies the reference kernel schema. It is a strict no-op when the `tenants` table already exists, so one
 * database can be served interchangeably by FastAPI (Alembic), Laravel or NestJS.
 */
export class Migrator {
  private readonly logger = new Logger(Migrator.name);

  constructor(private readonly db: DatabaseService) {}

  async schemaExists(): Promise<boolean> {
    const r = await this.db.query<{ exists: boolean }>("SELECT to_regclass('public.tenants') IS NOT NULL AS exists");
    return r.rows[0].exists;
  }

  /** 0002: widen api_keys.key_prefix (VARCHAR(16) cannot hold `<14 chars>...`). True when a change is needed. */
  async keyPrefixNeedsWidening(): Promise<boolean> {
    const r = await this.db.query<{ n: number | null }>(
      `SELECT character_maximum_length AS n FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'api_keys' AND column_name = 'key_prefix'`,
    );
    return r.rows[0] !== undefined && r.rows[0].n !== null && r.rows[0].n < 32;
  }

  /** Idempotent; also applied when the tables were created by another backend. */
  async widenKeyPrefix(): Promise<boolean> {
    if (!(await this.keyPrefixNeedsWidening())) return false;
    await this.db.query('ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(32)');
    return true;
  }

  /** 0003: identities + credentials (shared SQL, idempotent). True when the tables are missing. */
  async identitiesMissing(): Promise<boolean> {
    const r = await this.db.query<{ missing: boolean }>(
      "SELECT to_regclass('public.identities') IS NULL OR to_regclass('public.credentials') IS NULL AS missing",
    );
    return r.rows[0].missing;
  }

  /**
   * Always applied: the SQL creates the tables if needed and backfills users written by any backend that
   * does not dual-write yet. Every statement is idempotent, so this is a no-op on an up-to-date database.
   */
  async applyIdentitiesCredentials(): Promise<boolean> {
    const missing = await this.identitiesMissing();
    await this.db.tx(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
      await tx.query(IDENTITIES_CREDENTIALS_SQL);
    });
    if (missing) this.logger.log('Applied identities + credentials (0003)');
    return missing;
  }

  /** Number of migrations that `run()` would apply. */
  async pending(): Promise<number> {
    if (!(await this.schemaExists())) return 3;
    return ((await this.keyPrefixNeedsWidening()) ? 1 : 0) + ((await this.identitiesMissing()) ? 1 : 0);
  }

  /** @returns true when the schema was created, false when it was already present. */
  async run(): Promise<boolean> {
    if (await this.schemaExists()) {
      const widened = await this.widenKeyPrefix();
      const identities = await this.applyIdentitiesCredentials();
      return widened || identities;
    }
    const created = await this.db.tx(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
      const again = await tx.query<{ exists: boolean }>("SELECT to_regclass('public.tenants') IS NOT NULL AS exists");
      if (again.rows[0].exists) return false;
      this.logger.log('Applying kernel schema (0001)');
      await tx.query(KERNEL_SCHEMA_SQL);
      return true;
    });
    await this.widenKeyPrefix();
    await this.applyIdentitiesCredentials();
    return created;
  }
}
