'use client';

import { forwardRef } from 'react';
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';
import { mergeClassName } from '../../../lib/merge-class-name';

export type CheckboxGroupProps = BaseCheckboxGroup.Props;

/**
 * Manages several `Checkbox`es as one value: an array of the checked boxes' `value`s.
 * Pass `allValues` to let a parent checkbox (with `parent` prop) select or clear all.
 *
 * @example
 * <CheckboxGroup defaultValue={['email']} aria-labelledby="notify-label">
 *   <label className="flex items-center gap-2"><Checkbox value="email" /> Email</label>
 *   <label className="flex items-center gap-2"><Checkbox value="sms" /> SMS</label>
 * </CheckboxGroup>
 */
export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  function CheckboxGroup({ className, ...props }, ref) {
    return (
      <BaseCheckboxGroup
        ref={ref}
        data-slot="checkbox-group"
        className={mergeClassName('flex flex-col items-start gap-3', className)}
        {...props}
      />
    );
  },
);
