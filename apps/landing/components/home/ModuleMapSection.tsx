'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckSquare,
  Landmark,
  Package,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface MapModule {
  slug: string;
  name: string;
  area: string;
  icon: LucideIcon;
  summary: string;
  shares: string[];
}

const MODULES: MapModule[] = [
  { slug: 'peopleops', name: 'PeopleOps', area: 'People', icon: Users, summary: 'Employees, attendance, leave, payroll and offboarding.', shares: ['hireflow', 'ledgerflow', 'stockflow'] },
  { slug: 'salesflow', name: 'SalesFlow', area: 'Sales', icon: Building2, summary: 'Leads, deals, quotes and orders your whole team can see.', shares: ['ledgerflow', 'stockflow', 'docflow'] },
  { slug: 'ledgerflow', name: 'LedgerFlow', area: 'Money', icon: Landmark, summary: 'Ledger, invoices, payables and statements that balance themselves.', shares: ['peopleops', 'salesflow', 'stockflow'] },
  { slug: 'stockflow', name: 'StockFlow', area: 'Operations', icon: Package, summary: 'Items, warehouses, purchase orders and assets.', shares: ['salesflow', 'ledgerflow', 'peopleops'] },
  { slug: 'sprintflow', name: 'SprintFlow', area: 'Product', icon: CheckSquare, summary: 'Backlog, sprints, releases and service desk.', shares: ['docflow', 'peopleops'] },
  { slug: 'docflow', name: 'DocFlow', area: 'Knowledge', icon: BookOpen, summary: 'Your company wiki, SOPs and meeting notes.', shares: ['sprintflow', 'salesflow', 'peopleops'] },
  { slug: 'hireflow', name: 'HireFlow', area: 'Hiring', icon: UserCheck, summary: 'Openings, candidates, interviews and offers.', shares: ['peopleops', 'docflow'] },
];

const SIZE = 560;
const C = SIZE / 2;
const R = 205;
const pos = (i: number) => {
  const a = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
};

/** Chapter 4: the modules as one connected system, not a list of separate products. */
export function ModuleMapSection() {
  const [activeSlug, setActiveSlug] = useState('peopleops');
  const active = MODULES.find((m) => m.slug === activeSlug) ?? MODULES[0];
  const isLinked = (slug: string) => slug === active.slug || active.shares.includes(slug);

  return (
    <section id="modules" data-chapter className="surface-band relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">The system</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Start with one module. Grow into the rest.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every module shares one core: the same people, customers and numbers. Turn on the next one when you
            need it; it already knows your company.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Map (large screens) */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[560px] lg:block" data-no-reveal>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden="true">
              <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-border)" strokeDasharray="2 6" />
              {MODULES.map((m, i) => {
                const p = pos(i);
                const on = isLinked(m.slug);
                return (
                  <line
                    key={m.slug}
                    x1={C}
                    y1={C}
                    x2={p.x}
                    y2={p.y}
                    stroke={on ? 'url(#flow)' : 'var(--color-border-strong)'}
                    strokeWidth={on ? 2 : 1}
                    className={on ? 'map-flow' : ''}
                  />
                );
              })}
              <defs>
                <linearGradient id="flow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--ino-blue-600)" />
                  <stop offset="100%" stopColor="var(--ino-teal-300)" />
                </linearGradient>
              </defs>
            </svg>

            {/* core */}
            <div className="absolute top-1/2 left-1/2 flex size-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-brand-navy text-center text-white shadow-[0_0_0_10px_rgb(49_87_213/0.08),0_20px_40px_-12px_rgb(20_36_58/0.6)]">
              <span className="text-sm font-semibold">INNOSTES</span>
              <span className="text-caption text-sidebar-foreground">shared core</span>
            </div>

            {MODULES.map((m, i) => {
              const p = pos(i);
              const Icon = m.icon;
              const on = isLinked(m.slug);
              const current = m.slug === active.slug;
              return (
                <button
                  key={m.slug}
                  type="button"
                  onMouseEnter={() => setActiveSlug(m.slug)}
                  onFocus={() => setActiveSlug(m.slug)}
                  onClick={() => setActiveSlug(m.slug)}
                  aria-pressed={current}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-1.5 rounded-lg outline-none transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                    on ? 'opacity-100' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` }}
                >
                  <span
                    className={`flex size-14 items-center justify-center rounded-xl border transition-all duration-300 ${
                      current
                        ? 'scale-110 border-primary bg-primary text-white shadow-[0_10px_24px_-8px_rgb(49_87_213/0.7)]'
                        : on
                          ? 'border-primary/40 bg-primary-tint text-primary'
                          : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-6" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                </button>
              );
            })}
          </div>

          {/* Detail panel / list (always present; the list is the map on small screens) */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-md" aria-live="polite">
              <p className="text-caption font-medium tracking-wide text-primary uppercase">{active.area}</p>
              <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{active.name}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{active.summary}</p>
              <p className="mt-5 text-body-sm font-medium text-foreground">Shares data with</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {active.shares.map((s) => {
                  const m = MODULES.find((x) => x.slug === s)!;
                  const SIcon = m.icon;
                  return (
                    <li key={s} className="flex items-center gap-1.5 rounded-md border border-border bg-canvas px-2.5 py-1 text-body-sm text-strong-foreground">
                      <SIcon className="size-3.5 text-primary" aria-hidden="true" />
                      {m.name}
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/modules/${active.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Explore {active.name}
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4" role="group" aria-label="Choose a module">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const current = m.slug === active.slug;
                return (
                  <button
                    key={m.slug}
                    type="button"
                    aria-pressed={current}
                    onClick={() => setActiveSlug(m.slug)}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-body-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      current
                        ? 'border-primary bg-primary-tint text-primary'
                        : 'border-border bg-card text-strong-foreground hover:border-border-strong'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
