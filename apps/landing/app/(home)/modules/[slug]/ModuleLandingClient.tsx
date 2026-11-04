'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Layers,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import type { ModuleData } from '@/lib/modules-data';
import { ModulePreviewInteractive } from '@/components/home/ModulePreviewInteractive';
import { QuoteModal } from '@/components/home/QuoteModal';

interface ModuleLandingClientProps {
  module: ModuleData;
}

export function ModuleLandingClient({ module }: ModuleLandingClientProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'typescript' | 'python' | 'json'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getCodeSnippet = () => {
    switch (activeCodeTab) {
      case 'curl':
        return module.headlessApi.curl;
      case 'typescript':
        return module.headlessApi.typescript;
      case 'python':
        return module.headlessApi.python;
      case 'json':
        return module.headlessApi.responseJson;
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      {/* ── Top Frosted Breadcrumb Strip ───────────────────────── */}
      <div className="border-b border-slate-200/80 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/modules" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Modules
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-white">{module.name}</span>
          </div>

          <Link
            href="/modules"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Business Suites</span>
          </Link>
        </div>
      </div>

      {/* ── Hero Section with Cadence Mesh ──────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 section-divider transition-colors duration-300">
        {/* Centered Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[650px] rounded-full bg-gradient-to-tr from-amber-400/10 via-purple-500/10 to-indigo-500/10 blur-[130px] dark:from-orange-500/10 dark:via-purple-600/15 dark:to-blue-600/15" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Frosted Floating Pill Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-400/20 dark:text-violet-300">
                <Layers className="size-3" /> {module.category}
              </span>
              <span>{module.badge}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Free Self-Host</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-600 dark:text-slate-300">Zero Seat Fees</span>
            </div>

            {/* Big Headline */}
            <h1 className="animate-fade-up stagger-1 mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              {module.name}
            </h1>

            {/* Cadence Tagline */}
            <p className="animate-fade-up stagger-2 mt-3 text-xl sm:text-2xl font-bold tracking-tight">
              <span className="gradient-cadence">{module.tagline}</span>
            </p>

            {/* Description */}
            <p className="animate-fade-up stagger-3 mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              {module.heroDescription}
            </p>

            {/* Cadence Pill Action CTAs */}
            <div className="animate-fade-up stagger-4 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Deploy Free (Self-Hosted)</span>
                <ArrowRight className="size-4" />
              </a>

              <button
                onClick={() => setIsQuoteOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs backdrop-blur-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <span>Request Setup or Tailoring Quote</span>
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
              <Terminal className="size-3.5 text-blue-500" />
              <span>₹0 Self-Hosted License • Headless REST API Ready</span>
            </div>
          </div>

          {/* Key Metric Highlights in Bento Cards */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {module.stats.map((stat) => (
              <div
                key={stat.label}
                className="bento-card rounded-2xl p-6 text-center transition-all"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
                <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Interactive Workspace Sandbox Preview */}
          <div className="mt-12">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Live Interactive Module Sandbox
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                Interactive preview of {module.name} turnkey interface
              </span>
            </div>
            <div className="bento-card rounded-3xl p-2 sm:p-4 shadow-xl">
              <ModulePreviewInteractive type={module.previewType} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Capabilities ───────────────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Enterprise Rigor
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Engineered for Scalable Operations
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Every capability is isolated inside the {module.name} engine with strict domain boundaries,
              logical multi-tenancy, and comprehensive audit tracking.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {module.features.map((feature) => (
              <div
                key={feature.title}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/80 bg-blue-50/80 text-blue-600 shadow-2xs dark:border-blue-500/20 dark:bg-blue-950/30 dark:text-blue-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {feature.description}
                    </p>
                    <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Architecture: </span>
                      {feature.technicalDetail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Headless Decoupled API Specification ──────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Code2 className="size-3.5" />
                Pure Headless Architecture
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Run {module.name} Through REST APIs
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                Innostes is built with strict decoupled inversion. You do not need to use our
                turnkey web application. Connect your proprietary client portals, mobile applications,
                or automated scripts directly to the {module.name} FastAPI backend.
              </p>

              <div className="mt-8 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Available REST Endpoints (OpenAPI 3.1)
                </div>
                {module.headlessApi.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="bento-card flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          ep.method === 'GET'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : ep.method === 'POST'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">{ep.path}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Slate Terminal Code Viewer */}
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-rose-500/80" />
                  <div className="size-3 rounded-full bg-amber-500/80" />
                  <div className="size-3 rounded-full bg-emerald-500/80" />
                  <div className="ml-2 flex items-center gap-1">
                    {(['curl', 'typescript', 'python', 'json'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          activeCodeTab === tab
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => copyCode(getCodeSnippet())}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-5 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed overflow-x-auto">
                <pre>
                  <code>{getCodeSnippet()}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cross-Module Workflows ────────────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Network className="size-3.5" />
              Unified Business OS Integration
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Zero-Integration Debt with Innostes Suites
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              {module.name} operates on the shared Innostes Kernel. When actions occur here, other
              enabled business suites receive events natively without brittle third-party sync middleware.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-3.5">
            {module.crossModuleWorkflows.map((workflow, idx) => (
              <div
                key={idx}
                className="bento-card flex items-center gap-4 rounded-2xl p-5 transition-all"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  0{idx + 1}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{workflow}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Conversion CTA ───────────────────────────────── */}
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
              <span>Deploy in 5 Mins</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹0 Software Fees</span>
            </div>

            <h2 className="mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Deploy {module.name} on your terms
              <br />
              <span className="gradient-cadence">free self-hosted or supported</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Run it independently on your own servers for ₹0 with unlimited seats, or connect with our core engineering team
              for assisted cloud provisioning, database migration, or bespoke customization.
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
                onClick={() => setIsQuoteOpen(true)}
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
        defaultModule={module.name}
      />
    </div>
  );
}
