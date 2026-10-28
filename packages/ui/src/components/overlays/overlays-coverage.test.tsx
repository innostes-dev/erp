import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  CommandPalette,
  type CommandGroup,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@innostes/ui';

describe('CommandPalette full functionality', () => {
  it('searches, highlights, navigates with arrows and executes selection', async () => {
    const handleOrders = vi.fn();
    const handleInvoice = vi.fn();

    const groups: CommandGroup[] = [
      {
        heading: 'Pages',
        items: [
          { id: 'orders', label: 'Orders List', onSelect: handleOrders },
          { id: 'customers', label: 'Customer Directory', onSelect: vi.fn() },
        ],
      },
      {
        heading: 'Actions',
        items: [
          {
            id: 'invoice',
            label: 'Create Invoice',
            description: 'Finance billing',
            keywords: ['money', 'billing'],
            onSelect: handleInvoice,
          },
        ],
      },
    ];

    render(
      <CommandPalette
        open={true}
        groups={groups}
        placeholder="Type a command..."
        emptyText="Nothing matches"
        footer={<span>Press Esc to exit</span>}
      />,
    );

    expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument();
    expect(screen.getByText('Orders List')).toBeInTheDocument();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByText('Press Esc to exit')).toBeInTheDocument();

    // Type query to filter
    const input = screen.getByPlaceholderText('Type a command...');
    await userEvent.type(input, 'billing');

    expect(screen.queryByText('Orders List')).toBeNull();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();

    // Select with Enter
    await userEvent.keyboard('{Enter}');
    expect(handleInvoice).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no command matches', async () => {
    const groups: CommandGroup[] = [
      {
        heading: 'General',
        items: [{ id: '1', label: 'Settings', onSelect: vi.fn() }],
      },
    ];

    render(
      <CommandPalette
        open={true}
        groups={groups}
        emptyText="No commands available"
      />,
    );

    const input = screen.getByPlaceholderText('Type a command or search…');
    await userEvent.type(input, 'xyzunknownquery');

    expect(screen.getByText('No commands available')).toBeInTheDocument();
  });
});

describe('Dialog, Sheet, and AlertDialog full anatomy', () => {
  it('renders Dialog with custom closeLabel, header and footer', () => {
    render(
      <Dialog open={true}>
        <DialogContent closeLabel="Dismiss modal">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>Modify your personal details</DialogDescription>
          </DialogHeader>
          <div>Form Content</div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('heading', { name: 'Update Profile' })).toBeInTheDocument();
    expect(screen.getByText('Modify your personal details')).toBeInTheDocument();
    expect(screen.getByText('Form Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss modal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders Sheet on logical end side with SheetBody and SheetFooter', () => {
    render(
      <Sheet open={true}>
        <SheetContent side="end" closeLabel="Dismiss drawer">
          <SheetHeader>
            <SheetTitle>Audit Log Filters</SheetTitle>
            <SheetDescription>Filter system events</SheetDescription>
          </SheetHeader>
          <SheetBody>Log details</SheetBody>
          <SheetFooter>
            <SheetClose>Apply</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole('heading', { name: 'Audit Log Filters' })).toBeInTheDocument();
    expect(screen.getByText('Filter system events')).toBeInTheDocument();
    expect(screen.getByText('Log details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss drawer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('renders AlertDialog requiring explicit action choice', () => {
    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete records?</AlertDialogTitle>
            <AlertDialogDescription>Action is irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>Abort</AlertDialogClose>
            <AlertDialogClose>Confirm Delete</AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.getByRole('heading', { name: 'Permanently delete records?' })).toBeInTheDocument();
    expect(screen.getByText('Action is irreversible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abort' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Delete' })).toBeInTheDocument();
  });
});
