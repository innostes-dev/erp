'use client';

import { forwardRef } from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { mergeClassName } from '../../../lib/merge-class-name';

/**
 * Groups related fields under a shared legend, e.g. "Billing address".
 * Setting `disabled` disables every control inside.
 *
 * @example
 * <Fieldset>
 *   <FieldsetLegend>Billing address</FieldsetLegend>
 *   <Field>…</Field>
 * </Fieldset>
 */
export const Fieldset = forwardRef<HTMLElement, BaseFieldset.Root.Props>(
    function Fieldset({ className, ...props }, ref) {
        return (
            <BaseFieldset.Root
                ref={ref}
                data-slot="fieldset"
                className={mergeClassName(
                    'flex min-w-0 flex-col gap-4 border-0 p-0',
                    className,
                )}
                {...props}
            />
        );
    },
);

/** The heading of a `Fieldset`. */
export const FieldsetLegend = forwardRef<
    HTMLDivElement,
    BaseFieldset.Legend.Props
>(function FieldsetLegend({ className, ...props }, ref) {
    return (
        <BaseFieldset.Legend
            ref={ref}
            data-slot="fieldset-legend"
            className={mergeClassName(
                'text-base font-semibold text-foreground',
                className,
            )}
            {...props}
        />
    );
});
