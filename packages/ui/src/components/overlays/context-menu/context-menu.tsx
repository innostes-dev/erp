'use client';

import { forwardRef } from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { popupSurface } from '../../../lib/styles';

/**
 * A menu opened by right-click (or long-press on touch) on an area, e.g. a file or a row.
 * Items are the same as `DropdownMenu`'s; they're re-exported with `ContextMenu*` names.
 * Make sure every action is also reachable without a right-click.
 *
 * @example
 * <ContextMenu>
 *   <ContextMenuTrigger className="rounded-md border p-8">Right-click here</ContextMenuTrigger>
 *   <ContextMenuContent>
 *     <ContextMenuItem>Open</ContextMenuItem>
 *     <ContextMenuItem>Rename</ContextMenuItem>
 *     <ContextMenuSeparator />
 *     <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
 *   </ContextMenuContent>
 * </ContextMenu>
 */
export const ContextMenu = BaseContextMenu.Root;
export type ContextMenuProps = BaseContextMenu.Root.Props;

/** The area that opens the menu on right-click. */
export const ContextMenuTrigger = forwardRef<
    HTMLDivElement,
    BaseContextMenu.Trigger.Props
>(function ContextMenuTrigger(props, ref) {
    return (
        <BaseContextMenu.Trigger
            ref={ref}
            data-slot="context-menu-trigger"
            {...props}
        />
    );
});

/** The floating list of items, placed at the pointer. Rendered in a portal. */
export const ContextMenuContent = forwardRef<
    HTMLDivElement,
    BaseContextMenu.Popup.Props
>(function ContextMenuContent({ className, ...props }, ref) {
    return (
        <BaseContextMenu.Portal>
            <BaseContextMenu.Positioner className="z-50 outline-none">
                <BaseContextMenu.Popup
                    ref={ref}
                    data-slot="context-menu-content"
                    className={mergeClassName(
                        cn(
                            popupSurface,
                            'max-h-(--available-height) min-w-44 overflow-y-auto p-1',
                        ),
                        className,
                    )}
                    {...props}
                />
            </BaseContextMenu.Positioner>
        </BaseContextMenu.Portal>
    );
});

export {
    DropdownMenuItem as ContextMenuItem,
    DropdownMenuLinkItem as ContextMenuLinkItem,
    DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
    DropdownMenuRadioGroup as ContextMenuRadioGroup,
    DropdownMenuRadioItem as ContextMenuRadioItem,
    DropdownMenuGroup as ContextMenuGroup,
    DropdownMenuGroupLabel as ContextMenuGroupLabel,
    DropdownMenuSeparator as ContextMenuSeparator,
    DropdownMenuShortcut as ContextMenuShortcut,
    DropdownMenuSub as ContextMenuSub,
    DropdownMenuSubTrigger as ContextMenuSubTrigger,
} from '../dropdown-menu/dropdown-menu';
