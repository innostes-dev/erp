import type { FeatureModuleRepository } from '../repositories/feature-module.repository.js';
import type {
  SysFeatureModuleDto,
  SysOrgFeatureModuleDto,
  CreateSysFeatureModuleDto,
  ToggleOrgFeatureModuleDto,
} from '../dto/feature-module.dto.js';
import {
  FeatureModuleNotFoundException,
  FeatureModuleAlreadyExistsException,
} from '../errors/feature-module.errors.js';

export class FeatureModuleService {
  constructor(private readonly repository: FeatureModuleRepository) {}

  async createModule(dto: CreateSysFeatureModuleDto): Promise<SysFeatureModuleDto> {
    const existing = await this.repository.findModuleById(dto.id!);
    if (existing) {
      throw new FeatureModuleAlreadyExistsException(dto.id!);
    }

    const created = await this.repository.createModule({
      id: dto.id!,
      name: dto.name,
      description: dto.description || null,
    });

    return this.mapSysModuleToDto(created);
  }

  async getAllModules(): Promise<SysFeatureModuleDto[]> {
    const modules = await this.repository.findAllModules();
    return modules.map(this.mapSysModuleToDto);
  }

  async getModuleById(id: string): Promise<SysFeatureModuleDto> {
    const module = await this.repository.findModuleById(id);
    if (!module) {
      throw new FeatureModuleNotFoundException(id);
    }
    return this.mapSysModuleToDto(module);
  }

  async getOrgModules(orgId: string): Promise<SysOrgFeatureModuleDto[]> {
    const orgModules = await this.repository.findOrgModules(orgId);
    return orgModules.map(this.mapOrgModuleToDto);
  }

  async setOrgModuleStatus(dto: ToggleOrgFeatureModuleDto): Promise<SysOrgFeatureModuleDto> {
    const module = await this.repository.findModuleById(dto.moduleId);
    if (!module) {
      throw new FeatureModuleNotFoundException(dto.moduleId);
    }

    const updated = await this.repository.setOrgModuleStatus(dto);
    return this.mapOrgModuleToDto(updated);
  }

  private mapSysModuleToDto(m: any): SysFeatureModuleDto {
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
      updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : String(m.updatedAt),
    };
  }

  private mapOrgModuleToDto(om: any): SysOrgFeatureModuleDto {
    return {
      id: om.id,
      orgId: om.orgId,
      moduleId: om.moduleId,
      enabled: om.enabled,
      createdAt: om.createdAt instanceof Date ? om.createdAt.toISOString() : String(om.createdAt),
      updatedAt: om.updatedAt instanceof Date ? om.updatedAt.toISOString() : String(om.updatedAt),
    };
  }
}
