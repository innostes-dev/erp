'use client';

import { useState } from 'react';
import {
  PageHeader,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ChangeLog,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
  toast,
} from '@innostes/ui';
import { Download, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { NORTHWIND_INVOICES } from '../_data/northwind';

export default function InvoiceDetailExample() {
  const invoice = NORTHWIND_INVOICES[0]; // INV-2026-0801
  const [status, setStatus] = useState<string>(invoice.status);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);

  const handleMarkAsPaid = () => {
    setStatus('paid');
    setMarkPaidOpen(false);
    toast('Payment recorded', {
      description: `Invoice ${invoice.invoiceNumber} has been marked as fully settled via NEFT transfer.`,
    });
  };

  const auditHistory = [
    {
      id: 'log-1',
      author: 'Sunita Rao',
      authorRole: 'Finance Controller',
      timestamp: '28 Oct 2026, 14:30',
      action: 'Invoice generated and e-way bill filed with GSTN portal.',
    },
    {
      id: 'log-2',
      author: 'Rajesh Kumar',
      authorRole: 'Procurement Specialist',
      timestamp: '25 Oct 2026, 11:15',
      action: 'PO line items matched with goods receipt note (GRN-9021).',
    },
    {
      id: 'log-3',
      author: 'Aarav Sharma',
      authorRole: 'Supply Chain Head',
      timestamp: '24 Oct 2026, 09:45',
      action: 'Purchase order requisition signed off.',
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-background border rounded-lg">
      {/* 1. Page Header with Breadcrumbs and Action Triggers */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{invoice.invoiceNumber}</span>
            <Badge variant={status === 'paid' ? 'default' : 'secondary'}>
              {status.toUpperCase()}
            </Badge>
          </div>
        }
        description={`Outbound tax invoice for ${invoice.customerName}`}
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Finance</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Invoices</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{invoice.invoiceNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast('Downloading invoice PDF')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {status !== 'paid' && (
              <Button variant="primary" size="sm" onClick={() => setMarkPaidOpen(true)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as paid
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Fiscal Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{invoice.totalAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Includes 18% GST (CGST + SGST)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Billed Recipient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground truncate">{invoice.customerName}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{invoice.customerGstin}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Issue Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">{invoice.issueDate}</div>
            <p className="text-xs text-muted-foreground mt-1">Due: {invoice.dueDate}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Place of Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">{invoice.customerCity}</div>
            <p className="text-xs text-muted-foreground mt-1">Intra-state supply</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Line Items Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">Invoice line items</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item description</TableHead>
                <TableHead className="w-24">HSN</TableHead>
                <TableHead className="w-24 text-right">Qty</TableHead>
                <TableHead className="w-32 text-right">Unit rate</TableHead>
                <TableHead className="w-24 text-right">Tax</TableHead>
                <TableHead className="w-36 text-right">Amount (INR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  <TableCell className="font-mono text-xs">{item.hsn}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">₹{item.unitPrice.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">{item.taxRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={5} className="text-right">Taxable Subtotal</TableCell>
                <TableCell className="text-right">₹{invoice.subtotal.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={5} className="text-right">GST Total (18%)</TableCell>
                <TableCell className="text-right">₹{invoice.taxTotal.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-bold text-base">
                <TableCell colSpan={5} className="text-right">Grand Total</TableCell>
                <TableCell className="text-right text-primary">
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Audit Trail & ChangeLog */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground">Audit lifecycle</h3>
        <Card className="p-4">
          <ChangeLog
            entries={auditHistory.map((item) => ({
              id: item.id,
              author: item.author,
              timestamp: item.timestamp,
              action: item.action,
            }))}
          />
        </Card>
      </div>

      {/* 5. Accessible Settlement Confirmation Dialogue */}
      <AlertDialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record invoice settlement?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming this will mark <strong>{invoice.invoiceNumber}</strong> for{' '}
              {invoice.customerName} as fully settled. A payment receipt entry of ₹
              {invoice.totalAmount.toLocaleString('en-IN')} will be posted to the bank reconciliation ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="primary" onClick={handleMarkAsPaid}>
              Confirm settlement
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
