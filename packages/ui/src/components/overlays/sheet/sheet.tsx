'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { XIcon } from '../../../lib/icons';
import { backdrop } from '../../../lib/styles';

/**
 * A panel that slides in from a screen edge, e.g. a record's detail or an edit form next
 * to a table. Behaves like `Dialog` (focus trap, Escape, outside click).
 *
 * @example
 * <Sheet>
 *   <SheetTrigger render={<Button variant="outline" />}>Filters</SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Filters</SheetTitle>
 *       <SheetDescription>Narrow down the orders list.</SheetDescription>
 *     </SheetHeader>
 *     <SheetBody>…</SheetBody>
 *     <SheetFooter><Button>Apply</Button></SheetFooter>
 *   </SheetContent>
 * </Sheet>
 */
export const Sheet = BaseDialog.Root;
export type SheetProps = BaseDialog.Root.Props;

export const SheetTrigger = forwardRef<
  HTMLButtonElement,
  BaseDialog.Trigger.Props
>(function SheetTrigger(props, ref) {
  return <BaseDialog.Trigger ref={ref} data-slot="sheet-trigger" {...props} />;
});

export const SheetClose = forwardRef<HTMLButtonElement, BaseDialog.Close.Props>(
  function SheetClose(props, ref) {
    return <BaseDialog.Close ref={ref} data-slot="sheet-close" {...props} />;
  },
);

const sideClass = {
  right:
    'inset-y-0 end-0 h-full w-[min(28rem,100vw)] border-s data-starting-style:translate-x-full data-ending-style:translate-x-full rtl:data-starting-style:-translate-x-full rtl:data-ending-style:-translate-x-full',
  end:
    'inset-y-0 end-0 h-full w-[min(28rem,100vw)] border-s data-starting-style:translate-x-full data-ending-style:translate-x-full rtl:data-starting-style:-translate-x-full rtl:data-ending-style:-translate-x-full',
  left: 'inset-y-0 start-0 h-full w-[min(28rem,100vw)] border-e data-starting-style:-translate-x-full data-ending-style:-translate-x-full rtl:data-starting-style:translate-x-full rtl:data-ending-style:translate-x-full',
  start: 'inset-y-0 start-0 h-full w-[min(28rem,100vw)] border-e data-starting-style:-translate-x-full data-ending-style:-translate-x-full rtl:data-starting-style:translate-x-full rtl:data-ending-style:translate-x-full',
  top: 'inset-x-0 top-0 max-h-[85dvh] border-b data-starting-style:-translate-y-full data-ending-style:-translate-y-full',
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] border-t data-starting-style:translate-y-full data-ending-style:translate-y-full',
} as const;

export interface SheetContentProps extends BaseDialog.Popup.Props {
  /**
   * Edge the panel slides in from. `right`/`left` or logical `start`/`end` follow the text direction in RTL.
   * @default 'right'
   */
  side?: keyof typeof sideClass;
  /**
   * Show the × button in the top corner.
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Accessible label for the close button.
   * @default 'Close'
   */
  closeLabel?: string;
}

/** The sliding panel. Rendered in a portal over a dimmed backdrop. */
export const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  function SheetContent(
    {
      className,
      side = 'right',
      showCloseButton = true,
      closeLabel = 'Close',
      children,
      ...props
    },
    ref,
  ) {
    return (
      <BaseDialog.Portal>
        <BaseDialog.Backdrop data-slot="sheet-backdrop" className={backdrop} />
        <BaseDialog.Popup
          ref={ref}
          data-slot="sheet-content"
          data-side={side}
          className={mergeClassName(
            cn(
              'fixed z-50 flex flex-col border-border bg-popover text-popover-foreground shadow-xl outline-none',
              'transition-transform duration-300 ease-out',
              sideClass[side],
            ),
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <BaseDialog.Close
              aria-label={closeLabel}
              className="absolute end-4 top-4 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <XIcon className="size-4" />
            </BaseDialog.Close>
          )}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    );
  },
);

export const SheetHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SheetHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sheet-header"
        className={cn(
          'flex flex-col gap-1.5 border-b border-border p-6 pe-12',
          className,
        )}
        {...props}
      />
    );
  },
);

/** Scrollable main area between header and footer. */
export const SheetBody = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SheetBody({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sheet-body"
        className={cn('flex-1 overflow-y-auto p-6', className)}
        {...props}
      />
    );
  },
);

export const SheetFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function SheetFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="sheet-footer"
        className={cn(
          'flex flex-col-reverse gap-2 border-t border-border p-6 sm:flex-row sm:justify-end',
          className,
        )}
        {...props}
      />
    );
  },
);

export const SheetTitle = forwardRef<
  HTMLHeadingElement,
  BaseDialog.Title.Props
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <BaseDialog.Title
      ref={ref}
      data-slot="sheet-title"
      className={mergeClassName(
        'text-lg leading-tight font-semibold',
        className,
      )}
      {...props}
    />
  );
});

export const SheetDescription = forwardRef<
  HTMLParagraphElement,
  BaseDialog.Description.Props
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <BaseDialog.Description
      ref={ref}
      data-slot="sheet-description"
      className={mergeClassName('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
