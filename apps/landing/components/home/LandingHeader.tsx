'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@innostes/ui';
import { Logo } from '@/components/logo';
import { useQuoteModal } from './QuoteModalContext';
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
    icon: <TrendingUp className="size-4 text-primary" />,
  },
  {
    title: 'PeopleOps',
    description: 'Workforce directory, org charts, leave approvals & payroll.',
    href: '/modules/peopleops',
    icon: <Users className="size-4 text-success-text" />,
  },
  {
    title: 'Tracura API Telemetry',
    description: 'Real-time API observability, request tracing & payload logging.',
    href: '/plugins/tracura',
    icon: <Activity className="size-4 text-muted-foreground" />,
  },
];

export function LandingHeader() {
  const { openQuote } = useQuoteModal();
  const [modulesOpen, setModulesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMouseEnterRef = useRef<number>(0);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = mounted ? (resolvedTheme || theme) === 'dark' : false;

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
    lastMouseEnterRef.current = Date.now();
    setModulesOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setModulesOpen(false);
    }, 250);
  };

  // On the homepage the bar sits transparently over the navy hero, then turns solid once you scroll.
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);
  const overHero = isHome && !scrolled && !mobileOpen;

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header
      ref={headerRef}
      data-over-hero={overHero || undefined}
      className={`sticky top-0 z-40 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        isHome ? '-mb-16' : ''
      } ${
        overHero
          ? 'dark border-transparent bg-transparent'
          : 'border-border bg-card/90 shadow-xs backdrop-blur-md dark:border-white/5'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo className="h-7" />
          </Link>
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
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                const timeSinceHover = Date.now() - lastMouseEnterRef.current;
                if (!modulesOpen) {
                  setModulesOpen(true);
                } else if (timeSinceHover > 400) {
                  setModulesOpen(false);
                } else {
                  setModulesOpen(true);
                }
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

          {/* Docs */}

          {/* Custom builds */}
          <Link
            href="/build"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/build'
                ? 'text-fd-primary'
                : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
            }`}
          >
            Custom builds
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
            Pricing
          </Link>

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
        </nav>

        {/* Right side: self-host link, GitHub, theme, Book a demo */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Secondary: self-host, as a quiet text link */}
          <Link
            href="/docs/getting-started"
            className="hidden lg:inline-flex rounded-md px-2 py-1.5 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            Self-host free
          </Link>

          {/* GitHub Repository Link */}
          <a
            href="https://github.com/innostes-dev/erp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-8 sm:size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-card dark:hover:bg-card dark:hover:text-white"
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
          <button
            onClick={toggleTheme}
            className="inline-flex size-8 sm:size-9 items-center justify-center rounded-full border border-border bg-card text-strong-foreground shadow-2xs transition-all hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-card  dark:hover:bg-card cursor-pointer"
            aria-label={mounted ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle theme'}
            title={mounted ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle theme'}
          >
            {mounted ? (
              isDark ? (
                <Sun className="size-4 text-warning transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="size-4 text-strong-foreground transition-transform duration-200 hover:-rotate-12" />
              )
            ) : (
              <span className="size-4 rounded-full bg-border animate-pulse" />
            )}
          </button>

          {/* Primary action: Book a demo */}
          <button
            type="button"
            onClick={() => openQuote('Innostes Business OS')}
            className="hidden h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex"
          >
            Book a demo
          </button>

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
              href="/docs"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Documentation
            </Link>

            <Link
              href="/build"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Custom builds
            </Link>

            <Link
              href="/services"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
            >
              Pricing
            </Link>

            {/* Mobile Theme Selector */}
            <div className="my-2 rounded-2xl border border-border bg-muted p-3 dark:border-white/10 dark:bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-strong-foreground ">
                  {mounted && isDark ? (
                    <Moon className="size-4 text-warning" />
                  ) : (
                    <Sun className="size-4 text-warning-text" />
                  )}
                  <span>Appearance</span>
                </div>
                <div className="inline-flex rounded-full border border-border bg-card p-0.5 dark:border-white/10 ">
                  <button
                    onClick={() => setTheme('light')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      mounted && !isDark
                        ? 'bg-brand-navy text-white dark:bg-card  shadow-xs'
                        : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      mounted && isDark
                        ? 'bg-brand-navy text-white dark:bg-card  shadow-xs'
                        : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-1 pt-2 border-t border-fd-border/70">
              <Button
                size="md"
                onClick={() => {
                  setMobileOpen(false);
                  openQuote('Innostes Business OS');
                }}
                className="w-full justify-center font-semibold"
              >
                Book a demo
              </Button>
              <Link
                href="/docs/getting-started"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-lg px-3 py-2 text-center text-sm font-medium text-fd-muted-foreground hover:text-fd-foreground"
              >
                Or self-host for free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
