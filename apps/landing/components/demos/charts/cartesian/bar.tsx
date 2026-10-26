import { BarChart } from '@innostes/ui/charts';
import { Card } from '@innostes/ui';

export default function Demo() {
  const data = [
    { month: 'Jan', software: 125, marketing: 85, sales: 110 },
    { month: 'Feb', software: 140, marketing: 90, sales: 115 },
    { month: 'Mar', software: 155, marketing: 95, sales: 125 },
    { month: 'Apr', software: 162, marketing: 105, sales: 130 },
    { month: 'May', software: 175, marketing: 110, sales: 145 },
    { month: 'Jun', software: 180, marketing: 115, sales: 150 },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-sm font-medium">Headcount by Department</h3>
      <BarChart
        aria-label="Headcount by department"
        data={data}
        categoryKey="month"
        series={[
          { key: 'software', label: 'Software' },
          { key: 'marketing', label: 'Marketing' },
          { key: 'sales', label: 'Sales' },
        ]}
      />
    </Card>
  );
}
