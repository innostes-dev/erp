import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  DataTable,
  EmptyState,
  IconTile,
  PageHeader,
  SearchInput,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  formatRelativeTime,
  toast,
  type BadgeVariant,
  type DataTableColumn,
} from '@innostes/ui';
import { apiRequest, getStoredAccessToken } from '@innostes/kernel';
import { Copy, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { FilterSelect } from './FilterSelect';

export interface AuditLogItem {
  id: string;
  tenant_id?: string | null;
  actor_id?: string | null;
  actor_email?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  changes?: Record<string, { old: unknown; new: unknown }> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  correlation_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at: string;
}

interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 25;

const ACTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'RESTORE', label: 'Restore' },
  { value: 'RBAC_CHANGE', label: 'Access change' },
  { value: 'LOGIN', label: 'Sign in' },
  { value: 'LOGOUT', label: 'Sign out' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'PASSWORD_RESET', label: 'Password reset' },
];
const ENTITIES = [
  { value: 'all', label: 'All records' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'employee', label: 'Employee' },
  { value: 'api_key', label: 'API key' },
  { value: 'module', label: 'Module' },
  { value: 'tenant', label: 'Organization' },
  { value: 'payroll', label: 'Payroll' },
];
const PERIODS = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];
const OUTCOMES = [
  { value: 'all', label: 'Any outcome' },
  { value: 'SUCCESS', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
];

const ACTION_TONE: Record<string, BadgeVariant> = {
  CREATE: 'success',
  UPDATE: 'info',
  RESTORE: 'info',
  DELETE: 'destructive',
  RBAC_CHANGE: 'warning',
  PASSWORD_RESET: 'warning',
  EXPORT: 'primary',
};

function actionLabel(action: string) {
  return ACTIONS.find((a) => a.value === action.toUpperCase())?.label ?? action;
}

function periodStart(period: string): string | undefined {
  const hours = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }[period];
  return hours ? new Date(Date.now() - hours * 3600_000).toISOString() : undefined;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = formatValue(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

/** Audit trail: who changed what, when, from where. Server-side filters and pagination. */
export function AuditTrailPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [action, setAction] = useState('all');
  const [entity, setEntity] = useState('all');
  const [period, setPeriod] = useState('all');
  const [outcome, setOutcome] = useState('all');
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change returns to the first page.
  useEffect(() => setPage(1), [debouncedSearch, action, entity, period, outcome]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (action !== 'all') params.set('action', action);
    if (entity !== 'all') params.set('entity_type', entity);
    if (outcome !== 'all') params.set('status', outcome);
    const from = periodStart(period);
    if (from) params.set('date_from', from);
    return params.toString();
  }, [page, debouncedSearch, action, entity, outcome, period]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredAccessToken();
      const res = await apiRequest<AuditLogListResponse>(`/audit/logs?${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setItems(res?.items ?? []);
      setTotal(res?.total ?? res?.items?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The audit trail could not be loaded.');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = Boolean(debouncedSearch) || action !== 'all' || entity !== 'all' || period !== 'all' || outcome !== 'all';

  function resetFilters() {
    setSearch('');
    setAction('all');
    setEntity('all');
    setPeriod('all');
    setOutcome('all');
  }

  function exportJson() {
    download(`audit-trail-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', JSON.stringify(items, null, 2));
    toast.success('Export ready', { description: `${items.length} records on this page exported as JSON.` });
  }

  function exportCsv() {
    const header = ['Time', 'Actor', 'Actor email', 'Action', 'Record type', 'Record ID', 'Record', 'Outcome', 'Reason', 'IP address', 'Correlation ID'];
    const rows = items.map((l) => [l.created_at, l.actor_name, l.actor_email, l.action, l.entity_type, l.entity_id, l.entity_name, l.status, l.reason, l.ip_address, l.correlation_id].map(csvCell).join(','));
    download(`audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv', [header.join(','), ...rows].join('\n'));
    toast.success('Export ready', { description: `${items.length} records on this page exported as CSV.` });
  }

  const columns: DataTableColumn<AuditLogItem>[] = [
    {
      id: 'time',
      header: 'Time',
      width: '170px',
      cell: (row) => (
        <span className="flex flex-col">
          <span className="text-foreground">{formatRelativeTime(new Date(row.created_at))}</span>
          <span className="text-caption text-muted-foreground">{dateTime.format(new Date(row.created_at))}</span>
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{row.actor_name || 'System'}</span>
          {row.actor_email && <span className="truncate text-caption text-muted-foreground">{row.actor_email}</span>}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: (row) => <Badge variant={ACTION_TONE[row.action.toUpperCase()] ?? 'secondary'}>{actionLabel(row.action)}</Badge>,
    },
    {
      id: 'record',
      header: 'Record',
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-foreground">{row.entity_name || row.entity_id}</span>
          <span className="truncate text-caption text-muted-foreground">{row.entity_type.replace(/_/g, ' ')}</span>
        </span>
      ),
    },
    {
      id: 'outcome',
      header: 'Outcome',
      cell: (row) =>
        row.status?.toUpperCase() === 'FAILED' ? (
          <Badge variant="destructive" dot>Failed</Badge>
        ) : (
          <Badge variant="success" dot>Succeeded</Badge>
        ),
    },
    {
      id: 'ip',
      header: 'IP address',
      cell: (row) => <span className="font-mono text-caption text-muted-foreground">{row.ip_address ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit trail"
        description="An immutable record of sign-ins, changes and exports across your organization."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" startIcon={<Download />} onClick={exportCsv} disabled={items.length === 0}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" startIcon={<Download />} onClick={exportJson} disabled={items.length === 0}>
              Export JSON
            </Button>
            <Button variant="ghost" size="sm" iconOnly aria-label="Refresh" onClick={() => void load()}>
              <RefreshCw />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center">
        <SearchInput
          aria-label="Search the audit trail"
          placeholder="Search actor, record, reason or IP…"
          value={search}
          onValueChange={setSearch}
          className="w-full lg:max-w-sm"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-1 lg:justify-end">
          <FilterSelect label="Action" value={action} onChange={setAction} options={ACTIONS} />
          <FilterSelect label="Record type" value={entity} onChange={setEntity} options={ENTITIES} />
          <FilterSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />
          <FilterSelect label="Outcome" value={outcome} onChange={setOutcome} options={OUTCOMES} />
        </div>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="self-start lg:self-auto">
            Clear filters
          </Button>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>The audit trail couldn't be loaded</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={items}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          pageSize={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          manualPagination
          totalCount={total}
          onRowClick={setSelected}
          responsive="stack"
          className="rounded-lg border border-border bg-card"
          emptyState={
            <EmptyState className="border-0"
              icon={<IconTile tone="neutral" size="lg"><ShieldCheck /></IconTile>}
              title={filtersActive ? 'No events match these filters' : 'No audit events yet'}
              description={
                filtersActive
                  ? 'Try a different search term or clear the filters.'
                  : 'Sign-ins, changes and exports will be recorded here automatically.'
              }
              actions={filtersActive ? <Button variant="secondary" onClick={resetFilters}>Clear filters</Button> : undefined}
            />
          }
        />
      )}

      <AuditEventSheet event={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function AuditEventSheet({ event, onClose }: { event: AuditLogItem | null; onClose: () => void }) {
  const changes = Object.entries(event?.changes ?? {});
  return (
    <Sheet open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle>
                {actionLabel(event.action)} · {event.entity_name || event.entity_id}
              </SheetTitle>
              <SheetDescription>
                {event.actor_name || 'System'} · {dateTime.format(new Date(event.created_at))}
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <Tabs defaultValue="changes">
                <TabsList>
                  <TabsTab value="changes">Changes</TabsTab>
                  <TabsTab value="context">Context</TabsTab>
                  <TabsTab value="raw">Raw record</TabsTab>
                </TabsList>
                <TabsPanel value="changes" className="pt-4">
                  {changes.length === 0 ? (
                    <p className="text-body-sm text-muted-foreground">No field changes were recorded for this event.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-body-sm">
                        <thead className="bg-muted text-start text-caption text-muted-foreground">
                          <tr>
                            <th scope="col" className="px-3 py-2 text-start font-medium">Field</th>
                            <th scope="col" className="px-3 py-2 text-start font-medium">Before</th>
                            <th scope="col" className="px-3 py-2 text-start font-medium">After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {changes.map(([field, diff]) => (
                            <tr key={field} className="align-top">
                              <th scope="row" className="px-3 py-2 text-start font-medium text-foreground">{field.replace(/_/g, ' ')}</th>
                              <td className="px-3 py-2 break-all text-muted-foreground line-through decoration-subtle-foreground">{formatValue(diff?.old)}</td>
                              <td className="px-3 py-2 break-all text-foreground">{formatValue(diff?.new)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsPanel>
                <TabsPanel value="context" className="pt-4">
                  <dl className="divide-y divide-border rounded-lg border border-border text-body-sm">
                    {[
                      ['Actor', event.actor_name || 'System'],
                      ['Email', event.actor_email],
                      ['Record type', event.entity_type],
                      ['Record ID', event.entity_id],
                      ['Outcome', event.status ?? 'SUCCESS'],
                      ['Reason', event.reason],
                      ['IP address', event.ip_address],
                      ['Correlation ID', event.correlation_id],
                      ['User agent', event.user_agent],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-3 gap-3 px-3 py-2">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="col-span-2 break-all text-foreground">{formatValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </TabsPanel>
                <TabsPanel value="raw" className="flex flex-col gap-2 pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    startIcon={<Copy />}
                    className="self-end"
                    onClick={() => {
                      void navigator.clipboard.writeText(JSON.stringify(event, null, 2));
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy JSON
                  </Button>
                  <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-caption text-foreground">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </TabsPanel>
              </Tabs>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
