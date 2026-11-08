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
    <section id="pricing" data-chapter className="surface-band relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[650px] rounded-full blur-[130px]  " />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
            <span className="flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-xs font-semibold text-primary ">
              <ShieldCheck className="size-3" /> Commercial Model
            </span>
            <span>Zero Per-Seat Taxes</span>
            <span className="text-muted-foreground ">•</span>
            <span className="font-semibold text-success-text ">100% Free Self-Hosted</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
            Free to run yourself.
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">Help when you want it.</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground ">
            No per-seat fees as your team grows. Host it yourself at no cost, or have our team set it up and run it for you.
          </p>
        </div>

        {/* ── / Linear Modern Bento Pricing Cards ──────────── */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:items-stretch">
          
          {/* Bento Tier 1: Community Self-Hosted */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground ">
                  Community Edition
                </span>
                <span className="text-xs font-semibold text-success-text ">
                  Apache 2.0 / MIT
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground ">
                Self-Hosted Free
              </h3>
              
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-foreground ">₹0</span>
                <span className="text-sm font-medium text-muted-foreground ">/ forever free</span>
              </div>
              
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                Full access to all 7 modular business suites, Tracura telemetry, the FastAPI backend, and the Enterprise Design System.
              </p>

              <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground dark:border-white/5 ">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-success-text mt-0.5" />
                  <span>Unlimited users, workspace seats &amp; database records</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-success-text mt-0.5" />
                  <span>Official Docker &amp; Kubernetes container images</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-success-text mt-0.5" />
                  <span>Community Discord support &amp; complete documentation</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-success-text mt-0.5" />
                  <span>100% data ownership on your own PostgreSQL instance</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6 dark:border-white/5">
              <a
                href="/docs/getting-started"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring w-full"
              >
                Start Self-Hosting Docs
              </a>
            </div>
          </div>

          {/* Bento Tier 2: Assisted Enterprise Cloud (Featured) */}
          <div className="bento-card group relative flex flex-col justify-between rounded-3xl p-8 border-2 border-border-strong dark:border-white shadow-2xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-navy px-4 py-0.5 text-xs font-bold text-white shadow-md dark:bg-card ">
              Most Popular for Businesses
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary ">
                  Turnkey Deployment
                </span>
                <span className="text-xs font-semibold text-primary ">
                  Production Ready
                </span>
              </div>

              <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground ">
                Assisted Cloud Setup
              </h3>
              
              <div className="mt-4 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground ">Custom Quote</span>
                <span className="text-sm font-medium text-muted-foreground ">/ fixed setup</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                Our core platform engineers provision your cloud infrastructure, configure HA database clustering, and migrate legacy spreadsheets.
              </p>

              <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground dark:border-white/5 ">
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>AWS, GCP, Azure, Hetzner, or bare-metal provisioning</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>PostgreSQL HA clustering, automated backups &amp; failover</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>Legacy spreadsheet &amp; CRM/HR data migration</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>Executive &amp; administrative team onboarding workshops</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6 dark:border-white/5">
              <button
                onClick={onOpenQuote}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring w-full"
              >
                Request Deployment Quote
              </button>
            </div>
          </div>

          {/* Tier 3: custom builds on INNOSTES → /build */}
          <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
            <div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-strong-foreground">
                Custom builds
              </span>
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                Built for you, on INNOSTES
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Need a portal, a mobile app or a workflow we don&apos;t ship yet? We start by understanding your
                business, then build only what&apos;s unique to you, on a core that&apos;s already engineered.
              </p>
              <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground">
                {[
                  'Problem first: we learn how your business works',
                  'Ships faster: sign-in, roles, approvals and audit already built',
                  'Connected to your HR, finance and data from day one',
                  'You talk to an engineer, not a salesperson',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <Link
                href="/build"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Talk to an engineer <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-strong-foreground transition-colors hover:text-foreground dark:hover:text-white"
          >
            <span>Read full deployment methodology, architecture specifications &amp; FAQs</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
