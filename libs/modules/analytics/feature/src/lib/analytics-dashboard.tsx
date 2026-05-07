'use client';

import { useEffect, useState } from 'react';
import { fetchAnalyticsSummary } from '@mono/modules/analytics/data-access';
import type { AnalyticsSummary } from '@mono/modules/analytics/data-access';
import { MetricCard } from '@mono/modules/analytics/ui';

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary()
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Platform-wide metrics and performance overview.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.metrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Failed to load metrics.</p>
      )}

      {summary && (
        <p className="text-xs text-gray-400">
          Last updated {new Date(summary.updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
