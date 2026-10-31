'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FastForward,
  Filter,
  Flame,
  GitBranch,
  Globe,
  Key,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

export function TracuraLandingClient() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explorer' | 'settings'>('dashboard');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'fastapi' | 'express' | 'go' | 'llm'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeSnippets = {
    curl: `# Ship telemetry from any project or script via standard HTTP
curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environment": "production",
    "method": "POST",
    "endpoint": "/v1/payments/charge",
    "status_code": 200,
    "duration_ms": 138.4,
    "ip_address": "203.0.113.42",
    "trace_id": "tr-90b12c8a",
    "request_headers": { "content-type": "application/json" },
    "request_body": { "customer_id": "cust_882", "amount": 9900 },
    "response_body": { "charge_id": "ch_38210", "status": "succeeded" },
    "timeline": [
      { "name": "API key verify", "duration_ms": 8.1 },
      { "name": "Payment gateway roundtrip", "duration_ms": 115.3 },
      { "name": "Postgres transaction", "duration_ms": 15.0 }
    ]
  }'`,
    fastapi: `# Python FastAPI / Starlette: Zero-overhead background telemetry
from fastapi import FastAPI, Request
import time, httpx, asyncio

app = FastAPI()

TRACURA_URL = "https://api.yourdomain.com/tracura/v1/ingest"
TRACURA_API_KEY = "inno_log_live_prod_99f38e4a77b1029c"

@app.middleware("http")
async def tracura_observability_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000.0

    # Non-blocking async fire-and-forget ingestion
    payload = {
        "environment": "production",
        "method": request.method,
        "endpoint": request.url.path,
        "status_code": response.status_code,
        "duration_ms": round(duration_ms, 2),
        "ip_address": request.client.host if request.client else "127.0.0.1",
        "trace_id": request.headers.get("x-request-id", "auto-tr-001"),
    }
    asyncio.create_task(
        httpx.AsyncClient().post(
            TRACURA_URL,
            json=payload,
            headers={"X-API-Key": TRACURA_API_KEY},
            timeout=1.0,
        )
    )
    return response`,
    express: `// Node.js Express / Fastify: Lightweight telemetry interceptor
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const TRACURA_URL = 'https://api.yourdomain.com/tracura/v1/ingest';
const TRACURA_KEY = 'inno_log_live_prod_99f38e4a77b1029c';

app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration_ms = Math.round(performance.now() - start);
    
    // Asynchronous non-blocking fire-and-forget dispatch
    fetch(TRACURA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TRACURA_KEY
      },
      body: JSON.stringify({
        environment: 'production',
        method: req.method,
        endpoint: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration_ms,
        ip_address: req.ip || req.socket.remoteAddress,
        trace_id: req.headers['x-request-id'] || 'trace-' + Math.random().toString(36).substring(2, 9),
      })
    }).catch(() => {}); // Tracura ring buffer handles backpressure
  });

  next();
});`,
    go: `// Go net/http: Zero-Allocation Telemetry Interceptor
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

type TracuraLog struct {
	Environment string  \`json:"environment"\`
	Method      string  \`json:"method"\`
	Endpoint    string  \`json:"endpoint"\`
	StatusCode  int     \`json:"status_code"\`
	DurationMs  float64 \`json:"duration_ms"\`
	IPAddress   string  \`json:"ip_address"\`
}

func TracuraMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &statusResponseWriter{ResponseWriter: w, status: 200}
		next.ServeHTTP(rw, r)
		
		go func(status int, elapsed float64) {
			payload, _ := json.Marshal(TracuraLog{
				Environment: "production",
				Method:      r.Method,
				Endpoint:    r.URL.Path,
				StatusCode:  status,
				DurationMs:  elapsed,
				IPAddress:   r.RemoteAddr,
			})
			req, _ := http.NewRequest("POST", "https://api.yourdomain.com/tracura/v1/ingest", bytes.NewBuffer(payload))
			req.Header.Set("X-API-Key", "inno_log_live_prod_99f38e4a77b1029c")
			req.Header.Set("Content-Type", "application/json")
			http.DefaultClient.Do(req)
		}(rw.status, float64(time.Since(start).Microseconds())/1000.0)
	})
}`,
    llm: `// LLM Agent / AI Token Pipeline Observability
import { OpenAI } from 'openai';

async function auditLlmCompletion(prompt: string, model = 'gpt-4o') {
  const start = performance.now();
  const openai = new OpenAI();
  
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  const duration_ms = Math.round(performance.now() - start);

  // Ship LLM tokens, model metadata, and latency into Tracura
  await fetch('https://api.yourdomain.com/tracura/v1/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'inno_log_live_prod_99f38e4a77b1029c',
    },
    body: JSON.stringify({
      environment: 'production',
      method: 'POST',
      endpoint: '/v1/chat/completions',
      status_code: 200,
      duration_ms,
      request_body: { prompt, model },
      response_body: {
        tokens: completion.usage,
        finish_reason: completion.choices[0].finish_reason,
      },
      timeline: [
        { name: 'Prompt Tokenization', duration_ms: 1.8 },
        { name: 'Model Inference', duration_ms: duration_ms - 4.2 },
      ]
    })
  });

  return completion;
}`,
  };

  return (
    <div className="flex flex-col w-full min-h-screen text-fd-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-fd-border bg-gradient-to-b from-blue-50/60 via-background to-background dark:from-blue-950/25 dark:via-background dark:to-background pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.18),transparent)] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-6 backdrop-blur-xs">
              <Sparkles className="size-3.5 animate-pulse text-blue-500" />
              <span>Open Source Telemetry & API Observability Engine</span>
              <span className="flex size-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Universal API Telemetry & Tracing{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 bg-clip-text text-transparent">
                at In-Memory Speed.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
              Ingest 10,000+ req/sec from microservices, serverless functions, external APIs, and AI agent pipelines with a sub-millisecond circular ring buffer. Inspect payloads, scrub PII automatically, and control everything via scoped API Keys.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/plugins/tracura/docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Read Developer Documentation</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/plugins/tracura/docs#api-reference"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-fd-border bg-fd-card px-6 py-3.5 text-sm font-semibold text-fd-foreground hover:bg-fd-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Code2 className="size-4 text-blue-500" />
                <span>REST API Reference (20 Endpoints)</span>
              </Link>
            </div>

            {/* Universal Ingestion Callout Pill */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-slate-500 dark:text-slate-400 border border-fd-border/80 bg-fd-card/60 backdrop-blur-md rounded-full px-5 py-2">
              <span className="text-emerald-500 font-bold">Universal HTTP / REST</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-blue-500 font-medium">Any Project or Stack</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-purple-500 font-medium">In-Memory Ring Buffer (&lt;0.2ms)</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-amber-500 font-medium">100% Self-Hosted</span>
            </div>
          </div>

          {/* Hero Terminal Box */}
          <div className="mt-12 mx-auto max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-400">cURL Ingestion Benchmark</span>
              </div>
              <button
                onClick={() => copyCode(codeSnippets.curl)}
                className="flex items-center gap-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard' : 'Copy cURL'}</span>
              </button>
            </div>
            <div className="p-5 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed overflow-x-auto">
              <p className="text-slate-500"># Send telemetry from any service, Lambda, or external project via API Key</p>
              <p className="mt-1">
                <span className="text-emerald-400">curl</span> -X POST https://api.yourdomain.com/tracura/v1/ingest \
              </p>
              <p className="pl-4">
                -H <span className="text-amber-300">&quot;X-API-Key: inno_log_live_prod_99f38e4a77b1029c&quot;</span> \
              </p>
              <p className="pl-4">
                -H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> \
              </p>
              <p className="pl-4">
                -d <span className="text-sky-300">&apos;{`{"method":"POST","endpoint":"/v1/payments/charge","status_code":200,"duration_ms":138.4}`}&apos;</span>
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-slate-400">
                <span className="text-emerald-400 font-bold">HTTP/2 200 OK</span>
                <span className="ml-3 text-slate-500">latency: 0.19ms</span>
                <span className="ml-3 text-slate-500">ring_buffer: accepted</span>
                <pre className="mt-2 text-slate-300 text-xs">{`{"success": true, "record_id": "log_90b12c8a", "buffered": true}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 3 DESIGN SURFACES (DASHBOARD, EXPLORER, SETTINGS) */}
      <section className="py-20 bg-fd-background border-b border-fd-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Interactive Product Showcase
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Engineered with Enterprise Polish & Observability Depth
            </p>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Complete observability suite with responsive KPI sparklines, dual-series SVG charts, split request inspection drawers, and real-time PII redaction.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-xl border border-fd-border bg-fd-muted/50 p-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background'
                }`}
              >
                <Activity className="size-4" />
                <span>Live Telemetry Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background'
                }`}
              >
                <Search className="size-4" />
                <span>Split Inspector & Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-background'
                }`}
              >
                <Sliders className="size-4" />
                <span>Redaction & Retention Settings</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="mt-10">
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-6">
                <div className="relative rounded-2xl border border-fd-border bg-fd-card overflow-hidden shadow-xl transition-all">
                  <div className="border-b border-fd-border bg-fd-muted/30 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">Dashboard Overview</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Streaming
                      </span>
                    </div>
                    <span className="text-xs text-fd-muted-foreground">Org: Acme Technologies · Project: E-commerce API</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-slate-950">
                    <Image
                      src="/images/tracura/dashboard-preview.jpg"
                      alt="Tracura Dashboard Preview"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Annotation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      <Activity className="size-4" />
                      <span>5 Real-Time KPI Metric Cards</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Instant visibility into Total Requests (12,482), 98.2% Success Rate, Error Rate with sparkline trends, and P95 latency percentiles.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      <FastForward className="size-4" />
                      <span>Dual-Series Requests & Error Bars</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Pure SVG dual-bar visualization tracking volume spikes and error anomalies across 24h hourly buckets with zero external dependencies.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                      <Globe className="size-4" />
                      <span>Environment Health Matrix</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Cross-environment telemetry status comparing Production (Healthy, 243ms), Staging (Degraded, 412ms), and Development in one cohesive view.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'explorer' && (
              <div className="flex flex-col gap-6">
                <div className="relative rounded-2xl border border-fd-border bg-fd-card overflow-hidden shadow-xl transition-all">
                  <div className="border-b border-fd-border bg-fd-muted/30 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">API Requests Deep Explorer</span>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        12,482 Logs Indexed
                      </span>
                    </div>
                    <span className="text-xs text-fd-muted-foreground">Split Drawer Inspector & Sub-Millisecond Trace</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-slate-950">
                    <Image
                      src="/images/tracura/explorer-preview.jpg"
                      alt="Tracura Explorer Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Annotation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      <Search className="size-4" />
                      <span>Sub-Second Multi-Filter Search</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Filter by HTTP method (POST, GET, PUT, DELETE), status code (2xx, 4xx, 5xx), environment, or query by trace ID and user ID instantly.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                      <Eye className="size-4" />
                      <span>Split JSON Request/Response Inspector</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Side-by-side formatted JSON blocks displaying headers, request payloads, response bodies, and 1-click reproduction cURL generator.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                      <Flame className="size-4" />
                      <span>Microsecond Execution Timeline</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Step-by-step breakdown tracing auth checks, DB writes, third-party payment gateway calls, and exact failure point identification.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div className="relative rounded-2xl border border-fd-border bg-fd-card overflow-hidden shadow-xl transition-all">
                  <div className="border-b border-fd-border bg-fd-muted/30 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">Dynamic Redaction & Retention Controls</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        GDPR Compliant
                      </span>
                    </div>
                    <span className="text-xs text-fd-muted-foreground">In-Memory Secret Masker & Storage Gauge</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-slate-950">
                    <Image
                      src="/images/tracura/settings-preview.jpg"
                      alt="Tracura Settings Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Annotation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                      <ShieldCheck className="size-4" />
                      <span>Multi-Vector Secret Redactor</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Mask sensitive fields (password, token, secret, credit_card, ssn) and headers (Authorization, Cookie, X-API-Key) before persistence.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                      <Filter className="size-4" />
                      <span>Granular Path & Status Exclusion</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Exclude noisy endpoints (/health, /metrics, /static/*) and unwanted status codes (200, 204) to drastically cut storage consumption.
                    </p>
                  </div>

                  <div className="rounded-xl border border-fd-border bg-fd-card p-5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      <Database className="size-4" />
                      <span>Live Preview & Storage Meter</span>
                    </div>
                    <p className="mt-2 text-xs text-fd-muted-foreground leading-relaxed">
                      Simulate configuration changes in real-time with our live JSON preview and dynamic monthly storage volume forecast meter (~12 GB/mo).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. UNIVERSAL INGESTION ARCHITECTURE (ANY PROJECT / ANY STACK) */}
      <section className="py-20 bg-fd-muted/30 border-b border-fd-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Universal Ecosystem Integration
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Connect Any Service, Project, or Stack
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Tracura operates as a standalone-capable telemetry hub. Every capability—from ingestion to project creation—is exposed via universal API Keys.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-5">
                <Globe className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Universal HTTP & cURL Ingestion
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect microservices fleets, Kubernetes sidecars, serverless functions, or custom backends using standard HTTP POST requests with scoped API keys (<code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded font-mono">X-API-Key: inno_log_live_*</code>).
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-5">
                <Cpu className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Non-Blocking Ring Buffer (&lt;0.2ms)
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ingest telemetry at wire speed. The circular in-memory buffer isolates client request execution from disk persistence, maintaining near-zero latency impact on high-throughput services.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-5">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-Vector PII & Secret Redactor
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Zero-leakage guarantee. Automatically strips passwords, bearer tokens, API secrets, SSNs, and credit cards from headers, query strings, and deep nested JSON bodies before disk persistence.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-5">
                <Eye className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Split Inspector & 1-Click Replay
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect raw payloads, headers, and execution timelines side-by-side. Generate complete copyable cURL commands in one click to reproduce difficult production anomalies locally.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-5">
                <Boxes className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Multi-Project & Multi-Environment
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organize distinct services into discrete projects (e.g. <code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded font-mono">mobile-api</code>, <code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded font-mono">billing-engine</code>) with individual environments (Production, Staging, QA) and dedicated scoped keys.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-7 shadow-xs hover:shadow-md transition-shadow">
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-5">
                <Database className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                100% Self-Hosted & GDPR Ready
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No third-party SaaS cloud subscription and zero data exfiltration. Host Tracura in your own VPC with automatic client IP zero-masking (<code className="text-xs bg-fd-muted px-1.5 py-0.5 rounded font-mono">192.168.1.0</code>) and automated retention pruning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MULTI-FRAMEWORK CODE SHOWCASE */}
      <section className="py-20 bg-fd-background border-b border-fd-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Developer First Integration
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Drop-In Middleware for Every Language
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Whether you are monitoring internal services, distributed cloud microservices, or an AI token completion pipeline, Tracura drops into your stack in seconds.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-4xl">
            {/* Framework Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 border-b border-fd-border pb-4">
              {[
                { id: 'curl', label: 'cURL / HTTP' },
                { id: 'fastapi', label: 'Python (FastAPI)' },
                { id: 'express', label: 'Node.js (Express)' },
                { id: 'go', label: 'Go (net/http)' },
                { id: 'llm', label: 'AI / LLM Proxy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCodeTab(tab.id as any)}
                  className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    activeCodeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-fd-border bg-fd-card text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Box */}
            <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/60">
                <span className="font-mono text-xs text-slate-400 flex items-center gap-2">
                  <Terminal className="size-3.5 text-blue-400" />
                  Integration Example: {activeCodeTab.toUpperCase()}
                </span>
                <button
                  onClick={() => copyCode(codeSnippets[activeCodeTab])}
                  className="flex items-center gap-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 px-3 py-1 text-xs text-slate-300 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[460px]">
                {codeSnippets[activeCodeTab]}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PERFORMANCE BENCHMARKS BANNER */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-blue-500/50">
            <div className="pt-4 lg:pt-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">&lt; 0.2ms</div>
              <div className="mt-2 text-sm font-medium text-blue-100">Ingestion Latency Overhead</div>
            </div>
            <div className="pt-4 lg:pt-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">10,000+</div>
              <div className="mt-2 text-sm font-medium text-blue-100">Req/sec per Node</div>
            </div>
            <div className="pt-4 lg:pt-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">100%</div>
              <div className="mt-2 text-sm font-medium text-blue-100">Self-Hosted & Private</div>
            </div>
            <div className="pt-4 lg:pt-0">
              <div className="text-4xl sm:text-5xl font-black tracking-tight">0 Vendor</div>
              <div className="mt-2 text-sm font-medium text-blue-100">Lock-In or Cloud Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL TO ACTION */}
      <section className="py-20 bg-fd-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl border border-fd-border bg-gradient-to-b from-fd-card to-fd-muted/30 p-10 sm:p-14 shadow-lg">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ready to Inspect, Scrub & Secure Your API Traffic?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Get started with Tracura in under 5 minutes. Use our complete REST API, scoped ingestion keys, and step-by-step developer guides.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/plugins/tracura/docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Read Developer Documentation</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/plugins/tracura/docs#api-reference"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-fd-border bg-fd-background px-7 py-3.5 text-sm font-semibold text-fd-foreground hover:bg-fd-muted transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Code2 className="size-4 text-blue-500" />
                <span>REST API Reference (20 Endpoints)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
