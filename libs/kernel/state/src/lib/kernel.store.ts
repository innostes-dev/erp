'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { KernelStore } from './state.types';

export const useKernelStore = create<KernelStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'system',
        locale: 'en-US',
        isSidebarOpen: true,
        setTheme: (theme) => set({ theme }, false, 'kernel/setTheme'),
        setLocale: (locale) => set({ locale }, false, 'kernel/setLocale'),
        toggleSidebar: () =>
          set((s) => ({ isSidebarOpen: !s.isSidebarOpen }), false, 'kernel/toggleSidebar'),
      }),
      { name: 'kernel-store' },
    ),
    { name: 'KernelStore' },
  ),
);
