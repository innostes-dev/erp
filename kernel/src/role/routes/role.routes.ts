import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createSuccessSchema, StandardErrorResponses } from '../../shared/index.js';
import type { RoleController } from '../controllers/role.controller.js';
import { roleSchema, createRoleSchema, updateRoleSchema } from '../schemas/role.schema.js';

export function createRoleRouter(controller: RoleController): OpenAPIHono {
  const router = new OpenAPIHono();

  const createRoleRoute = createRoute({
    method: 'post',
    path: '/',
    summary: 'Create role',
    description: 'Creates a new system kernel role or tenant organization role.',
    tags: ['Core', 'Role'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createRoleSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Role created successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(roleSchema, 'RoleSuccessResponse'),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const listRolesRoute = createRoute({
    method: 'get',
    path: '/',
    summary: 'List roles',
    description: 'Retrieves a list of roles (optionally filtered by tenant organization).',
    tags: ['Core', 'Role'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      query: z.object({
        orgId: z.string().optional().openapi({ description: 'Optional organization filter', example: 'org_12345' }),
      }),
    },
    responses: {
      200: {
        description: 'Roles list retrieved successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(z.array(roleSchema), 'RoleListResponse'),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const getRoleRoute = createRoute({
    method: 'get',
    path: '/{id}',
    summary: 'Get role details',
    description: 'Retrieves single role details by ID.',
    tags: ['Core', 'Role'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Role ID', example: 'role_admin_123' }),
      }),
    },
    responses: {
      200: {
        description: 'Role details retrieved successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(roleSchema),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const updateRoleRoute = createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Update role',
    description: 'Updates an existing role record.',
    tags: ['Core', 'Role'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Role ID', example: 'role_admin_123' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateRoleSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Role updated successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(roleSchema),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const deleteRoleRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    summary: 'Delete role',
    description: 'Deletes a role by ID.',
    tags: ['Core', 'Role'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Role ID', example: 'role_admin_123' }),
      }),
    },
    responses: {
      200: {
        description: 'Role deleted successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(
              z.object({
                id: z.string().openapi({ example: 'role_admin_123' }),
                deleted: z.boolean().openapi({ example: true }),
              })
            ),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  router.openapi(createRoleRoute, (c) => controller.create(c as any));
  router.openapi(listRolesRoute, (c) => controller.list(c as any));
  router.openapi(getRoleRoute, (c) => controller.getOne(c as any));
  router.openapi(updateRoleRoute, (c) => controller.update(c as any));
  router.openapi(deleteRoleRoute, (c) => controller.delete(c as any));

  return router;
}
