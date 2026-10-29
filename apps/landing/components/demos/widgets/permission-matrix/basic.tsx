'use client';

import { useState } from 'react';
import { PermissionMatrix } from '@innostes/ui';

const actions = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
  { id: 'approve', label: 'Approve' },
];

const resources = [
  { id: 'invoices', label: 'Invoices', group: 'Finance' },
  { id: 'payments', label: 'Payments', group: 'Finance', actions: ['view', 'create', 'approve'] },
  { id: 'ledger', label: 'General ledger', group: 'Finance', actions: ['view', 'edit'] },
  { id: 'employees', label: 'Employees', group: 'People', description: 'Profiles and documents' },
  { id: 'payroll', label: 'Payroll', group: 'People', actions: ['view', 'approve'] },
  { id: 'leave', label: 'Leave requests', group: 'People', actions: ['view', 'approve'] },
];

export default function PermissionMatrixDemo() {
  const [granted, setGranted] = useState([
    'invoices:view',
    'invoices:create',
    'invoices:edit',
    'payments:view',
    'ledger:view',
  ]);
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3">
      <PermissionMatrix
        aria-label="Permissions for Accountant"
        actions={actions}
        resources={resources}
        value={granted}
        onValueChange={setGranted}
      />
      <p className="text-xs text-muted-foreground">{granted.length} permissions granted</p>
    </div>
  );
}
