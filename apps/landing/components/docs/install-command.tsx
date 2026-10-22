'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@innostes/ui';

export function InstallCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-lg border border-fd-border bg-fd-card text-sm',
        className,
      )}
    >
      <code className="flex-1 truncate px-3 py-2.5 font-mono text-[13px] text-fd-foreground">
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy install command'}
        className="flex items-center border-l border-fd-border px-3 text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
      >
        {copied ? (
          <Check className="size-4 text-emerald-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
