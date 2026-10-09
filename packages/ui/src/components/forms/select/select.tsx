import * as React from "react";
import { Select as BaseSelect } from "@base-ui-components/react/select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = Omit<React.ComponentPropsWithoutRef<typeof BaseSelect.Root>, "options"> & {
  options: SelectOption[];
  placeholder?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  size?: "sm" | "default" | "lg";
  fieldClassName?: string;
  className?: string;
};

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      placeholder = "Select an option...",
      label,
      hint,
      error,
      required,
      size = "default",
      disabled,
      fieldClassName,
      className,
      value,
      defaultValue,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const isInvalid = Boolean(error);

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs",
      default: "h-9 px-3 text-sm",
      lg: "h-10 px-3.5 text-base",
    };

    const selectComponent = (
      <BaseSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        <BaseSelect.Trigger
          ref={ref}
          className={cn(
            "w-full rounded-md border border-border bg-surface text-navy placeholder:text-slate/60 text-sm font-normal transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 disabled:bg-background/80 shadow-2xs cursor-pointer flex items-center justify-between gap-2 select-none",
            sizeClasses[size],
            isInvalid && "border-danger focus-visible:ring-danger focus-visible:border-danger text-danger",
            className
          )}
        >
          <BaseSelect.Value>
            {(val: unknown) => {
              if (!val) return <span className="text-slate/60">{placeholder}</span>;
              const found = options.find((o) => o.value === val);
              return found ? found.label : String(val);
            }}
          </BaseSelect.Value>
          <BaseSelect.Icon className="text-slate flex items-center justify-center shrink-0">
            <ChevronDown className="w-4 h-4 opacity-70" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} className="z-50 min-w-[var(--anchor-width)]">
            <BaseSelect.Popup className="w-full max-h-60 overflow-auto rounded-md border border-border bg-surface p-1 shadow-md animate-in fade-in-80 zoom-in-95 duration-100">
              {options.map((opt) => (
                <BaseSelect.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="relative flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-sm font-medium text-navy hover:bg-primary-light/50 hover:text-primary focus:bg-primary-light/50 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-40 cursor-pointer select-none outline-none transition-colors"
                >
                  <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-primary flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
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
          {selectComponent}
        </Field>
      );
    }

    return selectComponent;
  }
);

Select.displayName = "Select";
