import type { ReactNode } from 'react';
import { ThemeProvider } from '@luxis-ui/react';
import { appTokens } from '@innostes/core/design-system';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider customTokens={appTokens}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
