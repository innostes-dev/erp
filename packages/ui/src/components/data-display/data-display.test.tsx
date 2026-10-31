import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar, AvatarFallback, AvatarGroup } from '@innostes/ui';
import { Badge } from '@innostes/ui';
import { Card, CardContent, CardTitle } from '@innostes/ui';
import { DataTable, type DataTableColumn } from '@innostes/ui';
import { EmptyState } from '@innostes/ui';
import { Stat } from '@innostes/ui';

interface Order {
    id: string;
    customer: string;
    total: number;
}

const orders: Order[] = [
    { id: '1', customer: 'Charlie', total: 30 },
    { id: '2', customer: 'alice', total: 120 },
    { id: '3', customer: 'Bob', total: 75 },
];

const columns: DataTableColumn<Order>[] = [
    {
        id: 'customer',
        header: 'Customer',
        accessor: (o) => o.customer,
        sortable: true,
    },
    {
        id: 'total',
        header: 'Total',
        accessor: (o) => o.total,
        sortable: true,
        align: 'end',
    },
];

function customerCells() {
    return screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell').at(-2)?.textContent);
}

describe('DataTable', () => {
    it('sorts by a column and exposes aria-sort', async () => {
        render(
            <DataTable
                aria-label="Orders"
                data={orders}
                columns={columns}
                getRowId={(o) => o.id}
            />,
        );
        expect(screen.getByRole('table', { name: 'Orders' })).toBeInTheDocument();

        const header = screen.getByRole('columnheader', { name: /Customer/ });
        expect(header).toHaveAttribute('aria-sort', 'none');

        await userEvent.click(screen.getByRole('button', { name: /Customer/ }));
        expect(header).toHaveAttribute('aria-sort', 'ascending');
        expect(customerCells()).toEqual(['alice', 'Bob', 'Charlie']);

        await userEvent.click(screen.getByRole('button', { name: /Customer/ }));
        expect(header).toHaveAttribute('aria-sort', 'descending');
        expect(customerCells()).toEqual(['Charlie', 'Bob', 'alice']);
    });

    it('selects all rows on the page', async () => {
        const onSelectedIdsChange = vi.fn();
        render(
            <DataTable
                aria-label="Orders"
                data={orders}
                columns={columns}
                getRowId={(o) => o.id}
                selectable
                onSelectedIdsChange={onSelectedIdsChange}
            />,
        );
        await userEvent.click(
            screen.getByRole('checkbox', { name: 'Select all rows on this page' }),
        );
        expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['1', '2', '3']);
        expect(screen.getByText('3 selected')).toBeInTheDocument();
    });

    it('paginates client-side', async () => {
        render(
            <DataTable
                aria-label="Orders"
                data={orders}
                columns={columns}
                getRowId={(o) => o.id}
                pageSize={2}
            />,
        );
        expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2
        expect(screen.getByText('Showing 1–2 of 3')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getByText('Showing 3–3 of 3')).toBeInTheDocument();
    });

    it('shows the empty state and loading rows', () => {
        const { rerender } = render(
            <DataTable
                aria-label="Orders"
                data={[]}
                columns={columns}
                getRowId={(o: Order) => o.id}
                emptyState="No orders"
            />,
        );
        expect(screen.getByText('No orders')).toBeInTheDocument();
        rerender(
            <DataTable
                aria-label="Orders"
                data={[]}
                columns={columns}
                getRowId={(o: Order) => o.id}
                loading
            />,
        );
        expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    });
});

describe('Badge', () => {
    it('renders with its variant', () => {
        render(<Badge variant="success">Paid</Badge>);
        expect(screen.getByText('Paid')).toHaveAttribute('data-variant', 'success');
    });
});

describe('Avatar', () => {
    it('shows the fallback without an image', () => {
        render(
            <Avatar>
                <AvatarFallback>AL</AvatarFallback>
            </Avatar>,
        );
        expect(screen.getByText('AL')).toBeInTheDocument();
    });

    it('limits a group and shows the overflow count', () => {
        render(
            <AvatarGroup max={2}>
                <Avatar>
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <Avatar>
                    <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <Avatar>
                    <AvatarFallback>C</AvatarFallback>
                </Avatar>
            </AvatarGroup>,
        );
        expect(screen.queryByText('C')).toBeNull();
        expect(screen.getByLabelText('1 more')).toHaveTextContent('+1');
    });
});

describe('Card, EmptyState and Stat', () => {
    it('renders card slots', () => {
        render(
            <Card>
                <CardTitle>Team</CardTitle>
                <CardContent>Body</CardContent>
            </Card>,
        );
        expect(screen.getByText('Team')).toHaveAttribute('data-slot', 'card-title');
    });

    it('renders an empty state with a heading and actions', () => {
        render(
            <EmptyState
                title="No invoices"
                description="Create one"
                actions={<button>New</button>}
            />,
        );
        expect(
            screen.getByRole('heading', { name: 'No invoices' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    });

    it('colours a rising metric red when up is bad', () => {
        render(<Stat label="Churn" value="2.1%" delta="+0.4%" upIsGood={false} />);
        expect(screen.getByText('+0.4%').className).toContain('text-red-700');
    });
});
