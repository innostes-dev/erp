import type { Context } from 'hono';
import type { FeatureModuleService } from '../services/feature-module.service.js';
import { createSysFeatureModuleSchema, toggleOrgFeatureModuleSchema } from '../schemas/feature-module.schema.js';
import { createSuccessResponse, BadRequestException } from '../../shared/index.js';

export class FeatureModuleController {
  constructor(private readonly service: FeatureModuleService) {}

  async listModules(c: Context) {
    const modules = await this.service.getAllModules();
    return c.json(createSuccessResponse(modules));
  }

  async getModuleById(c: Context) {
    const id = c.req.param('id') || '';
    const module = await this.service.getModuleById(id);
    return c.json(createSuccessResponse(module));
  }

  async createModule(c: Context) {
    const body = await c.req.json();
    const parsed = createSysFeatureModuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Validation failed for feature module creation', parsed.error.format());
    }

    const created = await this.service.createModule(parsed.data);
    return c.json(createSuccessResponse(created), 201);
  }

  async listOrgModules(c: Context) {
    const orgId = c.req.param('orgId') || '';
    const orgModules = await this.service.getOrgModules(orgId);
    return c.json(createSuccessResponse(orgModules));
  }

  async toggleOrgModule(c: Context) {
    const body = await c.req.json();
    const parsed = toggleOrgFeatureModuleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Validation failed for organization feature module toggle', parsed.error.format());
    }

    const updated = await this.service.setOrgModuleStatus(parsed.data);
    return c.json(createSuccessResponse(updated));
  }
}
