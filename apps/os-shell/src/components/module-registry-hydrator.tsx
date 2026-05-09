'use client';

import { useEffect } from 'react';
import type { RegistryModule } from '../lib/registry';
import { useModuleRegistry } from '../store/use-module-registry';

export function ModuleRegistryHydrator({ modules }: { modules: RegistryModule[] }) {
  const setModules = useModuleRegistry((state) => state.setModules);

  useEffect(() => {
    setModules(modules);
  }, [modules, setModules]);

  return null;
}
