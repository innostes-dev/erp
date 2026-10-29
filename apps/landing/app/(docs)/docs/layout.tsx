import { devSource } from '@/lib/source';
import { DocsShell } from '@/components/docs/docs-shell';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsShell
      tree={devSource.getPageTree()}
      title="innostes"
      badge="Developers"
      homeUrl="/"
      links={[
        { text: 'Docs', url: '/docs', active: 'none' },
        { text: 'Apps', url: '/docs/apps/landing', active: 'nested-url' },
        { text: 'Guides', url: '/docs/guides/nx', active: 'nested-url' },
        { text: 'API', url: '/api-reference' },
        { text: 'UI', url: '/ui' },
      ]}
      cta={{ text: 'Get Started', url: '/docs/getting-started' }}
    >
      {children}
    </DocsShell>
  );
}
