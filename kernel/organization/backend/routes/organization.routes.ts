import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createSuccessSchema, StandardErrorResponses } from '@innostes/core';
import type { OrganizationController } from '../controllers/organization.controller.js';
import {
  organizationSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
} from '../schemas/organization.schema.js';

export function createOrganizationRouter(controller: OrganizationController): OpenAPIHono {
  const router = new OpenAPIHono();

  const createOrganizationRoute = createRoute({
    method: 'post',
    path: '/',
    summary: 'Create organization',
    description: 'Creates a new tenant organization in the ERP ecosystem.',
    tags: ['Core', 'Organization'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createOrganizationSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Organization created successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(organizationSchema, 'OrganizationSuccessResponse'),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const listOrganizationsRoute = createRoute({
    method: 'get',
    path: '/',
    summary: 'List organizations',
    description: 'Retrieves a list of all active tenant organizations.',
    tags: ['Core', 'Organization'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    responses: {
      200: {
        description: 'Organizations list retrieved successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(z.array(organizationSchema), 'OrganizationListResponse'),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const getOrganizationRoute = createRoute({
    method: 'get',
    path: '/{identifier}',
    summary: 'Get organization details',
    description: 'Retrieves single organization details by ID or slug.',
    tags: ['Core', 'Organization'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        identifier: z.string().openapi({ description: 'Organization ID or URL slug', example: 'org_12345' }),
      }),
    },
    responses: {
      200: {
        description: 'Organization details retrieved successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(organizationSchema),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const updateOrganizationRoute = createRoute({
    method: 'put',
    path: '/{id}',
    summary: 'Update organization',
    description: 'Updates an existing organization record.',
    tags: ['Core', 'Organization'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Organization ID', example: 'org_12345' }),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateOrganizationSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Organization updated successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(organizationSchema),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  const deleteOrganizationRoute = createRoute({
    method: 'delete',
    path: '/{id}',
    summary: 'Delete organization',
    description: 'Deletes an organization by ID.',
    tags: ['Core', 'Organization'],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    request: {
      params: z.object({
        id: z.string().openapi({ description: 'Organization ID', example: 'org_12345' }),
      }),
    },
    responses: {
      200: {
        description: 'Organization deleted successfully',
        content: {
          'application/json': {
            schema: createSuccessSchema(
              z.object({
                id: z.string().openapi({ example: 'org_12345' }),
                deleted: z.boolean().openapi({ example: true }),
              })
            ),
          },
        },
      },
      ...StandardErrorResponses,
    },
  });

  router.openapi(createOrganizationRoute, (c) => controller.create(c as any));
  router.openapi(listOrganizationsRoute, (c) => controller.list(c as any));
  router.openapi(getOrganizationRoute, (c) => controller.getOne(c as any));
  router.openapi(updateOrganizationRoute, (c) => controller.update(c as any));
  router.openapi(deleteOrganizationRoute, (c) => controller.delete(c as any));

  return router;
}
