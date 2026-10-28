'use client';

import { QuickActions, type QuickAction, WidgetCard, toast } from '@innostes/ui';
import { ShoppingCart, FileText, Truck, UserPlus } from 'lucide-react';

const actions: QuickAction[] = [
  {
    id: 'po',
    label: 'Create purchase order',
    description: 'Procure goods from registered vendors',
    icon: <ShoppingCart className="size-5" />,
    tone: 'primary',
    onClick: () => toast.success('Initiated purchase order wizard'),
  },
  {
    id: 'inv',
    label: 'Issue tax invoice',
    description: 'GST-compliant B2B e-invoice with IRN',
    icon: <FileText className="size-5" />,
    tone: 'success',
    onClick: () => toast.success('Opened invoice creation modal'),
  },
  {
    id: 'disp',
    label: 'Log consignment',
    description: 'Generate E-Way bill and dispatch note',
    icon: <Truck className="size-5" />,
    tone: 'warning',
    onClick: () => toast.success('Opened logistics dispatch logger'),
  },
  {
    id: 'ven',
    label: 'Register vendor',
    description: 'KYC, PAN and bank mandate setup',
    icon: <UserPlus className="size-5" />,
    tone: 'neutral',
    onClick: () => toast.success('Opened vendor onboarding flow'),
  },
];

export default function QuickActionsDemo() {
  return (
    <WidgetCard title="Procurement shortcuts" description="Frequent administrative operations">
      <QuickActions items={actions} layout="row" />
    </WidgetCard>
  );
}
