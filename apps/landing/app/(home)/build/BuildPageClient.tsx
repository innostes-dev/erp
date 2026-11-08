'use client';

import React from 'react';
import {
  ArrowRight,
  Bell,
  Blocks,
  Code2,
  History,
  KeyRound,
  Lightbulb,
  LogIn,
  MessagesSquare,
  Search,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useQuoteModal } from '@/components/home/QuoteModalContext';
import { CaseCardsFull } from '@/components/home/CaseCards';

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: MessagesSquare, title: 'Understand the business', body: 'How you make money, how work moves, and who it touches.' },
  { icon: Search, title: 'Find the real problem', body: 'What is asked for is often a symptom. We look for the cause.' },
  { icon: Lightbulb, title: 'Design the right solution', body: 'The smallest system that solves it, and room to grow later.' },
  { icon: Blocks, title: 'Build it on INNOSTES', body: 'Only what is unique to you. The rest is already engineered.' },
];

const READY: { icon: LucideIcon; label: string }[] = [
  { icon: LogIn, label: 'Sign-in and accounts' },
  { icon: KeyRound, label: 'Roles and permissions' },
  { icon: Workflow, label: 'Approvals and workflows' },
  { icon: History, label: 'Audit trail' },
  { icon: Bell, label: 'Notifications' },
  { icon: Code2, label: 'APIs and design system' },
];

export function BuildPageClient() {
  const { openQuote } = useQuoteModal();
  const talk = () => openQuote('Custom build', 'build');

  return (
    <main className="flex flex-1 flex-col bg-fd-background text-fd-foreground">
      {/* Hero */}
      <section className="brand-stage pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-sidebar-primary">INNOSTES · Innovative systems</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Tell us the problem.
            <br className="hidden sm:inline" />{' '}
            <span className="text-brand-highlight">We&apos;ll find the right system.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-sidebar-foreground sm:text-lg">
            We don&apos;t start by writing code. We start by understanding how your business works, then build
            only what it needs, on a platform that&apos;s already engineered.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={talk}
              className="cta-glow inline-flex h-12 cursor-pointer items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Talk to an engineer <ArrowRight className="size-4" />
            </button>
            <a
              href="#cases"
              className="inline-flex h-12 items-center rounded-md border border-white/20 bg-white/5 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              See real cases
            </a>
          </div>
        </div>
      </section>

      {/* Cases: show the thinking */}
      <section id="cases" className="surface-band py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">From real startups</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              What they asked for wasn&apos;t the whole story.
            </h2>
          </div>
          <div className="mt-14">
            <CaseCardsFull />
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">How we work</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Problem first. Software second.
            </h2>
          </div>
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="bento-card rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Why it ships fast */}
      <section className="soft-wash py-24 lg:py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-medium text-primary">Why it ships fast</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              We never start from zero.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Even if your company works completely differently, the hard, invisible parts of good software are
              already built and tested in INNOSTES. We build only what&apos;s unique to you, and HR, payroll,
              finance and stock are there if you need them.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              You get it sooner, it costs less, and it&apos;s production-grade from day one, not a prototype that
              has to be rebuilt later.
            </p>
          </div>
          <div className="bento-card rounded-3xl p-6 sm:p-8">
            <p className="text-body-sm font-medium text-muted-foreground">Already engineered, on day one</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {READY.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-base font-medium text-foreground">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl bg-primary-tint px-4 py-3 text-base font-medium text-primary">
              + What we build: only the part that&apos;s yours.
            </p>
          </div>
        </div>
      </section>

      {/* Promise + close */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="brand-stage rounded-2xl px-6 py-14 text-center sm:px-12 md:py-20">
            <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Sometimes the right answer is <span className="text-brand-highlight">not to build.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-sidebar-foreground sm:text-lg">
              It might be a module you can switch on today, or a simpler way of working. If so, we&apos;ll tell
              you. You&apos;ll talk to an engineer from the team that built INNOSTES, not a salesperson.
            </p>
            <button
              type="button"
              onClick={talk}
              className="cta-glow mt-9 inline-flex h-12 cursor-pointer items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Tell us what&apos;s not working <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
