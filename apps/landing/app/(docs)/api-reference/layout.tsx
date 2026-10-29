import type { ReactNode } from 'react';
import { apiSource } from '@/lib/source';
import { DocsShell } from '@/components/docs/docs-shell';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsShell
      tree={apiSource.getPageTree()}
      title="innostes"
      badge="API Reference"
      homeUrl="/"
      links={[
        { text: 'Overview', url: '/api-reference', active: 'none' },
        { text: 'Operations', url: '/api-reference/general/root', active: 'nested-url' },
        { text: 'Schemas', url: '/api-reference/schemas', active: 'nested-url' },
        { text: 'Guides', url: '/api-reference/guides/quickstart', active: 'nested-url' },
        { text: 'Dev Docs', url: '/docs' },
        { text: 'UI Docs', url: '/ui/docs' },
      ]}
      cta={{ text: 'Quickstart', url: '/api-reference/guides/quickstart' }}
    >
      {children}
    </DocsShell>
  );
}
