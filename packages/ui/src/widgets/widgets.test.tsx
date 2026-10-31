import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    FormActions,
    FormGrid,
    FormSection,
    IconTile,
    MetricCard,
    MetricGrid,
    Sparkline,
    Stepper,
    WidgetCard,
    formatDelta,
    getSentiment,
    getTrend,
} from '@innostes/ui';

describe('delta helpers', () => {
    it('reads trends from numbers and signed strings', () => {
        expect(getTrend(0.12)).toBe('up');
        expect(getTrend(-3)).toBe('down');
        expect(getTrend(0)).toBe('neutral');
        expect(getTrend('+4 people')).toBe('up');
        expect(getTrend('−2%')).toBe('down');
    });

    it('knows when up is bad', () => {
        expect(getSentiment('up', false)).toBe('negative');
        expect(getSentiment('down', false)).toBe('positive');
    });

    it('formats fractions as signed percentages', () => {
        expect(formatDelta(0.124, 'en')).toBe('+12.4%');
        expect(formatDelta(-0.04, 'en')).toBe('-4%');
        expect(formatDelta('+3', 'en')).toBe('+3');
    });
});

describe('MetricCard', () => {
    it('shows the label, value and a coloured, spoken delta', () => {
        render(
            <MetricCard
                label="Employees"
                value="248"
                delta={0.12}
                comparison="vs last month"
                locale="en"
            />,
        );
        const card = screen
            .getByText('Employees')
            .closest('[data-slot=metric-card]')!;
        expect(card).toHaveAttribute('data-variant', 'default');
        const delta = within(card as HTMLElement)
            .getByText('+12%')
            .closest('[data-slot=metric-delta]')!;
        expect(delta).toHaveAttribute('data-sentiment', 'positive');
        expect(delta).toHaveTextContent('Up');
    });

    it('marks a rising cost as negative', () => {
        render(
            <MetricCard
                label="Costs"
                value="€9k"
                delta={0.2}
                upIsGood={false}
                locale="en"
            />,
        );
        expect(
            screen.getByText('+20%').closest('[data-slot=metric-delta]'),
        ).toHaveAttribute('data-sentiment', 'negative');
    });

    it('renders the progress variant as a progressbar', () => {
        render(
            <MetricCard
                variant="progress"
                label="Target"
                value="€48k"
                progress={0.8}
                target="of €60k"
                locale="en"
            />,
        );
        expect(screen.getByRole('progressbar', { name: 'Target' })).toHaveAttribute(
            'aria-valuenow',
            '80',
        );
        expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('renders split items as a description list', () => {
        render(
            <MetricCard
                variant="split"
                label="Attendance"
                value="248"
                items={[
                    { label: 'Present', value: 228 },
                    { label: 'On leave', value: 12 },
                ]}
            />,
        );
        expect(screen.getAllByRole('term')).toHaveLength(2);
        expect(screen.getByText('On leave').closest('div')).toHaveTextContent('12');
    });

    it('becomes a link with render', () => {
        render(
            <MetricCard label="Orders" value="12" render={<a href="/orders" />} />,
        );
        expect(screen.getByRole('link')).toHaveAttribute('href', '/orders');
    });

    it('shows a skeleton while loading', () => {
        render(<MetricCard label="Orders" value="12" loading />);
        expect(screen.queryByText('12')).toBeNull();
        expect(
            screen.getByText('Orders').closest('[data-slot=metric-card]'),
        ).toHaveAttribute('aria-busy', 'true');
    });

    it('lays cards out in a grid', () => {
        render(<MetricGrid data-testid="grid" minCardWidth="10rem" />);
        expect(
            screen.getByTestId('grid').style.getPropertyValue('--metric-min'),
        ).toBe('10rem');
    });
});

describe('WidgetCard', () => {
    it('is a section labelled by its title, with a count and view-all link', () => {
        render(
            <WidgetCard
                title="Pending actions"
                count={5}
                viewAll={{ href: '/approvals' }}
            >
                Body
            </WidgetCard>,
        );
        const region = screen.getByRole('region', { name: 'Pending actions' });
        expect(within(region).getByText('5')).toBeInTheDocument();
        expect(
            within(region).getByRole('link', { name: /View all/ }),
        ).toHaveAttribute('href', '/approvals');
        expect(region).toHaveTextContent('Body');
    });

    it('shows loading, empty and error states instead of the body', async () => {
        const onRetry = vi.fn();
        const { rerender } = render(
            <WidgetCard title="Activity" loading>
                Body
            </WidgetCard>,
        );
        expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByText('Body')).toBeNull();

        rerender(
            <WidgetCard title="Activity" empty emptyState="No activity yet">
                Body
            </WidgetCard>,
        );
        expect(screen.getByText('No activity yet')).toBeInTheDocument();

        rerender(
            <WidgetCard title="Activity" error onRetry={onRetry}>
                Body
            </WidgetCard>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            "Couldn't load this widget.",
        );
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(onRetry).toHaveBeenCalled();
    });
});

describe('Stepper', () => {
    const steps = [
        { title: 'Organization' },
        { title: 'Database' },
        { title: 'Review' },
    ];

    it('marks the current step and announces completed ones', () => {
        render(<Stepper steps={steps} currentStep={1} />);
        const items = within(
            screen.getByRole('navigation', { name: 'Progress' }),
        ).getAllByRole('listitem');
        expect(items[0]).toHaveAttribute('data-status', 'complete');
        expect(items[0]).toHaveTextContent('(completed)');
        expect(items[1]).toHaveAttribute('aria-current', 'step');
        expect(items[2]).toHaveAttribute('data-status', 'upcoming');
    });

    it('lets users jump back to completed steps only', async () => {
        const onStepClick = vi.fn();
        render(<Stepper steps={steps} currentStep={1} onStepClick={onStepClick} />);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        await userEvent.click(screen.getByRole('button', { name: /Organization/ }));
        expect(onStepClick).toHaveBeenCalledWith(0);
    });
});

describe('layout helpers', () => {
    it('renders form sections with headings and actions', () => {
        render(
            <FormSection title="Regional settings" description="Used for reports.">
                <FormGrid>
                    <input aria-label="A" />
                </FormGrid>
                <FormActions>
                    <button>Save</button>
                </FormActions>
            </FormSection>,
        );
        expect(
            screen.getByRole('heading', { level: 3, name: 'Regional settings' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('hides decorative icon tiles and sparklines from screen readers', () => {
        const { container } = render(
            <>
                <IconTile tone="chart-2">★</IconTile>
                <Sparkline data={[1, 3, 2]} />
                <Sparkline data={[1, 3, 2]} label="Orders rising" />
            </>,
        );
        expect(container.querySelector('[data-slot=icon-tile]')).toHaveAttribute(
            'aria-hidden',
            'true',
        );
        expect(
            screen.getByRole('img', { name: 'Orders rising' }),
        ).toBeInTheDocument();
    });
});
