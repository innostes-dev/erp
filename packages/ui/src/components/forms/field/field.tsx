import * as React from "react";
import { Field as BaseField } from "@base-ui-components/react/field";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../lib/utils.js";

const labelVariants = cva(
  "text-xs font-semibold text-navy dark:text-slate-200 select-none flex items-center justify-between gap-1",
  {
    variants: {
      disabled: {
        true: "opacity-50 cursor-not-allowed",
      },
    },
  }
);

export type FieldProps = React.ComponentPropsWithoutRef<typeof BaseField.Root> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  optionalText?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      label,
      hint,
      error,
      required,
      optionalText,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <BaseField.Root
        ref={ref}
        disabled={disabled}
        invalid={Boolean(error)}
        className={cn("flex flex-col gap-1.5 w-full text-left", className)}
        {...props}
      >
        {label ? (
          <BaseField.Label className={cn(labelVariants({ disabled }))}>
            <span className="flex items-center gap-1">
              {label}
              {required ? (
                <span className="text-danger font-bold" aria-hidden="true">
                  *
                </span>
              ) : optionalText ? (
                <span className="text-slate font-normal text-[11px]">
                  ({optionalText})
                </span>
              ) : null}
            </span>
          </BaseField.Label>
        ) : null}

        {children}

        {error ? (
          <BaseField.Error className="text-xs text-danger font-medium flex items-center gap-1 mt-0.5 animate-in fade-in-50 duration-150">
            {error}
          </BaseField.Error>
        ) : hint ? (
          <BaseField.Description className="text-xs text-slate font-normal mt-0.5">
            {hint}
          </BaseField.Description>
        ) : null}
      </BaseField.Root>
    );
  }
);

Field.displayName = "Field";
