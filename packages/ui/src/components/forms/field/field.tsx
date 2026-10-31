'use client';

import { forwardRef } from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { labelClassName } from '../label/label';

export type FieldProps = BaseField.Root.Props;

/**
 * Groups a label, a control, a description and validation messages, and wires up the
 * accessibility between them (`for`/`id`, `aria-describedby`, `aria-invalid`).
 *
 * Validation uses native constraints (`required`, `type`, `pattern`, …) or the `validate`
 * prop, and runs `validationMode="onSubmit"` by default.
 *
 * @example
 * <Field name="email" validate={(v) => (String(v).endsWith('@acme.com') ? null : 'Use your work email')}>
 *   <FieldLabel>Work email</FieldLabel>
 *   <Input type="email" required />
 *   <FieldDescription>We'll send the invite here.</FieldDescription>
 *   <FieldError />
 * </Field>
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
    { className, ...props },
    ref,
) {
    return (
        <BaseField.Root
            ref={ref}
            data-slot="field"
            className={mergeClassName('flex flex-col gap-2', className)}
            {...props}
        />
    );
});

export interface FieldLabelProps extends BaseField.Label.Props {
    /** Append a required marker. Purely visual; set `required` on the control too. */
    required?: boolean;
}

/** The label of a `Field`. Linked to the control automatically. */
export const FieldLabel = forwardRef<HTMLElement, FieldLabelProps>(
    function FieldLabel({ className, required, children, ...props }, ref) {
        return (
            <BaseField.Label
                ref={ref}
                data-slot="field-label"
                className={mergeClassName(labelClassName, className)}
                {...props}
            >
                {children}
                {required && (
                    <span aria-hidden="true" className="text-destructive">
                        *
                    </span>
                )}
            </BaseField.Label>
        );
    },
);

/** Help text for a `Field`. Announced with the control via `aria-describedby`. */
export const FieldDescription = forwardRef<
    HTMLParagraphElement,
    BaseField.Description.Props
>(function FieldDescription({ className, ...props }, ref) {
    return (
        <BaseField.Description
            ref={ref}
            data-slot="field-description"
            className={mergeClassName('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
});

/**
 * Validation message for a `Field`. Shows the browser's message by default; pass children
 * and `match` (e.g. `match="valueMissing"`) to customise per error.
 */
export const FieldError = forwardRef<HTMLDivElement, BaseField.Error.Props>(
    function FieldError({ className, ...props }, ref) {
        return (
            <BaseField.Error
                ref={ref}
                data-slot="field-error"
                className={mergeClassName(
                    'text-sm font-medium text-destructive',
                    className,
                )}
                {...props}
            />
        );
    },
);

/**
 * Wraps one option (e.g. a `Checkbox` and its label) inside a `Field` that holds a group,
 * so each option gets its own label.
 */
export const FieldItem = forwardRef<HTMLDivElement, BaseField.Item.Props>(
    function FieldItem({ className, ...props }, ref) {
        return (
            <BaseField.Item
                ref={ref}
                data-slot="field-item"
                className={mergeClassName(cn('flex items-center gap-2'), className)}
                {...props}
            />
        );
    },
);
