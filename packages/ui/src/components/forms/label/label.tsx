import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

/** Shared label typography, used by `Label`, `FieldLabel` and `FieldsetLegend`. @internal */
export const labelClassName =
  'inline-flex items-center gap-1.5 text-sm leading-none font-medium text-foreground select-none ' +
  'peer-disabled:cursor-not-allowed peer-disabled:opacity-60 data-disabled:opacity-60';

export interface LabelProps extends ComponentProps<'label'> {
  /** Append a required marker. Purely visual; set `required` on the control too. */
  required?: boolean;
}

/**
 * A standalone `<label>`. Inside a `Field`, prefer `FieldLabel`, which is linked to the
 * control automatically.
 *
 * @example
 * <Label htmlFor="name">Name</Label>
 * <input id="name" />
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      data-slot="label"
      className={cn(labelClassName, className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      )}
    </label>
  );
});
