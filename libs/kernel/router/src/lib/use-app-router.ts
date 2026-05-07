'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface AppRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  prefetch: (href: string) => void;
  pathname: string;
  searchParams: URLSearchParams;
}

export function useAppRouter(): AppRouter {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return {
    push: (href) => router.push(href),
    replace: (href) => router.replace(href),
    back: () => router.back(),
    forward: () => router.forward(),
    prefetch: (href) => router.prefetch(href),
    pathname,
    searchParams,
  };
}
