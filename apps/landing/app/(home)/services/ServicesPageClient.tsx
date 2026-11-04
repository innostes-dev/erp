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
      {/* ── Hero Header with Cadence Mesh ──────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 section-divider transition-colors duration-300">
        {/* Centered Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[700px] rounded-full bg-gradient-to-tr from-amber-400/10 via-purple-500/10 to-indigo-500/10 blur-[130px] dark:from-orange-500/10 dark:via-purple-600/15 dark:to-blue-600/15" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            {/* Frosted Floating Pill Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
                <ShieldCheck className="size-3" /> Commercial Model
              </span>
              <span>Zero Per-Seat Taxes</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Free Self-Hosted</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-300">Transparent Services</span>
            </div>

            {/* Big Headline */}
            <h1 className="animate-fade-up stagger-1 mt-7 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Free to run forever.
              <br className="hidden sm:inline" />{' '}
              <span className="gradient-cadence">Partner when you need scale.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up stagger-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Innostes is 100% free to self-host with zero seat licensing fees. For organizations that require
              turnkey cloud setup, automated backup clustering, legacy data migration, or custom module engineering,
              our core platform architects provide dedicated professional services.
            </p>

            {/* Dual Pill CTAs */}
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Self-Host for Free (₹0)</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => openQuote('Assisted Deployment')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs backdrop-blur-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Clear Pathways
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Choose the Best Fit for Your Team
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Whether you are an independent developer or a multinational enterprise, choose zero-fee autonomy or white-glove engineering support.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
            {/* Pathway 1: Community Self-Hosted */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    Community Edition
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Apache 2.0 / MIT
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Self-Hosted Core
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">₹0</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ forever free</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Complete access to all open-source business suites, developer infrastructure, and the decoupled backend.
                </p>

                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
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
                      <Check className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
                <Link
                  href="/docs/getting-started"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  View Deployment Guide
                </Link>
              </div>
            </div>

            {/* Pathway 2: Assisted Deployment (Featured) */}
            <div className="bento-card group relative flex flex-col justify-between rounded-3xl p-8 border-2 border-slate-900 dark:border-white shadow-2xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-0.5 text-xs font-bold text-white shadow-md dark:bg-white dark:text-slate-950">
                Most Popular for Businesses
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    Turnkey Deployment
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Production Ready
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Assisted Cloud Setup
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Custom Quote</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ fixed setup</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Our core platform architects provision your cloud infrastructure, configure HA database clustering, and migrate legacy spreadsheets.
                </p>

                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
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
                      <Check className="size-4 shrink-0 text-blue-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
                <button
                  onClick={() => openQuote('Assisted Cloud Setup')}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  Request Setup Quote
                </button>
              </div>
            </div>

            {/* Pathway 3: Custom Engineering & Managed Ops */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-8">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    Dedicated Retainer
                  </span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Core Engineering
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Custom Engineering &amp; Ops
                </h3>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Retainer</span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ monthly partnership</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Partner directly with our team to engineer bespoke domain modules, build internal integrations, and manage operations.
                </p>

                <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-white/5 dark:text-slate-300">
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
                      <Check className="size-4 shrink-0 text-purple-500 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
                <button
                  onClick={() => openQuote('Custom Engineering & Managed Ops')}
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Enterprise Services
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              White-Glove Implementation Capabilities
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              From zero-downtime data migration to custom kernel plugins, our engineering team handles end-to-end technical execution.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Database className="size-5 text-blue-500" />,
                title: 'PostgreSQL HA & pgvector',
                desc: 'Multi-AZ replication, connection pooling with PgBouncer, automated WAL archiving, and vector search indexing.',
              },
              {
                icon: <Server className="size-5 text-indigo-500" />,
                title: 'Bare-Metal & Sovereign Cloud',
                desc: 'Compliant deployments on AWS, Hetzner, Scaleway, Google Cloud, or your private on-premise Kubernetes clusters.',
              },
              {
                icon: <RefreshCw className="size-5 text-emerald-500" />,
                title: 'Legacy Spreadsheet Migration',
                desc: 'Automated data validation and ETL pipelines importing records from Salesforce, QuickBooks, HubSpot, and Excel.',
              },
              {
                icon: <Lock className="size-5 text-amber-500" />,
                title: 'Enterprise SSO & SCIM',
                desc: 'SAML 2.0 and OIDC identity mapping with Okta, Azure AD / Entra ID, Google Workspace, and Keycloak.',
              },
              {
                icon: <Cpu className="size-5 text-purple-500" />,
                title: 'Custom Kernel Domain Plugins',
                desc: 'Bespoke FastAPI modules and SQLAlchemy models tailored to your industry-specific operational workflows.',
              },
              {
                icon: <Headphones className="size-5 text-rose-500" />,
                title: 'Mission-Critical SLA Support',
                desc: 'Direct priority escalations with core platform maintainers, incident response, and proactive uptime monitoring.',
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 shadow-2xs dark:border-white/10 dark:bg-white/5">
                    {cap.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Clear Answers
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{faq.q}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Conversion Bento CTA ──────────────────────────── */}
      <section className="relative overflow-hidden py-24 section-divider transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="size-[500px] rounded-full bg-gradient-to-tr from-orange-400/10 via-purple-500/15 to-blue-500/10 blur-[130px] dark:from-orange-500/15 dark:via-purple-600/20 dark:to-blue-600/20" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bento-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
                <Zap className="size-3" /> Get Started
              </span>
              <span>100% Free Self-Host</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Per-Seat Taxes</span>
            </div>

            <h2 className="mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Ready to modernize your operations?
              <br />
              <span className="gradient-cadence">Deploy free or consult with our team</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Start self-hosting today in minutes, or submit a request for an enterprise cloud deployment quote tailored to your organization.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Deploy Free (Self-Hosted)</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => openQuote('Enterprise Deployment')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
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
