'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export function CompanyFooter() {
  return (
    <footer className="border-t border-fd-border bg-fd-card/50 text-fd-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Logo className="size-8" />
              <span className="text-xl font-bold tracking-tight text-fd-foreground">
                Innostes
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fd-muted-foreground">
              The extensible business operating system. Unify company operations, revenue, workforce,
              and developer infrastructure on a modular, decoupled core. 100% free to self-host with zero per-seat fees.
            </p>
            <div className="mt-6 flex items-center gap-3 font-mono text-xs text-fd-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Kernel Architecture: 0 Circular Dependencies</span>
            </div>
          </div>

          {/* Column 1: Business Suites */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-fd-foreground">
              Business Suites
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/modules/salesflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  SalesFlow (Revenue & CRM)
                </Link>
              </li>
              <li>
                <Link href="/modules/peopleops" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  PeopleOps (Workforce & HR)
                </Link>
              </li>
              <li>
                <Link href="/modules/hireflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  HireFlow (Recruitment & ATS)
                </Link>
              </li>
              <li>
                <Link href="/modules/ledgerflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  LedgerFlow (Finance & Billing)
                </Link>
              </li>
              <li>
                <Link href="/modules/stockflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  StockFlow (Warehouse & Inventory)
                </Link>
              </li>
              <li>
                <Link href="/modules/sprintflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  SprintFlow (Agile & Issues)
                </Link>
              </li>
              <li>
                <Link href="/modules/docflow" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  DocFlow (Living SOPs & Docs)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Developer Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-fd-foreground">
              Developer Tools
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/ui" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  @innostes/ui Design System
                </Link>
              </li>
              <li>
                <Link href="/plugins/tracura" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Tracura API Telemetry
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Developer Documentation
                </Link>
              </li>
              <li>
                <Link href="/api-reference" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  OpenAPI 3.1 REST Reference
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/innostes-dev/erp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Services & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-fd-foreground">
              Services & Trust
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/services" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Assisted Cloud Deployment
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Custom Module Engineering
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Data Migration Consulting
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/threat-model" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Security & Multi-Tenancy
                </Link>
              </li>
              <li>
                <Link href="/docs/architecture/audit-trail" className="text-fd-muted-foreground transition-colors hover:text-fd-foreground">
                  Cryptographic Audit Trail
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-fd-border pt-8 text-xs text-fd-muted-foreground sm:flex-row">
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
