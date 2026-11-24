import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { APP_CONFIG, AppConfig } from './config/env';
import { MetricsService } from './system/metrics.service';

const API_DESCRIPTION =
  'Innostes ERP platform kernel API (NestJS implementation). Behaviourally identical to the FastAPI reference: ' +
  'authentication, first-run setup, tenancy and user management.';

export function buildOpenApiDocument(app: NestExpressApplication, cfg: AppConfig): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(cfg.appName)
    .setDescription(API_DESCRIPTION)
    .setVersion(cfg.appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer access token or personal access token (inno_live_...).',
      },
      'BearerAuth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Setup-Token',
        in: 'header',
        description: 'One-time system installation token (SETUP_TOKEN).',
      },
      'SetupToken',
    )
    .addTag('General', 'Service identity, runtime metadata, and public configuration.')
    .addTag('Observability', 'Health probes and diagnostics.')
    .addTag('Authentication')
    .addTag('Setup')
    .addTag('Tenancy')
    .addTag('User management')
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Wires everything that is not module-scoped; shared by `main.ts` and the e2e tests. */
export function configureApp(app: NestExpressApplication, opts: { docs?: boolean } = {}): AppConfig {
  const cfg = app.get<AppConfig>(APP_CONFIG);
  app.useLogger(app.get(Logger));
  app.set('trust proxy', cfg.trustProxy);
  app.set('etag', false);
  app.disable('x-powered-by');

  app.use(
    helmet({
      hsts: cfg.isProduction,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'upgrade-insecure-requests': cfg.isProduction ? [] : null },
      },
    }),
  );
  // JSON body parsing is registered here (Nest's default parser is disabled) so malformed JSON becomes a 422.
  app.useBodyParser('json', { limit: '1mb' });
  app.use((err: { type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(422).json({ detail: [{ loc: ['body'], msg: 'JSON decode error', type: 'json_invalid' }] });
    } else if (err?.type === 'entity.too.large') {
      res.status(413).json({ detail: 'Request entity too large' });
    } else {
      next(err);
    }
  });
  app.use(cookieParser());
  app.enableCors({
    origin: cfg.corsOrigins,
    credentials: true,
    exposedHeaders: ['Retry-After', 'ETag', 'X-Correlation-ID'],
  });

  const metrics = app.get(MetricsService);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => metrics.observe(req.method, res.statusCode, Number(process.hrtime.bigint() - start) / 1e9));
    next();
  });

  if (opts.docs !== false) {
    SwaggerModule.setup('docs', app, buildOpenApiDocument(app, cfg), { jsonDocumentUrl: 'openapi.json' });
  }
  return cfg;
}
