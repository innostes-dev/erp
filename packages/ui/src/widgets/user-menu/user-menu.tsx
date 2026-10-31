'use client';

import { forwardRef, type ReactNode } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cn } from '../../lib/cn';
import { ChevronDownIcon } from '../../lib/icons';
import { popupSurface } from '../../lib/styles';
import type { SlotClassNames } from '../../lib/slots';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/data-display/avatar/avatar';

export type UserMenuSlot =
  'trigger' | 'avatar' | 'name' | 'subtitle' | 'content' | 'header';

export interface UserMenuProps {
  /** The user's name. */
  name: string;
  /** Second line in the trigger, e.g. the organisation ("Acme Corp") or role. */
  subtitle?: ReactNode;
  /** Shown in the menu header, e.g. the email address. */
  email?: ReactNode;
  /** Avatar image URL. */
  avatarSrc?: string;
  /** Initials when there's no image. @default from `name` */
  initials?: string;
  /**
   * Show name and subtitle next to the avatar (hidden below `sm` either way).
   * @default true
   */
  showDetails?: boolean;
  /** Menu items: use `DropdownMenuItem`, `DropdownMenuSeparator`, etc. */
  children?: ReactNode;
  /** Popup alignment against the trigger. @default 'end' */
  align?: 'start' | 'center' | 'end';
  /** Classes for inner parts. */
  classNames?: SlotClassNames<UserMenuSlot>;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

/**
 * The signed-in user's avatar and name, opening a menu (profile, settings, sign out). For the
 * top bar or the sidebar footer. Items are regular `DropdownMenu*` components.
 *
 * @example
 * <UserMenu name="Arun Kumar" subtitle="Acme Corp" email="arun@acme.com" avatarSrc={user.photo}>
 *   <DropdownMenuItem>Profile</DropdownMenuItem>
 *   <DropdownMenuItem>Settings</DropdownMenuItem>
 *   <DropdownMenuSeparator />
 *   <DropdownMenuItem variant="destructive" onClick={signOut}>Sign out</DropdownMenuItem>
 * </UserMenu>
 */
export const UserMenu = forwardRef<HTMLButtonElement, UserMenuProps>(
  function UserMenu(
    {
      name,
      subtitle,
      email,
      avatarSrc,
      initials,
      showDetails = true,
      children,
      align = 'end',
      classNames,
    },
    ref,
  ) {
    const avatar = (
      <Avatar size="sm" aria-hidden="true" className={classNames?.avatar}>
        {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
        <AvatarFallback>{initials ?? initialsOf(name)}</AvatarFallback>
      </Avatar>
    );

    return (
      <BaseMenu.Root>
        <BaseMenu.Trigger
          ref={ref}
          data-slot="user-menu-trigger"
          className={cn(
            'inline-flex max-w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-lg p-1 text-start transition-colors outline-none',
            'hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-accent',
            showDetails && 'sm:pe-2',
            classNames?.trigger,
          )}
        >
          {avatar}
          {showDetails ? (
            <span className="flex min-w-0 flex-col max-sm:sr-only">
              <span
                data-slot="user-menu-name"
                className={cn(
                  'truncate text-sm leading-tight font-semibold',
                  classNames?.name,
                )}
              >
                {name}
              </span>
              {subtitle && (
                <span
                  aria-hidden="true"
                  data-slot="user-menu-subtitle"
                  className={cn(
                    'truncate text-xs leading-tight text-muted-foreground',
                    classNames?.subtitle,
                  )}
                >
                  {subtitle}
                </span>
              )}
            </span>
          ) : (
            <span className="sr-only">{name ?? 'Account menu'}</span>
          )}
          {showDetails && (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground max-sm:hidden" />
          )}
        </BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner
            className="z-50 outline-none"
            align={align}
            sideOffset={6}
          >
            <BaseMenu.Popup
              data-slot="user-menu-content"
              className={cn(
                popupSurface,
                'w-[min(16rem,calc(100vw-1rem))] p-1',
                classNames?.content,
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-3 px-2 py-2',
                  classNames?.header,
                )}
              >
                {avatar}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">{name}</span>
                  {email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  )}
                </span>
              </div>
              {children && (
                <div
                  role="presentation"
                  className="-mx-1 my-1 h-px bg-border"
                />
              )}
              {children}
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>
    );
  },
);
