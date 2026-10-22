'use client';

import { MetricCard, MetricGrid } from '@innostes/ui';
import {
  Briefcase,
  CalendarDays,
  Euro,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';

const revenue = [32, 35, 31, 38, 42, 40, 47, 45, 52, 55, 53, 61];

export default function MetricCardVariantsDemo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-muted-foreground">default</h4>
        <MetricGrid minCardWidth="10rem">
          <MetricCard
            label="Employees"
            value="248"
            icon={<Users />}
            tone="chart-1"
            delta={0.12}
            comparison="vs last month"
          />
          <MetricCard
            label="On leave"
            value="12"
            icon={<CalendarDays />}
            tone="chart-2"
            delta={0.04}
            upIsGood={false}
            comparison="vs last month"
          />
          <MetricCard
            label="New joiners"
            value="8"
            icon={<UserPlus />}
            tone="chart-3"
            delta={0.6}
            comparison="vs last month"
          />
          <MetricCard
            label="Open positions"
            value="4"
            icon={<Briefcase />}
            tone="chart-7"
            delta={0}
            comparison="vs last month"
          />
        </MetricGrid>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          compact · accent
        </h4>
        <MetricGrid minCardWidth="10rem">
          <MetricCard
            variant="compact"
            label="Tickets"
            value="1,284"
            icon={<Users />}
            tone="chart-6"
            delta={0.031}
          />
          <MetricCard
            variant="compact"
            label="Avg. response"
            value="2h 14m"
            delta={-0.08}
            upIsGood={false}
          />
          <MetricCard
            variant="accent"
            tone="chart-1"
            label="Revenue"
            value="€48,250"
            delta={0.125}
            comparison="this month"
          />
          <MetricCard
            variant="accent"
            tone="chart-5"
            label="Refunds"
            value="€1,120"
            delta={0.21}
            upIsGood={false}
            comparison="this month"
          />
        </MetricGrid>
      </section>

      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          sparkline · progress · comparison · split
        </h4>
        <MetricGrid minCardWidth="16rem">
          <MetricCard
            variant="sparkline"
            label="Revenue"
            value="€61,400"
            icon={<Euro />}
            delta={0.151}
            comparison="vs last year"
            sparkline={revenue}
          />
          <MetricCard
            variant="progress"
            label="Quarterly target"
            value="€48,250"
            icon={<Target />}
            tone="chart-3"
            progress={48250 / 60000}
            target="of €60,000"
          />
          <MetricCard
            variant="comparison"
            label="Orders"
            value="1,284"
            delta={0.041}
            comparison="Oct 2026"
            previous={{ label: 'Sep 2026', value: '1,233' }}
          />
          <MetricCard
            variant="split"
            label="Attendance today"
            value="92%"
            delta={0.02}
            comparison="vs yesterday"
            items={[
              { label: 'Present', value: 228, tone: 'success' },
              { label: 'On leave', value: 12, tone: 'neutral' },
              { label: 'Half day', value: 4, tone: 'warning' },
              { label: 'Absent', value: 4, tone: 'destructive' },
            ]}
          />
        </MetricGrid>
      </section>
    </div>
  );
}
