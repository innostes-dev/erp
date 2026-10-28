import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ChangeLog,
  Gauge,
  KanbanBoard,
  PermissionMatrix,
  moveKanbanItem,
  permissionKey,
  type KanbanColumn,
} from '@innostes/ui';

describe('Gauge', () => {
  it('is a labelled meter with a formatted value', () => {
    render(<Gauge value={82} label="Budget used" description="€49k of €60k" />);
    const meter = screen.getByRole('meter', { name: 'Budget used' });
    expect(meter).toHaveAttribute('aria-valuenow', '82');
    expect(meter).toHaveTextContent('€49k of €60k');
  });

  it.each([
    [{ value: 82, format: { style: 'percent' } as const }, '82%'],
    [{ value: 96.4, format: { style: 'percent', maximumFractionDigits: 1 } as const }, '96.4%'],
    [{ value: 312, max: 400 }, '78%'],
    [{ value: 4800, max: 6000, format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const }, '$4,800'],
  ])('shows and speaks the formatted value %#', (props, text) => {
    render(<Gauge aria-label="KPI" locale="en-US" {...props} />);
    const meter = screen.getByRole('meter', { name: 'KPI' });
    expect(meter).toHaveAttribute('aria-valuetext', text);
    expect(meter.querySelector('[data-slot=gauge-value]')).toHaveTextContent(text);
  });

  it('picks the tone from a function of the value', () => {
    render(<Gauge value={95} aria-label="Load" tone={(v) => (v > 90 ? 'destructive' : 'success')} />);
    expect(screen.getByRole('meter', { name: 'Load' })).toHaveAttribute('data-tone', 'destructive');
  });
});

describe('ChangeLog', () => {
  it('shows who changed which fields from what to what', () => {
    render(
      <ChangeLog
        entries={[
          {
            id: '1',
            actor: 'Priya Shah',
            action: 'updated the invoice',
            time: 'Yesterday',
            changes: [
              { field: 'Status', from: 'Draft', to: 'Sent' },
              { field: 'PO number', to: 'PO-1182' },
            ],
            note: 'Customer confirmed',
          },
        ]}
      />,
    );
    expect(screen.getByText('Priya Shah')).toBeInTheDocument();
    expect(screen.getByText('Status').nextElementSibling).toHaveTextContent('from Draft');
    expect(screen.getByText('Status').nextElementSibling).toHaveTextContent('to Sent');
    expect(screen.getByText('PO number').nextElementSibling).toHaveTextContent('from —');
    expect(screen.getByText('Customer confirmed')).toBeInTheDocument();
  });

  it('shows the empty text', () => {
    render(<ChangeLog entries={[]} />);
    expect(screen.getByText('No changes yet.')).toBeInTheDocument();
  });
});

