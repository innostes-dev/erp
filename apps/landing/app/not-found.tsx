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
        <div className="size-[500px] sm:size-[650px] rounded-full blur-[130px]   " />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center">
        {/* Frosted Floating 404 Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
          <span className="flex items-center gap-1 rounded-full bg-error-bg px-2 py-0.5 text-xs font-semibold text-error-text ">
            404 Error
          </span>
          <span>Route Not Found</span>
          <span className="text-subtle-foreground ">•</span>
          <span className="text-muted-foreground ">Zero Ingestion Loss</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up stagger-1 mt-7 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
          Lost in the
          <br className="hidden sm:inline" />{' '}
          <span className="gradient-cadence">business architecture?</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up stagger-2 mt-4 max-w-md text-base leading-relaxed text-muted-foreground ">
          The page or endpoint you are looking for has been relocated or does not exist. Use the links below to return to safe ground.
        </p>

        {/* Dual Pill Action CTAs */}
        <div className="animate-fade-up stagger-3 mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-navy hover:shadow-lg dark:bg-card "
          >
            <Home className="size-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/modules"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-secondary-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Boxes className="size-4 text-primary" />
            <span>Browse Business Suites</span>
          </Link>
        </div>

        {/* Bento Cards of Popular Destinations */}
        <div className="animate-fade-up stagger-4 mt-12 w-full text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
            Popular Navigation Targets
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                title: 'Developer Documentation',
                desc: 'Architecture, guides, and OpenAPI schemas',
                href: '/docs',
                icon: <BookOpen className="size-4 text-primary" />,
              },
              {
                title: 'Enterprise Design System',
                desc: '240+ accessible UI components & widgets for any project',
                href: '/ui',
                icon: <Layers className="size-4 text-muted-foreground" />,
              },
              {
                title: 'Tracura API Telemetry',
                desc: 'Real-time API observability & tracing for your company',
                href: '/plugins/tracura',
                icon: <Activity className="size-4 text-success-text" />,
              },
              {
                title: 'Getting Started Guide',
                desc: 'Deploy self-hosted in under 5 minutes',
                href: '/docs/getting-started',
                icon: <Compass className="size-4 text-warning-text" />,
              },
            ].map((dest) => (
              <Link
                key={dest.href}
                href={dest.href}
                className="bento-card group flex items-start gap-3 rounded-2xl p-4 transition-all"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-2xs dark:border-white/10 dark:bg-card">
                  {dest.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary dark:text-white transition-colors">
                      {dest.title}
                    </span>
                    <ArrowRight className="size-3 text-subtle-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground ">
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
