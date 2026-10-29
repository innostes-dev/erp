import { source } from '@/lib/source';
import { uiName, uiVersion } from '@/lib/shared';
import { DocsShell } from '@/components/docs/docs-shell';

export default function Layout({ children }: LayoutProps<'/ui/docs'>) {
  return (
    <DocsShell
      tree={source.getPageTree()}
      title={uiName}
      badge={`v${uiVersion}`}
      homeUrl="/ui"
      links={[
        { text: 'Overview', url: '/ui/docs', active: 'none' },
        {
          text: 'Components',
          url: '/ui/docs/components/actions',
          active: 'none',
        },
        { text: 'Patterns', url: '/ui/docs/patterns' },
        { text: 'Foundations', url: '/ui/docs/foundations/status-legend' },
        { text: 'Resources', url: '/ui/docs/resources' },
        { text: 'API', url: '/api-reference' },
        { text: 'Developers', url: '/docs' },
      ]}
      cta={{ text: 'Get Started', url: '/ui/docs/installation' }}
    >
      {children}
    </DocsShell>
  );
}
