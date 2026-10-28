import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from '@innostes/kernel';
import { getStoredAccessToken } from '../../../../../kernel/frontend/src/auth/api';
import { PLUGINS_CATALOG, type CatalogItem } from '../catalog';

export interface PluginsContextType {
  activePluginIds: Set<string>;
  activePlugins: CatalogItem[];
  allPlugins: CatalogItem[];
  isPluginActive: (id: string) => boolean;
  activatePlugin: (id: string) => Promise<void>;
  deactivatePlugin: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshPlugins: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextType | null>(null);

const STORAGE_KEY = 'innostes_active_plugins';

export function PluginsProvider({ children }: { children: React.ReactNode }) {
  // Initial state is an empty set (0 active plugins) by default
  const [activePluginIds, setActivePluginIds] = useState<Set<string>>(() => {
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

  const syncActivePlugins = useCallback((newSet: Set<string>) => {
    setActivePluginIds(newSet);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
    }
  }, []);

  const refreshPlugins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiRequest<{ tenant_id: string; items: Array<{ id: string; is_active: boolean }> }>(
        '/tenants/current/plugins',
        { headers }
      );
      if (res && Array.isArray(res.items)) {
        const activeIds = new Set<string>(
          res.items.filter((item) => item.is_active).map((item) => item.id)
        );
        syncActivePlugins(activeIds);
      }
    } catch {
      // If backend is unconfigured or not yet answering, keep existing local state
    } finally {
      setIsLoading(false);
    }
  }, [syncActivePlugins]);

  useEffect(() => {
    void refreshPlugins();
  }, [refreshPlugins]);

  const activatePlugin = async (id: string) => {
    const updated = new Set(activePluginIds);
    updated.add(id);
    syncActivePlugins(updated);

    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiRequest(`/tenants/current/plugins/${id}/activate`, {
        method: 'POST',
        headers,
      });
    } catch {
      // Optimistic update retained
    }
  };

  const deactivatePlugin = async (id: string) => {
    const updated = new Set(activePluginIds);
    updated.delete(id);
    syncActivePlugins(updated);

    try {
      const token = getStoredAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiRequest(`/tenants/current/plugins/${id}/deactivate`, {
        method: 'POST',
        headers,
      });
    } catch {
      // Optimistic update retained
    }
  };

  const isPluginActive = (id: string) => activePluginIds.has(id);

  const activePlugins = PLUGINS_CATALOG.filter((p) => activePluginIds.has(p.id));

  return (
    <PluginsContext.Provider
      value={{
        activePluginIds,
        activePlugins,
        allPlugins: PLUGINS_CATALOG,
        isPluginActive,
        activatePlugin,
        deactivatePlugin,
        isLoading,
        error,
        refreshPlugins,
      }}
    >
      {children}
    </PluginsContext.Provider>
  );
}

export function usePlugins(): PluginsContextType {
  const context = useContext(PluginsContext);
  if (!context) {
    throw new Error('usePlugins must be used within a PluginsProvider');
  }
  return context;
}
