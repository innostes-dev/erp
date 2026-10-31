'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cn } from '../../../lib/cn';
import { inputVariants } from '../input/input-variants';

export interface TextareaProps extends ComponentProps<'textarea'> {
    /**
     * Grow with the content instead of scrolling (uses CSS `field-sizing: content`).
     * Set `rows` for the minimum height.
     * @default false
     */
    autoResize?: boolean;
}

/**
 * A multi-line text field. Inside a `Field` it is automatically labelled, described and
 * validated.
 *
 * @example
 * <Field>
 *   <FieldLabel>Notes</FieldLabel>
 *   <Textarea name="notes" rows={4} autoResize />
 * </Field>
 */
export const Textarea = forwardRef<HTMLElement, TextareaProps>(
    function Textarea(
        { className, autoResize = false, rows = 3, ...props },
        ref,
    ) {
        return (
            <BaseField.Control
                ref={ref}
                data-slot="textarea"
                render={<textarea rows={rows} {...props} />}
                className={cn(
                    inputVariants(),
                    'h-auto min-h-16 py-2 leading-relaxed',
                    autoResize ? 'field-sizing-content resize-none' : 'resize-y',
                    className,
                )}
            />
        );
    },
);
