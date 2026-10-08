import { z, extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const organizationSchema = z
  .object({
    id: z.string().openapi({ description: 'Organization unique identifier', example: 'org_12345' }),
    name: z.string().openapi({ description: 'Organization display name', example: 'Acme Corporation' }),
    slug: z.string().openapi({ description: 'Organization URL slug', example: 'acme-corp' }),
    createdAt: z.string().openapi({ description: 'Creation ISO timestamp', example: '2026-10-08T10:00:00Z' }),
    updatedAt: z.string().openapi({ description: 'Last update ISO timestamp', example: '2026-10-08T12:00:00Z' }),
    deletedAt: z.string().nullable().optional().openapi({ description: 'Deletion ISO timestamp', example: null }),
  })
  .openapi('Organization');

export const createOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'Organization name must be at least 2 characters long' })
      .max(255, { message: 'Organization name cannot exceed 255 characters' })
      .openapi({ description: 'Organization name', example: 'Acme Corporation' }),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, { message: 'Slug must be at least 2 characters long' })
      .max(255, { message: 'Slug cannot exceed 255 characters' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
      .optional()
      .openapi({ description: 'Optional unique URL slug', example: 'acme-corp' }),
  })
  .openapi('CreateOrganizationInput');

export const updateOrganizationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'Organization name must be at least 2 characters long' })
      .max(255, { message: 'Organization name cannot exceed 255 characters' })
      .optional()
      .openapi({ description: 'Organization name', example: 'Acme Global Inc' }),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, { message: 'Slug must be at least 2 characters long' })
      .max(255, { message: 'Slug cannot exceed 255 characters' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
      .optional()
      .openapi({ description: 'Unique URL slug', example: 'acme-global' }),
  })
  .openapi('UpdateOrganizationInput');

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
