'use client';

import { useState } from 'react';
import { Slider } from '@innostes/ui';

export default function SliderDemo() {
  const [range, setRange] = useState<number[]>([2500, 8000]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Inspection sample size</span>
        <Slider defaultValue={50} aria-label="Sample percentage" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="flex justify-between text-sm font-medium text-foreground">
          <span>Unit procurement budget range</span>
          <span className="font-mono text-muted-foreground tabular-nums">
            ₹{range[0]} – ₹{range[1]}
          </span>
        </span>
        <Slider
          value={range}
          onValueChange={(v) => setRange(v as number[])}
          min={1000}
          max={15000}
          step={250}
          thumbLabels={['Minimum budget rate', 'Maximum budget rate']}
        />
      </div>
    </div>
  );
}
