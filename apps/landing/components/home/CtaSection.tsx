'use client';

import { useState } from 'react';
import { ArrowRight, Check, Copy, ShieldCheck, Terminal, Zap } from 'lucide-react';

interface CtaSectionProps {
  onOpenQuote: () => void;
}

export function CtaSection({ onOpenQuote }: CtaSectionProps) {
  const [copied, setCopied] = useState(false);
  const dockerCmd = 'docker run -d -p 8000:8000 -p 3000:3000 innostes/platform:latest';

  const copy = () => {
    navigator.clipboard.writeText(dockerCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="get-started" data-chapter className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="brand-stage rounded-2xl px-6 py-14 text-center shadow-xl sm:px-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-sidebar-foreground sm:text-sm">
            <Zap className="size-3.5 text-ai-on-dark" aria-hidden="true" />
            <span className="text-white">Book a demo</span>
            <span aria-hidden="true">·</span>
            <span>30 minutes</span>
            <span aria-hidden="true">·</span>
            <span>Your workflows</span>
          </div>

          <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            See your company <span className="text-brand-highlight">in one place</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-sidebar-foreground sm:text-lg">
            In 30 minutes we'll walk you through INNOSTES using your company's workflows, and answer every question you have.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenQuote}
              className="cta-glow inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Book a demo
              <ArrowRight className="size-4" />
            </button>
            <a
              href="/docs/getting-started"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-6 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
            >
              Or self-host for free
            </a>
          </div>

          <div className="mx-auto mt-8 flex max-w-md items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <Terminal className="size-3.5 shrink-0 text-sidebar-primary" aria-hidden="true" />
              <code className="truncate font-mono text-xs text-white">{dockerCmd}</code>
            </div>
            <button
              type="button"
              onClick={copy}
              className="ml-3 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-sidebar-ring"
            >
              {copied ? <Check className="size-3 text-ai-on-dark" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-sidebar-foreground">
            {['Open source', 'Free to self-host', 'No per-seat fees'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-ai-on-dark" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
