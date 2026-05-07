import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from '@mono/kernel/auth/server';
import { WorkspaceTopbar } from '../components/workspace-topbar';
import { WorkspaceGreeting } from '../components/workspace-greeting';
import { ModuleCard } from '../components/module-card';
import { MODULES } from '../lib/modules';

export const metadata: Metadata = { title: 'Workspace | Mono' };

export default async function WorkspacePage() {
  const user = await getServerSession();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkspaceTopbar />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <WorkspaceGreeting name={user.name} moduleCount={MODULES.length} />

        {/* Divider with label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            All modules
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-center text-xs text-gray-400">
          Press{' '}
          <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-sm">
            ⌘K
          </kbd>{' '}
          to search across all modules
        </p>
      </main>
    </div>
  );
}
