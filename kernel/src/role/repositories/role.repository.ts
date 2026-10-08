import { eq, or, sql } from 'drizzle-orm';
import type { InnostesDatabase } from '../../shared/index.js';
import { roles, type RoleTableSelect, type RoleTableInsert } from '../db/role.table.js';

export class RoleRepository {
  private memoryRoles: Map<string, RoleTableSelect> = new Map();

  constructor(private readonly db?: InnostesDatabase<any>) {}

  async create(data: RoleTableInsert): Promise<RoleTableSelect> {
    if (this.db) {
      const [inserted] = await this.db.insert(roles).values(data).returning();
      return inserted!;
    }

    const newRole: RoleTableSelect = {
      id: data.id || `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orgId: data.orgId || null,
      name: data.name,
      isKernelRole: data.isKernelRole ?? false,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.memoryRoles.set(newRole.id, newRole);
    return newRole;
  }

  async findAll(orgId?: string): Promise<RoleTableSelect[]> {
    if (this.db) {
      if (orgId) {
        return this.db
          .select()
          .from(roles)
          .where(or(eq(roles.orgId, orgId), eq(roles.isKernelRole, true)));
      }
      return this.db.select().from(roles);
    }

    const all = Array.from(this.memoryRoles.values());
    if (orgId) {
      return all.filter((r) => r.orgId === orgId || r.isKernelRole);
    }
    return all;
  }

  async findById(id: string): Promise<RoleTableSelect | null> {
    if (this.db) {
      const [found] = await this.db.select().from(roles).where(eq(roles.id, id));
      return found || null;
    }

    return this.memoryRoles.get(id) || null;
  }

  async findByName(name: string, orgId?: string): Promise<RoleTableSelect | null> {
    if (this.db) {
      const [found] = await this.db
        .select()
        .from(roles)
        .where(
          orgId
            ? sql`${roles.name} = ${name} AND (${roles.orgId} = ${orgId} OR ${roles.isKernelRole} = true)`
            : eq(roles.name, name)
        );
      return found || null;
    }

    const lowerName = name.toLowerCase();
    for (const role of this.memoryRoles.values()) {
      if (role.name.toLowerCase() === lowerName) {
        if (!orgId || role.orgId === orgId || role.isKernelRole) {
          return role;
        }
      }
    }
    return null;
  }

  async update(id: string, data: Partial<RoleTableInsert>): Promise<RoleTableSelect | null> {
    if (this.db) {
      const [updated] = await this.db
        .update(roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();
      return updated || null;
    }

    const existing = this.memoryRoles.get(id);
    if (!existing) return null;

    const updated: RoleTableSelect = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.memoryRoles.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    if (this.db) {
      const result = await this.db.delete(roles).where(eq(roles.id, id)).returning();
      return result.length > 0;
    }

    return this.memoryRoles.delete(id);
  }
}
