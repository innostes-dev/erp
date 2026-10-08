export interface SysFeatureModuleDto {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SysOrgFeatureModuleDto {
  id: string;
  orgId: string;
  moduleId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSysFeatureModuleDto {
  id?: string;
  name: string;
  description?: string;
}

export interface ToggleOrgFeatureModuleDto {
  orgId: string;
  moduleId: string;
  enabled: boolean;
}
