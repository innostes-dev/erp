import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@innostes/ui';
import {
  Accessibility,
  Activity,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FolderGit2,
  Layers,
  Layout,
  LayoutDashboard,
  Moon,
  MousePointerClick,
  Package,
  Palette,
  PanelsTopLeft,
  Plus,
  Sparkles,
  Table2,
  Terminal,
  Trash2,
  Wind,
  Zap,
} from 'lucide-react';
import { InstallCommand } from '@/components/docs/install-command';
import { uiName, uiPackage, uiVersion } from '@/lib/shared';

export const metadata: Metadata = {
  title: 'Innostes UI — Modern Enterprise Design System',
  description:
    'Accessible React components styled with Tailwind CSS and driven by ergonomic design tokens. Free, standalone, zero runtime bloat.',
};

const principles = [
  {
    Icon: Palette,
    title: 'Themeable by design',
    text: 'Every colour is a semantic token. Redefine tokens in your Tailwind theme and every component updates automatically.',
  },
  {
    Icon: Accessibility,
    title: 'Accessible first',
    text: 'Engineered on Base UI: keyboard navigation, ARIA attributes, and focus trap management out of the box.',
  },
  {
    Icon: Wind,
    title: 'Tailwind native',
    text: 'Components compile directly into Tailwind CSS classes. No extra runtime overhead, zero style injection bottlenecks.',
  },
  {
    Icon: Code2,
    title: 'Developer ergonomic',
    text: 'Strict TypeScript interfaces, sensible defaults, slot-based polymorphism (render prop), and classNames that always override.',
  },
  {
    Icon: Moon,
    title: 'Adaptive light & dark',
    text: 'Pre-tuned high-contrast palettes for light, dim, and dark modes with frictionless next-themes compatibility.',
  },
  {
    Icon: Package,
    title: 'Single zero-lockin package',
    text: `Install ${uiPackage} via pnpm or npm. Standalone ESM modules with complete tree-shaking for minimal bundle footprints.`,
  },
];

const swatches = [
  { name: 'primary', className: 'bg-primary', desc: 'Main action & brand accents' },
  { name: 'secondary', className: 'bg-secondary', desc: 'Subtle interactive surfaces' },
  { name: 'muted', className: 'bg-muted', desc: 'Background cards & dividers' },
  { name: 'destructive', className: 'bg-destructive', desc: 'High-risk warnings & actions' },
  { name: 'border', className: 'bg-border', desc: 'Hairline architectural lines' },
  { name: 'ring', className: 'bg-ring', desc: 'Keyboard focus indicators' },
];

const componentCategories = [
  {
    title: 'Actions & Buttons',
    icon: <MousePointerClick className="size-5 text-blue-500" />,
    desc: 'Button, ButtonGroup, Toggle, ToggleGroup with loading states and icon slots.',
    link: '/ui/docs/components/actions/button',
    items: ['Button', 'ButtonGroup', 'Toggle', 'ToggleGroup'],
  },
  {
    title: 'Data Display',
    icon: <Table2 className="size-5 text-emerald-500" />,
    desc: 'High-performance DataTable, Stat cards, Badges, Avatars, and TreeViews.',
    link: '/ui/docs/components/data-display/data-table',
    items: ['DataTable', 'Stat', 'Badge', 'Avatar', 'Card'],
  },
  {
    title: 'Overlays & Modals',
    icon: <PanelsTopLeft className="size-5 text-purple-500" />,
    desc: 'Accessible Dialogs, Sheets, Popovers, ContextMenus, and CommandPalettes.',
    link: '/ui/docs/components/overlays/dialog',
    items: ['Dialog', 'Sheet', 'CommandPalette', 'Popover'],
  },
  {
    title: 'Navigation & Layout',
    icon: <Layers className="size-5 text-indigo-500" />,
    desc: 'Segmented Tabs, Steppers, Accordions, Breadcrumbs, and TopBars.',
    link: '/ui/docs/components/navigation/tabs',
    items: ['Tabs', 'Stepper', 'Accordion', 'Breadcrumb'],
  },
  {
    title: 'Business Widgets',
    icon: <LayoutDashboard className="size-5 text-amber-500" />,
    desc: 'Kanban boards, MetricCards, Sparklines, ActivityFeeds, and AppSwitchers.',
    link: '/ui/docs/components/widgets/kanban-board',
    items: ['KanbanBoard', 'MetricCard', 'Sparkline', 'ActivityFeed'],
  },
  {
    title: 'Forms & Inputs',
    icon: <Code2 className="size-5 text-rose-500" />,
    desc: 'TextInputs, Selects, Checkboxes, Switches, and accessible Validation states.',
    link: '/ui/docs/components/forms/input',
    items: ['Input', 'Select', 'Checkbox', 'Switch'],
  },
];

