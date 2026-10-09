import * as React from "react";
import { Button as BaseButton } from "@base-ui-components/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-xs",
        primary: "bg-primary text-primary-foreground hover:bg-primary-dark shadow-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-2xs border border-border",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        outline: "border border-border bg-surface text-navy hover:bg-background hover:text-primary shadow-2xs",
        ghost: "text-navy hover:bg-background hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = React.ComponentPropsWithoutRef<typeof BaseButton> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <BaseButton
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon ? rightIcon : null}
      </BaseButton>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
