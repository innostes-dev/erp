'use client';

import { forwardRef } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';

export interface SwitchProps extends BaseSwitch.Root.Props {
    /**
     * Track size: `sm` 16px, `md` 20px tall.
     * @default 'md'
     */
    size?: 'sm' | 'md';
}

/**
 * An on/off control for settings that apply immediately. For choices submitted with a form
 * that need confirmation, prefer `Checkbox`.
 *
 * @example
 * <label className="flex items-center gap-3">
 *   <Switch name="notifications" defaultChecked /> Email notifications
 * </label>
 */
export const Switch = forwardRef<HTMLElement, SwitchProps>(function Switch(
    { className, size = 'md', ...props },
    ref,
) {
    return (
        <BaseSwitch.Root
            ref={ref}
            data-slot="switch"
            data-size={size}
            className={mergeClassName(
                cn(
                    'peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input shadow-xs',
                    'transition-colors outline-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    'data-checked:bg-primary data-invalid:ring-2 data-invalid:ring-destructive/40',
                    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
                    size === 'sm' ? 'h-4 w-7' : 'h-5 w-9',
                ),
                className,
            )}
            {...props}
        >
            <BaseSwitch.Thumb
                data-slot="switch-thumb"
                className={cn(
                    'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform',
                    size === 'sm'
                        ? 'size-3 data-checked:translate-x-3 rtl:data-checked:-translate-x-3'
                        : 'size-4 data-checked:translate-x-4 rtl:data-checked:-translate-x-4',
                )}
            />
        </BaseSwitch.Root>
    );
});
