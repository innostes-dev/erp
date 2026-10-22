'use client';

import { useState } from 'react';
import { Slider } from '@innostes/ui';

export default function SliderDemo() {
  const [range, setRange] = useState<number[]>([200, 800]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Volume</span>
        <Slider defaultValue={60} aria-label="Volume" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="flex justify-between text-sm font-medium">
          Price range
          <span className="text-muted-foreground tabular-nums">
            €{range[0]} – €{range[1]}
          </span>
        </span>
        <Slider
          value={range}
          onValueChange={(v) => setRange(v as number[])}
          min={0}
          max={1000}
          step={10}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </div>
    </div>
  );
}
