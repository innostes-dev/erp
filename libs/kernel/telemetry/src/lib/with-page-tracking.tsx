'use client';

import { type ComponentType, useEffect } from 'react';
import { track } from './telemetry';

export function withPageTracking<P extends object>(
  Component: ComponentType<P>,
  pageName: string,
): ComponentType<P> {
  return function TrackedPage(props: P) {
    useEffect(() => {
      track('page_view', { page: pageName });
    }, []);
    return <Component {...props} />;
  };
}
