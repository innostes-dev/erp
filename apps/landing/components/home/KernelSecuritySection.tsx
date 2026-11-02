'use client';

import React from 'react';
import {
  Database,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export function KernelSecuritySection() {
  const pillars = [
    {
      icon: Database,
      title: 'Logical Multi-Tenancy',
      description:
        'Automatic tenant context validation on every API request prevents data cross-contamination between organizational workspaces.',
    },
    {
      icon: ShieldCheck,
      title: 'Cryptographic Audit Trail',
      description:
        'Every mutate action (POST, PUT, DELETE, PATCH) produces an immutable audit record tracking actor ID, IP address, and payload delta.',
    },
    {
      icon: KeyRound,
      title: 'Scoped API Tokens',
      description:
        'Generate personal and programmatic API keys restricted to exact module scopes (such as salesflow:read or peopleops:write).',
    },
    {
      icon: Server,
      title: '100% Data Sovereignty',
      description:
        'Your business records, employee PII, and financial ledgers reside strictly in your PostgreSQL instance. Zero external telemetry tracking.',
    },
  ];

  return (
    <section className="border-b border-fd-border py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Lock className="size-3.5" />
            Hardened Kernel
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl lg:text-5xl">
            Enterprise Security and Governance in the Foundation
          </h2>
          <p className="mt-4 text-base text-fd-muted-foreground sm:text-lg">
            Security and compliance are not afterthoughts or premium add-ons. Every module in Innostes
            inherits hardened multi-tenant protections directly from the core kernel.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-3xl border border-fd-border bg-fd-card p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-fd-foreground">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-fd-muted-foreground">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
