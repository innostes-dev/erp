import { z, extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const roleSchema = z
  .object({
    id: z.string().openapi({ description: 'Role unique identifier', example: 'role_admin_123' }),
    orgId: z
      .string()
      .nullable()
      .optional()
      .openapi({ description: 'Target organization tenant ID (null for system kernel roles)', example: 'org_12345' }),
    name: z.string().min(2).max(255).openapi({ description: 'Role display name', example: 'Sales Manager' }),
    isKernelRole: z
      .boolean()
      .default(false)
      .openapi({ description: 'Flag indicating system-wide kernel role', example: false }),
    description: z
      .string()
      .optional()
      .openapi({ description: 'Optional role description', example: 'Grants access to sales domain operations' }),
    createdAt: z.string().openapi({ description: 'Creation ISO timestamp', example: '2026-10-08T18:00:00Z' }),
    updatedAt: z.string().openapi({ description: 'Last update ISO timestamp', example: '2026-10-08T18:00:00Z' }),
  })
  .openapi('Role');

export const createRoleSchema = z
  .object({
    orgId: z.string().optional().openapi({ description: 'Optional organization tenant ID', example: 'org_12345' }),
    name: z
      .string()
      .trim()
      .min(2, { message: 'Role name must be at least 2 characters long' })
      .max(255, { message: 'Role name cannot exceed 255 characters' })
      .openapi({ description: 'Role name', example: 'Sales Manager' }),
    isKernelRole: z
      .boolean()
      .default(false)
      .openapi({ description: 'Flag for system kernel role', example: false }),
    description: z
      .string()
      .trim()
      .optional()
      .openapi({ description: 'Optional role description', example: 'Grants access to sales domain operations' }),
  })
  .openapi('CreateRoleInput');

export const updateRoleSchema = z
  .object({
    orgId: z.string().optional().openapi({ description: 'Organization tenant ID', example: 'org_12345' }),
    name: z
      .string()
      .trim()
      .min(2, { message: 'Role name must be at least 2 characters long' })
      .max(255, { message: 'Role name cannot exceed 255 characters' })
      .optional()
      .openapi({ description: 'Role name', example: 'Senior Sales Manager' }),
    isKernelRole: z
      .boolean()
      .optional()
      .openapi({ description: 'Flag for system kernel role', example: false }),
    description: z
      .string()
      .trim()
      .optional()
      .openapi({ description: 'Optional role description', example: 'Updated description' }),
  })
  .openapi('UpdateRoleInput');

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
