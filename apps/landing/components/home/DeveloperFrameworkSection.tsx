'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Cpu,
  Layers,
  Package,
  Terminal,
  Zap,
} from 'lucide-react';

export function DeveloperFrameworkSection() {
  const [activeTab, setActiveTab] = useState<'ui' | 'tracura' | 'backend'>('ui');
  const [copied, setCopied] = useState(false);

  const snippets = {
    ui: `// 1. Install standalone enterprise UI framework
// $ pnpm add @innostes/ui

import { Button, MetricCard, KanbanBoard, DataTable } from '@innostes/ui';

export function ExecutiveDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <MetricCard
        title="Pipeline Velocity"
        value="$342,850.00"
        trend={{ value: "+28.4%", isPositive: true }}
        sparkline={[35, 48, 62, 59, 75, 88, 96]}
      />
      <DataTable
        columns={columns}
        data={deals}
        enableVirtualization
        searchPlaceholder="Filter accounts..."
      />
    </div>
  );
}`,
    tracura: `# Ingest API telemetry from any microservice via standard HTTP
curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\
  -H "X-API-Key: inno_log_live_prod_8849b2c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environment": "production",
    "method": "POST",
    "endpoint": "/v1/salesflow/deals",
    "status_code": 201,
    "duration_ms": 14.8,
    "tenant_id": "acme-corp",
    "trace_id": "tr-99481a-sec"
  }'`,
    backend: `# Query the decoupled FastAPI backend directly with automatic tenant gating
import httpx

client = httpx.Client(
    base_url="https://api.yourdomain.com",
    headers={
        "Authorization": "Bearer inno_live_sec_8849b2c",
        "X-Tenant-ID": "acme-corp"
    }
)

# Fetch isolated tenant records with strict OpenAPI 3.1 validation
response = client.get("/salesflow/deals")
deals = response.json()
print(f"Loaded {len(deals)} active pipeline records.")`,
  };

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[500px] sm:size-[650px] rounded-full bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-orange-400/10 blur-[130px] dark:from-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <Cpu className="size-3" /> Developer First
            </span>
            <span>FastAPI &amp; Next.js</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict OpenAPI 3.1</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Engineered for teams who
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">refuse proprietary lock-in</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            We did not just build business applications. We engineered standalone, high-performance developer
            infrastructure and modular UI frameworks that engineering teams can adopt independently into any codebase.
          </p>
        </div>

        {/* ── Modern Developer Bento Box ───────────────────────────── */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Developer Pillars */}
          <div className="space-y-4">
            
            {/* Pillar 1 */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Package className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    Standalone @innostes/ui Package
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    240+ WCAG-accessible React components, dense data tables, interactive Kanban boards, and Cartesian charts installable in any external project.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    Tracura Distributed API Telemetry
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Universal sub-millisecond ring buffer ingesting 10,000+ requests/sec across microservices, serverless functions, and AI agent pipelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    Hardened Multi-Tenant REST Engine
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    FastAPI + PostgreSQL with automatic tenant header gating (<code className="font-mono text-xs">X-Tenant-ID</code>), JWT rotation, and cryptographic audit records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Obsidian Terminal Window */}
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-amber-500/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                
                {/* Pill Tabs */}
                <div className="flex rounded-full border border-slate-800 bg-slate-950 p-0.5">
                  {(
                    [
                      { id: 'ui', label: '@innostes/ui' },
                      { id: 'tracura', label: 'Tracura Ingest' },
                      { id: 'backend', label: 'FastAPI Core' },
                    ] as const
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                        activeTab === id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 font-mono text-xs text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Body */}
            <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed text-slate-200 overflow-x-auto">
              <pre>
                <code>{snippets[activeTab]}</code>
              </pre>
            </div>

            {/* Terminal Status Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/40 px-5 py-2.5 font-mono text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                TypeScript 5.6 · FastAPI · PostgreSQL 16
              </span>
              <span>OpenAPI 3.1 Strict</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
