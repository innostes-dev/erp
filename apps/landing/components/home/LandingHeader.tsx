'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@innostes/ui';
import { Logo } from '@/components/logo';
import { useQuoteModal } from './QuoteModalContext';
import { FullSearchTrigger, SearchTrigger } from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  BookOpen,
  Blocks,
  ChevronDown,
  Cpu,
  DollarSign,
  FileText,
  FolderGit2,
  Layers,
  Menu,
  Moon,
  Palette,
  Rocket,
  Server,
  ShieldCheck,
  Sun,
  Terminal,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

interface NavItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const BUSINESS_SUITES: NavItem[] = [
  {
    title: 'SalesFlow',
    description: 'CRM, deals pipeline, probability forecasting & quotes.',
    href: '/modules/salesflow',
    icon: <TrendingUp className="size-4 text-blue-500" />,
    badge: 'CRM',
  },
  {
    title: 'PeopleOps',
    description: 'Workforce directory, org charts, leave approvals & payroll.',
    href: '/modules/peopleops',
    icon: <Users className="size-4 text-emerald-500" />,
    badge: 'HRMS',
  },
  {
    title: 'HireFlow',
    description: 'Candidate pipelines, resume indexing & structured scorecards.',
    href: '/modules/hireflow',
    icon: <Briefcase className="size-4 text-purple-500" />,
    badge: 'ATS',
  },
  {
    title: 'LedgerFlow',
    description: 'Double-entry general ledger, invoicing & reconciliation.',
    href: '/modules/ledgerflow',
    icon: <DollarSign className="size-4 text-amber-500" />,
    badge: 'Finance',
  },
  {
    title: 'StockFlow',
    description: 'Multi-warehouse stock, batches, lots & purchase orders.',
    href: '/modules/stockflow',
    icon: <Boxes className="size-4 text-cyan-500" />,
    badge: 'Inventory',
  },
  {
    title: 'SprintFlow',
    description: 'Sprint planning cadences, Kanban boards & issue tracking.',
    href: '/modules/sprintflow',
    icon: <FolderGit2 className="size-4 text-indigo-500" />,
    badge: 'Agile',
  },
  {
    title: 'DocFlow',
    description: 'Centralized SOPs, engineering handbooks & markdown wiki.',
    href: '/modules/docflow',
    icon: <FileText className="size-4 text-rose-500" />,
    badge: 'Wiki',
  },
];

const DEV_TOOLS: NavItem[] = [
  {
    title: '@innostes/ui Component Library',
    description: 'Standalone 240+ WCAG-accessible React primitives with Base UI.',
    href: '/ui',
    icon: <Layers className="size-4 text-purple-500" />,
    badge: 'React 19',
  },
  {
    title: 'Tracura API Telemetry Engine',
    description: 'Universal 10k+ req/s sub-millisecond ring buffer observability.',
    href: '/plugins/tracura',
    icon: <Activity className="size-4 text-emerald-500" />,
    badge: 'Observability',
  },
  {
    title: 'REST OpenAPI 3.1 Specification',
    description: 'Decoupled headless backend contracts, endpoints & models.',
    href: '/api-reference',
    icon: <Server className="size-4 text-blue-500" />,
    badge: 'Headless',
  },
];

const ARCHITECTURE_LINKS: NavItem[] = [
  {
    title: 'Decoupled Two-Engine Architecture',
    description: 'Deploy the turnkey UI or consume the backend headlessly via REST.',
    href: '/docs/architecture/building-blocks',
    icon: <Cpu className="size-4 text-blue-500" />,
  },
  {
    title: 'Hardened Platform Kernel',
    description: 'Multi-tenant database isolation, cryptographic audit trails & RBAC.',
    href: '/docs/architecture/kernel',
    icon: <ShieldCheck className="size-4 text-emerald-500" />,
  },
  {
    title: 'Plug-in Integration Contract',
    description: 'Dynamic Python entry points and React manifest discovery system.',
    href: '/docs/architecture/plugin-contract',
    icon: <Blocks className="size-4 text-purple-500" />,
  },
];

