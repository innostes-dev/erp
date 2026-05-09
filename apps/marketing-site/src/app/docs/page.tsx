const endpointGroups = [
  {
    name: 'Registry',
    endpoints: [
      {
        method: 'GET',
        path: '/api/registry/modules',
        description: 'Returns enabled module manifests for the active tenant.',
      },
    ],
  },
  {
    name: 'Bridge',
    endpoints: [
      {
        method: 'POST',
        path: '/api/bridge/invoke',
        description: 'Invokes another module through the smart virtual bridge.',
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-6 py-10">
        <aside className="col-span-3 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">API Navigation</h2>
          <nav className="space-y-3 text-sm">
            <a href="#overview" className="block">
              Overview
            </a>
            <a href="#auth" className="block">
              Authentication
            </a>
            <a href="#endpoints" className="block">
              Endpoints
            </a>
            <a href="#examples" className="block">
              SDK Examples
            </a>
          </nav>
        </aside>

        <section className="col-span-9 space-y-10">
          <header id="overview">
            <p className="text-xs uppercase tracking-widest text-secondary">Developers</p>
            <h1 className="mt-3 text-4xl font-semibold">Innostes API Reference</h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Professional API docs for partners and internal teams. This page is designed as a developer portal,
              separate from the product shell and ready to expand with changelog, guides, and SDK docs.
            </p>
          </header>

          <section id="auth" className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-medium">Authentication</h2>
            <p className="mt-3 text-slate-300">
              All requests require tenant context and session credentials. Pass `x-tenant-id` header on every request.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-slate-200">
{`x-tenant-id: tenant_demo
authorization: Bearer <session-token>`}
            </pre>
          </section>

          <section id="endpoints" className="space-y-6">
            {endpointGroups.map((group) => (
              <div key={group.name} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="text-xl font-medium">{group.name}</h3>
                <div className="mt-4 space-y-3">
                  {group.endpoints.map((endpoint) => (
                    <article key={endpoint.path} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-primary/20 px-2 py-1 text-xs font-semibold text-primary">
                          {endpoint.method}
                        </span>
                        <code>{endpoint.path}</code>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{endpoint.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section id="examples" className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-medium">SDK Example</h2>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-slate-200">
{`const res = await fetch('https://api.innostes.com/api/registry/modules', {
  headers: {
    'x-tenant-id': 'tenant_demo',
    authorization: 'Bearer <token>'
  }
});

const modules = await res.json();`}
            </pre>
          </section>
        </section>
      </div>
    </main>
  );
}
