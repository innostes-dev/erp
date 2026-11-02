'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export function ArchitectureComparisonSection() {
  const rows = [
    {
      factor: 'Licensing Model',
      innostes: '0 Rs self-hosted free forever; pay only for custom engineering',
      saas: 'Compounding per-seat monthly tax ($50–$250/user)',
      monolith: 'Multi-year locked licensing agreements',
    },
    {
      factor: 'System Flexibility',
      innostes: 'Decoupled: Full-stack turnkey UI, headless REST API, or standalone UI library',
      saas: 'Disconnected point tools requiring brittle third-party sync bridges',
      monolith: 'Closed, monolithic presentation and database layer',
    },
    {
      factor: 'Data Ownership',
      innostes: '100% data sovereignty on your own PostgreSQL infrastructure',
      saas: 'Fragmented across 8+ foreign cloud vendors',
      monolith: 'Complex vendor lock-in and high-friction export processes',
    },
    {
      factor: 'Developer Tooling',
      innostes: 'Standalone @innostes/ui component framework (240+ components) included',
      saas: 'No reusable frontend components provided',
      monolith: 'Proprietary locked UI widgets with limited styling',
    },
    {
      factor: 'Extensibility',
      innostes: 'Modern Python, TypeScript, React, and strict OpenAPI 3.1 contracts',
      saas: 'Rate-limited public webhooks',
      monolith: 'Legacy proprietary scripting languages',
    },
    {
      factor: 'Built-in Telemetry',
      innostes: 'Native Tracura API telemetry engine (10,000+ req/s) included',
      saas: 'Requires separate third-party APM subscriptions',
      monolith: 'Heavyweight external diagnostic log shippers',
    },
  ];

  return (
    <section className="border-b border-fd-border py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            Architectural Evaluation
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
            How Innostes Compares to Traditional Approaches
          </h2>
          <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
            An objective look at how decoupled open-source architecture compares to fragmented multi-vendor SaaS and closed proprietary systems.
          </p>
        </div>

        <div className="mt-16 overflow-x-auto rounded-3xl border border-fd-border bg-fd-card shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/40 text-xs font-bold uppercase tracking-wider text-fd-foreground">
                <th className="p-4 sm:p-5">Architectural Factor</th>
                <th className="p-4 text-blue-600 dark:text-blue-400 sm:p-5">
                  Innostes Business OS
                </th>
                <th className="p-4 text-fd-muted-foreground sm:p-5">
                  Per-Seat Multi-SaaS
                </th>
                <th className="p-4 text-fd-muted-foreground sm:p-5">
                  Closed Proprietary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fd-border">
              {rows.map((row) => (
                <tr key={row.factor} className="hover:bg-fd-muted/20">
                  <td className="p-4 font-semibold text-fd-foreground sm:p-5">
                    {row.factor}
                  </td>
                  <td className="p-4 font-medium text-fd-foreground sm:p-5">
                    <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Check className="size-4 shrink-0 stroke-[2.5]" />
                      <span>{row.innostes}</span>
                    </span>
                  </td>
                  <td className="p-4 text-xs text-fd-muted-foreground sm:p-5">
                    {row.saas}
                  </td>
                  <td className="p-4 text-xs text-fd-muted-foreground sm:p-5">
                    {row.monolith}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
