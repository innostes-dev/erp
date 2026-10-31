'use client';

import {
    forwardRef,
    useRef,
    useState,
    type ComponentProps,
    type ReactNode,
} from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { EyeIcon, EyeOffIcon, SearchIcon, XIcon } from '../../../lib/icons';
import { useControllableState } from '../../../lib/use-controllable-state';
import { inputVariants, type InputSize } from '../input/input-variants';

export interface InputGroupProps extends ComponentProps<'div'> {
    /** Height and text size, matching `Input`. @default 'md' */
    size?: InputSize;
}

/**
 * An input with add-ons: text, icons or buttons before or after it, inside one bordered
 * control. Use `InputGroupInput` for the input and `InputGroupAddon` for the extras.
 *
 * @example
 * <InputGroup>
 *   <InputGroupAddon>https://</InputGroupAddon>
 *   <InputGroupInput placeholder="acme" aria-label="Workspace URL" />
 *   <InputGroupAddon>.innostes.app</InputGroupAddon>
 * </InputGroup>
 */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
    function InputGroup({ className, size, ...props }, ref) {
        return (
            <div
                ref={ref}
                role="group"
                data-slot="input-group"
                data-size={size ?? 'md'}
                className={cn(
                    inputVariants({ size }),
                    'flex items-center gap-0 px-0',
                    'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25',
                    'has-[[aria-invalid=true]]:border-destructive has-[[data-invalid]]:border-destructive',
                    'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50',
                    className,
                )}
                {...props}
            />
        );
    },
);

/** The input inside an `InputGroup`. Same props as `Input`, without its own border. */
export const InputGroupInput = forwardRef<HTMLInputElement, BaseInput.Props>(
    function InputGroupInput({ className, ...props }, ref) {
        return (
            <BaseInput
                ref={ref}
                data-slot="input-group-input"
                className={mergeClassName(
                    'h-full w-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
                    className,
                )}
                {...props}
            />
        );
    },
);

export interface InputGroupAddonProps extends ComponentProps<'div'> {
    /**
     * `text` draws a muted section with a divider (for units, domains, currencies);
     * `icon` keeps it minimal (for icons and small buttons).
     * @default 'text'
     */
    variant?: 'text' | 'icon';
}

/** Text, an icon or a button before or after the input. */
export const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
    function InputGroupAddon({ className, variant = 'text', ...props }, ref) {
        return (
            <div
                ref={ref}
                data-slot="input-group-addon"
                data-variant={variant}
                className={cn(
                    "flex h-full shrink-0 items-center gap-1 text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
                    variant === 'text'
                        ? 'bg-muted/60 px-3 text-sm first:rounded-s-[inherit] first:border-e first:border-input last:rounded-e-[inherit] last:border-s last:border-input'
                        : 'px-2.5 first:pe-0 last:ps-0',
                    className,
                )}
                {...props}
            />
        );
    },
);

const iconButton =
    'flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring';

export interface SearchInputProps extends Omit<
    BaseInput.Props,
    'size' | 'value' | 'defaultValue' | 'onValueChange'
> {
    /** Height and text size. @default 'md' */
    size?: InputSize;
    /** Search text (controlled). */
    value?: string;
    /** Initial search text (uncontrolled). */
    defaultValue?: string;
    /** Called with the new text on every change (and with `''` when cleared). */
    onValueChange?: (value: string) => void;
    /** Keyboard shortcut hint shown at the end, e.g. `"⌘K"`. Visual only. */
    shortcut?: ReactNode;
    /** Label of the clear button, for translation. @default 'Clear search' */
    clearLabel?: string;
    /** Class for the outer group. */
    groupClassName?: string;
}

/**
 * A search box with a search icon, a clear button and an optional shortcut hint.
 * Escape clears it. Debounce in your own code if each change triggers a request.
 *
 * @example
 * <SearchInput aria-label="Search orders" placeholder="Search orders…" onValueChange={setQuery} />
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    function SearchInput(
        {
            size,
            value: valueProp,
            defaultValue = '',
            onValueChange,
            shortcut,
            clearLabel = 'Clear search',
            groupClassName,
            onKeyDown,
            ...props
        },
        ref,
    ) {
        const [value, setValue] = useControllableState({
            value: valueProp,
            defaultValue,
            onChange: onValueChange,
        });
        const innerRef = useRef<HTMLInputElement | null>(null);

        return (
            <InputGroup
                size={size}
                className={groupClassName}
                data-slot="search-input"
            >
                <InputGroupAddon variant="icon">
                    <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                    ref={(node: HTMLInputElement | null) => {
                        innerRef.current = node;
                        if (typeof ref === 'function') ref(node);
                        else if (ref) ref.current = node;
                    }}
                    type="search"
                    value={value}
                    onValueChange={(next) => setValue(next)}
                    onKeyDown={(event) => {
                        onKeyDown?.(event);
                        if (event.key === 'Escape' && value) {
                            event.preventDefault();
                            setValue('');
                        }
                    }}
                    className="[&::-webkit-search-cancel-button]:hidden"
                    {...props}
                />
                {value ? (
                    <InputGroupAddon variant="icon">
                        <button
                            type="button"
                            aria-label={clearLabel}
                            className={iconButton}
                            onClick={() => {
                                setValue('');
                                innerRef.current?.focus();
                            }}
                        >
                            <XIcon />
                        </button>
                    </InputGroupAddon>
                ) : shortcut ? (
                    <InputGroupAddon variant="icon" aria-hidden="true">
                        <kbd className="pointer-events-none rounded-sm border border-border bg-muted px-1.5 font-sans text-[11px] font-medium">
                            {shortcut}
                        </kbd>
                    </InputGroupAddon>
                ) : null}
            </InputGroup>
        );
    },
);

export interface PasswordInputProps extends Omit<
    BaseInput.Props,
    'size' | 'type'
> {
    /** Height and text size. @default 'md' */
    size?: InputSize;
    /** Labels of the toggle button, for translation. @default { show: 'Show password', hide: 'Hide password' } */
    toggleLabels?: { show?: string; hide?: string };
    /** Class for the outer group. */
    groupClassName?: string;
}

/**
 * A password field with a show/hide toggle. Works inside `Field` like `Input`.
 *
 * @example
 * <Field>
 *   <FieldLabel>Password</FieldLabel>
 *   <PasswordInput name="password" autoComplete="current-password" required />
 * </Field>
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    function PasswordInput(
        { size, toggleLabels, groupClassName, ...props },
        ref,
    ) {
        const [visible, setVisible] = useState(false);
        return (
            <InputGroup
                size={size}
                className={groupClassName}
                data-slot="password-input"
            >
                <InputGroupInput
                    ref={ref}
                    type={visible ? 'text' : 'password'}
                    {...props}
                />
                <InputGroupAddon variant="icon" className="pe-1.5">
                    <button
                        type="button"
                        aria-label={
                            visible
                                ? (toggleLabels?.hide ?? 'Hide password')
                                : (toggleLabels?.show ?? 'Show password')
                        }
                        aria-pressed={visible}
                        className={iconButton}
                        onClick={() => setVisible((v) => !v)}
                    >
                        {visible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </InputGroupAddon>
            </InputGroup>
        );
    },
);