describe('PermissionMatrix', () => {
  const actions = [
    { id: 'view', label: 'View' },
    { id: 'edit', label: 'Edit' },
  ];
  const resources = [
    { id: 'invoices', label: 'Invoices', group: 'Finance' },
    { id: 'payroll', label: 'Payroll', group: 'HR', actions: ['view'] },
  ];

  it('renders a table with grouped rows and n/a cells', () => {
    render(<PermissionMatrix aria-label="Accountant" actions={actions} resources={resources} />);
    const table = screen.getByRole('table', { name: 'Accountant' });
    expect(within(table).getByRole('columnheader', { name: 'Finance' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: /Payroll/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Edit Payroll' })).not.toBeInTheDocument();
    expect(screen.getByText('Not applicable')).toBeInTheDocument();
  });

  it('toggles single cells, rows and columns with mixed states', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PermissionMatrix aria-label="Accountant" actions={actions} resources={resources} onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole('checkbox', { name: 'View Invoices' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['invoices:view']);
    const row = screen.getByRole('checkbox', { name: 'All permissions for Invoices' });
    expect(row).toHaveAttribute('aria-checked', 'mixed');

    await user.click(row);
    expect(onValueChange).toHaveBeenLastCalledWith(['invoices:view', 'invoices:edit']);
    expect(row).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('checkbox', { name: 'View for all' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['invoices:view', 'invoices:edit', 'payroll:view']);

    await user.click(row);
    expect(onValueChange).toHaveBeenLastCalledWith(['payroll:view']);
  });

  it('hides bulk toggles when read-only', () => {
    render(
      <PermissionMatrix
        aria-label="Accountant"
        actions={actions}
        resources={resources}
        readOnly
        value={[permissionKey('invoices', 'view')]}
      />,
    );
    expect(screen.queryByRole('checkbox', { name: /for all|All permissions/ })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'View Invoices' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('KanbanBoard', () => {
  type Card = { id: string; name: string };
  const columns: KanbanColumn<Card>[] = [
    { id: 'todo', title: 'To do', items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }] },
    { id: 'doing', title: 'Doing', items: [{ id: 'c', name: 'Gamma' }], limit: 1 },
    { id: 'done', title: 'Done', items: [] },
  ];

  const setup = (props: Partial<Parameters<typeof KanbanBoard<Card>>[0]> = {}) =>
    render(
      <KanbanBoard<Card>
        aria-label="Board"
        defaultValue={columns}
        getItemLabel={(c) => c.name}
        renderCard={(c) => c.name}
        {...props}
      />,
    );

  const cardsIn = (title: string) =>
    within(screen.getByRole('list', { name: title }))
      .queryAllByText(/Alpha|Beta|Gamma/)
      .map((el) => el.textContent);

  it('moves pure data with moveKanbanItem', () => {
    const next = moveKanbanItem(columns, 'a', 'done', 0);
    expect(next[0]!.items.map((i) => i.id)).toEqual(['b']);
    expect(next[2]!.items.map((i) => i.id)).toEqual(['a']);
    expect(columns[0]!.items).toHaveLength(2);
  });

  it('shows columns, counts, limits and empty columns', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Doing' })).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
    expect(screen.getByText('No cards')).toBeInTheDocument();
  });

  it('moves a card with the keyboard and announces each step', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    setup({ onValueChange });
    screen.getByText('Alpha').closest('li')!.focus();

    await user.keyboard(' ');
    expect(screen.getByText(/Picked up Alpha/)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Alpha moved to Doing, position 1 of 2.')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard(' ');

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![1]).toEqual({
      itemId: 'a',
      fromColumnId: 'todo',
      fromIndex: 0,
      toColumnId: 'doing',
      toIndex: 1,
    });
    expect(cardsIn('Doing')).toEqual(['Gamma', 'Alpha']);
    expect(cardsIn('To do')).toEqual(['Beta']);
    expect(screen.getByText('Alpha').closest('li')).toHaveFocus();
    expect(screen.getByText('Alpha dropped in Doing, position 2.')).toBeInTheDocument();
  });

  it('cancels a keyboard move with Escape', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    setup({ onValueChange });
    screen.getByText('Beta').closest('li')!.focus();
    await user.keyboard(' {ArrowUp}{Escape}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cardsIn('To do')).toEqual(['Alpha', 'Beta']);
    expect(screen.getByText(/Move cancelled/)).toBeInTheDocument();
  });

  it('blocks moves that canMove rejects', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    setup({ onValueChange, canMove: (m) => m.toColumnId !== 'done' });
    screen.getByText('Gamma').closest('li')!.focus();
    await user.keyboard(' {ArrowRight} ');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cardsIn('Doing')).toEqual(['Gamma']);
  });

  it('moves focus between cards with arrows and opens with Enter', async () => {
    const user = userEvent.setup();
    const onCardOpen = vi.fn();
    setup({ onCardOpen });
    screen.getByText('Beta').closest('li')!.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Gamma').closest('li')).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(screen.getByText('Alpha').closest('li')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onCardOpen).toHaveBeenCalledWith({ id: 'a', name: 'Alpha' });
  });
});
