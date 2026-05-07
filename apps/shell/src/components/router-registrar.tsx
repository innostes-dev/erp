'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerRouter } from '@mono/kernel/router';

export function RouterRegistrar() {
  const router = useRouter();
  useEffect(() => {
    registerRouter(
      (href) => router.push(href),
      (href) => router.replace(href),
    );
  }, [router]);
  return null;
}
