import Link from 'next/link';
import { source } from '@/lib/source';
import { StatusBadge, type Status } from './status-badge';

const CATEGORY_NAMES: Record<string, string> = {
  'actions': 'Actions',
  'forms': 'Forms',
  'data-display': 'Data Display',
  'feedback': 'Feedback',
  'overlays': 'Overlays',
  'navigation': 'Navigation',
  'layout': 'Layout',
  'widgets': 'Widgets',
  'charts': 'Charts',
};

function resolveEntryPoint(url: string): string {
  if (url.includes('/widgets/')) return '@innostes/ui/widgets';
  if (url.includes('/charts/')) return '@innostes/ui/charts';
  if (url.includes('/forms/rich-text-editor')) return '@innostes/ui/editor';
  return '@innostes/ui';
}

function resolveCategory(url: string): string {
  if (url.includes('/widgets/')) return 'Widgets';
  if (url.includes('/charts/')) return 'Charts';
  const match = url.match(/\/components\/([a-z0-9-]+)\//);
  if (match && CATEGORY_NAMES[match[1]]) {
    return CATEGORY_NAMES[match[1]];
  }
  return 'Components';
}

export function ComponentIndex() {
  const allPages = source.getPages();

  // Find all component, widget, and chart pages, excluding category index pages
  const componentPages = allPages
    .filter((page) => {
      const url = page.url;
      const isComponent = url.startsWith('/ui/docs/components/');
      const isWidget = url.startsWith('/ui/docs/widgets/');
      const isChart = url.startsWith('/ui/docs/charts/');

      if (!isComponent && !isWidget && !isChart) return false;

      // Exclude category index pages
      const segments = url.replace('/ui/docs/', '').split('/').filter(Boolean);
      if (segments.length === 1) return false; // /widgets, /charts
      if (segments.length === 2 && segments[0] === 'components') return false; // /components/actions, etc.

      return true;
    })
    .map((page) => {
      return {
        title: page.data.title,
        url: page.url,
        description: page.data.summary || page.data.description || '',
        status: (page.data.status || 'Stable') as Status,
        entryPoint: resolveEntryPoint(page.url),
        category: resolveCategory(page.url),
      };
    })
    .sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div data-slot="component-index" className="not-prose my-8 overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-muted-foreground">
            <th className="py-2.5 px-3 font-medium">Component</th>
            <th className="py-2.5 px-3 font-medium">Category</th>
            <th className="py-2.5 px-3 font-medium">Entry point</th>
            <th className="py-2.5 px-3 font-medium">Status</th>
            <th className="py-2.5 px-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {componentPages.map((item) => (
            <tr key={item.url} className="hover:bg-muted/30 transition-colors">
              <td className="py-2.5 px-3 whitespace-nowrap">
                <Link
                  href={item.url}
                  className="font-medium text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </td>
              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                {item.category}
              </td>
              <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {item.entryPoint}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <StatusBadge status={item.status} />
              </td>
              <td className="py-2.5 px-3 text-muted-foreground min-w-[240px]">
                {item.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
