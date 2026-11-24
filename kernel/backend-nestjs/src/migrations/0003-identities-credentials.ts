// GENERATED from kernel/backend/migrations/sql/0010_identities_credentials.sql (shared by all backends). Do not edit by hand.
// Regenerate: node scripts/gen-schema.js
export const IDENTITIES_CREDENTIALS_SQL = `-- 0010: identities + credentials (expand step).
--
-- Moves "how a user is identified" (email, phone, ...) and "how a user proves it" (password, later
-- PIN / TOTP / passkey) out of the users table into two dedicated tables. This is the EXPAND step:
-- the legacy columns users.email_hash / email_encrypted / mobile_hash / mobile_encrypted /
-- password_hash stay in place and every backend keeps writing them, so nothing that reads them breaks.
-- Reads go to the new tables first and fall back to the legacy columns.
--
-- SHARED BY ALL KERNEL BACKENDS. This exact file is applied by FastAPI (Alembic 0010), Laravel
-- (database/schema/0010_identities_credentials.sql) and NestJS (src/migrations/0003-identities-credentials.ts).
-- Keep the copies identical: node scripts/parity/check-shared-sql.mjs
--
-- Idempotent: safe to run more than once and on a database migrated by another backend.
-- Requires PostgreSQL 13+ (gen_random_uuid()).

CREATE TABLE IF NOT EXISTS identities (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    value_hash VARCHAR(64),
    value_encrypted TEXT,
    provider VARCHAR(50),
    provider_subject VARCHAR(255),
    is_primary BOOLEAN DEFAULT false NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    CONSTRAINT pk_identities PRIMARY KEY (id),
    CONSTRAINT fk_identities_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_identities_type CHECK (type IN ('email', 'phone', 'username', 'social', 'sso')),
    CONSTRAINT ck_identities_value CHECK (
        (type IN ('email', 'phone', 'username') AND value_hash IS NOT NULL AND value_encrypted IS NOT NULL)
        OR (type IN ('social', 'sso') AND provider IS NOT NULL AND provider_subject IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_identities_user_id ON identities (user_id);
CREATE INDEX IF NOT EXISTS ix_identities_deleted_at ON identities (deleted_at);
-- Same rule as the legacy unique indexes on users.email_hash / users.mobile_hash: a value can belong to
-- one account only, including soft-deleted accounts.
CREATE UNIQUE INDEX IF NOT EXISTS uq_identities_type_value_hash ON identities (type, value_hash) WHERE value_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_identities_provider_subject ON identities (provider, provider_subject) WHERE provider_subject IS NOT NULL;
-- At most one primary identity of each type per user.
CREATE UNIQUE INDEX IF NOT EXISTS uq_identities_user_type_primary ON identities (user_id, type) WHERE is_primary AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS credentials (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    secret_hash TEXT,
    secret_encrypted TEXT,
    device_id UUID,
    params JSONB,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    CONSTRAINT pk_credentials PRIMARY KEY (id),
    CONSTRAINT fk_credentials_user_id_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_credentials_device_id_user_devices FOREIGN KEY (device_id) REFERENCES user_devices (id) ON DELETE CASCADE,
    CONSTRAINT ck_credentials_type CHECK (type IN ('password', 'pin', 'totp', 'passkey', 'backup_codes')),
    CONSTRAINT ck_credentials_secret CHECK (secret_hash IS NOT NULL OR secret_encrypted IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_credentials_user_id ON credentials (user_id);
CREATE INDEX IF NOT EXISTS ix_credentials_device_id ON credentials (device_id);
CREATE INDEX IF NOT EXISTS ix_credentials_deleted_at ON credentials (deleted_at);
-- At most one active password per user (used as the ON CONFLICT target when a password is set).
CREATE UNIQUE INDEX IF NOT EXISTS uq_credentials_user_password ON credentials (user_id) WHERE type = 'password' AND deleted_at IS NULL;

-- Backfill from the legacy columns. A user is only backfilled when it has NO row of that kind yet (active or
-- soft-deleted) and the value is not taken by another identity. So re-running is a no-op, a user whose
-- identity already differs from the legacy column is left alone, and a removed (soft-deleted) identity or
-- password is never brought back.
INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary, verified_at,
                        created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
SELECT gen_random_uuid(), u.id, 'email', u.email_hash, u.email_encrypted, true, s.email_verified_at,
       u.created_at, u.created_by, u.updated_at, u.updated_by, u.deleted_at, u.deleted_by
  FROM users u
  LEFT JOIN user_security s ON s.user_id = u.id
 WHERE u.email_hash IS NOT NULL AND u.email_encrypted IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM identities i WHERE i.type = 'email' AND (i.value_hash = u.email_hash OR i.user_id = u.id));

INSERT INTO identities (id, user_id, type, value_hash, value_encrypted, is_primary, verified_at,
                        created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)
SELECT gen_random_uuid(), u.id, 'phone', u.mobile_hash, u.mobile_encrypted, true, s.mobile_verified_at,
       u.created_at, u.created_by, u.updated_at, u.updated_by, u.deleted_at, u.deleted_by
  FROM users u
  LEFT JOIN user_security s ON s.user_id = u.id
 WHERE u.mobile_hash IS NOT NULL AND u.mobile_encrypted IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM identities i WHERE i.type = 'phone' AND (i.value_hash = u.mobile_hash OR i.user_id = u.id));

INSERT INTO credentials (id, user_id, type, secret_hash, created_at, created_by, updated_at, updated_by)
SELECT gen_random_uuid(), u.id, 'password', u.password_hash, u.created_at, u.created_by, u.updated_at, u.updated_by
  FROM users u
 WHERE u.password_hash IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM credentials c WHERE c.user_id = u.id AND c.type = 'password');
`;
