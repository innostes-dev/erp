import type { ReactNode } from 'react';
import { cn } from '@innostes/ui';

/** Bordered card that shows live components. */
export function Preview({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'not-prose my-6 rounded-xl border border-fd-border bg-fd-card p-6 shadow-xs',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** One labelled row inside a Preview. */
export function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-[140px_1fr] md:items-center">
      <div className="text-sm font-medium text-fd-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** Two columns: code on the left, live playground on the right. */
export function UsageGrid({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:my-0">
      {children}
    </div>
  );
}
