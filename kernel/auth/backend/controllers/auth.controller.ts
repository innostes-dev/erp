import type { Context } from 'hono';
import { createSuccessResponse, UnprocessableEntityException } from '@innostes/core';
import type { AuthService } from '../services/auth.service.js';
import { loginSchema } from '../schemas/auth.schema.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * HTTP POST /login handler.
   */
  async login(c: Context) {
    const body = await c.req.json().catch(() => ({}));

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      throw new UnprocessableEntityException('Validation failed for login request', fieldErrors);
    }

    const result = await this.authService.login(validationResult.data);
    return c.json(createSuccessResponse(result, { action: 'auth.login' }), 200);
  }
}
