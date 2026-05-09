/**
 * libs/core/auth/src/guards/role.guard.ts
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { tenant } = context.switchToHttp().getRequest();

    if (!tenant || !requiredRoles.includes(tenant.role)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_ROLE' });
    }

    return true;
  }
}
