'use client';

import React from 'react';
import { CaseCardsCompact } from './CaseCards';

/**
 * Chapter 7: proof. An honest note from the team, backed by real (anonymised) startup cases.
 */
export function FounderNoteSection() {
  return (
    <section id="why" data-chapter className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-primary">Why we built this</p>
        <blockquote className="mt-6 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
          “We kept watching founders run their company across a dozen tools that never agreed with each other.
          We wanted one system where a single change shows up everywhere it should.”
        </blockquote>
        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
          Most of the companies we work with are startups. Here's what two of them asked for, and what they actually needed.
        </p>
        <p className="mt-6 text-body-sm font-medium text-foreground">The INNOSTES team</p>
      </div>
      <div className="mx-auto mt-14 max-w-4xl px-4 sm:px-6 lg:px-8">
        <CaseCardsCompact />
      </div>
    </section>
  );
}
