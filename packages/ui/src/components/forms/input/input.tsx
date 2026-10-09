import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

const inputVariants = cva(
  "w-full rounded-md border border-border bg-surface text-navy placeholder:text-slate/60 text-sm font-normal transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 disabled:bg-background/80 shadow-2xs",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-xs",
        default: "h-9 px-3 text-sm",
        lg: "h-10 px-3.5 text-base",
      },
      hasLeftIcon: {
        true: "",
      },
      hasRightIcon: {
        true: "",
      },
      isInvalid: {
        true: "border-danger focus-visible:ring-danger focus-visible:border-danger text-danger",
      },
    },
    compoundVariants: [
      { size: "sm", hasLeftIcon: true, className: "pl-8" },
      { size: "default", hasLeftIcon: true, className: "pl-9" },
      { size: "lg", hasLeftIcon: true, className: "pl-10" },
      { size: "sm", hasRightIcon: true, className: "pr-8" },
      { size: "default", hasRightIcon: true, className: "pr-9" },
      { size: "lg", hasRightIcon: true, className: "pr-10" },
    ],
    defaultVariants: {
      size: "default",
    },
  }
);

export type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    label?: React.ReactNode;
    hint?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    prefixText?: string;
    suffixText?: string;
    clearable?: boolean;
    onClear?: () => void;
    fieldClassName?: string;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      fieldClassName,
      size = "default",
      type = "text",
      label,
      hint,
      error,
      required,
      leftIcon,
      rightIcon,
      prefixText,
      suffixText,
      clearable,
      onClear,
      value,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const isInvalid = Boolean(error);
    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    const inputElement = (
      <div className="relative flex items-center w-full">
        {prefixText ? (
          <span className="absolute left-3 text-xs font-medium text-slate select-none pointer-events-none">
            {prefixText}
          </span>
        ) : leftIcon ? (
          <span className="absolute left-3 text-slate select-none pointer-events-none flex items-center justify-center [&_svg]:size-4">
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          type={type}
          value={value}
          disabled={disabled}
          onChange={onChange}
          className={cn(
            inputVariants({
              size,
              hasLeftIcon: Boolean(leftIcon || prefixText),
              hasRightIcon: Boolean(rightIcon || suffixText || (clearable && hasValue)),
              isInvalid,
            }),
            className
          )}
          {...props}
        />

        {clearable && hasValue && !disabled ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 text-slate hover:text-navy cursor-pointer transition-colors p-0.5 rounded-sm focus:outline-none"
            aria-label="Clear input"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : suffixText ? (
          <span className="absolute right-3 text-xs font-medium text-slate select-none pointer-events-none">
            {suffixText}
          </span>
        ) : rightIcon ? (
          <span className="absolute right-3 text-slate select-none pointer-events-none flex items-center justify-center [&_svg]:size-4">
            {rightIcon}
          </span>
        ) : null}
      </div>
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
          {inputElement}
        </Field>
      );
    }

    return inputElement;
  }
);

Input.displayName = "Input";
