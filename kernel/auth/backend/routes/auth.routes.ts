import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { createSuccessSchema, StandardErrorResponses } from '@innostes/core';
import type { AuthController } from '../controllers/auth.controller.js';
import { loginSchema, loginResponseDataSchema } from '../schemas/auth.schema.js';

export function createAuthRouter(authController: AuthController): OpenAPIHono {
  const router = new OpenAPIHono();

  const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    summary: 'User Login',
    description: 'Authenticates user credentials and returns a Bearer JWT access token.',
    tags: ['Core', 'Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Authentication successful',
        content: {
          'application/json': {
            schema: createSuccessSchema(loginResponseDataSchema, 'LoginSuccessResponse'),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  router.openapi(loginRoute, (c) => authController.login(c as any));

  return router;
}
