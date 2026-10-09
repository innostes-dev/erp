import * as React from "react";
import { Button, type ButtonProps } from "../button/button.js";
import { cn } from "../../../lib/utils.js";

export type IconButtonProps = Omit<ButtonProps, "children" | "leftIcon" | "rightIcon"> & {
  icon: React.ReactNode;
  "aria-label": string;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = "icon", variant = "outline", "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        aria-label={ariaLabel}
        className={cn("shrink-0", className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
