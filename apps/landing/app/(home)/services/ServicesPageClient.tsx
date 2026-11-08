'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  Database,
  ExternalLink,
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
  Zap,
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
    <div className="flex flex-1 flex-col">
      {/* ── Hero Header with Mesh ──────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 section-divider transition-colors duration-300">
        {/* Centered Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[700px] rounded-full blur-[130px]   " />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            {/* Frosted Floating Pill Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
              <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text ">
                <ShieldCheck className="size-3" /> Commercial Model
              </span>
              <span>Zero Per-Seat Taxes</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">100% Free Self-Hosted</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-muted-foreground ">Transparent Services</span>
            </div>

            {/* Big Headline */}
            <h1 className="animate-fade-up stagger-1 mt-7 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Free to run forever.
              <br className="hidden sm:inline" />{' '}
              <span className="gradient-cadence">Partner when you need scale.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up stagger-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground ">
              Innostes is 100% free to self-host with zero seat licensing fees. For organizations that require
              turnkey cloud setup, automated backup clustering, legacy data migration, or custom module engineering,
              our core platform architects provide dedicated professional services.
            </p>

            {/* Dual Pill CTAs */}
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
              >
                <span>Self-Host for Free (₹0)</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => openQuote('Assisted Deployment')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span>Request a Custom Quote</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Three Pathways (Pricing / Tiers Bento Grid) ────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Clear Pathways
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              Choose the Best Fit for Your Team
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground ">
              Whether you are an independent developer or a multinational enterprise, choose zero-fee autonomy or white-glove engineering support.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
            {/* Pathway 1: Community Self-Hosted */}
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
                  Self-Hosted Core
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground ">₹0</span>
                  <span className="text-sm font-medium text-muted-foreground ">/ forever free</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                  Complete access to all open-source business suites, developer infrastructure, and the decoupled backend.
                </p>

                <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground dark:border-white/5 ">
                  {[
                    'Full source code access on GitHub',
                    'All 7 Business Suites included',
                    'Tracura universal API telemetry engine',
                    'Enterprise Design System with 240+ components & business widgets',
                    'Unlimited users, seats, and database records',
                    'Multi-tenant logical database isolation',
                    'Docker Compose & Kubernetes deployment files',
                    'Community documentation & OpenAPI 3.1 schemas',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-success-text mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6 dark:border-white/5">
                <Link
                  href="/docs/getting-started"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring w-full"
                >
                  View Deployment Guide
                </Link>
              </div>
            </div>

            {/* Pathway 2: Assisted Deployment (Featured) */}
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
                  Our core platform architects provision your cloud infrastructure, configure HA database clustering, and migrate legacy spreadsheets.
                </p>

                <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground dark:border-white/5 ">
                  {[
                    'Production cloud sizing (AWS, GCP, Azure, or Bare Metal)',
                    'PostgreSQL HA clustering & automated backup failover',
                    'Automated backup policies & point-in-time recovery',
                    'Custom domain SSL, reverse proxy, and CDN setup',
                    'Single Sign-On (SAML / OAuth2 / OIDC) configuration',
                    'Migration of legacy spreadsheets and database records',
                    'Hardened environment variable & secret key audits',
                    'Dedicated live administrator onboarding workshop',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-primary mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6 dark:border-white/5">
                <button
                  onClick={() => openQuote('Assisted Cloud Setup')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring w-full"
                >
                  Request Setup Quote
                </button>
              </div>
            </div>

            {/* Pathway 3: Custom Engineering & Managed Ops */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-strong-foreground ">
                    Dedicated Retainer
                  </span>
                  <span className="text-xs font-semibold text-strong-foreground ">
                    Core Engineering
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground ">
                  Custom Engineering &amp; Ops
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground ">Retainer</span>
                  <span className="text-sm font-medium text-muted-foreground ">/ monthly partnership</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">
                  Partner directly with our team to engineer bespoke domain modules, build internal integrations, and manage operations.
                </p>

                <div className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-strong-foreground dark:border-white/5 ">
                  {[
                    'Bespoke business module architecture & development',
                    'Integration with internal proprietary ERPs or legacy databases',
                    'Custom Design System theming, widgets, and brand extensions',
                    'Dedicated Slack/Teams engineering channel',
                    'Continuous security patching and database upgrades',
                    'Guaranteed response-time SLAs (99.9% uptime target)',
                    'Quarterly architecture reviews and performance audits',
                  ].map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6 dark:border-white/5">
                <button
                  onClick={() => openQuote('Custom Engineering & Managed Ops')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring w-full"
                >
                  Speak with Engineering
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enterprise Capabilities Grid ─────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Enterprise Services
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              White-Glove Implementation Capabilities
            </h2>
            <p className="mt-3 text-base text-muted-foreground ">
              From zero-downtime data migration to custom kernel plugins, our engineering team handles end-to-end technical execution.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Database className="size-5 text-primary" />,
                title: 'PostgreSQL HA & pgvector',
                desc: 'Multi-AZ replication, connection pooling with PgBouncer, automated WAL archiving, and vector search indexing.',
              },
              {
                icon: <Server className="size-5 text-primary" />,
                title: 'Bare-Metal & Sovereign Cloud',
                desc: 'Compliant deployments on AWS, Hetzner, Scaleway, Google Cloud, or your private on-premise Kubernetes clusters.',
              },
              {
                icon: <RefreshCw className="size-5 text-success-text" />,
                title: 'Legacy Spreadsheet Migration',
                desc: 'Automated data validation and ETL pipelines importing records from Salesforce, QuickBooks, HubSpot, and Excel.',
              },
              {
                icon: <Lock className="size-5 text-warning-text" />,
                title: 'Enterprise SSO & SCIM',
                desc: 'SAML 2.0 and OIDC identity mapping with Okta, Azure AD / Entra ID, Google Workspace, and Keycloak.',
              },
              {
                icon: <Cpu className="size-5 text-muted-foreground" />,
                title: 'Custom Kernel Domain Plugins',
                desc: 'Bespoke FastAPI modules and SQLAlchemy models tailored to your industry-specific operational workflows.',
              },
              {
                icon: <Headphones className="size-5 text-error-text" />,
                title: 'Mission-Critical SLA Support',
                desc: 'Direct priority escalations with core platform maintainers, incident response, and proactive uptime monitoring.',
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card shadow-2xs dark:border-white/10 dark:bg-card">
                    {cap.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-foreground dark:text-white">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground ">
                    {cap.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section with Bento Cards ─────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Clear Answers
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-muted-foreground ">
              Everything you need to know about our licensing, self-hosting, and professional services.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: 'Is Innostes really free to self-host with no seat limits?',
                a: 'Yes. The entire codebase, including all 7 business suites, Tracura, the decoupled FastAPI backend, and our Enterprise Design System, is 100% open-source and free to deploy on your own servers. We do not enforce user seat fees or artificial record restrictions.',
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
                q: 'Can we install and use your Design System in non-Innostes projects?',
                a: 'Yes. Our Enterprise Design System is an independent package published to npm (@innostes/ui). You can install it in any external React or Next.js project to build dashboards, forms, tables, and metric cards without paying for third-party component libraries.',
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bento-card rounded-2xl p-6 transition-all"
              >
                <h3 className="text-base font-bold text-foreground dark:text-white">{faq.q}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground ">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Conversion Bento CTA ──────────────────────────── */}
      <section className="relative overflow-hidden py-24 section-divider transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="size-[500px] rounded-full blur-[130px]   " />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bento-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
              <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text ">
                <Zap className="size-3" /> Get Started
              </span>
              <span>100% Free Self-Host</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">Zero Per-Seat Taxes</span>
            </div>

            <h2 className="mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Ready to modernize your operations?
              <br />
              <span className="gradient-cadence">Deploy free or consult with our team</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground ">
              Start self-hosting today in minutes, or submit a request for an enterprise cloud deployment quote tailored to your organization.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
              >
                <span>Deploy Free (Self-Hosted)</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => openQuote('Enterprise Deployment')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span>Request Custom Quote</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Request Modal */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        defaultModule={quoteTopic}
      />
    </div>
  );
}
