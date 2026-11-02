'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileText,
  FolderGit2,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { MODULES_DATA } from '@/lib/modules-data';

export function ModuleMatrixSection() {
  const modulesList = Object.values(MODULES_DATA);

  return (
    <section id="modules" className="border-b border-fd-border py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="size-3.5" />
            Independent Domain Suites
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
            All the Tools Your Business Operations Need
          </h2>
          <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
            Activate only what your organization requires. Every business suite runs with independent
            domain schemas, strict OpenAPI contracts, and zero circular dependencies. Click any suite to explore its dedicated capabilities.
          </p>
        </div>

        {/* The Modules Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modulesList.map((mod) => (
            <Link
              key={mod.slug}
              href={`/modules/${mod.slug}`}
              className="group flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {mod.badge}
                  </span>
                  <span className="font-mono text-xs text-fd-muted-foreground">0 Rs Self-Hosted</span>
                </div>

                <h3 className="mt-5 text-xl font-bold tracking-tight text-fd-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {mod.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-fd-foreground/80">
                  {mod.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground line-clamp-3">
                  {mod.heroDescription}
                </p>

                {/* Highlight Stats Pill */}
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-muted/30 p-2 font-mono text-[11px] text-fd-muted-foreground">
                  <span className="font-bold text-fd-foreground">{mod.stats[0]?.label}:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{mod.stats[0]?.value}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>View {mod.name} Landing Page</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}

          {/* Dedicated Tracura Card */}
          <Link
            href="/plugins/tracura"
            className="group flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Developer Infrastructure
                </span>
                <span className="font-mono text-xs text-fd-muted-foreground">Universal Ingestion</span>
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-fd-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Tracura
              </h3>
              <p className="mt-1 text-xs font-medium text-fd-foreground/80">
                High-Throughput Distributed API Telemetry Engine
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground line-clamp-3">
                Ingest 10,000+ requests/sec across microservices, serverless functions, and AI agent pipelines with a sub-millisecond ring buffer. 100% self-hosted and PII-scrubbed.
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-muted/30 p-2 font-mono text-[11px] text-fd-muted-foreground">
                <span className="font-bold text-fd-foreground">Throughput:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">10,000+ req/s</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>View Tracura Telemetry Page</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Dedicated @innostes/ui Card */}
          <Link
            href="/ui"
            className="group flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/50 hover:shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  Developer Framework
                </span>
                <span className="font-mono text-xs text-fd-muted-foreground">Standalone Package</span>
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-fd-foreground transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                @innostes/ui
              </h3>
              <p className="mt-1 text-xs font-medium text-fd-foreground/80">
                Standalone Enterprise Component Library
              </p>
              <p className="mt-3 text-sm leading-relaxed text-fd-muted-foreground line-clamp-3">
                An exclusive component system with 240+ WCAG-accessible components, Kanban boards, data tables, and Cartesian/Donut charts that developers can install into any project.
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-muted/30 p-2 font-mono text-[11px] text-fd-muted-foreground">
                <span className="font-bold text-fd-foreground">Components:</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">240+ Production Ready</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>View UI Framework Docs</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
