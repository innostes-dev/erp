'use client';

import { create, type StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Factory for domain module stores. Wraps zustand with devtools and
 * a namespaced store name for Redux DevTools visibility.
 */
export function createModuleStore<T extends object>(
  name: string,
  initializer: StateCreator<T, [['zustand/devtools', never]], []>,
) {
  return create<T>()(devtools(initializer, { name }));
}
