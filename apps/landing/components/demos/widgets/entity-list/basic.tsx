'use client';

import { EntityList, type EntityListItem, WidgetCard, Badge, Button, toast } from '@innostes/ui';
import { ExternalLink } from 'lucide-react';

const suppliers: EntityListItem[] = [
  {
    id: '1',
    title: 'Bengaluru Spices Pvt Ltd',
    subtitle: 'GSTIN: 29ABCDE1234F1Z5 · Koramangala Hub',
    initials: 'BS',
    tone: 'primary',
    meta: <span className="font-semibold text-foreground">₹4,28,900</span>,
    action: (
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="View Bengaluru Spices"
        onClick={() => toast.info('Opened Bengaluru Spices ledger')}
      >
        <ExternalLink className="size-4" />
      </Button>
    ),
  },
  {
    id: '2',
    title: 'Malabar Cardamom Producers',
    subtitle: 'GSTIN: 32AABCM5678K1Z2 · Kochi Depot',
    initials: 'MC',
    tone: 'success',
    meta: <span className="font-semibold text-foreground">₹2,85,000</span>,
    action: (
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="View Malabar Cardamom"
        onClick={() => toast.info('Opened Malabar Cardamom ledger')}
      >
        <ExternalLink className="size-4" />
      </Button>
    ),
  },
  {
    id: '3',
    title: 'Deccan Agro Exports',
    subtitle: 'GSTIN: 36AABCD9012E1Z8 · Hyderabad Terminal',
    initials: 'DA',
    tone: 'neutral',
    meta: <Badge variant="warning">Pending KYC</Badge>,
    action: (
      <Button
        size="sm"
        variant="ghost"
        iconOnly
        aria-label="View Deccan Agro"
        onClick={() => toast.info('Opened Deccan Agro ledger')}
      >
        <ExternalLink className="size-4" />
      </Button>
    ),
  },
];

export default function EntityListDemo() {
  return (
    <WidgetCard
      title="Primary vendors"
      description="Active suppliers registered with Northwind Traders"
      viewAll={{ label: 'All vendors', onClick: () => toast.info('Navigating to vendor directory') }}
    >
      <EntityList items={suppliers} divided />
    </WidgetCard>
  );
}
