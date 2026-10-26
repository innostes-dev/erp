/**
 * Types matching the backend setup and tenancy schemas
 * (kernel/backend/kernel/setup/schemas, kernel/backend/kernel/tenancy/schemas).
 */

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

/** `POST /setup` body. */
export interface SetupRequest {
  organization: OrganizationInput;
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

/** `POST /setup` response. */
export interface SetupResult {
  tenant: Tenant;
  installed_at: string;
}
