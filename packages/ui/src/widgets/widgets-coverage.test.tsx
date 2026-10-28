import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard, type KanbanColumn } from './kanban-board/kanban-board';
import { PermissionMatrix } from './permission-matrix/permission-matrix';
import { ChangeLog } from './change-log/change-log';
import { ActionList } from './action-list/action-list';
import { AppSwitcher } from './app-switcher/app-switcher';
import { NotificationBell, NotificationList } from './notifications/notifications';
import { MetricCard } from './metric-card/metric-card';

describe('Widgets coverage and benchmarks', () => {
  describe('KanbanBoard with 500 cards and touch actions', () => {
    it('renders 500 cards smoothly and handles touch column selection', async () => {
      interface TestItem {
        id: string;
        title: string;
        priority: string;
      }

      // 5 columns x 100 cards = 500 cards
      const columns: KanbanColumn<TestItem>[] = Array.from({ length: 5 }, (_, cIndex) => ({
        id: `col-${cIndex}`,
        title: `Column ${cIndex + 1}`,
        limit: 120,
        items: Array.from({ length: 100 }, (_, iIndex) => ({
          id: `item-${cIndex}-${iIndex}`,
          title: `Task ${cIndex}-${iIndex}`,
          priority: 'High',
        })),
      }));

      const start = performance.now();
      const onValueChange = vi.fn();

      render(
        <KanbanBoard
          aria-label="High-volume enterprise pipeline"
          defaultValue={columns}
          onValueChange={onValueChange}
          getItemLabel={(item) => item.title}
          renderCard={(item) => <div>{item.title}</div>}
        />,
      );

      const renderDuration = performance.now() - start;
      // Ensure 500 cards render within acceptable time (< 3000ms in jsdom)
      expect(renderDuration).toBeLessThan(3000);

      // Verify accessible region and column titles
      expect(screen.getByRole('region', { name: 'High-volume enterprise pipeline' })).toBeInTheDocument();
      expect(screen.getByText('Column 1')).toBeInTheDocument();

      // Test touch move select on the first card
      const moveSelects = screen.getAllByRole('combobox');
      expect(moveSelects.length).toBeGreaterThan(0);
      const firstSelect = moveSelects[0]!;

      // Move first card to Column 2 (col-1)
      fireEvent.change(firstSelect, { target: { value: 'col-1' } });

      expect(onValueChange).toHaveBeenCalledTimes(1);
      const [nextColumns, move] = onValueChange.mock.calls[0]!;
      expect(move.itemId).toBe('item-0-0');
      expect(move.toColumnId).toBe('col-1');
      expect(nextColumns[0].items.length).toBe(99);
      expect(nextColumns[1].items.length).toBe(101);
    });

    it('enforces canMove rule and supports keyboard cancellation and RTL navigation', async () => {
      const user = userEvent.setup();
      const onCardOpen = vi.fn();
      const columns: KanbanColumn<{ id: string; name: string }>[] = [
        {
          id: 'todo',
          title: 'To Do',
          items: [{ id: 'card-1', name: 'Order Processing' }],
        },
        {
          id: 'done',
          title: 'Done',
          items: [],
          limit: 0, // Exceeded limit test
        },
      ];

      render(
        <div dir="rtl">
          <KanbanBoard
            aria-label="Workflow"
            defaultValue={columns}
            getItemLabel={(c) => c.name}
            canMove={() => false} // Block all moves
            onCardOpen={onCardOpen}
            renderCard={(c) => <span>{c.name}</span>}
          />
        </div>,
      );

      const card = screen.getByText('Order Processing').closest('li')!;
      card.focus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(onCardOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'card-1' }));

      // Pick up with Space
      await user.keyboard(' ');
      expect(screen.getByText(/Picked up/)).toBeInTheDocument();

      // In RTL, moving to next column (col 1) uses ArrowLeft
      await user.keyboard('{ArrowLeft}');

      // Press Space to attempt drop (should fail via canMove and announce cancelled)
      await user.keyboard(' ');
      expect(screen.getByText(/cancelled/)).toBeInTheDocument();
    });

    it('supports native HTML drag and drop on KanbanBoard', () => {
      const onValueChange = vi.fn();
      const columns: KanbanColumn<{ id: string; name: string }>[] = [
        { id: 'c1', title: 'Col 1', items: [{ id: 'card-1', name: 'Item 1' }, { id: 'card-2', name: 'Item 2' }] },
        { id: 'c2', title: 'Col 2', items: [] },
      ];

      render(
        <KanbanBoard
          aria-label="Drag board"
          value={columns}
          onValueChange={onValueChange}
          getItemLabel={(c) => c.name}
          renderCard={(c) => <span>{c.name}</span>}
        />,
      );

      const card = screen.getByText('Item 1').closest('li')!;
      const col2List = screen.getAllByRole('list')[1]!;

      // Drag start
      const dataTransfer = {
        setData: vi.fn(),
        effectAllowed: 'move',
        dropEffect: 'move',
      };
      fireEvent.dragStart(card, { dataTransfer });

      // Drag over target column
      fireEvent.dragOver(col2List, {
        clientY: 100,
        dataTransfer,
      });

      // Drag leave
      fireEvent.dragLeave(col2List);

      // Drag over again and drop
      fireEvent.dragOver(col2List, {
        clientY: 100,
        dataTransfer,
      });
      fireEvent.drop(col2List, {
        clientY: 100,
        dataTransfer,
      });

      expect(onValueChange).toHaveBeenCalled();
    });
  });

  describe('PermissionMatrix advanced features', () => {
    it('supports sticky columns, readOnly, custom mixed labels and long resource wrapping', async () => {
      const resources = [
        {
          id: 'inventory',
          label: 'Northwind Enterprise Global Warehouse Inventory Management Service',
          description: 'Comprehensive audit trail for inventory balance adjustments',
          group: 'Supply Chain',
        },
      ];
      const actions = [
        { id: 'view', label: 'View' },
        { id: 'edit', label: 'Edit' },
      ];
      const onValueChange = vi.fn();

      const { rerender } = render(
        <PermissionMatrix
          aria-label="Supply Chain Permissions"
          resources={resources}
          actions={actions}
          value={['inventory:view']}
          onValueChange={onValueChange}
          stickyColumn
          stickyHeader
          bulkToggles
          labels={{
            mixed: (name) => `${name} is in partial state`,
          }}
        />,
      );

      // Verify mixed label for row bulk toggle (1 of 2 granted)
      const rowToggle = screen.getByLabelText(/is in partial state/i);
      expect(rowToggle).toBeInTheDocument();
      expect(rowToggle).toHaveAttribute('data-indeterminate');

      // Re-render as readOnly
      rerender(
        <PermissionMatrix
          aria-label="Supply Chain Permissions"
          resources={resources}
          actions={actions}
          value={['inventory:view']}
          onValueChange={onValueChange}
          readOnly
          stickyColumn
          stickyHeader
        />,
      );

      // In readOnly mode, bulk toggles are hidden and cell checkboxes are disabled
      const checkboxes = screen.getAllByRole('checkbox');
      for (const cb of checkboxes) {
        expect(cb).toHaveAttribute('data-disabled');
      }
    });
  });

  describe('ChangeLog, ActionList, Notifications, MetricCard', () => {
    it('renders ChangeLog with rich ReactNode values and notes', () => {
      render(
        <ChangeLog
          aria-label="Audit Log"
          entries={[
            {
              id: 'log-1',
              actor: 'Priya Sharma',
              action: 'updated customer profile',
              time: '10 min ago',
              changes: [
                {
                  field: 'Status',
                  from: <span className="text-muted-foreground">Pending</span>,
                  to: <span className="font-bold text-success">Approved</span>,
                },
              ],
              note: 'Approved after verification of business documents.',
            },
          ]}
        />,
      );

      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Approved after verification of business documents.')).toBeInTheDocument();
    });

    it('renders ActionList with disabled and custom items', () => {
      const onSelect = vi.fn();
      render(
        <ActionList
          aria-label="Quick operations"
          items={[
            { id: 'a1', title: 'Print Invoice', action: { label: 'Print', onClick: onSelect } },
            { id: 'a2', title: 'Delete Record', action: <button disabled type="button">Delete</button> },
          ]}
        />,
      );

      expect(screen.getByText('Print Invoice')).toBeInTheDocument();
      expect(screen.getByText('Delete Record')).toBeInTheDocument();
      const deleteBtn = screen.getByRole('button', { name: 'Delete' });
      expect(deleteBtn).toBeDisabled();
    });

    it('renders Notifications and MetricCard variations', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <NotificationBell
            items={[
              {
                id: 'n1',
                title: 'New PO received',
                description: 'Order #PO-1024 from Acme Corp',
                time: new Date(),
                read: false,
              },
            ]}
          />
          <NotificationList
            aria-label="User notifications"
            items={[]}
            emptyText="No unread alerts"
          />
          <MetricCard
            label="Total Revenue"
            value="£248,500"
            delta="+14.2%"
            comparison="vs last month"
            action={<button type="button">Details</button>}
          />
          <MetricCard
            variant="compact"
            label="Compact Active"
            value="1,240"
            delta={0.05}
          />
          <MetricCard
            variant="sparkline"
            label="Sparkline Trend"
            value="£95k"
            delta={-0.02}
            sparkline={[10, 20, 15, 30, 25]}
          />
          <MetricCard
            variant="progress"
            label="Storage Target"
            value="75%"
            progress={0.75}
          />
          <MetricCard
            variant="comparison"
            label="Sales Comparison"
            value="£120k"
            previous={{ label: 'Last quarter', value: '£100k' }}
          />
          <MetricCard
            variant="split"
            label="Split Regional"
            value="850"
            split={{ primary: { label: 'Online', value: '500' }, secondary: { label: 'In-store', value: '350' } }}
          />
          <MetricCard
            loading
            label="Loading Card"
            value="—"
          />
        </div>,
      );

      expect(screen.getByText('No unread alerts')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('£248,500')).toBeInTheDocument();
      expect(screen.getByText('+14.2%')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Compact Active')).toBeInTheDocument();
      expect(screen.getByText('Sparkline Trend')).toBeInTheDocument();
      expect(screen.getByText('Storage Target')).toBeInTheDocument();
      expect(screen.getByText('Sales Comparison')).toBeInTheDocument();
      expect(screen.getByText('Split Regional')).toBeInTheDocument();

      // Open notification bell
      const bell = screen.getByRole('button', { name: /notifications/i });
      await user.click(bell);
      expect(screen.getByText('New PO received')).toBeInTheDocument();
    });

    it('handles NotificationList with links and AppSwitcher search filtering', async () => {
      const user = userEvent.setup();
      const onItemClick = vi.fn();
      render(
        <div>
          <NotificationList
            onItemClick={onItemClick}
            items={[
              { id: '1', title: 'Invoice sent', href: '/invoices/1' },
              { id: '2', title: 'Payment received' },
            ]}
          />
          <AppSwitcher
            searchable
            currentApp="erp"
            sections={[
              {
                title: 'Core Systems',
                apps: [
                  { id: 'erp', name: 'ERP Finance', description: 'General ledger and AP/AR' },
                  { id: 'hrms', name: 'HRMS People', description: 'Payroll and recruitment' },
                ],
              },
            ]}
          />
        </div>,
      );

      // Verify link and button notifications
      const linkNotif = screen.getByRole('link', { name: /Invoice sent/i });
      expect(linkNotif).toHaveAttribute('href', '/invoices/1');
      await user.click(linkNotif);
      expect(onItemClick).toHaveBeenCalled();

      // Test AppSwitcher popover & search filtering
      const appTrigger = screen.getByRole('button', { name: /Switch application/i });
      await user.click(appTrigger);
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'payroll');
      expect(screen.getByText('HRMS People')).toBeInTheDocument();
      expect(screen.queryByText('General ledger and AP/AR')).not.toBeInTheDocument();
    });
  });
});
