'use client';

import { forwardRef, type ComponentProps } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { XIcon } from '../../../lib/icons';
import { backdrop } from '../../../lib/styles';

/**
 * A modal window over the page, e.g. a create/edit form. Traps focus, closes on Escape and
 * outside click, and returns focus to the trigger. Open state is uncontrolled by default;
 * control it with `open` / `onOpenChange`.
 *
 * Always include a `DialogTitle` so screen readers announce the dialog.
 *
 * @example
 * <Dialog>
 *   <DialogTrigger render={<Button />}>Edit profile</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Edit profile</DialogTitle>
 *       <DialogDescription>Changes are visible to your team.</DialogDescription>
 *     </DialogHeader>
 *     …form…
 *     <DialogFooter>
 *       <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
 *       <Button type="submit">Save</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 */
export const Dialog = BaseDialog.Root;
export type DialogProps = BaseDialog.Root.Props;

/** The element that opens the dialog. Use `render={<Button />}` to render our Button. */
export const DialogTrigger = forwardRef<
  HTMLButtonElement,
  BaseDialog.Trigger.Props
>(function DialogTrigger(props, ref) {
  return <BaseDialog.Trigger ref={ref} data-slot="dialog-trigger" {...props} />;
});

/** Closes the dialog. Use `render={<Button variant="outline" />}` for a styled button. */
export const DialogClose = forwardRef<
  HTMLButtonElement,
  BaseDialog.Close.Props
>(function DialogClose(props, ref) {
  return <BaseDialog.Close ref={ref} data-slot="dialog-close" {...props} />;
});

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] h-[calc(100dvh-2rem)]',
} as const;

export interface DialogContentProps extends BaseDialog.Popup.Props {
  /**
   * Maximum width: `sm` 384px, `md` 512px, `lg` 672px, `xl` 896px, `full` the viewport.
   * @default 'md'
   */
  size?: keyof typeof sizeClass;
  /**
   * Show the × button in the top corner.
   * @default true
   */
  showCloseButton?: boolean;
}

/** The dialog panel. Rendered in a portal over a dimmed backdrop. */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { className, size = 'md', showCloseButton = true, children, ...props },
    ref,
  ) {
    return (
      <BaseDialog.Portal>
        <BaseDialog.Backdrop data-slot="dialog-backdrop" className={backdrop} />
        <BaseDialog.Popup
          ref={ref}
          data-slot="dialog-content"
          className={mergeClassName(
            cn(
              'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto',
              'rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none',
              'transition-[opacity,scale] duration-200 ease-out',
              'data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
              'data-nested-dialog-open:scale-[0.98] data-nested-dialog-open:opacity-80',
              sizeClass[size],
            ),
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton && (
            <BaseDialog.Close
              aria-label="Close"
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

/** Wraps the title and description. */
export const DialogHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function DialogHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-header"
        className={cn('flex flex-col gap-1.5 pe-8 text-start', className)}
        {...props}
      />
    );
  },
);

/** Action row at the bottom. Stacks on small screens, primary action last. */
export const DialogFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function DialogFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="dialog-footer"
        className={cn(
          'mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
          className,
        )}
        {...props}
      />
    );
  },
);

/** The dialog heading. Required for accessibility. */
export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  BaseDialog.Title.Props
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <BaseDialog.Title
      ref={ref}
      data-slot="dialog-title"
      className={mergeClassName(
        'text-lg leading-tight font-semibold',
        className,
      )}
      {...props}
    />
  );
});

/** Supporting text, announced with the title. */
export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  BaseDialog.Description.Props
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <BaseDialog.Description
      ref={ref}
      data-slot="dialog-description"
      className={mergeClassName('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
