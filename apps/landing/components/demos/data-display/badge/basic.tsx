'use client';

import { Badge } from '@innostes/ui';

export default function BadgeDemo() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Badge variant="success" dot>
          Paid
        </Badge>
        <Badge variant="warning" dot>
          Pending
        </Badge>
        <Badge variant="destructive" dot>
          Overdue
        </Badge>
        <Badge variant="info" dot>
          Draft
        </Badge>
        <Badge variant="secondary" size="sm">
          12
        </Badge>
      </div>
    </div>
  );
}
