'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { CheckIcon, ChevronRightIcon, DotIcon } from '../../../lib/icons';
import {
    listGroupLabel,
    listItem,
    listSeparator,
    popupSurface,
} from '../../../lib/styles';

/**
 * A list of actions opened from a button, e.g. the "⋯" menu on a table row.
 * Supports keyboard navigation, type-ahead, checkbox and radio items, and submenus.
 *
 * @example
 * <DropdownMenu>
 *   <DropdownMenuTrigger render={<Button variant="ghost" iconOnly aria-label="Row actions" />}>
 *     <MoreHorizontalIcon />
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent align="end">
 *     <DropdownMenuItem onClick={edit}>Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
 *     <DropdownMenuItem onClick={duplicate}>Duplicate</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem variant="destructive" onClick={remove}>Delete</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 */
export const DropdownMenu = BaseMenu.Root;
export type DropdownMenuProps = BaseMenu.Root.Props;

/** The element that opens the menu. */
export const DropdownMenuTrigger = forwardRef<
    HTMLButtonElement,
    BaseMenu.Trigger.Props
>(function DropdownMenuTrigger(props, ref) {
    return (
        <BaseMenu.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props} />
    );
});

export interface DropdownMenuContentProps extends BaseMenu.Popup.Props {
    /** Side of the trigger to open on. @default 'bottom' */
    side?: BaseMenu.Positioner.Props['side'];
    /** Alignment against the trigger. @default 'start' */
    align?: BaseMenu.Positioner.Props['align'];
    /** Gap from the trigger, in px. @default 4 */
    sideOffset?: number;
}

/** The floating list of items. Rendered in a portal. */
export const DropdownMenuContent = forwardRef<
    HTMLDivElement,
    DropdownMenuContentProps
>(function DropdownMenuContent(
    { className, side = 'bottom', align = 'start', sideOffset = 4, ...props },
    ref,
) {
    return (
        <BaseMenu.Portal>
            <BaseMenu.Positioner
                className="z-50 outline-none"
                side={side}
                align={align}
                sideOffset={sideOffset}
            >
                <BaseMenu.Popup
                    ref={ref}
                    data-slot="dropdown-menu-content"
                    className={mergeClassName(
                        cn(
                            popupSurface,
                            'max-h-(--available-height) min-w-44 overflow-y-auto p-1',
                        ),
                        className,
                    )}
                    {...props}
                />
            </BaseMenu.Positioner>
        </BaseMenu.Portal>
    );
});

export interface DropdownMenuItemProps extends BaseMenu.Item.Props {
    /** `destructive` colours the item for dangerous actions. @default 'default' */
    variant?: 'default' | 'destructive';
    /** Indent to align with items that have an icon or indicator. */
    inset?: boolean;
}

/** An action. Closes the menu when clicked (unless `closeOnClick={false}`). */
export const DropdownMenuItem = forwardRef<HTMLElement, DropdownMenuItemProps>(
    function DropdownMenuItem(
        { className, variant = 'default', inset, ...props },
        ref,
    ) {
        return (
            <BaseMenu.Item
                ref={ref}
                data-slot="dropdown-menu-item"
                data-variant={variant}
                className={mergeClassName(
                    cn(
                        listItem,
                        'cursor-pointer',
                        inset && 'ps-8',
                        variant === 'destructive' &&
                        'text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive [&_svg]:text-destructive',
                    ),
                    className,
                )}
                {...props}
            />
        );
    },
);

/** A navigation item rendered as a link. */
export const DropdownMenuLinkItem = forwardRef<
    HTMLElement,
    BaseMenu.LinkItem.Props
>(function DropdownMenuLinkItem({ className, ...props }, ref) {
    return (
        <BaseMenu.LinkItem
            ref={ref}
            data-slot="dropdown-menu-link-item"
            className={mergeClassName(cn(listItem, 'cursor-pointer'), className)}
            {...props}
        />
    );
});

