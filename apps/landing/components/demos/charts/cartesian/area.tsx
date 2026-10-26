import { AreaChart } from '@innostes/ui/charts';
import { Card } from '@innostes/ui';

export default function Demo() {
  const data = [
    { day: 'Mon', amr: 450, emea: 380, apac: 220 },
    { day: 'Tue', amr: 480, emea: 395, apac: 240 },
    { day: 'Wed', amr: 510, emea: 410, apac: 235 },
    { day: 'Thu', amr: 490, emea: 405, apac: 250 },
    { day: 'Fri', amr: 460, emea: 380, apac: 245 },
  ];

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-sm font-medium">Daily Active Users by Region</h3>
      <AreaChart
        aria-label="Daily Active Users by Region"
        data={data}
        categoryKey="day"
        series={[
          { key: 'amr', label: 'AMR' },
          { key: 'emea', label: 'EMEA' },
          { key: 'apac', label: 'APAC' },
        ]}
      />
    </Card>
  );
}
