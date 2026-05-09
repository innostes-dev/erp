'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import type { RegistryModule } from '../../lib/registry';

export function DynamicTopNav({ modules }: { modules: RegistryModule[] }) {
  const activeSegment = useSelectedLayoutSegment();
  
  // activeSegment will be the [appId], e.g., 'hr' or 'workspace'
  const activeModule = modules.find((m) => m.id === activeSegment);

  // Default global links if no module is active or module has no headerNav
  const defaultNav = (
    <>
      <Link href="/workspace" className={`nav-item ${activeSegment === 'workspace' ? 'active' : ''}`}>Projects</Link>
      <a href="#" className="nav-item">Your work</a>
      <a href="#" className="nav-item">Filters</a>
      <a href="#" className="nav-item">Dashboards</a>
    </>
  );

  if (!activeModule || !activeModule.headerNav) {
    return <nav className="topbar-nav">{defaultNav}</nav>;
  }

  return (
    <nav className="topbar-nav">
      {activeModule.headerNav.map((link, index) => (
        <Link 
          key={index} 
          href={link.href} 
          className={`nav-item ${index === 0 ? 'active' : ''}`} // Simplistic active state
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
