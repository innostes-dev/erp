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
} from 'lucide-react';

interface ServicesModelSectionProps {
  onOpenQuote: () => void;
}

export function ServicesModelSection({ onOpenQuote }: ServicesModelSectionProps) {
  return (
    <section className="border-b border-fd-border bg-fd-muted/20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="size-3.5" />
            Transparent Commercial Model
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
            Free to Run Yourself. Supported When You Need Scale.
          </h2>
          <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
            We believe core business software should be accessible without per-seat taxes.
            Host Innostes independently at no cost, or partner directly with our core engineering team.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {/* Pathway 1 */}
          <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs">
            <div>
              <span className="rounded-full bg-fd-muted px-3 py-1 text-xs font-semibold text-fd-foreground">
                Community
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                Self-Hosted 100% Free
              </h3>
              <div className="mt-3 font-mono text-3xl font-extrabold text-fd-foreground">
                0 Rs
              </div>
              <p className="mt-2 text-xs text-fd-muted-foreground">
                Complete access to all 7 business suites, Tracura, the decoupled backend, and @innostes/ui.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-fd-border pt-6 text-xs text-fd-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Unlimited team seats and database records</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Docker & Kubernetes production images</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Community documentation & OpenAPI schemas</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <Button
                size="md"
                variant="outline"
                className="w-full"
                render={<a href="/docs/getting-started" />}
                nativeButton={false}
              >
                Read Setup Docs
              </Button>
            </div>
          </div>

          {/* Pathway 2 */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-blue-500 bg-fd-card p-8 shadow-xl">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
              Recommended for Production
            </div>

            <div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                Turnkey Deployment
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                Assisted Cloud Setup
              </h3>
              <div className="mt-3 font-mono text-xl font-bold text-fd-foreground">
                Quote on Request
              </div>
              <p className="mt-2 text-xs text-fd-muted-foreground">
                Our platform engineers provision your cloud, configure database clustering, and migrate legacy data.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-fd-border pt-6 text-xs text-fd-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-blue-500" />
                  <span>AWS / GCP / Azure / Bare-Metal infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-blue-500" />
                  <span>PostgreSQL HA clustering & backup automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-blue-500" />
                  <span>Legacy spreadsheet & database migration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-blue-500" />
                  <span>Administrator onboarding workshop</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <Button
                size="md"
                className="w-full"
                onClick={onOpenQuote}
              >
                Request Deployment Quote
              </Button>
            </div>
          </div>

          {/* Pathway 3 */}
          <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs">
            <div>
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                Engineering Partnership
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                Custom Engineering & Ops
              </h3>
              <div className="mt-3 font-mono text-xl font-bold text-fd-foreground">
                Contract / Retainer
              </div>
              <p className="mt-2 text-xs text-fd-muted-foreground">
                Custom domain module development, proprietary system integrations, and managed operations with SLAs.
              </p>

              <div className="mt-6 space-y-2.5 border-t border-fd-border pt-6 text-xs text-fd-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-500" />
                  <span>Bespoke business module development</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-500" />
                  <span>Proprietary internal systems integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-500" />
                  <span>Dedicated Slack/Teams engineering channel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-purple-500" />
                  <span>Guaranteed response-time SLAs</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-fd-border pt-4">
              <Button
                size="md"
                variant="outline"
                className="w-full"
                onClick={onOpenQuote}
              >
                Speak with Engineering
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <span>View Full Services Breakdown & FAQs</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
