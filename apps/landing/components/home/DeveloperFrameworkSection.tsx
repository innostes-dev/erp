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
    ui: `// 1. Build any company portal, dashboard, or internal tool
// Using the Innostes Enterprise Design System (240+ components & widgets)
import { Button, MetricCard, KanbanBoard, DataTable } from '@innostes/ui';

export function CompanyExecutiveDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <MetricCard
        title="Monthly Revenue"
        value="$184,650.00"
        trend={{ value: "+12.4%", isPositive: true }}
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
    tracura: `# Ingest API telemetry from any company service or microservice
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
    <section id="developers" data-chapter data-theme="dark" className="brand-stage py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[500px] sm:size-[650px] rounded-full blur-[130px]  " />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-strong-foreground ">
              <Cpu className="size-3" /> Company Developer Tools
            </span>
            <span>Included Out-of-the-Box</span>
            <span className="text-muted-foreground ">•</span>
            <span className="font-semibold text-success-text ">Strict OpenAPI 3.1</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
            For your builders:
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">open APIs, open design</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground ">
            When your team wants to build something of its own, everything is open to them: every module has an API, and the same design system and monitoring we use come included.
          </p>
        </div>

        {/* ── Modern Developer Bento Box ───────────────────────────── */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Developer Pillars */}
          <div className="space-y-4">
            
            {/* Pillar 1: Design System */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-strong-foreground ">
                  <Package className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">
                    Enterprise Design System &amp; Widgets
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground ">
                    Build any internal tool, client portal, or custom company app with 240+ accessible React components, dense data tables, Kanban boards, and charts—free from 3rd-party UI licensing fees.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2: Tracura Telemetry */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success-bg text-success-text ">
                  <Activity className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">
                    Company-Grade API Telemetry (Tracura)
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground ">
                    Monitor every API, microservice, and AI pipeline your company runs. Sub-millisecond ring buffer ingesting 10,000+ req/s with live payload inspection and zero third-party APM bills.
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3: Multi-Tenant API */}
            <div className="bento-card group rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary ">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">
                    Unified Multi-Tenant API Gateway
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground ">
                    Connect external mobile apps, custom portals, or automated workflows with strict OpenAPI 3.1 contracts, automatic tenant isolation, and cryptographic audit security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Obsidian Terminal Window */}
          <div className="overflow-hidden rounded-3xl border border-border-strong bg-brand-navy shadow-2xl">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-border-strong bg-brand-navy px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 mr-2">
                  <span className="size-3 rounded-full bg-error-bg" />
                  <span className="size-3 rounded-full bg-warning-bg" />
                  <span className="size-3 rounded-full bg-success-bg" />
                </div>
                
                {/* Pill Tabs */}
                <div className="flex rounded-full border border-border-strong bg-brand-navy p-0.5">
                  {(
                    [
                      { id: 'ui', label: 'Design System' },
                      { id: 'tracura', label: 'API Telemetry' },
                      { id: 'backend', label: 'Multi-Tenant API' },
                    ] as const
                  ).map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                        activeTab === id
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-sidebar-foreground hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-full border border-border-strong bg-brand-navy px-3 py-1 font-mono text-xs text-sidebar-foreground transition-all hover:bg-strong-foreground hover:text-white"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Body */}
            <div tabIndex={0} role="region" aria-label="Code example" className="p-6 font-mono text-xs sm:text-sm leading-relaxed text-white overflow-x-auto focus-visible:outline-2 focus-visible:outline-sidebar-ring">
              <pre>
                <code>{snippets[activeTab]}</code>
              </pre>
            </div>

            {/* Terminal Status Footer */}
            <div className="flex items-center justify-between border-t border-border-strong bg-brand-navy px-5 py-2.5 font-mono text-xs text-sidebar-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-success animate-pulse" />
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
