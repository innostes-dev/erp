import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService, Queryable } from '../db/database.service';
import { UserRow, isBlocked } from '../users/user.types';

export interface RoleRow {
  id: string;
  tenant_id: string | null;
  code: string;
  name: string;
  hierarchy_level: number;
  module_code: string | null;
}

export interface EffectivePermission {
  code: string;
  module: string;
  resource: string | null;
  action: string | null;
  scope: string;
  role_code: string;
  hierarchy_level: number;
}

export type DataScope = 'ORGANIZATION' | 'DEPARTMENT' | 'TEAM' | 'OWN';

@Injectable()
export class RbacService {
  constructor(private readonly db: DatabaseService) {}

  async getOrCreatePermission(
    db: Queryable,
    p: {
      code: string;
      module: string;
      name: string;
      description?: string | null;
      resource?: string | null;
      action?: string | null;
      defaultScope?: string;
    },
  ): Promise<string> {
    const found = await db.query<{ id: string }>('SELECT id FROM permissions WHERE code = $1', [p.code]);
    if (found.rows[0]) return found.rows[0].id;
    const parts = p.code.split('.');
    const id = randomUUID();
    await db.query(
      `INSERT INTO permissions (id, code, module, name, description, resource, action, default_scope)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        p.code,
        p.module,
        p.name,
        p.description ?? null,
        p.resource || (parts.length >= 2 ? parts[1] : null),
        p.action || (parts.length >= 3 ? parts[2] : null),
        p.defaultScope ?? 'OWN',
      ],
    );
    return id;
  }

  async getOrCreateRole(
    db: Queryable,
    r: {
      code: string;
      name: string;
      tenantId?: string | null;
      isSystem?: boolean;
      hierarchyLevel?: number;
      description?: string | null;
      moduleCode?: string | null;
      canDelegate?: boolean;
      maxDelegatableLevel?: number;
    },
  ): Promise<string> {
    const tenantId = r.tenantId ?? null;
    const found =
      tenantId === null
        ? await db.query<{ id: string }>('SELECT id FROM roles WHERE tenant_id IS NULL AND code = $1', [r.code])
        : await db.query<{ id: string }>('SELECT id FROM roles WHERE tenant_id = $1 AND code = $2', [tenantId, r.code]);
    if (found.rows[0]) return found.rows[0].id;
    const id = randomUUID();
    await db.query(
      `INSERT INTO roles (id, tenant_id, code, name, description, is_system, hierarchy_level, module_code, can_delegate, max_delegatable_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        tenantId,
        r.code,
        r.name,
        r.description ?? null,
        r.isSystem ?? false,
        r.hierarchyLevel ?? 0,
        r.moduleCode ?? null,
        r.canDelegate ?? false,
        r.maxDelegatableLevel ?? 0,
      ],
    );
    return id;
  }

  async assignPermissionToRole(db: Queryable, roleId: string, permissionId: string, scope = 'OWN'): Promise<void> {
    await db.query(
      `INSERT INTO role_permissions (id, role_id, permission_id, scope) VALUES ($1,$2,$3,$4)
       ON CONFLICT ON CONSTRAINT uq_role_permissions_role_perm DO NOTHING`,
      [randomUUID(), roleId, permissionId, scope],
    );
  }

  async assignRoleToUser(
    db: Queryable,
    a: {
      userId: string;
      roleId: string;
      tenantId?: string | null;
      departmentId?: string | null;
      assignedBy?: string | null;
      expiresAt?: Date | null;
    },
  ): Promise<void> {
    const tenantId = a.tenantId ?? null;
    const existing =
      tenantId === null
        ? await db.query('SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2 AND tenant_id IS NULL', [
            a.userId,
            a.roleId,
          ])
        : await db.query('SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2 AND tenant_id = $3', [
            a.userId,
            a.roleId,
            tenantId,
          ]);
    if (existing.rowCount) return;
    await db.query(
      `INSERT INTO user_roles (id, user_id, role_id, tenant_id, department_id, assigned_by, assigned_at, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6, now(), $7)`,
      [randomUUID(), a.userId, a.roleId, tenantId, a.departmentId ?? null, a.assignedBy ?? null, a.expiresAt ?? null],
    );
  }