export default function UiPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero Section with Cadence Mesh ──────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 lg:pt-32 lg:pb-36 section-divider transition-colors duration-300">
        {/* Centered Ambient Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-x-0 top-1/4 -z-10 flex justify-center">
          <div className="size-[500px] sm:size-[700px] rounded-full bg-gradient-to-tr from-purple-400/10 via-indigo-500/15 to-blue-500/10 blur-[130px] dark:from-purple-600/15 dark:via-blue-600/15 dark:to-orange-500/10" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Left Content */}
            <div className="text-center lg:col-span-7 lg:text-left">
              {/* Frosted Floating Pill Badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-purple-200/80 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <Sparkles className="size-3" /> Enterprise Design System
                </span>
                <span>Free for Any Project</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">240+ Widgets &amp; Components</span>
              </div>

              {/* Big Headline */}
              <h1 className="animate-fade-up stagger-1 mt-7 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
                One calm design system for
                <br className="hidden sm:inline" />{' '}
                <span className="gradient-cadence">any project your company builds</span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-up stagger-2 mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Not just for our business platform—use our battle-tested design system to build custom internal tools, client portals, and customer-facing apps. Packed with 240+ accessible React components, rich Kanban widgets, dense data tables, and charts so you can stop paying for expensive third-party component libraries.
              </p>

              {/* Dual Pill CTAs */}
              <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
                <Link
                  href="/ui/docs/components/actions/button"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                >
                  <span>Explore 240+ Components &amp; Widgets</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/ui/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs backdrop-blur-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  <span>Read Developer Documentation</span>
                </Link>
              </div>

              {/* Copyable Install Command */}
              <div className="animate-fade-up stagger-4 mt-8 max-w-sm mx-auto lg:mx-0">
                <InstallCommand command={`pnpm add ${uiPackage}`} />
              </div>
            </div>

            {/* Right Interactive Live Sandbox */}
            <div className="animate-fade-up stagger-2 lg:col-span-5">
              <div className="bento-card rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Live Component Interactive Preview
                    </span>
                  </div>
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    Base UI Runtime
                  </span>
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Button Hierarchy Variants
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Primary</Button>
                      <Button size="sm" variant="secondary">Secondary</Button>
                      <Button size="sm" variant="outline">Outline</Button>
                      <Button size="sm" variant="ghost">Ghost</Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Icons &amp; Semantic Actions
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" startIcon={<Plus className="size-3.5" />}>
                        Add record
                      </Button>
                      <Button size="sm" variant="secondary" startIcon={<Download className="size-3.5" />}>
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        iconOnly
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Loading &amp; Disabled States
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" loading loadingText="Committing changes…">
                        Save
                      </Button>
                      <Button size="sm" disabled>Disabled State</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 font-mono text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Zero CSS lock-in: </span>
                    Pass any Tailwind utility to <code className="text-slate-900 dark:text-white">className</code> and it cleanly overrides.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Component Suite Categories ────────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Component Ecosystem
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Everything Needed for Modern Dashboards
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Over 240+ tested primitives and composite widgets, from micro-buttons to full drag-and-drop Kanban boards.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {componentCategories.map((cat) => (
              <Link
                key={cat.title}
                href={cat.link}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 shadow-2xs dark:border-white/10 dark:bg-white/5">
                    {cat.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {cat.desc}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.items.map((it) => (
                      <span
                        key={it}
                        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-white/5">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 dark:text-blue-400 transition-all">
                    <span>View Component Docs</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architectural Principles Bento Grid ────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Guiding Principles
            </span>
            <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              What Every Component is Built to Guarantee
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Designed from first principles for performance, accessibility, and zero-headache developer adoption.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {principles.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7 transition-all"
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 shadow-2xs dark:border-white/10 dark:bg-white/5">
                    <Icon className="size-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Design Tokens & Theming Setup ──────────────────────────── */}
      <section className="py-20 lg:py-28 section-divider">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Palette className="size-3.5" />
                Ergonomic Design Tokens
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Driven by Semantic Color Tokens
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
                Components never rely on hardcoded hex colors. They strictly bind to CSS variables and semantic tokens,
                allowing you to rebrand the entire application by tweaking a single stylesheet.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {swatches.map((s) => (
                  <div
                    key={s.name}
                    className="bento-card overflow-hidden rounded-2xl p-3 transition-all"
                  >
                    <div className={`h-10 rounded-xl ${s.className}`} />
                    <div className="mt-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dark Slate Setup Cards */}
            <div className="flex flex-col gap-4">
              <SetupCard
                title="With Tailwind CSS v4"
                text="Components inherit your theme tokens with zero build configuration."
                code={`@import 'tailwindcss';
@import '${uiPackage}/tailwind.css';

@theme {
  --color-primary: var(--color-blue-600);
}`}
              />

              <SetupCard
                title="Without Tailwind CSS (Standalone Stylesheet)"
                text="Import the precompiled bundle in any vanilla React or Vite application."
                code={`import '${uiPackage}/styles.css';`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Conversion Bento CTA ──────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 section-divider transition-colors duration-300">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="size-[500px] rounded-full bg-gradient-to-tr from-purple-400/10 via-indigo-500/15 to-blue-500/10 blur-[130px] dark:from-purple-600/15 dark:via-blue-600/20 dark:to-orange-500/15" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bento-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                <Zap className="size-3" /> Get Started
              </span>
              <span>MIT / Apache 2.0</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">npm ready</span>
            </div>

            <h2 className="mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              Build any company dashboard or app
              <br />
              <span className="gradient-cadence">with our Design System</span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400">
              Install the design system into any React or Next.js project. Ship enterprise-grade interfaces in hours with pre-built widgets, tables, and charts—free from third-party UI licenses.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/ui/docs/installation"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <span>Installation Guide</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/ui/docs/theming"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <span>Theme Configuration</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SetupCard({
  title,
  text,
  code,
}: {
  title: string;
  text: string;
  code: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-rose-500/80" />
          <div className="size-2.5 rounded-full bg-amber-500/80" />
          <div className="size-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-1 text-xs font-semibold text-slate-300">{title}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{text}</p>
      <pre
        tabIndex={0}
        aria-label={`${title} configuration snippet`}
        className="mt-3 overflow-x-auto rounded-xl bg-slate-900/90 p-4 font-mono text-xs leading-relaxed text-slate-200 border border-slate-800/80"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
