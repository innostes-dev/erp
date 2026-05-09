import { Controller, Get } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db, moduleRegistry } from '@innostes/core/database';
import { TenantContextService } from '../tenant/tenant-context.service';
import { MODULE_MANIFESTS } from './module-catalog';

@Controller('registry')
export class RegistryController {
  constructor(private readonly tenantContext: TenantContextService) {}

  @Get('modules')
  async getEnabledModules() {
    const tenantId = this.tenantContext.getTenantId();
    const rows = await db
      .select({ moduleId: moduleRegistry.moduleId, isEnabled: moduleRegistry.isEnabled })
      .from(moduleRegistry)
      .where(and(eq(moduleRegistry.tenantId, tenantId), eq(moduleRegistry.isEnabled, true)));

    return rows
      .map((row) => MODULE_MANIFESTS[row.moduleId as keyof typeof MODULE_MANIFESTS])
      .filter(Boolean)
      .map((module) => ({
        id: module.id,
        name: module.name,
        themeColor: module.themeColor,
        theme: module.theme,
        sidebarGroups: module.sidebarGroups,
      }));
  }
}
