'use client';

import './globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@luxis-ui/react';
import { designTokens } from '@innostes/core/design-system';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider customTokens={designTokens}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
