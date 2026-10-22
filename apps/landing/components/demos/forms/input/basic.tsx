'use client';

import { Input } from '@innostes/ui';

export default function InputDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input size="sm" placeholder="Small" aria-label="Small input" />
      <Input placeholder="Medium (default)" aria-label="Medium input" />
      <Input size="lg" placeholder="Large" aria-label="Large input" />
      <Input placeholder="Disabled" aria-label="Disabled input" disabled />
      <Input
        defaultValue="Invalid value"
        aria-label="Invalid input"
        aria-invalid
      />
      <Input type="file" aria-label="Upload file" />
    </div>
  );
}
