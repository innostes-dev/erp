import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName } from './shared';
import { Logo } from '@/components/logo';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="size-7" />
          <span className="text-lg font-semibold tracking-tight">
            {appName}
          </span>
        </>
      ),
    },
  };
}
