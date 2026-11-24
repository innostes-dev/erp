import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import { buildOpenApiDocument } from '../bootstrap';
import { APP_CONFIG, AppConfig } from '../config/env';

/** Writes openapi.json (no database connection is needed to build the document). */
async function main(): Promise<void> {
  process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'silent';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: false });
  await app.init();
  const doc = buildOpenApiDocument(app, app.get<AppConfig>(APP_CONFIG));
  const out = resolve(process.argv[2] ?? 'openapi.json');
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`OpenAPI written to ${out}`);
  await app.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
