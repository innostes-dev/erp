'use client';

import { Meter } from '@innostes/ui';

export default function MeterDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Meter
        value={42}
        label="Storage"
        format={{ style: 'unit', unit: 'gigabyte' }}
        max={100}
      />
      <Meter value={8} max={10} label="Seats used" tone="warning" />
      <Meter
        value={0.97}
        max={1}
        label="API quota"
        format={{ style: 'percent' }}
        tone="destructive"
      />
    </div>
  );
}
