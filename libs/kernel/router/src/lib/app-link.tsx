'use client';

import NextLink, { type LinkProps } from 'next/link';
import { type AnchorHTMLAttributes, type ReactNode } from 'react';
import { emit } from '@mono/kernel/event-bus';

type AppLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    trackAs?: string;
  };

export function AppLink({ trackAs, onClick, children, ...props }: AppLinkProps) {
  return (
    <NextLink
      {...props}
      onClick={(e) => {
        if (trackAs) {
          emit('notification:show', {
            message: `Navigating to ${trackAs}`,
            type: 'info',
          });
        }
        onClick?.(e);
      }}
    >
      {children}
    </NextLink>
  );
}
