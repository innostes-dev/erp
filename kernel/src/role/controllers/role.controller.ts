import type { Context } from 'hono';
import type { RoleService } from '../services/role.service.js';
import { createRoleSchema, updateRoleSchema } from '../schemas/role.schema.js';
import { createSuccessResponse, BadRequestException } from '../../shared/index.js';

export class RoleController {
  constructor(private readonly service: RoleService) {}

  async create(c: Context) {
    const body = await c.req.json().catch(() => ({}));
    const parseResult = createRoleSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid role data';
      throw new BadRequestException(firstError);
    }

    const role = await this.service.createRole(parseResult.data);
    return c.json(createSuccessResponse(role, { message: 'Role created successfully' }), 201);
  }

  async list(c: Context) {
    const orgId = c.req.query('orgId') || c.req.header('X-Organization-Id');
    const roles = await this.service.listRoles(orgId);
    return c.json(createSuccessResponse(roles), 200);
  }

  async getOne(c: Context) {
    const id = c.req.param('id') || '';
    const role = await this.service.getRole(id);
    return c.json(createSuccessResponse(role), 200);
  }

  async update(c: Context) {
    const id = c.req.param('id') || '';
    const body = await c.req.json().catch(() => ({}));
    const parseResult = updateRoleSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid role data';
      throw new BadRequestException(firstError);
    }

    const updated = await this.service.updateRole(id, parseResult.data);
    return c.json(createSuccessResponse(updated, { message: 'Role updated successfully' }), 200);
  }

  async delete(c: Context) {
    const id = c.req.param('id') || '';
    await this.service.deleteRole(id);
    return c.json(createSuccessResponse({ id, deleted: true }, { message: 'Role deleted successfully' }), 200);
  }
}
