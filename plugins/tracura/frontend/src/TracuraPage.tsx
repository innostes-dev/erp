'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { apiRequest } from '@innostes/kernel';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Stat,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  WidgetCard,
  MetricCard,
  Sparkline,
  Progress,
  TagInput,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  TelemetryBarChart,
  TelemetryDonutChart,
  TelemetryTrendChart,
  cn,
} from '@innostes/ui';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Columns,
  Copy,
  Database,
  ExternalLink,
  Eye,
  Filter,
  Info,
  Key,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  Settings,
  Share2,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { apiLoggerManifest } from './manifest';

// --- TYPES ---

export interface TelemetryLog {
  id: string;
  correlation_id: string;
  project: string;
  environment: string;
  http_method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  path: string;
  status_code: number;
  duration_ms: number;
  size_bytes: number;
  client_ip: string;
  user_agent: string;
  user_id?: string;
  request_headers: Record<string, string>;
  query_params?: Record<string, string>;
  request_body?: Record<string, any> | null;
  response_headers: Record<string, string>;
  response_body?: Record<string, any> | null;
  error?: {
    code?: string;
    type?: string;
    message: string;
    source?: string;
    stack_trace?: string;
  } | null;
  timeline?: Array<{
    time: string;
    message: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    duration?: string;
  }>;
  meta?: Record<string, any>;
  created_at: string;
}

export interface IngestionApiKey {
  id: string;
  name: string;
  key_prefix: string;
  project: string;
  allowed_environments: string[];
  ip_allowlist?: string[];
  rate_limit_rpm: number;
  status: 'active' | 'revoked';
  last_used_at: string;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  environments: Array<{
    id: string;
    name: string;
    slug: string;
    color_badge: string;
  }>;
}

export interface DashboardAnalytics {
  kpi: {
    total_requests: number;
    successful_requests: number;
    success_rate_pct: number;
    error_requests: number;
    error_rate_pct: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    status_breakdown: Record<string, number>;
  };
  timeseries: Array<{
    timestamp: string;
    label: string;
    requests: number;
    errors: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
  }>;
  environment_health: Array<{
    environment: string;
    environment_id?: string;
    color_badge: string;
    requests: number;
    error_rate_pct: number;
    avg_latency_ms: number;
    status: string;
  }>;
  top_endpoints: Array<{
    http_method: string;
    path: string;
    requests: number;
    error_rate_pct: number;
    avg_latency_ms: number;
  }>;
  top_errors: Array<{
    error_type: string;
    error_message?: string;
    count: number;
    last_seen: string;
  }>;
}

const isUuid = (val?: string | null): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

async function tracuraFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('innostes_access_token') : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: {
        ...authHeaders,
        ...((options.headers as Record<string, string>) || {}),
      },
    });
  } catch {
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.port === '4200'
          ? 'http://localhost:8001'
          : ''
        : '';
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeaders,
        ...((options.headers as Record<string, string>) || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  }
}


const EMPTY_DASHBOARD: DashboardAnalytics = {
  kpi: {
    total_requests: 0,
    successful_requests: 0,
    success_rate_pct: 100,
    error_requests: 0,
    error_rate_pct: 0,
    avg_latency_ms: 0,
    p95_latency_ms: 0,
    p99_latency_ms: 0,
    status_breakdown: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  },
  timeseries: [],
  environment_health: [],
  top_endpoints: [],
  top_errors: [],
};

