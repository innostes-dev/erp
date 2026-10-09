import * as React from "react";
import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import { cn } from "../../../lib/utils.js";

export const DropdownMenu = BaseMenu.Root;
export const DropdownMenuTrigger = BaseMenu.Trigger;

export type DropdownMenuContentProps = React.ComponentPropsWithoutRef<typeof BaseMenu.Popup> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  className?: string;
};

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 4, align = "start", ...props }, ref) => (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={sideOffset} align={align} className="z-50">
        <BaseMenu.Popup
          ref={ref}
          className={cn(
            "min-w-[180px] overflow-hidden rounded-md border border-border bg-surface p-1 shadow-md text-navy animate-in fade-in-80 zoom-in-95 duration-100",
            className
          )}
          {...props}
        />
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
);

DropdownMenuContent.displayName = "DropdownMenuContent";

export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<typeof BaseMenu.Item> & {
  destructive?: boolean;
  leftIcon?: React.ReactNode;
  rightShortcut?: string;
};

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, destructive = false, leftIcon, rightShortcut, children, ...props }, ref) => (
    <BaseMenu.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2.5 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-background focus:bg-background disabled:pointer-events-none disabled:opacity-40",
        destructive && "text-danger hover:bg-danger/10 focus:bg-danger/10",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {leftIcon ? <span className="[&_svg]:size-4 text-slate">{leftIcon}</span> : null}
        {children}
      </span>
      {rightShortcut ? (
        <span className="text-[11px] font-mono text-slate/70 tracking-widest">{rightShortcut}</span>
      ) : null}
    </BaseMenu.Item>
  )
);

DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
));

DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2.5 py-1 text-xs font-semibold text-slate uppercase tracking-wider", className)}
    {...props}
  />
));

DropdownMenuLabel.displayName = "DropdownMenuLabel";
