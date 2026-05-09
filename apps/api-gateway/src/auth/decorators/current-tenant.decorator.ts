/**
 * apps/api-gateway/src/auth/decorators/current-tenant.decorator.ts
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '@innostes/shared';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
