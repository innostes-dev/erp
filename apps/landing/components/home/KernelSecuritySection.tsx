'use client';

import React from 'react';
import {
  CheckCircle2,
  Database,
  FileCheck2,
  KeyRound,
  Lock,
  Server,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const SECURITY_PILLARS = [
  {
    icon: Database,
    title: 'Logical Multi-Tenancy',
    badge: 'Zero Cross-Contamination',
    description:
      'Rigid schema separation and automated tenant context injection on every database query prevent accidental data leakage between organizational accounts.',
    specs: ['Row-Level Security (RLS)', 'Automatic X-Tenant-ID header enforcement', 'Isolated workspace domains'],
  },
  {
    icon: ShieldCheck,
    title: 'Cryptographic Audit Trails',
    badge: 'Immutable Verification',
    description:
      'Every state mutation (POST, PUT, PATCH, DELETE) automatically logs a cryptographic audit hash recording actor identity, client IP, timestamp, and payload delta.',
    specs: ['Tamper-evident logs', 'Actor & session attribution', 'Compliance export formats'],
  },
  {
    icon: KeyRound,
    title: 'Granular Scoped API Tokens',
    badge: 'Least-Privilege RBAC',
    description:
      'Issue programmatic API keys and user access tokens strictly scoped to exact module permissions (e.g. salesflow:deals:read or peopleops:payroll:write).',
    specs: ['Short-lived rotating JWTs', 'Fine-grained ABAC & RBAC scopes', 'One-click immediate revocation'],
  },
  {
    icon: Server,
    title: '100% Data Sovereignty',
    badge: 'Your Infrastructure Only',
    description:
      'Your business records, employee PII, and financial ledgers reside exclusively in your PostgreSQL instance. Zero third-party telemetry, tracking, or cloud surveillance.',
    specs: ['Air-gapped deployment capable', 'Zero phone-home telemetry', 'Complete export & backup freedom'],
  },
];

const COMPLIANCE_SIGNALS = [
  { label: 'SOC2 Type II Ready Architecture' },
  { label: 'GDPR / CCPA Compliant Data Controls' },
  { label: 'End-to-End TLS 1.3 Encryption' },
  { label: 'PostgreSQL 16 Native Hardening' },
];

export function KernelSecuritySection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 section-divider transition-colors duration-300">
      
      {/* Ambient Lighting Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 flex justify-center">
        <div className="size-[550px] sm:size-[650px] rounded-full bg-gradient-to-tr from-emerald-500/10 via-blue-500/10 to-purple-500/10 blur-[130px] dark:from-emerald-600/15 dark:to-blue-600/15" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Cadence-style Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <Lock className="size-3" /> Security Core
            </span>
            <span>Hardened Kernel</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Cloud Telemetry</span>
          </div>

          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Enterprise security built in,
            <br className="hidden sm:inline" />{' '}
            <span className="gradient-cadence">never an expensive add-on</span>
          </h2>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Compliance, tenant isolation, and cryptographic auditing are engineered directly into the foundational kernel.
            Every module automatically inherits hardened enterprise governance.
          </p>
        </div>

        {/* ── 4-Column Bento Grid ──────────────────────────────────── */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY_PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bento-card group flex flex-col justify-between rounded-3xl p-7"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {p.description}
                  </p>
                </div>

                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600 dark:border-white/5 dark:text-slate-400">
                  {p.specs.map((spec) => (
                    <li key={spec} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-blue-500 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Cadence-style Compliance Trust Bar */}
        <div className="bento-card mt-12 rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
            {COMPLIANCE_SIGNALS.map(({ label }) => (
              <div key={label} className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
