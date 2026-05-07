'use client';

import { type ReactNode } from 'react';
import { FeatureFlagContext } from './config.context';
import type { FeatureFlagMap } from './config.types';

interface ConfigProviderProps {
  flags: Partial<FeatureFlagMap>;
  children: ReactNode;
}

export function ConfigProvider({ flags, children }: ConfigProviderProps) {
  return <FeatureFlagContext.Provider value={flags}>{children}</FeatureFlagContext.Provider>;
}
