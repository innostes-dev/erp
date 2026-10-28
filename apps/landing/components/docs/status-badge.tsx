import Link from 'next/link';
import { cn } from '@innostes/ui';

const styles = {
  Stable: 'bg-success/10 text-success ring-success/30 hover:bg-success/15',
  Beta: 'bg-primary/10 text-primary ring-primary/30 hover:bg-primary/15',
  Experimental: 'bg-warning/10 text-warning ring-warning/30 hover:bg-warning/15',
} as const;

export type Status = keyof typeof styles;

export function StatusBadge({
  status,
  href = '/ui/docs/foundations/status-legend',
  className,
}: {
  status: Status;
  href?: string | null;
  className?: string;
}) {
  const badge = (
    <span
      data-slot="status-badge"
      data-status={status.toLowerCase()}
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={`View stability definition for ${status}`}
        className="inline-flex no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {badge}
      </Link>
    );
  }

  return badge;
}
