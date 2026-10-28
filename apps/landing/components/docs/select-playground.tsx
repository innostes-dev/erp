'use client';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@innostes/ui';
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
    type: 'boolean',
    prop: 'disabled',
    label: 'Disabled',
    defaultValue: false,
  },
];

export function SelectPlayground() {
  return (
    <PropsPlayground
      component="Select"
      controls={controls}
      render={(values) => (
        <div className="w-full max-w-xs">
          <Select defaultValue="bengaluru" disabled={values.disabled}>
            <SelectTrigger size={values.size} aria-label="Select depot">
              <SelectValue placeholder="Select warehouse depot..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bengaluru">Bengaluru Central Hub</SelectItem>
              <SelectItem value="whitefield">Whitefield Logistics Center</SelectItem>
              <SelectItem value="peenya">Peenya Industrial Depot</SelectItem>
              <SelectItem value="mumbai">Mumbai Port Terminal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}
