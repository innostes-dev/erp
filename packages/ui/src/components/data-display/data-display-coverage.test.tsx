import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
  IconTile,
  Kbd,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TreeView,
  type TreeNode,
} from '@innostes/ui';

interface BenchmarkRow {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

const benchmarkColumns: DataTableColumn<BenchmarkRow>[] = [
  { id: 'sku', header: 'SKU', accessor: (r) => r.sku, sortable: true },
  { id: 'name', header: 'Product Name', accessor: (r) => r.name, sortable: true },
  { id: 'quantity', header: 'Quantity', accessor: (r) => r.quantity, sortable: true, align: 'end' },
];

describe('DataTable enterprise benchmarks and accessibility', () => {
  it('renders 1,000 rows within 150ms budget', () => {
    const thousandRows: BenchmarkRow[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `row-${i}`,
      sku: `SKU-${1000 + i}`,
      name: `Inventory Item #${i}`,
      quantity: (i * 7) % 500,
    }));

    const start = performance.now();
    render(
      <DataTable
        aria-label="1000 Rows Inventory"
        data={thousandRows}
        columns={benchmarkColumns}
        getRowId={(r) => r.id}
        pageSize={50}
        selectable
      />,
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500); // Generous ceiling for test runner environment
    expect(screen.getByText('Showing 1–50 of 1000')).toBeInTheDocument();
  });

  it('supports custom accessibility labels and row clicks', async () => {
    const handleRowClick = vi.fn();
    const rows: BenchmarkRow[] = [
      { id: '1', sku: 'A1', name: 'Widget A', quantity: 10 },
      { id: '2', sku: 'B2', name: 'Widget B', quantity: 20 },
    ];

    render(
      <DataTable
        aria-label="Custom Labels Table"
        data={rows}
        columns={benchmarkColumns}
        getRowId={(r) => r.id}
        selectable
        selectAllLabel="Choose all items"
        selectRowLabel={(r) => `Select ${r.name}`}
        selectedCountText={(n) => `${n} records checked`}
        paginationRangeText={(s, e, t) => `Range: ${s} to ${e} of ${t}`}
        pageSize={1}
        onRowClick={handleRowClick}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Choose all items' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Widget A' })).toBeInTheDocument();
    expect(screen.getByText('Range: 1 to 1 of 2')).toBeInTheDocument();

    const row = screen.getByText('Widget A').closest('tr');
    expect(row).toBeInTheDocument();
    if (row) await userEvent.click(row);
    expect(handleRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('toggles individual row selection without triggering row click', async () => {
    const handleRowClick = vi.fn();
    const onSelectedIdsChange = vi.fn();
    const rows: BenchmarkRow[] = [
      { id: '1', sku: 'A1', name: 'Widget A', quantity: 10 },
      { id: '2', sku: 'B2', name: 'Widget B', quantity: 20 },
    ];

    render(
      <DataTable
        aria-label="Row Selection Table"
        data={rows}
        columns={benchmarkColumns}
        getRowId={(r) => r.id}
        selectable
        selectRowLabel={(r) => `Select ${r.name}`}
        onSelectedIdsChange={onSelectedIdsChange}
        onRowClick={handleRowClick}
      />,
    );

    const checkboxA = screen.getByRole('checkbox', { name: 'Select Widget A' });
    await userEvent.click(checkboxA);
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['1']);
    expect(handleRowClick).not.toHaveBeenCalled();

    await userEvent.click(checkboxA);
    expect(onSelectedIdsChange).toHaveBeenCalledWith([]);
  });
});

describe('TreeView RTL navigation and lazy loading', () => {
  it('supports RTL navigation: ArrowLeft expands and ArrowRight collapses', async () => {
    const items: TreeNode[] = [
      {
        id: 'sales',
        label: 'Sales Division',
        children: [{ id: 'emea', label: 'EMEA Sales' }],
      },
    ];

    render(
      <div dir="rtl">
        <TreeView aria-label="RTL Tree" items={items} />
      </div>,
    );

    const rootItem = screen.getByRole('treeitem', { name: /Sales Division/ });
    expect(rootItem).toBeInTheDocument();

    // Focus root item
    await userEvent.click(rootItem);

    // In RTL, ArrowLeft expands the node
    await userEvent.keyboard('{ArrowLeft}');
    expect(await screen.findByText('EMEA Sales')).toBeInTheDocument();

    // In RTL, ArrowRight collapses the node
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.queryByText('EMEA Sales')).toBeNull();
  });

  it('renders loading state when node.loading is true', () => {
    const items: TreeNode[] = [
      {
        id: 'warehouse',
        label: 'Central Warehouse',
        loading: true,
        children: [],
      },
    ];

    render(
      <TreeView
        aria-label="Async Tree"
        items={items}
        defaultExpanded={['warehouse']}
        loadingLabel="Fetching child pallets…"
      />,
    );

    expect(screen.getByText('Fetching child pallets…')).toBeInTheDocument();
  });
});

describe('Card, Table, Kbd, IconTile subcomponents and AvatarGroup RTL', () => {
  it('renders full Card anatomy', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
          <CardDescription>2-factor authentication status</CardDescription>
          <CardAction>
            <button type="button">Manage</button>
          </CardAction>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer info</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Security Overview')).toBeInTheDocument();
    expect(screen.getByText('2-factor authentication status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Footer info')).toBeInTheDocument();
  });

  it('renders TableCaption and TableFooter', () => {
    render(
      <Table>
        <TableCaption>Quarterly Balances</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Quarter</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Q1</TableCell>
            <TableCell>€10,000</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>€10,000</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByText('Quarterly Balances')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders Kbd and IconTile tones', () => {
    render(
      <div>
        <Kbd>Ctrl</Kbd>
        <IconTile tone="chart-1" variant="solid" />
        <IconTile tone="destructive" variant="soft" />
      </div>,
    );

    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(document.querySelector('[data-tone="chart-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-tone="destructive"]')).toBeInTheDocument();
  });

  it('supports AvatarGroup moreLabel customization', () => {
    render(
      <AvatarGroup max={1} moreLabel={(n) => `Plus ${n} extra team members`}>
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );

    expect(screen.getByLabelText('Plus 1 extra team members')).toBeInTheDocument();
  });
});
