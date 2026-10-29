import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  IconTile,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@innostes/ui';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKeyCreatedResponse,
  type ApiKeyItem,
} from '@innostes/kernel';
import { useNavigation } from '../context/NavigationContext';

export function ApiKeysManager() {
  const { navigate } = useNavigation();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState<string>('30');
  const [scope, setScope] = useState<string>('*');

  // Created Key Success State
  const [createdKeyData, setCreatedKeyData] = useState<ApiKeyCreatedResponse | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listApiKeys();
      setKeys(res.items || []);
    } catch {
      // Offline / dev fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const expiresInDays = expiration === 'never' ? null : parseInt(expiration, 10);
      const scopes = scope === '*' ? ['*'] : [scope];

      const res = await createApiKey({
        name: name.trim(),
        expires_in_days: expiresInDays,
        scopes,
      });

      setCreatedKeyData(res);
      setName('');
      setExpiration('30');
      setScope('*');
      toast.success('API key generated successfully');
      await loadKeys();
    } catch {
      toast.error('Failed to generate API key');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? Any applications or integrations using it will immediately lose access.')) {
      return;
    }

    setRevokingId(keyId);
    try {
      await revokeApiKey(keyId);
      toast.success('API key revoked');
      await loadKeys();
    } catch {
      toast.error('Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  }

  function copyToClipboard(text: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setHasCopied(true);
      toast.success('Copied API key to clipboard');
      setTimeout(() => setHasCopied(false), 2500);
    }
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setCreatedKeyData(null);
    setHasCopied(false);
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto w-full">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
              Administration
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>API Keys</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <KeyRound className="size-6 text-primary" />
            Personal Access Tokens & API Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage high-entropy keys for programmatic API access, automated scripts, and third-party integrations.
          </p>
        </div>

        <Button
          variant="primary"
          startIcon={<Plus className="size-4" />}
          onClick={() => {
            setCreatedKeyData(null);
            setIsDialogOpen(true);
          }}
        >
          Generate New API Key
        </Button>
      </div>

      {/* Security Context Banner */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4 shadow-2xs">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Zero-Trust Cryptographic Token Architecture</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            API keys use 256-bit entropy (<code className="font-mono text-primary font-bold">inno_live_...</code>). Plaintext keys are never stored in the database; only SHA-256 hashes are persisted. Pass them in the <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">Authorization: Bearer &lt;token&gt;</code> header.
          </p>
        </div>
      </div>

      {/* API Keys List */}
      {keys.length === 0 && !isLoading ? (
        <EmptyState
          icon={
            <IconTile tone="primary" size="lg">
              <KeyRound className="size-6" />
            </IconTile>
          }
          title="No API keys generated yet"
          description="Create personal access tokens to securely authenticate scripts, CI/CD pipelines, or external ERP integrations without using your personal password."
          actions={
            <Button
              variant="primary"
              startIcon={<Plus className="size-4" />}
              onClick={() => setIsDialogOpen(true)}
            >
              Generate First API Key
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {keys.map((k) => (
            <Card key={k.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-foreground">{k.name}</span>
                    <Badge
                      variant={k.is_revoked ? 'destructive' : 'success'}
                      dot={!k.is_revoked}
                    >
                      {k.is_revoked ? 'REVOKED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
                      {k.key_prefix}
                    </span>
                    <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                    {k.expires_at ? (
                      <span>Expires: {new Date(k.expires_at).toLocaleDateString()}</span>
                    ) : (
                      <span>Never expires</span>
                    )}
                    {k.last_used_at && (
                      <span>Last used: {new Date(k.last_used_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Scopes:</span>
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {!k.is_revoked && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={revokingId === k.id}
                      startIcon={<Trash2 className="size-3.5 text-destructive" />}
                      onClick={() => void handleRevoke(k.id)}
                    >
                      Revoke Key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generation / Key Revealed Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent size="md">
          {!createdKeyData ? (
            /* Creation Form */
            <form onSubmit={(e) => void handleCreateKey(e)}>
              <DialogHeader>
                <DialogTitle>Generate Personal API Key</DialogTitle>
                <DialogDescription>
                  Create an authentication key for machine-to-machine integrations or developer automation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Key Name / Description</label>
                  <Input
                    placeholder="e.g. Zapier CRM Sync, CI/CD Pipeline"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    What is this key for? A recognizable name helps you identify it later.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Expiration</label>
                  <Select value={expiration} onValueChange={(val) => setExpiration(val || '30')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select lifespan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="never">No expiration (Perpetual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Scopes / Access Level</label>
                  <Select value={scope} onValueChange={(val) => setScope(val || '*')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scopes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">Full Platform Access (*)</SelectItem>
                      <SelectItem value="*:read">Read-Only Access (*:read)</SelectItem>
                      <SelectItem value="hrms:read">HRMS Read Only</SelectItem>
                      <SelectItem value="crm:write">CRM Read & Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={isCreating}>
                  Generate API Key
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* Key Revealed Success View */
            <div>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-success">
                  <Check className="size-5" />
                  API Key Generated Successfully
                </DialogTitle>
                <DialogDescription>
                  {createdKeyData.name} is ready for programmatic access.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Alert variant="warning">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Copy your secret API key now!</AlertTitle>
                  <AlertDescription>
                    For your security, this raw key will <strong>never be shown again</strong>. If you lose it, you will need to revoke it and generate a new one.
                  </AlertDescription>
                </Alert>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Your Secret API Key</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-2 font-mono text-xs">
                    <span className="flex-1 break-all text-primary font-bold select-all">
                      {createdKeyData.raw_key}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      startIcon={hasCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                      onClick={() => copyToClipboard(createdKeyData.raw_key)}
                    >
                      {hasCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="size-3.5" />
                    cURL Usage Example
                  </span>
                  <pre className="rounded-lg bg-zinc-950 p-3 text-[11px] text-zinc-100 overflow-x-auto font-mono">
{`curl -H "Authorization: Bearer ${createdKeyData.raw_key}" \\
     http://localhost:8001/api/v1/hrms/info`}
                  </pre>
                </div>
              </div>

              <DialogFooter>
                <Button variant="primary" onClick={handleCloseDialog}>
                  Done (I have saved my key)
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
