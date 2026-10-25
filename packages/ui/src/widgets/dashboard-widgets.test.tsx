import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ActionList,
  ActivityFeed,
  DataTable,
  EntityList,
  MetricCard,
  QuickActions,
  WelcomeBanner,
  formatRelativeTime,
  type DataTableColumn,
} from '@innostes/ui';

describe('formatRelativeTime', () => {
  const now = new Date(2026, 9, 25, 12, 0);
  it('formats recent and older dates', () => {
    expect(formatRelativeTime(new Date(2026, 9, 25, 11, 58), { now, locale: 'en' })).toBe('2 min. ago');
    expect(formatRelativeTime(new Date(2026, 9, 24, 12, 0), { now, locale: 'en', style: 'long' })).toBe('yesterday');
    expect(formatRelativeTime('Last week', { now })).toBe('Last week');
  });
});

describe('EntityList', () => {
  it('renders initials, subtitles and meta, and clickable rows', async () => {
    const onItemClick = vi.fn();
    render(
      <EntityList
        onItemClick={onItemClick}
        items={[{ id: '1', title: 'Sravani Reddy', subtitle: 'UI/UX Designer', meta: '15 Apr' }]}
      />,
    );
    expect(screen.getByText('SR')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Sravani Reddy/ }));
    expect(onItemClick).toHaveBeenCalled();
  });

  it('shows an empty message', () => {
    render(<EntityList items={[]} emptyText="No birthdays this week" />);
    expect(screen.getByText('No birthdays this week')).toBeInTheDocument();
  });
});

describe('ActivityFeed', () => {
  it('groups by day with machine-readable times', () => {
    const now = new Date();
    const { container } = render(
      <ActivityFeed
        groupByDay
        locale="en"
        items={[
          { id: '1', title: 'New employee joined', time: now },
          { id: '2', title: 'Document uploaded', time: new Date(now.getTime() - 24 * 3_600_000) },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(container.querySelectorAll('time[datetime]')).toHaveLength(2);
  });
});

describe('ActionList', () => {
  it('renders action buttons and links', async () => {
    const onClick = vi.fn();
    render(
      <ActionList
        items={[
          { id: '1', title: 'Approve leave', action: { label: 'Review', onClick } },
          { id: '2', title: 'Onboarding', action: { label: 'View', href: '/onboarding' } },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/onboarding');
  });
});

describe('WelcomeBanner and QuickActions', () => {
  it('renders the greeting as a heading', () => {
    render(<WelcomeBanner eyebrow="April 2025" title="Welcome back, Arun" quote="Great people build great companies." />);
    expect(screen.getByRole('heading', { name: 'Welcome back, Arun' })).toBeInTheDocument();
    expect(screen.getByText(/Great people/)).toBeInTheDocument();
  });

  it('renders shortcut tiles as links or buttons', () => {
    render(
      <QuickActions
        items={[
          { id: 'a', label: 'New invoice', icon: <span />, href: '/invoices/new' },
          { id: 'b', label: 'Add employee', icon: <span />, onClick: () => {} },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'New invoice' })).toHaveAttribute('href', '/invoices/new');
    expect(screen.getByRole('button', { name: 'Add employee' })).toBeInTheDocument();
  });
});

describe('customisation hooks', () => {
  it('applies classNames to MetricCard parts, after the defaults', () => {
    render(<MetricCard label="Revenue" value="€1" classNames={{ value: 'text-primary', label: 'uppercase' }} />);
    expect(screen.getByText('€1')).toHaveClass('text-primary');
    expect(screen.getByText('€1')).toHaveAttribute('data-slot', 'metric-card-value');
    expect(screen.getByText('Revenue')).toHaveClass('uppercase');
  });

  it('labels DataTable cells for the stacked mobile layout', () => {
    interface Row {
      id: string;
      name: string;
    }
    const columns: DataTableColumn<Row>[] = [{ id: 'name', header: 'Name', accessor: (r) => r.name }];
    const { container } = render(
      <DataTable aria-label="People" responsive="stack" data={[{ id: '1', name: 'Ada' }]} columns={columns} getRowId={(r) => r.id} />,
    );
    expect(container.querySelector('[data-slot=data-table]')).toHaveAttribute('data-responsive', 'stack');
    expect(within(screen.getByRole('table')).getByText('Ada').closest('td')).toHaveAttribute('data-label', 'Name');
  });
});
