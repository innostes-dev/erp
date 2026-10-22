'use client';

import { Radio, RadioGroup } from '@innostes/ui';

const plans = [
  { value: 'starter', label: 'Starter', detail: 'Up to 5 users' },
  { value: 'business', label: 'Business', detail: 'Up to 50 users' },
  { value: 'enterprise', label: 'Enterprise', detail: 'Unlimited users, SSO' },
];

export default function RadioGroupDemo() {
  return (
    <RadioGroup
      defaultValue="business"
      aria-label="Plan"
      className="w-full max-w-sm"
    >
      {plans.map((plan) => (
        <label
          key={plan.value}
          className="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5"
        >
          <Radio value={plan.value} className="mt-0.5" />
          <span className="flex flex-col">
            <span className="text-sm font-medium">{plan.label}</span>
            <span className="text-xs text-muted-foreground">{plan.detail}</span>
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}
