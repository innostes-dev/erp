'use client';

import { Switch, toast } from '@innostes/ui';

const settings = [
  {
    id: 'email',
    label: 'Email notifications',
    description: 'Order updates and invoices.',
    on: true,
  },
  {
    id: 'sms',
    label: 'SMS alerts',
    description: 'Only for failed payments.',
    on: false,
  },
];

export default function SwitchDemo() {
  return (
    <div className="flex w-full max-w-md flex-col divide-y divide-border rounded-lg border border-border">
      {settings.map((s) => (
        <label
          key={s.id}
          className="flex cursor-pointer items-center justify-between gap-4 p-4"
        >
          <span className="flex flex-col">
            <span className="text-sm font-medium">{s.label}</span>
            <span className="text-xs text-muted-foreground">
              {s.description}
            </span>
          </span>
          <Switch
            defaultChecked={s.on}
            onCheckedChange={(checked) =>
              toast(`${s.label} ${checked ? 'on' : 'off'}`)
            }
          />
        </label>
      ))}
    </div>
  );
}
