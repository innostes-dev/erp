import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuditEvent, AuditService } from '../audit/audit.service';
import { AuthContext, AuthGuard, CurrentAuth } from '../auth/auth.guard';
import { ErrorCode, ForbiddenError, TenantNotFoundError } from '../common/errors';
import { clientIp, correlationId, userAgent } from '../common/http';
import {
  RequestValidationException,
  UuidParamPipe,
  parseBoolQuery,
  parseIntQuery,
  parseOptionalUuidHeader,
} from '../common/validation';
import { RbacService } from '../rbac/rbac.service';
import { UsersService } from '../users/users.service';
import { TenantCreate, TenantUpdate } from './tenancy.dto';
import { ActivationKind, TenancyService } from './tenancy.service';
import { toTenantRead } from './tenant.types';

function itemId(raw: string, name: string): string {
  if (raw.length < 1 || raw.length > 64) {
    throw new RequestValidationException([
      { loc: ['path', name], msg: 'String should have at most 64 characters', type: 'string_too_long' },
    ]);
  }
  return raw;
}

@ApiTags('Tenancy')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller('tenants')
export class TenancyController {
  constructor(
    private readonly tenancy: TenancyService,
    private readonly users: UsersService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
  ) {}

  private requestMeta(req: Request): Pick<AuditEvent, 'ipAddress' | 'userAgent' | 'correlationId'> {
    return { ipAddress: clientIp(req), userAgent: userAgent(req), correlationId: correlationId(req) };
  }

  /**
   * API keys are bound to their tenant; otherwise X-Tenant-ID or the first active membership. Non-super-admins can only
   * act on tenants they are an active member of (tenant isolation).
   */
  private async currentTenantId(auth: AuthContext, req: Request): Promise<string> {
    if (auth.apiKey) {
      const tenantId = auth.apiKey.tenant_id;
      if (!auth.user.is_super_admin && !(await this.tenancy.isActiveMember(auth.user.id, tenantId)))
        throw new ForbiddenError('You are not a member of this tenant.', ErrorCode.PERMISSION_DENIED);
      return tenantId;
    }
    return this.tenancy.resolveTenantForUser(
      auth.user,
      parseOptionalUuidHeader(req.headers['x-tenant-id'], 'X-Tenant-ID'),
    );
  }

  /**
   * Access to a specific tenant by id. Super-admins: always. Others must be an active member (otherwise the tenant is
   * reported as not found, so ids cannot be probed) and, for mutations, hold the RBAC permission in that tenant.
   */
  private async authorizeTenant(auth: AuthContext, tenantId: string, permission?: string): Promise<void> {
    if (auth.user.is_super_admin) return;
    if (!(await this.tenancy.isActiveMember(auth.user.id, tenantId))) throw new TenantNotFoundError();
    if (permission && !(await this.rbac.hasPermission(auth.user, permission, tenantId)))
      throw new ForbiddenError(`Permission '${permission}' required.`, ErrorCode.PERMISSION_DENIED);
  }

  // ------------------------------------------------------------ collection

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a tenant', operationId: 'tenants_create' })
  async create(@Body() body: TenantCreate, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    if (!auth.user.is_super_admin)
      throw new ForbiddenError('Super administrator privilege required.', ErrorCode.PERMISSION_DENIED);
    const tenant = await this.tenancy.create(body, auth.user.id);
    await this.audit.safeRecord({
      action: 'CREATE',
      entityType: 'tenant',
      entityId: tenant.id,
      entityName: tenant.name,
      changes: { name: { old: null, new: tenant.name }, slug: { old: null, new: tenant.slug } },
      tenantId: tenant.id,
      actorId: auth.user.id,
      reason: `Created tenant organisation '${tenant.name}'`,
      ...this.requestMeta(req),
    });
    return toTenantRead(tenant);
  }

