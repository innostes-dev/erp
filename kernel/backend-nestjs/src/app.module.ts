import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { LoggerModule } from 'nestjs-pino';
import { AuthController } from './auth/auth.controller';
import { AllExceptionsFilter } from './common/exception.filter';
import { RATE_TTL_MS, configureRateLimits, rateLimits } from './common/rate-limits';
import { createValidationPipe } from './common/validation';
import { APP_CONFIG, AppConfig } from './config/env';
import { CoreModule } from './core.module';
import { SetupBootstrap } from './setup/setup.bootstrap';
import { SetupController } from './setup/setup.controller';
import { SetupRequiredGuard } from './setup/setup-required.guard';
import { GeneralController, HealthController, MetricsController } from './system/system.controller';
import { TenancyController } from './tenancy/tenancy.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    CoreModule,
    LoggerModule.forRootAsync({
      imports: [CoreModule],
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => ({
        pinoHttp: {
          level: cfg.logLevel,
          genReqId: (req, res) => {
            const h = req.headers['x-correlation-id'];
            const incoming = Array.isArray(h) ? h[0] : h;
            const id = incoming && /^[\w.:-]{1,128}$/.test(incoming) ? incoming : randomUUID();
            res.setHeader('X-Correlation-ID', id);
            return id;
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-setup-token"]',
              'res.headers["set-cookie"]',
            ],
            censor: '[redacted]',
          },
          serializers: {
            req: (req: { id: string; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url.split('?')[0],
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          customLogLevel: (_req, res, err) =>
            err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
          autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/metrics' },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [CoreModule],
      inject: [APP_CONFIG],
      useFactory: (cfg: AppConfig) => {
        configureRateLimits(cfg.rateLimit);
        return { throttlers: [{ ttl: RATE_TTL_MS, limit: () => rateLimits.global }] };
      },
    }),
  ],
  controllers: [
    GeneralController,
    HealthController,
    MetricsController,
    SetupController,
    AuthController,
    UsersController,
    TenancyController,
  ],
  providers: [
    SetupBootstrap,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useFactory: () => createValidationPipe() },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SetupRequiredGuard },
  ],
})
export class AppModule {}
