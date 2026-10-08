import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createSuccessSchema, StandardErrorResponses } from '../../shared/index.js';
import type { FeatureModuleController } from '../controllers/feature-module.controller.js';
import {
  sysFeatureModuleSchema,
  sysOrgFeatureModuleSchema,
  createSysFeatureModuleSchema,
  toggleOrgFeatureModuleSchema,
} from '../schemas/feature-module.schema.js';

export function createFeatureModuleRouter(controller: FeatureModuleController) {
  const router = new OpenAPIHono();

  // GET /api/feature-modules
  router.openapi(
    createRoute({
      method: 'get',
      path: '/',
      summary: 'List system feature modules',
      description: 'Retrieves all registered system feature modules (sys_modules table).',
      tags: ['Feature Modules'],
      responses: {
        200: {
          description: 'List of feature modules',
          content: {
            'application/json': {
              schema: createSuccessSchema(z.array(sysFeatureModuleSchema), 'SysFeatureModuleListResponse'),
            },
          },
        },
        ...StandardErrorResponses,
      },
    }),
    (c) => controller.listModules(c) as any
  );

  // POST /api/feature-modules
  router.openapi(
    createRoute({
      method: 'post',
      path: '/',
      summary: 'Register system feature module',
      description: 'Creates a new system feature module definition in sys_modules.',
      tags: ['Feature Modules'],
      request: {
        body: {
          content: {
            'application/json': {
              schema: createSysFeatureModuleSchema,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Feature module created successfully',
          content: {
            'application/json': {
              schema: createSuccessSchema(sysFeatureModuleSchema, 'SysFeatureModuleResponse'),
            },
          },
        },
        ...StandardErrorResponses,
      },
    }),
    (c) => controller.createModule(c) as any
  );

  // GET /api/feature-modules/org/:orgId
  router.openapi(
    createRoute({
      method: 'get',
      path: '/org/{orgId}',
      summary: 'List organization feature module enablement',
      description: 'Retrieves feature module enablement states for an organization from sys_org_modules.',
      tags: ['Feature Modules'],
      request: {
        params: z.object({
          orgId: z.string().openapi({ description: 'Organization tenant ID', example: 'org_12345' }),
        }),
      },
      responses: {
        200: {
          description: 'Organization feature module status list',
          content: {
            'application/json': {
              schema: createSuccessSchema(z.array(sysOrgFeatureModuleSchema), 'SysOrgFeatureModuleListResponse'),
            },
          },
        },
        ...StandardErrorResponses,
      },
    }),
    (c) => controller.listOrgModules(c) as any
  );

  // PUT /api/feature-modules/org/toggle
  router.openapi(
    createRoute({
      method: 'put',
      path: '/org/toggle',
      summary: 'Enable or disable feature module for organization',
      description: 'Updates feature module enablement state for a tenant organization in sys_org_modules.',
      tags: ['Feature Modules'],
      request: {
        body: {
          content: {
            'application/json': {
              schema: toggleOrgFeatureModuleSchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Organization feature module status updated successfully',
          content: {
            'application/json': {
              schema: createSuccessSchema(sysOrgFeatureModuleSchema, 'SysOrgFeatureModuleResponse'),
            },
          },
        },
        ...StandardErrorResponses,
      },
    }),
    (c) => controller.toggleOrgModule(c) as any
  );

  return router;
}
