import { Controller, Get, Headers, Inject, NotFoundException, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { UnauthorizedError } from '../common/errors';
import { safeEqual } from '../crypto/cipher';
import { APP_CONFIG, AppConfig } from '../config/env';
import { DatabaseService } from '../db/database.service';
import { MetricsService } from './metrics.service';

const MODULES = ['auth', 'setup', 'tenancy', 'user', 'audit'];

@ApiTags('General')
@Controller()
export class GeneralController {
  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  @Get()
  @ApiOperation({ summary: 'Service information', operationId: 'system_root' })
  root() {
    return { service: this.cfg.appName, environment: this.cfg.appEnv, status: 'online', modules: MODULES };
  }

  @Get('config')
  @ApiOperation({ summary: 'Application configuration', operationId: 'system_config' })
  config() {
    return { service: this.cfg.appName, version: this.cfg.appVersion, environment: this.cfg.appEnv };
  }
}

@ApiTags('Observability')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly db: DatabaseService,
  ) {}

  /** Readiness/liveness probe: 200 `pass` when the database answers, otherwise 503 `fail`. */
  @Get()
  @ApiOperation({ summary: 'System health check', operationId: 'system_health' })
  async health(@Res({ passthrough: true }) res: Response) {
    const database = await this.db.ping(3000);
    const healthy = database.status === 'HEALTHY';
    if (!healthy) res.status(503);
    const modules = Object.fromEntries(MODULES.map((m) => [m, { status: healthy ? 'HEALTHY' : 'UNHEALTHY' }]));
    return { status: healthy ? 'pass' : 'fail', environment: this.cfg.appEnv, database, modules };
  }
}

/** Prometheus text exposition; disabled unless METRICS_ENABLED=true, optionally protected by METRICS_TOKEN. */
@ApiExcludeController()
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  prometheus(
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): string {
    if (!this.cfg.metricsEnabled) throw new NotFoundException('Not Found');
    if (this.cfg.metricsToken) {
      const presented = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!presented || !safeEqual(presented, this.cfg.metricsToken))
        throw new UnauthorizedError('Metrics token required.');
    }
    res.type('text/plain; version=0.0.4');
    return this.metrics.render();
  }
}
