'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@innostes/ui';
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Layers,
  Monitor,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { SalesFlowPreviewMini, HeadlessApiPreviewMini } from './HeroSandboxes';

interface HeroSectionProps {
  onOpenQuote: () => void;
}

export function HeroSection({ onOpenQuote }: HeroSectionProps) {
  const [activeSandboxTab, setActiveSandboxTab] = useState<'turnkey' | 'headless'>('turnkey');
  const [copiedDocker, setCopiedDocker] = useState(false);

  const dockerCommand = 'docker run -d -p 8000:8000 -p 3000:3000 innostes/platform:latest';

  const copyDocker = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  return (
    <section className="relative overflow-hidden border-b border-fd-border py-16 md:py-24 lg:py-28">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/80 px-3.5 py-1 text-xs font-medium text-fd-foreground shadow-xs backdrop-blur-sm">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Decoupled Business OS</span>
            <span className="text-fd-muted-foreground">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">0 Rs Self-Hosted</span>
            <span className="text-fd-muted-foreground">•</span>
            <span>Zero Per-Seat Fees</span>
          </div>

          {/* Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-fd-foreground sm:text-6xl lg:text-7xl">
            The Modular Business Operating System You Own Completely.
          </h1>

          {/* Subhead */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fd-muted-foreground sm:text-xl">
            Unify operations, revenue, workforce, and developer infrastructure on a single hardened core.
            Deploy the full-stack turnkey platform or consume the backend headlessly through standard REST APIs.
          </p>

          {/* CTAs */}
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
              Request Setup or Custom Quote
            </Button>
          </div>

          {/* Docker Terminal Snippet */}
          <div className="mx-auto mt-8 flex max-w-lg items-center justify-between rounded-xl border border-fd-border bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-200 shadow-md dark:bg-black">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <Terminal className="size-3.5 shrink-0 text-blue-400" />
              <span className="truncate">{dockerCommand}</span>
            </div>
            <button
              onClick={copyDocker}
              className="ml-3 flex shrink-0 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Copy Docker Run Command"
            >
              {copiedDocker ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copiedDocker ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Dual-Mode Showcase Sandbox */}
        <div className="mt-14">
          <div className="overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-2xl">
            {/* Top Bar with Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between border-b border-fd-border bg-fd-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-amber-500/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 font-mono text-xs text-fd-muted-foreground">
                  innostes://business-os/workspace
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-fd-border bg-fd-background p-1">
                <button
                  onClick={() => setActiveSandboxTab('turnkey')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    activeSandboxTab === 'turnkey'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-fd-muted-foreground hover:text-fd-foreground'
                  }`}
                >
                  <Monitor className="size-3.5" />
                  Turnkey Full-Stack UI
                </button>
                <button
                  onClick={() => setActiveSandboxTab('headless')}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    activeSandboxTab === 'headless'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-fd-muted-foreground hover:text-fd-foreground'
                  }`}
                >
                  <Code2 className="size-3.5" />
                  Headless REST API
                </button>
              </div>
            </div>

            {/* Sandbox Container */}
            <div className="p-4 md:p-6">
              {activeSandboxTab === 'turnkey' ? (
                <SalesFlowPreviewMini />
              ) : (
                <HeadlessApiPreviewMini />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
