'use client';

import { Avatar, AvatarFallback, Badge, ChangeLog } from '@innostes/ui';
import { FilePlus2 } from 'lucide-react';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

export default function ChangeLogDemo() {
  return (
    <ChangeLog
      className="w-full max-w-xl"
      groupByDay
      entries={[
        {
          id: '3',
          actor: 'Priya Shah',
          action: 'approved the invoice',
          time: minutesAgo(12),
          avatar: (
            <Avatar size="sm" className="size-9">
              <AvatarFallback>PS</AvatarFallback>
            </Avatar>
          ),
          changes: [{ field: 'Status', from: <Badge variant="warning" size="sm">Pending</Badge>, to: <Badge variant="success" size="sm">Approved</Badge> }],
        },
        {
          id: '2',
          actor: 'Arjun Mehta',
          action: 'edited the invoice',
          time: minutesAgo(95),
          avatar: (
            <Avatar size="sm" className="size-9">
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
          ),
          changes: [
            { field: 'Amount', from: '₹1,18,000', to: '₹1,24,500' },
            { field: 'Due date', from: '1 Nov 2026', to: '15 Nov 2026' },
            { field: 'PO number', to: 'PO-1182' },
          ],
          note: 'Customer added freight charges.',
        },
        {
          id: '1',
          actor: 'Arjun Mehta',
          action: 'created the invoice',
          time: minutesAgo(60 * 26),
          icon: <FilePlus2 />,
          tone: 'primary',
        },
      ]}
    />
  );
}
