/**
 * `@innostes/ui/charts`: themed, accessible charts built on Recharts.
 *
 * A separate entry point, so apps without charts never load Recharts. Requires the optional peer
 * dependency `recharts` (2.15+ or 3.x; React 17 apps must use Recharts 2.15).
 *
 * @packageDocumentation
 */
export * from './cartesian-charts';
export * from './donut-chart';
export {
  ChartLegend,
  ChartTooltipContent,
  type ChartColor,
  type ChartLegendProps,
  type ChartSeries,
  type ChartTooltipContentProps,
} from './chart-utils';
