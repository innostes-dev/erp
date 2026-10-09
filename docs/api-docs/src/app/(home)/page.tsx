import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-500 mb-6">
        <span>Innostes ERP Interactive API Reference</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
        RESTful API Endpoints & OpenAPI Specifications
      </h1>

      <p className="text-lg sm:text-xl text-slate dark:text-neutral-300 max-w-3xl mb-10 leading-relaxed">
        Complete reference for Innostes ERP kernel services. Explore interactive testing consoles, JSON response envelopes, Bearer JWT authentication, and error codes.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          href="/docs/overview"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all duration-150"
        >
          Interactive API Console &rarr;
        </Link>
        <Link
          href="/docs/authentication"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border border-border bg-surface hover:bg-background text-navy dark:text-white transition-all duration-150"
        >
          Auth & Security Guide
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold mb-4">
            📡
          </div>
          <h3 className="text-lg font-bold mb-2">Scalar OpenAPI Console</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Interactive endpoint testing, live request runner, and code snippet generation for cURL, JS/TS, and Python.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold mb-4">
            ✉️
          </div>
          <h3 className="text-lg font-bold mb-2">Standardized Envelopes</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            100% unified JSON contract with `success`, `data`, `error`, and UTC `meta` timestamping properties.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-surface/50 dark:bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold mb-4">
            🛡️
          </div>
          <h3 className="text-lg font-bold mb-2">Auth & Error Codes</h3>
          <p className="text-sm text-slate dark:text-neutral-400">
            Comprehensive status code reference matrix (`401 Unauthorized`, `409 Conflict`, `422 Unprocessable`) with SDK error handlers.
          </p>
        </div>
      </div>
    </main>
  );
}
