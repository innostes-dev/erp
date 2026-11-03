'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@innostes/ui';
import {
  ArrowRight,
  Check,
  Headphones,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ServicesModelSectionProps {
  onOpenQuote: () => void;
}

export function ServicesModelSection({ onOpenQuote }: ServicesModelSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[650px] rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-orange-400/10 blur-[130px] dark:from-blue-600/15 dark:to-purple-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
              <ShieldCheck className="size-3" /> Commercial Model
            </span>
            <span>Zero Per-Seat Taxes</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Free Self-Hosted</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Free to self-host forever,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">partner when you need scale</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            We reject the punishing per-seat SaaS subscription model. Deploy Innostes on your own servers with zero software fees,
            or contract our core engineering team for white-glove cloud deployment and custom domain modules.
          </p>
        </div>

        {/* ── Cadence / Linear Modern Bento Pricing Cards ──────────── */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:items-stretch">
          
          {/* Bento Tier 1: Community Self-Hosted */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  Community Edition
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Apache 2.0 / MIT
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Self-Hosted Free
              </h3>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-4xl font-extrabold text-slate-900 dark:text-slate-50">₹0</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ forever free</span>
              </div>
              
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Full access to all 7 modular business suites, Tracura telemetry, the FastAPI backend, and @innostes/ui.
              </p>

              <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Unlimited users, workspace seats &amp; database records</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Official Docker &amp; Kubernetes container images</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>Community Discord support &amp; complete documentation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>100% data ownership on your own PostgreSQL instance</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
              <a
                href="/docs/getting-started"
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                Start Self-Hosting Docs
              </a>
            </div>
          </div>

          {/* Bento Tier 2: Assisted Enterprise Cloud (Featured) */}
          <div className="bento-card group relative flex flex-col justify-between rounded-3xl p-8 border-2 border-slate-900 dark:border-white shadow-2xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-0.5 text-xs font-bold text-white shadow-md dark:bg-white dark:text-slate-950">
              Most Popular for Businesses
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Turnkey Deployment
                </span>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  Production Ready
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Assisted Cloud Setup
              </h3>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-slate-50">Custom Quote</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ fixed setup</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Our core platform engineers provision your cloud infrastructure, configure HA database clustering, and migrate legacy spreadsheets.
              </p>

              <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                  <span>AWS, GCP, Azure, Hetzner, or bare-metal provisioning</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                  <span>PostgreSQL HA clustering, automated backups &amp; failover</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                  <span>Legacy spreadsheet &amp; CRM/HR data migration</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                  <span>Executive &amp; administrative team onboarding workshops</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
              <button
                onClick={onOpenQuote}
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                Request Deployment Quote
              </button>
            </div>
          </div>

          {/* Bento Tier 3: Custom Engineering Partnership */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Dedicated Retainer
                </span>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  Core Engineering
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Custom Engineering &amp; SLAs
              </h3>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-slate-50">Monthly Retainer</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Custom business suite development, proprietary API integrations, dedicated solutions architect, and guaranteed response SLAs.
              </p>

              <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                  <span>Bespoke domain module architecture &amp; implementation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                  <span>Custom legacy database &amp; ERP integrations</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                  <span>Dedicated Slack/Teams channel with core engineers</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                  <span>Guaranteed response time SLAs &amp; priority patches</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
              <button
                onClick={onOpenQuote}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                Consult Our Engineering Team
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            <span>Read full deployment methodology, architecture specifications &amp; FAQs</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
