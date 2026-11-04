'use client';

import React from 'react';
import { Check, Layers, Minus, X } from 'lucide-react';

export function ArchitectureComparisonSection() {
  const rows = [
    {
      factor: 'Licensing & Cost',
      innostes: '0 Rs self-hosted free forever; unlimited users and database records',
      saas: 'Compounding per-seat monthly subscription tax ($50–$250/user/mo)',
      monolith: 'Expensive multi-year lock-in agreements with massive annual maintenance fees',
    },
    {
      factor: 'Deployment Flexibility',
      innostes: 'Three decoupled modes: Turnkey full-stack UI, headless REST API, or standalone UI library',
      saas: 'Rigid closed web application with no way to decouple backend from presentation',
      monolith: 'Heavyweight closed monolith requiring proprietary client software',
    },
    {
      factor: 'Data Ownership & Sovereignty',
      innostes: '100% data sovereignty on your own PostgreSQL; air-gapped deployment capable',
      saas: 'Fragmented across 8+ foreign cloud vendors with zero direct database query access',
      monolith: 'Vendor-controlled databases with complex, painful data export workflows',
    },
    {
      factor: 'Developer & UI Tooling',
      innostes: 'Enterprise Design System with 240+ accessible components & business widgets included free for any project',
      saas: 'Zero reusable UI components or design systems provided for custom apps',
      monolith: 'Proprietary, antiquated UI widgets with virtually no modern styling capability',
    },
    {
      factor: 'API Contracts & Customization',
      innostes: 'Strict OpenAPI 3.1 REST contracts with sub-10ms response latency on FastAPI',
      saas: 'Aggressively rate-limited external REST webhooks and strict API call quotas',
      monolith: 'Obscure legacy proprietary scripting languages (e.g. ABAP, SuiteScript)',
    },
    {
      factor: 'Native API Telemetry',
      innostes: 'Integrated Tracura API telemetry engine for real-time request tracing without third-party APM bills',
      saas: 'Requires separate expensive third-party APM subscriptions (Datadog, New Relic)',
      monolith: 'Cumbersome legacy audit logs that require dedicated diagnostic appliances',
    },
  ];

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[650px] rounded-full bg-gradient-to-tr from-orange-400/10 via-purple-500/10 to-blue-500/10 blur-[130px] dark:from-purple-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
              <Layers className="size-3" /> Architecture Evaluation
            </span>
            <span>Objective Comparison</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Lock-In</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Why modern teams choose Innostes over
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">point-SaaS bloat</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            An objective architectural evaluation of decoupled open-source software versus fragmented multi-vendor subscriptions and legacy monoliths.
          </p>
        </div>

        {/* ── Modern Bento Comparison Table ────────────────────────── */}
        <div className="bento-card mt-16 overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-slate-950/80">
                  <th className="p-5 font-bold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400">
                    Architectural Criteria
                  </th>
                  <th className="p-5 bg-blue-50/60 dark:bg-blue-950/40 border-x border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-blue-700 dark:text-blue-300">
                        Innostes Business OS
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        RECOMMENDED
                      </span>
                    </div>
                  </th>
                  <th className="p-5 font-semibold text-slate-700 dark:text-slate-300">
                    Fragmented Multi-SaaS
                    <span className="block text-xs font-normal text-slate-500">Salesforce + Workday + Jira</span>
                  </th>
                  <th className="p-5 font-semibold text-slate-700 dark:text-slate-300">
                    Closed Legacy ERPs
                    <span className="block text-xs font-normal text-slate-500">SAP / NetSuite / Oracle</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((row) => (
                  <tr key={row.factor} className="hover:bg-slate-50/40 dark:hover:bg-white/5 transition-colors">
                    <td className="p-5 font-bold text-slate-900 dark:text-slate-100 align-top">
                      {row.factor}
                    </td>

                    {/* Innostes Column */}
                    <td className="p-5 bg-blue-50/30 dark:bg-blue-950/20 border-x border-blue-200/60 dark:border-blue-900/40 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                          <Check className="size-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {row.innostes}
                        </span>
                      </div>
                    </td>

                    {/* Multi-SaaS Column */}
                    <td className="p-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-rose-500/10 p-1 text-rose-500 shrink-0 mt-0.5">
                          <X className="size-3.5 stroke-[2.5]" />
                        </div>
                        <span>{row.saas}</span>
                      </div>
                    </td>

                    {/* Legacy Monolith Column */}
                    <td className="p-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-slate-500/10 p-1 text-slate-400 shrink-0 mt-0.5">
                          <Minus className="size-3.5 stroke-[2.5]" />
                        </div>
                        <span>{row.monolith}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
