import type { Hono } from 'hono';
import type { InnostesOSModule, ModuleContext } from '@innostes/core';
import { OrganizationRepository } from './repositories/organization.repository.js';
import { OrganizationService } from './services/organization.service.js';
import { OrganizationController } from './controllers/organization.controller.js';
import { createOrganizationRouter } from './routes/organization.routes.js';

export * from './db/schema.js';
export * from './schemas/organization.schema.js';
export * from './dto/organization.dto.js';
export * from './errors/organization.errors.js';
export * from './repositories/organization.repository.js';
export * from './services/organization.service.js';
export * from './controllers/organization.controller.js';
export * from './routes/organization.routes.js';

const organizationKernelModule: InnostesOSModule = {
  id: 'organization',
  name: 'Innostes OS Organization Kernel Service',
  version: '1.0.0',
  registerRoutes: (app: Hono, ctx: ModuleContext) => {
    if (!ctx.db) {
      console.warn('[Innostes:Organization] Warning: Module context DB is undefined.');
    }
    const repository = new OrganizationRepository(ctx.db!);
    const service = new OrganizationService(repository);
    const controller = new OrganizationController(service);
    const router = createOrganizationRouter(controller);

    app.route('/api/organizations', router);
  },
  onBoot: async (_ctx: ModuleContext) => {
    console.log('[Innostes:Organization] Core organization service bootstrapped successfully.');
  },
};

export default organizationKernelModule;
