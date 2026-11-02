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
    ui: `// Install and use @innostes/ui in any React / Next.js project
// $ pnpm add @innostes/ui
import { Button, MetricCard, KanbanBoard, DataTable } from '@innostes/ui';

export function AnalyticsWidget() {
  return (
    <MetricCard
      title="Monthly Recurring Revenue"
      value="$128,450.00"
      trend={{ value: "+14.2%", isPositive: true }}
      sparkline={[45, 52, 60, 68, 74, 82, 95]}
    />
  );
}`,
    tracura: `# Ingest API telemetry from any service via standard HTTP
curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\
  -H "X-API-Key: inno_log_live_prod_8849b2c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environment": "production",
    "method": "POST",
    "endpoint": "/v1/payments/charge",
    "status_code": 200,
    "duration_ms": 112.4,
    "trace_id": "tr-88910a"
  }'`,
    backend: `# Query the decoupled Innostes FastAPI core directly
import httpx

client = httpx.Client(
    base_url="https://api.yourdomain.com",
    headers={
        "Authorization": "Bearer inno_live_sec_8849b2c",
        "X-Tenant-ID": "acme-corp"
    }
)

response = client.get("/salesflow/deals")
deals = response.json()`,
  };

  const copy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="border-b border-fd-border py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <Cpu className="size-3.5" />
              Built for Engineering Teams
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
              All the Tools Developers Need to Build Any Software
            </h2>

            <p className="mt-4 text-base leading-relaxed text-fd-muted-foreground sm:text-lg">
              We did not just build business operational suites. We built the high-performance
              developer infrastructure and standalone UI libraries we wished we had.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-fd-border bg-fd-card p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Package className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-fd-foreground">
                      Standalone @innostes/ui Framework
                    </h3>
                    <p className="text-xs text-fd-muted-foreground">
                      240+ production-ready WCAG-accessible components, Kanban boards, and data tables you can use in any project.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-fd-border bg-fd-card p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Activity className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-fd-foreground">
                      Tracura Distributed API Telemetry
                    </h3>
                    <p className="text-xs text-fd-muted-foreground">
                      Universal 10,000+ req/s sub-millisecond ring buffer for microservices, serverless functions, and AI agents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-fd-border bg-fd-card p-5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Code2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-fd-foreground">
                      Decoupled Multi-Tenant Core
                    </h3>
                    <p className="text-xs text-fd-muted-foreground">
                      FastAPI + PostgreSQL + OpenAPI 3.1 with automatic tenant header gating, JWT rotation, and audit trails.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Code Showcase */}
          <div className="overflow-hidden rounded-2xl border border-fd-border bg-zinc-950 shadow-2xl dark:bg-black">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('ui')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === 'ui' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  @innostes/ui
                </button>
                <button
                  onClick={() => setActiveTab('tracura')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === 'tracura' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tracura Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('backend')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    activeTab === 'backend' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  FastAPI Core
                </button>
              </div>

              <button
                onClick={copy}
                className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-4">
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-200">
                <code>{snippets[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
