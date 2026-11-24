import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { AuthContext, AuthGuard, CurrentAuth, CurrentUser } from '../auth/auth.guard';
import { ErrorCode, ForbiddenError, UserNotFoundError } from '../common/errors';
import { clientIp, correlationId, userAgent } from '../common/http';
import { UuidParamPipe, parseOptionalUuidHeader } from '../common/validation';
import { DatabaseService } from '../db/database.service';
import { RbacService } from '../rbac/rbac.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { UserRow } from './user.types';
import { UserCreate } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('User management')
@ApiBearerAuth('BearerAuth')
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
    private readonly tenancy: TenancyService,
  ) {}

  /** Tenant for an RBAC decision: X-Tenant-ID (must be a membership) or the caller's first membership. */
  private tenantFor(actor: UserRow, req: Request): Promise<string> {
    return this.tenancy.resolveTenantForUser(actor, parseOptionalUuidHeader(req.headers['x-tenant-id'], 'X-Tenant-ID'));
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a user', operationId: 'users_create_user' })
  async create(@Body() body: UserCreate, @CurrentUser() actor: UserRow, @Req() req: Request) {
    if (!actor.is_super_admin) {
      // Tenant administrators holding user.users.create may register accounts; ordinary members may not.
      const tenantId = await this.tenantFor(actor, req).catch(() => null);
      if (!tenantId || !(await this.rbac.hasPermission(actor, 'user.users.create', tenantId)))
        throw new ForbiddenError("Permission 'user.users.create' required.", ErrorCode.PERMISSION_DENIED);
    }
    const user = await this.db.tx((tx) => this.users.createUser(tx, body, false));
    const actorName = this.users.displayName(actor);
    await this.audit.safeRecord({
      action: 'CREATE',
      entityType: 'user',
      entityId: user.id,
      entityName: this.users.displayName(user) || body.email,
      changes: {
        first_name: { old: null, new: user.first_name },
        last_name: { old: null, new: user.last_name },
        email: { old: null, new: body.email },
      },
      actorId: actor.id,
      actorName: actorName || null,
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
      correlationId: correlationId(req),
      reason: `Registered user account '${body.email}'`,
    });
    return this.users.toUserRead(user);
  }

  /** Self, super-admin, or a holder of user.users.read in a tenant where the target is also an active member. */
  private async authorizeRead(actor: UserRow, targetId: string, req: Request): Promise<void> {
    if (actor.is_super_admin || actor.id === targetId) return;
    const denied = new UserNotFoundError(targetId); // hide existence: same answer as a missing user
    const tenantId = await this.tenantFor(actor, req).catch(() => null);
    if (!tenantId) throw denied;
    if (!(await this.rbac.hasPermission(actor, 'user.users.read', tenantId))) throw denied;
    if (!(await this.tenancy.isActiveMember(targetId, tenantId))) throw denied;
  }

  @Get(':user_id')
  @ApiOperation({ summary: 'Get user by ID', operationId: 'users_get_user' })
  async get(@Param('user_id', UuidParamPipe) userId: string, @CurrentAuth() auth: AuthContext, @Req() req: Request) {
    await this.authorizeRead(auth.user, userId, req);
    return this.users.toUserRead(await this.users.getByIdOrThrow(userId));
  }
}
