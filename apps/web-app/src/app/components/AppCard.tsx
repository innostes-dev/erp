import type { ReactNode } from 'react';
import { IconTile, cn } from '@innostes/ui';
import { ChevronRight } from 'lucide-react';
import { Link } from '../context/NavigationContext';
import { appIcon } from '../navigation/icons';
import type { CatalogItem } from '../catalog';

/**
 * A module or plugin as a card. Identity = neutral icon tile + name (no module colours).
 * With `href` the whole card is one link; otherwise pass `actions` (e.g. Activate).
 */
export function AppCard({
  item,
  href,
  status,
  actions,
  className,
}: {
  item: CatalogItem;
  href?: string;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const Icon = appIcon(item.id);
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <IconTile tone="neutral" size="md">
          <Icon aria-hidden="true" />
        </IconTile>
        {status ?? (href && <ChevronRight className="size-4 text-subtle-foreground transition-colors group-hover:text-primary" aria-hidden="true" />)}
      </div>
      <div className="mt-4 min-w-0">
        <h3 className="text-subheading font-semibold text-foreground">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-body-sm text-muted-foreground">{item.description}</p>
      </div>
      <p className="mt-4 truncate border-t border-border pt-3 text-caption text-muted-foreground">
        {item.subFeatures.length} {item.subFeatures.length === 1 ? 'area' : 'areas'} ·{' '}
        {item.subFeatures.slice(1, 4).map((s) => s.label).join(', ')}
      </p>
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </>
  );

  const frame = 'group flex flex-col rounded-lg border border-border bg-card p-5 text-start transition-colors';
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          frame,
          'hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          className,
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={cn(frame, className)}>{body}</div>;
}
