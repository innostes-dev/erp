export function formatMetric(value: number, unit: 'count' | 'percent' | 'ms' | 'bytes'): string {
  switch (unit) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'ms':
      return `${value.toLocaleString()}ms`;
    case 'bytes': {
      if (value >= 1_073_741_824) return `${(value / 1_073_741_824).toFixed(2)} GB`;
      if (value >= 1_048_576) return `${(value / 1_048_576).toFixed(2)} MB`;
      if (value >= 1_024) return `${(value / 1_024).toFixed(2)} KB`;
      return `${value} B`;
    }
    default:
      return value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${(value / 1_000).toFixed(1)}K`
          : String(value);
  }
}

export function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
