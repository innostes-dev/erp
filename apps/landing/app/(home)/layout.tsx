import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { Button } from '@innostes/ui';
import { BookOpen, Layers } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        { text: 'Home', url: '/', active: 'url' },
        {
          type: 'menu',
          text: 'Docs',
          items: [
            {
              text: 'Developer Docs',
              description: 'Set up, run and build the innostes platform.',
              url: '/docs',
              icon: <BookOpen />,
            },
            {
              text: 'innostes UI Docs',
              description:
                'Components, theming and usage of the design system.',
              url: '/ui/docs',
              icon: <Layers />,
            },
          ],
        },
        { text: 'Developers', url: '/docs', active: 'nested-url', on: 'menu' },
        { text: 'Design System', url: '/ui', active: 'url' },
        {
          type: 'custom',
          on: 'nav',
          secondary: true,
          children: (
            <li>
              <Button
                size="sm"
                render={<a href="/docs/getting-started" />}
                nativeButton={false}
              >
                Get Started
              </Button>
            </li>
          ),
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
