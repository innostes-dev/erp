'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileText,
  FolderGit2,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { MODULES_DATA } from '@/lib/modules-data';
import { ModulePreviewInteractive } from './ModulePreviewInteractive';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  salesflow: <TrendingUp className="size-4" />,
  peopleops: <Users className="size-4" />,
  hireflow: <Briefcase className="size-4" />,
  ledgerflow: <DollarSign className="size-4" />,
  stockflow: <Boxes className="size-4" />,
  sprintflow: <FolderGit2 className="size-4" />,
  docflow: <FileText className="size-4" />,
};

type CategoryFilter = 'all' | 'revenue' | 'people' | 'finance' | 'product' | 'developer';

interface DirectoryCard {
  id: string;
  category: CategoryFilter;
  title: string;
  domain: string;
  spec: string;
  tagline: string;
  description: string;
  capabilities: string[];
  metricLabel: string;
  metricValue: string;
  href: string;
  actionLabel: string;
  icon: React.ReactNode;
  theme: {
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    checkColor: string;
    hoverBorder: string;
  };
}

const CATEGORY_TABS: { id: CategoryFilter; label: string; count: number }[] = [
  { id: 'all', label: 'All Solutions', count: 9 },
  { id: 'revenue', label: 'Revenue & CRM', count: 1 },
  { id: 'people', label: 'People & Talent', count: 2 },
  { id: 'finance', label: 'Finance & Logistics', count: 2 },
  { id: 'product', label: 'Product & Docs', count: 2 },
  { id: 'developer', label: 'Developer Tools', count: 2 },
];

