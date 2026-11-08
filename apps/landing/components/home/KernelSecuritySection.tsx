'use client';

import React from 'react';
import { History, KeyRound, Server, type LucideIcon } from 'lucide-react';

/** Chapter 5: trust, written for the founder who has to answer for the company's data. */
const PILLARS: { icon: LucideIcon; title: string; body: string; detail: string }[] = [
  {
    icon: Server,
    title: 'Your data stays yours',
    body: 'Run it on your own servers or ours. Your records live in your database, and you can export everything at any time.',
    detail: 'Self-host or managed · Full export · No tracking',
  },
  {
    icon: KeyRound,
    title: 'People see only what they should',
    body: 'Give each person access to exactly the modules and records their role needs. Change or revoke access in one click.',
    detail: 'Role-based access · Scoped API keys · Instant revoke',
  },
  {
    icon: History,
    title: 'Every change has a name on it',
    body: 'Who changed what, and when, is recorded across every module. When someone asks, you already have the answer.',
    detail: 'Company-wide audit trail · Export for reviews',
  },
];

export function KernelSecuritySection() {
  return (
    <section id="security" data-chapter className="soft-wash relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Trust</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Built to be trusted from day one.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Access control and an audit trail come with every module from the start. You don't pay extra for them.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body, detail }) => (
            <div key={title} className="bento-card flex flex-col rounded-3xl p-7">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">{body}</p>
              <p className="mt-6 border-t border-border pt-4 text-body-sm font-medium text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
