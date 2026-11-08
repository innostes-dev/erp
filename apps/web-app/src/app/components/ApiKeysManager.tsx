import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
  formatRelativeTime,
  toast,
  type DataTableColumn,
} from '@innostes/ui';
import {
  createApiKey,
  getApiConfig,
  listApiKeys,
  revokeApiKey,
  type ApiKeyCreatedResponse,
  type ApiKeyItem,
} from '@innostes/kernel';
import { Check, Copy, KeyRound, Plus } from 'lucide-react';

const EXPIRATIONS = [
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'never', label: 'No expiry' },
];
const SCOPES = [
  { value: '*', label: 'Full access (*)' },
  { value: '*:read', label: 'Read-only (*:read)' },
  { value: 'peopleops:read', label: 'PeopleOps: read' },
  { value: 'salesflow:write', label: 'SalesFlow: read and write' },
];

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/** API keys: personal access tokens for integrations (Settings template). */
export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKeyItem | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('30');
  const [scope, setScope] = useState('*');
  const [created, setCreated] = useState<ApiKeyCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listApiKeys();
      setKeys(res.items || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'API keys could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  function openCreate() {
    setCreated(null);
    setCopied(false);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setCreated(null);
    setCopied(false);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await createApiKey({
        name: name.trim(),
        expires_in_days: expiration === 'never' ? null : parseInt(expiration, 10),
        scopes: [scope],
      });
      setCreated(res);
      setName('');
      setExpiration('30');
      setScope('*');
      toast.success('API key created');
      await loadKeys();
    } catch (err) {
      toast.error("The API key couldn't be created", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setCreating(false);
    }
  }

  async function confirmRevoke() {
    const key = revoking;
    setRevoking(null);
    if (!key) return;
    setRevokingId(key.id);
    try {
      await revokeApiKey(key.id);
      toast.success(`"${key.name}" was revoked`);
      await loadKeys();
    } catch (err) {
      toast.error("The API key couldn't be revoked", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setRevokingId(null);
    }
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text);
    setCopied(true);
    toast.success('API key copied');
    setTimeout(() => setCopied(false), 2500);
  }

  const columns: DataTableColumn<ApiKeyItem>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (k) => (
        <span className="flex flex-col">
          <span className="font-medium text-foreground">{k.name}</span>
          <span className="font-mono text-caption text-muted-foreground">{k.key_prefix}…</span>
        </span>
      ),
    },
    {
      id: 'scopes',
      header: 'Access',
      cell: (k) => (
        <span className="flex flex-wrap gap-1">
          {k.scopes.map((s) => (
            <Badge key={s} variant="outline" size="sm" className="font-mono">
              {s}
            </Badge>
          ))}
        </span>
      ),
    },
    { id: 'created', header: 'Created', cell: (k) => dateFmt.format(new Date(k.created_at)) },
    {
      id: 'used',
      header: 'Last used',
      cell: (k) => (k.last_used_at ? formatRelativeTime(new Date(k.last_used_at)) : <span className="text-muted-foreground">Never</span>),
    },
    {
      id: 'expires',
      header: 'Expires',
      cell: (k) => (k.expires_at ? dateFmt.format(new Date(k.expires_at)) : <span className="text-muted-foreground">No expiry</span>),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (k) =>
        k.is_revoked ? <Badge variant="secondary">Revoked</Badge> : <Badge variant="success" dot>Active</Badge>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'end',
      cell: (k) =>
        k.is_revoked ? null : (
          <Button variant="secondary" size="sm" loading={revokingId === k.id} onClick={() => setRevoking(k)}>
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="API keys"
        description="Personal access tokens for scripts, CI pipelines and integrations. Send them as Authorization: Bearer <key>."
        actions={
          <Button startIcon={<Plus />} onClick={openCreate}>
            Create API key
          </Button>
        }
      />

      <Alert>
        <AlertTitle>Keys are shown once</AlertTitle>
        <AlertDescription>
          Only a SHA-256 hash of each key is stored. Copy a new key when it's created; if it's lost, revoke it and create another.
        </AlertDescription>
      </Alert>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>API keys couldn't be loaded</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{loadError}</span>
            <Button size="sm" variant="secondary" onClick={() => void loadKeys()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DataTable
          data={keys}
          columns={columns}
          getRowId={(k) => k.id}
          loading={loading}
          responsive="stack"
          className="rounded-lg border border-border bg-card"
          emptyState={
            <EmptyState className="border-0"
              icon={<IconTile tone="neutral" size="lg"><KeyRound /></IconTile>}
              title="No API keys yet"
              description="Create a key to authenticate scripts and integrations without sharing your password."
              actions={<Button startIcon={<Plus />} onClick={openCreate}>Create API key</Button>}
            />
          }
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent size="md">
          {!created ? (
            <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-5">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>For machine-to-machine access. Choose the narrowest access that works.</DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  placeholder="e.g. CI pipeline, Reporting export"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                <FieldDescription>A recognisable name helps you find and revoke it later.</FieldDescription>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Expires after</FieldLabel>
                  <Select items={EXPIRATIONS} value={expiration} onValueChange={(v) => setExpiration(v || '30')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPIRATIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Access</FieldLabel>
                  <Select items={SCOPES} value={scope} onValueChange={(v) => setScope(v || '*')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCOPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="secondary" type="button" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" loading={creating}>Create key</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <DialogHeader>
                <DialogTitle>Copy your new key</DialogTitle>
                <DialogDescription>"{created.name}" is ready. This is the only time the full key is shown.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
                <code className="flex-1 font-mono text-body-sm break-all text-foreground select-all">{created.raw_key}</code>
                <Button variant="secondary" size="sm" startIcon={copied ? <Check /> : <Copy />} onClick={() => copy(created.raw_key)}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-caption font-medium text-muted-foreground">Example request</span>
                <pre className="overflow-x-auto rounded-md bg-brand-navy p-3 font-mono text-caption text-white">
{`curl -H "Authorization: Bearer ${created.raw_key}" \\
     ${getApiConfig().baseUrl}/auth/me`}
                </pre>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog}>I've saved the key</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={revoking !== null} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke "{revoking?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Scripts and integrations using this key stop working immediately. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="secondary" />}>Cancel</AlertDialogClose>
            <Button variant="destructive" onClick={() => void confirmRevoke()}>Revoke key</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
