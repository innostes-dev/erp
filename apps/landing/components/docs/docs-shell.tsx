import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Button } from '@innostes/ui';
import { baseOptions } from '@/lib/layout.shared';
import { Logo } from '@/components/logo';
import { ThemeSelect } from './theme-select';

/**
 * Shared docs chrome (top bar, sidebar, theme picker) used by both
 * the developer docs (/docs) and the innostes UI docs (/ui/docs).
 */
export function DocsShell({
  tree,
  title,
  badge,
  homeUrl,
  links,
  cta,
  children,
}: {
  tree: PageTree.Root;
  title: string;
  badge?: string;
  /** Where the logo links to. */
  homeUrl: string;
  links: LinkItemType[];
  cta: { text: string; url: string };
  children: ReactNode;
}) {
  const base = baseOptions();

  return (
    <DocsLayout
      {...base}
      tree={tree}
      nav={{
        ...base.nav,
        mode: 'top',
        url: homeUrl,
        title: (
          <>
            <Logo className="size-7" />
            <span className="text-lg font-semibold tracking-tight">
              {title}
            </span>
            {badge && (
              <span className="rounded-md bg-fd-accent px-1.5 py-0.5 text-xs font-medium text-fd-accent-foreground">
                {badge}
              </span>
            )}
          </>
        ),
      }}
      links={[
        ...links,
        {
          type: 'custom',
          on: 'nav',
          secondary: true,
          children: (
            <Button
              size="sm"
              render={<a href={cta.url} />}
              nativeButton={false}
              className="ms-2"
            >
              {cta.text}
            </Button>
          ),
        },
      ]}
      sidebar={{ banner: <ThemeSelect /> }}
    >
      {children}
    </DocsLayout>
  );
}
