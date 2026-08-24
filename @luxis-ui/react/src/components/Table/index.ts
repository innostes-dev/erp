/**
 * @module Table
 *
 * A lightweight, composable, accessible table component suite for the LXS UI
 * design system. Focused on layout and presentation — not a DataGrid.
 *
 * ## Quick-start (declarative API)
 *
 * ```tsx
 * import {
 *   Table, TableContainer, TableHead, TableBody, TableFooter,
 *   TableRow, TableCell, TableHeaderCell, TableCaption,
 *   TableEmptyState, TablePagination,
 * } from '@luxis-ui/table';
 *
 * function Demo() {
 *   return (
 *     <TableContainer>
 *       <Table variant="striped" size="md" stickyHeader hoverable>
 *         <TableCaption>Monthly sales report</TableCaption>
 *         <TableHead>
 *           <TableRow>
 *             <TableHeaderCell sortable sortDirection="asc" onSort={handleSort}>
 *               Name
 *             </TableHeaderCell>
 *             <TableHeaderCell align="right" numeric>Amount</TableHeaderCell>
 *           </TableRow>
 *         </TableHead>
 *         <TableBody>
 *           {rows.map((row) => (
 *             <TableRow key={row.id} clickable onClick={() => navigate(row.id)}>
 *               <TableCell>{row.name}</TableCell>
 *               <TableCell numeric>{row.amount}</TableCell>
 *             </TableRow>
 *           ))}
 *           {rows.length === 0 && (
 *             <TableEmptyState colSpan={2} message="No records found" />
 *           )}
 *         </TableBody>
 *       </Table>
 *     </TableContainer>
 *   );
 * }
 * ```
 */

// CSS — must be imported once by the consuming app or via this barrel
import './styles.css';

// Components
export { Table } from './Table';
export { TableContainer } from './TableContainer';
export { TableHead } from './TableHead';
export { TableBody } from './TableBody';
export { TableFooter } from './TableFooter';
export { TableRow } from './TableRow';
export { TableCell } from './TableCell';
export { TableHeaderCell } from './TableHeaderCell';
export { TableCaption } from './TableCaption';
export { TableEmptyState } from './TableEmptyState';
export { TablePagination } from './TablePagination';

// Context / hook (for custom sub-components that need table config)
export { TableContext, useTableContext, TableContextProvider } from './context';

// Types
export type {
  TableVariant,
  TableSize,
  TableCellAlign,
  SortDirection,
  TableOwnProps,
  TableProps,
  TableContainerOwnProps,
  TableContainerProps,
  TableSectionOwnProps,
  TableHeadProps,
  TableBodyProps,
  TableFooterProps,
  TableRowOwnProps,
  TableRowProps,
  TableCellOwnProps,
  TableCellProps,
  TableHeaderCellOwnProps,
  TableHeaderCellProps,
  TableCaptionOwnProps,
  TableCaptionProps,
  TableEmptyStateOwnProps,
  TableEmptyStateProps,
  TablePaginationProps,
  TableContextValue,
} from './types';

// Default exports for convenience
export { default as TableDefault } from './Table';
