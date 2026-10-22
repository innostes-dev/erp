'use client';

import { ScrollArea, Separator } from '@innostes/ui';

const events = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  text: `Order ORD-${1100 - i} ${['created', 'paid', 'shipped', 'delivered'][i % 4]}`,
  time: `${i + 1}m ago`,
}));

export default function ScrollAreaDemo() {
  return (
    <ScrollArea
      className="h-64 w-full max-w-xs rounded-lg border border-border"
      viewportClassName="p-4"
    >
      <h4 className="mb-3 text-sm font-medium">Activity</h4>
      {events.map((e) => (
        <div key={e.id}>
          <div className="flex justify-between gap-2 py-2 text-sm">
            <span>{e.text}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {e.time}
            </span>
          </div>
          <Separator />
        </div>
      ))}
    </ScrollArea>
  );
}
