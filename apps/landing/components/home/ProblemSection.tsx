'use client';

import { useEffect, useRef } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  FileText,
  Inbox,
  Kanban,
  Package,
  Receipt,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** The scattered tools a growing company ends up with (generic, never brand names). */
const TOOLS: { label: string; icon: LucideIcon; x: number; y: number; r: number }[] = [
  { label: 'Payroll spreadsheet', icon: FileSpreadsheet, x: -310, y: -120, r: -6 },
  { label: 'CRM nobody updates', icon: Inbox, x: 260, y: -150, r: 5 },
  { label: 'HR tool', icon: Users, x: -360, y: 70, r: 4 },
  { label: 'Invoicing app', icon: Receipt, x: 330, y: 40, r: -4 },
  { label: 'Task board', icon: Kanban, x: -170, y: 175, r: 7 },
  { label: 'Stock sheet', icon: Package, x: 170, y: 185, r: -7 },
  { label: 'Accounting', icon: Calculator, x: -40, y: -205, r: 3 },
  { label: 'Shared docs', icon: FileText, x: 40, y: 120, r: -3 },
];

/**
 * Chapter 2: the problem. Scattered tools drift together into one system as you scroll
 * (scroll-linked via --p: 0 scattered → 1 unified).
 */
export function ProblemSection() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the stage enters the bottom of the screen, 1 when its centre passes 40% from the top.
      const p = (vh - r.top) / (vh - vh * 0.4 + r.height / 2);
      el.style.setProperty('--p', String(Math.min(1, Math.max(0, p))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="problem" data-chapter className="surface-band relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">The problem</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your company runs on twelve tabs.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            A spreadsheet for payroll. A CRM nobody updates. An HR tool that doesn&apos;t know who you hired
            yesterday. Each one is fine on its own. Together, they make <em className="not-italic font-medium text-foreground">you</em> the integration.
          </p>
        </div>

        <div
          ref={stage}
          data-no-reveal
          aria-hidden="true"
          className="converge relative mx-auto mt-14 h-[460px] max-w-4xl"
          style={{ ['--p' as string]: 0 }}
        >
          {TOOLS.map(({ label, icon: Icon, x, y, r }, i) => (
            <div
              key={label}
              className="converge__tile absolute top-1/2 left-1/2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium whitespace-nowrap text-strong-foreground shadow-md"
              style={{ ['--x' as string]: `${x}px`, ['--y' as string]: `${y}px`, ['--r' as string]: `${r}deg`, ['--i' as string]: i }}
            >
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </div>
          ))}

          <div className="converge__unified absolute top-1/2 left-1/2 w-[min(420px,90%)] rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-navy text-sm font-semibold text-white">IN</span>
              <div>
                <p className="text-sm font-semibold text-foreground">One system</p>
                <p className="text-body-sm text-muted-foreground">People · Sales · Money · Operations</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {TOOLS.slice(0, 8).map(({ icon: Icon, label }) => (
                <span key={label} className="flex h-10 items-center justify-center rounded-md bg-primary-tint text-primary">
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
            <p className="mt-4 text-body-sm text-muted-foreground">Entered once. Correct everywhere.</p>
          </div>
        </div>

        <p className="sr-only">
          Illustration: eight separate tools drift together into one INNOSTES system as you scroll.
        </p>
      </div>
    </section>
  );
}
