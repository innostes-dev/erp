'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  toast,
  type DataTableColumn,
} from '@innostes/ui';
import { Download, MoreHorizontal, Search } from 'lucide-react';
import { money, orders, shortDate, statusTone, type Order } from './data';

const columns: DataTableColumn<Order>[] = [
  {
    id: 'id',
    header: 'Order',
    accessor: (o) => o.id,
    sortable: true,
    cell: (o) => <span className="font-medium">{o.id}</span>,
  },
  {
    id: 'customer',
    header: 'Customer',
    accessor: (o) => o.customer,
    sortable: true,
    cell: (o) => (
      <div className="flex flex-col">
        <span>{o.customer}</span>
        <span className="text-xs text-muted-foreground">{o.email}</span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (o) => o.status,
    sortable: true,
    cell: (o) => (
      <Badge variant={statusTone[o.status]} dot>
        {o.status}
      </Badge>
    ),
  },
  {
    id: 'date',
    header: 'Date',
    accessor: (o) => o.date,
    sortable: true,
    cell: (o) => shortDate.format(o.date),
  },
  {
    id: 'total',
    header: 'Total',
    accessor: (o) => o.total,
    sortable: true,
    align: 'end',
    cell: (o) => money.format(o.total),
  },
  {
    id: 'actions',
    header: <span className="sr-only">Actions</span>,
    width: '48px',
    cell: (o) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={`Actions for ${o.id}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toast(`Opened ${o.id}`)}>
            View order
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => toast(`Invoice for ${o.id} downloaded`)}
          >
            Download invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => toast.error(`${o.id} refunded`)}
          >
            Refund
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function DataTableDemo() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? orders.filter((o) =>
          `${o.id} ${o.customer} ${o.email}`.toLowerCase().includes(q),
        )
      : orders;
  }, [query]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            size="sm"
            className="ps-9"
            placeholder="Search orders…"
            aria-label="Search orders"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          startIcon={<Download />}
          disabled={selected.length === 0}
          onClick={() => toast.success(`Exported ${selected.length} orders`)}
        >
          Export{selected.length > 0 && ` (${selected.length})`}
        </Button>
      </div>

      <DataTable
        aria-label="Orders"
        data={rows}
        columns={columns}
        getRowId={(o) => o.id}
        defaultSort={{ columnId: 'date', direction: 'desc' }}
        selectable
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        pageSize={8}
        emptyState={`No orders match “${query}”.`}
      />
    </div>
  );
}
