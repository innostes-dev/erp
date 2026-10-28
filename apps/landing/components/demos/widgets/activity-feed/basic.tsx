'use client';

import { ActivityFeed, type ActivityItem, WidgetCard } from '@innostes/ui';
import { FileText, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';

const now = new Date();

const events: ActivityItem[] = [
  {
    id: '1',
    title: 'Consignment DISP-2026-992 in transit',
    description: 'Dispatched via Blue Dart to Mumbai central warehouse.',
    time: new Date(now.getTime() - 1000 * 60 * 18),
    icon: <Truck className="size-4" />,
    tone: 'primary',
  },
  {
    id: '2',
    title: 'Tax invoice INV-2026-081 approved',
    description: 'Priya Sharma verified ₹89,400 with GST e-invoicing.',
    time: new Date(now.getTime() - 1000 * 60 * 120),
    icon: <CheckCircle2 className="size-4" />,
    tone: 'success',
  },
  {
    id: '3',
    title: 'Purchase order PO-2026-081 created',
    description: 'Draft issued to Bengaluru Spices Pvt Ltd.',
    time: new Date(now.getTime() - 1000 * 60 * 360),
    icon: <FileText className="size-4" />,
    tone: 'neutral',
  },
  {
    id: '4',
    title: 'TDS mismatch flagged',
    description: 'Section 194C deduction difference on INV-2026-074.',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 26),
    icon: <AlertTriangle className="size-4" />,
    tone: 'warning',
  },
];

export default function ActivityFeedDemo() {
  return (
    <WidgetCard title="Procurement timeline" description="Recent ERP activities across divisions">
      <ActivityFeed items={events} variant="timeline" groupByDay />
    </WidgetCard>
  );
}
