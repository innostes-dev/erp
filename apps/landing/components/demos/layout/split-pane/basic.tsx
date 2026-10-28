'use client';

import { useState } from 'react';
import { Badge, SplitPane } from '@innostes/ui';

const orders = [
  { id: 'SO-1042', customer: 'Acme Traders', total: '₹1,24,500', status: 'Pending' },
  { id: 'SO-1041', customer: 'Northwind Foods', total: '₹48,200', status: 'Shipped' },
  { id: 'SO-1040', customer: 'Globex Retail', total: '₹3,10,000', status: 'Delivered' },
  { id: 'SO-1039', customer: 'Initech Pvt Ltd', total: '₹72,900', status: 'Pending' },
];

export default function SplitPaneDemo() {
  const [active, setActive] = useState(orders[0]!);
  return (
    <SplitPane defaultSize={40} minSize={25} maxSize={70} className="h-80 w-full rounded-lg border">
      <ul className="flex flex-col p-2">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setActive(o)}
              className="flex w-full flex-col items-start rounded-md px-3 py-2 text-start text-sm hover:bg-accent data-[active]:bg-primary/10"
              data-active={o.id === active.id ? '' : undefined}
            >
              <span className="font-medium">{o.id}</span>
              <span className="text-xs text-muted-foreground">{o.customer}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{active.id}</h3>
          <Badge variant={active.status === 'Pending' ? 'warning' : 'success'}>{active.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{active.customer}</p>
        <p className="text-2xl font-bold tabular-nums">{active.total}</p>
      </div>
    </SplitPane>
  );
}
