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
    <div className="flex flex-col w-full min-h-screen">
      {/* ── 1. HERO SECTION WITH CADENCE MESH ────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 section-divider transition-colors duration-300">
        {/* Centered Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[700px] rounded-full blur-[130px]   " />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Eyebrow Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs dark:border-white/10 dark:bg-card  mb-6">
              <span className="flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success-text ">
                <Sparkles className="size-3" /> Company Developer Tools
              </span>
              <span>API Observability Engine</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">100% Free to Self-Host</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-muted-foreground ">Zero 3rd-Party SaaS Bills</span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up stagger-1 max-w-5xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Real-time API telemetry &amp; tracing
              <br className="hidden sm:inline" />{' '}
              <span className="gradient-cadence">for every service your company runs</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up stagger-2 mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground font-normal leading-relaxed">
              Every modern company builds microservices, webhook listeners, and AI agent pipelines. Tracura delivers high-throughput request tracing, live payload inspection, and latency metrics right out of the box—giving your team full API observability without expensive third-party APM bills.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/plugins/tracura/docs"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
              >
                <span>Read Developer Documentation</span>
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/plugins/tracura/docs#api-reference"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Code2 className="size-4 text-primary" />
                <span>REST API Reference (20 Endpoints)</span>
              </Link>
            </div>

            {/* Universal Ingestion Callout Pill */}
            <div className="animate-fade-up stagger-4 mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-muted-foreground border border-border bg-card dark:border-white/10 dark:bg-card  rounded-full px-5 py-2 shadow-2xs">
              <span className="text-success-text font-bold">Universal HTTP / REST</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-primary font-medium">Monitor Any Company Stack</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-strong-foreground font-medium">In-Memory Ring Buffer (&lt;0.2ms)</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-warning-text font-medium">100% Free Self-Hosted</span>
            </div>
          </div>

          {/* Hero Terminal Box */}
          <div className="mt-12 mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border-strong bg-brand-navy text-white shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-border-strong bg-brand-navy px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-error-bg" />
                <div className="size-3 rounded-full bg-warning-bg" />
                <div className="size-3 rounded-full bg-success-bg" />
                <span className="ml-2 font-mono text-xs text-sidebar-muted-foreground">cURL Ingestion Benchmark</span>
              </div>
              <button
                onClick={() => copyCode(codeSnippets.curl)}
                className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-brand-navy hover:bg-strong-foreground px-2.5 py-1 text-xs text-sidebar-foreground transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="size-3.5 text-sidebar-primary" /> : <Copy className="size-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard' : 'Copy cURL'}</span>
              </button>
            </div>
            <div className="p-5 font-mono text-xs sm:text-sm text-sidebar-muted-foreground leading-relaxed overflow-x-auto">
              <p className="text-sidebar-muted-foreground"># Send telemetry from any service, Lambda, or external project via API Key</p>
              <p className="mt-1">
                <span className="text-sidebar-primary">curl</span> -X POST https://api.yourdomain.com/tracura/v1/ingest \
              </p>
              <p className="pl-4">
                -H <span className="text-warning">&quot;X-API-Key: inno_log_live_prod_99f38e4a77b1029c&quot;</span> \
              </p>
              <p className="pl-4">
                -H <span className="text-warning">&quot;Content-Type: application/json&quot;</span> \
              </p>
              <p className="pl-4">
                -d <span className="text-info">&apos;{`{"method":"POST","endpoint":"/v1/payments/charge","status_code":200,"duration_ms":138.4}`}&apos;</span>
              </p>
              <div className="mt-4 pt-4 border-t border-border-strong text-sidebar-muted-foreground">
                <span className="text-sidebar-primary font-bold">HTTP/2 200 OK</span>
                <span className="ml-3 text-sidebar-muted-foreground">latency: 0.19ms</span>
                <span className="ml-3 text-sidebar-muted-foreground">ring_buffer: accepted</span>
                <pre className="mt-2 text-sidebar-muted-foreground text-xs">{`{"success": true, "record_id": "log_90b12c8a", "buffered": true}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THE 3 DESIGN SURFACES (DASHBOARD, EXPLORER, SETTINGS) ─ */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Interactive Product Showcase
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              Engineered with Enterprise Polish &amp; Depth
            </h2>
            <p className="mt-3 text-base text-muted-foreground ">
              Complete observability suite with responsive KPI sparklines, dual-series SVG charts, split request inspection drawers, and real-time PII redaction.
            </p>
          </div>

          {/* Pill Tab Selector */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-card p-1.5 shadow-2xs dark:border-white/10 ">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-navy text-white shadow-xs dark:bg-card '
                    : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                }`}
              >
                <Activity className="size-4" />
                <span>Live Telemetry Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-brand-navy text-white shadow-xs dark:bg-card '
                    : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                }`}
              >
                <Search className="size-4" />
                <span>Split Inspector &amp; Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-brand-navy text-white shadow-xs dark:bg-card '
                    : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                }`}
              >
                <Sliders className="size-4" />
                <span>Redaction &amp; Settings</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="mt-10">
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-6">
                <div className="bento-card overflow-hidden rounded-3xl shadow-xl transition-all">
                  <div className="border-b border-border bg-muted dark:border-white/5 dark:bg-card px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground dark:text-white">Dashboard Overview</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success-text ">
                        <span className="size-1.5 rounded-full bg-success animate-pulse" />
                        Live Streaming
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ">Org: Innostes · Project: E-commerce API</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-brand-navy">
                    <Image
                      src="/images/tracura/dashboard-preview.jpg"
                      alt="Tracura Dashboard Preview"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Annotation Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Activity className="size-4" />
                      <span>5 Real-Time KPI Metric Cards</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Instant visibility into Total Requests (12,482), 98.2% Success Rate, Error Rate with sparkline trends, and P95 latency percentiles.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-success-text font-bold text-sm">
                      <FastForward className="size-4" />
                      <span>Dual-Series Requests &amp; Error Bars</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Pure SVG dual-bar visualization tracking volume spikes and error anomalies across 24h hourly buckets with zero external dependencies.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-strong-foreground font-bold text-sm">
                      <Globe className="size-4" />
                      <span>Environment Health Matrix</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Cross-environment telemetry status comparing Production (Healthy, 243ms), Staging (Degraded, 412ms), and Development in one cohesive view.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'explorer' && (
              <div className="flex flex-col gap-6">
                <div className="bento-card overflow-hidden rounded-3xl shadow-xl transition-all">
                  <div className="border-b border-border bg-muted dark:border-white/5 dark:bg-card px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground dark:text-white">API Requests Deep Explorer</span>
                      <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary ">
                        12,482 Logs Indexed
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ">Split Drawer Inspector &amp; Sub-Millisecond Trace</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-brand-navy">
                    <Image
                      src="/images/tracura/explorer-preview.jpg"
                      alt="Tracura Explorer Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Annotation Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Search className="size-4" />
                      <span>Sub-Second Multi-Filter Search</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Filter by HTTP method (POST, GET, PUT, DELETE), status code (2xx, 4xx, 5xx), environment, or query by trace ID and user ID instantly.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-warning-text font-bold text-sm">
                      <Eye className="size-4" />
                      <span>Split JSON Request/Response Inspector</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Side-by-side formatted JSON blocks displaying headers, request payloads, response bodies, and 1-click reproduction cURL generator.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-error-text font-bold text-sm">
                      <Flame className="size-4" />
                      <span>Microsecond Execution Timeline</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Step-by-step breakdown tracing auth checks, DB writes, third-party payment gateway calls, and exact failure point identification.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex flex-col gap-6">
                <div className="bento-card overflow-hidden rounded-3xl shadow-xl transition-all">
                  <div className="border-b border-border bg-muted dark:border-white/5 dark:bg-card px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-foreground dark:text-white">Dynamic Redaction &amp; Retention Controls</span>
                      <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-semibold text-success-text ">
                        GDPR Compliant
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground ">In-Memory Secret Masker &amp; Storage Gauge</span>
                  </div>
                  <div className="relative w-full aspect-[16/10] bg-brand-navy">
                    <Image
                      src="/images/tracura/settings-preview.jpg"
                      alt="Tracura Settings Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Annotation Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <ShieldCheck className="size-4" />
                      <span>Multi-Vector Secret Redactor</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Mask sensitive fields (password, token, secret, credit_card, ssn) and headers (Authorization, Cookie, X-API-Key) before persistence.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Filter className="size-4" />
                      <span>Granular Path &amp; Status Exclusion</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Exclude noisy endpoints (/health, /metrics, /static/*) and unwanted status codes (200, 204) to drastically cut storage consumption.
                    </p>
                  </div>

                  <div className="bento-card rounded-2xl p-6 transition-all">
                    <div className="flex items-center gap-2 text-success-text font-bold text-sm">
                      <Database className="size-4" />
                      <span>Live Preview &amp; Storage Meter</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Simulate configuration changes in real-time with our live JSON preview and dynamic monthly storage volume forecast meter (~12 GB/mo).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. UNIVERSAL INGESTION ARCHITECTURE BENTO GRID ─────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Universal Ecosystem Integration
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              Connect Any Service, Project, or Stack
            </h2>
            <p className="mt-3 text-base text-muted-foreground ">
              Tracura operates as a standalone-capable telemetry hub. Every capability—from ingestion to project creation—is exposed via universal API Keys.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <Globe className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Universal HTTP &amp; cURL Ingestion
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Connect microservices fleets, Kubernetes sidecars, serverless functions, or custom backends using standard HTTP POST requests with scoped API keys (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">X-API-Key: inno_log_live_*</code>).
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-success-text shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <Cpu className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Non-Blocking Ring Buffer (&lt;0.2ms)
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Ingest telemetry at wire speed. The circular in-memory buffer isolates client request execution from disk persistence, maintaining near-zero latency impact on high-throughput services.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-strong-foreground shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <ShieldCheck className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Multi-Vector PII &amp; Secret Redactor
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Zero-leakage guarantee. Automatically strips passwords, bearer tokens, API secrets, SSNs, and credit cards from headers, query strings, and deep nested JSON bodies before disk persistence.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-warning-text shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <Eye className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Split Inspector &amp; 1-Click Replay
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Inspect raw payloads, headers, and execution timelines side-by-side. Generate complete copyable cURL commands in one click to reproduce difficult production anomalies locally.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-info-text shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <Boxes className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  Multi-Project &amp; Multi-Environment
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Organize distinct services into discrete projects (e.g. <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">mobile-api</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">billing-engine</code>) with individual environments (Production, Staging, QA) and dedicated scoped keys.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all">
              <div>
                <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-error-text shadow-2xs dark:border-white/10 dark:bg-card mb-5">
                  <Database className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white">
                  100% Self-Hosted &amp; GDPR Ready
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  No third-party SaaS cloud subscription and zero data exfiltration. Host Tracura in your own VPC with automatic client IP zero-masking (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">192.168.1.0</code>) and automated retention pruning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. MULTI-FRAMEWORK CODE SHOWCASE ───────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">
              Developer First Integration
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              Drop-In Middleware for Every Language
            </h2>
            <p className="mt-3 text-base text-muted-foreground ">
              Whether you are monitoring internal services, distributed cloud microservices, or an AI token completion pipeline, Tracura drops into your stack in seconds.
            </p>
          </div>

          <div className="mt-10 mx-auto max-w-4xl">
            {/* Framework Switcher Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
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
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    activeCodeTab === tab.id
                      ? 'bg-brand-navy text-white shadow-xs dark:bg-card '
                      : 'border border-border bg-card text-muted-foreground hover:bg-canvas dark:border-white/10 dark:bg-card  dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code sample (navy panel) */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-border-strong bg-brand-navy text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-strong px-4 py-3 bg-brand-navy">
                <span className="font-mono text-xs text-sidebar-foreground flex items-center gap-2">
                  <Terminal className="size-3.5 text-sidebar-primary" />
                  Integration Example: {activeCodeTab.toUpperCase()}
                </span>
                <button
                  onClick={() => copyCode(codeSnippets[activeCodeTab])}
                  className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-brand-navy hover:bg-strong-foreground px-2.5 py-1 text-xs text-sidebar-foreground transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="size-3.5 text-sidebar-primary" /> : <Copy className="size-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre tabIndex={0} aria-label="Integration code example" className="p-5 font-mono text-xs text-sidebar-foreground overflow-x-auto leading-relaxed max-h-[460px]">
                {codeSnippets[activeCodeTab]}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PERFORMANCE BENCHMARKS BENTO ───────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bento-card rounded-3xl p-7 transition-all">
              <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white">&lt; 0.2ms</div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground ">Ingestion Latency Overhead</div>
            </div>
            <div className="bento-card rounded-3xl p-7 transition-all">
              <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white">10,000+</div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground ">Req/sec Ingest Capacity</div>
            </div>
            <div className="bento-card rounded-3xl p-7 transition-all">
              <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white">100%</div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground ">Self-Hosted &amp; Private</div>
            </div>
            <div className="bento-card rounded-3xl p-7 transition-all">
              <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white">₹0</div>
              <div className="mt-2 text-xs font-semibold text-muted-foreground ">Vendor Tax / Per-Seat Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. BOTTOM BENTO CALL TO ACTION ────────────────────────── */}
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
              <span>Universal APM</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">₹0 Software Fees</span>
            </div>

            <h2 className="mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Ready to inspect, scrub &amp; secure
              <br />
              <span className="gradient-cadence">your production API traffic?</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground ">
              Get started with Tracura in under five minutes. Use our complete REST API, scoped ingestion keys, and step-by-step developer guides.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/plugins/tracura/docs"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
              >
                <span>Read Developer Documentation</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/plugins/tracura/docs#api-reference"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Code2 className="size-4 text-primary" />
                <span>REST API Reference (20 Endpoints)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
