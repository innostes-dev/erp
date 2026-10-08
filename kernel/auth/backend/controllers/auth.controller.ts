import type { Context } from 'hono';
import { createSuccessResponse, createErrorResponse, HttpException, UnprocessableEntityException } from '@innostes/core';
import { AuthService } from '../services/auth.service.js';
import { loginSchema } from '../schemas/auth.schema.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * HTTP POST /login handler.
   */
  async login(c: Context) {
    try {
      const body = await c.req.json().catch(() => ({}));
      
      const validationResult = loginSchema.safeParse(body);
      if (!validationResult.success) {
        const fieldErrors = validationResult.error.flatten().fieldErrors;
        throw new UnprocessableEntityException('Validation failed for login request', fieldErrors);
      }

      const result = await this.authService.login(validationResult.data);
      return c.json(createSuccessResponse(result, { action: 'auth.login' }));
    } catch (error) {
      if (error instanceof HttpException) {
        return c.json(
          createErrorResponse(error.message, error.code, error.details, error),
          error.statusCode as any
        );
      }

      const errMessage = error instanceof Error ? error.message : 'Login failed';
      return c.json(
        createErrorResponse(errMessage, 'INTERNAL_SERVER_ERROR', undefined, error),
        500
      );
    }
  }
}
