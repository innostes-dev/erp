import { forwardRef, type ComponentProps } from 'react';
import { cn } from '../../../lib/cn';

export interface TableProps extends ComponentProps<'table'> {
  /** Class for the scroll container around the table. */
  containerClassName?: string;
}

/**
 * Styled native table parts for tabular data. Scrolls horizontally on small screens.
 * Uses real `<table>` markup, so screen readers announce rows and columns.
 *
 * Add `data-state="selected"` to a `TableRow` to highlight it.
 *
 * @example
 * <Table>
 *   <TableCaption>Recent invoices</TableCaption>
 *   <TableHeader>
 *     <TableRow><TableHead>Invoice</TableHead><TableHead className="text-end">Amount</TableHead></TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow><TableCell>INV-001</TableCell><TableCell className="text-end">€250.00</TableCell></TableRow>
 *   </TableBody>
 * </Table>
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { className, containerClassName, ...props },
  ref,
) {
  return (
    <div
      data-slot="table-container"
      tabIndex={0}
      aria-label="Scrollable table container"
      className={cn(
        'relative w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        containerClassName,
      )}
    >
      <table
        ref={ref}
        data-slot="table"
        className={cn(
          'w-full caption-bottom border-collapse text-sm',
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  ComponentProps<'thead'>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      data-slot="table-header"
      className={cn('[&_tr]:border-b [&_tr]:border-border', className)}
      {...props}
    />
  );
});

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  ComponentProps<'tbody'>
>(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
});

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  ComponentProps<'tfoot'>
>(function TableFooter({ className, ...props }, ref) {
  return (
    <tfoot
      ref={ref}
      data-slot="table-footer"
      className={cn(
        'border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  );
});

export const TableRow = forwardRef<HTMLTableRowElement, ComponentProps<'tr'>>(
  function TableRow({ className, ...props }, ref) {
    return (
      <tr
        ref={ref}
        data-slot="table-row"
        className={cn(
          'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
          className,
        )}
        {...props}
      />
    );
  },
);

export const TableHead = forwardRef<HTMLTableCellElement, ComponentProps<'th'>>(
  function TableHead({ className, ...props }, ref) {
    return (
      <th
        ref={ref}
        data-slot="table-head"
        scope="col"
        className={cn(
          'h-10 px-3 text-start align-middle text-xs font-medium whitespace-nowrap text-muted-foreground',
          '[&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pe-0',
          className,
        )}
        {...props}
      />
    );
  },
);

export const TableCell = forwardRef<HTMLTableCellElement, ComponentProps<'td'>>(
  function TableCell({ className, ...props }, ref) {
    return (
      <td
        ref={ref}
        data-slot="table-cell"
        className={cn(
          'px-3 py-2.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0',
          className,
        )}
        {...props}
      />
    );
  },
);

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  ComponentProps<'caption'>
>(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
