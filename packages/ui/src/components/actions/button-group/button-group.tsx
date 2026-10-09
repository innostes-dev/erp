import * as React from "react";
import { cn } from "../../../lib/utils.js";

export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
};

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          "inline-flex rounded-md shadow-2xs",
          orientation === "horizontal"
            ? "flex-row [&>button:not(:first-child)]:rounded-l-none [&>button:not(:last-child)]:rounded-r-none [&>button:not(:first-child)]:-ml-px"
            : "flex-col [&>button:not(:first-child)]:rounded-t-none [&>button:not(:last-child)]:rounded-b-none [&>button:not(:first-child)]:-mt-px",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";
