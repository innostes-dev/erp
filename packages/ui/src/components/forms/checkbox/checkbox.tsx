import * as React from "react";
import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  indeterminate?: boolean;
  fieldClassName?: string;
};

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      fieldClassName,
      label,
      hint,
      error,
      indeterminate = false,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const isInvalid = Boolean(error);

    const checkboxControl = (
      <BaseCheckbox.Root
        ref={ref}
        disabled={disabled}
        checked={checked}
        indeterminate={indeterminate}
        className={cn(
          "peer h-4.5 w-4.5 shrink-0 rounded border border-border bg-surface shadow-2xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-primary-foreground cursor-pointer flex items-center justify-center",
          isInvalid && "border-danger focus-visible:ring-danger",
          className
        )}
        {...props}
      >
        <BaseCheckbox.Indicator className="flex items-center justify-center text-current">
          {indeterminate ? (
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          )}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    );

    if (label || hint || error) {
      return (
        <Field hint={hint} error={error} disabled={disabled} className={fieldClassName}>
          <label className="inline-flex items-start gap-2.5 cursor-pointer select-none">
            <span className="pt-0.5">{checkboxControl}</span>
            <span className="text-sm font-medium text-navy dark:text-slate-200 leading-tight">
              {label}
            </span>
          </label>
        </Field>
      );
    }

    return checkboxControl;
  }
);

Checkbox.displayName = "Checkbox";
