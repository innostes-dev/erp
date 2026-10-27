/**
 * Types matching the backend setup and tenancy schemas
 * (kernel/backend/kernel/setup/schemas, kernel/backend/kernel/tenancy/schemas).
 */

/** `GET /config` (public application metadata). */
export interface AppConfig {
  service: string;
  version: string;
  environment: string;
}

/** `GET /setup/status` (public). */
export interface SetupStatus {
  installed: boolean;
}

/** `GET /setup/checks` (needs the setup token). */
export interface SetupChecks {
  database_connected: boolean;
  migrations_pending: number;
}

/** Organisation fields collected by the wizard (`TenantCreate`). */
export interface OrganizationInput {
  name: string;
  slug: string;
  country?: string | null;
  timezone?: string | null;
  language?: string | null;
  date_format?: string | null;
}

/** Administrator user credentials collected by the wizard (`AdminUserInput`). */
export interface AdminUserInput {
  first_name: string;
  last_name?: string | null;
  email: string;
  password: string;
  mobile?: string | null;
}

/** Branding & theme customization (`SetupBrandingInput`). */
export interface SetupBrandingInput {
  theme: 'light' | 'dark' | 'system';
  primary_color: string;
  logo_url?: string | null;
}

/** `POST /setup` body. */
export interface SetupRequest {
  organization: OrganizationInput;
  admin: AdminUserInput;
  branding?: SetupBrandingInput | null;
}

/** A tenant as returned by the API (`TenantRead`). */
export interface Tenant extends OrganizationInput {
  id: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

/** Root administrator account created during setup (`UserRead`). */
export interface CreatedAdmin {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  mobile: string | null;
  status: string;
  is_super_admin: boolean;
}

/** `POST /setup` response. */
export interface SetupResult {
  tenant: Tenant;
  admin?: CreatedAdmin | null;
  installed_at: string;
}
