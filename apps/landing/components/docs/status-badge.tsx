import Link from 'next/link';
import { cn } from '@innostes/ui';

const styles: Record<string, string> = {
  Stable: 'bg-success/10 text-success ring-success/30 hover:bg-success/15',
  Beta: 'bg-primary/10 text-primary ring-primary/30 hover:bg-primary/15',
  Experimental: 'bg-warning/10 text-warning ring-warning/30 hover:bg-warning/15',
  accepted: 'bg-success/10 text-success ring-success/30 hover:bg-success/15',
  proposed: 'bg-primary/10 text-primary ring-primary/30 hover:bg-primary/15',
  superseded: 'bg-muted text-muted-foreground ring-border hover:bg-muted/80',
  deprecated: 'bg-destructive/10 text-destructive ring-destructive/30 hover:bg-destructive/15',
  rejected: 'bg-destructive/10 text-destructive ring-destructive/30 hover:bg-destructive/15',
};

export type Status = string;

export function StatusBadge({
  status,
  href = '/ui/docs/foundations/status-legend',
  className,
}: {
  status: Status;
  href?: string | null;
  className?: string;
}) {
  const badgeClass = styles[status] || 'bg-muted text-muted-foreground ring-border hover:bg-muted/80';
  const badge = (
    <span
      data-slot="status-badge"
      data-status={status.toLowerCase()}
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
        badgeClass,
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
