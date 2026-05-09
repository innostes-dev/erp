/**
 * libs/core/auth/src/interceptors/tenant.interceptor.ts
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '@innostes/core/database';
import { users, roles } from '@innostes/core/database';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private dbService: DatabaseService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException({ code: 'TENANT_ID_MISSING' });
    }

    if (!request.user) {
      throw new ForbiddenException({ code: 'AUTH_CONTEXT_MISSING' });
    }

    const userId = request.user.userId;

    // Single query: users LEFT JOIN roles
    const result = await this.dbService.db
      .select({
        tenantId: users.tenantId,
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (!result.length) {
      throw new ForbiddenException({ code: 'NOT_A_MEMBER' });
    }

    const membership = result[0];

    if (!membership.roleName) {
      throw new ForbiddenException({ code: 'NO_ACTIVE_ROLE' });
    }

    request.tenant = {
      tenantId: membership.tenantId,
      role: membership.roleName,
      permissions: (membership.permissions ?? []) as string[],
    };

    return next.handle();
  }
}
