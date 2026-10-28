'use client';

import { Gauge } from '@innostes/ui';

const byLoad = (v: number) => (v > 90 ? 'destructive' : v > 75 ? 'warning' : 'success');

export default function GaugeDemo() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <Gauge value={82} label="Budget used" description="₹49L of ₹60L" format={{ style: 'percent' }} tone={byLoad} max={100} />
      <Gauge value={96.4} label="SLA met" description="Last 30 days" format={{ style: 'percent', maximumFractionDigits: 1 }} tone="success" />
      <Gauge value={312} max={400} label="Warehouse capacity" description="pallets used" tone="info" />
    </div>
  );
}