const DIRECTORY_CARDS: DirectoryCard[] = [
  {
    id: 'salesflow',
    category: 'revenue',
    title: 'SalesFlow',
    domain: 'Revenue Operations',
    spec: 'REST & Kernel Events',
    tagline: 'High-velocity deal pipelines & revenue governance',
    description: 'Track pipeline stages with automated probability scoring, generate compliant quotes, and forecast ARR without CRM bloat.',
    capabilities: [
      'Visual Kanban pipeline with stage-weighted win probability',
      'One-click quote generation & LedgerFlow invoice sync',
    ],
    metricLabel: 'Forecast Accuracy',
    metricValue: '98.2%',
    href: '/modules/salesflow',
    actionLabel: 'Explore SalesFlow',
    icon: <TrendingUp className="size-6" />,
    theme: {
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconBorder: 'border-blue-500/20 dark:border-blue-500/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeText: 'text-blue-700 dark:text-blue-300',
      checkColor: 'text-blue-500 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-400/60 dark:hover:border-blue-500/40',
    },
  },
  {
    id: 'peopleops',
    category: 'people',
    title: 'PeopleOps',
    domain: 'Human Capital & HR',
    spec: 'PostgreSQL RLS Isolated',
    tagline: 'Unified employee directory, org charts & leave policies',
    description: 'Manage workforce profiles, dynamic hierarchical reporting lines, custom leave quotas, and approval chains in one place.',
    capabilities: [
      'Interactive org charts with real-time reporting hierarchies',
      'Automated multi-tier leave quotas & approval routing',
    ],
    metricLabel: 'Approval Turnaround',
    metricValue: '< 2 hrs',
    href: '/modules/peopleops',
    actionLabel: 'Explore PeopleOps',
    icon: <Users className="size-6" />,
    theme: {
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconBorder: 'border-emerald-500/20 dark:border-emerald-500/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      checkColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-400/60 dark:hover:border-emerald-500/40',
    },
  },
  {
    id: 'hireflow',
    category: 'people',
    title: 'HireFlow',
    domain: 'Talent Acquisition',
    spec: 'Structured Scorecards',
    tagline: 'End-to-end recruitment pipelines & candidate scoring',
    description: 'Source top talent, evaluate candidates against standardized rubrics, and collaborate on hiring decisions seamlessly.',
    capabilities: [
      'Visual stage-gate applicant tracking & resume ingestion',
      'Standardized interviewer scorecards & bias reduction',
    ],
    metricLabel: 'Time-to-Hire',
    metricValue: '-42%',
    href: '/modules/hireflow',
    actionLabel: 'Explore HireFlow',
    icon: <Briefcase className="size-6" />,
    theme: {
      iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
      iconBorder: 'border-violet-500/20 dark:border-violet-500/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      badgeBg: 'bg-violet-50 dark:bg-violet-950/60',
      badgeText: 'text-violet-700 dark:text-violet-300',
      checkColor: 'text-violet-500 dark:text-violet-400',
      hoverBorder: 'hover:border-violet-400/60 dark:hover:border-violet-500/40',
    },
  },
  {
    id: 'ledgerflow',
    category: 'finance',
    title: 'LedgerFlow',
    domain: 'Financial Governance',
    spec: 'Immutable Double-Entry',
    tagline: 'Audit-proof double-entry accounting & financial statements',
    description: 'Real-time ledger with automated debit/credit balancing, multi-currency invoicing, expense tracking, and GAAP compliance.',
    capabilities: [
      'Zero-discrepancy double-entry verification engine',
      'Real-time automated balance sheets & P&L generation',
    ],
    metricLabel: 'Reconciliation',
    metricValue: '0 ms',
    href: '/modules/ledgerflow',
    actionLabel: 'Explore LedgerFlow',
    icon: <DollarSign className="size-6" />,
    theme: {
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconBorder: 'border-amber-500/20 dark:border-amber-500/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeText: 'text-amber-700 dark:text-amber-300',
      checkColor: 'text-amber-500 dark:text-amber-400',
      hoverBorder: 'hover:border-amber-400/60 dark:hover:border-amber-500/40',
    },
  },
  {
    id: 'stockflow',
    category: 'finance',
    title: 'StockFlow',
    domain: 'Inventory & Supply',
    spec: 'Multi-Warehouse Routing',
    tagline: 'Multi-location inventory tracking & automated reordering',
    description: 'Track stock movements across warehouses, manage batch/serial numbers, and automate replenishment triggers.',
    capabilities: [
      'Multi-facility warehouse allocation & transfer logs',
      'Automated reorder thresholds & vendor PO generation',
    ],
    metricLabel: 'Stockout Reduction',
    metricValue: '99.4%',
    href: '/modules/stockflow',
    actionLabel: 'Explore StockFlow',
    icon: <Boxes className="size-6" />,
    theme: {
      iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      iconBorder: 'border-cyan-500/20 dark:border-cyan-500/30',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
      badgeText: 'text-cyan-700 dark:text-cyan-300',
      checkColor: 'text-cyan-500 dark:text-cyan-400',
      hoverBorder: 'hover:border-cyan-400/60 dark:hover:border-cyan-500/40',
    },
  },
  {
    id: 'sprintflow',
    category: 'product',
    title: 'SprintFlow',
    domain: 'Engineering & Sprints',
    spec: 'GitHub & GitLab Bi-directional',
    tagline: 'Agile project tracking, sprint cycles & backlog grooming',
    description: 'Coordinate engineering and product roadmaps with Kanban sprint boards, velocity charts, and native Git commits linkage.',
    capabilities: [
      'Sprint burndown metrics & automated velocity tracking',
      'Two-way sync with GitHub issues & pull requests',
    ],
    metricLabel: 'Sprint Velocity',
    metricValue: '+28%',
    href: '/modules/sprintflow',
    actionLabel: 'Explore SprintFlow',
    icon: <FolderGit2 className="size-6" />,
    theme: {
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      iconBorder: 'border-rose-500/20 dark:border-rose-500/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
      badgeText: 'text-rose-700 dark:text-rose-300',
      checkColor: 'text-rose-500 dark:text-rose-400',
      hoverBorder: 'hover:border-rose-400/60 dark:hover:border-rose-500/40',
    },
  },
  {
    id: 'docflow',
    category: 'product',
    title: 'DocFlow',
    domain: 'Docs & Knowledge',
    spec: 'Markdown MDX & Semantic Search',
    tagline: 'Centralized company wiki, SOPs & collaborative handbooks',
    description: 'Create and organize institutional knowledge with versioned Markdown, nested document hierarchies, and instant search.',
    capabilities: [
      'Collaborative rich-text SOPs with revision diffs',
      'Sub-15ms full-text search across all company documents',
    ],
    metricLabel: 'Search Latency',
    metricValue: '< 15ms',
    href: '/modules/docflow',
    actionLabel: 'Explore DocFlow',
    icon: <FileText className="size-6" />,
    theme: {
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      iconBorder: 'border-indigo-500/20 dark:border-indigo-500/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      badgeText: 'text-indigo-700 dark:text-indigo-300',
      checkColor: 'text-indigo-500 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-400/60 dark:hover:border-indigo-500/40',
    },
  },
  {
    id: 'tracura',
    category: 'developer',
    title: 'Tracura API Telemetry',
    domain: 'Developer Infrastructure',
    spec: 'Sub-ms Real-Time Ingest',
    tagline: 'Universal API observability & request tracing for any project',
    description: 'Monitor any API, microservice, webhook, and AI agent pipeline your company runs. Full payload inspection with zero external APM bills.',
    capabilities: [
      'Sub-millisecond request tracing & live payload inspection',
      'Automated error rate alerts & latency anomaly telemetry',
    ],
    metricLabel: 'Throughput',
    metricValue: '10,000+ req/s',
    href: '/plugins/tracura',
    actionLabel: 'Explore Telemetry',
    icon: <Activity className="size-6" />,
    theme: {
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconBorder: 'border-emerald-500/20 dark:border-emerald-500/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      checkColor: 'text-emerald-500 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-400/60 dark:hover:border-emerald-500/40',
    },
  },
  {
    id: 'ui',
    category: 'developer',
    title: 'Enterprise Design System',
    domain: 'Design System & Widgets',
    spec: 'Tailwind CSS • WCAG AAA',
    tagline: '240+ accessible UI components & rich business widgets',
    description: 'Build any custom internal tool, client portal, or SaaS application with pre-built Kanban boards, virtualized tables, and chart widgets.',
    capabilities: [
      '240+ components including Kanban, Data Tables & Widgets',
      'Standalone package ready for any company software project',
    ],
    metricLabel: 'Ready Widgets',
    metricValue: '240+ Components',
    href: '/ui',
    actionLabel: 'Explore Design System',
    icon: <Layers className="size-6" />,
    theme: {
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconBorder: 'border-purple-500/20 dark:border-purple-500/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
      badgeText: 'text-purple-700 dark:text-purple-300',
      checkColor: 'text-purple-500 dark:text-purple-400',
      hoverBorder: 'hover:border-purple-400/60 dark:hover:border-purple-500/40',
    },
  },
];

