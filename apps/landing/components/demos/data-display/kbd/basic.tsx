'use client';

import { Kbd } from '@innostes/ui';

export default function KbdDemo() {
  return (
    <p className="text-sm text-muted-foreground">
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search, or <Kbd>Esc</Kbd> to close.
    </p>
  );
}
