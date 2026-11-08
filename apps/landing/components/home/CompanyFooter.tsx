'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/logo';

export function CompanyFooter() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === 'dark' : false;

  return (
    <footer className="border-t border-border bg-card text-foreground dark:border-white/10   transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Logo className="h-7" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground ">
              Open-source business operating system and custom software, from the INNOSTES team.
              Free to self-host, with no per-seat fees.
            </p>
            <div className="mt-6 flex items-center gap-2.5 font-mono text-xs text-muted-foreground ">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span>Innovative systems for growing companies</span>
            </div>
          </div>

          {/* Column 1: Business Suites */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white">
              Business Suites
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/modules/salesflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  SalesFlow (Revenue &amp; CRM)
                </Link>
              </li>
              <li>
                <Link href="/modules/peopleops" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  PeopleOps (Workforce &amp; HR)
                </Link>
              </li>
              <li>
                <Link href="/modules/hireflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  HireFlow (Recruitment &amp; ATS)
                </Link>
              </li>
              <li>
                <Link href="/modules/ledgerflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  LedgerFlow (Finance &amp; Billing)
                </Link>
              </li>
              <li>
                <Link href="/modules/stockflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  StockFlow (Warehouse &amp; Stock)
                </Link>
              </li>
              <li>
                <Link href="/modules/sprintflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  SprintFlow (Agile &amp; Issues)
                </Link>
              </li>
              <li>
                <Link href="/modules/docflow" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  DocFlow (Living SOPs &amp; Docs)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Developer Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white">
              Developer Tools
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/ui" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Enterprise Design System
                </Link>
              </li>
              <li>
                <Link href="/plugins/tracura" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Tracura API Telemetry
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Developer Documentation
                </Link>
              </li>
              <li>
                <Link href="/api-reference" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  OpenAPI 3.1 REST Reference
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/innostes-dev/erp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white">
              Services &amp; Trust
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Assisted Cloud Deployment
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Custom Module Engineering
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Data Migration Consulting
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/threat-model" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Security &amp; Multi-Tenancy
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/audit-trail" className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white">
                  Cryptographic Audit Trail
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground dark:border-white/10 md:flex-row">
          <div>
            © {new Date().getFullYear()} Innostes. All rights reserved.
          </div>

          {/* Theme Switcher in Footer */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground ">Theme:</span>
            <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 dark:border-white/10 dark:bg-card ">
              <button
                onClick={() => setTheme('light')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  mounted && !isDark
                    ? 'bg-brand-navy text-white dark:bg-card  shadow-xs'
                    : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                }`}
                aria-label="Light Theme"
              >
                <Sun className="size-3.5 text-warning-text" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  mounted && isDark
                    ? 'bg-brand-navy text-white dark:bg-card  shadow-xs'
                    : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                }`}
                aria-label="Dark Theme"
              >
                <Moon className="size-3.5 text-primary" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <span>FastAPI + Next.js 15</span>
            <span>•</span>
            <span>PostgreSQL 16</span>
            <span>•</span>
            <span>Decoupled Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
