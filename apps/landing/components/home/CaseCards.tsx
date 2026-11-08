'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CASES, type CaseStudy } from '@/lib/cases';

/** Full case cards (asked → found → built → outcome). Used on /build. */
export function CaseCardsFull({ cases = CASES }: { cases?: CaseStudy[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {cases.map((c) => (
        <article key={c.id} id={c.id} className="bento-card flex scroll-mt-24 flex-col rounded-3xl p-7 sm:p-8">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{c.asked}</p>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-caption font-medium tracking-wide text-primary uppercase">What we found</dt>
              <dd className="mt-1.5 text-base leading-relaxed text-muted-foreground">{c.found}</dd>
            </div>
            <div>
              <dt className="text-caption font-medium tracking-wide text-primary uppercase">What we built</dt>
              <dd className="mt-1.5 text-base leading-relaxed text-muted-foreground">{c.built}</dd>
            </div>
          </dl>
          <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-base font-medium text-foreground">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-text" aria-hidden="true" />
            {c.outcome}
          </p>
        </article>
      ))}
    </div>
  );
}

/** Compact cards linking to the full story on /build. Used on the homepage and module pages. */
export function CaseCardsCompact({ cases = CASES }: { cases?: CaseStudy[] }) {
  if (cases.length === 0) return null;
  return (
    <div className={`grid gap-4 ${cases.length > 1 ? 'sm:grid-cols-2' : ''}`}>
      {cases.map((c) => (
        <Link
          key={c.id}
          href={`/build#${c.id}`}
          className="bento-card group flex flex-col rounded-2xl p-6 text-left transition-colors"
        >
          <p className="text-caption font-medium tracking-wide text-primary uppercase">From a real startup</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{c.asked}</p>
          <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">{c.hook}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary">
            Read what we built
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** A titled section of compact cases for a given module; renders nothing if none match. */
export function ModuleCasesSection({ slug }: { slug: string }) {
  const cases = CASES.filter((c) => c.modules.includes(slug));
  if (cases.length === 0) return null;
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How a startup used it
        </h2>
        <div className="mt-10">
          <CaseCardsCompact cases={cases} />
        </div>
      </div>
    </section>
  );
}
