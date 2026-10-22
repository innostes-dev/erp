'use client';

import { Separator } from '@innostes/ui';

export default function SeparatorDemo() {
  return (
    <div className="w-full max-w-sm">
      <p className="text-sm font-medium">innostes UI</p>
      <p className="text-sm text-muted-foreground">
        Components for admin interfaces.
      </p>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Components</span>
        <Separator orientation="vertical" />
        <span>Theming</span>
      </div>
    </div>
  );
}
