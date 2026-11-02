import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@innostes/ui';
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
  Users,
} from 'lucide-react';
import { MODULES_DATA } from '@/lib/modules-data';

export const metadata: Metadata = {
  title: 'Business Suites & Infrastructure Modules | Innostes Business OS',
  description:
    'Explore the modular business suites and developer infrastructure plugins that power Innostes. Deploy full-stack or consume headlessly.',
};

export default function ModulesDirectoryPage() {
  const modulesList = Object.values(MODULES_DATA);

  return (
    <div className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-fd-border py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="size-3.5" />
            Modular Architecture
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-fd-foreground sm:text-5xl">
            Modular Business Suites & Plugins
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fd-muted-foreground">
            Activate only what your organization needs. Every suite operates with independent domain models,
            strict OpenAPI contracts, and zero circular dependencies.
          </p>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modulesList.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {mod.badge}
                    </span>
                    <span className="text-xs text-fd-muted-foreground">{mod.category}</span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-fd-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {mod.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-fd-muted-foreground">
                    {mod.tagline}
                  </p>
                  <p className="mt-3 text-sm text-fd-muted-foreground line-clamp-3">
                    {mod.heroDescription}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4">
                  <span className="font-mono text-xs text-fd-muted-foreground">
                    0 Rs Self-Hosted
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 dark:text-blue-400">
                    Explore Suite <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}

            {/* Tracura Card */}
            <Link
              href="/plugins/tracura"
              className="group flex flex-col justify-between rounded-2xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Developer Infrastructure
                  </span>
                  <span className="text-xs text-fd-muted-foreground">Universal APM</span>
                </div>

                <h3 className="mt-4 text-xl font-bold tracking-tight text-fd-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Tracura
                </h3>
                <p className="mt-1 text-xs font-medium text-fd-muted-foreground">
                  High-Throughput API Telemetry & Logging
                </p>
                <p className="mt-3 text-sm text-fd-muted-foreground line-clamp-3">
                  Universal sub-millisecond ring buffer capable of ingesting 10,000+ req/s across microservices,
                  serverless functions, and AI agent pipelines with PII scrubbing.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4">
                <span className="font-mono text-xs text-fd-muted-foreground">
                  Sub-ms Ring Buffer
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-0.5 dark:text-emerald-400">
                  Explore Tracura <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>

            {/* @innostes/ui Card */}
            <Link
              href="/ui"
              className="group flex flex-col justify-between rounded-2xl border border-fd-border bg-fd-card p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Frontend Framework
                  </span>
                  <span className="text-xs text-fd-muted-foreground">240+ Components</span>
                </div>

                <h3 className="mt-4 text-xl font-bold tracking-tight text-fd-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  @innostes/ui
                </h3>
                <p className="mt-1 text-xs font-medium text-fd-muted-foreground">
                  Standalone Enterprise Design System
                </p>
                <p className="mt-3 text-sm text-fd-muted-foreground line-clamp-3">
                  An exclusive, production-ready React component framework with Kanban boards, data tables,
                  interactive Cartesian/Donut charts, and metric widgets you can use in any project.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-fd-border pt-4">
                <span className="font-mono text-xs text-fd-muted-foreground">
                  pnpm add @innostes/ui
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 group-hover:translate-x-0.5 dark:text-purple-400">
                  Explore UI Docs <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
