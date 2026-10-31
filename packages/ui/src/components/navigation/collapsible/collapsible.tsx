'use client';

import { forwardRef } from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { mergeClassName } from '../../../lib/merge-class-name';

/**
 * Shows and hides one section of content, e.g. "Advanced options" in a form.
 * Unstyled except for the height animation, so it fits anywhere.
 *
 * @example
 * <Collapsible>
 *   <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>Advanced options</CollapsibleTrigger>
 *   <CollapsiblePanel>…</CollapsiblePanel>
 * </Collapsible>
 */
export const Collapsible = forwardRef<
    HTMLDivElement,
    BaseCollapsible.Root.Props
>(function Collapsible(props, ref) {
    return <BaseCollapsible.Root ref={ref} data-slot="collapsible" {...props} />;
});

/** Toggles the panel. Gets `data-panel-open` while open, for styling (e.g. rotating an icon). */
export const CollapsibleTrigger = forwardRef<
    HTMLButtonElement,
    BaseCollapsible.Trigger.Props
>(function CollapsibleTrigger(props, ref) {
    return (
        <BaseCollapsible.Trigger
            ref={ref}
            data-slot="collapsible-trigger"
            {...props}
        />
    );
});

/** The content that shows and hides. Animates its height. */
export const CollapsiblePanel = forwardRef<
    HTMLDivElement,
    BaseCollapsible.Panel.Props
>(function CollapsiblePanel({ className, ...props }, ref) {
    return (
        <BaseCollapsible.Panel
            ref={ref}
            data-slot="collapsible-panel"
            className={mergeClassName(
                'h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0',
                className,
            )}
            {...props}
        />
    );
});
