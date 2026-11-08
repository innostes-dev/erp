import type { ReactNode } from 'react';
import { cn } from '@innostes/ui';

/**
 * Standard page frame inside the shell: consistent gutters (16 mobile / 24 tablet / 32 desktop),
 * vertical rhythm and a readable maximum width. Every routed page renders inside one.
 */
export function PageContainer({
  children,
  width = 'wide',
  className,
}: {
  children: ReactNode;
  /** `wide` 1440px (dashboards, lists) · `default` 1120px (settings) · `narrow` 880px (forms). */
  width?: 'wide' | 'default' | 'narrow';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8',
        width === 'wide' && 'max-w-[1440px]',
        width === 'default' && 'max-w-[1120px]',
        width === 'narrow' && 'max-w-[880px]',
        className,
      )}
    >
      {children}
    </div>
  );
}
