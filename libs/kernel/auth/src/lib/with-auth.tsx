'use client';

import { type ComponentType, type JSX } from 'react';
import { useAuth } from './use-auth';
import { redirect } from 'next/navigation';

interface WithAuthOptions {
  requiredPermission?: string;
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {},
): (props: P) => JSX.Element | null {
  const { requiredPermission, redirectTo = '/login' } = options;

  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) return null;

    if (!isAuthenticated) {
      redirect(redirectTo);
    }

    if (requiredPermission && !user?.permissions.includes(requiredPermission)) {
      redirect('/403');
    }

    return <Component {...props} />;
  };
}
