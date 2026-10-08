import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { apiReference } from '@scalar/hono-api-reference';
import {
  createDatabaseClient,
  pingDatabase,
  createErrorResponse,
  HttpException,
  type InnostesOSModule,
  type ModuleContext,
} from '@innostes/kernel';
import { healthRouter } from './routes/health.route.js';
import kernelModule from '@innostes/kernel';

export async function createApplication() {
  const app = new OpenAPIHono();

  // 1. Global Security & CORS Middleware
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: (origin) => origin || '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Organization-Id'],
      exposeHeaders: ['Content-Type', 'X-Request-Id'],
      credentials: true,
    })
  );

  // 2. Register Security Components for OpenAPI
  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your JWT access token (Bearer <token>)',
  });

  app.openAPIRegistry.registerComponent('securitySchemes', 'apiKeyAuth', {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'Enter your ERP API Secret Key (e.g. erp_live_...)',
  });

  // 3. Initialize Database Client & Module Context
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

  // 4. Base Routes
  app.route('/api/health', healthRouter as any);

  // 5. Innostes OS Unified Kernel Auto-Loader Engine
  const modules: InnostesOSModule[] = [
    kernelModule,
  ];

  for (const module of modules) {
    if (module.registerRoutes) {
      await module.registerRoutes(app, context);
      console.log(`[Innostes OS] Mounted kernel module: ${module.name} (${module.id})`);
    }
    if (module.onBoot) {
      await module.onBoot(context);
    }
  }

  // 6. OpenAPI Specification Endpoint (GET /openapi.json)
  const apiBaseUrl = process.env.PUBLIC_API_URL || process.env.API_BASE_URL || 'http://localhost:3000';
  app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Innostes Enterprise ERP API',
      version: '1.0.0',
      description: `Production-grade API reference for the Innostes Open-Source ERP Platform.

### Authentication
The API supports dual authentication methods:
- **Bearer Token (JWT)**: Pass \`Authorization: Bearer <jwt>\` header.
- **API Key**: Pass \`X-API-Key: <key>\` header.

### Tenant Context
Multi-tenant requests require the header \`X-Organization-Id: <org_id>\` or context parameter.`,
      contact: {
        name: 'Innostes Developer Support',
        email: 'developer@innostes.com',
      },
    },
    servers: [
      {
        url: apiBaseUrl,
        description: 'Current Environment (Configured API Server)',
      },
      {
        url: 'https://sandbox-api.innostes.com',
        description: 'Sandbox Environment',
      },
      {
        url: 'https://api.innostes.com',
        description: 'Production Environment',
      },
    ],
    tags: [
      { name: 'Core', description: 'System health, tenant organization, & security management' },
      { name: 'Auth', description: 'Authentication, credentials, and token session issuance' },
      { name: 'Role', description: 'Role-based access control (RBAC) & permissions' },
      { name: 'Organization', description: 'Tenant organization & multi-entity management' },
      { name: 'CRM', description: 'Customer relationship management & contacts' },
      { name: 'Sales', description: 'Quotations, sales orders, and invoices' },
      { name: 'Inventory', description: 'Product catalog, stock levels, and warehouses' },
      { name: 'Purchasing', description: 'Suppliers, purchase orders, and goods receipts' },
      { name: 'Accounting', description: 'General ledger, journal entries, taxes, and payments' },
      { name: 'HR', description: 'Employee records, attendance, leave, and payroll' },
      { name: 'E-commerce', description: 'Stores, online carts, and web orders' },
    ],
  });

  // 6.5 Interactive Scalar API Reference UI
  app.get(
    '/reference',
    apiReference({
      spec: {
        url: '/openapi.json',
      },
      theme: 'purple',
      pageTitle: 'Innostes Enterprise ERP API Reference',
      defaultHttpClient: {
        targetKey: 'shell',
        clientKey: 'curl',
      },
    })
  );

  // 7. Global Error Handler
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

  // 8. Fallback 404 Not Found
  app.notFound((c) => {
    return c.json(
      createErrorResponse(`Endpoint ${c.req.method} ${c.req.path} does not exist.`, 'NOT_FOUND'),
      404
    );
  });

  return app;
}