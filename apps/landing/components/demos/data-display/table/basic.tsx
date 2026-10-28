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
  { id: 'INV-2026-081', customer: 'Tata Consumer Products', status: 'Paid', amount: 142500 },
  { id: 'INV-2026-082', customer: 'Reliance Retail Ltd', status: 'Pending', amount: 89400 },
  { id: 'INV-2026-083', customer: 'ITC Paperboards', status: 'Overdue', amount: 231000 },
] as const;

const tone = {
  Paid: 'success',
  Pending: 'warning',
  Overdue: 'destructive',
} as const;

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default function TableDemo() {
  return (
    <Table className="max-w-xl">
      <TableCaption>Recent tax invoices for Northwind Traders Pvt Ltd</TableCaption>
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
            <TableCell className="font-mono font-medium">{inv.id}</TableCell>
            <TableCell>{inv.customer}</TableCell>
            <TableCell>
              <Badge variant={tone[inv.status]} dot>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-end font-mono">
              {money.format(inv.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-end font-mono">
            {money.format(462900)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
