'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Check,
  CreditCard,
  Landmark,
  Laptop,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface Step {
  module: string;
  icon: LucideIcon;
  title: string;
  body: string;
  view: ReactNode;
}

const Row = ({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-0">
    <span className="text-body-sm text-muted-foreground">{label}</span>
    <span className={`text-body-sm tabular ${strong ? 'font-semibold text-foreground' : 'text-foreground'}`}>{value}</span>
  </div>
);

const Pill = ({ children, tone = 'success' }: { children: ReactNode; tone?: 'success' | 'info' | 'primary' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-caption font-medium ${
      tone === 'success' ? 'bg-success-bg text-success-text' : tone === 'info' ? 'bg-info-bg text-info-text' : 'bg-primary-tint text-primary'
    }`}
  >
    {children}
  </span>
);

/** The story: one new hire, followed through every module. Data entered once, used everywhere. */
const STEPS: Step[] = [
  {
    module: 'HireFlow',
    icon: UserCheck,
    title: 'Priya accepts your offer.',
    body: 'The signed offer is where everything else begins. Role, salary, start date: captured once, never re-typed.',
    view: (
      <>
        <Row label="Candidate" value="Priya Raman" strong />
        <Row label="Role" value="Product Designer" />
        <Row label="Annual CTC" value="₹18,00,000" />
        <Row label="Start date" value="2 Dec 2026" />
        <Row label="Offer" value={<Pill><Check className="size-3" /> Accepted</Pill>} />
      </>
    ),
  },
  {
    module: 'PeopleOps',
    icon: Users,
    title: "She's an employee before day one.",
    body: 'Her profile, manager, leave policy and documents are created from the offer. Nobody fills in the same form twice.',
    view: (
      <>
        <Row label="Employee ID" value="EMP-0142" strong />
        <Row label="Reports to" value="Arjun Mehta" />
        <Row label="Department" value="Design" />
        <Row label="Leave policy" value="Standard · 24 days" />
        <Row label="Documents" value={<Pill tone="info">3 of 3 signed</Pill>} />
      </>
    ),
  },
  {
    module: 'StockFlow',
    icon: Laptop,
    title: 'Her laptop is already on its way.',
    body: 'Onboarding raises the equipment request. Stock and the asset register update together, so you always know who has what.',
    view: (
      <>
        <Row label="Asset" value="MacBook Air 13″" strong />
        <Row label="Serial" value="C02F-4KQ7" />
        <Row label="Assigned to" value="Priya Raman" />
        <Row label="Stock remaining" value="6 in Bengaluru" />
        <Row label="Status" value={<Pill tone="primary">Ready for day one</Pill>} />
      </>
    ),
  },
  {
    module: 'Payroll',
    icon: CreditCard,
    title: 'Her first payslip is simply right.',
    body: 'Salary comes from the offer. Attendance and leave flow in on their own. Month-end stops being a scramble.',
    view: (
      <>
        <Row label="Pay period" value="December 2026" strong />
        <Row label="Gross pay" value="₹1,50,000" />
        <Row label="Deductions" value="₹21,300" />
        <Row label="Net pay" value="₹1,28,700" strong />
        <Row label="Payslip" value={<Pill><Check className="size-3" /> Sent</Pill>} />
      </>
    ),
  },
  {
    module: 'LedgerFlow',
    icon: Landmark,
    title: 'Your books already know.',
    body: 'Payroll posts to the ledger as a balanced entry. Your numbers match because they come from the same place.',
    view: (
      <>
        <Row label="Journal" value="JV-2026-1207" strong />
        <Row label="Dr  Salary expense" value="₹1,50,000" />
        <Row label="Cr  Bank" value="₹1,28,700" />
        <Row label="Cr  Statutory payable" value="₹21,300" />
        <Row label="Balance" value={<Pill><Check className="size-3" /> Balanced</Pill>} />
      </>
    ),
  },
  {
    module: 'Audit',
    icon: ShieldCheck,
    title: 'And every step left a receipt.',
    body: 'Who did what, and when, recorded once for every module. Due diligence becomes a download, not a project.',
    view: (
      <ol className="flex flex-col gap-3 py-1">
        {['Offer accepted · HireFlow', 'Employee created · PeopleOps', 'Laptop assigned · StockFlow', 'Payroll run · Payroll', 'Journal posted · LedgerFlow'].map((t) => (
          <li key={t} className="flex items-center gap-3 text-body-sm text-foreground">
            <BadgeCheck className="size-4 shrink-0 text-success" />
            {t}
          </li>
        ))}
      </ol>
    ),
  },
];

/**
 * Chapter 3, the signature story. A pinned product view that changes as you scroll through the
 * steps; the module track shows the data travelling from module to module.
 */
export function HireStorySection() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section id="story" data-chapter className="soft-wash relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it connects</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Follow one hire through your company.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Enter it once. Watch it reach every part of the business that needs it.
          </p>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Steps (scroll) */}
          <ol className="flex flex-col">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const state = i < active ? 'done' : i === active ? 'active' : 'next';
              return (
                <li
                  key={s.module}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-step={i}
                  data-no-reveal
                  className="relative flex gap-5 pb-12 last:pb-0 lg:min-h-[52vh] lg:pb-0"
                >
                  {/* connecting line between steps */}
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="absolute top-11 bottom-0 left-[19px] w-px bg-border-strong">
                      <span
                        className="block w-px origin-top bg-[linear-gradient(180deg,var(--ino-blue-600),var(--ino-teal-300))] transition-transform duration-700"
                        style={{ height: '100%', transform: `scaleY(${i < active ? 1 : 0})` }}
                      />
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${
                      state === 'active'
                        ? 'border-primary bg-primary text-white shadow-[0_0_0_6px_rgb(49_87_213/0.15)]'
                        : state === 'done'
                          ? 'border-primary bg-primary-tint text-primary'
                          : 'border-border-strong bg-card text-muted-foreground'
                    }`}
                  >
                    <StepIcon className="size-4" />
                  </span>
                  <div className={`pt-1.5 transition-opacity duration-500 ${state === 'active' ? 'opacity-100' : 'lg:opacity-55'}`}>
                    <p className="text-caption font-medium tracking-wide text-primary uppercase">
                      Step {i + 1} · {s.module}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{s.title}</h3>
                    <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">{s.body}</p>
                    {/* On small screens the product view sits inline under each step */}
                    <div className="mt-5 rounded-lg border border-border bg-card px-4 py-2 shadow-sm lg:hidden">{s.view}</div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Pinned product view (large screens) */}
          <div className="hidden lg:block">
            <div className="sticky top-28">
              {/* module track */}
              <div className="mb-5 flex items-center" aria-hidden="true">
                {STEPS.map((s, i) => {
                  const TrackIcon = s.icon;
                  return (
                    <div key={s.module} className="flex flex-1 items-center last:flex-none">
                      <span
                        className={`flex size-9 items-center justify-center rounded-lg border transition-all duration-500 ${
                          i <= active ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground'
                        } ${i === active ? 'scale-110 shadow-[0_8px_20px_-6px_rgb(49_87_213/0.6)]' : ''}`}
                      >
                        <TrackIcon className="size-4" />
                      </span>
                      {i < STEPS.length - 1 && (
                        <span className="relative mx-1 h-px flex-1 bg-border-strong">
                          <span
                            className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--ino-blue-600),var(--ino-teal-300))] transition-[width] duration-700"
                            style={{ width: i < active ? '100%' : '0%' }}
                          />
                          {i === active - 1 && <span className="story-packet" />}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* product card */}
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border bg-muted px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary-tint text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{step.module}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <BookOpen className="size-3.5" aria-hidden="true" /> Same record, step {active + 1} of {STEPS.length}
                  </span>
                </div>
                <div key={active} className="story-view px-5 py-3">
                  {step.view}
                </div>
              </div>
              <p className="mt-4 text-center text-body-sm text-muted-foreground">
                Sample data. This is how a single record moves through INNOSTES.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
