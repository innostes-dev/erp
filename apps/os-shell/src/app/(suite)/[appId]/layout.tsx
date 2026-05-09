import type { ReactNode } from 'react';
import Link from 'next/link';
import { fetchRegistryModules } from '../../../lib/registry';

export default async function ModuleLayout({
  params,
  children,
}: {
  params: { appId: string };
  children: ReactNode;
}) {
  const modules = await fetchRegistryModules();
  const active = modules.find((module) => module.id === params.appId);
  const sidebarGroups = active?.sidebarGroups ?? [];

  return (
    <div className="suite-grid">
      <aside className="sidebar module-sidebar">
        <h2>{active?.name ?? 'Module'}</h2>
        {sidebarGroups.map((group) => (
          <section key={group.title} className="sidebar-group">
            <h3>{group.title}</h3>
            <div className="sidebar-links">
              {group.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </aside>
      <main className="content module-content">{children}</main>
    </div>
  );
}
