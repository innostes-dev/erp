import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertTitle,
  Badge,
  Button,
  DataTable,
  EmptyState,
  IconTile,
  PageHeader,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Skeleton,
  toast,
  type BadgeVariant,
  type DataTableColumn,
} from '@innostes/ui';
import { LogOut, Plus } from 'lucide-react';
import { formatINR, peopleopsRequest } from '../../api';

interface Separation {
  id: string;
  employee_id: string;
  employee_name?: string;
  exit_type: string;
  separation_mode?: string;
  approved_lwd?: string;
  requested_lwd?: string;
  status?: string;
}

interface SettlementSheet {
  pro_rata_salary: number | string;
  encashed_leave_days: number | string;
  leave_encashment_amount: number | string;
  tenure_years: number;
  gratuity_amount: number | string;
  reimbursements_payable: number | string;
  notice_shortfall_deduction: number | string;
  salary_advance_unrecovered: number | string;
  departmental_asset_recoveries: number | string;
  final_tds_tax: number | string;
  final_professional_tax: number | string;
  net_payable_amount: number | string;
}

const EXIT_TONE: Record<string, BadgeVariant> = {
  TERMINATION: 'destructive',
  VOLUNTARY_RESIGNATION: 'secondary',
  RETIREMENT: 'info',
};
const humanize = (s?: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ') : '—');
const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/** Separations and full & final settlement (List + Detail drawer templates). */
export function OffboardingTab() {
  const [separations, setSeparations] = useState<Separation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Separation | null>(null);
  const [sheet, setSheet] = useState<SettlementSheet | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await peopleopsRequest<{ items?: Separation[] }>('/offboarding/separations');
      setSeparations(res?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Separations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openSettlement(separation: Separation) {
    setSelected(separation);
    setSheet(null);
    setSheetError(null);
    try {
      setSheet(await peopleopsRequest<SettlementSheet>(`/offboarding/settlements/${separation.id}`));
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'The settlement could not be calculated.');
    }
  }

  async function disburse() {
    if (!selected) return;
    setConfirmOpen(false);
    setDisbursing(true);
    try {
      await peopleopsRequest(`/offboarding/settlements/${selected.id}/disburse`, { method: 'POST' });
      toast.success('Settlement approved for disbursal');
      setSelected(null);
      await load();
    } catch (err) {
      toast.error("The settlement couldn't be disbursed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setDisbursing(false);
    }
  }

  const columns: DataTableColumn<Separation>[] = [
    {
      id: 'employee',
      header: 'Employee',
      cell: (s) => <span className="font-medium text-foreground">{s.employee_name || s.employee_id}</span>,
    },
    {
      id: 'type',
      header: 'Exit type',
      cell: (s) => <Badge variant={EXIT_TONE[s.exit_type] ?? 'secondary'}>{humanize(s.exit_type)}</Badge>,
    },
    {
      id: 'lwd',
      header: 'Last working day',
      cell: (s) => {
        const d = s.approved_lwd || s.requested_lwd;
        return d ? dateFmt.format(new Date(d)) : '—';
      },
    },
    { id: 'stage', header: 'Stage', cell: (s) => <Badge variant="outline">{humanize(s.status ?? 'INITIATED')}</Badge> },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'end',
      cell: (s) => (
        <Button variant="secondary" size="sm" onClick={() => void openSettlement(s)}>
          View settlement
        </Button>
      ),
    },
  ];

  const money = (v: number | string | undefined) => formatINR(Number(v ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Offboarding"
        description="Separations, clearance and full & final (F&F) settlement with gratuity and leave encashment."
        actions={
          <Button startIcon={<Plus />} disabled title="Separation intake form is coming soon">
            Initiate separation
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Separations couldn't be loaded</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>Try again</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={separations}
          columns={columns}
          getRowId={(s) => s.id}
          loading={loading}
          responsive="stack"
          className="rounded-lg border border-border bg-card"
          emptyState={
            <EmptyState className="border-0"
              icon={<IconTile tone="neutral" size="lg"><LogOut /></IconTile>}
              title="No active separations"
              description="Resignations, clearance sign-offs and settlement sheets will appear here."
            />
          }
        />
      )}

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Full & final settlement</SheetTitle>
            <SheetDescription>{selected?.employee_name || selected?.employee_id}</SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-4">
            {sheetError ? (
              <Alert variant="destructive">
                <AlertTitle>Settlement unavailable</AlertTitle>
                <AlertDescription>{sheetError}</AlertDescription>
              </Alert>
            ) : !sheet ? (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Calculating settlement">
                <Skeleton className="h-28" />
                <Skeleton className="h-24" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <>
                <SettlementGroup
                  title="Earnings"
                  rows={[
                    ['Pro-rated salary (to last working day)', money(sheet.pro_rata_salary)],
                    [`Leave encashment (${Number(sheet.encashed_leave_days)} days)`, money(sheet.leave_encashment_amount)],
                    [`Gratuity (${sheet.tenure_years} years' service)`, money(sheet.gratuity_amount)],
                    ['Pending reimbursements', money(sheet.reimbursements_payable)],
                  ]}
                />
                <SettlementGroup
                  title="Recoveries"
                  negative
                  rows={[
                    ['Notice period shortfall', money(sheet.notice_shortfall_deduction)],
                    ['Unrecovered salary advance', money(sheet.salary_advance_unrecovered)],
                    ['Asset recovery', money(sheet.departmental_asset_recoveries)],
                  ]}
                />
                <SettlementGroup
                  title="Statutory withholdings"
                  negative
                  rows={[
                    ['Income tax (TDS)', money(sheet.final_tds_tax)],
                    ['Professional tax', money(sheet.final_professional_tax)],
                  ]}
                />
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-tint p-4">
                  <span className="font-medium text-foreground">Net payable</span>
                  <span className="text-metric font-semibold text-foreground tabular">{money(sheet.net_payable_amount)}</span>
                </div>
                <p className="text-caption text-muted-foreground">
                  On approval, the amount is posted to LedgerFlow and queued for the next bank disbursal batch.
                </p>
              </>
            )}
          </SheetBody>
          <SheetFooter>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            <Button disabled={!sheet} loading={disbursing} onClick={() => setConfirmOpen(true)}>
              Approve & disburse
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this settlement?</AlertDialogTitle>
            <AlertDialogDescription>
              {sheet ? `${money(sheet.net_payable_amount)} will be queued for disbursal. ` : ''}
              This posts to the ledger and can't be edited afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
            <Button onClick={() => void disburse()}>Approve & disburse</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettlementGroup({ title, rows, negative = false }: { title: string; rows: [string, string][]; negative?: boolean }) {
  return (
    <section className="rounded-lg border border-border bg-card" aria-label={title}>
      <h3 className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground">
        {title} <span className="font-normal text-muted-foreground">({negative ? 'deducted' : 'added'})</span>
      </h3>
      <dl className="divide-y divide-border text-body-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`tabular ${negative ? 'text-error-text' : 'text-foreground'}`}>
              {negative ? `−${value}` : value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
