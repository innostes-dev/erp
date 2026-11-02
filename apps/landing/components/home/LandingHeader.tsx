'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@innostes/ui';
import { Logo } from '@/components/logo';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

const FEATURED_MODULES = [
  {
    title: 'SalesFlow',
    description: 'CRM, deals pipeline, probability forecasting & quotes.',
    href: '/modules/salesflow',
    icon: <TrendingUp className="size-4 text-blue-500" />,
  },
  {
    title: 'PeopleOps',
    description: 'Workforce directory, org charts, leave approvals & payroll.',
    href: '/modules/peopleops',
    icon: <Users className="size-4 text-emerald-500" />,
  },
  {
    title: 'Tracura',
    description: 'Universal API telemetry, distributed tracing & request logging.',
    href: '/plugins/tracura',
    icon: <Activity className="size-4 text-purple-500" />,
  },
];

export function LandingHeader() {
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on path navigation
  useEffect(() => {
    setModulesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Click outside and escape key handling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModulesOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModulesOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setModulesOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setModulesOpen(false);
    }, 250);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full border-b border-fd-border/70 bg-fd-background/80 backdrop-blur-xl transition-[background-color,border-color] duration-200 supports-backdrop-filter:bg-fd-background/60"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo className="size-7 transition-transform group-hover:scale-105" />
            <span className="text-lg font-bold tracking-tight text-fd-foreground">
              innostes
            </span>
          </Link>
          <span className="hidden items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 sm:inline-flex">
            Business OS
          </span>
        </div>

        {/* Center: Essential Navigation Links */}
        <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Main Navigation">
          {/* Modules Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setModulesOpen((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                modulesOpen
                  ? 'bg-fd-accent text-fd-accent-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
              }`}
              aria-expanded={modulesOpen}
            >
              <span>Modules</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  modulesOpen ? 'rotate-180 text-fd-primary' : ''
                }`}
              />
            </button>

            {/* Compact Modules Panel with zero-gap hit bridge */}
            {modulesOpen && (
              <div
                className="absolute left-0 top-full z-50 pt-1.5 w-80 animate-in fade-in-0 duration-150"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="rounded-2xl border border-fd-border bg-fd-popover p-2 shadow-2xl">
                  <div className="flex flex-col gap-1">
                    {FEATURED_MODULES.map((mod) => (
                      <Link
                        key={mod.href}
                        href={mod.href}
                        onClick={() => setModulesOpen(false)}
                        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-fd-accent"
                      >
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background">
                          {mod.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary">
                            {mod.title}
                          </span>
                          <p className="mt-0.5 line-clamp-1 text-xs text-fd-muted-foreground">
                            {mod.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-fd-border/70 pt-2">
                    <Link
                      href="/modules"
                      onClick={() => setModulesOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-fd-primary hover:bg-fd-accent"
                    >
                      <span>View All Suites & Plugins</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Architecture */}
          <Link
            href="/docs/architecture/building-blocks"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith('/docs/architecture')
                ? 'text-fd-primary'
                : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
            }`}
          >
            Architecture
          </Link>

          {/* Docs */}
          <Link
            href="/docs"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith('/docs') && !pathname.startsWith('/docs/architecture')
                ? 'text-fd-primary'
                : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
            }`}
          >
            Docs
          </Link>

          {/* Services */}
          <Link
            href="/services"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/services'
                ? 'text-fd-primary'
                : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
            }`}
          >
            Services & Pricing
          </Link>
        </nav>

        {/* Right Side: GitHub, Theme, Deploy Free */}
        <div className="flex items-center gap-2.5">
          {/* GitHub Repository Link */}
          <a
            href="https://github.com/innostes-dev/erp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-fd-border bg-fd-secondary/30 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
            aria-label="View on GitHub"
            title="GitHub Repository"
          >
            <svg className="size-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>

          {/* Theme Switcher Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-fd-border bg-fd-secondary/30 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
              aria-label="Toggle Theme"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-blue-600" />
              )}
            </button>
          )}

          {/* Primary Action: Deploy Free */}
          <Button
            size="sm"
            render={<Link href="/docs/getting-started" />}
            nativeButton={false}
            className="shadow-sm font-semibold"
          >
            Deploy Free
          </Button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-fd-border p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground md:hidden"
            aria-label="Toggle Mobile Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Clean Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-fd-border bg-fd-background p-4 shadow-xl md:hidden">
          <nav className="flex flex-col gap-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground px-3 pt-2">
              Featured Modules
            </div>
            {FEATURED_MODULES.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
              >
                {mod.icon}
                <span>{mod.title}</span>
              </Link>
            ))}
            <Link
              href="/modules"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-fd-primary hover:bg-fd-accent"
            >
              <span>View All Modules Directory</span>
              <ArrowRight className="size-3.5" />
            </Link>

            <div className="my-2 border-t border-fd-border/70" />

            <Link
              href="/docs/architecture/building-blocks"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Architecture
            </Link>

            <Link
              href="/docs"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Documentation
            </Link>

            <Link
              href="/services"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Services & Pricing
            </Link>

            <div className="mt-2 pt-2 border-t border-fd-border/70">
              <Button
                size="md"
                render={<Link href="/docs/getting-started" onClick={() => setMobileOpen(false)} />}
                nativeButton={false}
                className="w-full justify-center font-semibold"
              >
                Deploy Free (0 Rs)
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
