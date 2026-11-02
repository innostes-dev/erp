'use client';

import React from 'react';
import { Button } from '@innostes/ui';
import { ArrowRight, Terminal } from 'lucide-react';

interface CtaSectionProps {
  onOpenQuote: () => void;
}

export function CtaSection({ onOpenQuote }: CtaSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-fd-border bg-gradient-to-b from-blue-900/10 via-fd-card to-fd-card p-8 text-center shadow-2xl md:p-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            Open-Core Operating System
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-fd-foreground sm:text-4xl md:text-5xl">
            Take Control of Your Operational Stack
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-fd-muted-foreground sm:text-lg">
            Deploy Innostes on your infrastructure in under five minutes, or consult directly with our core engineering team for assisted deployment and bespoke module engineering.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              endIcon={<ArrowRight className="size-4" />}
              render={<a href="/docs/getting-started" />}
              nativeButton={false}
            >
              Deploy Free (Self-Hosted)
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={onOpenQuote}
            >
              Request a Custom Quote
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-fd-muted-foreground">
            <Terminal className="size-3.5" />
            <span>docker run -d -p 8000:8000 -p 3000:3000 innostes/platform:latest</span>
          </div>
        </div>
      </div>
    </section>
  );
}