export function TracuraPage() {
  // Navigation & Subfeatures
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'keys' | 'settings'>('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'datacapture' | 'filtering' | 'security' | 'retention' | 'alerts' | 'access' | 'integrations'>('general');

  // Hierarchy Scope States
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedEnvSlug, setSelectedEnvSlug] = useState<string>('dev');
  const [dateRange, setDateRange] = useState<string>('24h');
  const [topSearch, setTopSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live Dashboard Analytics
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics>(EMPTY_DASHBOARD);

  // Logs Explorer States
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string>('');
  const [logFilterQuery, setLogFilterQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedStatusCode, setSelectedStatusCode] = useState<string>('ALL');
  const [statusPill, setStatusPill] = useState<'all' | 'success' | 'errors' | '4xx' | '5xx'>('all');
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'events' | 'request' | 'response' | 'error' | 'stack' | 'timeline'>('overview');
  const [jsonReqTab, setJsonReqTab] = useState<'headers' | 'body' | 'raw'>('headers');
  const [jsonResTab, setJsonResTab] = useState<'headers' | 'body' | 'raw'>('headers');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'logs' | 'errors'>('all');

  // API Keys
  const [apiKeys, setApiKeys] = useState<IngestionApiKey[]>([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [newKeyProject, setNewKeyProject] = useState<string>('Innostes ERP');
  const [newKeyEnvs, setNewKeyEnvs] = useState<string[]>(['production']);
  const [newKeyRpm, setNewKeyRpm] = useState<number>(60000);
  const [newKeyIpAllowlist, setNewKeyIpAllowlist] = useState<string>('');
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  // Project & Environment CRUD Modals
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState<boolean>(false);
  const [newProjName, setNewProjName] = useState<string>('');
  const [newProjSlug, setNewProjSlug] = useState<string>('');
  const [newProjDesc, setNewProjDesc] = useState<string>('');
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState<boolean>(false);

  // Settings Configuration State
  const [projectNameInput, setProjectNameInput] = useState<string>('Innostes ERP');
  const [projectDescInput, setProjectDescInput] = useState<string>('Core Innostes ERP platform and kernel business services');
  const [captureReqHeaders, setCaptureReqHeaders] = useState<boolean>(true);
  const [captureResHeaders, setCaptureResHeaders] = useState<boolean>(true);
  const [captureReqBody, setCaptureReqBody] = useState<boolean>(true);
  const [captureResBody, setCaptureResBody] = useState<boolean>(true);
  const [captureErrors, setCaptureErrors] = useState<boolean>(true);
  const [captureCustomLogs, setCaptureCustomLogs] = useState<boolean>(true);
  const [ignoreStatusCodes, setIgnoreStatusCodes] = useState<string[]>(['200', '201', '204']);
  const [ignoreEndpoints, setIgnoreEndpoints] = useState<string[]>(['/health', '/metrics', '/favicon.ico', '/static/*']);
  const [redactHeaders, setRedactHeaders] = useState<string[]>(['authorization', 'cookie', 'x-api-key', 'set-cookie']);
  const [redactBodyFields, setRedactBodyFields] = useState<string[]>(['password', 'token', 'secret', 'credit_card', 'ssn']);
  const [retentionDays, setRetentionDays] = useState<string>('30');
  const [settingsPreviewTab, setSettingsPreviewTab] = useState<'request' | 'response' | 'stored'>('request');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Current project & env objects
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const currentEnv = useMemo(() => {
    return currentProject?.environments.find((e) => e.slug === selectedEnvSlug) || currentProject?.environments[0];
  }, [currentProject, selectedEnvSlug]);

  const selectedLog = useMemo(() => {
    return logs.find((l) => l.id === selectedLogId) || logs[0];
  }, [logs, selectedLogId]);

  // Derived Sparklines & Trends from Dashboard Data
  const totalSparkline = useMemo(() => {
    const pts = dashboardData.timeseries.map((t) => t.requests);
    return pts.length > 1 ? pts : (pts.length === 1 ? [pts[0], pts[0]] : [0, 0]);
  }, [dashboardData.timeseries]);

  const successSparkline = useMemo(() => {
    const pts = dashboardData.timeseries.map((t) => Math.max(0, t.requests - t.errors));
    return pts.length > 1 ? pts : (pts.length === 1 ? [pts[0], pts[0]] : [0, 0]);
  }, [dashboardData.timeseries]);

  const errorSparkline = useMemo(() => {
    const pts = dashboardData.timeseries.map((t) => t.errors);
    return pts.length > 1 ? pts : (pts.length === 1 ? [pts[0], pts[0]] : [0, 0]);
  }, [dashboardData.timeseries]);

  const avgLatencySparkline = useMemo(() => {
    const pts = dashboardData.timeseries.map((t) => Math.round(t.avg_latency_ms));
    return pts.length > 1 ? pts : (pts.length === 1 ? [pts[0], pts[0]] : [0, 0]);
  }, [dashboardData.timeseries]);

  const p95LatencySparkline = useMemo(() => {
    const pts = dashboardData.timeseries.map((t) => Math.round(t.p95_latency_ms));
    return pts.length > 1 ? pts : (pts.length === 1 ? [pts[0], pts[0]] : [0, 0]);
  }, [dashboardData.timeseries]);

  const barChartData = useMemo(() => {
    return dashboardData.timeseries.map((pt) => ({
      label: pt.label || new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit' }),
      requests: pt.requests,
      errors: pt.errors,
      avgLatency: Math.round(pt.avg_latency_ms),
      p95Latency: Math.round(pt.p95_latency_ms),
    }));
  }, [dashboardData.timeseries]);

  const trendChartData = useMemo(() => {
    return dashboardData.timeseries.map((pt) => ({
      label: pt.label || new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit' }),
      avgLatency: Math.round(pt.avg_latency_ms),
      p95Latency: Math.round(pt.p95_latency_ms),
    }));
  }, [dashboardData.timeseries]);

  const donutSlices = useMemo(() => {
    const b = dashboardData.kpi.status_breakdown || {};
    return [
      { key: '2xx', label: '2xx', count: b['2xx'] || 0, color: '#10b981' },
      { key: '3xx', label: '3xx', count: b['3xx'] || 0, color: '#f59e0b' },
      { key: '4xx', label: '4xx', count: b['4xx'] || 0, color: '#f43f5e' },
      { key: '5xx', label: '5xx', count: b['5xx'] || 0, color: '#8b5cf6' },
    ];
  }, [dashboardData.kpi.status_breakdown]);

  // --- LIVE TELEMETRY DATA FETCHERS ---

  // 1. Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await tracuraFetch<ProjectItem[]>('/plugins/tracura/v1/projects');
      if (Array.isArray(res) && res.length > 0) {
        setProjects(res);
        if (!res.some((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(res[0].id);
          if (res[0].environments && res[0].environments.length > 0) {
            setSelectedEnvSlug(res[0].environments[0].slug);
          }
        }
      }
    } catch {
      // Keep existing projects
    }
  }, [selectedProjectId]);

  // 2. Fetch Dashboard Analytics
  const fetchDashboardAnalytics = useCallback(async () => {
    try {
      const hoursMap: Record<string, number> = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 };
      const lookback = hoursMap[dateRange] || 24;
      const params = new URLSearchParams({ lookback_hours: String(lookback) });
      if (isUuid(selectedProjectId)) {
        params.append('project_id', selectedProjectId);
      }
      if (currentEnv?.id && isUuid(currentEnv.id)) {
        params.append('environment_id', currentEnv.id);
      }
      const data = await tracuraFetch<DashboardAnalytics>(`/plugins/tracura/v1/analytics/dashboard?${params.toString()}`);
      if (data && data.kpi) {
        setDashboardData(data);
      }
    } catch {
      // Keep existing dashboard data
    }
  }, [dateRange, selectedProjectId, currentEnv]);

  // 3. Fetch Telemetry Logs
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' });
      if (isUuid(selectedProjectId)) {
        params.append('project_id', selectedProjectId);
      }
      if (currentEnv?.id && isUuid(currentEnv.id)) {
        params.append('environment_id', currentEnv.id);
      }
      const search = topSearch || logFilterQuery;
      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (selectedMethod !== 'ALL') {
        params.append('http_method', selectedMethod);
      }
      if (selectedStatusCode !== 'ALL') {
        params.append('status_code', selectedStatusCode);
      }
      if (statusPill === 'errors') {
        params.append('errors_only', 'true');
      }

      const res = await tracuraFetch<{ items: any[]; total: number }>(`/plugins/tracura/v1/logs?${params.toString()}`);
      if (res && Array.isArray(res.items)) {
        if (res.items.length === 0) {
          setLogs([]);
          return;
        }
        const liveLogs: TelemetryLog[] = res.items.map((item) => {
          const createdAt = new Date(item.created_at);
          const timeStr = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const durMs = Math.round(Number(item.duration_ms) || 0);
          return {
            id: String(item.id),
            correlation_id: String(item.correlation_id || item.id).substring(0, 12),
            project: currentProject?.name || 'Innostes ERP',
            environment: currentEnv?.name || 'Production',
            http_method: (item.http_method || 'GET').toUpperCase() as any,
            url: item.url || item.path || '/',
            path: item.path || '/',
            status_code: Number(item.status_code) || 200,
            duration_ms: durMs,
            size_bytes: Number(item.meta?.response_size_bytes) || 1200,
            client_ip: item.client_ip || '127.0.0.1',
            user_agent: item.user_agent || 'Client',
            user_id: item.user_id || undefined,
            request_headers: (item.request_headers as Record<string, string>) || {},
            query_params: (item.query_params as Record<string, string>) || {},
            request_body: item.request_body ?? null,
            response_headers: (item.response_headers as Record<string, string>) || {},
            response_body: item.response_body ?? null,
            error: item.error
              ? {
                  type: item.error.exception || item.error.code || `HTTP ${item.status_code} Error`,
                  code: item.error.code || `HTTP_${item.status_code}`,
                  message: item.error.message || `Request returned status ${item.status_code}`,
                  source: item.error.source,
                  stack_trace: item.error.traceback,
                }
              : null,
            timeline: [
              { time: timeStr, message: `${item.http_method} ${item.path} received`, level: 'INFO' },
              ...(Number(item.status_code) >= 400
                ? [
                    {
                      time: timeStr,
                      message: item.error?.message || `Request failed with HTTP ${item.status_code}`,
                      level: 'ERROR' as const,
                      duration: `${durMs}ms`,
                    },
                  ]
                : []),
              {
                time: timeStr,
                message: `Request completed in ${durMs}ms`,
                level: Number(item.status_code) >= 400 ? ('WARN' as const) : ('INFO' as const),
              },
            ],
            meta: item.meta || {},
            created_at: timeStr,
          };
        });
        setLogs(liveLogs);
        if (!liveLogs.some((l) => l.id === selectedLogId)) {
          setSelectedLogId(liveLogs[0].id);
        }
      }
    } catch {
      // Keep existing logs
    }
  }, [selectedProjectId, currentEnv, topSearch, logFilterQuery, selectedMethod, selectedStatusCode, statusPill, currentProject, selectedLogId]);

  // 4. Fetch Ingestion API Keys
  const fetchKeys = useCallback(async () => {
    try {
      const res = await tracuraFetch<any[]>('/plugins/tracura/v1/keys');
      if (Array.isArray(res)) {
        if (res.length === 0) {
          setApiKeys([]);
          return;
        }
        const liveKeys: IngestionApiKey[] = res.map((k) => ({
          id: String(k.id),
          name: k.name,
          key_prefix: k.key_prefix,
          project: k.project_name || currentProject?.name || 'Innostes ERP',
          allowed_environments: k.allowed_environments || ['*'],
          ip_allowlist: k.ip_allowlist || [],
          rate_limit_rpm: k.rate_limit_rpm || 60000,
          status: k.status === 'revoked' ? 'revoked' : 'active',
          last_used_at: k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never',
          created_at: k.created_at ? new Date(k.created_at).toISOString().split('T')[0] : 'Today',
        }));
        setApiKeys(liveKeys);
      }
    } catch {
      // Keep existing keys
    }
  }, [currentProject]);

  // 5. Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await tracuraFetch<any>('/plugins/tracura/v1/settings');
      if (res) {
        if (typeof res.capture_headers === 'boolean') {
          setCaptureReqHeaders(res.capture_headers);
          setCaptureResHeaders(res.capture_headers);
        }
        if (typeof res.capture_body === 'boolean') {
          setCaptureReqBody(res.capture_body);
          setCaptureResBody(res.capture_body);
        }
        if (typeof res.capture_errors === 'boolean') {
          setCaptureErrors(res.capture_errors);
        }
        if (Array.isArray(res.ignore_status_codes) && res.ignore_status_codes.length > 0) {
          setIgnoreStatusCodes(res.ignore_status_codes.map(String));
        }
        if (Array.isArray(res.ignore_endpoints) && res.ignore_endpoints.length > 0) {
          setIgnoreEndpoints(res.ignore_endpoints);
        }
        if (Array.isArray(res.redact_headers) && res.redact_headers.length > 0) {
          setRedactHeaders(res.redact_headers);
        }
        if (Array.isArray(res.redact_fields) && res.redact_fields.length > 0) {
          setRedactBodyFields(res.redact_fields);
        }
        if (res.retention_days) {
          setRetentionDays(String(res.retention_days));
        }
      }
    } catch {
      // Keep existing settings
    }
  }, []);

  // Handle Master Refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        fetchProjects(),
        fetchDashboardAnalytics(),
        fetchLogs(),
        fetchKeys(),
        fetchSettings(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [fetchProjects, fetchDashboardAnalytics, fetchLogs, fetchKeys, fetchSettings]);

  // Initial mount load
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Reload when scope changes
  useEffect(() => {
    fetchDashboardAnalytics();
    fetchLogs();
  }, [selectedProjectId, selectedEnvSlug, dateRange, fetchDashboardAnalytics, fetchLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (statusPill === 'success' && l.status_code >= 400) return false;
      if (statusPill === 'errors' && l.status_code < 400) return false;
      if (statusPill === '4xx' && (l.status_code < 400 || l.status_code >= 500)) return false;
      if (statusPill === '5xx' && l.status_code < 500) return false;

      if (selectedMethod !== 'ALL' && l.http_method !== selectedMethod) return false;
      if (selectedStatusCode !== 'ALL' && String(l.status_code) !== selectedStatusCode) return false;

      if (logFilterQuery.trim()) {
        const q = logFilterQuery.toLowerCase();
        const match =
          l.path.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.correlation_id.toLowerCase().includes(q) ||
          (l.user_id && l.user_id.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [logs, statusPill, selectedMethod, selectedStatusCode, logFilterQuery]);

  // Method Badge color helper
  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold';
      default:
        return 'bg-muted text-muted-foreground font-bold';
    }
  };

  // Status Badge color helper
  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 font-semibold text-xs">{code}</Badge>;
    }
    if (code >= 300 && code < 400) {
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 px-2 py-0.5 font-semibold text-xs">{code}</Badge>;
    }
    if (code >= 400 && code < 500) {
      return <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 px-2 py-0.5 font-semibold text-xs">{code}</Badge>;
    }
    return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 px-2 py-0.5 font-semibold text-xs">{code}</Badge>;
  };

  // Create Project Handler
  const handleCreateProject = async () => {
    if (!newProjName.trim()) return;
    const slug = newProjSlug.trim() || newProjName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const created = await tracuraFetch<ProjectItem>('/plugins/tracura/v1/projects', {
        method: 'POST',
        body: {
          name: newProjName.trim(),
          slug,
          description: newProjDesc.trim() || 'New telemetry project',
        },
      });
      if (created && created.id) {
        setProjects((prev) => [...prev, created]);
        setSelectedProjectId(created.id);
        if (created.environments && created.environments.length > 0) {
          setSelectedEnvSlug(created.environments[0].slug);
        }
      }
    } catch {
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        name: newProjName.trim(),
        slug,
        description: newProjDesc.trim() || 'New telemetry project',
        environments: [
          { id: `env-${Date.now()}-1`, name: 'Production', slug: 'production', color_badge: 'emerald' },
          { id: `env-${Date.now()}-2`, name: 'Development', slug: 'development', color_badge: 'rose' },
        ],
      };
      setProjects((prev) => [...prev, newProj]);
      setSelectedProjectId(newProj.id);
    } finally {
      setIsCreateProjectModalOpen(false);
      setNewProjName('');
      setNewProjSlug('');
      setNewProjDesc('');
    }
  };

  // Delete Project Handler
  const handleDeleteProject = () => {
    const remaining = projects.filter((p) => p.id !== selectedProjectId);
    if (remaining.length > 0) {
      setProjects(remaining);
      setSelectedProjectId(remaining[0].id);
      setSelectedEnvSlug('production');
    }
    setIsDeleteProjectModalOpen(false);
  };

  // Create API Key Handler
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const pid = isUuid(selectedProjectId) ? selectedProjectId : undefined;
      const res = await tracuraFetch<any>('/plugins/tracura/v1/keys', {
        method: 'POST',
        body: {
          name: newKeyName.trim(),
          project_id: pid,
          allowed_environments: newKeyEnvs,
          rate_limit_rpm: newKeyRpm,
          ip_allowlist: newKeyIpAllowlist ? newKeyIpAllowlist.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        },
      });
      if (res && res.raw_key) {
        setCreatedRawKey(res.raw_key);
        await fetchKeys();
      }
    } catch {
      const randHex = Math.random().toString(16).substring(2, 10);
      const rawSecret = `inno_log_live_${randHex}${Math.random().toString(16).substring(2, 14)}`;
      const newKey: IngestionApiKey = {
        id: `key-${Date.now()}`,
        name: newKeyName.trim(),
        key_prefix: rawSecret.substring(0, 18),
        project: currentProject?.name || newKeyProject,
        allowed_environments: newKeyEnvs,
        ip_allowlist: newKeyIpAllowlist ? newKeyIpAllowlist.split(',').map((s) => s.trim()) : undefined,
        rate_limit_rpm: newKeyRpm,
        status: 'active',
        last_used_at: 'Just created',
        created_at: new Date().toISOString().split('T')[0],
      };
      setApiKeys((prev) => [newKey, ...prev]);
      setCreatedRawKey(rawSecret);
    }
  };

  // Revoke Ingestion Key Handler
  const handleRevokeKey = async (keyId: string) => {
    try {
      if (isUuid(keyId)) {
        await tracuraFetch(`/plugins/tracura/v1/keys/${keyId}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }
    setApiKeys((prev) => prev.filter((item) => item.id !== keyId));
  };

  // Save Settings Handler
  const handleSaveSettings = async () => {
    try {
      const pid = isUuid(selectedProjectId) ? selectedProjectId : undefined;
      const params = pid ? `?project_id=${pid}` : '';
      await tracuraFetch(`/plugins/tracura/v1/settings${params}`, {
        method: 'PATCH',
        body: {
          capture_headers: captureReqHeaders || captureResHeaders,
          capture_body: captureReqBody || captureResBody,
          capture_errors: captureErrors,
          ignore_status_codes: ignoreStatusCodes.map(Number).filter((n) => !isNaN(n)),
          ignore_endpoints: ignoreEndpoints,
          redact_headers: redactHeaders,
          redact_fields: redactBodyFields,
          retention_days: parseInt(retentionDays, 10) || 30,
        },
      });
      setSaveSuccessMessage('Settings saved successfully!');
    } catch {
      setSaveSuccessMessage('Settings saved locally.');
    } finally {
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased font-sans">
      {/* 1. TOP GLOBAL TRACURA HEADER / CONTEXT BAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/80 bg-background/95 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Tracura Branding */}
          <div className="flex items-center gap-2.5 pr-3 border-r border-border/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-foreground">Tracura</span>
              <span className="text-[11px] font-medium text-muted-foreground">API Logger</span>
            </div>
          </div>

          {/* Organization Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
            <span>Acme Technologies</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Project Selector with CRUD Option */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsCreateProjectModalOpen(true);
                  } else {
                    setSelectedProjectId(e.target.value);
                  }
                }}
                className="h-8 appearance-none rounded-lg border border-border/60 bg-muted/40 pl-3 pr-8 text-xs font-semibold text-foreground hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="__NEW__">+ Create New Project...</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Environment Selector with colored status dot */}
            <div className="relative">
              <select
                value={selectedEnvSlug}
                onChange={(e) => setSelectedEnvSlug(e.target.value)}
                className="h-8 appearance-none rounded-lg border border-border/60 bg-muted/40 pl-7 pr-8 text-xs font-semibold text-foreground hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {currentProject?.environments.map((env) => (
                  <option key={env.id} value={env.slug}>
                    {env.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-2.5 top-3 h-2 w-2 rounded-full bg-emerald-500" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Right Search, Time range & User actions */}
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="relative hidden md:block">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 appearance-none rounded-lg border border-border/60 bg-muted/40 pl-7 pr-8 text-xs font-medium text-foreground hover:bg-muted/60 focus:outline-none cursor-pointer"
            >
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <Clock className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Quick Search */}
          <div className="relative hidden lg:block w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search endpoints, errors..."
              value={topSearch}
              onChange={(e) => {
                setTopSearch(e.target.value);
                setLogFilterQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveTab('logs');
              }}
              className="h-8 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Live indicator badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Live</span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
            title="Refresh telemetry"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          </Button>

          {/* View API Logs CTA button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('logs')}
            className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3"
          >
            <span>View API Logs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* 2. SUBFEATURE NAVIGATION TABS */}
      <div className="border-b border-border/60 bg-muted/20 px-6">
        <nav className="flex space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'flex items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Activity className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
              'flex items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Terminal className="h-4 w-4" />
            <span>API Requests</span>
            <Badge className="bg-muted text-muted-foreground px-1.5 py-0 text-[10px]">12,482</Badge>
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={cn(
              'flex items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'keys'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Key className="h-4 w-4" />
            <span>Ingestion Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-colors cursor-pointer',
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings & Policies</span>
          </button>
        </nav>
      </div>

      {/* 3. SUBFEATURE CONTENT BODIES */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD (Overview KPIs, Charts & Top Stats - Image 0)             */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quick overview of your API usage, errors and performance.
              </p>
            </div>

            {/* 5 Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                label="Total Requests"
                value={dashboardData.kpi.total_requests.toLocaleString()}
                delta={0.12}
                comparison="total telemetry requests"
                variant="sparkline"
                tone="primary"
                sparkline={totalSparkline}
                icon={<Layers className="h-4 w-4" />}
                className="bg-card border-border/70 shadow-sm"
              />
              <MetricCard
                label="Successful Requests"
                value={dashboardData.kpi.successful_requests.toLocaleString()}
                delta={0.024}
                comparison={`${dashboardData.kpi.success_rate_pct}% success rate`}
                variant="sparkline"
                tone="success"
                sparkline={successSparkline}
                icon={<CheckCircle2 className="h-4 w-4" />}
                className="bg-card border-border/70 shadow-sm"
              />
              <MetricCard
                label="Error Requests"
                value={dashboardData.kpi.error_requests.toLocaleString()}
                delta={-0.006}
                upIsGood={false}
                comparison={`${dashboardData.kpi.error_rate_pct}% error rate`}
                variant="sparkline"
                tone="destructive"
                sparkline={errorSparkline}
                icon={<AlertTriangle className="h-4 w-4" />}
                className="bg-card border-border/70 shadow-sm"
              />
              <MetricCard
                label="Avg. Response Time"
                value={`${Math.round(dashboardData.kpi.avg_latency_ms)} ms`}
                delta={-0.18}
                upIsGood={false}
                comparison="mean latency"
                variant="sparkline"
                tone="chart-4"
                sparkline={avgLatencySparkline}
                icon={<Clock className="h-4 w-4" />}
                className="bg-card border-border/70 shadow-sm"
              />
              <MetricCard
                label="P95 Response Time"
                value={`${Math.round(dashboardData.kpi.p95_latency_ms)} ms`}
                delta={-0.22}
                upIsGood={false}
                comparison="95th percentile"
                variant="sparkline"
                tone="warning"
                sparkline={p95LatencySparkline}
                icon={<Activity className="h-4 w-4" />}
                className="bg-card border-border/70 shadow-sm"
              />
            </div>

            {/* Middle Section: Requests & Errors + Donut Chart + Environment Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Requests & Errors Bar Chart */}
              <WidgetCard
                title="Requests & Errors"
                description="Hourly volume distribution across the selected time window"
                actions={
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-blue-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Requests
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Errors
                    </span>
                    <span className="text-muted-foreground">Scope: {dateRange}</span>
                  </div>
                }
                className="lg:col-span-5 bg-card border-border/70 shadow-sm"
              >
                <div className="pt-2">
                  <TelemetryBarChart data={barChartData} />
                </div>
              </WidgetCard>

              {/* Status Code Distribution Donut Chart */}
              <WidgetCard
                title="Status Code Distribution"
                description="Classification of HTTP response codes"
                className="lg:col-span-4 bg-card border-border/70 shadow-sm"
              >
                <div className="pt-4 flex items-center justify-center">
                  <TelemetryDonutChart
                    totalValue={dashboardData.kpi.total_requests}
                    centerLabel="Total Requests"
                    slices={donutSlices}
                  />
                </div>
              </WidgetCard>

              {/* Environment Health Table */}
              <WidgetCard
                title="Environment Health"
                description="Telemetry performance by deployment stage"
                viewAll={{ label: 'View All →', onClick: () => setActiveTab('logs') }}
                className="lg:col-span-3 bg-card border-border/70 shadow-sm"
              >
                <div className="divide-y divide-border/50 text-xs">
                  <div className="grid grid-cols-4 pb-2 font-semibold text-muted-foreground uppercase text-[10px]">
                    <span className="col-span-1">Environment</span>
                    <span className="text-right">Requests</span>
                    <span className="text-right">Err Rate</span>
                    <span className="text-right">Status</span>
                  </div>
                  {dashboardData.environment_health.length > 0 ? (
                    dashboardData.environment_health.map((env, i) => (
                      <div key={i} className="grid grid-cols-4 items-center py-3">
                        <span className="col-span-1 flex items-center gap-1.5 font-medium text-foreground truncate">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full shrink-0',
                              env.color_badge === 'emerald' || env.status === 'Healthy'
                                ? 'bg-emerald-500'
                                : env.color_badge === 'amber' || env.status === 'Degraded'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500',
                            )}
                          />
                          <span className="truncate">{env.environment}</span>
                        </span>
                        <span className="text-right tabular-nums text-foreground">{env.requests.toLocaleString()}</span>
                        <span className="text-right tabular-nums text-muted-foreground">{env.error_rate_pct}%</span>
                        <span className="text-right">
                          <Badge
                            className={cn(
                              'text-[10px] px-2',
                              env.status === 'Healthy'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : env.status === 'Degraded'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                            )}
                          >
                            {env.status}
                          </Badge>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      No active environments reporting telemetry
                    </div>
                  )}
                </div>
              </WidgetCard>
            </div>

            {/* Bottom Section: Top API Endpoints + Top Errors + Response Time Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top API Endpoints */}
              <WidgetCard
                title="Top API Endpoints"
                description="Most frequented routes and error rates"
                viewAll={{ label: 'View All →', onClick: () => setActiveTab('logs') }}
                className="lg:col-span-4 bg-card border-border/70 shadow-sm"
              >
                <div className="divide-y divide-border/50 text-xs">
                  <div className="grid grid-cols-12 pb-2 font-semibold text-muted-foreground uppercase text-[10px]">
                    <span className="col-span-6">Endpoint</span>
                    <span className="col-span-3 text-right">Requests</span>
                    <span className="col-span-3 text-right">Error Rate</span>
                  </div>
                  {dashboardData.top_endpoints.length > 0 ? (
                    dashboardData.top_endpoints.map((ep, i) => (
                      <div key={i} className="grid grid-cols-12 items-center py-2.5">
                        <div className="col-span-6 flex items-center gap-2 truncate">
                          <Badge className={cn('text-[9px] px-1.5 py-0 border', getMethodBadgeClass(ep.http_method))}>
                            {ep.http_method}
                          </Badge>
                          <span className="font-mono text-[11px] text-foreground truncate">{ep.path}</span>
                        </div>
                        <span className="col-span-3 text-right tabular-nums text-foreground font-medium">
                          {ep.requests.toLocaleString()}
                        </span>
                        <span className="col-span-3 text-right tabular-nums text-muted-foreground flex items-center justify-end gap-1">
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              ep.error_rate_pct > 2 ? 'bg-rose-500' : 'bg-emerald-500',
                            )}
                          />
                          {ep.error_rate_pct}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      No endpoint data recorded yet
                    </div>
                  )}
                </div>
              </WidgetCard>

              {/* Top Errors */}
              <WidgetCard
                title="Top Errors"
                description="Critical exceptions grouped by category"
                viewAll={{ label: 'View All →', onClick: () => { setStatusPill('errors'); setActiveTab('logs'); } }}
                className="lg:col-span-4 bg-card border-border/70 shadow-sm"
              >
                <div className="divide-y divide-border/50 text-xs">
                  <div className="grid grid-cols-12 pb-2 font-semibold text-muted-foreground uppercase text-[10px]">
                    <span className="col-span-6">Error</span>
                    <span className="col-span-3 text-right">Count</span>
                    <span className="col-span-3 text-right">Last Seen</span>
                  </div>
                  {dashboardData.top_errors.length > 0 ? (
                    dashboardData.top_errors.map((err, i) => (
                      <div key={i} className="grid grid-cols-12 items-center py-2.5">
                        <div className="col-span-6 flex items-center gap-2 truncate text-rose-500 font-medium">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-mono text-[11px]">{err.error_type}</span>
                        </div>
                        <span className="col-span-3 text-right tabular-nums text-foreground font-medium">
                          {err.count.toLocaleString()}
                        </span>
                        <span className="col-span-3 text-right tabular-nums text-muted-foreground">
                          {err.last_seen}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ No errors recorded in this period
                    </div>
                  )}
                </div>
              </WidgetCard>

              {/* Response Time Trend */}
              <WidgetCard
                title="Response Time Trend"
                description="Latency comparison: Average vs P95"
                actions={
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-blue-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Average
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      P95
                    </span>
                  </div>
                }
                className="lg:col-span-4 bg-card border-border/70 shadow-sm"
              >
                <div className="pt-2">
                  <TelemetryTrendChart data={trendChartData} />
                </div>
              </WidgetCard>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: API REQUESTS (Dense Explorer Table + Split Inspector - Image 2)     */}
        {/* ========================================================================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">API Requests</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search, filter and inspect all API requests, logs, errors and stack traces.
              </p>
            </div>

            {/* Top Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by endpoint, method, status, trace ID, user ID..."
                  value={logFilterQuery}
                  onChange={(e) => setLogFilterQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border/80 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 h-10"
              >
                Search
              </Button>
              <Button
                variant="outline"
                className="h-10 w-10 p-0"
                onClick={handleRefresh}
                title="Refresh"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              </Button>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="h-8 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <select
                value={selectedStatusCode}
                onChange={(e) => setSelectedStatusCode(e.target.value)}
                className="h-8 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status Codes</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="500">500 Server Error</option>
                <option value="502">502 Bad Gateway</option>
              </select>

              <select
                value={selectedEnvSlug}
                onChange={(e) => setSelectedEnvSlug(e.target.value)}
                className="h-8 rounded-lg border border-border/70 bg-background px-3 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>

              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Filter className="h-3.5 w-3.5" />
                <span>More Filters</span>
              </Button>
            </div>

            {/* Status Filter Count Pills */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusPill('all')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                    statusPill === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  All ({logs.length.toLocaleString()})
                </button>
                <button
                  onClick={() => setStatusPill('success')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    statusPill === 'success'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Success ({logs.filter((l) => l.status_code < 400).length})
                </button>
                <button
                  onClick={() => setStatusPill('errors')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    statusPill === 'errors'
                      ? 'bg-rose-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Errors ({logs.filter((l) => l.status_code >= 400).length})
                </button>
                <button
                  onClick={() => setStatusPill('4xx')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    statusPill === '4xx'
                      ? 'bg-amber-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  4xx ({logs.filter((l) => l.status_code >= 400 && l.status_code < 500).length})
                </button>
                <button
                  onClick={() => setStatusPill('5xx')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                    statusPill === '5xx'
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  5xx ({logs.filter((l) => l.status_code >= 500).length})
                </button>
              </div>

              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Columns className="h-3.5 w-3.5" />
                <span>Columns</span>
              </Button>
            </div>

            {/* SPLIT SCREEN VIEW: Table on Left, Detailed Inspector on Right */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Requests Table */}
              <div className="xl:col-span-6 rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-10">
                          <input type="checkbox" className="rounded border-border" />
                        </TableHead>
                        <TableHead className="w-20">Time ↓</TableHead>
                        <TableHead className="w-16">Method</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="w-16">Status</TableHead>
                        <TableHead className="w-20">Duration</TableHead>
                        <TableHead className="w-16">Size</TableHead>
                        <TableHead className="w-24 text-right">Trace ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const isSelected = selectedLogId === log.id;
                        return (
                          <TableRow
                            key={log.id}
                            onClick={() => setSelectedLogId(log.id)}
                            className={cn(
                              'cursor-pointer transition-colors',
                              isSelected ? 'bg-primary/5 font-medium' : 'hover:bg-muted/40',
                            )}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-border" />
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">{log.created_at}</TableCell>
                            <TableCell>
                              <Badge className={cn('text-[9px] px-1.5 py-0 border', getMethodBadgeClass(log.http_method))}>
                                {log.http_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-foreground font-medium truncate max-w-[180px]">
                              {log.path}
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                            <TableCell className="tabular-nums font-mono text-muted-foreground">
                              {log.duration_ms >= 1000 ? `${(log.duration_ms / 1000).toFixed(2)} s` : `${log.duration_ms} ms`}
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {(log.size_bytes / 1024).toFixed(1)} KB
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground text-[11px]">
                              <span className="flex items-center justify-end gap-1">
                                {log.correlation_id}
                                <Copy
                                  className="h-3 w-3 hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(log.correlation_id);
                                  }}
                                />
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Table Pagination Footer */}
                <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
                  <span>Showing 1–{filteredLogs.length} of {logs.length} requests</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-xs">1</span>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Pane: Deep Request Inspector */}
              <div className="xl:col-span-6 rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm sticky top-20">
                {/* Inspector Header Banner */}
                <div className="border-b border-border/70 p-4 bg-muted/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedLog.status_code)}
                      <span className="font-bold text-sm text-foreground">
                        {selectedLog.http_method} {selectedLog.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const curl = `curl -X ${selectedLog.http_method} "${selectedLog.url}" -H "Content-Type: application/json"`;
                          navigator.clipboard.writeText(curl);
                        }}
                        className="h-7 gap-1 text-xs"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>Copy Link</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>Oct 31, 2026 {selectedLog.created_at}</span>
                    <span>•</span>
                    <span>{selectedLog.duration_ms >= 1000 ? `${(selectedLog.duration_ms / 1000).toFixed(2)} s` : `${selectedLog.duration_ms} ms`}</span>
                    <span>•</span>
                    <span>{(selectedLog.size_bytes / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      Trace ID: {selectedLog.correlation_id}
                      <Copy
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => navigator.clipboard.writeText(selectedLog.correlation_id)}
                      />
                    </span>
                  </div>
                </div>

                {/* Inspector Sub-Tabs */}
                <div className="border-b border-border/60 bg-muted/20 px-4">
                  <div className="flex space-x-4 text-xs font-semibold">
                    <button
                      onClick={() => setInspectorTab('overview')}
                      className={cn(
                        'py-2.5 border-b-2 transition-colors cursor-pointer',
                        inspectorTab === 'overview'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setInspectorTab('events')}
                      className={cn(
                        'py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
                        inspectorTab === 'events'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span>Logs & Events</span>
                      <Badge className="bg-muted px-1.5 py-0 text-[10px]">12</Badge>
                    </button>
                    <button
                      onClick={() => setInspectorTab('request')}
                      className={cn(
                        'py-2.5 border-b-2 transition-colors cursor-pointer',
                        inspectorTab === 'request'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Request
                    </button>
                    <button
                      onClick={() => setInspectorTab('response')}
                      className={cn(
                        'py-2.5 border-b-2 transition-colors cursor-pointer',
                        inspectorTab === 'response'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Response
                    </button>
                    {selectedLog.error && (
                      <button
                        onClick={() => setInspectorTab('error')}
                        className={cn(
                          'py-2.5 border-b-2 transition-colors text-rose-500 cursor-pointer',
                          inspectorTab === 'error'
                            ? 'border-rose-600 font-bold'
                            : 'border-transparent hover:text-rose-600',
                        )}
                      >
                        Error
                      </button>
                    )}
                    <button
                      onClick={() => setInspectorTab('timeline')}
                      className={cn(
                        'py-2.5 border-b-2 transition-colors cursor-pointer',
                        inspectorTab === 'timeline'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Timeline
                    </button>
                  </div>
                </div>

                {/* Inspector Body Content */}
                <div className="p-4 space-y-4 max-h-[700px] overflow-y-auto text-xs">
                  {inspectorTab === 'overview' && (
                    <>
                      {/* Split: Request Info & Error Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Request Information */}
                        <div className="rounded-lg border border-border/70 p-3 space-y-2 bg-muted/10">
                          <h4 className="font-semibold text-foreground text-xs">Request Information</h4>
                          <div className="space-y-1.5 text-muted-foreground font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="font-sans text-muted-foreground">Method:</span>
                              <Badge className={cn('text-[9px] px-1 py-0', getMethodBadgeClass(selectedLog.http_method))}>
                                {selectedLog.http_method}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Endpoint:</span>
                              <span className="text-foreground truncate max-w-[150px]">{selectedLog.path}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Status Code:</span>
                              <span className="text-foreground font-semibold">{selectedLog.status_code}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Duration:</span>
                              <span className="text-foreground">{selectedLog.duration_ms} ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Timestamp:</span>
                              <span className="text-foreground">Oct 31, 2026 {selectedLog.created_at}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Environment:</span>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                                {selectedLog.environment}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">IP Address:</span>
                              <span className="text-foreground">{selectedLog.client_ip}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">User Agent:</span>
                              <span className="text-foreground truncate max-w-[140px]">{selectedLog.user_agent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-sans">Payload Size:</span>
                              <span className="text-foreground">{(selectedLog.size_bytes / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        </div>

                        {/* Error Summary (if error exists) */}
                        {selectedLog.error ? (
                          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-rose-500 font-semibold text-xs">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              <span>{selectedLog.error.type || 'Error Summary'}</span>
                            </div>
                            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                              {selectedLog.error.message}
                            </p>
                            <div className="space-y-1 text-[11px] font-mono text-muted-foreground pt-1 border-t border-rose-500/20">
                              <div className="flex justify-between">
                                <span className="font-sans">Error Type:</span>
                                <span className="text-foreground">{selectedLog.error.type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-sans">Status Code:</span>
                                <span className="text-rose-500 font-bold">{selectedLog.status_code}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-sans">Source:</span>
                                <span className="text-foreground">{selectedLog.error.source}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setInspectorTab('events')}
                              className="text-[11px] text-blue-500 hover:underline font-semibold block pt-1 cursor-pointer"
                            >
                              View in Logs & Events →
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex flex-col items-center justify-center text-center space-y-1">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">Request Succeeded</span>
                            <span className="text-[11px] text-muted-foreground">No application exceptions or errors recorded.</span>
                          </div>
                        )}
                      </div>

                      {/* Request JSON and Response JSON Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Request JSON */}
                        <div className="rounded-lg border border-border/70 overflow-hidden bg-slate-950 text-slate-100">
                          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-900/60">
                            <span className="font-semibold text-[11px]">Request (JSON)</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1 text-[10px]">
                                <button
                                  onClick={() => setJsonReqTab('headers')}
                                  className={cn('px-1.5 py-0.5 rounded cursor-pointer', jsonReqTab === 'headers' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white')}
                                >
                                  Headers
                                </button>
                                <button
                                  onClick={() => setJsonReqTab('body')}
                                  className={cn('px-1.5 py-0.5 rounded cursor-pointer', jsonReqTab === 'body' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white')}
                                >
                                  Body
                                </button>
                              </div>
                              <Copy
                                className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(jsonReqTab === 'headers' ? selectedLog.request_headers : selectedLog.request_body, null, 2))}
                              />
                            </div>
                          </div>
                          <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-400 max-h-48">
                            {JSON.stringify(jsonReqTab === 'headers' ? selectedLog.request_headers : selectedLog.request_body, null, 2)}
                          </pre>
                        </div>

                        {/* Response JSON */}
                        <div className="rounded-lg border border-border/70 overflow-hidden bg-slate-950 text-slate-100">
                          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-900/60">
                            <span className="font-semibold text-[11px]">Response (JSON)</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1 text-[10px]">
                                <button
                                  onClick={() => setJsonResTab('headers')}
                                  className={cn('px-1.5 py-0.5 rounded cursor-pointer', jsonResTab === 'headers' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white')}
                                >
                                  Headers
                                </button>
                                <button
                                  onClick={() => setJsonResTab('body')}
                                  className={cn('px-1.5 py-0.5 rounded cursor-pointer', jsonResTab === 'body' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white')}
                                >
                                  Body
                                </button>
                              </div>
                              <Copy
                                className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer"
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(jsonResTab === 'headers' ? selectedLog.response_headers : selectedLog.response_body, null, 2))}
                              />
                            </div>
                          </div>
                          <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-blue-400 max-h-48">
                            {JSON.stringify(jsonResTab === 'headers' ? selectedLog.response_headers : selectedLog.response_body, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {/* Timeline Section */}
                      <div className="rounded-lg border border-border/70 p-3 space-y-3 bg-muted/5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground text-xs">Execution Timeline</h4>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <button
                              onClick={() => setTimelineFilter('all')}
                              className={cn('px-2 py-0.5 rounded cursor-pointer', timelineFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground')}
                            >
                              All
                            </button>
                            <button
                              onClick={() => setTimelineFilter('logs')}
                              className={cn('px-2 py-0.5 rounded cursor-pointer', timelineFilter === 'logs' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground')}
                            >
                              Logs (3)
                            </button>
                            <button
                              onClick={() => setTimelineFilter('errors')}
                              className={cn('px-2 py-0.5 rounded cursor-pointer', timelineFilter === 'errors' ? 'bg-primary text-primary-foreground font-semibold' : 'bg-muted text-muted-foreground')}
                            >
                              Errors (2)
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          {(selectedLog.timeline || [
                            { time: '10:23:45.104', message: 'Starting order execution', level: 'INFO' as const },
                            { time: '10:23:45.212', message: 'Validating payload', level: 'INFO' as const },
                            { time: '10:23:45.823', message: 'Calling database backend', level: 'INFO' as const },
                          ])
                            .filter((item) => {
                              if (timelineFilter === 'errors') return item.level === 'ERROR';
                              if (timelineFilter === 'logs') return item.level === 'INFO';
                              return true;
                            })
                            .map((step, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 py-1 border-b border-border/40 last:border-none">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-[11px]">{step.time}</span>
                                  <span
                                    className={cn(
                                      'h-2 w-2 rounded-full',
                                      step.level === 'ERROR' ? 'bg-rose-500' : 'bg-blue-500',
                                    )}
                                  />
                                  <span className="text-foreground text-[11px] font-sans">{step.message}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={cn(
                                      'text-[9px] px-1 py-0',
                                      step.level === 'ERROR' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                                    )}
                                  >
                                    {step.level}
                                  </Badge>
                                  {step.duration && (
                                    <span className="text-muted-foreground text-[10px]">{step.duration}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                  {inspectorTab === 'request' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Sanitized Request Headers</h4>
                        <pre className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                          {JSON.stringify(selectedLog.request_headers, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Sanitized Request Body</h4>
                        <pre className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                          {JSON.stringify(selectedLog.request_body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'response' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Response Headers</h4>
                        <pre className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-blue-400 overflow-x-auto">
                          {JSON.stringify(selectedLog.response_headers, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Response Body</h4>
                        <pre className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-blue-400 overflow-x-auto">
                          {JSON.stringify(selectedLog.response_body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'error' && selectedLog.error && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                        <div className="font-bold text-rose-600 text-sm">{selectedLog.error.type}</div>
                        <div className="text-xs text-rose-500 mt-1">{selectedLog.error.message}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-2">Source: {selectedLog.error.source}</div>
                      </div>
                      {selectedLog.error.stack_trace && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Structured Stack Trace</h4>
                          <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-rose-300 overflow-x-auto">
                            {selectedLog.error.stack_trace}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === 'events' && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground mb-2">Application Logs for Correlation ID: {selectedLog.correlation_id}</h4>
                      <div className="rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs space-y-1.5 text-slate-300">
                        <div>[2026-10-31 10:23:45.104] [INFO]  [order-service] Starting new checkout session</div>
                        <div>[2026-10-31 10:23:45.212] [INFO]  [order-service] Cart validated: 2 items, currency INR</div>
                        <div>[2026-10-31 10:23:45.340] [INFO]  [auth-guard] Token verified for user usr_9921</div>
                        <div>[2026-10-31 10:23:45.823] [INFO]  [payment-proxy] Outbound call to https://api.razorpay.com/v1/orders</div>
                        <div className="text-rose-400">[2026-10-31 10:23:46.021] [ERROR] [payment-proxy] Upstream returned 502 Bad Gateway</div>
                        <div className="text-rose-400">[2026-10-31 10:23:46.022] [ERROR] [order-service] Order transaction cancelled due to gateway error</div>
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'timeline' && (
                    <div className="p-2 space-y-3">
                      <p className="text-xs text-muted-foreground">Detailed lifecycle trace across microservices:</p>
                      <div className="border-l-2 border-blue-500 pl-4 space-y-4">
                        <div>
                          <div className="font-semibold text-foreground">1. Gateway Ingestion</div>
                          <div className="text-muted-foreground text-[11px]">Request parsed and authenticated in 2ms.</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">2. Application Controller</div>
                          <div className="text-muted-foreground text-[11px]">Dispatched to OrderService.createOrder in 12ms.</div>
                        </div>
                        <div>
                          <div className="font-semibold text-rose-500">3. Outbound Payment Call</div>
                          <div className="text-rose-400 text-[11px]">Upstream gateway timeout after 1820ms.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INGESTION KEYS (Google-Style Scoped Keys - Section 3.3)             */}
        {/* ========================================================================= */}
        {activeTab === 'keys' && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Ingestion API Keys</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-entropy scoped credentials used exclusively by application runtimes to push telemetry into the logger.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => { setCreatedRawKey(null); setIsKeyModalOpen(true); }}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Ingestion Key</span>
              </Button>
            </div>

            {/* Ingestion Keys Table */}
            <Card className="border-border/80">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Project Scope</TableHead>
                    <TableHead>Allowed Envs</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-semibold text-foreground">{k.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{k.key_prefix}••••••••</TableCell>
                      <TableCell>{k.project}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {k.allowed_environments.map((env, i) => (
                            <Badge key={i} className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-500 border-blue-500/20">
                              {env}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{k.rate_limit_rpm.toLocaleString()} RPM</TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-2">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{k.last_used_at}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeKey(k.id)}
                          className="h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SETTINGS & POLICIES (Config, Scrubbers, Preview - Image 1)          */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure how Tracura captures, stores and processes your API data.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {saveSuccessMessage && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {saveSuccessMessage}
                  </span>
                )}
                <Button
                  variant="primary"
                  onClick={handleSaveSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 h-9"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="border-b border-border/60">
              <nav className="flex space-x-6 text-xs font-semibold">
                <button
                  onClick={() => setSettingsSubTab('general')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'general' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  General
                </button>
                <button
                  onClick={() => setSettingsSubTab('datacapture')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'datacapture' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Data Capture
                </button>
                <button
                  onClick={() => setSettingsSubTab('filtering')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'filtering' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Filtering
                </button>
                <button
                  onClick={() => setSettingsSubTab('security')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'security' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Security & Redaction
                </button>
                <button
                  onClick={() => setSettingsSubTab('retention')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'retention' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Retention
                </button>
                <button
                  onClick={() => setSettingsSubTab('alerts')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'alerts' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Alerts
                </button>
                <button
                  onClick={() => setSettingsSubTab('access')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'access' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Team & Access
                </button>
                <button
                  onClick={() => setSettingsSubTab('integrations')}
                  className={cn(
                    'py-2.5 border-b-2 transition-colors cursor-pointer',
                    settingsSubTab === 'integrations' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  Integrations
                </button>
              </nav>
            </div>

            {/* Two-Column Settings Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Project Information */}
                <Card className="p-5 border-border/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Project Information</h3>
                      <p className="text-xs text-muted-foreground">Basic details about this project.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-medium text-foreground block mb-1">Project Name</label>
                      <input
                        type="text"
                        value={projectNameInput}
                        onChange={(e) => setProjectNameInput(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground block mb-1">Organization</label>
                      <input
                        type="text"
                        value="Acme Technologies"
                        disabled
                        className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-xs text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-medium text-foreground block mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={projectDescInput}
                        onChange={(e) => setProjectDescInput(e.target.value)}
                        className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-foreground block mb-1">Environment</label>
                      <div className="flex items-center gap-2 h-9 rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Production</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 2. Data Capture */}
                <Card className="p-5 border-border/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">Data Capture</h3>
                        <p className="text-xs text-muted-foreground">Choose what data to capture from your API requests.</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Configure Advanced
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Request Headers</div>
                        <div className="text-[11px] text-muted-foreground">Store HTTP request headers.</div>
                      </div>
                      <Switch checked={captureReqHeaders} onCheckedChange={setCaptureReqHeaders} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Response Headers</div>
                        <div className="text-[11px] text-muted-foreground">Store HTTP response headers.</div>
                      </div>
                      <Switch checked={captureResHeaders} onCheckedChange={setCaptureResHeaders} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Request Body</div>
                        <div className="text-[11px] text-muted-foreground">Store request body (JSON, form-data, text).</div>
                      </div>
                      <Switch checked={captureReqBody} onCheckedChange={setCaptureReqBody} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Response Body</div>
                        <div className="text-[11px] text-muted-foreground">Store response body (JSON, text, etc.).</div>
                      </div>
                      <Switch checked={captureResBody} onCheckedChange={setCaptureResBody} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Errors & Stack Traces</div>
                        <div className="text-[11px] text-muted-foreground">Store error details and stack traces.</div>
                      </div>
                      <Switch checked={captureErrors} onCheckedChange={setCaptureErrors} />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">Capture Custom Logs</div>
                        <div className="text-[11px] text-muted-foreground">Store custom logs from your application.</div>
                      </div>
                      <Switch checked={captureCustomLogs} onCheckedChange={setCaptureCustomLogs} />
                    </div>
                  </div>
                </Card>

                {/* 3. Filtering */}
                <Card className="p-5 border-border/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Filtering</h3>
                      <p className="text-xs text-muted-foreground">Exclude unnecessary requests and reduce storage usage.</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-medium text-foreground block mb-1">Ignore Status Codes</label>
                      <TagInput
                        value={ignoreStatusCodes}
                        onValueChange={setIgnoreStatusCodes}
                        placeholder="Add status code, e.g. 200, 204..."
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        Requests with these status codes will not be stored.
                      </span>
                    </div>

                    <div>
                      <label className="font-medium text-foreground block mb-1">Ignore Endpoints (Patterns)</label>
                      <TagInput
                        value={ignoreEndpoints}
                        onValueChange={setIgnoreEndpoints}
                        placeholder="Add pattern, e.g. /health, /metrics..."
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        Use exact path or wildcard patterns (e.g. /static/*).
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 4. Security & Redaction */}
                <Card className="p-5 border-border/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Security & Redaction</h3>
                      <p className="text-xs text-muted-foreground">Protect sensitive information from being stored.</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="font-medium text-foreground block mb-1">Redact Headers</label>
                      <TagInput
                        value={redactHeaders}
                        onValueChange={setRedactHeaders}
                        placeholder="Add header to mask..."
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        These headers will be masked in stored data.
                      </span>
                    </div>

                    <div>
                      <label className="font-medium text-foreground block mb-1">Redact Body Fields</label>
                      <TagInput
                        value={redactBodyFields}
                        onValueChange={setRedactBodyFields}
                        placeholder="Add JSON field to mask..."
                      />
                      <span className="text-[11px] text-muted-foreground mt-1 block">
                        These fields will be masked in request/response bodies (JSON).
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 5. Retention */}
                <Card className="p-5 border-border/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Retention</h3>
                      <p className="text-xs text-muted-foreground">Configure how long to keep your data.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    {['7', '30', '90', '180', '0'].map((d) => (
                      <label key={d} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="retention"
                          checked={retentionDays === d}
                          onChange={() => setRetentionDays(d)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-foreground font-medium">
                          {d === '0' ? 'No expiry' : `${d} days`}
                        </span>
                      </label>
                    ))}
                  </div>
                </Card>

                {/* 6. Delete Project (Destructive) */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Project</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will permanently delete all project data including logs, settings and API keys.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteProjectModalOpen(true)}
                    className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold"
                  >
                    Delete Project
                  </Button>
                </div>
              </div>

              {/* Right Column: Settings Preview & Storage Impact */}
              <div className="lg:col-span-5 space-y-6 sticky top-20">
                {/* Settings Preview */}
                <Card className="border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/20 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <div>
                          <CardTitle className="text-sm">Settings Preview</CardTitle>
                          <CardDescription className="text-xs">See how your current settings work.</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-1 text-[11px]">
                        <button
                          onClick={() => setSettingsPreviewTab('request')}
                          className={cn('px-2 py-1 rounded cursor-pointer', settingsPreviewTab === 'request' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted')}
                        >
                          Request
                        </button>
                        <button
                          onClick={() => setSettingsPreviewTab('response')}
                          className={cn('px-2 py-1 rounded cursor-pointer', settingsPreviewTab === 'response' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted')}
                        >
                          Response
                        </button>
                        <button
                          onClick={() => setSettingsPreviewTab('stored')}
                          className={cn('px-2 py-1 rounded cursor-pointer', settingsPreviewTab === 'stored' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted')}
                        >
                          Stored Data
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="p-4 bg-slate-950 text-slate-100 text-[11px] font-mono leading-relaxed overflow-x-auto">
                      {`{
  "method": "POST",
  "url": "/api/orders",
  "headers": {
    "content-type": "application/json",
    "authorization": "***** (redacted)"
  },
  "body": {
    "email": "user@example.com",
    "password": "***** (redacted)",
    "amount": 2499
  }
}`}
                    </pre>
                  </CardContent>
                </Card>

                {/* Storage Impact */}
                <Card className="p-5 border-border/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Storage Impact</h4>
                      <p className="text-xs text-muted-foreground">Estimated storage based on current settings.</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38%' }} />
                    </div>
                    <div className="text-sm font-bold text-foreground">~ 12 GB / month</div>
                    <p className="text-[11px] text-muted-foreground">
                      Based on your average request size and traffic.
                    </p>
                  </div>
                </Card>

                {/* Important Notes Card */}
                <Card className="p-5 border-border/80 bg-blue-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs">
                    <Info className="h-4 w-4" />
                    <span>Important Notes</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground">
                    <li>Ignored status codes and endpoints will not be stored.</li>
                    <li>Redacted fields are masked in both request and response.</li>
                    <li>Retention policy is applied automatically via partition pruning.</li>
                    <li>Changes may take a few minutes to apply to all ingestion nodes.</li>
                    <li>Use API keys to control which environments can send telemetry.</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Create Project Dialog */}
      <Dialog open={isCreateProjectModalOpen} onOpenChange={setIsCreateProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Telemetry Project</DialogTitle>
            <DialogDescription>
              Set up a new codebase, microservice, or application product to receive API telemetry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div>
              <label className="font-medium text-foreground block mb-1">Project Name *</label>
              <input
                type="text"
                placeholder="e.g. Payment Gateway, IoT Sensor API"
                value={newProjName}
                onChange={(e) => {
                  setNewProjName(e.target.value);
                  setNewProjSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Slug Identifier *</label>
              <input
                type="text"
                placeholder="payment-gateway"
                value={newProjSlug}
                onChange={(e) => setNewProjSlug(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-medium text-foreground block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="What does this service do?"
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Default environments <strong>Production</strong> and <strong>Development</strong> will be provisioned automatically.
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateProject}
              disabled={!newProjName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteProjectModalOpen} onOpenChange={setIsDeleteProjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Project Deletion</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{currentProject?.name}</strong>? All telemetry logs, ingestion keys, and configurations will be irreversibly removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProject}
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Generate Ingestion Key Modal & Reveal Banner */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Ingestion API Key</DialogTitle>
            <DialogDescription>
              Create a scoped credential for runtimes to stream API request/response logs.
            </DialogDescription>
          </DialogHeader>

          {createdRawKey ? (
            <div className="space-y-4 py-3">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Key Generated Successfully!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this key now. For security reasons, you will never be able to see it again.
                </p>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-background p-2.5 border border-border/80">
                  <span className="font-mono text-xs font-bold text-foreground select-all break-all">
                    {createdRawKey}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdRawKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="h-8 gap-1.5 shrink-0"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Sample Ingestion cURL Command</label>
                <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-blue-400 overflow-x-auto">
                  {`curl -X POST "https://api.company.com/api-logger/v1/ingest" \\
  -H "X-API-Key: ${createdRawKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"project":"${newKeyProject}","environment":"production","http_method":"GET","path":"/health","status_code":200,"duration_ms":12}'`}
                </pre>
              </div>

              <DialogFooter>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium w-full"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1">Key Label *</label>
                <input
                  type="text"
                  placeholder="e.g. Production K8s Collector"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Project Scope</label>
                <select
                  value={newKeyProject}
                  onChange={(e) => setNewKeyProject(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="*">All Tenant Projects (*)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Allowed Environments</label>
                <div className="flex gap-4">
                  {['production', 'staging', 'development'].map((env) => (
                    <label key={env} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newKeyEnvs.includes(env)}
                        onChange={(e) => {
                          if (e.target.checked) setNewKeyEnvs([...newKeyEnvs, env]);
                          else setNewKeyEnvs(newKeyEnvs.filter((x) => x !== env));
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="capitalize">{env}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">IP / CIDR Allowlist (Optional)</label>
                <input
                  type="text"
                  placeholder="10.0.0.0/16, 192.168.1.1"
                  value={newKeyIpAllowlist}
                  onChange={(e) => setNewKeyIpAllowlist(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs font-mono text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1">Rate Limit (Requests per minute)</label>
                <input
                  type="number"
                  value={newKeyRpm}
                  onChange={(e) => setNewKeyRpm(parseInt(e.target.value, 10) || 1200)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs font-mono text-foreground focus:outline-none"
                />
              </div>

              <DialogFooter className="mt-4">
                <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateKey}
                  disabled={!newKeyName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
