import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AlreadyInstalledError, DatabaseUnavailableError } from '../common/errors';
import { APP_CONFIG, AppConfig } from '../config/env';
import { DatabaseService, isUniqueViolation, Queryable } from '../db/database.service';
import { Migrator } from '../db/migrator';
import { RbacService } from '../rbac/rbac.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { TenantRead, toTenantRead } from '../tenancy/tenant.types';
import { UserRead } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { InstallStateService } from './install-state.service';
import { DEFAULT_PERMISSIONS, ROLE_DEFINITIONS } from './seed-data';
import { SetupRequest } from './setup.dto';

export interface SetupResult {
  tenant: TenantRead;
  admin: UserRead;
  installed_at: string;
}

const ADVISORY_LOCK = 7_201_127;

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);
  readonly migrator: Migrator;

  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly db: DatabaseService,
    private readonly state: InstallStateService,
    private readonly users: UsersService,
    private readonly tenancy: TenancyService,
    private readonly rbac: RbacService,
  ) {
    this.migrator = new Migrator(db);
  }

  private async requireDatabase(): Promise<void> {
    if ((await this.db.ping(3000)).status !== 'HEALTHY') throw new DatabaseUnavailableError();
  }

  async checks(): Promise<{ database_connected: boolean; migrations_pending: number }> {
    await this.requireDatabase();
    return { database_connected: true, migrations_pending: await this.migrator.pending() };
  }

  async install(data: SetupRequest): Promise<SetupResult> {
    await this.requireDatabase();
    if (await this.state.installationExists()) throw new AlreadyInstalledError();

    this.logger.log('Running first-run setup: applying migrations');
    await this.migrator.run();

    let result: SetupResult;
    try {
      result = await this.db.tx(async (tx) => {
        await tx.query('SELECT pg_advisory_xact_lock($1)', [ADVISORY_LOCK]);
        const done = await tx.query<{ ok: boolean }>(
          'SELECT EXISTS (SELECT 1 FROM installation WHERE singleton IS TRUE) AS ok',
        );
        if (done.rows[0].ok) throw new AlreadyInstalledError();

        const tenant = await this.tenancy.create(data.organization, null, tx);
        const admin = await this.users.createUser(tx, data.admin, true);
        await tx.query(
          `INSERT INTO tenant_members (id, tenant_id, user_id, status, joined_at) VALUES ($1,$2,$3,'active', now())`,
          [randomUUID(), tenant.id, admin.id],
        );

        const roles = await this.seedPermissionsAndRoles(tx);
        if (roles.super_admin)
          await this.rbac.assignRoleToUser(tx, {
            userId: admin.id,
            roleId: roles.super_admin,
            tenantId: null,
            assignedBy: admin.id,
          });
        if (roles.owner)
          await this.rbac.assignRoleToUser(tx, {
            userId: admin.id,
            roleId: roles.owner,
            tenantId: tenant.id,
            assignedBy: admin.id,
          });

        await this.seedTenantSettings(tx, tenant.id, tenant.name, data.branding ?? null, {
          timezone: tenant.timezone || 'UTC',
          language: tenant.language || 'en-US',
          date_format: tenant.date_format || 'YYYY-MM-DD',
        });

        const inst = await tx.query<{ created_at: Date }>(
          `INSERT INTO installation (id, singleton, app_version, default_tenant_id, created_by, updated_by)
           VALUES ($1, true, $2, $3, $4, $4) RETURNING created_at`,
          [randomUUID(), this.cfg.appVersion.slice(0, 50), tenant.id, admin.id],
        );
        return {
          tenant: toTenantRead(tenant),
          admin: this.users.toUserRead(admin),
          installed_at: inst.rows[0].created_at.toISOString(),
        };
      });
    } catch (err) {
      if (isUniqueViolation(err, 'uq_installation_singleton')) throw new AlreadyInstalledError();
      throw err;
    }
    this.state.markInstalled();
    this.logger.log(`First-run setup completed for tenant '${result.tenant.slug}'`);
    return result;
  }

  /** Ported from seed_default_permissions_and_roles; returns role ids by code. */
  private async seedPermissionsAndRoles(tx: Queryable): Promise<Record<string, string>> {
    const permIds = new Map<string, string>();
    for (const [code, module, description, resource, action, defaultScope] of DEFAULT_PERMISSIONS) {
      const name = code.split('.').pop() as string;
      permIds.set(
        code,
        await this.rbac.getOrCreatePermission(tx, {
          code,
          module,
          name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
          description,
          resource,
          action,
          defaultScope,
        }),
      );
    }
    const roleIds: Record<string, string> = {};
    for (const r of ROLE_DEFINITIONS) {
      const roleId = await this.rbac.getOrCreateRole(tx, {
        code: r.code,
        name: r.name,
        tenantId: null,
        isSystem: true,
        hierarchyLevel: r.level,
        description: r.description,
        moduleCode: r.moduleCode,
        canDelegate: r.canDelegate,
        maxDelegatableLevel: r.maxDelegatableLevel,
      });
      roleIds[r.code] = roleId;
      const granted = r.granted === 'ALL' ? [...permIds.keys()] : r.granted;
      for (const code of granted) {
        const pid = permIds.get(code);
        if (pid) await this.rbac.assignPermissionToRole(tx, roleId, pid);
      }
    }
    return roleIds;
  }

  private async seedTenantSettings(
    tx: Queryable,
    tenantId: string,
    organizationName: string,
    branding: { theme?: string; primary_color?: string; logo_url?: string | null } | null,
    loc: { timezone: string; language: string; date_format: string },
  ): Promise<void> {
    const namespaces: [string, Record<string, unknown>][] = [
      [
        'branding',
        {
          theme: branding?.theme ?? 'system',
          primary_color: branding?.primary_color ?? '#2563EB',
          accent_color: '#4F46E5',
          company_display_name: organizationName,
          logo_url: branding?.logo_url ?? null,
          favicon_url: null,
        },
      ],
      ['auth', { mfa_enforced: false, session_idle_timeout_minutes: 60, max_login_attempts: 5 }],
      ['localization', { ...loc, time_format: '24h', currency: 'USD' }],
    ];
    for (const [namespace, config] of namespaces) {
      await tx.query(
        `INSERT INTO tenant_settings (id, tenant_id, namespace, config, version) VALUES ($1,$2,$3,$4::jsonb,1)
         ON CONFLICT ON CONSTRAINT uq_tenant_settings_tenant_namespace DO UPDATE SET config = EXCLUDED.config, updated_at = now()`,
        [randomUUID(), tenantId, namespace, JSON.stringify(config)],
      );
    }
  }
}
