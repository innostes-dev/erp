import type { RoleRepository } from '../repositories/role.repository.js';
import type { CreateRoleDto, UpdateRoleDto, RoleDto } from '../dto/role.dto.js';
import { RoleNotFoundException, RoleAlreadyExistsException } from '../errors/role.errors.js';
import type { RoleTableSelect } from '../../db/schema.js';

export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  async createRole(dto: CreateRoleDto): Promise<RoleDto> {
    const existing = await this.repository.findByName(dto.name, dto.orgId);
    if (existing) {
      throw new RoleAlreadyExistsException(dto.name);
    }

    const created = await this.repository.create({
      id: `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orgId: dto.orgId || null,
      name: dto.name,
      isKernelRole: dto.isKernelRole ?? false,
      description: dto.description || null,
    });

    return this.mapToDto(created);
  }

  async listRoles(orgId?: string): Promise<RoleDto[]> {
    const records = await this.repository.findAll(orgId);
    return records.map((r) => this.mapToDto(r));
  }

  async getRole(id: string): Promise<RoleDto> {
    const found = await this.repository.findById(id);
    if (!found) {
      throw new RoleNotFoundException(id);
    }
    return this.mapToDto(found);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleDto> {
    await this.getRole(id);

    const updated = await this.repository.update(id, {
      ...(dto.orgId !== undefined && { orgId: dto.orgId }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.isKernelRole !== undefined && { isKernelRole: dto.isKernelRole }),
      ...(dto.description !== undefined && { description: dto.description }),
    });

    if (!updated) {
      throw new RoleNotFoundException(id);
    }

    return this.mapToDto(updated);
  }

  async deleteRole(id: string): Promise<boolean> {
    await this.getRole(id);
    return this.repository.delete(id);
  }

  private mapToDto(role: RoleTableSelect): RoleDto {
    return {
      id: role.id,
      orgId: role.orgId,
      name: role.name,
      isKernelRole: role.isKernelRole,
      description: role.description,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    };
  }
}
