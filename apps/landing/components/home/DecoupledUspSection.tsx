'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  LayoutTemplate,
  Monitor,
  Package,
  Server,
  Zap,
} from 'lucide-react';

export function DecoupledUspSection() {
  return (
    <section className="border-b border-fd-border py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="size-3.5" />
            Architectural Freedom
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
            Built as a Complete Platform. Engineered to Work Headlessly.
          </h2>
          <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
            Traditional enterprise software traps your business inside rigid, closed interfaces.
            Innostes enforces strict boundary inversion: the backend is a standalone, multi-tenant API engine,
            and the frontend is an independent consumer.
          </p>
        </div>

        {/* The 3 Pillars */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {/* Pillar 1 */}
          <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs transition-all hover:border-blue-500/40 hover:shadow-lg">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Monitor className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-fd-foreground">
                Turnkey Full-Stack Application
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
                Launch our ready-to-use Next.js application built on the <code className="font-mono text-xs">@innostes/ui</code> design system.
                Includes dark and light themes, keyboard shortcuts, dense tabular controls, and unified system navigation.
              </p>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <span className="text-xs font-medium text-fd-muted-foreground">
                Ideal for teams wanting an immediate operational system on day one.
              </span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col justify-between rounded-3xl border-2 border-emerald-500/60 bg-fd-card p-8 shadow-md transition-all hover:border-emerald-500 hover:shadow-xl">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Server className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-fd-foreground">
                Headless Multi-Tenant Backend
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
                Strip away our web frontend entirely. Consume our FastAPI backend strictly via OpenAPI 3.1 REST schemas
                to power your own custom internal portals, client dashboards, or mobile applications.
              </p>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <span className="text-xs font-medium text-fd-muted-foreground">
                Ideal for engineering teams with bespoke UI and integration requirements.
              </span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs transition-all hover:border-purple-500/40 hover:shadow-lg">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Package className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-fd-foreground">
                Standalone @innostes/ui Framework
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground">
                Our design system is an independent package. Install <code className="font-mono text-xs">@innostes/ui</code> into
                any external React or Next.js project to leverage 240+ WCAG-accessible components, Kanban boards, and charts.
              </p>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <Link
                href="/ui"
                className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline dark:text-purple-400"
              >
                <span>Explore Design System</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
