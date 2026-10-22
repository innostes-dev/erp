import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface FormGridProps extends ComponentProps<'div'> {
  /**
   * Columns on wide containers. Collapses to one column on narrow ones (container query, so
   * it adapts to the space it's in, e.g. inside a sheet or a dialog).
   * @default 2
   */
  columns?: 1 | 2 | 3 | 4;
}

const columnClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @lg:grid-cols-2',
  3: 'grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3',
  4: 'grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-4',
} as const;

/**
 * A responsive grid for form fields. Make a field span the full row with
 * `className="col-span-full"`.
 *
 * @example
 * <FormGrid>
 *   <Field>…Organization name…</Field>
 *   <Field>…Slug…</Field>
 *   <Field className="col-span-full">…Address…</Field>
 * </FormGrid>
 */
export const FormGrid = forwardRef<HTMLDivElement, FormGridProps>(
  function FormGrid({ className, columns = 2, children, ...props }, ref) {
    return (
      <div ref={ref} data-slot="form-grid" className="@container" {...props}>
        <div
          className={cn(
            'grid gap-x-6 gap-y-5',
            columnClass[columns],
            className,
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

export interface FormSectionProps extends Omit<
  ComponentProps<'section'>,
  'title'
> {
  /** Section heading. */
  title: ReactNode;
  /** Explains what the section is for. */
  description?: ReactNode;
  /**
   * `aside` puts the title on the left and fields on the right (settings pages);
   * `stacked` puts the title above (wizards, dialogs).
   * @default 'stacked'
   */
  layout?: 'stacked' | 'aside';
  /** Heading level for the title, to fit the page outline. @default 3 */
  headingLevel?: 2 | 3 | 4;
}

/**
 * A titled group of fields. Use several on a settings page, separated by `Separator`.
 *
 * @example
 * <FormSection layout="aside" title="Regional settings" description="Used for dates, numbers and reports.">
 *   <FormGrid>…</FormGrid>
 * </FormSection>
 */
export const FormSection = forwardRef<HTMLElement, FormSectionProps>(
  function FormSection(
    {
      className,
      title,
      description,
      layout = 'stacked',
      headingLevel = 3,
      children,
      ...props
    },
    ref,
  ) {
    const Heading = `h${headingLevel}` as 'h3';
    return (
      <section
        ref={ref}
        data-slot="form-section"
        data-layout={layout}
        className={cn('@container', className)}
        {...props}
      >
        <div
          className={cn(
            'grid gap-5',
            layout === 'aside' &&
              '@3xl:grid-cols-[minmax(0,18rem)_1fr] @3xl:gap-10',
          )}
        >
          <div className="flex flex-col gap-1">
            <Heading className="text-base font-semibold text-foreground">
              {title}
            </Heading>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    );
  },
);

export interface FormActionsProps extends ComponentProps<'div'> {
  /**
   * `between` puts the first child at the start and the rest at the end (Cancel … Back / Next);
   * `end` aligns everything to the end.
   * @default 'end'
   */
  align?: 'end' | 'between';
  /** Draw a divider above the actions. @default true */
  bordered?: boolean;
  /** Keep the actions visible at the bottom of a scrolling page. */
  sticky?: boolean;
}

/**
 * The action row at the end of a form or wizard step. Primary action last.
 *
 * @example
 * <FormActions align="between">
 *   <Button variant="outline">Cancel</Button>
 *   <Button type="submit" endIcon={<ArrowRightIcon />}>Next</Button>
 * </FormActions>
 */
export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  function FormActions(
    { className, align = 'end', bordered = true, sticky = false, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="form-actions"
        className={cn(
          'flex flex-wrap items-center gap-2 pt-6',
          align === 'end'
            ? 'justify-end'
            : 'justify-end [&>:first-child]:me-auto',
          bordered && 'border-t border-border',
          sticky && 'sticky bottom-0 z-10 bg-background pb-4',
          className,
        )}
        {...props}
      />
    );
  },
);
