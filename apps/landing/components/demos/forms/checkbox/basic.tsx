'use client';

import { Checkbox } from '@innostes/ui';

export default function CheckboxDemo() {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox defaultChecked /> Send me product updates
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox /> I accept the terms
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox disabled /> Disabled
      </label>
    </div>
  );
}