  async getUserModuleGrants(userId: string, tenantId: string, db: Queryable = this.db): Promise<string[]> {
    const r = await db.query<{ module_code: string }>(
      `SELECT module_code FROM user_module_grants
        WHERE tenant_id = $1 AND user_id = $2 AND is_active = true AND (expires_at IS NULL OR expires_at > now())`,
      [tenantId, userId],
    );
    return r.rows.map((x) => x.module_code);
  }

  async getUserRoles(userId: string, tenantId: string | null, db: Queryable = this.db): Promise<RoleRow[]> {
    const scope = tenantId === null ? 'ur.tenant_id IS NULL' : '(ur.tenant_id = $2 OR ur.tenant_id IS NULL)';
    const r = await db.query<RoleRow>(
      `SELECT r.id, r.tenant_id, r.code, r.name, r.hierarchy_level, r.module_code
         FROM roles r JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND ${scope} AND (ur.expires_at IS NULL OR ur.expires_at > now())`,
      tenantId === null ? [userId] : [userId, tenantId],
    );
    return r.rows;
  }

  async getUserPermissions(
    userId: string,
    tenantId: string | null,
    db: Queryable = this.db,
  ): Promise<EffectivePermission[]> {
    const scope = tenantId === null ? 'ur.tenant_id IS NULL' : '(ur.tenant_id = $2 OR ur.tenant_id IS NULL)';
    const r = await db.query<EffectivePermission>(
      `SELECT p.code, p.module, p.resource, p.action, rp.scope, r.code AS role_code, r.hierarchy_level
         FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND ${scope} AND (ur.expires_at IS NULL OR ur.expires_at > now())`,
      tenantId === null ? [userId] : [userId, tenantId],
    );
    return r.rows.map((x) => ({ ...x, scope: x.scope || 'OWN' }));
  }

  async hasPermission(user: UserRow | null, permissionCode: string, tenantId: string | null): Promise<boolean> {
    if (!user || user.deleted_at || isBlocked(user)) return false;
    if (user.is_super_admin) return true;
    const scope = tenantId === null ? 'ur.tenant_id IS NULL' : '(ur.tenant_id = $3 OR ur.tenant_id IS NULL)';
    const r = await this.db.query(
      `SELECT 1 FROM permissions p
         JOIN role_permissions rp ON rp.permission_id = p.id
         JOIN roles r ON r.id = rp.role_id
         JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND p.code = $2 AND ${scope} AND (ur.expires_at IS NULL OR ur.expires_at > now()) LIMIT 1`,
      tenantId === null ? [user.id, permissionCode] : [user.id, permissionCode, tenantId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Effective data scope for a permission: org-wide for owner/admin roles, otherwise the broadest granted scope. */
  async resolveScope(
    userId: string,
    tenantId: string,
    permissionCode: string,
  ): Promise<{ scope: DataScope; departmentId: string | null }> {
    const roles = await this.getUserRoles(userId, tenantId);
    if (roles.some((r) => ['owner', 'admin', 'super_admin'].includes(r.code)))
      return { scope: 'ORGANIZATION', departmentId: null };
    const perms = await this.getUserPermissions(userId, tenantId);
    const scope = (perms.find((p) => p.code === permissionCode)?.scope ?? 'OWN') as DataScope;
    const dept = await this.db.query<{ department_id: string }>(
      'SELECT department_id FROM user_roles WHERE user_id = $1 AND tenant_id = $2 AND department_id IS NOT NULL LIMIT 1',
      [userId, tenantId],
    );
    return { scope, departmentId: dept.rows[0]?.department_id ?? null };
  }
}

/** Parameterised WHERE-fragment builder for data scoping (ORGANIZATION: none, DEPARTMENT: dept column, TEAM/OWN: owner column). */
export function applyScope(
  ctx: { scope: DataScope; userId: string; departmentId: string | null },
  cols: { owner?: string; department?: string },
  startIndex = 1,
): { clause: string; params: unknown[] } {
  const ident = /^[a-z_][a-z0-9_.]*$/i;
  for (const c of Object.values(cols))
    if (c !== undefined && !ident.test(c)) throw new Error(`Unsafe column name: ${c}`);
  if (ctx.scope === 'ORGANIZATION') return { clause: '', params: [] };
  if (ctx.scope === 'DEPARTMENT' && cols.department && ctx.departmentId) {
    return { clause: `${cols.department} = $${startIndex}`, params: [ctx.departmentId] };
  }
  if (cols.owner) return { clause: `${cols.owner} = $${startIndex}`, params: [ctx.userId] };
  return { clause: '', params: [] };
}
