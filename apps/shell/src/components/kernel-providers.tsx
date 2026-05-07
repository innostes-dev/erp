'use client';

import { type ReactNode } from 'react';
import { AuthProvider, type User } from '@mono/kernel/auth';
import { ConfigProvider, type FeatureFlagMap } from '@mono/kernel/config';
import { RouterRegistrar } from './router-registrar';

interface KernelProvidersProps {
  children: ReactNode;
  initialUser?: User;
  flags: Partial<FeatureFlagMap>;
}

export function KernelProviders({ children, initialUser, flags }: KernelProvidersProps) {
  return (
    <ConfigProvider flags={flags}>
      <AuthProvider initialUser={initialUser}>
        <RouterRegistrar />
        {children}
      </AuthProvider>
    </ConfigProvider>
  );
}
