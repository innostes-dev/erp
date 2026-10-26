import { DonutChart } from '@innostes/ui/charts';
import { Card } from '@innostes/ui';

export default function Demo() {
  const data = [
    { key: 'present', label: 'Present', value: 852, color: 'success' as const },
    { key: 'remote', label: 'Remote Work', value: 245, color: 'chart-3' as const },
    { key: 'leave', label: 'On Leave', value: 112, color: 'chart-4' as const },
    { key: 'absent', label: 'Absent', value: 41, color: 'destructive' as const },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-sm font-medium">Daily Attendance Status</h3>
      <DonutChart
        aria-label="Daily Attendance Status"
        centerValue="96.7%"
        centerLabel="Present & Remote"
        data={data}
      />
    </Card>
  );
}
