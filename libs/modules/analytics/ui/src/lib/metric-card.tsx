'use client';

import type { MetricSnapshot } from '@mono/modules/analytics/data-access';
import { formatMetric, calcChange } from '@mono/modules/analytics/utils';

interface MetricCardProps {
  metric: MetricSnapshot;
}

export function MetricCard({ metric }: MetricCardProps) {
  const change = calcChange(metric.value, metric.previous);
  const isPositive = change >= 0;
  // For error rate and response time, lower is better
  const isGood =
    metric.unit === 'percent' || metric.label.toLowerCase().includes('error') || metric.label.toLowerCase().includes('response')
      ? !isPositive
      : isPositive;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{metric.label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">
        {formatMetric(metric.value, metric.unit)}
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-xs text-gray-400">vs last period</span>
      </div>
    </div>
  );
}
