import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getServerSession } from '@mono/kernel/auth/server';
import { getConfig } from '@mono/kernel/config';
import { KernelProviders } from '../components/kernel-providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: { template: '%s | Mono', default: 'Mono' },
  description: 'Enterprise platform',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [user, config] = await Promise.all([getServerSession(), Promise.resolve(getConfig())]);

  const flags = await fetchFeatureFlags(config.apiUrl);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <KernelProviders initialUser={user ?? undefined} flags={flags}>
          {children}
        </KernelProviders>
      </body>
    </html>
  );
}

async function fetchFeatureFlags(apiUrl: string) {
  try {
    const res = await fetch(`${apiUrl}/config/flags`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}
