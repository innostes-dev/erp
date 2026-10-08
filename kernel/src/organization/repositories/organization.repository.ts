import { eq, isNull, and, or } from 'drizzle-orm';
import type { InnostesDatabase } from '../../shared/index.js';
import { organizations, type OrganizationTableSelect, type OrganizationTableInsert } from '../db/organization.table.js';

export class OrganizationRepository {
  private memoryOrgs: Map<string, OrganizationTableSelect> = new Map();

  constructor(private readonly db?: InnostesDatabase<any>) {}

  async create(data: OrganizationTableInsert): Promise<OrganizationTableSelect> {
    if (this.db) {
      const [inserted] = await this.db.insert(organizations).values(data).returning();
      return inserted!;
    }

    const newOrg: OrganizationTableSelect = {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      slug: data.slug,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    this.memoryOrgs.set(newOrg.id, newOrg);
    return newOrg;
  }

  async findAll(): Promise<OrganizationTableSelect[]> {
    if (this.db) {
      return this.db.select().from(organizations).where(isNull(organizations.deletedAt));
    }

    return Array.from(this.memoryOrgs.values()).filter((org) => !org.deletedAt);
  }

  async findById(id: string): Promise<OrganizationTableSelect | null> {
    if (this.db) {
      const [found] = await this.db
        .select()
        .from(organizations)
        .where(and(eq(organizations.id, id as any), isNull(organizations.deletedAt)));
      return found || null;
    }

    const found = this.memoryOrgs.get(id);
    return found && !found.deletedAt ? found : null;
  }

  async findBySlug(slug: string): Promise<OrganizationTableSelect | null> {
    if (this.db) {
      const [found] = await this.db
        .select()
        .from(organizations)
        .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)));
      return found || null;
    }

    for (const org of this.memoryOrgs.values()) {
      if (org.slug === slug && !org.deletedAt) return org;
    }
    return null;
  }

  async findByIdentifier(identifier: string): Promise<OrganizationTableSelect | null> {
    if (this.db) {
      const [found] = await this.db
        .select()
        .from(organizations)
        .where(
          and(
            or(eq(organizations.id, identifier as any), eq(organizations.slug, identifier)),
            isNull(organizations.deletedAt)
          )
        );
      return found || null;
    }

    const byId = this.memoryOrgs.get(identifier);
    if (byId && !byId.deletedAt) return byId;

    return this.findBySlug(identifier);
  }

  async update(id: string, data: Partial<OrganizationTableInsert>): Promise<OrganizationTableSelect | null> {
    if (this.db) {
      const [updated] = await this.db
        .update(organizations)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(organizations.id, id as any), isNull(organizations.deletedAt)))
        .returning();
      return updated || null;
    }

    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: OrganizationTableSelect = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.memoryOrgs.set(id, updated);
    return updated;
  }

  async softDelete(id: string): Promise<boolean> {
    const now = new Date();
    if (this.db) {
      const result = await this.db
        .update(organizations)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(organizations.id, id as any), isNull(organizations.deletedAt)))
        .returning();
      return result.length > 0;
    }

    const existing = await this.findById(id);
    if (!existing) return false;

    existing.deletedAt = now;
    existing.updatedAt = now;
    return true;
  }
}
