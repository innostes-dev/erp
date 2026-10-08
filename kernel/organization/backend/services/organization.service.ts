import { OrganizationRepository } from '../repositories/organization.repository.js';
import { OrganizationNotFoundError, OrganizationSlugConflictError } from '../errors/organization.errors.js';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../schemas/organization.schema.js';
import type { OrganizationTableSelect } from '../db/schema.js';

export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  public static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async createOrganization(input: CreateOrganizationInput): Promise<OrganizationTableSelect> {
    const slug = input.slug || OrganizationService.generateSlug(input.name);

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new OrganizationSlugConflictError(slug);
    }

    return this.repository.create({
      name: input.name,
      slug,
    });
  }

  async getOrganization(identifier: string): Promise<OrganizationTableSelect> {
    const org = await this.repository.findByIdOrSlug(identifier);
    if (!org) {
      throw new OrganizationNotFoundError(identifier);
    }
    return org;
  }

  async listOrganizations(): Promise<OrganizationTableSelect[]> {
    return this.repository.findAll();
  }

  async updateOrganization(id: string, input: UpdateOrganizationInput): Promise<OrganizationTableSelect> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new OrganizationNotFoundError(id);
    }

    if (input.slug && input.slug !== org.slug) {
      const existing = await this.repository.findBySlug(input.slug);
      if (existing) {
        throw new OrganizationSlugConflictError(input.slug);
      }
    }

    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new OrganizationNotFoundError(id);
    }
    return updated;
  }

  async deleteOrganization(id: string): Promise<void> {
    const org = await this.repository.findById(id);
    if (!org) {
      throw new OrganizationNotFoundError(id);
    }
    await this.repository.softDelete(id);
  }
}
