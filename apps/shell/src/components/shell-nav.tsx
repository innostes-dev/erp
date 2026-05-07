'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '@mono/kernel/auth';
import { useKernelStore } from '@mono/kernel/state';
import { MODULES } from '../lib/modules';
import { MODULE_ICONS, NAV_ICONS } from '../lib/module-icons';
import { cn } from '../lib/cn';

export function ShellNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useKernelStore();

  const activeModule = MODULES.find((m) => pathname.startsWith(m.route)) ?? null;
  const ModuleIcon = activeModule ? (MODULE_ICONS[activeModule.id] ?? BarChart2) : null;

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out',
        isSidebarOpen ? 'w-56' : 'w-[60px]',
      )}
    >
      {/* Module header */}
      <div className="flex h-14 items-center border-b border-gray-100 px-3 gap-2">
        {activeModule && ModuleIcon && (
          <>
            <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm', activeModule.gradient)}>
              <ModuleIcon size={15} className={activeModule.iconColor} />
            </div>
            {isSidebarOpen && (
              <span className="flex-1 text-sm font-semibold text-gray-900 truncate">{activeModule.name}</span>
            )}
          </>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ml-auto',
          )}
          title={isSidebarOpen ? 'Collapse' : 'Expand'}
        >
          {isSidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {activeModule ? (
          activeModule.navItems.map((item) => {
            const Icon = NAV_ICONS[item.iconId] ?? BarChart2;
            const isActive = item.route === activeModule.route
              ? pathname === item.route
              : pathname.startsWith(item.route);

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.route)}
                title={!isSidebarOpen ? item.label : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg py-2 text-sm transition-all duration-150',
                  isSidebarOpen ? 'px-3' : 'justify-center px-2',
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon size={16} className="shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })
        ) : (
          MODULES.map((mod) => {
            const Icon = MODULE_ICONS[mod.id] ?? BarChart2;
            const isActive = pathname.startsWith(mod.route);
            return (
              <button
                key={mod.id}
                onClick={() => router.push(mod.route)}
                title={!isSidebarOpen ? mod.name : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg py-2 text-sm transition-all duration-150',
                  isSidebarOpen ? 'px-3' : 'justify-center px-2',
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br', mod.gradient)}>
                  <Icon size={13} className={mod.iconColor} />
                </div>
                {isSidebarOpen && <span>{mod.name}</span>}
              </button>
            );
          })
        )}
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-gray-100 p-2">
          <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2', !isSidebarOpen && 'justify-center')}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
              {initials}
            </div>
            {isSidebarOpen && (
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-900">{user.name}</p>
                  <p className="truncate text-[10px] text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => void logout().then(() => { window.location.href = '/login'; })}
                  className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
