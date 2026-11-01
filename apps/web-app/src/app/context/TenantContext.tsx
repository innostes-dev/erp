import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from '@innostes/kernel';
import { getStoredAccessToken } from '../../../../../kernel/frontend/src/auth/api';

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  country?: string | null;
  timezone?: string | null;
  language?: string | null;
  date_format?: string | null;
}

export interface TenantContextType {
  tenant: TenantDetails | null;
  tenantName: string;
  tenantSlug: string;
  isLoading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | null>(null);

const STORAGE_KEY = 'innostes_current_tenant';
const DEFAULT_TENANT_NAME = 'Innostes ERP';
const DEFAULT_TENANT_SLUG = 'innostes-erp';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantDetails | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as TenantDetails;
        } catch {
          // Ignore invalid JSON
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTenant = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiRequest<TenantDetails>('/tenants/current', { headers });
      if (res && res.name) {
        setTenant(res);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load active tenant');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTenant();
  }, [refreshTenant]);

  const tenantName = tenant?.name || DEFAULT_TENANT_NAME;
  const tenantSlug = tenant?.slug || DEFAULT_TENANT_SLUG;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantName,
        tenantSlug,
        isLoading,
        error,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useCurrentTenant(): TenantContextType {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    return {
      tenant: null,
      tenantName: DEFAULT_TENANT_NAME,
      tenantSlug: DEFAULT_TENANT_SLUG,
      isLoading: false,
      error: null,
      refreshTenant: async () => {},
    };
  }
  return ctx;
}
