import Link from 'next/link';
import { source } from '@/lib/source';
import { StatusBadge, type Status } from './status-badge';
import { cn } from '@innostes/ui';

export interface CategoryGridProps {
  /** The folder path to list components from, e.g. "components/actions", "widgets", "charts". */
  category: string;
  className?: string;
}

export function CategoryGrid({ category, className }: CategoryGridProps) {
  const normalizedCategory = category.replace(/^\/+|\/+$/g, '');
  const prefix = `/ui/docs/${normalizedCategory}`;

  // Find all pages in this category, excluding the index/overview page itself
  const pages = source
    .getPages()
    .filter((p) => {
      if (p.url === prefix || p.url === `${prefix}/`) return false;
      return p.url.startsWith(`${prefix}/`);
    })
    // Only direct children (one level down)
    .filter((p) => {
      const rest = p.url.slice(prefix.length + 1);
      return !rest.includes('/');
    })
    .sort((a, b) => a.data.title.localeCompare(b.data.title));

  return (
    <div
      data-slot="category-grid"
      className={cn('not-prose my-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
    >
      {pages.map((page) => {
        const title = page.data.title;
        const description = page.data.summary || page.data.description || '';
        const status = (page.data.status || 'Stable') as Status;

        return (
          <Link
            key={page.url}
            href={page.url}
            className={cn(
              'group flex flex-col justify-between rounded-xl border border-fd-border bg-fd-card p-5 no-underline shadow-xs transition-[border-color,box-shadow,transform]',
              'hover:-translate-y-0.5 hover:border-fd-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring outline-none',
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-semibold text-fd-foreground group-hover:text-primary transition-colors">
                  {title}
                </h4>
                {status && <StatusBadge status={status} href={null} />}
              </div>
              {description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fd-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-primary">
              <span>View component</span>
              <span className="ms-1 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