export function ModuleMatrixSection() {
  const modulesList = Object.values(MODULES_DATA);
  const [activeSlug, setActiveSlug] = useState<string>('salesflow');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const activeModule = MODULES_DATA[activeSlug] || modulesList[0];

  const filteredCards =
    categoryFilter === 'all'
      ? DIRECTORY_CARDS
      : DIRECTORY_CARDS.filter((card) => card.category === categoryFilter);

  return (
    <section id="modules" className="relative overflow-hidden py-20 lg:py-28 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[700px] rounded-full bg-gradient-to-tr from-purple-500/10 via-blue-500/10 to-orange-400/10 blur-[130px] dark:from-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-400/20 dark:text-violet-300">
              <Boxes className="size-3" /> Modular Suites
            </span>
            <span>Activate As You Grow</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">0 Circular Dependencies</span>
          </div>

          <h2 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            All the operational power,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">none of the bloat</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Activate only what your company needs today. Every suite operates with independent domain schemas,
            strict OpenAPI REST contracts, and seamless event synchronization.
          </p>
        </div>

        {/* ── Interactive Live Module Showcase Window ─────────────── */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
          
          {/* Suite Selector Pill Tab Bar */}
          <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70 p-2.5 scrollbar-none dark:border-white/5 dark:bg-slate-950/70">
            <div className="flex gap-1.5 min-w-full sm:min-w-0">
              {modulesList.map((mod) => {
                const isActive = activeSlug === mod.slug;
                return (
                  <button
                    key={mod.slug}
                    onClick={() => setActiveSlug(mod.slug)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-white dark:text-slate-950' : 'text-blue-500 dark:text-blue-400'}>
                      {MODULE_ICONS[mod.slug]}
                    </span>
                    <span>{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Suite Info Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-white/80 px-6 py-4 dark:border-white/5 dark:bg-slate-900/80 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {activeModule.badge}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  100% Free Self-Hosted
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {activeModule.tagline}
              </p>
            </div>

            <Link
              href={`/modules/${activeModule.slug}`}
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 md:self-auto"
            >
              <span>Explore {activeModule.name} Suite Page</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Interactive Screen & API Sandbox */}
          <div className="p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-950/40">
            <ModulePreviewInteractive type={activeModule.previewType} />
          </div>
        </div>

        {/* ── Enterprise Modular Business Directory ────────────────────────── */}
        <div className="mt-20">
          
          {/* Section Header & Subtitle */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-blue-600 dark:text-blue-400 mb-2">
                <Sparkles className="size-3.5" />
                <span>Domain Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Modular Business Directory
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                7 core business suites and 2 standalone developer frameworks. Deploy together as a unified operating system or activate individually via OpenAPI REST endpoints.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                100% Open-Source
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Zero Per-Seat Fees
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950'
                      : 'border border-slate-200/70 bg-white/70 text-slate-600 hover:bg-slate-100/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-slate-900/30 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`bento-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.theme.hoverBorder}`}
              >
                <div>
                  {/* Top Bar: Icon Tile + Domain & Spec Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.theme.iconBg} ${item.theme.iconBorder} border shadow-2xs transition-transform duration-300 group-hover:scale-105`}
                    >
                      <span className={item.theme.iconColor}>{item.icon}</span>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${item.theme.badgeBg} ${item.theme.badgeText}`}
                      >
                        {item.domain}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {item.spec}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-5">
                    <h4 className="text-xl font-bold tracking-tight text-slate-950 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {item.tagline}
                    </p>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Enterprise Capability Highlights */}
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
                    {item.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className={`size-3.5 shrink-0 mt-0.5 ${item.theme.checkColor}`} />
                        <span className="leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Metric Badge & Action Link */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      {item.metricLabel}:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.metricValue}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 transition-colors group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
