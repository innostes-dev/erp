import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  AreaChart,
  BarChart,
  LineChart,
} from './cartesian-charts';
import { DonutChart } from './donut-chart';
import {
  ChartTooltipContent,
  defaultValueFormatter,
  resolveChartColor,
} from './chart-utils';

describe('Charts edge cases and coverage', () => {
  describe('Cartesian charts edge cases', () => {
    it('handles empty data gracefully', () => {
      render(
        <BarChart
          aria-label="Empty chart"
          data={[]}
          categoryKey="month"
          series={[{ key: 'sales', label: 'Sales' }]}
        />,
      );
      expect(screen.getByRole('figure', { name: 'Empty chart' })).toBeInTheDocument();
      expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
    });

    it('handles single data point and negative values in BarChart', () => {
      const data = [{ month: 'Q1', profit: -5000 }];
      render(
        <BarChart
          aria-label="Quarterly profit"
          data={data}
          categoryKey="month"
          series={[{ key: 'profit', label: 'Profit', color: 'chart-3' }]}
          orientation="horizontal"
          allowDecimals
          radius={6}
          maxBarSize={32}
        />,
      );
      expect(screen.getByRole('figure', { name: 'Quarterly profit' })).toBeInTheDocument();
      const cell = screen.getByRole('cell', { hidden: true });
      expect(cell).toHaveTextContent('-5,000');
    });

    it('renders LineChart with dots, step curve and allowDecimals', () => {
      const data = [
        { day: 'Mon', value: 10.5 },
        { day: 'Tue', value: 20.2 },
      ];
      render(
        <LineChart
          aria-label="Daily metrics"
          data={data}
          categoryKey="day"
          series={[{ key: 'value', label: 'Value' }]}
          curve="step"
          showDots
          allowDecimals
          categoryFormatter={(v) => `Day: ${v}`}
        />,
      );
      expect(screen.getByRole('figure', { name: 'Daily metrics' })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: 'Day: Mon', hidden: true })).toBeInTheDocument();
    });

    it('renders AreaChart with linear curve and custom height', () => {
      const data = [
        { quarter: 'Q1', total: 100 },
        { quarter: 'Q2', total: 150 },
      ];
      render(
        <AreaChart
          aria-label="Quarterly totals"
          data={data}
          categoryKey="quarter"
          series={[{ key: 'total', label: 'Total' }]}
          curve="linear"
          height="16rem"
          stacked
        />,
      );
      expect(screen.getByRole('figure', { name: 'Quarterly totals' })).toBeInTheDocument();
    });
  });

  describe('DonutChart edge cases', () => {
    it('handles empty slices and zero total', () => {
      render(<DonutChart aria-label="Empty donut" data={[]} />);
      expect(screen.getByRole('figure', { name: 'Empty donut' })).toBeInTheDocument();
    });

    it('handles single slice with custom thickness, size, and side legend', () => {
      render(
        <DonutChart
          aria-label="Single slice distribution"
          data={[{ key: 'north', label: 'Northwind', value: 100, color: '#3b82f6' }]}
          size={180}
          thickness={0.3}
          legendPosition="side"
        />,
      );
      expect(screen.getByRole('figure', { name: 'Single slice distribution' })).toBeInTheDocument();
      expect(screen.getByRole('rowheader', { name: 'Northwind', hidden: true })).toBeInTheDocument();
    });
  });

  describe('chart-utils helpers', () => {
    it('resolves standard theme tones and custom CSS colours', () => {
      expect(resolveChartColor('primary', 0)).toBe('var(--color-primary)');
      expect(resolveChartColor('neutral', 1)).toBe('var(--color-muted-foreground)');
      expect(resolveChartColor('chart-4', 3)).toBe('var(--color-chart-4)');
      expect(resolveChartColor('#10b981', 0)).toBe('#10b981');
      expect(resolveChartColor(undefined, 2)).toBe('var(--color-chart-3)');
    });

    it('formats numbers using locale defaults', () => {
      const fmt = defaultValueFormatter('en-GB');
      expect(fmt(1234567.89)).toBe('1,234,567.89');
    });

    it('renders ChartTooltipContent with active payload and custom label formatter', () => {
      const { container } = render(
        <ChartTooltipContent
          active
          label="Jan 2026"
          labelFormatter={(l) => `Period: ${l}`}
          payload={[
            {
              dataKey: 'sales',
              name: 'Sales',
              value: 4500,
              color: 'var(--color-chart-1)',
            },
          ]}
          series={[{ key: 'sales', label: 'Revenue (Sales)' }]}
          valueFormatter={(v) => `£${v}`}
        />,
      );
      expect(container.querySelector('[data-slot="chart-tooltip"]')).toBeInTheDocument();
      expect(screen.getByText('Period: Jan 2026')).toBeInTheDocument();
      expect(screen.getByText('Revenue (Sales)')).toBeInTheDocument();
      expect(screen.getByText('£4500')).toBeInTheDocument();
    });

    it('returns null when ChartTooltipContent is inactive or payload is empty', () => {
      const { container } = render(<ChartTooltipContent active={false} />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
