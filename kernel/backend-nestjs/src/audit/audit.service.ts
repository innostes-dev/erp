import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService, Queryable } from '../db/database.service';

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string | null;
  changes?: Record<string, unknown>;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  tenantId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  reason?: string | null;
  status?: string;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'hashed_password',
  'secret',
  'client_secret',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'key_hash',
]);

/** Field-level diff of two states with sensitive keys masked out. */
export function computeFieldDiff(
  oldState: Record<string, unknown> | null | undefined,
  newState: Record<string, unknown> | null | undefined,
): Record<string, { old: unknown; new: unknown }> {
  const o = oldState ?? {};
  const n = newState ?? {};
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  for (const k of [...new Set([...Object.keys(o), ...Object.keys(n)])].sort()) {
    if (SENSITIVE_KEYS.has(k)) continue;
    if (JSON.stringify(o[k] ?? null) !== JSON.stringify(n[k] ?? null))
      diff[k] = { old: o[k] ?? null, new: n[k] ?? null };
  }
  return diff;
}

const clip = (v: string | null | undefined, n: number): string | null => (v ? v.slice(0, n) : null);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly db: DatabaseService) {}

  /** Insert an immutable audit row. Throws on failure; callers normally use `safeRecord`. */
  async record(e: AuditEvent, db: Queryable = this.db): Promise<string> {
    let changes = e.changes ?? {};
    if (
      Object.keys(changes).length === 0 &&
      ((e.oldState !== undefined && e.oldState !== null) || (e.newState !== undefined && e.newState !== null))
    ) {
      changes = computeFieldDiff(e.oldState, e.newState);
    }
    const id = randomUUID();
    await db.query(
      `INSERT INTO audit_logs (id, tenant_id, actor_id, actor_email, actor_name, action, entity_type, entity_id, entity_name,
                               changes, ip_address, user_agent, correlation_id, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15)`,
      [
        id,
        e.tenantId ?? null,
        e.actorId ?? null,
        clip(e.actorEmail, 255),
        clip(e.actorName, 255),
        e.action.toUpperCase().slice(0, 50),
        e.entityType.toLowerCase().slice(0, 64),
        String(e.entityId).slice(0, 128),
        clip(e.entityName, 255),
        JSON.stringify(changes),
        clip(e.ipAddress, 45),
        clip(e.userAgent, 512),
        clip(e.correlationId, 128),
        e.reason ?? null,
        (e.status ?? 'SUCCESS').toUpperCase().slice(0, 20),
      ],
    );
    return id;
  }

  /** Audit failures must never fail the request. */
  async safeRecord(e: AuditEvent): Promise<void> {
    try {
      await this.record(e);
    } catch (err) {
      this.logger.warn({ err, action: e.action, entityType: e.entityType }, 'Failed to write audit log');
    }
  }
}
