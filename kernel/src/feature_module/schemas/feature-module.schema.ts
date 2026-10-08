import { z, extendZodWithOpenApi } from '@hono/zod-openapi';

extendZodWithOpenApi(z);

export const sysFeatureModuleSchema = z
  .object({
    id: z.string().openapi({ description: 'Feature module identifier', example: 'mod_crm' }),
    name: z.string().min(2).max(255).openapi({ description: 'Feature module name', example: 'Customer Relationship Management' }),
    description: z.string().optional().nullable().openapi({ description: 'Module summary description', example: 'Provides customer contacts and sales pipeline tools' }),
    createdAt: z.string().openapi({ description: 'Creation ISO timestamp', example: '2026-10-08T18:00:00Z' }),
    updatedAt: z.string().openapi({ description: 'Last update ISO timestamp', example: '2026-10-08T18:00:00Z' }),
  })
  .openapi('SysFeatureModule');

export const sysOrgFeatureModuleSchema = z
  .object({
    id: z.string().openapi({ description: 'Organization feature module mapping unique identifier', example: 'org_12345_mod_crm' }),
    orgId: z.string().openapi({ description: 'Target organization tenant ID', example: 'org_12345' }),
    moduleId: z.string().openapi({ description: 'Feature module ID', example: 'mod_crm' }),
    enabled: z.boolean().openapi({ description: 'Module status flag for the organization', example: true }),
    createdAt: z.string().openapi({ description: 'Creation ISO timestamp', example: '2026-10-08T18:00:00Z' }),
    updatedAt: z.string().openapi({ description: 'Last update ISO timestamp', example: '2026-10-08T18:00:00Z' }),
  })
  .openapi('SysOrgFeatureModule');

export const createSysFeatureModuleSchema = z
  .object({
    id: z.string().trim().min(2).max(64).openapi({ description: 'Feature module ID (unique identifier)', example: 'mod_crm' }),
    name: z.string().trim().min(2).max(255).openapi({ description: 'Feature module display name', example: 'Customer Relationship Management' }),
    description: z.string().trim().optional().openapi({ description: 'Optional module description', example: 'Provides customer contacts and sales pipeline tools' }),
  })
  .openapi('CreateSysFeatureModuleInput');

export const toggleOrgFeatureModuleSchema = z
  .object({
    orgId: z.string().trim().min(1).openapi({ description: 'Target organization tenant ID', example: 'org_12345' }),
    moduleId: z.string().trim().min(1).openapi({ description: 'Feature module ID to toggle', example: 'mod_crm' }),
    enabled: z.boolean().openapi({ description: 'Enable or disable flag', example: true }),
  })
  .openapi('ToggleOrgFeatureModuleInput');

export type CreateSysFeatureModuleInput = z.infer<typeof createSysFeatureModuleSchema>;
export type ToggleOrgFeatureModuleInput = z.infer<typeof toggleOrgFeatureModuleSchema>;
