'use client';

import { create } from 'zustand';
import type { RegistryModule } from '../lib/registry';

type RegistryState = {
  modules: RegistryModule[];
  setModules: (modules: RegistryModule[]) => void;
};

export const useModuleRegistry = create<RegistryState>((set) => ({
  modules: [],
  setModules: (modules) => set({ modules }),
}));
