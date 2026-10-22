'use client';

import { forwardRef } from 'react';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { ChevronDownIcon } from '../../../lib/icons';

/**
 * Stacked sections that expand and collapse, e.g. FAQs or grouped settings.
 * One section opens at a time by default; set `multiple` to allow several.
 *
 * @example
 * <Accordion defaultValue={['billing']}>
 *   <AccordionItem value="billing">
 *     <AccordionTrigger>Billing</AccordionTrigger>
 *     <AccordionPanel>…</AccordionPanel>
 *   </AccordionItem>
 * </Accordion>
 */
export const Accordion = forwardRef<HTMLDivElement, BaseAccordion.Root.Props>(
  function Accordion({ className, ...props }, ref) {
    return (
      <BaseAccordion.Root
        ref={ref}
        data-slot="accordion"
        className={mergeClassName('flex w-full flex-col', className)}
        {...props}
      />
    );
  },
);

/** One section. `value` identifies it in the accordion's `value` array. */
export const AccordionItem = forwardRef<
  HTMLDivElement,
  BaseAccordion.Item.Props
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <BaseAccordion.Item
      ref={ref}
      data-slot="accordion-item"
      className={mergeClassName(
        'border-b border-border last:border-b-0',
        className,
      )}
      {...props}
    />
  );
});

/** The clickable heading. Rendered inside an `<h3>`. */
export const AccordionTrigger = forwardRef<
  HTMLElement,
  BaseAccordion.Trigger.Props
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <BaseAccordion.Header className="flex">
      <BaseAccordion.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={mergeClassName(
          cn(
            'group flex flex-1 cursor-pointer items-center justify-between gap-4 py-4 text-start text-sm font-medium transition-colors outline-none',
            'hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'data-disabled:pointer-events-none data-disabled:opacity-50',
          ),
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
});

/** The collapsible content. Animates its height. */
export const AccordionPanel = forwardRef<
  HTMLDivElement,
  BaseAccordion.Panel.Props
>(function AccordionPanel({ className, children, ...props }, ref) {
  return (
    <BaseAccordion.Panel
      ref={ref}
      data-slot="accordion-panel"
      className={mergeClassName(
        'h-(--accordion-panel-height) overflow-hidden text-sm transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0',
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </BaseAccordion.Panel>
  );
});
