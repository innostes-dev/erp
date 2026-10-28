'use client';

import { useState } from 'react';
import { Badge, TreeView, type TreeNode } from '@innostes/ui';
import { Building2, Users } from 'lucide-react';

const team = (id: string, label: string, count: number): TreeNode => ({
  id,
  label,
  icon: <Users />,
  meta: <Badge variant="secondary" size="sm">{count}</Badge>,
});

const departments: TreeNode[] = [
  {
    id: 'eng',
    label: 'Engineering',
    icon: <Building2 />,
    children: [team('web', 'Web platform', 14), team('mobile', 'Mobile', 9), team('qa', 'Quality', 6)],
  },
  {
    id: 'fin',
    label: 'Finance',
    icon: <Building2 />,
    children: [team('ap', 'Accounts payable', 4), team('ar', 'Accounts receivable', 5), team('tax', 'Tax', 3)],
  },
  {
    id: 'ops',
    label: 'Operations',
    icon: <Building2 />,
    children: [
      { id: 'wh', label: 'Warehouses', icon: <Building2 />, children: [team('wh-blr', 'Bengaluru', 22), team('wh-hyd', 'Hyderabad', 18)] },
      team('proc', 'Procurement', 7),
    ],
  },
];

export default function TreeViewDemo() {
  const [selected, setSelected] = useState<string | null>('web');
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <TreeView
        aria-label="Departments"
        items={departments}
        defaultExpanded={['eng']}
        selected={selected}
        onSelectedChange={setSelected}
        className="rounded-lg border p-2"
      />
      <p className="text-sm text-muted-foreground">Selected: {selected ?? 'none'}</p>
    </div>
  );
}
