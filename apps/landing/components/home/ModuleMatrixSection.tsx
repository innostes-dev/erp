'use client';

import React, { useState } from 'react';
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
import { MODULES_DATA, ModuleData } from '@/lib/modules-data';
import { ModulePreviewInteractive } from './ModulePreviewInteractive';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  salesflow: <TrendingUp className="size-4" />,
  peopleops: <Users className="size-4" />,
  hireflow: <Briefcase className="size-4" />,
  ledgerflow: <DollarSign className="size-4" />,
  stockflow: <Boxes className="size-4" />,
  sprintflow: <FolderGit2 className="size-4" />,
  docflow: <FileText className="size-4" />,
};

export function ModuleMatrixSection() {
  const modulesList = Object.values(MODULES_DATA);
  const [activeSlug, setActiveSlug] = useState<string>('salesflow');

  const activeModule = MODULES_DATA[activeSlug] || modulesList[0];

  return (
    <section id="modules" className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[700px] rounded-full bg-gradient-to-tr from-purple-500/10 via-blue-500/10 to-orange-400/10 blur-[130px] dark:from-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-400/20 dark:text-violet-300">
              <Boxes className="size-3" /> Modular Suites
            </span>
            <span>Activate As You Grow</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">0 Circular Dependencies</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            All the operational power,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">none of the bloat</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Activate only what your company needs today. Every suite operates with independent domain schemas,
            strict OpenAPI REST contracts, and seamless event synchronization.
          </p>
        </div>

        {/* ── Interactive Live Module Showcase Window ─────────────── */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
          
          {/* Suite Selector Pill Tab Bar */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70 p-2.5 scrollbar-none dark:border-white/5 dark:bg-slate-950/70">
            <div className="flex gap-1.5 min-w-full sm:min-w-0">
              {modulesList.map((mod) => {
                const isActive = activeSlug === mod.slug;
                return (
                  <button
                    key={mod.slug}
                    onClick={() => setActiveSlug(mod.slug)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-white dark:text-slate-950' : 'text-blue-500 dark:text-blue-400'}>
                      {MODULE_ICONS[mod.slug]}
                    </span>
                    <span>{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Suite Info Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-white/80 px-6 py-4 dark:border-white/5 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {activeModule.badge}
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  100% Free Self-Hosted
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {activeModule.tagline}
              </p>
            </div>

            <Link
              href={`/modules/${activeModule.slug}`}
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 md:self-auto"
            >
              <span>Explore {activeModule.name} Suite Page</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Interactive Screen & API Sandbox */}
          <div className="p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-950/40">
            <ModulePreviewInteractive type={activeModule.previewType} />
          </div>
        </div>

        {/* ── Complete Bento Directory Grid ────────────────────────── */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Modular Business Directory
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                7 Core Business Suites + 2 Standalone Developer Frameworks
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              Zero Per-Seat Fees
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {modulesList.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="bento-card group flex flex-col justify-between rounded-3xl p-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {mod.badge}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ₹0 Free
                    </span>
                  </div>

                  <h4 className="mt-5 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                    {mod.name}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {mod.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                    {mod.heroDescription}
                  </p>

                  {/* Highlight Stat Pill */}
                  {mod.stats && mod.stats[0] && (
                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 font-mono text-xs dark:border-white/5 dark:bg-slate-950/60">
                      <span className="text-slate-500 dark:text-slate-400">{mod.stats[0].label}:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{mod.stats[0].value}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-blue-600 transition-colors group-hover:text-blue-700 dark:border-white/5 dark:text-blue-400">
                  <span>Explore {mod.name} Specs</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}

            {/* Tracura Card */}
            <Link
              href="/plugins/tracura"
              className="bento-card group flex flex-col justify-between rounded-3xl p-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Telemetry Engine
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Universal
                  </span>
                </div>

                <h4 className="mt-5 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-slate-50 dark:group-hover:text-emerald-400">
                  Tracura
                </h4>
                <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Distributed High-Throughput API Telemetry
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                  Universal sub-millisecond ring buffer ingesting 10,000+ req/s across microservices, serverless functions, and AI agent pipelines. 100% self-hosted.
                </p>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 font-mono text-xs dark:border-white/5 dark:bg-slate-950/60">
                  <span className="text-slate-500 dark:text-slate-400">Throughput:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">10,000+ req/s</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-emerald-600 transition-colors group-hover:text-emerald-700 dark:border-white/5 dark:text-emerald-400">
                <span>Explore Tracura Telemetry</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* @innostes/ui Card */}
            <Link
              href="/ui"
              className="bento-card group flex flex-col justify-between rounded-3xl p-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    UI Framework
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    Standalone
                  </span>
                </div>

                <h4 className="mt-5 text-xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-purple-600 dark:text-slate-50 dark:group-hover:text-purple-400">
                  @innostes/ui
                </h4>
                <p className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  240+ Production Enterprise React Components
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                  Installable in any React or Next.js app. Fully equipped with Kanban boards, dense virtualized data tables, Cartesian charts, and WCAG AA accessibility.
                </p>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 font-mono text-xs dark:border-white/5 dark:bg-slate-950/60">
                  <span className="text-slate-500 dark:text-slate-400">Components:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">240+ Ready</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-purple-600 transition-colors group-hover:text-purple-700 dark:border-white/5 dark:text-purple-400">
                <span>View Design System Docs</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
