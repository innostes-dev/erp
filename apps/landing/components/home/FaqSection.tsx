'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

import { FAQS } from './faq-data';

export function FaqSection() {
  return (
    <section id="faq" data-chapter className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-primary">Questions</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          What founders ask us.
        </h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
