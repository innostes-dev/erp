import * as React from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui-components/react/radio-group";
import { Radio as BaseRadio } from "@base-ui-components/react/radio";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof BaseRadioGroup> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  orientation?: "vertical" | "horizontal";
  fieldClassName?: string;
};

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      fieldClassName,
      label,
      hint,
      error,
      required,
      orientation = "vertical",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const groupElement = (
      <BaseRadioGroup
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex gap-3",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap items-center",
          className
        )}
        {...props}
      >
        {children}
      </BaseRadioGroup>
    );

    if (label || hint || error) {
      return (
        <Field
          label={label}
          hint={hint}
          error={error}
          required={required}
          disabled={disabled}
          className={fieldClassName}
        >
          {groupElement}
        </Field>
      );
    }

    return groupElement;
  }
);

RadioGroup.displayName = "RadioGroup";

export type RadioItemProps = React.ComponentPropsWithoutRef<typeof BaseRadio.Root> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  card?: boolean;
};

export const RadioItem = React.forwardRef<HTMLButtonElement, RadioItemProps>(
  ({ className, label, description, card = false, value, disabled, ...props }, ref) => {
    const radioControl = (
      <BaseRadio.Root
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(
          "h-4.5 w-4.5 rounded-full border border-border bg-surface text-primary shadow-2xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary cursor-pointer flex items-center justify-center shrink-0",
          className
        )}
        {...props}
      >
        <BaseRadio.Indicator className="h-2 w-2 rounded-full bg-primary" />
      </BaseRadio.Root>
    );

    if (card) {
      return (
        <label
          className={cn(
            "flex items-start gap-3 p-3.5 rounded-lg border border-border bg-surface hover:bg-background/80 transition-all duration-150 cursor-pointer select-none has-[:checked]:border-primary has-[:checked]:bg-primary-light/30",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <span className="pt-0.5">{radioControl}</span>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-sm font-semibold text-navy leading-tight">{label}</span>
            {description ? (
              <span className="text-xs text-slate font-normal">{description}</span>
            ) : null}
          </div>
        </label>
      );
    }

    return (
      <label
        className={cn(
          "inline-flex items-center gap-2.5 cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        {radioControl}
        <span className="text-sm font-medium text-navy dark:text-slate-200 leading-none">
          {label}
        </span>
      </label>
    );
  }
);

RadioItem.displayName = "RadioItem";
