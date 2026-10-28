'use client';

import { Input } from '@innostes/ui';
import { PropsPlayground, type PlaygroundControl } from './props-playground';

const controls: PlaygroundControl[] = [
  {
    type: 'select',
    prop: 'size',
    label: 'Size',
    options: [
      { value: 'sm', label: 'Small (32px)' },
      { value: 'md', label: 'Medium (40px)' },
      { value: 'lg', label: 'Large (48px)' },
    ],
    defaultValue: 'md',
  },
  {
    type: 'select',
    prop: 'type',
    label: 'Type',
    options: ['text', 'email', 'number', 'password', 'search'],
    defaultValue: 'text',
  },
  {
    type: 'text',
    prop: 'placeholder',
    label: 'Placeholder',
    defaultValue: 'Enter invoice number...',
  },
  {
    type: 'boolean',
    prop: 'disabled',
    label: 'Disabled',
    defaultValue: false,
  },
  {
    type: 'boolean',
    prop: 'invalid',
    label: 'Invalid',
    defaultValue: false,
  },
];

export function InputPlayground() {
  return (
    <PropsPlayground
      component="Input"
      controls={controls}
      render={(values) => (
        <div className="w-full max-w-sm">
          <Input
            size={values.size}
            type={values.type}
            placeholder={values.placeholder}
            disabled={values.disabled}
            aria-invalid={values.invalid ? true : undefined}
            aria-label="Input playground demo"
          />
        </div>
      )}
    />
  );
}
