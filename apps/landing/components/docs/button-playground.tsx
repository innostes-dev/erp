'use client';

import { Button, type ButtonSize, type ButtonVariant } from '@innostes/ui';
import { Send } from 'lucide-react';
import { PropsPlayground, type PlaygroundControl } from './props-playground';

const controls: PlaygroundControl[] = [
  {
    type: 'select',
    prop: 'variant',
    label: 'Variant',
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' },
      { value: 'destructive', label: 'Destructive' },
      { value: 'link', label: 'Link' },
    ],
    defaultValue: 'primary',
  },
  {
    type: 'select',
    prop: 'size',
    label: 'Size',
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
    ],
    defaultValue: 'md',
  },
  {
    type: 'select',
    prop: 'iconPosition',
    label: 'Icon placement',
    options: [
      { value: 'none', label: 'None' },
      { value: 'start', label: 'Start icon' },
      { value: 'end', label: 'End icon' },
    ],
    defaultValue: 'start',
  },
  {
    type: 'text',
    prop: 'children',
    label: 'Button text',
    defaultValue: 'Save changes',
  },
  {
    type: 'boolean',
    prop: 'loading',
    label: 'Loading',
    defaultValue: false,
  },
  {
    type: 'boolean',
    prop: 'disabled',
    label: 'Disabled',
    defaultValue: false,
  },
  {
    type: 'boolean',
    prop: 'fullWidth',
    label: 'Full width',
    defaultValue: false,
  },
];

export function ButtonPlayground() {
  return (
    <PropsPlayground
      component="Button"
      controls={controls}
      render={(values) => {
        const startIcon = values.iconPosition === 'start' ? <Send className="size-4" /> : undefined;
        const endIcon = values.iconPosition === 'end' ? <Send className="size-4" /> : undefined;
        return (
          <Button
            variant={values.variant as ButtonVariant}
            size={values.size as ButtonSize}
            loading={values.loading}
            disabled={values.disabled}
            fullWidth={values.fullWidth}
            startIcon={startIcon}
            endIcon={endIcon}
          >
            {values.children || 'Button'}
          </Button>
        );
      }}
      toCode={(values) => {
        const parts: string[] = [];
        if (values.variant !== 'primary') parts.push(`variant="${values.variant}"`);
        if (values.size !== 'md') parts.push(`size="${values.size}"`);
        if (values.iconPosition === 'start') parts.push('startIcon={<Send />}');
        if (values.iconPosition === 'end') parts.push('endIcon={<Send />}');
        if (values.loading) parts.push('loading');
        if (values.disabled) parts.push('disabled');
        if (values.fullWidth) parts.push('fullWidth');
        const text = values.children || 'Button';
        return `<Button${parts.length ? ' ' + parts.join(' ') : ''}>${text}</Button>`;
      }}
    />
  );
}
