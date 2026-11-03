'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FolderGit2,
  Lock,
  Monitor,
  Play,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { SalesFlowPreviewMini, HeadlessApiPreviewMini } from './HeroSandboxes';

interface HeroSectionProps {
  onOpenQuote: () => void;
}

export function HeroSection({ onOpenQuote }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState<'ui' | 'headless'>('ui');
  const [copiedDocker, setCopiedDocker] = useState(false);

  const dockerCommand = 'docker run -d -p 8000:8000 -p 3000:3000 innostes/platform:latest';

  const copyDocker = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const scrollToModules = () => {
    const el = document.getElementById('modules');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-mesh relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 section-divider transition-colors duration-300">
      
      {/* Centered Ambient Atmospheric Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="size-[500px] sm:size-[700px] rounded-full bg-gradient-to-tr from-amber-400/10 via-purple-500/10 to-indigo-500/10 blur-[130px] dark:from-orange-500/10 dark:via-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ── Top Hero Content ────────────────────────────────────────── */}
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Cadence-style Frosted Floating Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-sm backdrop-blur-md transition-all hover:border-orange-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-400/20 dark:text-violet-300">
              <Sparkles className="size-3" /> New
            </span>
            <span>Open-Source v2.4</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Free to Self-Host</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-slate-600 dark:text-slate-300">Zero Seat Fees</span>
            <ArrowRight className="size-3 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Cadence-style Big Headline */}
          <h1 className="animate-fade-up stagger-1 mt-7 text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.08]">
            Every business domain,
            <br />
            <span className="gradient-cadence">one calm operating system</span>
          </h1>

          {/* Subheadline — Clean, Human-Friendly */}
          <p className="animate-fade-up stagger-2 mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Innostes replaces Salesforce, Workday, QuickBooks, and Jira with a single decoupled, modular kernel.
            Deploy in minutes on your own infrastructure — zero per-seat taxes, complete API decoupling, and 100% data sovereignty.
          </p>

          {/* Cadence-style Dual Pill CTAs */}
          <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={scrollToModules}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 hover:shadow dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Play className="size-3.5 fill-current text-slate-700 dark:text-slate-200" />
              <span>See it in motion</span>
            </button>

            <a
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Deploy free</span>
              <ArrowRight className="size-3.5" />
            </a>

            <button
              onClick={onOpenQuote}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <span>Request Assisted Setup</span>
            </button>
          </div>

          {/* Quick Copy Docker Snippet */}
          <div className="animate-fade-up stagger-4 mx-auto mt-6 flex max-w-md items-center justify-between rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden text-slate-700 dark:text-slate-300">
              <Terminal className="size-3.5 shrink-0 text-blue-500" />
              <code className="truncate font-mono text-[11px]">{dockerCommand}</code>
            </div>
            <button
              onClick={copyDocker}
              className="ml-2 flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Copy Docker Command"
            >
              {copiedDocker ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copiedDocker ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Social Proof / Avatars Row (Cadence Style) */}
          <div className="animate-fade-up stagger-5 mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-amber-400 to-orange-500" />
              <div className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-indigo-500 to-purple-600" />
              <div className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-emerald-400 to-teal-500" />
              <div className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-rose-400 to-pink-500" />
              <div className="inline-flex size-7 items-center justify-center rounded-full bg-slate-100 ring-2 ring-white dark:bg-slate-800 dark:ring-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                +3.2k
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
              Trusted by <span className="font-semibold text-slate-900 dark:text-white">3,200+ product &amp; engineering teams</span> shipping every week
            </p>
          </div>
        </div>

        {/* ── Cadence-style Hero Product Mockup with Floating Orbit Pills ── */}
        <div className="animate-scale-in relative mx-auto mt-14 max-w-5xl">
          
          {/* Floating Orbit Notification Pills (Screenshot 2 Inspiration) */}
          <div className="hidden lg:block">
            {/* Top-Left Floating Pill */}
            <div className="animate-float absolute -left-8 top-12 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                🎉
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Enterprise Deal Closed</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">$148,000 · Acme Global · SalesFlow</p>
              </div>
            </div>

            {/* Top-Right Floating Pill */}
            <div className="animate-float absolute -right-8 top-20 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95" style={{ animationDelay: '1.5s' }}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Tracura Telemetry</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">14,280 req/s · 0.4ms latency · 0 errors</p>
              </div>
            </div>

            {/* Bottom-Left Floating Pill */}
            <div className="animate-float absolute -left-6 bottom-16 z-20 flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95" style={{ animationDelay: '2.5s' }}>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                👤
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Elena Rostova Joined</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Staff Platform Architect · PeopleOps</p>
              </div>
            </div>
          </div>

          {/* ── Main Dashboard Window ───────────────────────────────── */}
          <div className="relative overflow-hidden rounded-t-[2.2rem] border-t border-x border-slate-200/90 bg-white/95 shadow-[0_-25px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-[0_-25px_60px_-15px_rgba(59,130,246,0.15)]">
            
            {/* Window Top Chrome (Cadence Style) */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/5 dark:bg-slate-950/70 sm:px-6">
              
              {/* Left: Window Dots & App Brand */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-400/80" />
                  <span className="size-3 rounded-full bg-amber-400/80" />
                  <span className="size-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-800">
                  <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white">innostes</span>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    acme-workspace
                  </span>
                </div>
              </div>

              {/* Center: Live Time & Status (Cadence Style) */}
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">12:45 PM</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live · 2,481 events/sec
                </span>
              </div>

              {/* Right: Mode Switcher (Full-Stack UI vs OpenAPI REST) */}
              <div className="flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => setActiveTab('ui')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'ui'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span>Interactive GUI</span>
                </button>
                <button
                  onClick={() => setActiveTab('headless')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'headless'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="size-3.5" />
                  <span>Headless API</span>
                </button>
              </div>
            </div>

            {/* Dashboard Breadcrumb & Live Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 dark:border-white/5 dark:bg-slate-900 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Workspace</span>
                <span>›</span>
                <span>Production</span>
                <span>›</span>
                <span className="font-semibold text-slate-900 dark:text-white">Executive Pulse</span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
                <Search className="size-3 text-slate-400" />
                <span className="font-sans">Search domains, deals, employees...</span>
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-800">⌘K</kbd>
              </div>
            </div>

            {/* ── KPI Metric Cards Row (Cadence Inspiration) ──────────── */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-100 bg-slate-50/30 dark:border-white/5 dark:bg-slate-950/20 sm:grid-cols-4 sm:p-6">
              
              {/* KPI 1 */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Revenue</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">$184.6k</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">+12.4%</span>
                </div>
                {/* Emerald Sparkline SVG */}
                <div className="mt-2 h-6 w-full">
                  <svg className="h-full w-full" viewBox="0 0 100 24" fill="none">
                    <path
                      d="M0 18 Q 20 22, 40 12 T 70 8 T 100 4"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Pipeline</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">$842.0k</span>
                  <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">+34% vel</span>
                </div>
                {/* Violet Sparkline SVG */}
                <div className="mt-2 h-6 w-full">
                  <svg className="h-full w-full" viewBox="0 0 100 24" fill="none">
                    <path
                      d="M0 16 Q 25 18, 50 10 T 75 14 T 100 3"
                      stroke="#8b5cf6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Telemetry Ingest</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">14,280/s</span>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">0.4ms</span>
                </div>
                {/* Cyan/Blue Sparkline SVG */}
                <div className="mt-2 h-6 w-full">
                  <svg className="h-full w-full" viewBox="0 0 100 24" fill="none">
                    <path
                      d="M0 14 Q 20 8, 40 15 T 70 6 T 100 2"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* KPI 4 */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Win Rate</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white">94.8%</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">+5.2pp</span>
                </div>
                {/* Amber Sparkline SVG */}
                <div className="mt-2 h-6 w-full">
                  <svg className="h-full w-full" viewBox="0 0 100 24" fill="none">
                    <path
                      d="M0 20 Q 25 15, 50 18 T 75 10 T 100 5"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Active View Content (Mini Kanban or Headless API) ───── */}
            <div className="p-4 sm:p-6 bg-white dark:bg-slate-900">
              {activeTab === 'ui' ? <SalesFlowPreviewMini /> : <HeadlessApiPreviewMini />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
