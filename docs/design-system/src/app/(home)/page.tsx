import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-semibold text-indigo-500 mb-6">
        <span>Innostes UI Design System</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">
        Accessible React Components for Innostes ERP
      </h1>

      <p className="text-lg sm:text-xl text-slate dark:text-neutral-300 max-w-3xl mb-10 leading-relaxed">
        Production-ready UI primitives powered by Base UI, Tailwind CSS v4, and Lucide React. Designed for high performance, WAI-ARIA compliance, and form validation.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/docs"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-150"
        >
          Browse Components &rarr;
        </Link>
        <Link
          href="/docs/button"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border border-border bg-surface hover:bg-background text-navy dark:text-white transition-all duration-150"
        >
          View Button Component
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold mb-4">
            ⚡
          </div>
          <h3 className="text-lg font-bold mb-2">Base UI Primitives</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Unstyled, accessible headless primitives for dropdowns, selects, checkboxes, switches, and buttons.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold mb-4">
            🎨
          </div>
          <h3 className="text-lg font-bold mb-2">Tailwind CSS v4 & CVA</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Type-safe component variants, custom sizes, icon slots, and theme color variables.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold mb-4">
            📋
          </div>
          <h3 className="text-lg font-bold mb-2">Integrated Form Controls</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Field wrapper handles labels, required indicators (`*`), helper hints, and animated validation errors.
          </p>
        </div>
      </div>
    </main>
  );
}
