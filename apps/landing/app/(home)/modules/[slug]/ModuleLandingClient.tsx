'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@innostes/ui';
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
    <div className="relative flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* Top Breadcrumb */}
      <div className="border-b border-fd-border bg-fd-muted/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-fd-muted-foreground">
            <Link href="/" className="hover:text-fd-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/modules" className="hover:text-fd-foreground">
              Modules
            </Link>
            <span>/</span>
            <span className="font-medium text-fd-foreground">{module.name}</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-fd-muted-foreground hover:text-fd-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Business Suites</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-fd-border py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Layers className="size-3.5" />
              {module.category} • {module.badge}
            </span>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-fd-foreground sm:text-5xl md:text-6xl">
              {module.name}
            </h1>
            <p className="mt-2 text-xl font-medium text-fd-foreground/80 sm:text-2xl">
              {module.tagline}
            </p>
            <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
              {module.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                endIcon={<ArrowRight className="size-4" />}
                render={<a href="/docs/getting-started" />}
                nativeButton={false}
              >
                Deploy Free (Self-Hosted)
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsQuoteOpen(true)}
              >
                Request Setup or Tailoring Quote
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-fd-muted-foreground">
              <Terminal className="size-3.5" />
              <span>0 Rs Self-Hosted License • Headless REST API Ready</span>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {module.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-fd-border bg-fd-card/60 p-5 text-center shadow-xs backdrop-blur-sm"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-fd-muted-foreground">
                  {stat.label}
                </div>
                <div className="mt-1 font-mono text-3xl font-extrabold text-fd-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-fd-muted-foreground">{stat.subtext}</div>
              </div>
            ))}
          </div>

          {/* Interactive Workspace Sandbox Preview */}
          <div className="mt-12">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                  Interactive Module Sandbox
                </span>
              </div>
              <span className="text-xs text-fd-muted-foreground">
                Toggle between Turnkey Management UI and Headless API
              </span>
            </div>
            <ModulePreviewInteractive type={module.previewType} />
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="border-b border-fd-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
              Engineered for Enterprise Operational Rigor
            </h2>
            <p className="mt-3 text-base text-fd-muted-foreground sm:text-lg">
              Every capability is isolated inside the {module.name} engine with strict boundaries,
              logical multi-tenancy, and full audit tracking.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {module.features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-fd-border bg-fd-card p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-fd-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-fd-muted-foreground">{feature.description}</p>
                    <div className="mt-3 rounded-lg border border-fd-border bg-fd-muted/30 p-2.5 font-mono text-xs text-fd-muted-foreground">
                      <span className="font-semibold text-fd-foreground">Architecture Detail: </span>
                      {feature.technicalDetail}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Headless Decoupled API Specification */}
      <section className="border-b border-fd-border bg-fd-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Code2 className="size-3.5" />
                Pure Headless Architecture
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-fd-foreground">
                Run {module.name} Through Standard REST APIs
              </h2>
              <p className="mt-3 text-base text-fd-muted-foreground">
                Innostes is built with strict decoupled inversion. You do not need to use our
                turnkey web application. Connect your proprietary client portals, mobile applications,
                or automated scripts directly to the {module.name} FastAPI backend.
              </p>

              <div className="mt-8 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                  Available REST Endpoints (OpenAPI 3.1)
                </div>
                {module.headlessApi.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center justify-between rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          ep.method === 'GET'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : ep.method === 'POST'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-semibold text-fd-foreground">{ep.path}</span>
                    </div>
                    <span className="text-[11px] text-fd-muted-foreground">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Tabs Viewer */}
            <div className="overflow-hidden rounded-2xl border border-fd-border bg-zinc-950 shadow-2xl dark:bg-black">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
                <div className="flex items-center gap-1">
                  {(['curl', 'typescript', 'python', 'json'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveCodeTab(tab)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        activeCodeTab === tab
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => copyCode(getCodeSnippet())}
                  className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-4">
                <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-200">
                  <code>{getCodeSnippet()}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Module Workflows */}
      <section className="border-b border-fd-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Network className="size-3.5" />
              Unified Business OS Integration
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fd-foreground sm:text-4xl">
              Zero-Integration Debt with Innostes Suites
            </h2>
            <p className="mt-3 text-base text-fd-muted-foreground">
              {module.name} operates on the shared Innostes Kernel. When actions occur here, other
              enabled business suites receive events natively without brittle third-party sync middleware.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {module.crossModuleWorkflows.map((workflow, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-fd-border bg-fd-card p-4 shadow-xs"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {idx + 1}
                </div>
                <p className="text-sm text-fd-foreground">{workflow}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Conversion CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-fd-border bg-gradient-to-b from-fd-muted/50 to-fd-card p-8 md:p-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl">
              Deploy {module.name} on Your Terms
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-fd-muted-foreground">
              Run it independently on your own servers for 0 Rs, or connect with our engineering team
              for assisted cloud setup, database migration, or bespoke customization.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                render={<a href="/docs/getting-started" />}
                nativeButton={false}
              >
                Start Self-Hosting (0 Rs)
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setIsQuoteOpen(true)}
              >
                Request Custom Deployment Quote
              </Button>
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
