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
    <section id="compare" data-chapter data-theme="dark" className="brand-stage py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[650px] rounded-full blur-[130px]  " />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-2xs dark:border-white/10 dark:bg-card ">
            <span className="flex items-center gap-1 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-text ">
              <Layers className="size-3" /> Architecture Evaluation
            </span>
            <span>Objective Comparison</span>
            <span className="text-muted-foreground ">•</span>
            <span className="font-semibold text-success-text ">Zero Lock-In</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground dark:text-white leading-[1.12]">
            Why modern teams choose Innostes over
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">point-SaaS bloat</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground ">
            An objective architectural evaluation of decoupled open-source software versus fragmented multi-vendor subscriptions and legacy monoliths.
          </p>
        </div>

        {/* ── Modern Bento Comparison Table ────────────────────────── */}
        <div className="bento-card mt-16 overflow-hidden rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted dark:border-white/10 ">
                  <th className="p-5 font-bold uppercase tracking-wider text-xs text-muted-foreground ">
                    Architectural Criteria
                  </th>
                  <th className="p-5 bg-primary-tint border-x border-border ">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-primary ">
                        Innostes Business OS
                      </span>
                      <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-bold text-success-text ">
                        RECOMMENDED
                      </span>
                    </div>
                  </th>
                  <th className="p-5 font-semibold text-strong-foreground ">
                    Fragmented Multi-SaaS
                    <span className="block text-xs font-normal text-muted-foreground">Salesforce + Workday + Jira</span>
                  </th>
                  <th className="p-5 font-semibold text-strong-foreground ">
                    Closed Legacy ERPs
                    <span className="block text-xs font-normal text-muted-foreground">SAP / NetSuite / Oracle</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border dark:divide-white/5">
                {rows.map((row) => (
                  <tr key={row.factor} className="hover:bg-muted dark:hover:bg-card transition-colors">
                    <td className="p-5 font-bold text-foreground align-top">
                      {row.factor}
                    </td>

                    {/* Innostes Column */}
                    <td className="p-5 bg-primary-tint border-x border-border  align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-success-bg p-1 text-success-text shrink-0 mt-0.5">
                          <Check className="size-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm font-medium text-foreground ">
                          {row.innostes}
                        </span>
                      </div>
                    </td>

                    {/* Multi-SaaS Column */}
                    <td className="p-5 text-xs sm:text-sm text-muted-foreground align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-error-bg p-1 text-error-text shrink-0 mt-0.5">
                          <X className="size-3.5 stroke-[2.5]" />
                        </div>
                        <span>{row.saas}</span>
                      </div>
                    </td>

                    {/* Legacy Monolith Column */}
                    <td className="p-5 text-xs sm:text-sm text-muted-foreground align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-full bg-muted p-1 text-muted-foreground shrink-0 mt-0.5">
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
