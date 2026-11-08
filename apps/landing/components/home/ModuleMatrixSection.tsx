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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-muted ',
      iconBorder: 'border-border ',
      iconColor: 'text-strong-foreground ',
      badgeBg: 'bg-muted ',
      badgeText: 'text-strong-foreground ',
      checkColor: 'text-muted-foreground ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-primary-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-primary ',
      badgeBg: 'bg-primary-tint ',
      badgeText: 'text-primary ',
      checkColor: 'text-primary ',
      hoverBorder: 'hover:border-border ',
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
      iconBg: 'bg-muted ',
      iconBorder: 'border-border ',
      iconColor: 'text-strong-foreground ',
      badgeBg: 'bg-muted ',
      badgeText: 'text-strong-foreground ',
      checkColor: 'text-muted-foreground ',
      hoverBorder: 'hover:border-border ',
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
    <section id="modules" data-chapter className="soft-wash relative overflow-hidden py-20 lg:py-28 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[700px] rounded-full blur-[130px]  " />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-strong-foreground ">
              <Boxes className="size-3" /> Modular Suites
            </span>
            <span>Activate As You Grow</span>
            <span className="text-muted-foreground ">•</span>
            <span className="font-semibold text-success-text ">0 Circular Dependencies</span>
          </div>

          <h2 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
            All the operational power,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">none of the bloat</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground ">
            Activate only what your company needs today. Every suite operates with independent domain schemas,
            strict OpenAPI REST contracts, and seamless event synchronization.
          </p>
        </div>

        {/* ── Interactive Live Module Showcase Window ─────────────── */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl dark:border-white/10 ">
          
          {/* Suite Selector Pill Tab Bar */}
          <div className="flex overflow-x-auto border-b border-border bg-muted p-2.5 scrollbar-none dark:border-white/5 ">
            <div className="flex gap-1.5 min-w-full sm:min-w-0">
              {modulesList.map((mod) => {
                const isActive = activeSlug === mod.slug;
                return (
                  <button
                    key={mod.slug}
                    onClick={() => setActiveSlug(mod.slug)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'bg-brand-navy text-white shadow-md dark:bg-card '
                        : 'text-muted-foreground hover:bg-muted  dark:hover:bg-card dark:hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-white ' : 'text-primary '}>
                      {MODULE_ICONS[mod.slug]}
                    </span>
                    <span>{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Suite Info Bar */}
          <div className="flex flex-col gap-4 border-b border-border bg-card px-6 py-4 dark:border-white/5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-semibold text-primary ">
                  {activeModule.badge}
                </span>
                <span className="text-xs font-semibold text-success-text ">
                  100% Free Self-Hosted
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-strong-foreground ">
                {activeModule.tagline}
              </p>
            </div>

            <Link
              href={`/modules/${activeModule.slug}`}
              className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-canvas px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted dark:border-white/10 dark:bg-card dark:text-white dark:hover:bg-card md:self-auto"
            >
              <span>Explore {activeModule.name} Suite Page</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Interactive Screen & API Sandbox */}
          <div className="p-4 sm:p-6 bg-muted ">
            <ModulePreviewInteractive type={activeModule.previewType} />
          </div>
        </div>

        {/* ── Enterprise Modular Business Directory ────────────────────────── */}
        <div className="mt-20">
          
          {/* Section Header & Subtitle */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-primary mb-2">
                <Sparkles className="size-3.5" />
                <span>Domain Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground dark:text-white">
                Modular Business Directory
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                7 core business suites and 2 standalone developer frameworks. Deploy together as a unified operating system or activate individually via OpenAPI REST endpoints.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-strong-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
                100% Open-Source
              </span>
              <span className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-strong-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
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
                      ? 'bg-brand-navy text-white shadow-md dark:bg-card '
                      : 'border border-border bg-card text-muted-foreground hover:bg-muted dark:border-white/10 dark:bg-card  dark:hover:bg-card'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-xs font-bold ${
                      isSelected
                        ? 'bg-card text-white  '
                        : 'bg-muted text-muted-foreground dark:bg-card '
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
                className={`bento-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-border bg-card dark:border-white/10   shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.theme.hoverBorder}`}
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
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.theme.badgeBg} ${item.theme.badgeText}`}
                      >
                        {item.domain}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground ">
                        {item.spec}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-5">
                    <h4 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary dark:text-white ">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground ">
                      {item.tagline}
                    </p>
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Enterprise Capability Highlights */}
                  <div className="mt-5 space-y-2 border-t border-border pt-4 dark:border-white/5">
                    {item.capabilities.map((cap) => (
                      <div key={cap} className="flex items-start gap-2 text-xs text-strong-foreground ">
                        <CheckCircle2 className={`size-3.5 shrink-0 mt-0.5 ${item.theme.checkColor}`} />
                        <span className="leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Metric Badge & Action Link */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4 dark:border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-strong-foreground ">
                    <span className="text-xs font-normal text-muted-foreground ">
                      {item.metricLabel}:
                    </span>
                    <span className="font-bold text-foreground dark:text-white">
                      {item.metricValue}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors group-hover:text-primary ">
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
