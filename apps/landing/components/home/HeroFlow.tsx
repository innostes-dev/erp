'use client';

import React, { useEffect, useState } from 'react';

/**
 * Hero eyebrow: a live preview of "connected". Three journeys from different parts of the
 * business play one step at a time, and every one ends in the same books.
 */
const JOURNEYS: { area: string; steps: string[] }[] = [
  { area: 'Sales', steps: ['Deal won', 'Project created', 'Hours logged', 'Invoice sent', 'Books updated'] },
  { area: 'Operations', steps: ['Order placed', 'Stock reserved', 'Order shipped', 'Invoice raised', 'Books updated'] },
  { area: 'People', steps: ['Offer accepted', 'Employee added', 'Laptop assigned', 'First payslip', 'Books updated'] },
];

const STEP_MS = 900;
const HOLD_MS = 2200;

export function HeroFlow() {
  const [j, setJ] = useState(0);
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      setStep(JOURNEYS[0].steps.length - 1);
    }
  }, []);

  useEffect(() => {
    if (still) return;
    const last = JOURNEYS[j].steps.length - 1;
    const t = setTimeout(
      () => {
        if (step < last) setStep(step + 1);
        else {
          setJ((j + 1) % JOURNEYS.length);
          setStep(0);
        }
      },
      step < last ? STEP_MS : HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [j, step, still]);

  const { area, steps } = JOURNEYS[j];

  return (
    <div className="animate-fade-up inline-flex max-w-full flex-col items-center">
      {/* Read by screen readers and search engines: every journey, as plain text. */}
      <p className="sr-only">
        One change, connected everywhere. {JOURNEYS.map((x) => `${x.area}: ${x.steps.join(', then ')}.`).join(' ')}
      </p>

      {/* Wide screens (920px+): the whole journey, lighting up step by step */}
      <ol
        key={j}
        aria-hidden="true"
        className="hero-flow hidden items-center rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-sm min-[920px]:flex"
      >
        <li className="mr-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-sidebar-primary">{area}</li>
        {steps.map((s, i) => (
          <li key={s} className="flex items-center">
            {i > 0 && (
              <span className="relative mx-1 block h-px w-5 overflow-hidden bg-white/15">
                <span
                  className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,var(--ino-blue-300),var(--ino-teal-300))] transition-[width] duration-500"
                  style={{ width: i <= step ? '100%' : '0%' }}
                />
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 whitespace-nowrap transition-colors duration-500 ${
                i === step
                  ? 'bg-white/10 font-medium text-white'
                  : i < step
                    ? 'text-sidebar-foreground'
                    : 'text-sidebar-muted-foreground/60'
              }`}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      {/* Phones, tablets and narrow windows: one step at a time */}
      <div
        aria-hidden="true"
        className="flex w-[17rem] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm min-[920px]:hidden"
      >
        <span className="text-xs font-medium text-sidebar-primary">{area}</span>
        <span className="flex gap-1">
          {steps.map((s, i) => (
            <span key={s} className={`size-1.5 rounded-full transition-colors ${i <= step ? 'bg-ai-on-dark' : 'bg-white/20'}`} />
          ))}
        </span>
        <span key={`${j}-${step}`} className="hero-flow-step font-medium text-white">
          {steps[step]}
        </span>
      </div>
    </div>
  );
}
