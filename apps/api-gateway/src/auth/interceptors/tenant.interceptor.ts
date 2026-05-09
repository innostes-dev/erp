/**
 * apps/api-gateway/src/auth/interceptors/tenant.interceptor.ts
 * Verifies tenant membership and attaches context.
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { db, users, roles } from '@innostes/core/database';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    const user = request['user'];

    if (!tenantId) {
      throw new ForbiddenException({ code: 'TENANT_ID_MISSING' });
    }

    if (!user) {
      // Should be caught by AuthGuard, but safety first
      throw new ForbiddenException({ code: 'AUTHENTICATION_REQUIRED' });
    }

    const result = await db
      .select({
        tenantId: users.tenantId,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, user.userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!result.length) {
      throw new ForbiddenException({ code: 'NOT_A_MEMBER' });
    }

    const membership = result[0];

    if (!membership.roleName) {
      throw new ForbiddenException({ code: 'NO_ACTIVE_ROLE' });
    }

    request['tenant'] = {
      tenantId: membership.tenantId,
      role: membership.roleName,
      permissions: (membership.permissions ?? []) as string[],
    };

    return next.handle();
  }
}
