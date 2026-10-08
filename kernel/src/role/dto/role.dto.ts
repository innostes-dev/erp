export interface RoleDto {
  id: string;
  orgId?: string | null;
  name: string;
  isKernelRole: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  orgId?: string;
  name: string;
  isKernelRole?: boolean;
  description?: string;
}

export interface UpdateRoleDto {
  orgId?: string;
  name?: string;
  isKernelRole?: boolean;
  description?: string;
}
