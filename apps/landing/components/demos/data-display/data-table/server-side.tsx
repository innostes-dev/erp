'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  DataTable,
  type DataTableColumn,
  type SortState,
} from '@innostes/ui';
import { money, orders, shortDate, statusTone, type Order } from './data';

const columns: DataTableColumn<Order>[] = [
  {
    id: 'id',
    header: 'Purchase order',
    accessor: (o) => o.id,
    sortable: true,
    cell: (o) => <span className="font-mono font-medium">{o.id}</span>,
  },
  {
    id: 'customer',
    header: 'Customer',
    accessor: (o) => o.customer,
    sortable: true,
    cell: (o) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{o.customer}</span>
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
    header: 'Order date',
    accessor: (o) => o.date,
    sortable: true,
    cell: (o) => shortDate.format(o.date),
  },
  {
    id: 'total',
    header: 'Invoice value',
    accessor: (o) => o.total,
    sortable: true,
    align: 'end',
    cell: (o) => <span className="font-mono">{money.format(o.total)}</span>,
  },
];

export default function DataTableServerSideDemo() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState | null>({
    columnId: 'date',
    direction: 'desc',
  });
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 5;
  const totalCount = orders.length;

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      if (!active) return;

      const sorted = [...orders].sort((a, b) => {
        if (!sort) return 0;
        const key = sort.columnId as keyof Order;
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      const start = (page - 1) * pageSize;
      const paginated = sorted.slice(start, start + pageSize);

      setData(paginated);
      setLoading(false);
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [page, sort]);

  return (
    <div className="w-full">
      <DataTable
        aria-label="Server-side purchase orders"
        data={data}
        columns={columns}
        getRowId={(o) => o.id}
        loading={loading}
        pageSize={pageSize}
        page={page}
        onPageChange={setPage}
        manualPagination
        totalCount={totalCount}
        sort={sort}
        onSortChange={setSort}
        manualSorting
      />
    </div>
  );
}
