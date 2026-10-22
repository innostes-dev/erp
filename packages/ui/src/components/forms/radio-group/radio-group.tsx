'use client';

import { forwardRef } from 'react';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { mergeClassName } from '../../../lib/merge-class-name';

export type RadioGroupProps = BaseRadioGroup.Props;

/**
 * A set of options where exactly one can be selected. Arrow keys move between options.
 * Controlled with `value` / `onValueChange`, or uncontrolled with `defaultValue`.
 *
 * @example
 * <RadioGroup defaultValue="monthly" aria-label="Billing period">
 *   <label className="flex items-center gap-2"><Radio value="monthly" /> Monthly</label>
 *   <label className="flex items-center gap-2"><Radio value="yearly" /> Yearly</label>
 * </RadioGroup>
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup({ className, ...props }, ref) {
    return (
      <BaseRadioGroup
        ref={ref}
        data-slot="radio-group"
        className={mergeClassName(
          'flex flex-col items-start gap-3 data-[orientation=horizontal]:flex-row',
          className,
        )}
        {...props}
      />
    );
  },
);

export type RadioProps = BaseRadio.Root.Props;

/** One option in a `RadioGroup`. */
export const Radio = forwardRef<HTMLElement, RadioProps>(function Radio(
  { className, ...props },
  ref,
) {
  return (
    <BaseRadio.Root
      ref={ref}
      data-slot="radio"
      className={mergeClassName(
        [
          'peer inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background shadow-xs',
          'cursor-pointer transition-colors outline-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          'data-checked:border-primary data-checked:bg-primary',
          'data-invalid:border-destructive',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        ].join(' '),
        className,
      )}
      {...props}
    >
      <BaseRadio.Indicator
        data-slot="radio-indicator"
        className="size-1.5 rounded-full bg-primary-foreground data-unchecked:hidden"
      />
    </BaseRadio.Root>
  );
});
