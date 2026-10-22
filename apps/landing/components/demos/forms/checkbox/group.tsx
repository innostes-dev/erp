'use client';

import { useState } from 'react';
import { Checkbox, CheckboxGroup } from '@innostes/ui';

const permissions = [
  { value: 'read', label: 'View orders' },
  { value: 'write', label: 'Edit orders' },
  { value: 'refund', label: 'Issue refunds' },
];

export default function CheckboxGroupDemo() {
  const [value, setValue] = useState<string[]>(['read']);

  return (
    <CheckboxGroup
      value={value}
      onValueChange={setValue}
      allValues={permissions.map((p) => p.value)}
      aria-labelledby="permissions-label"
    >
      <label
        id="permissions-label"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <Checkbox parent /> All permissions
      </label>
      <div className="flex flex-col gap-3 ps-6">
        {permissions.map((p) => (
          <label key={p.value} className="flex items-center gap-2 text-sm">
            <Checkbox value={p.value} /> {p.label}
          </label>
        ))}
      </div>
    </CheckboxGroup>
  );
}
