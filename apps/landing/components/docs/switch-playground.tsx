'use client';

import { Switch } from '@innostes/ui';
import { PropsPlayground, type PlaygroundControl } from './props-playground';

const controls: PlaygroundControl[] = [
  {
    type: 'boolean',
    prop: 'defaultChecked',
    label: 'Checked',
    defaultValue: true,
  },
  {
    type: 'select',
    prop: 'size',
    label: 'Size',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium (default)' },
    ],
    defaultValue: 'md',
  },
  {
    type: 'boolean',
    prop: 'disabled',
    label: 'Disabled',
    defaultValue: false,
  },
];

export function SwitchPlayground() {
  return (
    <PropsPlayground
      component="Switch"
      controls={controls}
      render={(values) => (
        <label className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer">
          <Switch
            size={values.size}
            defaultChecked={values.defaultChecked}
            disabled={values.disabled}
            aria-label="Automatic stock reorder switch"
          />
          <span>Enable automated stock reorder trigger</span>
        </label>
      )}
    />
  );
}
