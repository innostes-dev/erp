import { cn } from '@innostes/ui';

export interface SinceProps {
  /** The library version when the symbol or prop was introduced, e.g. "0.1.0". */
  version: string;
  className?: string;
}

/**
 * An inline indicator badge marking the library version in which a symbol, property, or behavior was added.
 */
export function Since({ version, className }: SinceProps) {
  return (
    <span
      data-slot="since-badge"
      className={cn(
        'inline-flex items-center rounded-sm bg-fd-muted px-1.5 py-0.5 font-mono text-[11px] font-normal text-fd-muted-foreground ring-1 ring-fd-border/50 ring-inset',
        className,
      )}
    >
      Since v{version}
    </span>
  );
}
