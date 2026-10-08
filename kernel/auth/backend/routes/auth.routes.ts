import { Hono } from 'hono';
import type { AuthController } from '../controllers/auth.controller.js';

export function createAuthRouter(authController: AuthController) {
  const router = new Hono();

  router.post('/login', (c) => authController.login(c));

  return router;
}
