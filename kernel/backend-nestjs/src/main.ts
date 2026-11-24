import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { ConfigError, loadConfig } from './config/env';
import { DatabaseService } from './db/database.service';
import { Migrator } from './db/migrator';

async function bootstrap(): Promise<void> {
  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, bodyParser: false });
  configureApp(app);
  const logger = app.get(Logger);
  if (cfg.trustProxy === true && !cfg.isDevLike)
    logger.warn(
      'TRUST_PROXY=true trusts every X-Forwarded-For hop: clients can spoof their IP and evade rate limits. Use a hop count or subnet list.',
    );

  const migrator = new Migrator(app.get(DatabaseService));
  if (cfg.autoMigrate) {
    const applied = await migrator.run();
    logger.log(applied ? 'Database migrations applied' : 'Database schema up to date; nothing to migrate');
  } else if (await migrator.schemaExists().catch(() => false)) {
    // Idempotent compatibility fix for databases created by another backend (key_prefix VARCHAR(16) -> 32).
    await migrator
      .widenKeyPrefix()
      .catch((err: unknown) => logger.warn({ err }, 'Could not widen api_keys.key_prefix'));
    // Same for identities + credentials (0003): login reads them, so create + backfill them if another backend
    // created the database before they existed. Only when missing, so normal boots skip the backfill scan.
    if (await migrator.identitiesMissing().catch(() => false)) {
      await migrator
        .applyIdentitiesCredentials()
        .catch((err: unknown) => logger.warn({ err }, 'Could not apply identities + credentials (0003)'));
    }
  }

  await app.listen(cfg.port, cfg.host);
  logger.log(`${cfg.appName} v${cfg.appVersion} listening on http://${cfg.host}:${cfg.port} (${cfg.appEnv})`);

  // Graceful shutdown: stop accepting connections, drain in-flight requests, close the DB pool.
  let closing = false;
  const shutdown = (signal: string): void => {
    if (closing) return;
    closing = true;
    logger.log(`${signal} received; shutting down`);
    const force = setTimeout(() => {
      logger.error('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, cfg.shutdownTimeoutMs);
    force.unref();
    app.getHttpServer().closeIdleConnections?.();
    app
      .close()
      .then(() => process.exit(0))
      .catch((err: unknown) => {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      });
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
