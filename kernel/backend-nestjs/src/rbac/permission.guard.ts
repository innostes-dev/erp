import { CanActivate, ExecutionContext, Injectable, SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ErrorCode, ForbiddenError, InvalidTokenError } from '../common/errors';
import { isUuid } from '../common/validation';
import { TenancyService } from '../tenancy/tenancy.service';
import { RbacService } from './rbac.service';

export const PERMISSION_KEY = 'required_permission';

/** Authenticated route that additionally requires an atomic RBAC permission (e.g. `user.users.create`). */
export const RequirePermission = (code: string): MethodDecorator & ClassDecorator =>
  applyDecorators(SetMetadata(PERMISSION_KEY, code), UseGuards(AuthGuard, PermissionGuard));

/** Super-admins bypass; API keys need a matching scope (`*` or the code); others are resolved via roles. */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
    private readonly tenancy: TenancyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const code = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!code) return true;
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.auth) throw new InvalidTokenError('Authentication token or API key required.');

    if (req.auth.apiKey) {
      const scopes = req.auth.apiKey.scopes ?? [];
      if (!scopes.includes('*') && !scopes.includes(code))
        throw new ForbiddenError(`API key does not have required scope '${code}'.`, ErrorCode.PERMISSION_DENIED);
      return true;
    }

    const header = req.headers['x-tenant-id'];
    const raw = Array.isArray(header) ? header[0] : header;
    let tenantId: string | null = raw && isUuid(raw) ? raw.toLowerCase() : null;
    if (!tenantId && !req.auth.user.is_super_admin) {
      tenantId = await this.tenancy.resolveCurrentTenantId(req.auth.user.id).catch(() => null);
    }
    if (!(await this.rbac.hasPermission(req.auth.user, code, tenantId))) {
      throw new ForbiddenError(`Permission '${code}' required.`, ErrorCode.PERMISSION_DENIED);
    }
    return true;
  }
}
