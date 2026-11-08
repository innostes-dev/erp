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
import { HeroFlow } from './HeroFlow';

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
    <section id="overview" data-chapter className="brand-stage pt-30 pb-0 sm:pt-36 lg:pt-40">
      {/* Lower band in the page colour, so the product preview rises out of the navy stage */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-1 h-40 bg-card sm:h-56 lg:h-72" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ── Top Hero Content ────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl text-center">
          
          {/* Live preview of "connected": one event flowing through the business */}
          <HeroFlow />

          {/* Headline */}
          <h1 className="animate-fade-up mt-7 text-display font-semibold tracking-tight text-white">
            Your whole company.
            <br className="hidden sm:inline" />{' '}
            <span className="text-brand-highlight">One operating system.</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-sidebar-foreground sm:text-lg">
            INNOSTES is open-source software that connects hiring, people, payroll, sales, stock and the books,
            so every team works from the same data.
          </p>

          {/* Calls to action: one primary, one secondary, one text link */}
          <div className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenQuote}
              className="cta-glow inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Book a demo
              <ArrowRight className="size-4" />
            </button>
            <a
              href="/docs/getting-started"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-6 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Start free
            </a>
            <button
              type="button"
              onClick={scrollToModules}
              className="inline-flex h-12 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium text-sidebar-primary hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Explore modules
              <Play className="size-3.5" />
            </button>
          </div>

          {/* Quick Copy Docker Snippet */}
          <div className="animate-fade-up mx-auto mt-7 flex max-w-md items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden text-white">
              <span className="hidden shrink-0 text-xs font-medium text-sidebar-muted-foreground sm:inline">Self-host in 2m:</span>
              <Terminal className="size-3.5 shrink-0 text-sidebar-primary" />
              <code className="truncate font-mono text-xs">{dockerCommand}</code>
            </div>
            <button
              onClick={copyDocker}
              className="ml-2 flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-xs font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-sidebar-ring"
              title="Copy Docker Command"
            >
              {copiedDocker ? <Check className="size-3 text-ai-on-dark" /> : <Copy className="size-3" />}
              <span>{copiedDocker ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="animate-fade-up mt-6 text-sm text-sidebar-muted-foreground">
            Built for founders who want one system, not eleven.
          </p>
        </div>

        {/* ── Hero product preview ── */}
        <div data-tilt className="relative mx-auto mt-14 max-w-5xl sm:mt-16">
          
          {/* ── Main Dashboard Window ───────────────────────────────── */}
          <div className="beam-top relative overflow-hidden rounded-t-xl border-x border-t border-white/20 bg-card shadow-[0_-20px_60px_-10px_rgb(0_0_0/0.45)] ring-1 ring-white/10">
            
            {/* Window Top Chrome */}
            <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted px-4 py-3 dark:border-white/5 sm:px-6">
              
              {/* Left: Window Dots & App Brand */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-error-bg" />
                  <span className="size-3 rounded-full bg-warning-bg" />
                  <span className="size-3 rounded-full bg-success-bg" />
                </div>
                <div className="flex items-center gap-1.5 border-l border-border pl-3 ">
                  <span className="font-bold text-xs tracking-tight text-foreground dark:text-white">innostes</span>
                  <span className="rounded bg-primary-tint px-1.5 py-0.5 text-xs font-semibold text-primary ">
                    acme-workspace
                  </span>
                </div>
              </div>

              {/* Center: Live Time & Status */}
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground ">
                <span className="font-semibold text-strong-foreground ">12:45 PM</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-success-text font-medium">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  Live · 2,481 events/sec
                </span>
              </div>

              {/* Right: Mode Switcher (Full-Stack UI vs OpenAPI REST) */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 ">
                <button
                  onClick={() => setActiveTab('ui')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'ui'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span>Company Workspace</span>
                </button>
                <button
                  onClick={() => setActiveTab('headless')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeTab === 'headless'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground  dark:hover:text-white'
                  }`}
                >
                  <Code2 className="size-3.5" />
                  <span>API &amp; Automations</span>
                </button>
              </div>
            </div>

            {/* Dashboard Breadcrumb & Live Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 dark:border-white/5 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground ">
                <span>Workspace</span>
                <span>›</span>
                <span>Production</span>
                <span>›</span>
                <span className="font-semibold text-foreground dark:text-white">Executive Pulse</span>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Search className="size-3 text-subtle-foreground" />
                <span className="font-sans">Search domains, deals, employees...</span>
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-muted-foreground ">⌘K</kbd>
              </div>
            </div>

            {/* ── KPI Metric Cards Row ──────────── */}
            <div className="grid grid-cols-2 gap-3 p-4 border-b border-border bg-muted dark:border-white/5 sm:grid-cols-4 sm:p-6">
              
              {/* KPI 1 */}
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs ">
                <p className="text-xs font-medium text-muted-foreground ">Monthly Revenue</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white">$184.6k</span>
                  <span className="text-xs font-semibold text-success-text ">+12.4%</span>
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
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs ">
                <p className="text-xs font-medium text-muted-foreground ">Active Pipeline</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white">$842.0k</span>
                  <span className="text-xs font-semibold text-strong-foreground ">+34% vel</span>
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
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs ">
                <p className="text-xs font-medium text-muted-foreground ">Cash Runway</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white">24 Mos</span>
                  <span className="text-xs font-semibold text-primary ">+6mo ext</span>
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
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs ">
                <p className="text-xs font-medium text-muted-foreground ">Win Rate</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white">94.8%</span>
                  <span className="text-xs font-semibold text-warning-text ">+5.2pp</span>
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
            <div className="p-4 sm:p-6 bg-card ">
              {activeTab === 'ui' ? <SalesFlowPreviewMini /> : <HeadlessApiPreviewMini />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
