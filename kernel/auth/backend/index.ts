import type { Hono } from 'hono';
import type { InnostesOSModule, ModuleContext } from '@innostes/core';
import { UserRepository } from './repositories/user.repository.js';
import { TokenService } from './services/token.service.js';
import { PasswordService } from './services/password.service.js';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { createAuthRouter } from './routes/auth.routes.js';

export * from './dto/login.dto.js';
export * from './schemas/auth.schema.js';
export * from './errors/auth.errors.js';
export * from './repositories/user.repository.js';
export * from './services/token.service.js';
export * from './services/password.service.js';
export * from './services/auth.service.js';
export * from './controllers/auth.controller.js';
export * from './routes/auth.routes.js';
export * from './db/schema.js';

const authKernelModule: InnostesOSModule = {
  id: 'auth',
  name: 'Innostes OS Auth Kernel Service',
  version: '1.0.0',
  registerRoutes: (app: Hono, ctx: ModuleContext) => {
    if (!ctx.db) {
      console.warn('[Innostes:Auth] Warning: Module context DB is undefined. Database operations will fail until DB is connected.');
    }
    const userRepository = new UserRepository(ctx.db!);
    const tokenService = new TokenService();
    const passwordService = new PasswordService();
    const authService = new AuthService(userRepository, tokenService, passwordService);
    const authController = new AuthController(authService);
    const authRouter = createAuthRouter(authController);

    app.route('/api/auth', authRouter);
  },
  onBoot: async (_ctx: ModuleContext) => {
    console.log('[Innostes:Auth] Core authentication service bootstrapped successfully.');
  },
};

export default authKernelModule;