  @Get()
  @ApiOperation({ summary: 'List tenants', operationId: 'tenants_list' })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'include_deleted', required: false, type: Boolean })
  async list(@Query() q: Record<string, unknown>, @CurrentAuth() auth: AuthContext) {
    const offset = parseIntQuery(q.offset, 'offset', { def: 0, min: 0, max: 2_147_483_647 });
    const limit = parseIntQuery(q.limit, 'limit', { def: 50, min: 1, max: 200 });
    const includeDeleted = parseBoolQuery(q.include_deleted, 'include_deleted', false);
    // Non-super-admins only ever see the (non-deleted) tenants they belong to.
    const admin = auth.user.is_super_admin;
    const page = await this.tenancy.list(offset, limit, admin && includeDeleted, admin ? undefined : auth.user.id);
    return { ...page, items: page.items.map(toTenantRead) };
  }

  // --------------------------------------------------------------- current

  @Get('current')
  @ApiHeader({ name: 'X-Tenant-ID', required: false })
  @ApiOperation({ summary: 'Get current tenant organisation details', operationId: 'tenants_get_current' })
  async current(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return toTenantRead(await this.tenancy.getOrThrow(await this.currentTenantId(auth, req)));
  }

  @Get('current/modules')
  @ApiHeader({ name: 'X-Tenant-ID', required: false })
  @ApiOperation({ summary: 'List business modules for current tenant', operationId: 'tenants_list_modules' })
  async listModules(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.tenancy.listCatalog('module', await this.currentTenantId(auth, req));
  }

  @Post('current/modules/:module_id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate a business module for tenant', operationId: 'tenants_activate_module' })
  activateModule(@Param('module_id') id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.toggle('module', itemId(id, 'module_id'), true, auth, req);
  }

  @Post('current/modules/:module_id/deactivate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Deactivate a business module for tenant', operationId: 'tenants_deactivate_module' })
  deactivateModule(@Param('module_id') id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.toggle('module', itemId(id, 'module_id'), false, auth, req);
  }

  @Get('current/plugins')
  @ApiHeader({ name: 'X-Tenant-ID', required: false })
  @ApiOperation({ summary: 'List extensible plugins for current tenant', operationId: 'tenants_list_plugins' })
  async listPlugins(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.tenancy.listCatalog('plugin', await this.currentTenantId(auth, req));
  }

  @Post('current/plugins/:plugin_id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate an extensible plugin for tenant', operationId: 'tenants_activate_plugin' })
  activatePlugin(@Param('plugin_id') id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.toggle('plugin', itemId(id, 'plugin_id'), true, auth, req);
  }

  @Post('current/plugins/:plugin_id/deactivate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Deactivate an extensible plugin for tenant', operationId: 'tenants_deactivate_plugin' })
  deactivatePlugin(@Param('plugin_id') id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.toggle('plugin', itemId(id, 'plugin_id'), false, auth, req);
  }

  private async toggle(kind: ActivationKind, id: string, active: boolean, auth: AuthContext, req: Request) {
    if (!auth.user.is_super_admin)
      throw new ForbiddenError('Super administrator privilege required.', ErrorCode.PERMISSION_DENIED);
    const tenantId = await this.currentTenantId(auth, req);
    const result = await this.tenancy.setActivation(kind, tenantId, id, active, auth.user.id);
    const label = kind === 'module' ? 'module' : 'plugin';
    await this.audit.safeRecord({
      action: 'RBAC_CHANGE',
      entityType: `tenant_${label}`,
      entityId: id,
      entityName: `${kind === 'module' ? 'Module' : 'Plugin'} ${id}`,
      changes: { is_active: { old: !active, new: active } },
      tenantId,
      actorId: auth.user.id,
      actorName: this.users.displayName(auth.user) || null,
      reason: `${active ? 'Activated' : 'Deactivated'} ${label} '${id}'`,
      ...this.requestMeta(req),
    });
    return result;
  }

  // ------------------------------------------------------------- one tenant

  @Get(':tenant_id')
  @ApiOperation({ summary: 'Get a tenant', operationId: 'tenants_get' })
  async get(@Param('tenant_id', UuidParamPipe) id: string, @CurrentAuth() auth: AuthContext) {
    await this.authorizeTenant(auth, id);
    return toTenantRead(await this.tenancy.getOrThrow(id));
  }

  @Patch(':tenant_id')
  @ApiOperation({ summary: 'Update a tenant', operationId: 'tenants_update' })
  async update(
    @Param('tenant_id', UuidParamPipe) id: string,
    @Body() body: TenantUpdate,
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
  ) {
    await this.authorizeTenant(auth, id, 'tenancy.tenant.update');
    const tenant = await this.tenancy.getOrThrow(id);
    const updated = await this.tenancy.update(tenant, body, auth.user.id);
    const state = (t: typeof tenant): Record<string, unknown> => ({
      name: t.name,
      slug: t.slug,
      country: t.country,
      timezone: t.timezone,
    });
    await this.audit.safeRecord({
      action: 'UPDATE',
      entityType: 'tenant',
      entityId: updated.id,
      entityName: updated.name,
      oldState: state(tenant),
      newState: state(updated),
      tenantId: updated.id,
      actorId: auth.user.id,
      reason: `Updated tenant organisation '${updated.name}'`,
      ...this.requestMeta(req),
    });
    return toTenantRead(updated);
  }

  @Delete(':tenant_id')
  @ApiOperation({ summary: 'Delete a tenant', operationId: 'tenants_delete' })
  async remove(@Param('tenant_id', UuidParamPipe) id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    await this.authorizeTenant(auth, id, 'tenancy.tenant.delete');
    const deleted = await this.tenancy.softDelete(await this.tenancy.getOrThrow(id), auth.user.id);
    await this.audit.safeRecord({
      action: 'DELETE',
      entityType: 'tenant',
      entityId: deleted.id,
      entityName: deleted.name,
      changes: { deleted: { old: false, new: true } },
      tenantId: deleted.id,
      actorId: auth.user.id,
      reason: `Soft-deleted tenant organisation '${deleted.name}'`,
      ...this.requestMeta(req),
    });
    return toTenantRead(deleted);
  }

  @Post(':tenant_id/restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore a deleted tenant', operationId: 'tenants_restore' })
  async restore(@Param('tenant_id', UuidParamPipe) id: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    await this.authorizeTenant(auth, id, 'tenancy.tenant.delete');
    const restored = await this.tenancy.restore(await this.tenancy.getOrThrow(id, true), auth.user.id);
    await this.audit.safeRecord({
      action: 'RESTORE',
      entityType: 'tenant',
      entityId: restored.id,
      entityName: restored.name,
      changes: { deleted: { old: true, new: false } },
      tenantId: restored.id,
      actorId: auth.user.id,
      reason: `Restored tenant organisation '${restored.name}'`,
      ...this.requestMeta(req),
    });
    return toTenantRead(restored);
  }
}
