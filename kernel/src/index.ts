import type { Hono } from 'hono';
import type { InnostesOSModule, ModuleContext } from './shared/index.js';

// Shared Kernel Exports
export * from './shared/index.js';

// DB Exports
export * from './db/schema.js';
export * from './db/seeds/index.js';
export * from './auth/db/user.table.js';
export * from './organization/db/organization.table.js';
export * from './role/db/role.table.js';
export * from './feature_module/db/feature-module.table.js';

// Auth Domain Exports
export * from './auth/dto/login.dto.js';
export * from './auth/errors/auth.errors.js';
export * from './auth/schemas/auth.schema.js';
export * from './auth/repositories/user.repository.js';
export * from './auth/services/token.service.js';
export * from './auth/services/password.service.js';
export * from './auth/services/auth.service.js';
export * from './auth/controllers/auth.controller.js';
export * from './auth/routes/auth.routes.js';

// Organization Domain Exports
export * from './organization/dto/organization.dto.js';
export * from './organization/errors/organization.errors.js';
export * from './organization/schemas/organization.schema.js';
export * from './organization/repositories/organization.repository.js';
export * from './organization/services/organization.service.js';
export * from './organization/controllers/organization.controller.js';
export * from './organization/routes/organization.routes.js';

// Role Domain Exports
export * from './role/dto/role.dto.js';
export * from './role/errors/role.errors.js';
export * from './role/schemas/role.schema.js';
export * from './role/repositories/role.repository.js';
export * from './role/services/role.service.js';
export * from './role/controllers/role.controller.js';
export * from './role/routes/role.routes.js';

// Feature Module Domain Exports
export * from './feature_module/dto/feature-module.dto.js';
export * from './feature_module/errors/feature-module.errors.js';
export * from './feature_module/schemas/feature-module.schema.js';
export * from './feature_module/repositories/feature-module.repository.js';
export * from './feature_module/services/feature-module.service.js';
export * from './feature_module/controllers/feature-module.controller.js';
export * from './feature_module/routes/feature-module.routes.js';

// Import domain constructors
import { UserRepository } from './auth/repositories/user.repository.js';
import { TokenService } from './auth/services/token.service.js';
import { PasswordService } from './auth/services/password.service.js';
import { AuthService } from './auth/services/auth.service.js';
import { AuthController } from './auth/controllers/auth.controller.js';
import { createAuthRouter } from './auth/routes/auth.routes.js';

import { OrganizationRepository } from './organization/repositories/organization.repository.js';
import { OrganizationService } from './organization/services/organization.service.js';
import { OrganizationController } from './organization/controllers/organization.controller.js';
import { createOrganizationRouter } from './organization/routes/organization.routes.js';

import { RoleRepository } from './role/repositories/role.repository.js';
import { RoleService } from './role/services/role.service.js';
import { RoleController } from './role/controllers/role.controller.js';
import { createRoleRouter } from './role/routes/role.routes.js';

import { FeatureModuleRepository } from './feature_module/repositories/feature-module.repository.js';
import { FeatureModuleService } from './feature_module/services/feature-module.service.js';
import { FeatureModuleController } from './feature_module/controllers/feature-module.controller.js';
import { createFeatureModuleRouter } from './feature_module/routes/feature-module.routes.js';

import { seedKernel } from './db/seeds/index.js';

const kernelModule: InnostesOSModule = {
  id: 'kernel',
  name: 'Innostes OS Core Kernel Engine',
  version: '1.0.0',
  registerRoutes: (app: Hono, ctx: ModuleContext) => {
    if (!ctx.db) {
      console.warn('[Innostes:Kernel] Warning: Module context DB is undefined.');
    }

    // 1. Auth Module Routes
    const userRepo = new UserRepository(ctx.db!);
    const authService = new AuthService(userRepo, new TokenService(), new PasswordService());
    const authController = new AuthController(authService);
    app.route('/api/auth', createAuthRouter(authController) as any);

    // 2. Organization Module Routes
    const orgRepo = new OrganizationRepository(ctx.db!);
    const orgService = new OrganizationService(orgRepo);
    const orgController = new OrganizationController(orgService);
    app.route('/api/organizations', createOrganizationRouter(orgController) as any);

    // 3. Role Module Routes
    const roleRepo = new RoleRepository(ctx.db!);
    const roleService = new RoleService(roleRepo);
    const roleController = new RoleController(roleService);
    app.route('/api/roles', createRoleRouter(roleController) as any);

    // 4. Feature Module Management Routes
    const featureModuleRepo = new FeatureModuleRepository(ctx.db!);
    const featureModuleService = new FeatureModuleService(featureModuleRepo);
    const featureModuleController = new FeatureModuleController(featureModuleService);
    app.route('/api/feature-modules', createFeatureModuleRouter(featureModuleController) as any);
  },
  onBoot: async (ctx: ModuleContext) => {
    console.log('[Innostes:Kernel] Unified Kernel Engine bootstrapping (Auth, Organizations, Roles, Feature Modules)...');
    try {
      await seedKernel(ctx.db);
    } catch (err) {
      console.error('[Innostes:Kernel] Warning: Seeding failed during boot:', err);
    }
  },
};

export default kernelModule;
