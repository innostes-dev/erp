/**
 * libs/core/logger/src/lib/api-logger.service.ts
 *
 * Orchestrator — fans out to all registered transports.
 * Delegates log handling to NestLoggerService from @innostes/logger.
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestLoggerService } from '@innostes/logger';
import { IApiLogData, ILogTransport, LOG_TRANSPORTS } from './logger.interface';

@Injectable()
export class ApiLoggerService {
  private readonly delegate: NestLoggerService;

  constructor(
    private readonly config: ConfigService,
    /** Array of transports — empty array is valid (no-op logger) */
    @Optional()
    @Inject(LOG_TRANSPORTS)
    private readonly transports: ILogTransport[] = []
  ) {
    this.delegate = new NestLoggerService(this.config, this.transports);
  }

  /**
   * Primary log method — called by the middleware and anywhere in the app.
   * Merges configurations and forwards to NestLoggerService.
   */
  async log(data: Partial<IApiLogData>): Promise<void> {
    const msg = data.message ?? 'Log event';
    this.delegate.writeLog({
      ...data,
      message: msg,
    });
  }

  /** Convenience helpers */
  info(data: Partial<IApiLogData>): void {
    this.log({ ...data, level: 'info' });
  }

  warn(data: Partial<IApiLogData>): void {
    this.log({ ...data, level: 'warn' });
  }

  error(data: Partial<IApiLogData>): void {
    this.log({ ...data, level: 'error' });
  }
}
