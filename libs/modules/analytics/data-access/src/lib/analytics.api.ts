import type { ApiResponse } from '@mono/shared/types';

export interface MetricSnapshot {
  label: string;
  value: number;
  previous: number;
  unit: 'count' | 'percent' | 'ms' | 'bytes';
}

export interface AnalyticsSummary {
  metrics: MetricSnapshot[];
  updatedAt: string;
}

// Mock — swap for real httpClient calls when an API is wired up
export async function fetchAnalyticsSummary(): Promise<ApiResponse<AnalyticsSummary>> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    success: true,
    data: {
      updatedAt: new Date().toISOString(),
      metrics: [
        { label: 'Total users',      value: 84_210,  previous: 79_500,  unit: 'count'   },
        { label: 'Active sessions',  value: 1_342,   previous: 1_108,   unit: 'count'   },
        { label: 'Avg response time',value: 128,     previous: 143,     unit: 'ms'      },
        { label: 'Error rate',       value: 0.38,    previous: 0.52,    unit: 'percent' },
      ],
    },
  };
}
