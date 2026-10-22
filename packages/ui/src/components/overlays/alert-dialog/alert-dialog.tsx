'use client';

import { forwardRef, type ComponentProps } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';
import { backdrop } from '../../../lib/styles';

/**
 * A dialog that asks the user to confirm an important action, e.g. deleting a record.
 * Unlike `Dialog`, it does not close on outside click; the user must choose an action.
 *
 * @example
 * <AlertDialog>
 *   <AlertDialogTrigger render={<Button variant="destructive" />}>Delete</AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Delete 3 invoices?</AlertDialogTitle>
 *       <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogClose render={<Button variant="outline" />}>Cancel</AlertDialogClose>
 *       <AlertDialogClose render={<Button variant="destructive" />} onClick={remove}>Delete</AlertDialogClose>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 */
export const AlertDialog = BaseAlertDialog.Root;
export type AlertDialogProps = BaseAlertDialog.Root.Props;

/** The element that opens the alert dialog. */
export const AlertDialogTrigger = forwardRef<
  HTMLButtonElement,
  BaseAlertDialog.Trigger.Props
>(function AlertDialogTrigger(props, ref) {
  return (
    <BaseAlertDialog.Trigger
      ref={ref}
      data-slot="alert-dialog-trigger"
      {...props}
    />
  );
});

/** Closes the alert dialog. Use it for both Cancel and the confirming action. */
export const AlertDialogClose = forwardRef<
  HTMLButtonElement,
  BaseAlertDialog.Close.Props
>(function AlertDialogClose(props, ref) {
  return (
    <BaseAlertDialog.Close
      ref={ref}
      data-slot="alert-dialog-close"
      {...props}
    />
  );
});

/** The alert dialog panel. Rendered in a portal over a dimmed backdrop. */
export const AlertDialogContent = forwardRef<
  HTMLDivElement,
  BaseAlertDialog.Popup.Props
>(function AlertDialogContent({ className, ...props }, ref) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop
        data-slot="alert-dialog-backdrop"
        className={backdrop}
      />
      <BaseAlertDialog.Popup
        ref={ref}
        data-slot="alert-dialog-content"
        className={mergeClassName(
          cn(
            'fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4',
            'rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl outline-none',
            'transition-[opacity,scale] duration-200 ease-out',
            'data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
          ),
          className,
        )}
        {...props}
      />
    </BaseAlertDialog.Portal>
  );
});

export const AlertDialogHeader = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function AlertDialogHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
});

export const AlertDialogFooter = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function AlertDialogFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="alert-dialog-footer"
      className={cn(
        'mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
});

/** The question being asked. Required for accessibility. */
export const AlertDialogTitle = forwardRef<
  HTMLHeadingElement,
  BaseAlertDialog.Title.Props
>(function AlertDialogTitle({ className, ...props }, ref) {
  return (
    <BaseAlertDialog.Title
      ref={ref}
      data-slot="alert-dialog-title"
      className={mergeClassName(
        'text-lg leading-tight font-semibold',
        className,
      )}
      {...props}
    />
  );
});

/** The consequences of the action. */
export const AlertDialogDescription = forwardRef<
  HTMLParagraphElement,
  BaseAlertDialog.Description.Props
>(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <BaseAlertDialog.Description
      ref={ref}
      data-slot="alert-dialog-description"
      className={mergeClassName('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
