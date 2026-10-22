'use client';

import { Spinner } from '@innostes/ui';

export default function SpinnerDemo() {
  return (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner className="size-6 text-primary" label="Loading orders" />
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner label={null} /> Syncing…
      </span>
    </div>
  );
}
