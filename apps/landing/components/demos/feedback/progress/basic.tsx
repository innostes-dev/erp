'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@innostes/ui';

export default function ProgressDemo() {
  const [value, setValue] = useState(10);

  useEffect(() => {
    const id = setInterval(
      () => setValue((v) => (v >= 100 ? 10 : v + 15)),
      900,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Progress
        value={Math.min(value, 100)}
        label="Importing customers"
        showValue
      />
      <Progress value={null} label="Preparing export…" />
    </div>
  );
}
