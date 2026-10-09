import * as React from "react";
import { cn } from "../../../lib/utils.js";
import { Field } from "../field/field.js";

export type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
  fieldClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      fieldClassName,
      label,
      hint,
      error,
      required,
      maxLength,
      showCount = false,
      value,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const isInvalid = Boolean(error);
    const charCount = value !== undefined && value !== null ? String(value).length : 0;

    const textareaElement = (
      <div className="relative w-full">
        <textarea
          ref={ref}
          value={value}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-md border border-border bg-surface p-3 text-sm text-navy placeholder:text-slate/60 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 disabled:bg-background/80 shadow-2xs resize-y min-h-[80px]",
            isInvalid && "border-danger focus-visible:ring-danger focus-visible:border-danger text-danger",
            className
          )}
          {...props}
        />
        {showCount && maxLength ? (
          <span className="text-[11px] font-mono text-slate/80 text-right block mt-1">
            {charCount}/{maxLength}
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
          {textareaElement}
        </Field>
      );
    }

    return textareaElement;
  }
);

Textarea.displayName = "Textarea";
