import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ErrorCode, ForbiddenError, SlugTakenError, TenantNotFoundError } from '../common/errors';
import { DatabaseService, isUniqueViolation, Queryable } from '../db/database.service';
import { ActivationResponse, CatalogItem, Page, TenantRow } from './tenant.types';

export interface TenantInput {
  name: string;
  slug: string;
  country?: string | null;
  timezone?: string | null;
  language?: string | null;
  date_format?: string | null;
}

export type TenantPatch = Partial<Omit<TenantInput, 'name' | 'slug'>> & { name?: string | null; slug?: string | null };

type Meta = { name: string; version: string; description: string; tags: string[]; tone: string };

const MODULE_METADATA: Record<string, Meta> = {
  peopleops: {
    name: 'PeopleOps',
    version: '0.1.0',
    description: 'People operations, attendance, leave, and payroll',
    tags: ['Employees', 'Attendance', 'Leave', 'Payroll'],
    tone: 'chart-3',
  },
  salesflow: {
    name: 'SalesFlow',
    version: '0.1.0',
    description: 'Sales pipeline, customer leads, deals, and quotes',
    tags: ['Leads', 'Deals', 'Pipeline', 'Quotes'],
    tone: 'chart-2',
  },
  hireflow: {
    name: 'HireFlow',
    version: '0.1.0',
    description: 'Frictionless hiring pipeline, candidate tracking, and interview scheduling',
    tags: ['Recruiting', 'Jobs', 'Candidates', 'Interviews'],
    tone: 'chart-4',
  },
  ledgerflow: {
    name: 'LedgerFlow',
    version: '0.1.0',
    description: 'General ledger, double-entry vouchers, AP/AR, cash flow, and tax compliance',
    tags: ['Ledger', 'AP', 'AR', 'Tax', 'Banking'],
    tone: 'chart-1',
  },
  stockflow: {
    name: 'StockFlow',
    version: '0.1.0',
    description: 'Multi-warehouse stock flow, item bins, procurement POs, and reorder alerts',
    tags: ['Stock', 'Procurement', 'Warehouse', 'Valuation'],
    tone: 'chart-5',
  },
  sprintflow: {
    name: 'SprintFlow',
    version: '0.1.0',
    description: 'Agile sprint execution, burndown velocity, epics, and issue tracking',
    tags: ['Agile', 'Scrum', 'Kanban', 'Sprints', 'Bugs'],
    tone: 'chart-2',
  },
  docflow: {
    name: 'DocFlow',
    version: '0.1.0',
    description: 'Living team documentation, company SOPs, blueprints, and architecture wiki',
    tags: ['Knowledge', 'Wiki', 'SOPs', 'PRDs', 'Handbook'],
    tone: 'chart-3',
  },
};

const TRACURA: Meta = {
  name: 'Tracura',
  version: '0.1.0',
  description: 'Enterprise API observability, universal telemetry ingestion, and analytics',
  tags: ['Logs', 'Telemetry', 'Analytics'],
  tone: 'chart-5',
};
const PLUGIN_METADATA: Record<string, Meta> = { tracura: TRACURA, 'api-logger': TRACURA };

export type ActivationKind = 'module' | 'plugin';
const KIND = {
  module: { table: 'tenant_modules', idCol: 'module_id', label: 'Module' },
  plugin: { table: 'tenant_plugins', idCol: 'plugin_id', label: 'Plugin' },
} as const;

@Injectable()
export class TenancyService {
  constructor(private readonly db: DatabaseService) {}

  async getBySlug(slug: string, db: Queryable = this.db): Promise<TenantRow | null> {
    const r = await db.query<TenantRow>('SELECT * FROM tenants WHERE slug = $1', [slug]);
    return r.rows[0] ?? null;
  }

  async get(id: string, includeDeleted = false, db: Queryable = this.db): Promise<TenantRow | null> {
    const r = await db.query<TenantRow>(
      `SELECT * FROM tenants WHERE id = $1${includeDeleted ? '' : ' AND deleted_at IS NULL'}`,
      [id],
    );
    return r.rows[0] ?? null;
  }

  async getOrThrow(id: string, includeDeleted = false): Promise<TenantRow> {
    const t = await this.get(id, includeDeleted);
    if (!t) throw new TenantNotFoundError();
    return t;
  }

