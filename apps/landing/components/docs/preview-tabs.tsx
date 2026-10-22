'use client';

import { useState, type ReactNode } from 'react';
import { Code2, Eye } from 'lucide-react';
import { cn } from '@innostes/ui';

/** Preview / Code switcher used by `ComponentPreview`. */
export function PreviewTabs({
  preview,
  code,
}: {
  preview: ReactNode;
  code: ReactNode;
}) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'border-fd-primary text-fd-foreground'
        : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
    );

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div
        role="tablist"
        aria-label="Example"
        className="flex border-b border-fd-border px-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'preview'}
          className={tabClass(tab === 'preview')}
          onClick={() => setTab('preview')}
        >
          <Eye className="size-3.5" /> Preview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'code'}
          className={tabClass(tab === 'code')}
          onClick={() => setTab('code')}
        >
          <Code2 className="size-3.5" /> Code
        </button>
      </div>
      <div
        role="tabpanel"
        className={cn('bg-background', tab !== 'preview' && 'hidden')}
      >
        {preview}
      </div>
      <div
        role="tabpanel"
        className={cn(
          'max-h-[32rem] overflow-auto',
          tab !== 'code' && 'hidden',
        )}
      >
        {code}
      </div>
    </div>
  );
}
