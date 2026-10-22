'use client';

import { Sparkline } from '@innostes/ui';

const rows = [
  {
    name: 'Acme Corp',
    data: [12, 14, 13, 18, 21, 24, 28],
    tone: 'success' as const,
    total: '€28,400',
  },
  {
    name: 'Globex',
    data: [30, 28, 26, 27, 22, 19, 17],
    tone: 'destructive' as const,
    total: '€17,150',
  },
  {
    name: 'Initech',
    data: [8, 9, 9, 10, 9, 11, 10],
    tone: 'chart-1' as const,
    total: '€10,020',
  },
];

export default function SparklineDemo() {
  return (
    <table className="w-full max-w-md text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="pb-2 text-start font-medium">Customer</th>
          <th className="pb-2 text-start font-medium">Last 7 weeks</th>
          <th className="pb-2 text-end font-medium">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-border">
            <td className="py-2.5 font-medium">{r.name}</td>
            <td className="w-32 py-2.5">
              <Sparkline
                data={r.data}
                tone={r.tone}
                height={28}
                area={false}
                label={`${r.name} weekly revenue`}
              />
            </td>
            <td className="py-2.5 text-end tabular-nums">{r.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
