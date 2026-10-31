'use client';

import { forwardRef } from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from '../../../lib/icons';
import {
    listGroupLabel,
    listItem,
    listSeparator,
    popupSurface,
} from '../../../lib/styles';
import { inputVariants, type InputSize } from '../input/input-variants';

/**
 * A text input with a filterable list of options: type to search, arrows to move, Enter to
 * pick. Use it instead of `Select` when the list is long (countries, customers, SKUs).
 *
 * Pass the options as `items`; `ComboboxList` then renders the filtered items through its
 * render-function child. Use `multiple` to select several values.
 *
 * @example
 * const fruits = ['Apple', 'Banana', 'Cherry'];
 *
 * <Combobox items={fruits}>
 *   <ComboboxInput placeholder="Search fruit…" aria-label="Fruit" />
 *   <ComboboxContent>
 *     <ComboboxEmpty>No fruit found.</ComboboxEmpty>
 *     <ComboboxList>
 *       {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
 *     </ComboboxList>
 *   </ComboboxContent>
 * </Combobox>
 */
export const Combobox = BaseCombobox.Root;

export interface ComboboxInputProps extends Omit<
    BaseCombobox.Input.Props,
    'size'
> {
    /**
     * Height and text size, matching `Input`.
     * @default 'md'
     */
    size?: InputSize;
    /**
     * Show a button that clears the value.
     * @default true
     */
    showClear?: boolean;
    /**
     * Show a button that opens the list.
     * @default true
     */
    showTrigger?: boolean;
    /**
     * Accessible label for the clear button.
     * @default 'Clear'
     */
    clearLabel?: string;
    /**
     * Accessible label for the open button.
     * @default 'Open'
     */
    openLabel?: string;
}

/** The text input, with optional clear and open buttons. */
export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
    function ComboboxInput(
        {
            className,
            size,
            showClear = true,
            showTrigger = true,
            clearLabel = 'Clear',
            openLabel = 'Open',
            ...props
        },
        ref,
    ) {
        return (
            <BaseCombobox.InputGroup
                data-slot="combobox-input-group"
                className="relative flex w-full items-center"
            >
                <BaseCombobox.Input
                    ref={ref}
                    data-slot="combobox-input"
                    className={mergeClassName(
                        cn(
                            inputVariants({ size }),
                            showClear && showTrigger ? 'pe-16' : 'pe-9',
                        ),
                        className,
                    )}
                    {...props}
                />
                <div className="absolute end-1 flex items-center gap-0.5">
                    {showClear && (
                        <BaseCombobox.Clear
                            aria-label={clearLabel}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            <XIcon className="size-4" />
                        </BaseCombobox.Clear>
                    )}
                    {showTrigger && (
                        <BaseCombobox.Trigger
                            aria-label={openLabel}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            <ChevronsUpDownIcon className="size-4" />
                        </BaseCombobox.Trigger>
                    )}
                </div>
            </BaseCombobox.InputGroup>
        );
    },
);

export interface ComboboxContentProps extends BaseCombobox.Popup.Props {
    /** Gap between the input and the list, in px. @default 4 */
    sideOffset?: number;
    /** Alignment against the input. @default 'start' */
    align?: BaseCombobox.Positioner.Props['align'];
}

/** The floating list container. Rendered in a portal, at least as wide as the input. */
export const ComboboxContent = forwardRef<HTMLDivElement, ComboboxContentProps>(
    function ComboboxContent(
        { className, sideOffset = 4, align = 'start', ...props },
        ref,
    ) {
        return (
            <BaseCombobox.Portal>
                <BaseCombobox.Positioner
                    className="z-50 outline-none"
                    sideOffset={sideOffset}
                    align={align}
                >
                    <BaseCombobox.Popup
                        ref={ref}
                        data-slot="combobox-content"
                        className={mergeClassName(
                            cn(
                                popupSurface,
                                'max-h-[min(var(--available-height),24rem)] w-(--anchor-width) overflow-y-auto p-1',
                            ),
                            className,
                        )}
                        {...props}
                    />
                </BaseCombobox.Positioner>
            </BaseCombobox.Portal>
        );
    },
);

/** Renders the (filtered) items. Pass a function `(item) => <ComboboxItem …/>` as child. */
export const ComboboxList = forwardRef<HTMLDivElement, BaseCombobox.List.Props>(
    function ComboboxList({ className, ...props }, ref) {
        return (
            <BaseCombobox.List
                ref={ref}
                data-slot="combobox-list"
                className={mergeClassName('outline-none data-empty:p-0', className)}
                {...props}
            />
        );
    },
);

/** One option. */
export const ComboboxItem = forwardRef<HTMLDivElement, BaseCombobox.Item.Props>(
    function ComboboxItem({ className, children, ...props }, ref) {
        return (
            <BaseCombobox.Item
                ref={ref}
                data-slot="combobox-item"
                className={mergeClassName(
                    cn(listItem, 'cursor-pointer pe-8'),
                    className,
                )}
                {...props}
            >
                {children}
                <BaseCombobox.ItemIndicator className="absolute end-2 flex items-center">
                    <CheckIcon className="size-4" />
                </BaseCombobox.ItemIndicator>
            </BaseCombobox.Item>
        );
    },
);

/** Shown when the filter matches nothing. */
export const ComboboxEmpty = forwardRef<
    HTMLDivElement,
    BaseCombobox.Empty.Props
>(function ComboboxEmpty({ className, ...props }, ref) {
    return (
        <BaseCombobox.Empty
            ref={ref}
            data-slot="combobox-empty"
            className={mergeClassName(
                'px-2 py-6 text-center text-sm text-muted-foreground empty:hidden',
                className,
            )}
            {...props}
        />
    );
});

/** Groups related options under a `ComboboxGroupLabel`. */
export const ComboboxGroup = forwardRef<
    HTMLDivElement,
    BaseCombobox.Group.Props
>(function ComboboxGroup(props, ref) {
    return <BaseCombobox.Group ref={ref} data-slot="combobox-group" {...props} />;
});

/** Heading for a `ComboboxGroup`. */
export const ComboboxGroupLabel = forwardRef<
    HTMLDivElement,
    BaseCombobox.GroupLabel.Props
>(function ComboboxGroupLabel({ className, ...props }, ref) {
    return (
        <BaseCombobox.GroupLabel
            ref={ref}
            data-slot="combobox-group-label"
            className={mergeClassName(listGroupLabel, className)}
            {...props}
        />
    );
});

/** A divider between groups. */
export const ComboboxSeparator = forwardRef<
    HTMLDivElement,
    BaseCombobox.Separator.Props
>(function ComboboxSeparator({ className, ...props }, ref) {
    return (
        <BaseCombobox.Separator
            ref={ref}
            data-slot="combobox-separator"
            className={mergeClassName(listSeparator, className)}
            {...props}
        />
    );
});
