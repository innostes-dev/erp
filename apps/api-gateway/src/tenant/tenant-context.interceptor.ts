import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const url = request.originalUrl || request.url || request.raw?.url || '';
    
    // Skip tenant check for setup and status endpoints
    if (url.includes('setup')) {
      return next.handle();
    }

    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new UnauthorizedException('x-tenant-id is required');
    }

    this.tenantContext.setTenantId(tenantId);
    return next.handle();
  }
}
