'use client';

import { forwardRef } from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { mergeClassName } from '../../../lib/merge-class-name';
import { CheckIcon, MinusIcon } from '../../../lib/icons';

export type CheckboxProps = BaseCheckbox.Root.Props;

/**
 * A box that is checked, unchecked or indeterminate. Controlled with `checked` /
 * `onCheckedChange`, or uncontrolled with `defaultChecked`. Submits `value` under `name`.
 *
 * Label it with a wrapping `<label>`, a `FieldLabel` inside `Field`, or `aria-label`.
 *
 * @example
 * <label className="flex items-center gap-2">
 *   <Checkbox name="terms" required /> I accept the terms
 * </label>
 *
 * <Checkbox indeterminate aria-label="Select all rows" />
 */
export const Checkbox = forwardRef<HTMLElement, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <BaseCheckbox.Root
        ref={ref}
        data-slot="checkbox"
        className={mergeClassName(
          [
            'peer inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background shadow-xs',
            'cursor-pointer transition-colors outline-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground',
            'data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground',
            'data-invalid:border-destructive',
            'data-disabled:cursor-not-allowed data-disabled:opacity-50',
          ].join(' '),
          className,
        )}
        {...props}
      >
        <BaseCheckbox.Indicator
          data-slot="checkbox-indicator"
          className="group flex items-center justify-center data-unchecked:hidden"
        >
          <CheckIcon
            className="size-3.5 group-data-indeterminate:hidden"
            strokeWidth={3}
          />
          <MinusIcon
            className="hidden size-3.5 group-data-indeterminate:block"
            strokeWidth={3}
          />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    );
  },
);
