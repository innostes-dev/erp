import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  Compass,
  FileCode2,
  Home,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="site-canvas hero-mesh relative flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center overflow-hidden">
      {/* Centered Ambient Atmospheric Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="size-[500px] sm:size-[650px] rounded-full bg-gradient-to-tr from-amber-400/10 via-purple-500/15 to-blue-500/10 blur-[130px] dark:from-orange-500/15 dark:via-purple-600/20 dark:to-blue-600/20" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center">
        {/* Frosted Floating 404 Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
            404 Error
          </span>
          <span>Route Not Found</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-slate-600 dark:text-slate-400">Zero Ingestion Loss</span>
        </div>

        {/* Big Cadence Headline */}
        <h1 className="animate-fade-up stagger-1 mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
          Lost in the
          <br className="hidden sm:inline" />{' '}
          <span className="gradient-cadence">business architecture?</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up stagger-2 mt-4 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-300">
          The page or endpoint you are looking for has been relocated or does not exist. Use the links below to return to safe ground.
        </p>

        {/* Dual Pill Action CTAs */}
        <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Home className="size-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/modules"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs backdrop-blur-xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <Boxes className="size-4 text-blue-500" />
            <span>Browse Business Suites</span>
          </Link>
        </div>

        {/* Bento Cards of Popular Destinations */}
        <div className="animate-fade-up stagger-4 mt-12 w-full text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 text-center">
            Popular Navigation Targets
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                title: 'Developer Documentation',
                desc: 'Architecture, guides, and OpenAPI schemas',
                href: '/docs',
                icon: <BookOpen className="size-4 text-blue-500" />,
              },
              {
                title: 'Enterprise Design System',
                desc: '240+ accessible UI components & widgets for any project',
                href: '/ui',
                icon: <Layers className="size-4 text-purple-500" />,
              },
              {
                title: 'Tracura API Telemetry',
                desc: 'Real-time API observability & tracing for your company',
                href: '/plugins/tracura',
                icon: <Activity className="size-4 text-emerald-500" />,
              },
              {
                title: 'Getting Started Guide',
                desc: 'Deploy self-hosted in under 5 minutes',
                href: '/docs/getting-started',
                icon: <Compass className="size-4 text-amber-500" />,
              },
            ].map((dest) => (
              <Link
                key={dest.href}
                href={dest.href}
                className="bento-card group flex items-start gap-3 rounded-2xl p-4 transition-all"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 shadow-2xs dark:border-white/10 dark:bg-white/5">
                  {dest.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                      {dest.title}
                    </span>
                    <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {dest.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
