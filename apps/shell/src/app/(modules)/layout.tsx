import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth/server';
import { WorkspaceTopbar } from '../../components/workspace-topbar';
import { ShellNav } from '../../components/shell-nav';

export default async function ModuleLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <WorkspaceTopbar />
      <div className="flex flex-1 overflow-hidden">
        <ShellNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
