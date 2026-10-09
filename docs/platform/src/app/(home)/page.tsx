import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary mb-6">
        <span>Innostes ERP Platform Documentation</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-navy via-primary to-blue-600 bg-clip-text text-transparent dark:from-white dark:via-blue-400 dark:to-indigo-300">
        Enterprise Platform Architecture & Guides
      </h1>

      <p className="text-lg sm:text-xl text-slate dark:text-neutral-300 max-w-3xl mb-10 leading-relaxed">
        Everything you need to build, extend, and deploy enterprise applications with Innostes ERP. Explore architecture specs, database lifecycle, and developer guides.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all duration-150"
        >
          Explore Documentation &rarr;
        </Link>
        <Link
          href="/docs/getting-started/quickstart"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border border-border bg-surface hover:bg-background text-navy dark:text-white transition-all duration-150"
        >
          Quickstart Guide
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold mb-4">
            🏗️
          </div>
          <h3 className="text-lg font-bold mb-2">Monorepo Architecture</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Learn about workspace layout, Turborepo pipeline management, and package boundaries across apps, packages, and kernel modules.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center font-bold mb-4">
            🔒
          </div>
          <h3 className="text-lg font-bold mb-2">Auth & Security</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Stateless JWT authentication, organization context switching, password hashing, and role-based access controls.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold mb-4">
            🚀
          </div>
          <h3 className="text-lg font-bold mb-2">Deployment & Operations</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Guides for PostgreSQL database migrations, automated seeding, Docker containerization, and environment variables.
          </p>
        </div>
      </div>
    </main>
  );
}