const DOCS_LINKS: NavItem[] = [
  {
    title: 'Developer Documentation',
    description: 'Architecture handbook, arc42 blueprints, and dev guides.',
    href: '/docs',
    icon: <BookOpen className="size-4 text-blue-500" />,
  },
  {
    title: 'Interactive API Reference',
    description: 'Searchable REST endpoints with OpenAPI 3.1 live explorer.',
    href: '/api-reference',
    icon: <Terminal className="size-4 text-emerald-500" />,
  },
  {
    title: 'Design System & Component Docs',
    description: 'Token visualizers, live component sandboxes, and APCA specs.',
    href: '/ui/docs',
    icon: <Palette className="size-4 text-purple-500" />,
  },
  {
    title: 'Tracura Telemetry Handbook',
    description: 'Telemetry ingestion SDKs, scoped API keys & retention setup.',
    href: '/plugins/tracura/docs',
    icon: <Activity className="size-4 text-amber-500" />,
  },
  {
    title: 'Quickstart & Installation',
    description: 'Launch Innostes with Docker Compose or monorepo in 2 minutes.',
    href: '/docs/getting-started',
    icon: <Rocket className="size-4 text-rose-500" />,
    badge: 'Quickstart',
  },
];

type MenuKey = 'suites' | 'tools' | 'architecture' | 'docs' | null;

