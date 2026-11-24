export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string | null;
  language: string | null;
  date_format: string | null;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  deleted_at: Date | null;
  deleted_by: string | null;
}

export interface TenantRead {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  timezone: string | null;
  language: string | null;
  date_format: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export const toTenantRead = (t: TenantRow): TenantRead => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  country: t.country,
  timezone: t.timezone,
  language: t.language,
  date_format: t.date_format,
  created_at: t.created_at.toISOString(),
  created_by: t.created_by,
  updated_at: t.updated_at.toISOString(),
  updated_by: t.updated_by,
  deleted_at: t.deleted_at ? t.deleted_at.toISOString() : null,
  deleted_by: t.deleted_by,
});

export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  version: string;
  type: 'module' | 'plugin';
  description: string;
  tags: string[];
  tone: string;
  is_active: boolean;
  activated_at: string | null;
}

export interface ActivationResponse {
  item_id: string;
  is_active: boolean;
  message: string;
}
