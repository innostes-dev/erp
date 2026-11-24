import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { Client } from 'pg';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

export const E2E_DB = 'erp_nest_e2e';
const ADMIN_URL = process.env.E2E_ADMIN_DATABASE_URL ?? 'postgresql://postgres:admin@localhost:5432/postgres';
export const E2E_DATABASE_URL = process.env.TEST_DATABASE_URL ?? ADMIN_URL.replace(/\/[^/]*$/, `/${E2E_DB}`);

/** Drop and recreate the dedicated e2e database (never touches any other database). */
export async function resetE2eDatabase(): Promise<void> {
  const c = new Client({ connectionString: ADMIN_URL });
  await c.connect();
  try {
    await c.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [E2E_DB],
    );
    await c.query(`DROP DATABASE IF EXISTS ${E2E_DB}`);
    await c.query(`CREATE DATABASE ${E2E_DB}`);
  } finally {
    await c.end();
  }
}

export async function createApp(
  customise?: (b: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<NestExpressApplication> {
  process.env.DATABASE_URL = E2E_DATABASE_URL;
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (customise) builder = customise(builder);
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  configureApp(app);
  await app.init();
  return app;
}

export const server = (app: INestApplication): ReturnType<INestApplication['getHttpServer']> => app.getHttpServer();
