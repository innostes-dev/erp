'use client';

import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@innostes/ui';

const invoices = [
  { id: 'INV-001', customer: 'Acme Corp', status: 'Paid', amount: 1250 },
  { id: 'INV-002', customer: 'Globex', status: 'Pending', amount: 840 },
  { id: 'INV-003', customer: 'Initech', status: 'Overdue', amount: 2300 },
] as const;

const tone = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;
const money = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'EUR',
});

export default function TableDemo() {
  return (
    <Table className="max-w-xl">
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-end">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.customer}</TableCell>
            <TableCell>
              <Badge variant={tone[inv.status]} dot>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-end tabular-nums">
              {money.format(inv.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-end tabular-nums">
            {money.format(4390)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
