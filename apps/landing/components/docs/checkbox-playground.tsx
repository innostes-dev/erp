'use client';

import { Checkbox } from '@innostes/ui';
import { PropsPlayground, type PlaygroundControl } from './props-playground';

const controls: PlaygroundControl[] = [
  {
    type: 'boolean',
    prop: 'defaultChecked',
    label: 'Checked',
    defaultValue: true,
  },
  {
    type: 'boolean',
    prop: 'indeterminate',
    label: 'Indeterminate',
    defaultValue: false,
  },
  {
    type: 'boolean',
    prop: 'disabled',
    label: 'Disabled',
    defaultValue: false,
  },
];

export function CheckboxPlayground() {
  return (
    <PropsPlayground
      component="Checkbox"
      controls={controls}
      render={(values) => (
        <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer">
          <Checkbox
            defaultChecked={values.defaultChecked}
            indeterminate={values.indeterminate}
            disabled={values.disabled}
          />
          <span>Include shipping tax in calculation</span>
        </label>
      )}
    />
  );
}
