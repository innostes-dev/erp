// Sample data shared by the DataTable and dashboard demos.

export type OrderStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

export interface Order {
  id: string;
  customer: string;
  email: string;
  status: OrderStatus;
  total: number;
  date: Date;
}

const customers = [
  ['Acme Corp', 'billing@acme.com'],
  ['Globex', 'ap@globex.com'],
  ['Initech', 'finance@initech.com'],
  ['Umbrella', 'pay@umbrella.com'],
  ['Hooli', 'accounts@hooli.com'],
  ['Stark Industries', 'ap@stark.com'],
  ['Wayne Enterprises', 'billing@wayne.com'],
  ['Soylent', 'finance@soylent.com'],
] as const;

const statuses: OrderStatus[] = [
  'Paid',
  'Paid',
  'Pending',
  'Paid',
  'Refunded',
  'Failed',
  'Paid',
  'Pending',
];

export const orders: Order[] = Array.from({ length: 23 }, (_, i) => {
  const [customer, email] = customers[i % customers.length]!;
  return {
    id: `ORD-${String(1024 + i)}`,
    customer,
    email,
    status: statuses[(i * 3) % statuses.length]!,
    total: Math.round(((i * 7919) % 4800) + 120),
    date: new Date(Date.UTC(2026, 9, 21 - i)),
  };
});

export const statusTone = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'secondary',
  Failed: 'destructive',
} as const;

export const money = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'EUR',
});
export const shortDate = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
