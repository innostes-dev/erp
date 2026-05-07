import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const config = getAppConfig();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: config.shellUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------------------------------
  // Swagger — only in non-production environments
  // Access at http://localhost:3001/api/docs
  // ---------------------------------------------------------------------------
  if (process.env['NODE_ENV'] !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mono API Gateway')
      .setDescription(
        `**Backend-first API reference** for the Mono platform.\n\n` +
        `All responses are wrapped in an envelope:\n` +
        `\`\`\`json\n{ "data": <payload>, "success": true, "message": "OK" }\n\`\`\`\n\n` +
        `Errors follow:\n` +
        `\`\`\`json\n{ "success": false, "data": null, "message": "...", "code": "UNAUTHORIZED", "statusCode": 401 }\n\`\`\`\n\n` +
        `Use the **Authorize** button to paste a bearer token from \`POST /api/auth/login\`.`,
      )
      .setVersion('1.0')
      .setContact('Platform Team', '', 'platform@mono.dev')
      .addBearerAuth()
      .addTag('auth', 'Authentication — login, session refresh, logout, current user')
      .addTag('health', 'Health & observability probes')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Mono API Docs',
    });

    logger.log(`API Docs available at http://localhost:${config.port}/api/docs`);
  }

  await app.listen(config.port);
  logger.log(`API Gateway running on http://localhost:${config.port}/api`);
  logger.log(`Accepting requests from ${config.shellUrl}`);
}

void bootstrap();
