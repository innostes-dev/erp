import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@mono/kernel/auth/server';

export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect('/login');
  return <>{children}</>;
}
