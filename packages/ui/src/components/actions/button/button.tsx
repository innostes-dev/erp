'use client';

import { forwardRef, type ReactNode } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';
import { cn } from '../../../lib/cn';
import { Spinner } from '../../feedback/spinner/spinner';
import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
} from './button-variants';

export interface ButtonProps extends Omit<BaseButton.Props, 'className'> {
    /**
     * Visual style.
     * @default 'primary'
     */
    variant?: ButtonVariant;
    /**
     * Height, padding and font size: `sm` 32px, `md` 40px, `lg` 48px.
     * @default 'md'
     */
    size?: ButtonSize;
    /**
     * Render a square button for a single icon. Always pair with an `aria-label`.
     * @default false
     */
    iconOnly?: boolean;
    /**
     * Stretch to the width of the parent.
     * @default false
     */
    fullWidth?: boolean;
    /**
     * Show a spinner, set `aria-busy` and block interaction. The button stays focusable so
     * keyboard and screen reader users keep their place.
     * @default false
     */
    loading?: boolean;
    /** Label shown instead of `children` while `loading`. */
    loadingText?: ReactNode;
    /** Element before the label. Replaced by the spinner while `loading`. */
    startIcon?: ReactNode;
    /** Element after the label. */
    endIcon?: ReactNode;
    /**
     * Extra classes, merged with `tailwind-merge` so yours win. Can be a function of the
     * Base UI state: `({ disabled }) => string`.
     */
    className?: BaseButton.Props['className'];
}

/**
 * Triggers an action. Built on Base UI `Button`, so it handles keyboard activation, focus
 * and disabled states, and can render as another element through `render`.
 *
 * Defaults to `type="button"`, so it never submits a form by accident.
 *
 * @example
 * <Button onClick={save}>Save</Button>
 * <Button variant="outline" startIcon={<PlusIcon />}>Add item</Button>
 * <Button loading loadingText="Saving…">Save</Button>
 * <Button iconOnly aria-label="Close" variant="ghost"><XIcon /></Button>
 * <Button render={<a href="/docs" />} nativeButton={false}>Docs</Button>
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
    {
        variant,
        size,
        iconOnly = false,
        fullWidth = false,
        loading = false,
        loadingText,
        startIcon,
        endIcon,
        disabled,
        focusableWhenDisabled,
        className,
        children,
        type,
        nativeButton,
        render,
        ...props
    },
    ref,
) {
    const isNativeButton = nativeButton ?? render === undefined;
    const spinner = <Spinner label={null} />;

    const content = iconOnly ? (
        loading ? (
            spinner
        ) : (
            children
        )
    ) : (
        <>
            {loading ? spinner : startIcon}
            {loading && loadingText !== undefined ? loadingText : children}
            {endIcon}
        </>
    );

    return (
        <BaseButton
            ref={ref}
            data-slot="button"
            type={isNativeButton ? (type ?? 'button') : type}
            nativeButton={nativeButton}
            render={render}
            disabled={disabled || loading}
            focusableWhenDisabled={focusableWhenDisabled ?? loading}
            aria-busy={loading || undefined}
            data-loading={loading ? '' : undefined}
            data-variant={variant ?? 'primary'}
            className={(state) =>
                cn(
                    buttonVariants({ variant, size, iconOnly, fullWidth }),
                    loading && 'cursor-wait',
                    typeof className === 'function' ? className(state) : className,
                )
            }
            {...props}
        >
            {content}
        </BaseButton>
    );
});
