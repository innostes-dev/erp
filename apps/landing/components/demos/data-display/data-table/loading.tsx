'use client';

import { useState } from 'react';
import { Button, DataTable, type DataTableColumn } from '@innostes/ui';
import { RefreshCw } from 'lucide-react';
import { money, orders, type Order } from './data';

const columns: DataTableColumn<Order>[] = [
  { id: 'id', header: 'Order', accessor: (o) => o.id },
  { id: 'customer', header: 'Customer', accessor: (o) => o.customer },
  {
    id: 'total',
    header: 'Total',
    accessor: (o) => o.total,
    align: 'end',
    cell: (o) => money.format(o.total),
  },
];

export default function DataTableLoadingDemo() {
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  function reload() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          startIcon={<RefreshCw />}
          onClick={reload}
          loading={loading}
        >
          Reload
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEmpty((v) => !v)}>
          {empty ? 'Show data' : 'Show empty state'}
        </Button>
      </div>
      <DataTable
        aria-label="Orders"
        data={empty ? [] : orders.slice(0, 4)}
        columns={columns}
        getRowId={(o) => o.id}
        loading={loading}
        loadingRowCount={4}
        emptyState="No orders yet. New orders will appear here."
      />
    </div>
  );
}
