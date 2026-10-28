'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, Badge, Button, KanbanBoard, type KanbanColumn } from '@innostes/ui';
import { Plus } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  role: string;
  initials: string;
}

const initial: KanbanColumn<Candidate>[] = [
  {
    id: 'applied',
    title: 'Applied',
    tone: 'neutral',
    items: [
      { id: 'c1', name: 'Kavya Reddy', role: 'Frontend engineer', initials: 'KR' },
      { id: 'c2', name: 'Arjun Mehta', role: 'Accountant', initials: 'AM' },
      { id: 'c3', name: 'Sara Khan', role: 'HR executive', initials: 'SK' },
    ],
  },
  {
    id: 'screening',
    title: 'Screening',
    tone: 'info',
    limit: 2,
    items: [{ id: 'c4', name: 'Rahul Verma', role: 'Backend engineer', initials: 'RV' }],
  },
  {
    id: 'interview',
    title: 'Interview',
    tone: 'warning',
    limit: 3,
    items: [{ id: 'c5', name: 'Meera Iyer', role: 'Product designer', initials: 'MI' }],
  },
  { id: 'offer', title: 'Offer', tone: 'success', items: [] },
];

export default function KanbanBoardDemo() {
  const [columns, setColumns] = useState(initial);
  return (
    <KanbanBoard
      aria-label="Hiring pipeline"
      value={columns}
      onValueChange={(next) => setColumns(next)}
      getItemLabel={(c) => c.name}
      columnActions={(col) => (
        <Button variant="ghost" size="sm" iconOnly aria-label={`Add to ${col.title}`}>
          <Plus />
        </Button>
      )}
      renderCard={(c) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{c.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="truncate text-xs text-muted-foreground">{c.role}</p>
          </div>
          <Badge variant="outline" size="sm" className="ms-auto">
            {c.id.toUpperCase()}
          </Badge>
        </div>
      )}
    />
  );
}
