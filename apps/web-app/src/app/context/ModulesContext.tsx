import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from '@innostes/kernel';
import { getStoredAccessToken } from '../../../../../kernel/frontend/src/auth/api';
import { BUSINESS_MODULES_CATALOG, type CatalogItem } from '../catalog';

export interface ModulesContextType {
  activeModuleIds: Set<string>;
  activeModules: CatalogItem[];
  allModules: CatalogItem[];
  isModuleActive: (id: string) => boolean;
  activateModule: (id: string) => Promise<void>;
  deactivateModule: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
}

const ModulesContext = createContext<ModulesContextType | null>(null);

const STORAGE_KEY = 'innostes_active_modules';

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  // Initial state is an empty set (0 active modules) by default
  const [activeModuleIds, setActiveModuleIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return new Set<string>(parsed);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }
    return new Set<string>();
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const syncActiveModules = useCallback((newSet: Set<string>) => {
    setActiveModuleIds(newSet);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
    }
  }, []);

  const refreshModules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiRequest<{ tenant_id: string; items: Array<{ id: string; is_active: boolean }> }>(
        '/tenants/current/modules',
        { headers }
      );
      if (res && Array.isArray(res.items)) {
        const activeIds = new Set<string>(
          res.items.filter((item) => item.is_active).map((item) => item.id)
        );
        syncActiveModules(activeIds);
      }
    } catch {
      // If backend is unconfigured or not yet answering, keep existing local state
    } finally {
      setIsLoading(false);
    }
  }, [syncActiveModules]);

  useEffect(() => {
    void refreshModules();
  }, [refreshModules]);

  const activateModule = async (id: string) => {
    const updated = new Set(activeModuleIds);
    updated.add(id);
    syncActiveModules(updated);

    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiRequest(`/tenants/current/modules/${id}/activate`, {
        method: 'POST',
        headers,
      });
    } catch {
      // Optimistic update retained
    }
  };

  const deactivateModule = async (id: string) => {
    const updated = new Set(activeModuleIds);
    updated.delete(id);
    syncActiveModules(updated);

    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiRequest(`/tenants/current/modules/${id}/deactivate`, {
        method: 'POST',
        headers,
      });
    } catch {
      // Optimistic update retained
    }
  };

  const isModuleActive = (id: string) => activeModuleIds.has(id);

  const activeModules = BUSINESS_MODULES_CATALOG.filter((mod) => activeModuleIds.has(mod.id));

  return (
    <ModulesContext.Provider
      value={{
        activeModuleIds,
        activeModules,
        allModules: BUSINESS_MODULES_CATALOG,
        isModuleActive,
        activateModule,
        deactivateModule,
        isLoading,
        error,
        refreshModules,
      }}
    >
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules(): ModulesContextType {
  const context = useContext(ModulesContext);
  if (!context) {
    throw new Error('useModules must be used within a ModulesProvider');
  }
  return context;
}