export function LandingHeader() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { openQuote } = useQuoteModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on path navigation
  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
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

  const handleMouseEnter = (menu: MenuKey) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const toggleMenu = (menu: MenuKey) => {
    setActiveMenu(activeMenu === menu ? null : menu);
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
          <span className="hidden items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 sm:inline-flex">
            Business OS
          </span>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex lg:items-center lg:gap-1" aria-label="Main Navigation">
          {/* Item 1: Business Suites Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('suites')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => toggleMenu('suites')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeMenu === 'suites'
                  ? 'bg-fd-accent text-fd-accent-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
              }`}
              aria-expanded={activeMenu === 'suites'}
            >
              <span>Business Suites</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  activeMenu === 'suites' ? 'rotate-180 text-fd-primary' : ''
                }`}
              />
            </button>

            {/* Mega Menu Dropdown Panel */}
            {activeMenu === 'suites' && (
              <div
                className="absolute left-1/2 top-full mt-2 w-[680px] -translate-x-1/2 rounded-2xl border border-fd-border bg-fd-popover p-4 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
                onMouseEnter={() => handleMouseEnter('suites')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_SUITES.map((suite) => (
                    <Link
                      key={suite.href}
                      href={suite.href}
                      onClick={() => setActiveMenu(null)}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-fd-accent"
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background transition-colors group-hover:border-fd-primary/30">
                        {suite.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary">
                            {suite.title}
                          </span>
                          {suite.badge && (
                            <span className="rounded bg-fd-secondary px-1.5 py-0.2 text-[10px] font-medium text-fd-muted-foreground">
                              {suite.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-fd-muted-foreground">
                          {suite.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Dropdown Footer Banner */}
                <div className="mt-3 flex items-center justify-between border-t border-fd-border/70 pt-3">
                  <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Decoupled domain architecture • Zero cross-module coupling</span>
                  </div>
                  <Link
                    href="/modules"
                    onClick={() => setActiveMenu(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-fd-primary hover:underline"
                  >
                    View All 7 Suites Directory <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Item 2: Developer Tools Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('tools')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => toggleMenu('tools')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeMenu === 'tools'
                  ? 'bg-fd-accent text-fd-accent-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
              }`}
              aria-expanded={activeMenu === 'tools'}
            >
              <span>Developer Tools</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  activeMenu === 'tools' ? 'rotate-180 text-fd-primary' : ''
                }`}
              />
            </button>

            {activeMenu === 'tools' && (
              <div
                className="absolute left-1/2 top-full mt-2 w-96 -translate-x-1/2 rounded-2xl border border-fd-border bg-fd-popover p-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
                onMouseEnter={() => handleMouseEnter('tools')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex flex-col gap-1">
                  {DEV_TOOLS.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setActiveMenu(null)}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-fd-accent"
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background">
                        {tool.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary">
                            {tool.title}
                          </span>
                          {tool.badge && (
                            <span className="rounded bg-fd-secondary px-1.5 py-0.2 text-[10px] font-medium text-fd-muted-foreground">
                              {tool.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-fd-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Item 3: Architecture Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('architecture')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => toggleMenu('architecture')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeMenu === 'architecture'
                  ? 'bg-fd-accent text-fd-accent-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
              }`}
              aria-expanded={activeMenu === 'architecture'}
            >
              <span>Architecture</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  activeMenu === 'architecture' ? 'rotate-180 text-fd-primary' : ''
                }`}
              />
            </button>

            {activeMenu === 'architecture' && (
              <div
                className="absolute left-1/2 top-full mt-2 w-96 -translate-x-1/2 rounded-2xl border border-fd-border bg-fd-popover p-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
                onMouseEnter={() => handleMouseEnter('architecture')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex flex-col gap-1">
                  {ARCHITECTURE_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveMenu(null)}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-fd-accent"
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary">
                          {item.title}
                        </span>
                        <p className="mt-0.5 text-xs text-fd-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Item 4: Services & Pricing (Direct Link) */}
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

          {/* Item 5: Documentation Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter('docs')}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => toggleMenu('docs')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeMenu === 'docs'
                  ? 'bg-fd-accent text-fd-accent-foreground'
                  : 'text-fd-muted-foreground hover:bg-fd-accent/60 hover:text-fd-foreground'
              }`}
              aria-expanded={activeMenu === 'docs'}
            >
              <span>Docs</span>
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${
                  activeMenu === 'docs' ? 'rotate-180 text-fd-primary' : ''
                }`}
              />
            </button>

            {activeMenu === 'docs' && (
              <div
                className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-fd-border bg-fd-popover p-3 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
                onMouseEnter={() => handleMouseEnter('docs')}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex flex-col gap-1">
                  {DOCS_LINKS.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      onClick={() => setActiveMenu(null)}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-fd-accent"
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-background">
                        {doc.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-fd-foreground group-hover:text-fd-primary">
                            {doc.title}
                          </span>
                          {doc.badge && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {doc.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-fd-muted-foreground">
                          {doc.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Side: Search, GitHub, Theme, CTAs */}
        <div className="flex items-center gap-2">
          {/* Fumadocs Search Trigger */}
          <div className="hidden sm:block">
            <FullSearchTrigger className="h-9 w-36 max-w-xs text-xs md:w-44" />
          </div>
          <div className="sm:hidden">
            <SearchTrigger className="size-9 rounded-lg border border-fd-border bg-fd-secondary/50" />
          </div>

          {/* GitHub Icon Link */}
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

          {/* Secondary Action: Request Quote */}
          <button
            onClick={() => openQuote()}
            className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold text-fd-foreground transition-colors hover:bg-fd-accent md:inline-flex"
          >
            Request Quote
          </button>

          {/* Primary Action: Deploy Free */}
          <Button
            size="sm"
            render={<Link href="/docs/getting-started" />}
            nativeButton={false}
            className="shadow-sm"
          >
            Deploy Free (0 Rs)
          </Button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-fd-border p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground lg:hidden"
            aria-label="Toggle Mobile Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col overflow-y-auto border-t border-fd-border bg-fd-background p-6 shadow-2xl lg:hidden">
          <div className="flex flex-col gap-6">
            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                size="md"
                render={<Link href="/docs/getting-started" onClick={() => setMobileOpen(false)} />}
                nativeButton={false}
                className="w-full justify-center text-center"
              >
                Deploy Free (0 Rs)
              </Button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openQuote();
                }}
                className="w-full rounded-lg border border-fd-border bg-fd-secondary/50 py-2.5 text-center text-sm font-semibold text-fd-foreground hover:bg-fd-accent"
              >
                Request a Custom Quote
              </button>
            </div>

            {/* Accordion Group 1: Business Suites */}
            <div className="border-t border-fd-border/70 pt-4">
              <button
                onClick={() =>
                  setMobileExpanded(mobileExpanded === 'suites' ? null : 'suites')
                }
                className="flex w-full items-center justify-between py-1 text-sm font-bold uppercase tracking-wider text-fd-foreground"
              >
                <span>Business Suites (7 Modules)</span>
                <ChevronDown
                  className={`size-4 transition-transform ${
                    mobileExpanded === 'suites' ? 'rotate-180 text-fd-primary' : ''
                  }`}
                />
              </button>
              {(mobileExpanded === 'suites' || mobileExpanded === null) && (
                <div className="mt-2 grid grid-cols-1 gap-1.5 pl-2">
                  {BUSINESS_SUITES.map((suite) => (
                    <Link
                      key={suite.href}
                      href={suite.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-lg p-2 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                    >
                      <div className="flex items-center gap-2.5">
                        {suite.icon}
                        <span className="font-medium">{suite.title}</span>
                      </div>
                      {suite.badge && (
                        <span className="rounded bg-fd-secondary px-1.5 py-0.5 text-[10px] font-medium text-fd-muted-foreground">
                          {suite.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                  <Link
                    href="/modules"
                    onClick={() => setMobileOpen(false)}
                    className="mt-1 flex items-center gap-1.5 p-2 text-xs font-semibold text-fd-primary"
                  >
                    View All 7 Suites Directory <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Accordion Group 2: Developer Tools */}
            <div className="border-t border-fd-border/70 pt-4">
              <button
                onClick={() =>
                  setMobileExpanded(mobileExpanded === 'tools' ? null : 'tools')
                }
                className="flex w-full items-center justify-between py-1 text-sm font-bold uppercase tracking-wider text-fd-foreground"
              >
                <span>Developer Infrastructure</span>
                <ChevronDown
                  className={`size-4 transition-transform ${
                    mobileExpanded === 'tools' ? 'rotate-180 text-fd-primary' : ''
                  }`}
                />
              </button>
              {mobileExpanded === 'tools' && (
                <div className="mt-2 flex flex-col gap-1 pl-2">
                  {DEV_TOOLS.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg p-2 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                    >
                      {tool.icon}
                      <span className="font-medium">{tool.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion Group 3: Architecture & Docs */}
            <div className="border-t border-fd-border/70 pt-4">
              <button
                onClick={() =>
                  setMobileExpanded(mobileExpanded === 'docs' ? null : 'docs')
                }
                className="flex w-full items-center justify-between py-1 text-sm font-bold uppercase tracking-wider text-fd-foreground"
              >
                <span>Documentation & Guides</span>
                <ChevronDown
                  className={`size-4 transition-transform ${
                    mobileExpanded === 'docs' ? 'rotate-180 text-fd-primary' : ''
                  }`}
                />
              </button>
              {mobileExpanded === 'docs' && (
                <div className="mt-2 flex flex-col gap-1 pl-2">
                  {DOCS_LINKS.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg p-2 text-sm text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
                    >
                      {doc.icon}
                      <span className="font-medium">{doc.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Link: Services & Pricing */}
            <div className="border-t border-fd-border/70 pt-4">
              <Link
                href="/services"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between py-1 text-sm font-bold uppercase tracking-wider text-fd-foreground hover:text-fd-primary"
              >
                <span>Services & Deployment Pricing</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
