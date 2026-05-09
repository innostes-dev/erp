/**
 * apps/api-gateway/src/auth/guards/role.guard.ts
 * Enforces Role-Based Access Control.
 */
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantContext } from '@innostes/shared';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenant: TenantContext = request['tenant'];

    if (!tenant || !requiredRoles.includes(tenant.role)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE' });
    }

    return true;
  }
}
