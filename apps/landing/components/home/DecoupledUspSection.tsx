'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  Layers,
  Monitor,
  Package,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';

export function DecoupledUspSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[500px] sm:size-[650px] rounded-full bg-gradient-to-tr from-orange-400/10 via-purple-500/10 to-blue-500/10 blur-[130px] dark:from-orange-500/10 dark:via-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
              <Layers className="size-3" /> Architecture
            </span>
            <span>Zero Monolithic Lock-In</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Decoupled by Design</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            One decoupled core,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">three deployment modes</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Traditional software traps your organization inside rigid, proprietary presentation layers.
            Innostes enforces strict boundary inversion: the backend is a standalone, multi-tenant API engine,
            and the frontend is an independent consumer.
          </p>
        </div>

        {/* ── Cadence / Linear Modern Bento Grid ────────────────────── */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:items-stretch">
          
          {/* Bento Card 1: Turnkey App */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Monitor className="size-6" />
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Turnkey GUI
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Turnkey Full-Stack Application
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Launch our ready-to-use Next.js 15 application built on the <code className="font-mono text-xs text-blue-600 dark:text-blue-400">@innostes/ui</code> framework.
                Includes dark/light themes, dense keyboard navigation, and unified administration.
              </p>

              {/* Mini UI Visual Mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-400" />
                    <span className="size-2 rounded-full bg-amber-400" />
                    <span className="size-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">workspace.app</span>
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between rounded bg-white px-2 py-1 shadow-2xs dark:bg-slate-900">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Acme Rollout</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">$148k</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white px-2 py-1 shadow-2xs dark:bg-slate-900">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">OmniCorp ERP</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">$95k</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-blue-500" />
                  <span>Out-of-the-box CRM, HR, Finance, Inventory &amp; Ops</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-blue-500" />
                  <span>Dense keyboard-navigable data tables and charts</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 dark:border-white/5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Best for: Teams seeking an immediate, full-fledged ERP replacement on Day 1.
              </span>
            </div>
          </div>

          {/* Bento Card 2: Headless Backend (Featured / Highlighted) */}
          <div className="bento-card group relative flex flex-col justify-between rounded-3xl p-8 border-2 border-slate-900 dark:border-white/40 shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-0.5 text-xs font-bold text-white shadow-md dark:bg-white dark:text-slate-950">
              Pure Headless Core
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Server className="size-6" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  OpenAPI 3.1
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Headless Multi-Tenant Backend
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Strip away our frontend completely. Consume our high-performance FastAPI engine strictly
                via OpenAPI 3.1 REST schemas to power your own custom web, mobile, or internal portals.
              </p>

              {/* Mini Terminal cURL Mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 shadow-inner">
                <div className="flex items-center gap-1.5 text-slate-500 pb-1.5 border-b border-slate-800 text-[10px]">
                  <span className="text-emerald-400 font-bold">GET</span>
                  <span>/v1/salesflow/deals</span>
                  <span className="ml-auto text-emerald-400">200 OK</span>
                </div>
                <div className="mt-2 text-slate-400 text-[10px] leading-tight">
                  <span className="text-purple-400">X-Tenant-ID</span>: acme-corp
                  <br />
                  <span className="text-blue-400">Latency</span>: 8.4ms · Sub-millisecond
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <span>Sub-10ms response latency on Python / FastAPI</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <span>Automatic header tenant gating (<code className="font-mono text-[11px]">X-Tenant-ID</code>)</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 dark:border-white/5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Best for: Engineering teams building bespoke client portals and custom integrations.
              </span>
            </div>
          </div>

          {/* Bento Card 3: Enterprise Design System */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Package className="size-6" />
                </div>
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Enterprise Design System
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Enterprise Design System &amp; Widgets
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Not just for our business platform—use our battle-tested design system to build any custom product, internal dashboard, or client portal for your company. Skip expensive 3rd-party UI libraries and build faster with 240+ accessible components and rich enterprise widgets.
              </p>

              {/* Mini UI Component Kit preview */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">240+ Widgets &amp; Primitives</span>
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Any Project</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Kanban Board</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Virtual DataTable</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Metric Card</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Charts &amp; Sparklines</span>
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-purple-500" />
                  <span>Build any custom company app, portal, or internal tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-purple-500" />
                  <span>240+ pre-built widgets — zero 3rd-party component subscription fees</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4 dark:border-white/5">
              <Link
                href="/ui"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <span>Explore Design System &amp; Widgets</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
