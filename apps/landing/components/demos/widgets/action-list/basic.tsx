'use client';

import { ActionList, type ActionListItem, WidgetCard, toast } from '@innostes/ui';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const pendingTasks: ActionListItem[] = [
  {
    id: '1',
    title: 'Approve purchase order PO-2026-081',
    description: 'Bengaluru Spices Pvt Ltd · ₹89,400',
    icon: <Clock className="size-4" />,
    tone: 'primary',
    action: {
      label: 'Approve',
      variant: 'primary',
      onClick: () => toast.success('PO-2026-081 approved'),
    },
  },
  {
    id: '2',
    title: 'Review GSTIN reconciliation mismatch',
    description: 'Invoice INV-2026-074 requires e-way bill re-validation',
    icon: <AlertTriangle className="size-4" />,
    tone: 'warning',
    action: {
      label: 'Review',
      variant: 'secondary',
      onClick: () => toast.info('Opened GSTIN validator'),
    },
  },
  {
    id: '3',
    title: 'Verify vendor TDS certificate',
    description: 'Malabar Cardamom Producers · Form 16A',
    icon: <CheckCircle className="size-4" />,
    tone: 'neutral',
    action: {
      label: 'Verify',
      variant: 'outline',
      onClick: () => toast.success('TDS certificate marked valid'),
    },
  },
];

export default function ActionListDemo() {
  return (
    <WidgetCard
      title="Pending authorizations"
      description="Procurement requests requiring managerial sign-off"
      count={3}
      countTone="primary"
    >
      <ActionList items={pendingTasks} divided />
    </WidgetCard>
  );
}
