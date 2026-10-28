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
  ['Tata Consumer Products', 'procurement@tataconsumer.com'],
  ['Reliance Retail Ltd', 'vendor.desk@relianceretail.com'],
  ['ITC Paperboards', 'accounts.payable@itc.in'],
  ['Hindustan Unilever Ltd', 'commercial@hul.co.in'],
  ['Godrej Agrovet', 'billing@godrejagrovet.com'],
  ['Infosys Cafeteria Services', 'vendor.pay@infosys.com'],
  ['Wipro Infrastructure', 'finance@wipro.com'],
  ['Titan Industries Ltd', 'procure@titan.co.in'],
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

export const orders: Order[] = Array.from({ length: 48 }, (_, i) => {
  const [customer, email] = customers[i % customers.length]!;
  return {
    id: `PO-${String(8400 + i)}`,
    customer,
    email,
    status: statuses[(i * 3) % statuses.length]!,
    total: Math.round(((i * 14820) % 285000) + 12500),
    date: new Date(Date.UTC(2026, 9, 28 - (i % 28))),
  };
});

export const statusTone = {
  Paid: 'success',
  Pending: 'warning',
  Refunded: 'secondary',
  Failed: 'destructive',
} as const;

export const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const shortDate = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
