'use client';

import { forwardRef } from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { inputVariants, type InputSize } from './input-variants';

export interface InputProps extends Omit<BaseInput.Props, 'size'> {
    /**
     * Height and text size.
     * @default 'md'
     */
    size?: InputSize;
    /** Native `size` attribute (visible character width). Rarely needed. */
    htmlSize?: number;
}

/**
 * A single-line text field. Inside a `Field` it is automatically labelled, described and
 * validated; on its own it behaves like a native `<input>`.
 *
 * @example
 * <Field>
 *   <FieldLabel>Email</FieldLabel>
 *   <Input type="email" name="email" required />
 *   <FieldError />
 * </Field>
 */
export const Input = forwardRef<HTMLElement, InputProps>(function Input(
    { className, size, htmlSize, type = 'text', ...props },
    ref,
) {
    return (
        <BaseInput
            ref={ref}
            data-slot="input"
            type={type}
            size={htmlSize}
            className={mergeClassName(
                cn(
                    inputVariants({ size }),
                    'file:me-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
                ),
                className,
            )}
            {...props}
        />
    );
});
