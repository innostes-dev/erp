import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaChart, BarChart, DonutChart, LineChart } from '@innostes/ui/charts';

const data = [
  { month: 'Jan', total: 240, male: 140 },
  { month: 'Feb', total: 248, male: 146 },
];
const series = [
  { key: 'total', label: 'Total' },
  { key: 'male', label: 'Male' },
];

describe('cartesian charts', () => {
  it.each([
    ['BarChart', BarChart],
    ['LineChart', LineChart],
    ['AreaChart', AreaChart],
  ] as const)('%s exposes its data as an accessible table', (_, Chart) => {
    render(<Chart aria-label="Headcount by month" data={data} categoryKey="month" series={series} locale="en" />);
    const figure = screen.getByRole('figure', { name: 'Headcount by month' });
    const table = within(figure).getByRole('table', { name: 'Headcount by month' });
    expect(within(table).getByRole('columnheader', { name: 'Male' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '248' })).toBeInTheDocument();
  });

  it('formats values and toggles series from the legend', async () => {
    render(
      <BarChart
        aria-label="Revenue"
        data={data}
        categoryKey="month"
        series={series}
        valueFormatter={(v) => `€${v}`}
      />,
    );
    expect(screen.getByRole('cell', { name: '€240' })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Male' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('hides the legend for a single series', () => {
    render(<LineChart aria-label="Revenue" data={data} categoryKey="month" series={[series[0]!]} />);
    expect(screen.queryByRole('button', { name: 'Total' })).toBeNull();
  });

  it('does not mark the chart plot container aria-hidden to permit focusable accessibility layers', () => {
    const { container } = render(
      <BarChart aria-label="Headcount" data={data} categoryKey="month" series={series} />
    );
    const figure = container.querySelector('figure[data-slot="chart"]');
    expect(figure?.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('DonutChart', () => {
  it('shows the centre value, a legend with values and shares in the table', () => {
    render(
      <DonutChart
        aria-label="Attendance today"
        centerValue="92%"
        centerLabel="Present today"
        locale="en"
        data={[
          { key: 'present', label: 'Present', value: 228, color: 'success' },
          { key: 'absent', label: 'Absent', value: 20, color: 'destructive' },
        ]}
      />,
    );
    expect(screen.getByText('92%')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Attendance today' });
    expect(within(table).getByRole('cell', { name: '91.9%' })).toBeInTheDocument();
    expect(screen.getAllByText('228').length).toBeGreaterThan(0);
  });

  it('does not mark the donut plot container aria-hidden to permit accessible layers', () => {
    const { container } = render(
      <DonutChart
        aria-label="Attendance today"
        data={[
          { key: 'present', label: 'Present', value: 10 },
        ]}
      />,
    );
    const figure = container.querySelector('figure[data-slot="donut-chart"]');
    expect(figure?.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
