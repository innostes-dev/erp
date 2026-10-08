import { eq, isNull, or, and } from 'drizzle-orm';
import type { InnostesDatabase } from '@innostes/core';
import { organizations, type OrganizationTableSelect, type OrganizationTableInsert } from '../db/schema.js';

export class OrganizationRepository {
  constructor(private readonly db: InnostesDatabase) {}

  async create(data: OrganizationTableInsert): Promise<OrganizationTableSelect> {
    const [result] = await this.db.insert(organizations).values(data).returning();
    if (!result) {
      throw new Error('Failed to insert organization record.');
    }
    return result;
  }

  async findById(id: string, includeDeleted = false): Promise<OrganizationTableSelect | null> {
    const conditions = [eq(organizations.id, id)];
    if (!includeDeleted) {
      conditions.push(isNull(organizations.deletedAt));
    }
    const [result] = await this.db.select().from(organizations).where(and(...conditions)).limit(1);
    return result || null;
  }

  async findBySlug(slug: string, includeDeleted = false): Promise<OrganizationTableSelect | null> {
    const conditions = [eq(organizations.slug, slug)];
    if (!includeDeleted) {
      conditions.push(isNull(organizations.deletedAt));
    }
    const [result] = await this.db.select().from(organizations).where(and(...conditions)).limit(1);
    return result || null;
  }

  async findByIdOrSlug(identifier: string): Promise<OrganizationTableSelect | null> {
    const [result] = await this.db
      .select()
      .from(organizations)
      .where(
        and(
          isNull(organizations.deletedAt),
          or(eq(organizations.id, identifier), eq(organizations.slug, identifier))
        )
      )
      .limit(1);
    return result || null;
  }

  async findAll(includeDeleted = false): Promise<OrganizationTableSelect[]> {
    if (includeDeleted) {
      return this.db.select().from(organizations);
    }
    return this.db.select().from(organizations).where(isNull(organizations.deletedAt));
  }

  async update(id: string, data: Partial<Omit<OrganizationTableInsert, 'id' | 'createdAt'>>): Promise<OrganizationTableSelect | null> {
    const [result] = await this.db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
      .returning();

    return result || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const [result] = await this.db
      .update(organizations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
      .returning();

    return !!result;
  }
}
