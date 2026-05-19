/**
 * libs/core/logger/src/lib/api-logger.middleware.ts
 *
 * Fastify-compatible middleware that delegates HTTP request logging to
 * NestLoggerMiddleware from @innostes/logger.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ApiLoggerService } from './api-logger.service';
import { NestLoggerMiddleware } from '@innostes/logger';

@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  private readonly delegate: NestLoggerMiddleware;

  constructor(private readonly logger: ApiLoggerService) {
    const mockNestLoggerService = {
      writeLog: (data: any) => this.logger.log(data)
    } as any;
    
    this.delegate = new NestLoggerMiddleware(mockNestLoggerService);
  }

  use(req: any, res: any, next: () => void): void {
    this.delegate.use(req, res, next);
  }
}