  /** All tenants (platform operators), or only those the user is an active member of (`memberUserId`). */
  async list(offset: number, limit: number, includeDeleted: boolean, memberUserId?: string): Promise<Page<TenantRow>> {
    const conds: string[] = [];
    const params: unknown[] = [];
    if (!includeDeleted) conds.push('t.deleted_at IS NULL');
    if (memberUserId) {
      params.push(memberUserId);
      conds.push(
        `EXISTS (SELECT 1 FROM tenant_members tm WHERE tm.tenant_id = t.id AND tm.user_id = $${params.length}
                   AND tm.status = 'active' AND tm.deleted_at IS NULL)`,
      );
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const total = await this.db.query<{ n: number }>(`SELECT count(*)::int AS n FROM tenants t ${where}`, params);
    const rows = await this.db.query<TenantRow>(
      `SELECT t.* FROM tenants t ${where} ORDER BY t.created_at DESC, t.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return { items: rows.rows, total: total.rows[0].n, offset, limit };
  }

  /** True when the user is an active (non-deleted) member of the tenant. */
  async isActiveMember(userId: string, tenantId: string): Promise<boolean> {
    const r = await this.db.query(
      `SELECT 1 FROM tenant_members WHERE user_id = $1 AND tenant_id = $2 AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
      [userId, tenantId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /**
   * Tenant the caller may act on. Platform super-admins may select any tenant (`resolveCurrentTenantId`); everyone else
   * is confined to tenants they are an active member of: an explicit X-Tenant-ID must be one of them (403 otherwise)
   * and, without a header, their first membership is used (404 when they have none; no "oldest tenant" fallback).
   */
  async resolveTenantForUser(user: { id: string; is_super_admin: boolean }, headerTenantId?: string): Promise<string> {
    if (user.is_super_admin) return this.resolveCurrentTenantId(user.id, headerTenantId);
    if (headerTenantId) {
      if (!(await this.isActiveMember(user.id, headerTenantId)))
        throw new ForbiddenError('You are not a member of this tenant.', ErrorCode.PERMISSION_DENIED);
      return headerTenantId;
    }
    const m = await this.db.query<{ tenant_id: string }>(
      `SELECT tm.tenant_id FROM tenant_members tm
         JOIN tenants t ON t.id = tm.tenant_id AND t.deleted_at IS NULL
        WHERE tm.user_id = $1 AND tm.status = 'active' AND tm.deleted_at IS NULL ORDER BY tm.created_at ASC LIMIT 1`,
      [user.id],
    );
    if (!m.rows[0]) throw new TenantNotFoundError('No active tenant found for user.');
    return m.rows[0].tenant_id;
  }

  async create(data: TenantInput, actorId: string | null, db: Queryable = this.db): Promise<TenantRow> {
    if (await this.getBySlug(data.slug, db)) throw new SlugTakenError(data.slug);
    try {
      const r = await db.query<TenantRow>(
        `INSERT INTO tenants (id, name, slug, country, timezone, language, date_format, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *`,
        [
          randomUUID(),
          data.name,
          data.slug,
          data.country ?? null,
          data.timezone ?? null,
          data.language ?? null,
          data.date_format ?? null,
          actorId,
        ],
      );
      return r.rows[0];
    } catch (err) {
      if (isUniqueViolation(err, 'uq_tenants_slug')) throw new SlugTakenError(data.slug);
      throw err;
    }
  }

  /** Partial update: `undefined` keeps the value, `null` clears nullable fields (name/slug cannot be null). */
  async update(tenant: TenantRow, patch: TenantPatch, actorId: string | null): Promise<TenantRow> {
    if (patch.slug && patch.slug !== tenant.slug) {
      const other = await this.getBySlug(patch.slug);
      if (other && other.id !== tenant.id) throw new SlugTakenError(patch.slug);
    }
    const sets: string[] = [];
    const params: unknown[] = [tenant.id];
    const add = (col: string, value: unknown): void => {
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    };
    if (patch.name !== undefined && patch.name !== null) add('name', patch.name);
    if (patch.slug !== undefined && patch.slug !== null) add('slug', patch.slug);
    for (const col of ['country', 'timezone', 'language', 'date_format'] as const) {
      if (patch[col] !== undefined) add(col, patch[col]);
    }
    add('updated_by', actorId);
    try {
      const r = await this.db.query<TenantRow>(
        `UPDATE tenants SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
        params,
      );
      return r.rows[0];
    } catch (err) {
      if (isUniqueViolation(err, 'uq_tenants_slug') && patch.slug) throw new SlugTakenError(patch.slug);
      throw err;
    }
  }

  async softDelete(tenant: TenantRow, actorId: string | null): Promise<TenantRow> {
    const r = await this.db.query<TenantRow>(
      'UPDATE tenants SET deleted_at = now(), deleted_by = $2, updated_by = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [tenant.id, actorId],
    );
    return r.rows[0];
  }

  async restore(tenant: TenantRow, actorId: string | null): Promise<TenantRow> {
    const r = await this.db.query<TenantRow>(
      'UPDATE tenants SET deleted_at = NULL, deleted_by = NULL, updated_by = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [tenant.id, actorId],
    );
    return r.rows[0];
  }

  /** Active tenant: explicit header, else the user's first active membership, else the oldest tenant. */
  async resolveCurrentTenantId(userId: string, headerTenantId?: string): Promise<string> {
    if (headerTenantId) return headerTenantId;
    const m = await this.db.query<{ tenant_id: string }>(
      `SELECT tm.tenant_id FROM tenant_members tm
         WHERE tm.user_id = $1 AND tm.status = 'active' AND tm.deleted_at IS NULL ORDER BY tm.created_at ASC LIMIT 1`,
      [userId],
    );
    if (m.rows[0]) return m.rows[0].tenant_id;
    const t = await this.db.query<{ id: string }>(
      'SELECT id FROM tenants WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 1',
    );
    if (t.rows[0]) return t.rows[0].id;
    throw new TenantNotFoundError('No active tenant found for user.');
  }

  async listCatalog(
    kind: ActivationKind,
    tenantId: string,
  ): Promise<{ installed: CatalogItem[]; active_ids: string[] }> {
    const k = KIND[kind];
    const r = await this.db.query<{ item_id: string; activated_at: Date | null }>(
      `SELECT ${k.idCol} AS item_id, activated_at FROM ${k.table} WHERE tenant_id = $1 AND is_active = true`,
      [tenantId],
    );
    const active = new Map(r.rows.map((x) => [x.item_id, x.activated_at]));
    const meta = kind === 'module' ? MODULE_METADATA : PLUGIN_METADATA;
    const installed: CatalogItem[] = Object.keys(meta)
      .sort()
      .map((id) => {
        const m = meta[id];
        return {
          id,
          name: m.name,
          version: m.version,
          type: kind,
          description: m.description,
          tags: m.tags,
          tone: m.tone,
          is_active: active.has(id),
          activated_at: active.get(id)?.toISOString() ?? null,
        };
      });
    return { installed, active_ids: [...active.keys()] };
  }

  /** Activate/deactivate a module or plugin for the tenant (upsert; one atomic statement). */
  async setActivation(
    kind: ActivationKind,
    tenantId: string,
    itemId: string,
    active: boolean,
    actorId: string,
  ): Promise<ActivationResponse> {
    const k = KIND[kind];
    if (!active) {
      await this.db.query(
        `UPDATE ${k.table} SET is_active = false, activated_at = NULL, activated_by = NULL, updated_at = now()
          WHERE tenant_id = $1 AND ${k.idCol} = $2`,
        [tenantId, itemId],
      );
      return { item_id: itemId, is_active: false, message: `${k.label} '${itemId}' deactivated.` };
    }
    try {
      await this.db.query(
        `INSERT INTO ${k.table} (id, tenant_id, ${k.idCol}, is_active, activated_at, activated_by)
         VALUES ($1,$2,$3,true, now(), $4)
         ON CONFLICT (tenant_id, ${k.idCol}) DO UPDATE SET
           is_active = EXCLUDED.is_active, activated_at = EXCLUDED.activated_at, activated_by = EXCLUDED.activated_by, updated_at = now()`,
        [randomUUID(), tenantId, itemId, actorId],
      );
    } catch (err) {
      if ((err as { code?: string }).code === '23503') throw new TenantNotFoundError();
      throw err;
    }
    return { item_id: itemId, is_active: true, message: `${k.label} '${itemId}' activated successfully.` };
  }
}
