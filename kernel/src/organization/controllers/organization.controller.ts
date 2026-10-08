import type { Context } from 'hono';
import type { OrganizationService } from '../services/organization.service.js';
import { createOrganizationSchema, updateOrganizationSchema } from '../schemas/organization.schema.js';
import { createSuccessResponse, BadRequestException } from '../../shared/index.js';

export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  async create(c: Context) {
    const body = await c.req.json().catch(() => ({}));
    const parseResult = createOrganizationSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid organization data';
      throw new BadRequestException(firstError);
    }

    const org = await this.service.createOrganization(parseResult.data);
    return c.json(createSuccessResponse(org, { message: 'Organization created successfully' }), 201);
  }

  async list(c: Context) {
    const orgs = await this.service.listOrganizations();
    return c.json(createSuccessResponse(orgs), 200);
  }

  async getOne(c: Context) {
    const identifier = c.req.param('identifier') || '';
    const org = await this.service.getOrganization(identifier);
    return c.json(createSuccessResponse(org), 200);
  }

  async update(c: Context) {
    const id = c.req.param('id') || '';
    const body = await c.req.json().catch(() => ({}));
    const parseResult = updateOrganizationSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid organization data';
      throw new BadRequestException(firstError);
    }

    const updated = await this.service.updateOrganization(id, parseResult.data);
    return c.json(createSuccessResponse(updated, { message: 'Organization updated successfully' }), 200);
  }

  async delete(c: Context) {
    const id = c.req.param('id') || '';
    await this.service.deleteOrganization(id);
    return c.json(createSuccessResponse(null, { message: 'Organization deleted successfully' }), 200);
  }
}
