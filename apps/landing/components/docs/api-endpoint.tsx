'use client';

import { useState } from 'react';
import { Check, Copy, Key, Lock, Globe } from 'lucide-react';

interface ApiEndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
  path: string;
  auth?: 'BearerAuth' | 'SetupToken' | 'None' | string;
}

const methodStyles: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  POST: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  DELETE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

export function ApiEndpoint({ method, path, auth = 'BearerAuth' }: ApiEndpointProps) {
  const [copied, setCopied] = useState(false);
  const upperMethod = method.toUpperCase();
  const badgeStyle =
    methodStyles[upperMethod] || 'bg-fd-muted text-fd-muted-foreground border-fd-border';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div className="my-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fd-border bg-fd-card p-3 shadow-xs not-prose">
      <div className="flex flex-wrap items-center gap-2.5 font-mono text-sm">
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-bold tracking-wider uppercase ${badgeStyle}`}
        >
          {upperMethod}
        </span>
        <code className="text-fd-foreground font-semibold selection:bg-fd-accent">
          {path}
        </code>
      </div>

      <div className="flex items-center gap-2">
        {auth === 'BearerAuth' && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-border bg-fd-secondary px-2 py-0.5 text-xs text-fd-secondary-foreground font-medium">
            <Lock className="size-3 text-fd-muted-foreground" />
            Bearer Token
          </span>
        )}
        {auth === 'SetupToken' && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Key className="size-3" />
            Setup Token
          </span>
        )}
        {auth === 'None' && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <Globe className="size-3" />
            Public
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy endpoint path"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-fd-border bg-fd-background text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