/** An item that toggles on and off. */
export const DropdownMenuCheckboxItem = forwardRef<
    HTMLElement,
    BaseMenu.CheckboxItem.Props
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
    return (
        <BaseMenu.CheckboxItem
            ref={ref}
            data-slot="dropdown-menu-checkbox-item"
            className={mergeClassName(cn(listItem, 'cursor-pointer ps-8'), className)}
            {...props}
        >
            <span className="absolute start-2 flex size-4 items-center justify-center">
                <BaseMenu.CheckboxItemIndicator>
                    <CheckIcon className="size-4" />
                </BaseMenu.CheckboxItemIndicator>
            </span>
            {children}
        </BaseMenu.CheckboxItem>
    );
});

/** Groups `DropdownMenuRadioItem`s so exactly one is selected. */
export const DropdownMenuRadioGroup = forwardRef<
    HTMLDivElement,
    BaseMenu.RadioGroup.Props
>(function DropdownMenuRadioGroup(props, ref) {
    return (
        <BaseMenu.RadioGroup
            ref={ref}
            data-slot="dropdown-menu-radio-group"
            {...props}
        />
    );
});

/** One option in a `DropdownMenuRadioGroup`. */
export const DropdownMenuRadioItem = forwardRef<
    HTMLElement,
    BaseMenu.RadioItem.Props
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
    return (
        <BaseMenu.RadioItem
            ref={ref}
            data-slot="dropdown-menu-radio-item"
            className={mergeClassName(cn(listItem, 'cursor-pointer ps-8'), className)}
            {...props}
        >
            <span className="absolute start-2 flex size-4 items-center justify-center">
                <BaseMenu.RadioItemIndicator>
                    <DotIcon className="size-4" />
                </BaseMenu.RadioItemIndicator>
            </span>
            {children}
        </BaseMenu.RadioItem>
    );
});

export const DropdownMenuGroup = forwardRef<
    HTMLDivElement,
    BaseMenu.Group.Props
>(function DropdownMenuGroup(props, ref) {
    return (
        <BaseMenu.Group ref={ref} data-slot="dropdown-menu-group" {...props} />
    );
});

export const DropdownMenuGroupLabel = forwardRef<
    HTMLDivElement,
    BaseMenu.GroupLabel.Props
>(function DropdownMenuGroupLabel({ className, ...props }, ref) {
    return (
        <BaseMenu.GroupLabel
            ref={ref}
            data-slot="dropdown-menu-group-label"
            className={mergeClassName(listGroupLabel, className)}
            {...props}
        />
    );
});

export const DropdownMenuSeparator = forwardRef<
    HTMLDivElement,
    BaseSeparator.Props
>(function DropdownMenuSeparator({ className, ...props }, ref) {
    return (
        <BaseSeparator
            ref={ref}
            data-slot="dropdown-menu-separator"
            className={mergeClassName(listSeparator, className)}
            {...props}
        />
    );
});

/** A keyboard shortcut hint at the end of an item. Visual only; bind the keys yourself. */
export const DropdownMenuShortcut = forwardRef<
    HTMLSpanElement,
    ComponentProps<'span'>
>(function DropdownMenuShortcut({ className, ...props }, ref) {
    return (
        <span
            ref={ref}
            data-slot="dropdown-menu-shortcut"
            className={cn(
                'ms-auto ps-4 text-xs tracking-widest text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
});

/** Wraps a nested menu: a `DropdownMenuSubTrigger` and a `DropdownMenuContent`. */
export const DropdownMenuSub = BaseMenu.SubmenuRoot;

/** The item that opens a submenu. */
export const DropdownMenuSubTrigger = forwardRef<
    HTMLElement,
    BaseMenu.SubmenuTrigger.Props
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
    return (
        <BaseMenu.SubmenuTrigger
            ref={ref}
            data-slot="dropdown-menu-sub-trigger"
            className={mergeClassName(
                cn(listItem, 'cursor-pointer data-popup-open:bg-accent'),
                className,
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ms-auto size-4 rtl:rotate-180" />
        </BaseMenu.SubmenuTrigger>
    );
});
