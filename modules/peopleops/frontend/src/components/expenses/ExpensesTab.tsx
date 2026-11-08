import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Field,
  FieldDescription,
  FieldLabel,
  IconTile,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
  type BadgeVariant,
  type DataTableColumn,
} from '@innostes/ui';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { formatINR, peopleopsRequest } from '../../api';

interface ExpenseClaim {
  id: string;
  title: string;
  total_amount: number;
  status: string;
}

interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

interface LineItem {
  expense_date: string;
  category_id: string;
  merchant_name: string;
  amount: string;
}

interface ExpensesResponse<T> {
  status: string;
  message: string;
  data: T;
}

const STATUS_TONE: Record<string, BadgeVariant> = {
  APPROVED: 'success',
  PAID: 'success',
  SUBMITTED: 'info',
  PENDING: 'warning',
  REJECTED: 'destructive',
  DRAFT: 'secondary',
};

const emptyLine = (): LineItem => ({ expense_date: '', category_id: '', merchant_name: '', amount: '' });
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/** Expense claims: list + submit a multi-line claim (List + Form templates). */
export function ExpensesTab() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [receipt, setReceipt] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [claimsRes, categoriesRes] = await Promise.all([
        peopleopsRequest<ExpensesResponse<{ claims?: ExpenseClaim[] }>>('/expenses/claims'),
        peopleopsRequest<ExpensesResponse<{ categories?: ExpenseCategory[] }>>('/expenses/categories'),
      ]);
      setClaims(claimsRes?.data?.claims ?? []);
      setCategories(categoriesRes?.data?.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Expense claims could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setTitle('');
    setPurpose('');
    setLines([emptyLine()]);
    setReceipt(null);
  }

  function updateLine(index: number, field: keyof LineItem, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await peopleopsRequest('/expenses/claims', {
        method: 'POST',
        body: {
          title: title.trim(),
          business_purpose: purpose.trim(),
          line_items: lines.map((l) => ({
            expense_date: l.expense_date,
            category_id: l.category_id,
            merchant_name: l.merchant_name.trim(),
            amount: parseFloat(l.amount) || 0,
            receipt_storage_path: receipt?.name ?? null,
          })),
        },
      });
      toast.success('Expense claim submitted', { description: `${title.trim()} · ${formatINR(total)}` });
      setOpen(false);
      resetForm();
      await load();
    } catch (err) {
      toast.error("The claim couldn't be submitted", {
        description: err instanceof Error ? err.message : 'Check the line items and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<ExpenseClaim>[] = [
    { id: 'id', header: 'Claim', cell: (c) => <span className="font-mono text-caption text-muted-foreground">{c.id}</span>, width: '140px' },
    { id: 'title', header: 'Title', cell: (c) => <span className="font-medium text-foreground">{c.title}</span> },
    { id: 'amount', header: 'Amount', align: 'end', cell: (c) => formatINR(c.total_amount) },
    {
      id: 'status',
      header: 'Status',
      cell: (c) => <Badge variant={STATUS_TONE[c.status?.toUpperCase()] ?? 'secondary'}>{titleCase(c.status ?? 'Draft')}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expense claims"
        description="Submit business expenses for reimbursement and track their approval."
        actions={
          <Button startIcon={<Plus />} onClick={() => setOpen(true)}>
            New claim
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Expense claims couldn't be loaded</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>Try again</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={claims}
          columns={columns}
          getRowId={(c) => c.id}
          loading={loading}
          responsive="stack"
          className="rounded-lg border border-border bg-card"
          emptyState={
            <EmptyState className="border-0"
              icon={<IconTile tone="neutral" size="lg"><Receipt /></IconTile>}
              title="No expense claims yet"
              description="Claims you submit appear here with their approval status."
              actions={<Button startIcon={<Plus />} onClick={() => setOpen(true)}>New claim</Button>}
            />
          }
        />
      )}

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
        <DialogContent size="lg">
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>New expense claim</DialogTitle>
              <DialogDescription>Add each receipt as a line item. Receipts are required for items over ₹500.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Client visit, Mumbai" required />
              </Field>
              <Field>
                <FieldLabel>Receipt</FieldLabel>
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Business purpose</FieldLabel>
                <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why was this expense needed?" rows={2} required />
              </Field>
            </div>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium text-foreground">Line items</legend>
              {lines.map((line, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-border bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-[9rem_1fr_1fr_8rem_auto] lg:items-end">
                  <Field>
                    <FieldLabel>Date</FieldLabel>
                    <Input type="date" value={line.expense_date} onChange={(e) => updateLine(index, 'expense_date', e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel>Category</FieldLabel>
                    <Select
                      items={categories.map((c) => ({ value: c.id, label: c.name }))}
                      value={line.category_id || null}
                      onValueChange={(v) => updateLine(index, 'category_id', v ?? '')}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose…" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Merchant</FieldLabel>
                    <Input value={line.merchant_name} onChange={(e) => updateLine(index, 'merchant_name', e.target.value)} required />
                  </Field>
                  <Field>
                    <FieldLabel>Amount (₹)</FieldLabel>
                    <Input type="number" inputMode="decimal" min="0" step="0.01" className="tabular text-end" value={line.amount} onChange={(e) => updateLine(index, 'amount', e.target.value)} required />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    iconOnly
                    aria-label={`Remove line item ${index + 1}`}
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button type="button" variant="secondary" size="sm" startIcon={<Plus />} onClick={() => setLines((prev) => [...prev, emptyLine()])}>
                  Add line item
                </Button>
                <p className="text-sm text-muted-foreground">
                  Total <span className="ms-2 font-semibold text-foreground tabular">{formatINR(total)}</span>
                </p>
              </div>
              {categories.length === 0 && (
                <FieldDescription>Expense categories are loading or unavailable; a category is required for each line.</FieldDescription>
              )}
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting} disabled={lines.some((l) => !l.category_id)}>Submit claim</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
