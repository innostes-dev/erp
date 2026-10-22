'use client';

import { useEffect, useState } from 'react';
import { cn } from '@innostes/ui';

export interface PageTab {
  label: string;
  /** Heading id to jump to, e.g. "api-reference". */
  href: string;
}

/** Tab bar under the page header. Each tab jumps to a section of the page. */
export function PageTabs({ items }: { items: PageTab[] }) {
  const [active, setActive] = useState(items[0]?.href);

  useEffect(() => {
    const ids = items.map((i) => i.href);
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 160) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [items]);

  return (
    <nav
      aria-label="Page sections"
      className="not-prose mt-8 border-b border-fd-border"
    >
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={`#${item.href}`}
              aria-current={active === item.href ? 'true' : undefined}
              className={cn(
                'inline-block border-b-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors md:px-3',
                active === item.href
                  ? 'border-fd-primary text-fd-primary'
                  : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
