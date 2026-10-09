import * as React from "react";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

const switchVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate/30",
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        default: "h-5 w-9",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
        default: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        lg: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type SwitchProps = React.ComponentPropsWithoutRef<typeof BaseSwitch.Root> &
  VariantProps<typeof switchVariants> & {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    labelPosition?: "right" | "left";
    fieldClassName?: string;
  };

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      fieldClassName,
      size = "default",
      label,
      hint,
      error,
      labelPosition = "right",
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const switchControl = (
      <BaseSwitch.Root
        ref={ref}
        disabled={disabled}
        checked={checked}
        className={cn(switchVariants({ size }), className)}
        {...props}
      >
        <BaseSwitch.Thumb className={cn(thumbVariants({ size }))} />
      </BaseSwitch.Root>
    );

    if (label || hint || error) {
      return (
        <Field hint={hint} error={error} disabled={disabled} className={fieldClassName}>
          <label
            className={cn(
              "inline-flex items-center gap-3 cursor-pointer select-none",
              labelPosition === "left" && "flex-row-reverse justify-between w-full"
            )}
          >
            {switchControl}
            <span className="text-sm font-medium text-navy dark:text-slate-200 leading-none">
              {label}
            </span>
          </label>
        </Field>
      );
    }

    return switchControl;
  }
);

Switch.displayName = "Switch";
