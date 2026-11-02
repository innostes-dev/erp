'use client';

import React, { useState } from 'react';
import { Button } from '@innostes/ui';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  HardDrive,
  Headphones,
  HelpCircle,
  Layers,
  Lock,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { QuoteModal } from '@/components/home/QuoteModal';

export function ServicesPageClient() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteTopic, setQuoteTopic] = useState<string>('Assisted Setup & Deployment');

  const openQuote = (topic: string) => {
    setQuoteTopic(topic);
    setIsQuoteOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-fd-border py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="size-3.5" />
            Transparent Commercial Model
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-fd-foreground sm:text-5xl md:text-6xl">
            Free to Run. Supported When You Need Scale.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-fd-muted-foreground">
            Innostes is 100% free to self-host with zero seat licensing fees. For organizations that require
            turnkey cloud setup, automated backup clustering, legacy data migration, or custom module engineering,
            we provide dedicated professional services.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              render={<a href="/docs/getting-started" />}
              nativeButton={false}
            >
              Self-Host for Free (0 Rs)
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => openQuote('Assisted Deployment')}
            >
              Request a Custom Quote
            </Button>
          </div>
        </div>
      </section>

      {/* The Three Pathways */}
      <section className="border-b border-fd-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Pathway 1: Community */}
            <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs">
              <div>
                <span className="rounded-full bg-fd-muted px-3 py-1 text-xs font-semibold text-fd-foreground">
                  Community Edition
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                  Self-Hosted Core
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-extrabold text-fd-foreground">0 Rs</span>
                  <span className="text-sm text-fd-muted-foreground">/ Free Forever</span>
                </div>
                <p className="mt-3 text-sm text-fd-muted-foreground">
                  Complete access to all open-source business suites, developer infrastructure, and the decoupled backend.
                </p>

                <div className="mt-8 space-y-3 border-t border-fd-border pt-6 text-sm">
                  {[
                    'Full source code access on GitHub',
                    'All 7 Business Suites included',
                    'Tracura universal API telemetry engine',
                    'Standalone @innostes/ui component framework',
                    'Unlimited users, seats, and database records',
                    'Multi-tenant logical database isolation',
                    'Docker Compose & Kubernetes deployment files',
                    'Community documentation & OpenAPI 3.1 schemas',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-fd-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6">
                <Button
                  size="md"
                  variant="outline"
                  className="w-full"
                  render={<a href="/docs/getting-started" />}
                  nativeButton={false}
                >
                  View Deployment Guide
                </Button>
              </div>
            </div>

            {/* Pathway 2: Assisted Deployment */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-blue-500 bg-fd-card p-8 shadow-xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most Popular for Startups & Scale-ups
              </div>

              <div>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Turnkey Infrastructure
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                  Assisted Cloud Setup
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-extrabold text-fd-foreground">Quote on Request</span>
                  <span className="text-sm text-fd-muted-foreground">/ Flat Project Fee</span>
                </div>
                <p className="mt-3 text-sm text-fd-muted-foreground">
                  Have our core platform engineers provision, harden, and optimize your production infrastructure.
                </p>

                <div className="mt-8 space-y-3 border-t border-fd-border pt-6 text-sm">
                  {[
                    'Production cloud sizing (AWS, GCP, Azure, or Bare Metal)',
                    'PostgreSQL HA clustering & pgvector configuration',
                    'Automated backup policies & point-in-time recovery',
                    'Custom domain SSL, reverse proxy, and CDN setup',
                    'Single Sign-On (SAML / OAuth2 / OIDC) configuration',
                    'Migration of legacy spreadsheets and database records',
                    'Hardened environment variable & secret key audits',
                    'Dedicated live administrator onboarding workshop',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                      <span className="text-fd-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6">
                <Button
                  size="md"
                  className="w-full"
                  onClick={() => openQuote('Assisted Cloud Setup')}
                >
                  Request Setup Quote
                </Button>
              </div>
            </div>

            {/* Pathway 3: Custom Engineering */}
            <div className="flex flex-col justify-between rounded-3xl border border-fd-border bg-fd-card p-8 shadow-xs">
              <div>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  Enterprise Partnership
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-fd-foreground">
                  Custom Engineering & Ops
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-extrabold text-fd-foreground">Retainer / Contract</span>
                </div>
                <p className="mt-3 text-sm text-fd-muted-foreground">
                  Partner directly with our team to engineer bespoke domain modules, build internal integrations, and manage operations.
                </p>

                <div className="mt-8 space-y-3 border-t border-fd-border pt-6 text-sm">
                  {[
                    'Bespoke business module architecture & development',
                    'Integration with internal proprietary ERPs or legacy databases',
                    'Custom @innostes/ui component theming and brand extensions',
                    'Dedicated Slack/Teams engineering channel',
                    'Continuous security patching and database upgrades',
                    'Guaranteed response-time SLAs (99.9% uptime target)',
                    'Quarterly architecture reviews and performance audits',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                      <span className="text-fd-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6">
                <Button
                  size="md"
                  variant="outline"
                  className="w-full"
                  onClick={() => openQuote('Custom Engineering & Managed Ops')}
                >
                  Speak with Engineering
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-fd-muted-foreground">
              Everything you need to know about our licensing, self-hosting, and services.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            {[
              {
                q: 'Is Innostes really free to self-host with no seat limits?',
                a: 'Yes. The entire codebase, including all 7 business suites, Tracura, the decoupled FastAPI backend, and @innostes/ui, is 100% open-source and free to deploy on your own servers. We do not enforce user seat fees or artificial record restrictions.',
              },
              {
                q: 'How does your Assisted Setup service work?',
                a: 'When you request assisted setup, our platform architects conduct an initial requirements review. We then provision the infrastructure on your cloud account (AWS, GCP, Azure, or bare metal), configure secure database clustering, establish automated backups, migrate your data, and hand over the keys during an onboarding session.',
              },
              {
                q: 'Can we use only the backend without your web application?',
                a: 'Yes. Innostes is engineered with strict decoupling. You can run only the backend API server and connect your existing custom internal tools, mobile apps, or client portals through standard OpenAPI 3.1 REST schemas.',
              },
              {
                q: 'Can we install and use @innostes/ui in non-Innostes projects?',
                a: 'Yes. @innostes/ui is an independent, standalone enterprise component framework published to npm. You can install it in any React or Next.js project to build dashboards, forms, tables, and metric cards.',
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-fd-border bg-fd-card p-6 shadow-xs"
              >
                <h3 className="text-base font-semibold text-fd-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        defaultModule={quoteTopic}
      />
    </div>
  );
}
