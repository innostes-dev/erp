'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export function CompanyFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 text-slate-900 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Logo className="size-8 transition-transform group-hover:scale-105" />
              <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                innostes
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              The extensible business operating system. Unify company operations, revenue, workforce,
              and developer infrastructure on a modular, decoupled core. 100% free to self-host with zero per-seat fees.
            </p>
            <div className="mt-6 flex items-center gap-2.5 font-mono text-xs text-slate-500 dark:text-slate-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Decoupled Architecture · 0 Circular Dependencies</span>
            </div>
          </div>

          {/* Column 1: Business Suites */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              Business Suites
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/modules/salesflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  SalesFlow (Revenue &amp; CRM)
                </Link>
              </li>
              <li>
                <Link href="/modules/peopleops" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  PeopleOps (Workforce &amp; HR)
                </Link>
              </li>
              <li>
                <Link href="/modules/hireflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  HireFlow (Recruitment &amp; ATS)
                </Link>
              </li>
              <li>
                <Link href="/modules/ledgerflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  LedgerFlow (Finance &amp; Billing)
                </Link>
              </li>
              <li>
                <Link href="/modules/stockflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  StockFlow (Warehouse &amp; Stock)
                </Link>
              </li>
              <li>
                <Link href="/modules/sprintflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  SprintFlow (Agile &amp; Issues)
                </Link>
              </li>
              <li>
                <Link href="/modules/docflow" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  DocFlow (Living SOPs &amp; Docs)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Developer Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              Developer Tools
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/ui" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  @innostes/ui Framework
                </Link>
              </li>
              <li>
                <Link href="/plugins/tracura" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Tracura API Telemetry
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Developer Documentation
                </Link>
              </li>
              <li>
                <Link href="/api-reference" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  OpenAPI 3.1 REST Reference
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/innostes-dev/erp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">
              Services &amp; Trust
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/services" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Assisted Cloud Deployment
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Custom Module Engineering
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Data Migration Consulting
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/threat-model" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Security &amp; Multi-Tenancy
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/audit-trail" className="text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                  Cryptographic Audit Trail
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Innostes. All rights reserved. 100% Free Self-Hosted Business OS.
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
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
