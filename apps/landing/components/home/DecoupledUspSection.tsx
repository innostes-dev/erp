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
    <section id="architecture" data-chapter className="surface-band relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[500px] sm:size-[650px] rounded-full blur-[130px]   " />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
            <span className="flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-xs font-semibold text-primary ">
              <Layers className="size-3" /> Architecture
            </span>
            <span>Zero Monolithic Lock-In</span>
            <span className="text-muted-foreground ">•</span>
            <span className="font-semibold text-success-text ">Decoupled by Design</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
            One decoupled core,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">three deployment modes</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground ">
            Traditional software traps your organization inside rigid, proprietary presentation layers.
            Innostes enforces strict boundary inversion: the backend is a standalone, multi-tenant API engine,
            and the frontend is an independent consumer.
          </p>
        </div>

        {/* ── / Linear Modern Bento Grid ────────────────────── */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:items-stretch">
          
          {/* Bento Card 1: Turnkey App */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-tint text-primary ">
                  <Monitor className="size-6" />
                </div>
                <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary ">
                  Turnkey GUI
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground ">
                Turnkey Full-Stack Application
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                Launch our ready-to-use Next.js 15 application built on the <code className="font-mono text-xs text-primary ">@innostes/ui</code> framework.
                Includes dark/light themes, dense keyboard navigation, and unified administration.
              </p>

              {/* Mini UI Visual Mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted p-3 dark:border-white/10 ">
                <div className="flex items-center justify-between border-b border-border pb-2 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive" />
                    <span className="size-2 rounded-full bg-warning" />
                    <span className="size-2 rounded-full bg-success" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">workspace.app</span>
                </div>
                <div className="mt-2 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between rounded bg-card px-2 py-1 shadow-2xs ">
                    <span className="font-semibold text-strong-foreground ">Acme Rollout</span>
                    <span className="font-bold text-success-text ">$148k</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-card px-2 py-1 shadow-2xs ">
                    <span className="font-semibold text-strong-foreground ">OmniCorp ERP</span>
                    <span className="font-bold text-primary ">$95k</span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground ">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span>Out-of-the-box CRM, HR, Finance, Inventory &amp; Ops</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  <span>Dense keyboard-navigable data tables and charts</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-border pt-4 dark:border-white/5">
              <span className="text-xs font-semibold text-muted-foreground ">
                Best for: Teams seeking an immediate, full-fledged ERP replacement on Day 1.
              </span>
            </div>
          </div>

          {/* Bento Card 2: Headless Backend (Featured / Highlighted) */}
          <div className="bento-card group relative flex flex-col justify-between rounded-3xl p-8 border-2 border-border-strong dark:border-white/40 shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-navy px-4 py-0.5 text-xs font-bold text-white shadow-md dark:bg-card ">
              Pure Headless Core
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-success-bg text-success-text ">
                  <Server className="size-6" />
                </div>
                <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-text ">
                  OpenAPI 3.1
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground ">
                Headless Multi-Tenant Backend
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                Strip away our frontend completely. Consume our high-performance FastAPI engine strictly
                via OpenAPI 3.1 REST schemas to power your own custom web, mobile, or internal portals.
              </p>

              {/* Mini Terminal cURL Mockup */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-border-strong bg-brand-navy p-3 font-mono text-xs text-sidebar-foreground shadow-inner">
                <div className="flex items-center gap-1.5 text-sidebar-muted-foreground pb-1.5 border-b border-sidebar-border text-xs">
                  <span className="text-sidebar-primary font-bold">GET</span>
                  <span>/v1/salesflow/deals</span>
                  <span className="ml-auto text-sidebar-primary">200 OK</span>
                </div>
                <div className="mt-2 text-sidebar-muted-foreground text-xs leading-tight">
                  <span className="text-sidebar-muted-foreground">X-Tenant-ID</span>: acme-corp
                  <br />
                  <span className="text-sidebar-primary">Latency</span>: 8.4ms · Sub-millisecond
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground ">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-success-text" />
                  <span>Sub-10ms response latency on Python / FastAPI</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-success-text" />
                  <span>Automatic header tenant gating (<code className="font-mono text-xs">X-Tenant-ID</code>)</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-border pt-4 dark:border-white/5">
              <span className="text-xs font-semibold text-success-text ">
                Best for: Engineering teams building bespoke client portals and custom integrations.
              </span>
            </div>
          </div>

          {/* Bento Card 3: Enterprise Design System */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-strong-foreground ">
                  <Package className="size-6" />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-strong-foreground ">
                  Enterprise Design System
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground ">
                Enterprise Design System &amp; Widgets
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                Not just for our business platform—use our battle-tested design system to build any custom product, internal dashboard, or client portal for your company. Skip expensive 3rd-party UI libraries and build faster with 240+ accessible components and rich enterprise widgets.
              </p>

              {/* Mini UI Component Kit preview */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted p-3 dark:border-white/10 ">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">240+ Widgets &amp; Primitives</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-strong-foreground ">Any Project</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-strong-foreground ">Kanban Board</span>
                  <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-strong-foreground ">Virtual DataTable</span>
                  <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-strong-foreground ">Metric Card</span>
                  <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-strong-foreground ">Charts &amp; Sparklines</span>
                </div>
              </div>

              {/* Highlights */}
              <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground ">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                  <span>Build any custom company app, portal, or internal tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                  <span>240+ pre-built widgets — zero 3rd-party component subscription fees</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-border pt-4 dark:border-white/5">
              <Link
                href="/ui"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-strong-foreground transition-colors hover:text-strong-foreground "
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
