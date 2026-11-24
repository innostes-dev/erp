import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../db/database.service';
import { NotFoundError } from '../common/errors';
import { API_KEY_PREFIX, generateApiKey } from '../crypto/tokens';
import { sha256Hex } from '../crypto/cipher';

export interface ApiKeyRow {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  expires_at: Date | null;
  last_used_at: Date | null;
  is_revoked: boolean;
  revoked_at: Date | null;
  created_at: Date;
}

export interface ApiKeyRead {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  expires_at: string | null;
  last_used_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

/**
 * The stored prefix is `<14 chars>...` (column widened to VARCHAR(32) by migration 0002); legacy 14-char values get the
 * ellipsis appended on output.
 */
const displayPrefix = (stored: string): string => (stored.endsWith('...') ? stored : `${stored}...`);

export function toApiKeyRead(k: ApiKeyRow): ApiKeyRead {
  return {
    id: k.id,
    name: k.name,
    key_prefix: displayPrefix(k.key_prefix),
    scopes: Array.isArray(k.scopes) ? k.scopes : [],
    expires_at: k.expires_at ? k.expires_at.toISOString() : null,
    last_used_at: k.last_used_at ? k.last_used_at.toISOString() : null,
    is_revoked: k.is_revoked,
    created_at: k.created_at.toISOString(),
  };
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    tenantId: string,
    userId: string,
    name: string,
    scopes?: string[],
    expiresInDays?: number | null,
  ): Promise<{ key: ApiKeyRow; rawKey: string }> {
    const rawKey = generateApiKey();
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86_400_000) : null;
    const r = await this.db.query<ApiKeyRow>(
      `INSERT INTO api_keys (id, tenant_id, user_id, name, key_prefix, key_hash, scopes, expires_at, is_revoked)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,false) RETURNING *`,
      [
        randomUUID(),
        tenantId,
        userId,
        name,
        `${rawKey.slice(0, 14)}...`,
        sha256Hex(rawKey),
        JSON.stringify(scopes?.length ? scopes : ['*']),
        expiresAt,
      ],
    );
    return { key: r.rows[0], rawKey };
  }

  /** Keys of a tenant; `ownerId` restricts the result to keys created by that user. */
  async list(tenantId: string, ownerId?: string): Promise<ApiKeyRow[]> {
    const r = await this.db.query<ApiKeyRow>(
      `SELECT * FROM api_keys WHERE tenant_id = $1 AND ($2::uuid IS NULL OR user_id = $2::uuid) ORDER BY created_at DESC`,
      [tenantId, ownerId ?? null],
    );
    return r.rows;
  }

  async revoke(keyId: string, tenantId: string, ownerId?: string): Promise<ApiKeyRow> {
    const r = await this.db.query<ApiKeyRow>(
      `UPDATE api_keys SET is_revoked = true, revoked_at = COALESCE(revoked_at, now()), updated_at = now()
        WHERE id = $1 AND tenant_id = $2 AND ($3::uuid IS NULL OR user_id = $3::uuid) RETURNING *`,
      [keyId, tenantId, ownerId ?? null],
    );
    if (!r.rows[0]) throw new NotFoundError('API key not found.');
    return r.rows[0];
  }

  /** Authenticate a raw key; returns the record when active and unexpired. */
  async verify(rawKey: string): Promise<ApiKeyRow | null> {
    if (!rawKey.startsWith(API_KEY_PREFIX)) return null;
    const r = await this.db.query<ApiKeyRow>(
      `UPDATE api_keys SET last_used_at = now()
        WHERE key_hash = $1 AND is_revoked = false AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > now())
        RETURNING *`,
      [sha256Hex(rawKey)],
    );
    return r.rows[0] ?? null;
  }
}
