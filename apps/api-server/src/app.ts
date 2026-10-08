import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import {
  createDatabaseClient,
  pingDatabase,
  createErrorResponse,
  createSuccessResponse,
  HttpException,
  type InnostesOSModule,
  type ModuleContext,
} from '@innostes/core';
import { healthRouter } from './routes/health.route.js';
import authKernelModule from '@innostes/kernel-auth/backend';

export async function createApplication() {
  const app = new Hono();

  // 1. Global Middleware
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 2. Initialize Database Client & Module Context
  let dbContext: ModuleContext['db'];
  try {
    const { db, pool } = createDatabaseClient();
    const isConnected = await pingDatabase(pool);
    if (isConnected) {
      console.log('[Innostes OS] Database connection established successfully.');
      dbContext = db;
    } else {
      console.warn('[Innostes OS] Running in fallback memory mode (Database ping failed or unconfigured).');
    }
  } catch (error) {
    console.warn('[Innostes OS] Running in fallback memory mode:', (error as Error).message);
  }

  const context: ModuleContext = {
    db: dbContext,
    logger: console,
  };

  // 3. Base Routes
  app.route('/api/health', healthRouter);

  // 4. Innostes OS Module & Micro-Tool Auto-Loader Engine
  const modules: InnostesOSModule[] = [
    authKernelModule,
    // Future ERP modules & micro-tools auto-register here
  ];

  for (const module of modules) {
    if (module.registerRoutes) {
      await module.registerRoutes(app, context);
      console.log(`[Innostes OS] Mounted module routes: ${module.name} (${module.id})`);
    }
    if (module.onBoot) {
      await module.onBoot(context);
    }
  }

  // 5. Global Error Handler
  app.onError((err, c) => {
    console.error(`[Innostes OS Error] ${c.req.method} ${c.req.url}:`, err);

    if (err instanceof HttpException) {
      return c.json(
        createErrorResponse(err.message, err.code, err.details, err),
        err.statusCode as any
      );
    }

    return c.json(
      createErrorResponse(err.message || 'Internal server error', 'INTERNAL_SERVER_ERROR', undefined, err),
      500
    );
  });

  // 6. Fallback 404 Not Found
  app.notFound((c) => {
    return c.json(
      createErrorResponse(`Endpoint ${c.req.method} ${c.req.path} does not exist.`, 'NOT_FOUND'),
      404
    );
  });

  return app;
}