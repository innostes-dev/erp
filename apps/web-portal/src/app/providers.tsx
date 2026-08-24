'use client';

import React from 'react';
import { ThemeProvider } from '@luxis-ui/react';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper.
 *
 * ThemeProvider injects CSS variables into the document and provides
 * theme context to all child components via React context.
 *
 * When @luxis-ui/react is published to npm and this local folder is removed,
 * this import continues to work unchanged — just npm-resolved instead of workspace-resolved.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      theme={{
        mode: 'light',
        global: { size: 'md', radius: 'md' },
      }}
    >
      {children}
    </ThemeProvider>
  );
}
