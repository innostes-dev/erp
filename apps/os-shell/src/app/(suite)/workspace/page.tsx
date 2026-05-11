import Link from 'next/link';
import { fetchRegistryModules } from '../../../lib/registry';

export const dynamic = 'force-dynamic';

export default async function WorkspacePage() {
  const modules = await fetchRegistryModules();

  return (
    <main className="workspace-page">
      <h1>Welcome back, John</h1>
      <p>Your Innostes workspace is ready. Choose a module to continue.</p>

      <div className="workspace-search-card">
        <input placeholder="Search tools, modules, or employees..." />
      </div>

      <section className="module-card-grid">
        {modules.map((module) => (
          <Link href={`/${module.id}`} key={module.id} className="module-card">
            <div className="module-card-icon" style={{ background: module.theme?.primary ?? module.themeColor }} />
            <h3>{module.name}</h3>
            <p>Open and manage {module.name.toLowerCase()} workflows for your tenant.</p>
          </Link>
        ))}
        <button className="module-card add-module-card" type="button">
          <span>+</span>
          <h3>Add Module</h3>
          <p>Expand your workspace with new capabilities.</p>
        </button>
      </section>
    </main>
  );
}
