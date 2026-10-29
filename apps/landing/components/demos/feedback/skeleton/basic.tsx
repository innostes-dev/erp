'use client';

import { Skeleton } from '@innostes/ui';

export default function SkeletonDemo() {
  return (
    <div
      role="region"
      aria-busy="true"
      aria-label="Loading profile"
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
