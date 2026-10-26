'use client';

import { CommandPalette, Button } from '@innostes/ui';
import { Plus, Settings, FileText, Users, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  const handleAction = (action: string) => {
    alert(`Executed: ${action}`);
    setOpen(false);
  };

  const groups = [
    {
      heading: 'Suggestions',
      items: [
        {
          id: 'new-file',
          label: 'Create new file...',
          icon: <Plus />,
          shortcut: '⌘ N',
          onSelect: () => handleAction('Create new file')
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings />,
          shortcut: '⌘ ,',
          onSelect: () => handleAction('Settings')
        },
      ]
    },
    {
      heading: 'Pages',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          description: 'View and manage customer orders',
          icon: <ShoppingCart />,
          onSelect: () => handleAction('Navigate to Orders')
        },
        {
          id: 'invoices',
          label: 'Invoices',
          icon: <FileText />,
          onSelect: () => handleAction('Navigate to Invoices')
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <Users />,
          onSelect: () => handleAction('Navigate to Customers')
        },
      ]
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <p className="text-sm text-muted-foreground">Press <kbd className="font-sans px-1.5 py-0.5 rounded-sm bg-muted border border-border">⌘ K</kbd> to open the command palette</p>
      <Button onClick={() => setOpen(true)}>Open Command Palette</Button>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        placeholder="Type a command or search..."
      />
    </div>
  );
}
