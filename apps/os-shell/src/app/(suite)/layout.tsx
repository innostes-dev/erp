import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppLauncher } from '../../components/shell/app-launcher';
import { ModuleRegistryHydrator } from '../../components/module-registry-hydrator';
import { DynamicTopNav } from '../../components/shell/dynamic-top-nav';
import { TopbarActions } from '../../components/shell/topbar-actions';
import { fetchRegistryModules } from '../../lib/registry';
import { BRANDING } from '@innostes/core/design-system';

export const dynamic = 'force-dynamic';

export default async function SuiteLayout({ children }: { children: ReactNode }) {
  const modules = await fetchRegistryModules();
  return (
    <section className="shell suite-shell">
      <ModuleRegistryHydrator modules={modules} />
      <header className="topbar suite-topbar">
        <div className="topbar-left">
          <AppLauncher modules={modules} />
          <Link href="/workspace" className="brand-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#003da5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="brand-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span className="brand-text">{BRANDING.appName}</span>
          </Link>
        </div>
        <DynamicTopNav modules={modules} />
        <TopbarActions modules={modules} />
      </header>
      <div className="suite-body">{children}</div>
    </section>
  );
}
