'use client';

import { useState, useMemo } from 'react';
import {
  DataTable,
  type DataTableColumn,
  Badge,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  toast,
} from '@innostes/ui';
import { Search, Download, Send, MoreHorizontal, FileText } from 'lucide-react';
import { NORTHWIND_INVOICES, Invoice } from '../_data/northwind';

export default function InvoiceListExample() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filteredInvoices = useMemo(() => {
    return NORTHWIND_INVOICES.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerGstin.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page]);

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: 'invoiceNumber',
      header: 'Invoice #',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground">{row.invoiceNumber}</span>
        </div>
      ),
    },
    {
      id: 'customerName',
      header: 'Customer & GSTIN',
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.customerName}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.customerGstin}</div>
        </div>
      ),
    },
    {
      id: 'issueDate',
      header: 'Due date',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.dueDate}</span>
      ),
    },
    {
      id: 'totalAmount',
      header: 'Amount (INR)',
      cell: (row) => (
        <span className="font-medium text-foreground">
          ₹{row.totalAmount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          paid: 'default',
          pending: 'secondary',
          overdue: 'destructive',
          draft: 'outline',
        };
        return <Badge variant={variants[row.status]}>{row.status.toUpperCase()}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" aria-label={`Actions for ${row.invoiceNumber}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast(`Opening ${row.invoiceNumber}`)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast(`Downloading PDF for ${row.invoiceNumber}`)}>
              Download PDF
            </DropdownMenuItem>
            {row.status !== 'paid' && (
              <DropdownMenuItem onClick={() => toast(`Reminder sent to ${row.customerName}`)}>
                Send reminder
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4 bg-background border rounded-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Tax invoices</h2>
          <p className="text-sm text-muted-foreground">
            Northwind Traders Pvt Ltd outbound GST tax invoices and settlement status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast('Exporting report')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => toast('Creating new invoice')}>
            Create invoice
          </Button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, customer or GSTIN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) {
                setStatusFilter(val);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Filter by invoice status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions notification bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/60 rounded-md border text-sm">
          <span>{selectedIds.length} invoice(s) selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast(`Sending reminders to ${selectedIds.length} accounts`)}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Send reminders
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast(`Exported ${selectedIds.length} invoices`)}
            >
              Export batch
            </Button>
          </div>
        </div>
      )}

      {/* Data Table with selection */}
      <DataTable
        data={pagedInvoices}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
      />
    </div>
  );
}
