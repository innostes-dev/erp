import type { OrganizationRepository } from '../repositories/organization.repository.js';
import type { CreateOrganizationDto, UpdateOrganizationDto, OrganizationDto } from '../dto/organization.dto.js';
import { OrganizationNotFoundException, OrganizationAlreadyExistsException } from '../errors/organization.errors.js';
import type { OrganizationTableSelect } from '../../db/schema.js';

export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async createOrganization(dto: CreateOrganizationDto): Promise<OrganizationDto> {
    const slug = dto.slug || this.generateSlug(dto.name);
    
    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new OrganizationAlreadyExistsException(slug);
    }

    const created = await this.repository.create({
      name: dto.name,
      slug,
    });

    return this.mapToDto(created);
  }

  async listOrganizations(): Promise<OrganizationDto[]> {
    const orgs = await this.repository.findAll();
    return orgs.map((org) => this.mapToDto(org));
  }

  async getOrganization(identifier: string): Promise<OrganizationDto> {
    const org = await this.repository.findByIdentifier(identifier);
    if (!org) {
      throw new OrganizationNotFoundException(identifier);
    }
    return this.mapToDto(org);
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto): Promise<OrganizationDto> {
    await this.getOrganization(id);

    if (dto.slug) {
      const existingSlug = await this.repository.findBySlug(dto.slug);
      if (existingSlug && existingSlug.id !== id) {
        throw new OrganizationAlreadyExistsException(dto.slug);
      }
    }

    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new OrganizationNotFoundException(id);
    }

    return this.mapToDto(updated);
  }

  async deleteOrganization(id: string): Promise<boolean> {
    await this.getOrganization(id);
    return this.repository.softDelete(id);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private mapToDto(org: OrganizationTableSelect): OrganizationDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
      deletedAt: org.deletedAt ? org.deletedAt.toISOString() : null,
    };
  }
}
