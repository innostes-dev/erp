'use client';

import { useEffect } from 'react';
import { on } from './event-bus';
import type { AppEvent, AppEventPayload } from './event-bus.types';

export function useEvent<E extends AppEvent>(
  event: E,
  handler: (payload: AppEventPayload<E>) => void,
): void {
  useEffect(() => {
    const unsubscribe = on(event, handler);
    return unsubscribe;
  }, [event, handler]);
}
