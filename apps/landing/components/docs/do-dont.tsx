import { type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@innostes/ui';

export interface DoDontProps {
  children: ReactNode;
  className?: string;
}

export function DoDont({ children, className }: DoDontProps) {
  return (
    <div className={cn('not-prose my-6 grid grid-cols-1 gap-6 md:grid-cols-2', className)}>
      {children}
    </div>
  );
}

export interface GuidelineProps {
  /** Optional caption or principle explaining why. */
  caption?: ReactNode;
  /** Content or live preview. */
  children: ReactNode;
  className?: string;
}

export function Do({ caption, children, className }: GuidelineProps) {
  return (
    <div
      data-slot="guideline-do"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-success/30 bg-fd-card shadow-xs',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-success/20 bg-success/10 px-4 py-2.5 text-xs font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase">
        <Check className="size-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
        <span>Do</span>
      </div>
      <div className="flex min-h-36 flex-1 items-center justify-center p-6 text-sm text-fd-foreground">
        {children}
      </div>
      {caption && (
        <div className="border-t border-fd-border/60 bg-fd-muted/30 px-4 py-3 text-xs leading-relaxed text-fd-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );
}

export function Dont({ caption, children, className }: GuidelineProps) {
  return (
    <div
      data-slot="guideline-dont"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-destructive/30 bg-fd-card shadow-xs',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs font-semibold tracking-wider text-red-700 dark:text-red-400 uppercase">
        <X className="size-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
        <span>Don't</span>
      </div>
      <div className="flex min-h-36 flex-1 items-center justify-center p-6 text-sm text-fd-foreground">
        {children}
      </div>
      {caption && (
        <div className="border-t border-fd-border/60 bg-fd-muted/30 px-4 py-3 text-xs leading-relaxed text-fd-muted-foreground">
          {caption}
        </div>
      )}
    </div>
  );
}
