'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Search, Bell, ChevronDown, BarChart2, Code2 } from 'lucide-react';
import { useAuth } from '@mono/kernel/auth';
import { useOnClickOutside } from '@mono/shared/hooks';
import { MODULES } from '../lib/modules';
import { MODULE_ICONS } from '../lib/module-icons';
import { cn } from '../lib/cn';

export function WorkspaceTopbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setMenuOpen(false));
  useOnClickOutside(switcherRef, () => setSwitcherOpen(false));

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">

        {/* App switcher (waffle) */}
        <div className="relative shrink-0" ref={switcherRef}>
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              switcherOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            )}
            title="Switch module"
          >
            <LayoutGrid className="h-4.5 w-4.5" size={18} />
          </button>

          {switcherOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 origin-top-left rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-gray-900/5 animate-fade-in z-50">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Switch to</p>
              </div>
              <div className="p-2">
                {MODULES.map((mod) => {
                  const Icon = MODULE_ICONS[mod.id] ?? BarChart2;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => { router.push(mod.route); setSwitcherOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm', mod.gradient)}>
                        <Icon className={cn('h-5 w-5', mod.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{mod.name}</p>
                        <p className="truncate text-xs text-gray-500">{mod.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => { router.push('/'); setSwitcherOpen(false); }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  View all modules →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 shrink-0 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">Mono</span>
        </button>

        <div className="h-5 w-px bg-gray-200 shrink-0" />

        {/* Search */}
        <div className="flex flex-1 items-center px-2">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules, settings…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-12 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 shadow-sm">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.push('/developer/api')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="API Docs"
          >
            <Code2 size={16} />
          </button>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white shadow-sm">
                {initials}
              </div>
              <span className="hidden font-medium text-gray-700 sm:block">{user.name}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-gray-900/5 animate-fade-in z-50">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { router.push('/'); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    All modules
                  </button>
                  <button
                    onClick={() => { void logout().then(() => { window.location.href = '/login'; }); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
