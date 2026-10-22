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
        { text: 'Docs', url: '/ui/docs', active: 'none' },
        {
          text: 'Components',
          url: '/ui/docs/components/actions/button',
          active: 'none',
        },
        { text: 'Examples', url: '/ui/docs/examples/dashboard' },
        { text: 'Theming', url: '/ui/docs/theming' },
        { text: 'Developers', url: '/docs' },
      ]}
      cta={{ text: 'Get Started', url: '/ui/docs/installation' }}
    >
      {children}
    </DocsShell>
  );
}
