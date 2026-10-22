'use client';

import * as React from 'react';

let counter = 0;

// Read `useId` dynamically so bundlers don't fail on React 17, where it doesn't exist.
const reactUseId: (() => string) | undefined = (
  React as unknown as Record<string, unknown>
)['useId'.toString()] as (() => string) | undefined;

function useFallbackId(): string {
  const [id] = React.useState(() => `in-${++counter}`);
  return id;
}

/**
 * A stable unique id for accessibility attributes. Uses React's `useId` on React 18+, and a
 * counter on React 17 (ids may differ between server and client there, which only matters
 * for server-rendered apps on React 17).
 *
 * @param override - Use this id instead, e.g. when the consumer passes `id`.
 * @internal
 */
export function useId(override?: string): string {
  // The branch is stable for the lifetime of the app, so hook order never changes.
  const generated = reactUseId ? reactUseId() : useFallbackId();
  return override ?? generated;
}
