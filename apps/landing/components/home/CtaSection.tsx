'use client';

import React, { useState } from 'react';
import { Button } from '@innostes/ui';
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
    <section className="relative overflow-hidden py-24 lg:py-36 transition-colors duration-300">
      
      {/* Decorative Center Radial Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="size-[550px] sm:size-[700px] rounded-full bg-gradient-to-tr from-orange-400/15 via-purple-500/15 to-blue-500/15 blur-[140px] dark:from-orange-500/15 dark:via-purple-600/20 dark:to-blue-600/20" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bento-card relative overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-14 md:p-16">
          
          {/* Cadence-style Frosted Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-400/20 dark:text-orange-300">
              <Zap className="size-3" /> Get Started
            </span>
            <span>Zero Seat Fees</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Deploy in 5 Mins</span>
          </div>

          {/* Heading */}
          <h2 className="mt-7 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.12]">
            Take full control of your
            <br />
            <span className="gradient-cadence">business operations</span>
          </h2>

          {/* Subheading */}
          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Deploy Innostes on your infrastructure in under five minutes with zero software fees,
            or consult with our core engineering team for turnkey enterprise cloud setup.
          </p>

          {/* Dual Pill Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            >
              <span>Deploy free (self-hosted)</span>
              <ArrowRight className="size-4" />
            </a>

            <button
              onClick={onOpenQuote}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <span>Request enterprise quote</span>
            </button>
          </div>

          {/* Copyable Docker snippet */}
          <div className="mx-auto mt-8 flex max-w-md items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 shadow-lg">
            <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <Terminal className="size-3.5 shrink-0 text-blue-400" />
              <code className="truncate font-mono text-xs text-slate-200">{dockerCmd}</code>
            </div>
            <button
              onClick={copy}
              className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              100% Open Source
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              ₹0 Community Forever
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              No Credit Card Required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
