'use client';

import { Children, type ComponentProps, forwardRef } from 'react';
import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/cn';
import { mergeClassName } from '../../../lib/merge-class-name';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted align-middle font-medium text-muted-foreground select-none',
  {
    variants: {
      /** Diameter: 24, 32, 40 and 56px. */
      size: {
        xs: 'size-6 text-[10px]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-14 text-base',
      },
      /** `square` suits companies and products; `circle` suits people. */
      shape: { circle: 'rounded-full', square: 'rounded-md' },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  },
);

export interface AvatarProps
  extends BaseAvatar.Root.Props, VariantProps<typeof avatarVariants> {}

/**
 * A user or entity image with a fallback (usually initials) while it loads or if it fails.
 *
 * @example
 * <Avatar>
 *   <AvatarImage src={user.photoUrl} alt="" />
 *   <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
 * </Avatar>
 */
export const Avatar = forwardRef<HTMLElement, AvatarProps>(function Avatar(
  { className, size, shape, ...props },
  ref,
) {
  return (
    <BaseAvatar.Root
      ref={ref}
      data-slot="avatar"
      className={mergeClassName(avatarVariants({ size, shape }), className)}
      {...props}
    />
  );
});

/** The image. Hidden until it has loaded. Use `alt=""` when a name is shown next to it. */
export const AvatarImage = forwardRef<HTMLImageElement, BaseAvatar.Image.Props>(
  function AvatarImage({ className, ...props }, ref) {
    return (
      <BaseAvatar.Image
        ref={ref}
        data-slot="avatar-image"
        className={mergeClassName('size-full object-cover', className)}
        {...props}
      />
    );
  },
);

/** Shown while the image loads or when it fails. `delay` (ms) avoids a flash on fast loads. */
export const AvatarFallback = forwardRef<
  HTMLElement,
  BaseAvatar.Fallback.Props
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <BaseAvatar.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={mergeClassName(
        'flex size-full items-center justify-center uppercase',
        className,
      )}
      {...props}
    />
  );
});

export interface AvatarGroupProps extends ComponentProps<'div'> {
  /** Show at most this many children, then a "+N" counter. */
  max?: number;
}

/**
 * Overlapping stack of avatars, e.g. the assignees of a task.
 *
 * @example
 * <AvatarGroup max={3}>{users.map((u) => <Avatar key={u.id}>…</Avatar>)}</AvatarGroup>
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  function AvatarGroup({ className, max, children, ...props }, ref) {
    const items = Children.toArray(children);
    const visible = max !== undefined ? items.slice(0, max) : items;
    const hidden = items.length - visible.length;

    return (
      <div
        ref={ref}
        data-slot="avatar-group"
        className={cn(
          'flex items-center -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
          className,
        )}
        {...props}
      >
        {visible}
        {hidden > 0 && (
          <span
            data-slot="avatar"
            className={cn(
              avatarVariants({ size: 'md' }),
              'text-xs ring-2 ring-background',
            )}
            aria-label={`${hidden} more`}
          >
            +{hidden}
          </span>
        )}
      </div>
    );
  },
);
