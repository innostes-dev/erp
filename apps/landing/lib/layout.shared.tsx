import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';
import { Logo } from '@/components/logo';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="h-5" />
          <span className="sr-only">{appName}</span>
        </>
      ),
    },
  };
}
