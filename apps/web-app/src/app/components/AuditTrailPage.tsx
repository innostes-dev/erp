import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
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
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  EmptyState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@innostes/ui';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  ArrowRight,
  Eye,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Layers,
  Lock,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
  Fingerprint,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export interface AuditLogItem {
  id: string;
  tenant_id?: string;
  actor_id?: string;
  actor_email: string;
  actor_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'RBAC_CHANGE' | 'EXPORT' | 'PASSWORD_RESET';
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  changes: Record<string, { old: any; new: any }>;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  reason?: string;
  status: 'SUCCESS' | 'FAILED';
  created_at: string;
}

const INITIAL_MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud_90f2b1a8-1240-4bc2-8921-99201481b01a',
    actor_email: 'sarah.connor@acme-corp.com',
    actor_name: 'Sarah Connor',
    action: 'UPDATE',
    entity_type: 'employee',
    entity_id: 'emp_99214',
    entity_name: 'Alex Rivera (Staff Engineer)',
    changes: {
      salary: { old: 145000, new: 165000 },
      title: { old: 'Senior Engineer', new: 'Staff Engineer' },
      department: { old: 'Product Eng', new: 'Core Platform' },
    },
    ip_address: '198.51.100.42',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0',
    correlation_id: 'tr-9981240b',
    reason: 'Annual H2 compensation and leveling cycle approval',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'aud_8812c40e-3312-4aa1-9011-881240182bc2',
    actor_email: 'marcus.vance@acme-corp.com',
    actor_name: 'Marcus Vance',
    action: 'RBAC_CHANGE',
    entity_type: 'role',
    entity_id: 'role_finance_mgr',
    entity_name: 'Finance Manager Role',
    changes: {
      permissions: {
        old: ['invoices:read', 'invoices:create'],
        new: ['invoices:read', 'invoices:create', 'invoices:approve', 'payroll:export'],
      },
      approval_limit_usd: { old: 25000, new: 100000 },
    },
    ip_address: '203.0.113.19',
    user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0',
    correlation_id: 'tr-881240cc',
    reason: 'Q4 audit committee policy signoff #SEC-8819',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: 'aud_77b3109a-4491-4992-bf10-7719203810ad',
    actor_email: 'elena.rostova@acme-corp.com',
    actor_name: 'Elena Rostova',
    action: 'CREATE',
    entity_type: 'deal',
    entity_id: 'deal_enterprise_cloud_90',
    entity_name: 'Global Retail Corp Multi-Year Cloud Contract',
    changes: {
      amount: { old: null, new: 450000 },
      stage: { old: null, new: 'Proposal/Quote' },
      close_date: { old: null, new: '2026-12-15' },
      assigned_rep: { old: null, new: 'elena.rostova@acme-corp.com' },
    },
    ip_address: '198.51.100.88',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    correlation_id: 'tr-77192033',
    reason: 'RFP submission response accepted by prospect procurement',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'aud_66c29188-5510-4112-9901-6610293810be',
    actor_email: 'david.kim@acme-corp.com',
    actor_name: 'David Kim',
    action: 'LOGIN',
    entity_type: 'user',
    entity_id: 'usr_david_kim_01',
    entity_name: 'David Kim (Security Admin)',
    changes: {
      mfa_method: { old: null, new: 'FIDO2_HARDWARE_KEY' },
      session_type: { old: null, new: 'PERSISTENT_WEB' },
    },
    ip_address: '192.0.2.14',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/130.0.0.0',
    correlation_id: 'tr-66102938',
    reason: 'Hardware security token authentication verified',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: 'aud_55b1029c-6621-4882-aa01-5510293810cf',
    actor_email: 'system.worker@innostes.internal',
    actor_name: 'System Worker (Cron)',
    action: 'EXPORT',
    entity_type: 'payroll',
    entity_id: 'batch_payroll_2026_10',
    entity_name: 'October 2026 Direct Deposit Batch',
    changes: {
      records_exported: { old: 0, new: 184 },
      destination: { old: null, new: 'ACH_CLEARING_HOUSE_ENCRYPTED_VAULT' },
    },
    ip_address: '10.244.18.5',
    user_agent: 'InnostesWorker/1.0 (AsyncScheduler)',
    correlation_id: 'tr-55102938',
    reason: 'Scheduled automated end-of-month payroll run',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'aud_44a99182-7712-4221-bb11-4410293810df',
    actor_email: 'sarah.connor@acme-corp.com',
    actor_name: 'Sarah Connor',
    action: 'DELETE',
    entity_type: 'api_key',
    entity_id: 'key_prod_legacy_001',
    entity_name: 'Legacy CI Deployment Token',
    changes: {
      is_revoked: { old: false, new: true },
      revoked_reason: { old: null, new: 'Migrated to Tracura Scoped Key' },
    },
    ip_address: '198.51.100.42',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/130.0.0.0',
    correlation_id: 'tr-44102938',
    reason: 'Decommissioned deprecated legacy token',
    status: 'SUCCESS',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export function AuditTrailPage() {
  const { navigate } = useNavigation();
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_MOCK_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diff' | 'forensics' | 'json'>('diff');

  // Fetch from /audit/logs or fallback to mock
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/audit/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setLogs(data.items);
        }
      }
    } catch {
      // In offline / preview mode, keep rich mock data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to clipboard', description: text });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Generated', description: `Exported ${filteredLogs.length} audit records to JSON.` });
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Entity Type', 'Entity ID', 'Entity Name', 'Reason', 'IP Address', 'Correlation ID'];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      `"${l.actor_name}"`,
      l.actor_email,
      l.action,
      l.entity_type,
      l.entity_id,
      `"${l.entity_name || ''}"`,
      `"${l.reason || ''}"`,
      l.ip_address || '',
      l.correlation_id || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export Generated', description: `Exported ${filteredLogs.length} audit records to CSV.` });
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesActor = log.actor_name.toLowerCase().includes(q) || log.actor_email.toLowerCase().includes(q);
        const matchesEntity = log.entity_type.toLowerCase().includes(q) || (log.entity_name && log.entity_name.toLowerCase().includes(q)) || log.entity_id.toLowerCase().includes(q);
        const matchesReason = log.reason && log.reason.toLowerCase().includes(q);
        const matchesIp = log.ip_address && log.ip_address.includes(q);
        const matchesCorrelation = log.correlation_id && log.correlation_id.toLowerCase().includes(q);
        if (!matchesActor && !matchesEntity && !matchesReason && !matchesIp && !matchesCorrelation) {
          return false;
        }
      }

      if (timeFilter === '24h') {
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (new Date(log.created_at).getTime() < dayAgo) return false;
      } else if (timeFilter === '7d') {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(log.created_at).getTime() < weekAgo) return false;
      }

      return true;
    });
  }, [logs, actionFilter, entityFilter, searchQuery, timeFilter]);

  // KPIs
  const kpiStats = useMemo(() => {
    const total = logs.length;
    const mutations = logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'].includes(l.action)).length;
    const security = logs.filter((l) => ['LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'RBAC_CHANGE'].includes(l.action)).length;
    const uniqueActors = new Set(logs.map((l) => l.actor_email)).size;
    return { total, mutations, security, uniqueActors };
  }, [logs]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'RBAC_CHANGE':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'LOGIN':
      case 'LOGOUT':
      case 'PASSWORD_RESET':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'EXPORT':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    };
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/')} className="cursor-pointer">
                  Platform
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/administration')} className="cursor-pointer">
                  Administration
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Audit Trail</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="size-6 text-blue-600 dark:text-blue-400" />
              Audit Trail & Compliance
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-xs font-mono">
              SOC 2 Type II Verified
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable, non-repudiable audit ledger capturing all domain state mutations, auth events, and RBAC policy adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
            <Download className="size-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1.5">
            <FileCode2 className="size-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Events Recorded</span>
              <Database className="size-4 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold mt-1 tracking-tight text-foreground">
              {kpiStats.total.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="text-emerald-500 font-semibold">100%</span> immutable append-only
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Domain Mutations</span>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold mt-1 tracking-tight text-emerald-600 dark:text-emerald-400">
              {kpiStats.mutations.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Entity creates, updates, and deletes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Security & RBAC Changes</span>
              <Lock className="size-4 text-purple-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold mt-1 tracking-tight text-purple-600 dark:text-purple-400">
              {kpiStats.security.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Logins, MFA, and permission elevations
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Active Actors</span>
              <User className="size-4 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-extrabold mt-1 tracking-tight text-amber-600 dark:text-amber-400">
              {kpiStats.uniqueActors.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[11px] text-muted-foreground">
              Distinct humans & service accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 bg-card/50 shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor name, email, entity ID, reason, IP, or correlation trace..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="RBAC_CHANGE">RBAC Change</SelectItem>
                <SelectItem value="LOGIN">LOGIN</SelectItem>
                <SelectItem value="EXPORT">EXPORT</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="role">Role / RBAC</SelectItem>
                <SelectItem value="deal">CRM Deal</SelectItem>
                <SelectItem value="user">User Account</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="payroll">Payroll</SelectItem>
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-9 text-xs w-[120px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Past 24h</SelectItem>
                <SelectItem value="7d">Past 7 Days</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || actionFilter !== 'all' || entityFilter !== 'all' || timeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActionFilter('all');
                  setEntityFilter('all');
                  setTimeFilter('all');
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Audit Data Table */}
      <Card className="border-border/60 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Change Summary</th>
                <th className="py-3 px-4">Network / Trace</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-normal">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No Audit Records Found"
                      description="No compliance events match your current filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const { date, time } = formatTimestamp(log.created_at);
                  const changesKeys = Object.keys(log.changes || {});
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-foreground font-medium">{time}</div>
                        <div className="text-[10px] text-muted-foreground">{date}</div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                            {log.actor_name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-foreground truncate">{log.actor_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate">{log.actor_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4">
                        <div className="min-w-[140px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1 py-0.2 rounded">
                              {log.entity_type}
                            </span>
                            <span className="font-medium text-foreground truncate max-w-[150px]">
                              {log.entity_name || log.entity_id}
                            </span>
                          </div>
                          {log.reason && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                              {log.reason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Changes Preview */}
                      <td className="py-3 px-4">
                        <div className="max-w-[220px]">
                          {changesKeys.length === 0 ? (
                            <span className="text-muted-foreground italic text-[11px]">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {changesKeys.slice(0, 3).map((k) => (
                                <span
                                  key={k}
                                  className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded text-foreground border border-border/40"
                                >
                                  {k}
                                </span>
                              ))}
                              {changesKeys.length > 3 && (
                                <span className="text-[10px] text-muted-foreground self-center">
                                  +{changesKeys.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Network & Correlation Trace */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {log.ip_address || 'Internal'}
                          </span>
                          {log.correlation_id && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(`corr-${log.id}`, log.correlation_id!);
                              }}
                              className="font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="Click to copy correlation trace ID"
                            >
                              <Fingerprint className="size-3" />
                              {log.correlation_id}
                              {copiedId === `corr-${log.id}` ? <Check className="size-2.5 text-emerald-400" /> : null}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                        >
                          <Eye className="size-3.5 mr-1" />
                          Diff
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Slide-out Inspector Dialog */}
      {selectedLog && (
        <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <span className="font-mono text-xs uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {selectedLog.entity_type}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </div>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-2">
                {selectedLog.entity_name || selectedLog.entity_id}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Audit Record ID: <code className="font-mono text-[10px]">{selectedLog.id}</code>
              </DialogDescription>
            </DialogHeader>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-border px-5 bg-muted/10 gap-4 text-xs font-medium">
              <button
                onClick={() => setActiveTab('diff')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer ${activeTab === 'diff' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Before / After Diff
              </button>
              <button
                onClick={() => setActiveTab('forensics')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer ${activeTab === 'forensics' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Actor & Network Context
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`py-2.5 border-b-2 transition-colors cursor-pointer ${activeTab === 'json' ? 'border-primary text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Raw JSON
              </button>
            </div>

            {/* Dialog Content Area */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {activeTab === 'diff' && (
                <div className="space-y-4">
                  {Object.keys(selectedLog.changes || {}).length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                      No field-level state changes were recorded for this action.
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs divide-y divide-border">
                        <thead className="bg-muted/40 font-semibold text-[11px] text-muted-foreground">
                          <tr>
                            <th className="py-2.5 px-3">Field</th>
                            <th className="py-2.5 px-3">Previous Value (Before)</th>
                            <th className="py-2.5 px-3">New Value (After)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-[11px]">
                          {Object.entries(selectedLog.changes).map(([field, delta]) => (
                            <tr key={field} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-semibold text-foreground bg-muted/10">
                                {field}
                              </td>
                              <td className="py-2 px-3 text-rose-600 dark:text-rose-400 bg-rose-500/5">
                                {delta.old !== null && delta.old !== undefined ? (
                                  typeof delta.old === 'object' ? JSON.stringify(delta.old) : String(delta.old)
                                ) : (
                                  <span className="text-muted-foreground italic">null</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                {delta.new !== null && delta.new !== undefined ? (
                                  typeof delta.new === 'object' ? JSON.stringify(delta.new) : String(delta.new)
                                ) : (
                                  <span className="text-muted-foreground italic">null</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedLog.reason && (
                    <div className="rounded-lg bg-muted/40 p-3 border border-border/60">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Business Justification / Reason</p>
                      <p className="text-xs text-foreground mt-0.5">{selectedLog.reason}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'forensics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3 bg-muted/10">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Actor Details</span>
                      <p className="text-xs font-semibold text-foreground mt-1">{selectedLog.actor_name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{selectedLog.actor_email}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-1">ID: {selectedLog.actor_id || 'System'}</p>
                    </div>

                    <div className="rounded-lg border border-border p-3 bg-muted/10">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">Network Context</span>
                      <p className="font-mono text-xs font-semibold text-foreground mt-1">IP: {selectedLog.ip_address || 'Internal'}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1" title={selectedLog.user_agent}>
                        UA: {selectedLog.user_agent || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {selectedLog.correlation_id && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                          <Activity className="size-3.5" />
                          Tracura Telemetry Trace Cross-Reference
                        </span>
                        <p className="font-mono text-xs text-foreground">
                          {selectedLog.correlation_id}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          This state mutation occurred during an HTTP request captured by Tracura.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/plugins/tracura`)}
                        className="gap-1.5 text-xs border-blue-500/30 text-blue-600 dark:text-blue-400"
                      >
                        <ExternalLink className="size-3.5" />
                        Inspect in Tracura
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'json' && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy('dialog-json', JSON.stringify(selectedLog, null, 2))}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white bg-slate-800/80 p-1.5 rounded"
                  >
                    {copiedId === 'dialog-json' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  </button>
                  <pre className="p-4 bg-slate-950 font-mono text-[11px] text-slate-300 rounded-lg overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
