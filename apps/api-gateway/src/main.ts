/**
 * apps/api-gateway/src/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1_048_576 }) // 1 MB limit
  );

  const config = app.get(ConfigService);

  // 1. Security headers — register FIRST
  await app.register(helmet, { contentSecurityPolicy: false });

  // 2. JWT secret assertion
  const jwtSecret = config.get<string>('JWT_SECRET', '');
  if (jwtSecret.length < 64) {
    new Logger('Bootstrap').error(
      'FATAL: JWT_SECRET must be >= 64 characters. Refusing to start.'
    );
    process.exit(1);
  }

  // 3. Cookie support
  await app.register(fastifyCookie);

  // 4. CORS
  app.enableCors({
    origin: config.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-tenant-id'],
    maxAge: 86400,
  });

  // 5. Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
