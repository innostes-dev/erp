import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

/**
 * A bordered surface that groups related content, e.g. a settings section or a KPI.
 * Compose with `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`
 * and `CardFooter`.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Team members</CardTitle>
 *     <CardDescription>Invite people to collaborate.</CardDescription>
 *     <CardAction><Button size="sm">Invite</Button></CardAction>
 *   </CardHeader>
 *   <CardContent>…</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          'flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground shadow-xs',
          className,
        )}
        {...props}
      />
    );
  },
);

/** Top section with title, description and an optional `CardAction` aligned to the end. */
export const CardHeader = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn(
          'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6',
          'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * The card heading. Renders a `<div>` so it fits any page outline; put an `<h2>`/`<h3>` inside
 * when the card title should be part of the document's heading structure.
 */
export const CardTitle = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-title"
        className={cn('leading-none font-semibold', className)}
        {...props}
      />
    );
  },
);

/** Secondary text under the title. */
export const CardDescription = forwardRef<
  HTMLDivElement,
  ComponentProps<'div'>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});

/** Actions placed at the top-end of the header, e.g. a menu or button. */
export const CardAction = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function CardAction({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-action"
        className={cn(
          'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
          className,
        )}
        {...props}
      />
    );
  },
);

/** The main content area. */
export const CardContent = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn('px-6', className)}
        {...props}
      />
    );
  },
);

/** Bottom section, usually for actions. */
export const CardFooter = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn('flex items-center gap-2 px-6', className)}
        {...props}
      />
    );
  },
);
