'use client';

import { LineChart } from '@innostes/ui/charts';
import { Card } from '@innostes/ui';

export default function Demo() {
  const data = [
    { quarter: 'Q1', revenue: 42000, target: 40000 },
    { quarter: 'Q2', revenue: 48500, target: 45000 },
    { quarter: 'Q3', revenue: 55200, target: 50000 },
    { quarter: 'Q4', revenue: 61000, target: 55000 },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-sm font-medium">Quarterly Revenue vs Target</h3>
      <LineChart
        aria-label="Quarterly Revenue vs Target"
        data={data}
        categoryKey="quarter"
        series={[
          { key: 'revenue', label: 'Revenue' },
          { key: 'target', label: 'Target' },
        ]}
        valueFormatter={(v) => `€${v.toLocaleString()}`}
      />
    </Card>
  );
}
