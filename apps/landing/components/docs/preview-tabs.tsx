'use client';

import { useState, type ReactNode } from 'react';
import { Code2, Eye, Moon, Smartphone, Sun } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
      active
        ? 'border-fd-primary text-fd-foreground'
        : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
    );

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div
        role="tablist"
        aria-label="Example"
        className="flex items-center justify-between border-b border-fd-border px-2"
      >
        <div className="flex">
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

        {tab === 'preview' && (
          <div className="flex items-center gap-1 pe-2">
            <button
              type="button"
              aria-pressed={isMobile}
              title={isMobile ? 'Reset to full width' : 'Simulate 360px mobile width'}
              onClick={() => setIsMobile((prev) => !prev)}
              className={cn(
                'inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground',
                isMobile && 'bg-fd-muted text-fd-foreground font-semibold',
              )}
            >
              <Smartphone className="size-3.5" />
            </button>
            <button
              type="button"
              aria-pressed={isDark}
              title={isDark ? 'Switch preview to light theme' : 'Switch preview to dark theme'}
              onClick={() => setIsDark((prev) => !prev)}
              className={cn(
                'inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground',
                isDark && 'bg-fd-muted text-fd-foreground',
              )}
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        )}
      </div>
      <div
        role="tabpanel"
        className={cn(
          'transition-all duration-200',
          isDark && 'dark bg-background text-foreground',
          tab !== 'preview' && 'hidden',
        )}
      >
        <div className={cn(isMobile ? 'mx-auto max-w-[360px] border-x border-dashed border-fd-border' : 'w-full')}>
          {preview}
        </div>
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
