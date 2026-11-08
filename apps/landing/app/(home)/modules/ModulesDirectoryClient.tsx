'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Boxes,
  Briefcase,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  FileText,
  FolderGit2,
  Layers,
  LayoutGrid,
  ListFilter,
  Network,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { MODULES_DATA } from '@/lib/modules-data';

type PillarId = 'all' | 'revenue' | 'people' | 'finance' | 'product' | 'developer';

interface DirectoryItem {
  slug: string;
  pillarId: 'revenue' | 'people' | 'finance' | 'product' | 'developer';
  name: string;
  department: string;
  tagline: string;
  heroDescription: string;
  replaces: string;
  technicalSpec: string;
  stats: { label: string; value: string }[];
  capabilities: string[];
  href: string;
  actionText: string;
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

interface PillarGroup {
  id: 'revenue' | 'people' | 'finance' | 'product' | 'developer';
  title: string;
  badge: string;
  subtitle: string;
  replacesText: string;
  icon: React.ReactNode;
  theme: {
    border: string;
    bgBadge: string;
    textBadge: string;
  };
  items: DirectoryItem[];
}

const ALL_DIRECTORY_ITEMS: DirectoryItem[] = [
  // ── 1. Revenue & CRM
  {
    slug: 'salesflow',
    pillarId: 'revenue',
    name: 'SalesFlow',
    department: 'Revenue & CRM',
    tagline: 'High-velocity deal pipelines, quotes & revenue governance',
    heroDescription:
      'Manage sales accounts, track multi-stage deal pipelines with automated win probability scoring, create itemized quotes, and forecast ARR without CRM bloat.',
    replaces: 'Salesforce, HubSpot CRM, Pipedrive',
    technicalSpec: 'REST Endpoints • Event-Driven Invoicing',
    stats: [
      { label: 'Forecast Accuracy', value: '98.2%' },
      { label: 'Pipeline Velocity', value: '+34%' },
    ],
    capabilities: [
      'Visual Kanban deal pipeline with stage-weighted win probability',
      'One-click itemized pricing quotes with LedgerFlow invoice sync',
      'Account & contact timeline tracking with PostgreSQL full-text search',
    ],
    href: '/modules/salesflow',
    actionText: 'Explore SalesFlow Suite',
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

  // ── 2. People & Talent
  {
    slug: 'peopleops',
    pillarId: 'people',
    name: 'PeopleOps',
    department: 'Human Capital & HR',
    tagline: 'Workforce directory, dynamic org charts & leave policies',
    heroDescription:
      'Maintain employee profiles, visual reporting hierarchies, tiered leave entitlement quotas, and department approval routing in a single unified hub.',
    replaces: 'Workday, BambooHR, Deel, Rippling',
    technicalSpec: 'PostgreSQL RLS Isolation • Multi-Tenant',
    stats: [
      { label: 'Approval Speed', value: '< 2 hrs' },
      { label: 'Seat Fees', value: '₹0 / User' },
    ],
    capabilities: [
      'Interactive hierarchical organization charts with live reporting lines',
      'Multi-tier leave policies, balance tracking & manager approvals',
      'Role-based permissions with strict row-level tenant security',
    ],
    href: '/modules/peopleops',
    actionText: 'Explore PeopleOps Suite',
    icon: <Users className="size-6" />,
    theme: {
      iconBg: 'bg-success-bg ',
      iconBorder: 'border-border ',
      iconColor: 'text-success-text ',
      badgeBg: 'bg-success-bg ',
      badgeText: 'text-success-text ',
      checkColor: 'text-success-text ',
      hoverBorder: 'hover:border-border ',
    },
  },
  {
    slug: 'hireflow',
    pillarId: 'people',
    name: 'HireFlow',
    department: 'Talent Acquisition & ATS',
    tagline: 'Stage-gate recruitment pipelines & candidate scoring rubrics',
    heroDescription:
      'Streamline talent sourcing, track applicants across custom stages, collect standardized interviewer rubrics, and convert offers into PeopleOps hires.',
    replaces: 'Greenhouse, Lever, Ashby, Workable',
    technicalSpec: 'Structured Scorecards • Candidate REST APIs',
    stats: [
      { label: 'Time-to-Hire', value: '-42%' },
      { label: 'Candidate Velocity', value: '3.2x' },
    ],
    capabilities: [
      'Visual stage-gate applicant tracking with automated resume ingestion',
      'Standardized interviewer scorecards to eliminate hiring bias',
      'Seamless offer-to-employee conversion directly into PeopleOps',
    ],
    href: '/modules/hireflow',
    actionText: 'Explore HireFlow Suite',
    icon: <Briefcase className="size-6" />,
    theme: {
      iconBg: 'bg-ai-tint ',
      iconBorder: 'border-border ',
      iconColor: 'text-ai ',
      badgeBg: 'bg-ai-tint ',
      badgeText: 'text-ai ',
      checkColor: 'text-ai ',
      hoverBorder: 'hover:border-border ',
    },
  },

  // ── 3. Finance & Operations
  {
    slug: 'ledgerflow',
    pillarId: 'finance',
    name: 'LedgerFlow',
    department: 'Financial Governance & Accounting',
    tagline: 'Audit-proof double-entry general ledger & balance sheets',
    heroDescription:
      'Enforce GAAP double-entry integrity with zero-discrepancy debit/credit validation, automated invoicing, multi-currency accounting, and financial reporting.',
    replaces: 'QuickBooks, NetSuite, Xero, Zoho Books',
    technicalSpec: 'Immutable Double-Entry • Zero Rounding Error',
    stats: [
      { label: 'Reconciliation', value: '0 ms' },
      { label: 'Audit Trail', value: '100% Verified' },
    ],
    capabilities: [
      'Strict double-entry ledger with automated debit/credit balancing',
      'Real-time automated generation of P&L, balance sheets & cash flow',
      'Direct integration with SalesFlow quotes for instant accounts receivable',
    ],
    href: '/modules/ledgerflow',
    actionText: 'Explore LedgerFlow Suite',
    icon: <DollarSign className="size-6" />,
    theme: {
      iconBg: 'bg-warning-bg ',
      iconBorder: 'border-border ',
      iconColor: 'text-warning-text ',
      badgeBg: 'bg-warning-bg ',
      badgeText: 'text-warning-text ',
      checkColor: 'text-warning-text ',
      hoverBorder: 'hover:border-border ',
    },
  },
  {
    slug: 'stockflow',
    pillarId: 'finance',
    name: 'StockFlow',
    department: 'Inventory & Supply Chain',
    tagline: 'Multi-location inventory tracking & automated replenishment',
    heroDescription:
      'Manage multi-warehouse physical stock, lot/serial tracking, supplier purchase orders, and automatic low-stock replenishment thresholds.',
    replaces: 'Fishbowl, SAP Inventory, TradeGecko, Katana',
    technicalSpec: 'Multi-Warehouse Allocation • Barcode / SKU',
    stats: [
      { label: 'Stockout Reduction', value: '99.4%' },
      { label: 'Audit Variance', value: '< 0.01%' },
    ],
    capabilities: [
      'Multi-warehouse allocation with real-time transfer tracking',
      'Automated reorder point triggers & vendor purchase orders',
      'Direct cost-of-goods calculation synced into LedgerFlow journal entries',
    ],
    href: '/modules/stockflow',
    actionText: 'Explore StockFlow Suite',
    icon: <Boxes className="size-6" />,
    theme: {
      iconBg: 'bg-info-bg ',
      iconBorder: 'border-border ',
      iconColor: 'text-info-text ',
      badgeBg: 'bg-info-bg ',
      badgeText: 'text-info-text ',
      checkColor: 'text-info-text ',
      hoverBorder: 'hover:border-border ',
    },
  },

  // ── 4. Product & Knowledge
  {
    slug: 'sprintflow',
    pillarId: 'product',
    name: 'SprintFlow',
    department: 'Engineering & Agile Sprints',
    tagline: 'Agile sprint roadmaps, cycle burndowns & Git commit linkage',
    heroDescription:
      'Plan sprints, coordinate cross-functional engineering releases, analyze velocity burndowns, and link pull requests bi-directionally with GitHub/GitLab.',
    replaces: 'Jira Software, Linear, Asana, Monday.com',
    technicalSpec: 'Two-Way Git Sync • Sub-Task Hierarchies',
    stats: [
      { label: 'Sprint Velocity', value: '+28%' },
      { label: 'Cycle Time', value: '-35%' },
    ],
    capabilities: [
      'Agile Kanban/Scrum sprint boards with automated velocity burndown',
      'Bi-directional GitHub & GitLab PR issue link tracking',
      'Task estimation, backlog grooming, and roadmap milestone planning',
    ],
    href: '/modules/sprintflow',
    actionText: 'Explore SprintFlow Suite',
    icon: <FolderGit2 className="size-6" />,
    theme: {
      iconBg: 'bg-error-bg ',
      iconBorder: 'border-border ',
      iconColor: 'text-error-text ',
      badgeBg: 'bg-error-bg ',
      badgeText: 'text-error-text ',
      checkColor: 'text-error-text ',
      hoverBorder: 'hover:border-border ',
    },
  },
  {
    slug: 'docflow',
    pillarId: 'product',
    name: 'DocFlow',
    department: 'Documentation & Knowledge Base',
    tagline: 'Centralized company wiki, SOPs & collaborative handbooks',
    heroDescription:
      'Publish versioned operational documentation, standard operating procedures, and developer guides with sub-15ms semantic search and diff history.',
    replaces: 'Notion, Confluence, GitBook, Slite',
    technicalSpec: 'Markdown MDX • Semantic Search • Version Diffs',
    stats: [
      { label: 'Search Latency', value: '< 15ms' },
      { label: 'Revision Diffs', value: 'Full History' },
    ],
    capabilities: [
      'Collaborative rich-text SOPs with version control & diff inspection',
      'Sub-15ms full-text search across company policies & engineering docs',
      'Tenant privacy boundaries ensuring sensitive docs stay confidential',
    ],
    href: '/modules/docflow',
    actionText: 'Explore DocFlow Suite',
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

  // ── 5. Developer Platform & Infrastructure
  {
    slug: 'tracura',
    pillarId: 'developer',
    name: 'Tracura API Telemetry',
    department: 'Developer Observability',
    tagline: 'Universal API tracing, sub-ms logging & performance APM',
    heroDescription:
      'Monitor every API, microservice, webhook, and AI agent pipeline your company builds. Sub-millisecond ingest and payload inspection with zero 3rd-party APM bills.',
    replaces: 'Datadog APM, New Relic, Dynatrace, Sentry',
    technicalSpec: 'Sub-ms Ingest • Zero Third-Party SaaS APM Fees',
    stats: [
      { label: 'Ingest Latency', value: '< 0.2ms' },
      { label: 'Throughput', value: '10,000+ req/s' },
    ],
    capabilities: [
      'Sub-millisecond API request/response logging & payload inspection',
      'Real-time endpoint latency percentiles (p50, p95, p99) & error alerting',
      'Drop-in universal middleware for FastAPI, Next.js, Express & Go',
    ],
    href: '/plugins/tracura',
    actionText: 'Explore API Telemetry',
    icon: <Activity className="size-6" />,
    theme: {
      iconBg: 'bg-success-bg ',
      iconBorder: 'border-border ',
      iconColor: 'text-success-text ',
      badgeBg: 'bg-success-bg ',
      badgeText: 'text-success-text ',
      checkColor: 'text-success-text ',
      hoverBorder: 'hover:border-border ',
    },
  },
  {
    slug: 'ui',
    pillarId: 'developer',
    name: 'Enterprise Design System',
    department: 'Design System & Widgets',
    tagline: '240+ accessible UI components & pre-built business widgets',
    heroDescription:
      'Build any custom internal tool, client portal, or SaaS application with pre-built Kanban boards, virtualized data tables, interactive charts, and rich widgets.',
    replaces: 'MUI Enterprise, Ant Design Pro, Syncfusion',
    technicalSpec: 'Tailwind CSS • WCAG AAA • Independent Standalone',
    stats: [
      { label: 'Widget Library', value: '240+ Components' },
      { label: 'License Fee', value: '₹0 Standalone' },
    ],
    capabilities: [
      '240+ components including Kanban boards, Data Tables, and Widgets',
      'Independent package ready for any custom company software project',
      'Strict WCAG AAA accessibility, full keyboard navigation & dark mode',
    ],
    href: '/ui',
    actionText: 'Explore Design System',
    icon: <Code2 className="size-6" />,
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

const PILLAR_GROUPS: PillarGroup[] = [
  {
    id: 'revenue',
    title: 'Revenue Operations & Commercial',
    badge: 'Sales & Customer Pillar',
    subtitle: 'Manage client accounts, high-velocity deal pipelines, and automated quote-to-cash conversions.',
    replacesText: 'Salesforce • HubSpot CRM • Pipedrive',
    icon: <TrendingUp className="size-5 text-primary" />,
    theme: {
      border: 'border-border',
      bgBadge: 'bg-primary-tint ',
      textBadge: 'text-primary ',
    },
    items: ALL_DIRECTORY_ITEMS.filter((i) => i.pillarId === 'revenue'),
  },
  {
    id: 'people',
    title: 'People Operations & Talent Acquisition',
    badge: 'Human Capital Pillar',
    subtitle: 'Maintain your complete workforce directory, org charts, leave policies, and candidate scorecards.',
    replacesText: 'Workday • BambooHR • Greenhouse • Lever',
    icon: <Users className="size-5 text-success-text" />,
    theme: {
      border: 'border-border',
      bgBadge: 'bg-success-bg ',
      textBadge: 'text-success-text ',
    },
    items: ALL_DIRECTORY_ITEMS.filter((i) => i.pillarId === 'people'),
  },
  {
    id: 'finance',
    title: 'Financial Governance & Supply Chain',
    badge: 'Finance & Logistics Pillar',
    subtitle: 'Audit-proof double-entry general ledger, automated GAAP invoices, and multi-warehouse inventory.',
    replacesText: 'QuickBooks • NetSuite • SAP Inventory • TradeGecko',
    icon: <DollarSign className="size-5 text-warning-text" />,
    theme: {
      border: 'border-border',
      bgBadge: 'bg-warning-bg ',
      textBadge: 'text-warning-text ',
    },
    items: ALL_DIRECTORY_ITEMS.filter((i) => i.pillarId === 'finance'),
  },
  {
    id: 'product',
    title: 'Product Engineering & Knowledge Base',
    badge: 'Engineering & Docs Pillar',
    subtitle: 'Coordinate sprint roadmaps linked to Git pull requests, and maintain company SOPs & handbooks.',
    replacesText: 'Jira Software • Linear • Notion • Confluence',
    icon: <FolderGit2 className="size-5 text-error-text" />,
    theme: {
      border: 'border-border',
      bgBadge: 'bg-error-bg ',
      textBadge: 'text-error-text ',
    },
    items: ALL_DIRECTORY_ITEMS.filter((i) => i.pillarId === 'product'),
  },
  {
    id: 'developer',
    title: 'Developer Platform & Infrastructure',
    badge: 'Developer Tools Pillar',
    subtitle: 'Standalone developer tools to monitor APIs in real-time and build custom company applications.',
    replacesText: 'Datadog APM • New Relic • MUI Enterprise • Ant Design',
    icon: <Code2 className="size-5 text-muted-foreground" />,
    theme: {
      border: 'border-border',
      bgBadge: 'bg-muted ',
      textBadge: 'text-strong-foreground ',
    },
    items: ALL_DIRECTORY_ITEMS.filter((i) => i.pillarId === 'developer'),
  },
];

const FILTER_TABS: { id: PillarId; label: string; count: number }[] = [
  { id: 'all', label: 'All Domains', count: 9 },
  { id: 'revenue', label: 'Revenue & CRM', count: 1 },
  { id: 'people', label: 'People & Talent', count: 2 },
  { id: 'finance', label: 'Finance & Logistics', count: 2 },
  { id: 'product', label: 'Product & Docs', count: 2 },
  { id: 'developer', label: 'Developer Tools', count: 2 },
];

export function ModulesDirectoryClient() {
  const [activePillar, setActivePillar] = useState<PillarId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');

  // Filter items based on active pillar and search term
  const filteredItems = useMemo(() => {
    return ALL_DIRECTORY_ITEMS.filter((item) => {
      const matchesPillar = activePillar === 'all' || item.pillarId === activePillar;
      if (!matchesPillar) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.heroDescription.toLowerCase().includes(q) ||
        item.replaces.toLowerCase().includes(q) ||
        item.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [activePillar, searchQuery]);

  // Group filtered items into their respective pillar groups
  const visibleGroups = useMemo(() => {
    return PILLAR_GROUPS.map((group) => {
      const groupItems = filteredItems.filter((item) => item.pillarId === group.id);
      return { ...group, items: groupItems };
    }).filter((group) => group.items.length > 0);
  }, [filteredItems]);

  return (
    <div className="flex flex-1 flex-col">
      {/* ── 1. Hero Header with Tight Spacing & Domain Mental Model ─────────── */}
      <section className="hero-mesh relative overflow-hidden pt-6 pb-16 sm:pt-8 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24 section-divider transition-colors duration-300">
        
        {/* Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[700px] rounded-full blur-[130px]   " />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            
            {/* Floating Architecture Pill */}
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-strong-foreground ">
                <Layers className="size-3" /> Modular Business OS
              </span>
              <span>4 Business Pillars + Dev Platform</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">100% Free to Self-Host</span>
              <span className="text-muted-foreground ">•</span>
              <span className="text-muted-foreground ">Zero Per-Seat Fees</span>
            </div>

            {/* Big Headline */}
            <h1 className="animate-fade-up stagger-1 mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Every department of your company,
              <br className="hidden sm:inline" />{' '}
              <span className="gradient-cadence">modular &amp; completely decoupled</span>
            </h1>

            {/* Subheadline — Explaining the Architecture Clearly */}
            <p className="animate-fade-up stagger-2 mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground ">
              Innostes is not just an HR or CRM tool—it is a complete, modular business operating system.
              Run every department on one calm platform, or activate individual domain engines via OpenAPI REST contracts.
            </p>

            {/* Quick Department Mental Model Navigation */}
            <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { id: 'revenue', label: 'Revenue & CRM', icon: <TrendingUp className="size-3.5 text-primary" /> },
                { id: 'people', label: 'People & HR', icon: <Users className="size-3.5 text-success-text" /> },
                { id: 'finance', label: 'Finance & Supply', icon: <DollarSign className="size-3.5 text-warning-text" /> },
                { id: 'product', label: 'Product & Docs', icon: <FolderGit2 className="size-3.5 text-error-text" /> },
                { id: 'developer', label: 'Developer Tools', icon: <Code2 className="size-3.5 text-muted-foreground" /> },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setActivePillar(pill.id as PillarId);
                    const el = document.getElementById('directory-content');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-strong-foreground shadow-2xs transition-all hover:border-border-strong hover:bg-canvas dark:border-white/10 dark:bg-card  dark:hover:bg-card"
                >
                  {pill.icon}
                  <span>{pill.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Search & Department Filter Bar ──────────────────── */}
      <section id="directory-content" className="sticky top-16 z-30 border-b border-border bg-card py-4 dark:border-white/10  transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-subtle-foreground " />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by suite, department, or replacement (e.g. CRM, ATS, QuickBooks, Jira)..."
                className="w-full rounded-full border border-border bg-muted py-2 pl-9 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-border dark:border-white/10 dark:bg-card dark:text-white "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground "
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Department Filter Tabs & View Mode Toggle */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5">
                {FILTER_TABS.map((tab) => {
                  const isActive = activePillar === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePillar(tab.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-navy text-white shadow-xs dark:bg-card '
                          : 'border border-border bg-card text-muted-foreground hover:bg-muted dark:border-white/10 dark:bg-card  dark:hover:bg-card dark:hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-xs font-bold ${
                          isActive
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

              {/* View Mode Toggle: Grouped vs Flat Grid */}
              <div className="hidden sm:flex items-center rounded-full border border-border bg-muted p-0.5 dark:border-white/10 dark:bg-card">
                <button
                  onClick={() => setViewMode('grouped')}
                  title="Grouped by Department Pillars"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    viewMode === 'grouped'
                      ? 'bg-card text-foreground shadow-2xs  dark:text-white'
                      : 'text-muted-foreground hover:text-foreground  '
                  }`}
                >
                  <ListFilter className="size-3" />
                  <span>Pillars</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Compact Grid View"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-card text-foreground shadow-2xs  dark:text-white'
                      : 'text-muted-foreground hover:text-foreground  '
                  }`}
                >
                  <LayoutGrid className="size-3" />
                  <span>Grid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Main Directory Display (Grouped by Department vs Grid) ──────── */}
      <section className="py-14 lg:py-20 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* No results message */}
          {filteredItems.length === 0 && (
            <div className="bento-card mx-auto max-w-md rounded-3xl p-10 text-center">
              <Search className="mx-auto size-10 text-subtle-foreground " />
              <h3 className="mt-4 text-lg font-bold text-foreground dark:text-white">
                No matching modules found
              </h3>
              <p className="mt-2 text-xs text-muted-foreground ">
                No suites matched &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;CRM&rdquo;, &ldquo;HR&rdquo;, &ldquo;ledger&rdquo;, &ldquo;inventory&rdquo;, or &ldquo;telemetry&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActivePillar('all');
                }}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white dark:bg-card "
              >
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* VIEW MODE 1: Grouped by Department Pillars */}
          {viewMode === 'grouped' && visibleGroups.length > 0 && (
            <div className="space-y-16">
              {visibleGroups.map((group) => (
                <div key={group.id} className="scroll-mt-36">
                  
                  {/* Department Pillar Header */}
                  <div className="flex flex-col gap-3 pb-6 border-b border-border dark:border-white/10 md:flex-row md:items-end md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${group.theme.bgBadge} ${group.theme.textBadge}`}
                        >
                          {group.icon}
                          <span>{group.badge}</span>
                        </span>
                        <span className="text-xs text-muted-foreground ">•</span>
                        <span className="text-xs font-medium text-muted-foreground ">
                          {group.items.length} {group.items.length === 1 ? 'Suite' : 'Suites'}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground dark:text-white">
                        {group.title}
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                        {group.subtitle}
                      </p>
                    </div>

                    {/* Competitor / Alternative Anchor Tag */}
                    <div className="flex flex-col md:items-end text-xs text-muted-foreground ">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ">
                        Modern Open Alternative to
                      </span>
                      <span className="mt-0.5 font-medium text-strong-foreground ">
                        {group.replacesText}
                      </span>
                    </div>
                  </div>

                  {/* Pillar Cards Grid */}
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <DirectoryCardItem key={item.slug} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW MODE 2: Flat Grid View */}
          {viewMode === 'grid' && filteredItems.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <DirectoryCardItem key={item.slug} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Cross-Module Connected Company Ecosystem ────────────────────── */}
      <section className="py-20 lg:py-28 section-divider bg-muted transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold text-primary shadow-2xs ">
              <Workflow className="size-3.5" />
              <span>Zero Circular Dependencies</span>
            </div>

            <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
              How these suites work together
              <br />
              <span className="gradient-cadence">across your entire company</span>
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground ">
              Unlike monolithic legacy ERPs where database schemas are tightly coupled and fragile,
              every Innostes suite communicates through asynchronous kernel events and strict REST schemas.
            </p>
          </div>

          {/* Connected Workflows Bento Strip */}
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Flow 1 */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-primary ">
                  <span>Step 1: Revenue</span>
                  <span className="rounded-full bg-primary-tint px-2 py-0.5 text-xs">SalesFlow</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground dark:text-white">
                  Quote Converted to Deal
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground ">
                  When a sales representative marks an enterprise deal as closed-won, the kernel broadcasts a <code className="text-xs font-semibold text-primary ">deal.won</code> event.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-success-text border-t border-border pt-3 dark:border-white/5">
                <span>Automatic trigger</span>
                <ArrowRight className="size-3" />
                <span>LedgerFlow</span>
              </div>
            </div>

            {/* Flow 2 */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-warning-text ">
                  <span>Step 2: Accounting</span>
                  <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs">LedgerFlow</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground dark:text-white">
                  Invoice &amp; Journal Creation
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground ">
                  LedgerFlow captures the event, generates a tax-compliant invoice, and logs balanced debit/credit journal entries without duplicate manual data entry.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-info-text border-t border-border pt-3 dark:border-white/5">
                <span>Stock allocation</span>
                <ArrowRight className="size-3" />
                <span>StockFlow</span>
              </div>
            </div>

            {/* Flow 3 */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-ai ">
                  <span>Step 3: Talent</span>
                  <span className="rounded-full bg-ai-tint px-2 py-0.5 text-xs">HireFlow</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground dark:text-white">
                  Candidate Offer Accepted
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground ">
                  A software engineer accepts an offer in HireFlow. The event automatically provisions their employee record, department assignment, and leave balances in PeopleOps.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-success-text border-t border-border pt-3 dark:border-white/5">
                <span>Employee provision</span>
                <ArrowRight className="size-3" />
                <span>PeopleOps</span>
              </div>
            </div>

            {/* Flow 4 */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-strong-foreground ">
                  <span>Step 4: Observability</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Tracura</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground dark:text-white">
                  Real-Time APM Tracing
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground ">
                  Every asynchronous event, background job, and REST endpoint is traced in sub-millisecond real time by Tracura Telemetry with full payload inspection.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-strong-foreground border-t border-border pt-3 dark:border-white/5">
                <span>Sub-0.2ms latency</span>
                <ArrowRight className="size-3" />
                <span>All APIs</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Call To Action ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 lg:py-24 section-divider transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="size-[500px] rounded-full blur-[130px]   " />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bento-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
              <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text ">
                <Zap className="size-3" /> 5-Minute Setup
              </span>
              <span>All 7 Suites Included</span>
              <span className="text-muted-foreground ">•</span>
              <span className="font-semibold text-success-text ">100% Free Self-Hosted</span>
            </div>

            <h2 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
              Run your whole company on your own infrastructure
              <br />
              <span className="gradient-cadence">with zero seat taxes</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground ">
              Launch the official container image to deploy all business suites, PostgreSQL, and Tracura telemetry in minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
              >
                <span>Read Getting Started Guide</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span>Assisted Enterprise Setup</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Reusable Enterprise Card Item ──────────────────────────────────────────
function DirectoryCardItem({ item }: { item: DirectoryItem }) {
  return (
    <Link
      href={item.href}
      className={`bento-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border border-border bg-card dark:border-white/10   shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${item.theme.hoverBorder}`}
    >
      <div>
        {/* Top Header: Icon + Domain Badges */}
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
              {item.department}
            </span>
            <span className="text-xs font-medium text-muted-foreground ">
              {item.technicalSpec}
            </span>
          </div>
        </div>

        {/* Title, Tagline & Description */}
        <div className="mt-5">
          <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary dark:text-white ">
            {item.name}
          </h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground ">
            {item.tagline}
          </p>
          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {item.heroDescription}
          </p>
        </div>

        {/* "Replaces" Pill Anchor */}
        <div className="mt-4 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs dark:border-white/5 ">
          <span className="font-semibold text-muted-foreground ">Replaces: </span>
          <span className="font-medium text-strong-foreground ">{item.replaces}</span>
        </div>

        {/* Key Capabilities */}
        <div className="mt-4 space-y-2 border-t border-border pt-3 dark:border-white/5">
          {item.capabilities.map((cap) => (
            <div key={cap} className="flex items-start gap-2 text-xs text-strong-foreground ">
              <CheckCircle2 className={`size-3.5 shrink-0 mt-0.5 ${item.theme.checkColor}`} />
              <span className="leading-snug">{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Highlight Stat & Explore Link */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 dark:border-white/5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-strong-foreground ">
          {item.stats && item.stats[0] && (
            <>
              <span className="text-xs font-normal text-muted-foreground ">
                {item.stats[0].label}:
              </span>
              <span className="font-bold text-foreground dark:text-white">
                {item.stats[0].value}
              </span>
            </>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors group-hover:text-primary ">
          <span>{item.actionText}</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
