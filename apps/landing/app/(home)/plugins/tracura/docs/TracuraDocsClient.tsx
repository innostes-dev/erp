'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FastForward,
  Filter,
  Globe,
  Hash,
  Key,
  Layers,
  Lock,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface EndpointSpec {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  category: 'Ingestion' | 'Projects' | 'Environments' | 'Keys' | 'Settings' | 'Logs' | 'Analytics' | 'Info';
  auth: 'API Key or Bearer' | 'Ingestion Key' | 'Public';
  description: string;
  queryParams?: { name: string; type: string; required: boolean; desc: string }[];
  pathParams?: { name: string; type: string; required: boolean; desc: string }[];
  requestBody?: string;
  responseStatus: number;
  responseBody: string;
  curlExample: string;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    id: 'ingest-single',
    method: 'POST',
    path: '/tracura/v1/ingest',
    title: 'Ingest Single Telemetry Log',
    category: 'Ingestion',
    auth: 'Ingestion Key',
    description: 'Ingest a single HTTP request log record into the in-memory ring buffer with sub-millisecond overhead. Automatically executes in-memory PII scrubbing and IP zero-masking before storage.',
    requestBody: JSON.stringify(
      {
        environment: 'production',
        method: 'POST',
        endpoint: '/api/v1/checkout',
        status_code: 200,
        duration_ms: 142.5,
        ip_address: '203.0.113.42',
        trace_id: 'tr-998124',
        request_headers: {
          'content-type': 'application/json',
          authorization: 'Bearer secret_token_here',
        },
        request_body: {
          user_id: 'usr_491',
          cart_total: 8900,
          password: 'super_secret_password',
        },
        response_body: {
          order_id: 'ord_128',
          status: 'success',
        },
        timeline: [
          { name: 'Auth token check', duration_ms: 14.2 },
          { name: 'Database stock hold', duration_ms: 22.8 },
          { name: 'Stripe charge capture', duration_ms: 105.5 },
        ],
      },
      null,
      2
    ),
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        success: true,
        record_id: 'log_90b2184a7e',
        buffered: true,
        scrubbed_fields: ['authorization', 'password'],
      },
      null,
      2
    ),
    curlExample: `curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environment": "production",
    "method": "POST",
    "endpoint": "/api/v1/checkout",
    "status_code": 200,
    "duration_ms": 142.5,
    "ip_address": "203.0.113.42",
    "trace_id": "tr-998124"
  }'`,
  },
  {
    id: 'ingest-batch',
    method: 'POST',
    path: '/tracura/v1/ingest/batch',
    title: 'Bulk Ingest Telemetry Logs',
    category: 'Ingestion',
    auth: 'Ingestion Key',
    description: 'Bulk upload up to 500 telemetry records in a single payload. Ideal for reverse proxy flushers, fluentd / logstash agents, or batch background workers.',
    requestBody: JSON.stringify(
      {
        items: [
          {
            environment: 'production',
            method: 'GET',
            endpoint: '/api/v1/products',
            status_code: 200,
            duration_ms: 45.2,
          },
          {
            environment: 'production',
            method: 'POST',
            endpoint: '/api/v1/orders',
            status_code: 201,
            duration_ms: 180.4,
          },
        ],
      },
      null,
      2
    ),
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        success: true,
        accepted: 2,
        failed: 0,
      },
      null,
      2
    ),
    curlExample: `curl -X POST https://api.yourdomain.com/tracura/v1/ingest/batch \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"items": [{"environment":"production","method":"GET","endpoint":"/api/products","status_code":200,"duration_ms":22.1}]}'`,
  },
  {
    id: 'plugin-info',
    method: 'GET',
    path: '/plugins/tracura/info',
    title: 'Plugin Metadata and Status',
    category: 'Info',
    auth: 'Public',
    description: 'Public health and capabilities inspection endpoint. Returns Tracura plugin version, status, and supported features.',
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        id: 'tracura',
        name: 'Tracura',
        version: '0.1.0',
        status: 'active',
        features: ['universal_telemetry', 'scoped_api_keys', 'pii_redaction', 'async_buffer', 'explorer', 'analytics'],
      },
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/info`,
  },
  {
    id: 'list-projects',
    method: 'GET',
    path: '/plugins/tracura/v1/projects',
    title: 'List All Logging Projects',
    category: 'Projects',
    auth: 'API Key or Bearer',
    description: 'Returns all registered projects for the active tenant. Each project isolates its environments, keys, and log data.',
    responseStatus: 200,
    responseBody: JSON.stringify(
      [
        {
          id: 'proj_ecom_01',
          name: 'E-commerce API',
          slug: 'e-commerce-api',
          description: 'Main customer-facing store backend',
          environments: [
            { id: 'env_prod_01', name: 'Production', slug: 'production', status: 'active' },
            { id: 'env_stag_01', name: 'Staging', slug: 'staging', status: 'active' },
          ],
          created_at: '2026-10-01T10:00:00Z',
        },
      ],
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/projects \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'create-project',
    method: 'POST',
    path: '/plugins/tracura/v1/projects',
    title: 'Create New Project',
    category: 'Projects',
    auth: 'API Key or Bearer',
    description: 'Registers a new logging project with default environments (production, staging, development) automatically seeded.',
    requestBody: JSON.stringify(
      {
        name: 'Mobile Gateway API',
        slug: 'mobile-gateway-api',
        description: 'iOS and Android client telemetry gateway',
      },
      null,
      2
    ),
    responseStatus: 201,
    responseBody: JSON.stringify(
      {
        id: 'proj_mob_99',
        name: 'Mobile Gateway API',
        slug: 'mobile-gateway-api',
        description: 'iOS and Android client telemetry gateway',
        created_at: '2026-10-31T12:00:00Z',
      },
      null,
      2
    ),
    curlExample: `curl -X POST https://api.yourdomain.com/plugins/tracura/v1/projects \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Mobile Gateway API", "slug": "mobile-gateway-api"}'`,
  },
  {
    id: 'get-project',
    method: 'GET',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}',
    title: 'Get Project Details',
    category: 'Projects',
    auth: 'API Key or Bearer',
    description: 'Fetch detailed project information by UUID or unique slug.',
    pathParams: [{ name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' }],
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        id: 'proj_ecom_01',
        name: 'E-commerce API',
        slug: 'e-commerce-api',
        environments: [
          { id: 'env_prod_01', name: 'Production', slug: 'production' },
          { id: 'env_stag_01', name: 'Staging', slug: 'staging' },
        ],
      },
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'patch-project',
    method: 'PATCH',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}',
    title: 'Update Project Metadata',
    category: 'Projects',
    auth: 'API Key or Bearer',
    description: 'Update project title, description, or slug.',
    pathParams: [{ name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' }],
    requestBody: JSON.stringify({ name: 'E-commerce Core Services' }, null, 2),
    responseStatus: 200,
    responseBody: JSON.stringify({ id: 'proj_ecom_01', name: 'E-commerce Core Services' }, null, 2),
    curlExample: `curl -X PATCH https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "E-commerce Core Services"}'`,
  },
  {
    id: 'delete-project',
    method: 'DELETE',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}',
    title: 'Delete Project',
    category: 'Projects',
    auth: 'API Key or Bearer',
    description: 'Permanently deletes project, all associated environments, scoped keys, settings, and collected log records.',
    pathParams: [{ name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' }],
    responseStatus: 200,
    responseBody: JSON.stringify({ success: true, message: 'Project deleted' }, null, 2),
    curlExample: `curl -X DELETE https://api.yourdomain.com/plugins/tracura/v1/projects/proj_old_01 \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'list-environments',
    method: 'GET',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}/environments',
    title: 'List Environments',
    category: 'Environments',
    auth: 'API Key or Bearer',
    description: 'Lists all deployment stages (Production, Staging, QA, Development) defined for a specific project.',
    pathParams: [{ name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' }],
    responseStatus: 200,
    responseBody: JSON.stringify(
      [
        { id: 'env_prod_01', name: 'Production', slug: 'production', status: 'active' },
        { id: 'env_stag_01', name: 'Staging', slug: 'staging', status: 'active' },
      ],
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api/environments \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'create-environment',
    method: 'POST',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}/environments',
    title: 'Create Environment',
    category: 'Environments',
    auth: 'API Key or Bearer',
    description: 'Adds an environment to the target project with dedicated retention and filtering rules.',
    pathParams: [{ name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' }],
    requestBody: JSON.stringify({ name: 'Sandbox QA', slug: 'sandbox-qa' }, null, 2),
    responseStatus: 201,
    responseBody: JSON.stringify({ id: 'env_qa_01', name: 'Sandbox QA', slug: 'sandbox-qa', status: 'active' }, null, 2),
    curlExample: `curl -X POST https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api/environments \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Sandbox QA", "slug": "sandbox-qa"}'`,
  },
  {
    id: 'patch-environment',
    method: 'PATCH',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}/environments/{env_id}',
    title: 'Update Environment',
    category: 'Environments',
    auth: 'API Key or Bearer',
    description: 'Modifies environment attributes or operational status.',
    pathParams: [
      { name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' },
      { name: 'env_id', type: 'string', required: true, desc: 'Environment UUID' },
    ],
    requestBody: JSON.stringify({ name: 'Production (US-East)' }, null, 2),
    responseStatus: 200,
    responseBody: JSON.stringify({ id: 'env_prod_01', name: 'Production (US-East)', slug: 'production' }, null, 2),
    curlExample: `curl -X PATCH https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api/environments/env_prod_01 \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Production (US-East)"}'`,
  },
  {
    id: 'delete-environment',
    method: 'DELETE',
    path: '/plugins/tracura/v1/projects/{project_id_or_slug}/environments/{env_id}',
    title: 'Delete Environment',
    category: 'Environments',
    auth: 'API Key or Bearer',
    description: 'Removes an environment and revokes its scoped ingestion keys.',
    pathParams: [
      { name: 'project_id_or_slug', type: 'string', required: true, desc: 'Project UUID or slug' },
      { name: 'env_id', type: 'string', required: true, desc: 'Environment UUID' },
    ],
    responseStatus: 200,
    responseBody: JSON.stringify({ success: true, message: 'Environment deleted' }, null, 2),
    curlExample: `curl -X DELETE https://api.yourdomain.com/plugins/tracura/v1/projects/e-commerce-api/environments/env_qa_01 \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'list-keys',
    method: 'GET',
    path: '/plugins/tracura/v1/keys',
    title: 'List Scoped Ingestion Keys',
    category: 'Keys',
    auth: 'API Key or Bearer',
    description: 'Lists all active and revoked scoped ingestion keys for the tenant with last-used timestamps.',
    queryParams: [
      { name: 'project_id', type: 'string', required: false, desc: 'Filter keys by project UUID' },
      { name: 'environment_id', type: 'string', required: false, desc: 'Filter keys by environment UUID' },
    ],
    responseStatus: 200,
    responseBody: JSON.stringify(
      [
        {
          id: 'key_prod_881',
          name: 'Kubernetes Cluster Logger',
          key_prefix: 'inno_log_live_prod_99f3',
          project_id: 'proj_ecom_01',
          environment_id: 'env_prod_01',
          allowed_ips: ['10.0.0.0/8', '203.0.113.0/24'],
          is_active: true,
          created_at: '2026-10-15T08:00:00Z',
          last_used_at: '2026-10-31T12:05:00Z',
        },
      ],
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/keys \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'create-key',
    method: 'POST',
    path: '/plugins/tracura/v1/keys',
    title: 'Generate New Scoped Ingestion Key',
    category: 'Keys',
    auth: 'API Key or Bearer',
    description: 'Generates a secure cryptographically random ingestion key (inno_log_live_*). The full raw secret key is only revealed once upon creation.',
    requestBody: JSON.stringify(
      {
        name: 'FastAPI Production Worker',
        project_id: 'proj_ecom_01',
        environment_id: 'env_prod_01',
        allowed_ips: ['10.244.0.0/16', '198.51.100.12'],
      },
      null,
      2
    ),
    responseStatus: 201,
    responseBody: JSON.stringify(
      {
        id: 'key_prod_992',
        name: 'FastAPI Production Worker',
        secret_key: 'inno_log_live_prod_99f38e4a77b1029c0a1b2c3d',
        key_prefix: 'inno_log_live_prod_99f3',
        project_id: 'proj_ecom_01',
        environment_id: 'env_prod_01',
        allowed_ips: ['10.244.0.0/16', '198.51.100.12'],
        created_at: '2026-10-31T12:00:00Z',
      },
      null,
      2
    ),
    curlExample: `curl -X POST https://api.yourdomain.com/plugins/tracura/v1/keys \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "FastAPI Production Worker",
    "project_id": "proj_ecom_01",
    "environment_id": "env_prod_01",
    "allowed_ips": ["10.244.0.0/16"]
  }'`,
  },
  {
    id: 'delete-key',
    method: 'DELETE',
    path: '/plugins/tracura/v1/keys/{key_id}',
    title: 'Revoke Scoped Ingestion Key',
    category: 'Keys',
    auth: 'API Key or Bearer',
    description: 'Immediately invalidates the specified key. Any future ingestion attempts with this key will fail with 401 Unauthorized.',
    pathParams: [{ name: 'key_id', type: 'string', required: true, desc: 'Key UUID to revoke' }],
    responseStatus: 200,
    responseBody: JSON.stringify({ success: true, message: 'Key revoked' }, null, 2),
    curlExample: `curl -X DELETE https://api.yourdomain.com/plugins/tracura/v1/keys/key_prod_992 \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'get-settings',
    method: 'GET',
    path: '/plugins/tracura/v1/settings',
    title: 'Fetch Logging Settings',
    category: 'Settings',
    auth: 'API Key or Bearer',
    description: 'Retrieves active capture switches, exclusion patterns, redacted header and body field tags, and retention window.',
    queryParams: [
      { name: 'project_id', type: 'string', required: false, desc: 'Filter by project UUID' },
      { name: 'environment_id', type: 'string', required: false, desc: 'Filter by environment UUID' },
    ],
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        capture_request_headers: true,
        capture_response_headers: true,
        capture_request_body: true,
        capture_response_body: true,
        capture_errors_and_stacks: true,
        capture_custom_logs: true,
        ignored_status_codes: [200, 201, 204],
        excluded_paths: ['/health', '/metrics', '/favicon.ico', '/static/*'],
        redacted_headers: ['authorization', 'cookie', 'x-api-key', 'set-cookie'],
        redacted_body_fields: ['password', 'token', 'secret', 'credit_card', 'ssn'],
        retention_days: 30,
      },
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/settings \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'patch-settings',
    method: 'PATCH',
    path: '/plugins/tracura/v1/settings',
    title: 'Update Logging Settings',
    category: 'Settings',
    auth: 'API Key or Bearer',
    description: 'Updates data capture switches, ignored status codes, path exclusion patterns, redacted headers, and retention window.',
    requestBody: JSON.stringify(
      {
        retention_days: 90,
        redacted_body_fields: ['password', 'token', 'secret', 'credit_card', 'ssn', 'pin', 'tax_id'],
        ignored_status_codes: [204, 304],
      },
      null,
      2
    ),
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        success: true,
        retention_days: 90,
        redacted_body_fields: ['password', 'token', 'secret', 'credit_card', 'ssn', 'pin', 'tax_id'],
      },
      null,
      2
    ),
    curlExample: `curl -X PATCH https://api.yourdomain.com/plugins/tracura/v1/settings \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"retention_days": 90}'`,
  },
  {
    id: 'get-logs',
    method: 'GET',
    path: '/plugins/tracura/v1/logs',
    title: 'Search and Filter API Logs',
    category: 'Logs',
    auth: 'API Key or Bearer',
    description: 'High-speed query engine searching across millions of indexed logs. Filter by HTTP method, status codes, environments, path patterns, or freeform text.',
    queryParams: [
      { name: 'project_id', type: 'string', required: false, desc: 'Filter by project UUID' },
      { name: 'environment_id', type: 'string', required: false, desc: 'Filter by environment UUID' },
      { name: 'method', type: 'string', required: false, desc: 'HTTP method (GET, POST, PUT, DELETE)' },
      { name: 'status_code', type: 'number', required: false, desc: 'Specific status code (e.g. 500)' },
      { name: 'status_family', type: 'string', required: false, desc: 'Status family (2xx, 4xx, 5xx)' },
      { name: 'q', type: 'string', required: false, desc: 'Search query across endpoint, error, trace ID' },
      { name: 'limit', type: 'number', required: false, desc: 'Page size (default 25, max 100)' },
      { name: 'offset', type: 'number', required: false, desc: 'Pagination offset' },
    ],
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        total: 12482,
        items: [
          {
            id: 'log_90b2184a7e',
            timestamp: '2026-10-31T12:00:00Z',
            method: 'POST',
            endpoint: '/api/orders',
            status_code: 500,
            duration_ms: 1840.0,
            size_kb: 4.2,
            trace_id: 'a1b2c3d4e5',
            environment: 'production',
            error_type: 'PaymentError',
            error_message: 'Payment provider returned 502 Bad Gateway',
          },
        ],
      },
      null,
      2
    ),
    curlExample: `curl -X GET "https://api.yourdomain.com/plugins/tracura/v1/logs?status_family=5xx&limit=10" \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'get-log-detail',
    method: 'GET',
    path: '/plugins/tracura/v1/logs/{log_id}',
    title: 'Get Log Detail by ID',
    category: 'Logs',
    auth: 'API Key or Bearer',
    description: 'Retrieves complete request and response payload JSON, scrubbed headers, error traces, and sub-millisecond execution timeline steps.',
    pathParams: [{ name: 'log_id', type: 'string', required: true, desc: 'Log entry UUID' }],
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        id: 'log_90b2184a7e',
        timestamp: '2026-10-31T12:00:00Z',
        method: 'POST',
        endpoint: '/api/orders',
        status_code: 500,
        duration_ms: 1840.0,
        ip_address: '203.0.113.0',
        user_agent: 'tracura-sdk/1.0.0',
        request_headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ***** (redacted)',
        },
        request_body: {
          customer_id: 'cust_99',
          items: [{ sku: 'SKU-001', qty: 2 }],
        },
        response_body: {
          status: 500,
          error: 'PaymentError',
          message: 'Payment provider returned 502 Bad Gateway',
        },
        timeline: [
          { name: 'Order creation started', duration_ms: 2.1, status: 'info' },
          { name: 'Request validation', duration_ms: 5.4, status: 'info' },
          { name: 'Payment gateway call', duration_ms: 1832.5, status: 'error' },
        ],
      },
      null,
      2
    ),
    curlExample: `curl -X GET https://api.yourdomain.com/plugins/tracura/v1/logs/log_90b2184a7e \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
  {
    id: 'get-analytics-dashboard',
    method: 'GET',
    path: '/plugins/tracura/v1/analytics/dashboard',
    title: 'Retrieve Telemetry Analytics',
    category: 'Analytics',
    auth: 'API Key or Bearer',
    description: 'Retrieves aggregated metrics: Total Requests, Success Rate %, Error Rate %, Avg & P95 latencies, 24-bucket sparkline series, environment health matrix, and top endpoints/errors.',
    queryParams: [
      { name: 'project_id', type: 'string', required: false, desc: 'Filter analytics by project' },
      { name: 'environment_id', type: 'string', required: false, desc: 'Filter analytics by environment' },
      { name: 'time_range', type: 'string', required: false, desc: 'Time range: 1h, 24h, 7d, 30d (default: 24h)' },
    ],
    responseStatus: 200,
    responseBody: JSON.stringify(
      {
        total_requests: 12482,
        successful_requests: 12238,
        error_requests: 244,
        success_rate: 98.2,
        error_rate: 1.8,
        avg_response_time_ms: 243.0,
        p95_response_time_ms: 892.0,
        requests_sparkline: [350, 420, 600, 850, 920, 780, 610, 450],
        status_distribution: { '2xx': 12238, '3xx': 32, '4xx': 96, '5xx': 116 },
        environment_health: [
          { environment: 'Production', requests: 8421, error_rate: 1.2, avg_latency_ms: 243, status: 'healthy' },
          { environment: 'Staging', requests: 3102, error_rate: 2.8, avg_latency_ms: 412, status: 'degraded' },
          { environment: 'Development', requests: 959, error_rate: 3.1, avg_latency_ms: 620, status: 'issues' },
        ],
        top_endpoints: [
          { method: 'POST', endpoint: '/api/orders', requests: 3421, error_rate: 2.4, avg_latency_ms: 412 },
          { method: 'GET', endpoint: '/api/products', requests: 2908, error_rate: 0.3, avg_latency_ms: 86 },
        ],
        top_errors: [
          { error: 'PaymentError', count: 52, last_seen: '2 mins ago' },
          { error: 'ValidationError', count: 38, last_seen: '5 mins ago' },
        ],
      },
      null,
      2
    ),
    curlExample: `curl -X GET "https://api.yourdomain.com/plugins/tracura/v1/analytics/dashboard?time_range=24h" \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c"`,
  },
];

export function TracuraDocsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Ingestion', 'Projects', 'Environments', 'Keys', 'Settings', 'Logs', 'Analytics'];

  const filteredEndpoints = ENDPOINTS.filter((ep) => {
    const matchesCategory = selectedCategory === 'All' || ep.category === selectedCategory;
    const matchesSearch =
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen text-fd-foreground">
      {/* Header Banner */}
      <div className="border-b border-fd-border bg-gradient-to-r from-blue-50/60 via-background to-indigo-50/40 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3">
            <Link href="/plugins/tracura" className="hover:underline flex items-center gap-1">
              <span>Tracura</span>
            </Link>
            <ChevronRight className="size-3 text-fd-muted-foreground" />
            <span>Developer Documentation & REST API Reference</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Tracura Developer Documentation & REST API Reference
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-300 max-w-3xl">
                Comprehensive integration guides, SDK middleware examples, and interactive API documentation for all 20 management & telemetry endpoints.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/plugins/tracura"
                className="inline-flex items-center gap-2 rounded-xl border border-fd-border bg-fd-card px-4 py-2.5 text-xs font-semibold text-fd-foreground hover:bg-fd-muted transition-all"
              >
                <span>Product Overview</span>
              </Link>
              <a
                href="#api-reference"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition-all"
              >
                <Code2 className="size-3.5" />
                <span>Jump to Endpoints ({ENDPOINTS.length})</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Documentation Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-20 space-y-6">
            {/* Quick Jump Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
              <input
                type="text"
                placeholder="Search endpoints or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-fd-border bg-fd-card pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sidebar Guide Links */}
            <div className="rounded-2xl border border-fd-border bg-fd-card p-4 space-y-4 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-fd-muted-foreground">
                Integration Guides
              </div>
              <nav className="flex flex-col space-y-1 text-xs">
                <a
                  href="#overview"
                  className="rounded-lg px-2.5 py-1.5 font-medium text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground transition-colors"
                >
                  Overview & Ring Buffer
                </a>
                <a
                  href="#quickstart"
                  className="rounded-lg px-2.5 py-1.5 font-medium text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground transition-colors"
                >
                  30-Second Quickstart
                </a>
                <a
                  href="#authentication"
                  className="rounded-lg px-2.5 py-1.5 font-medium text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground transition-colors"
                >
                  Universal Authentication
                </a>
                <a
                  href="#middleware-sdks"
                  className="rounded-lg px-2.5 py-1.5 font-medium text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground transition-colors"
                >
                  Framework Middleware (Python, Node, Go)
                </a>
                <a
                  href="#pii-redaction"
                  className="rounded-lg px-2.5 py-1.5 font-medium text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground transition-colors"
                >
                  PII Redaction & GDPR Masking
                </a>
              </nav>

              <div className="pt-3 border-t border-fd-border">
                <div className="text-xs font-bold uppercase tracking-wider text-fd-muted-foreground mb-2">
                  API Endpoints
                </div>
                <div className="flex flex-col space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        selectedCategory === cat
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-70">
                        {cat === 'All'
                          ? ENDPOINTS.length
                          : ENDPOINTS.filter((e) => e.category === cat).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Pane */}
          <main className="lg:col-span-9 space-y-14">
            {/* 1. OVERVIEW & RING BUFFER */}
            <section id="overview" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Cpu className="size-4" />
                <span>Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                How Tracura Telemetry Engine Works
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Traditional logging solutions add unacceptable latency overhead (50-200ms) by executing synchronous HTTP network requests during the active user response lifecycle. Tracura features a <strong>Dual-Ingestion Architecture</strong> backed by a <strong>Hybrid Queue Buffer (Redis with graceful In-Memory Fallback)</strong>, ensuring client requests are never blocked by logging.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="rounded-xl border border-fd-border bg-fd-card p-4">
                  <div className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Zap className="size-3.5" />
                    <span>1. In-Process ASGI Hook</span>
                  </div>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    Direct in-memory capture for host apps in &lt; 0.002ms with zero HTTP loopback.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4">
                  <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    <span>2. External Polyglot Ingest</span>
                  </div>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    Accepts remote batch logs from Node, Go, Python, and cURL via scoped API keys.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4">
                  <div className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Layers className="size-3.5" />
                    <span>3. Hybrid Redis Queue</span>
                  </div>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    Buffers into Redis when configured, with automatic fallback to RAM if offline.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4">
                  <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Database className="size-3.5" />
                    <span>4. Bulk Persistence</span>
                  </div>
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    Background worker flushes batches of up to 100 logs into PostgreSQL in 1 SQL query.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. 30-SECOND QUICKSTART */}
            <section id="quickstart" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <FastForward className="size-4" />
                <span>Quickstart</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Get Started in 30 Seconds
              </h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-fd-border bg-fd-card p-5 space-y-3">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">1</span>
                    <span>Generate an Ingestion Key</span>
                  </div>
                  <p className="text-xs text-fd-muted-foreground">
                    Navigate to <strong className="text-fd-foreground">Tracura &gt; Ingestion Keys</strong> in the dashboard or use <code className="font-mono bg-fd-muted px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">POST /plugins/tracura/v1/keys</code> to generate a scoped key bound to your project and environment.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-5 space-y-3">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">2</span>
                    <span>Send Your First Telemetry Record</span>
                  </div>
                  <div className="rounded-lg bg-slate-950 p-4 text-xs font-mono text-slate-300 overflow-x-auto relative">
                    <button
                      onClick={() =>
                        handleCopy(
                          'quickstart-curl',
                          `curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\\n  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\\n  -H "Content-Type: application/json" \\\n  -d '{"environment":"production","method":"POST","endpoint":"/api/orders","status_code":200,"duration_ms":142.5}'`
                        )
                      }
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {copiedId === 'quickstart-curl' ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                    </button>
                    <pre>{`curl -X POST https://api.yourdomain.com/tracura/v1/ingest \\
  -H "X-API-Key: inno_log_live_prod_99f38e4a77b1029c" \\
  -H "Content-Type: application/json" \\
  -d '{"environment":"production","method":"POST","endpoint":"/api/orders","status_code":200,"duration_ms":142.5}'`}</pre>
                  </div>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-5 space-y-3">
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">3</span>
                    <span>Inspect Instantly on Dashboard & Explorer</span>
                  </div>
                  <p className="text-xs text-fd-muted-foreground">
                    Open your Tracura dashboard to see the real-time sparkline counter tick up, or use the Split Inspector in the API Requests tab to view the formatted request payload and execution timeline.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. UNIVERSAL AUTHENTICATION */}
            <section id="authentication" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Lock className="size-4" />
                <span>Security</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Universal Key-Based Authentication
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                All 20 endpoints of the Tracura system can be authenticated using either scoped API Keys or JWT Access Tokens.
              </p>

              <div className="rounded-xl border border-fd-border bg-fd-card overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-fd-muted/50 text-fd-muted-foreground uppercase text-[10px] tracking-wider border-b border-fd-border">
                    <tr>
                      <th className="px-4 py-3">Header</th>
                      <th className="px-4 py-3">Format</th>
                      <th className="px-4 py-3">Usage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fd-border">
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">X-API-Key</td>
                      <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">inno_log_live_*</td>
                      <td className="px-4 py-3 text-fd-muted-foreground">Universal ingestion and management APIs across any project or script</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Authorization</td>
                      <td className="px-4 py-3 font-mono text-purple-600 dark:text-purple-400">Bearer inno_log_live_*</td>
                      <td className="px-4 py-3 text-fd-muted-foreground">Universal key authorization via standard HTTP Bearer</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-semibold">Authorization</td>
                      <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400">Bearer &lt;jwt_access_token&gt;</td>
                      <td className="px-4 py-3 text-fd-muted-foreground">Browser web application and UI session tokens</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. FRAMEWORK MIDDLEWARE GUIDE */}
            <section id="middleware-sdks" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Code2 className="size-4" />
                <span>Integration Code</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Framework Middleware Implementations
              </h2>

              {/* Python FastAPI Tab */}
              <div className="rounded-2xl border border-fd-border bg-fd-card overflow-hidden">
                <div className="border-b border-fd-border bg-fd-muted/40 px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500" />
                    Python FastAPI (ASGI Middleware)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        'code-py',
                        `from fastapi import FastAPI, Request\nimport time, httpx, asyncio\n\napp = FastAPI()\nTRACURA_URL = "https://api.yourdomain.com/tracura/v1/ingest"\nTRACURA_KEY = "inno_log_live_prod_99f38e4a77b1029c"\n\n@app.middleware("http")\nasync def tracura_middleware(request: Request, call_next):\n    start = time.perf_counter()\n    response = await call_next(request)\n    duration = (time.perf_counter() - start) * 1000.0\n    asyncio.create_task(httpx.AsyncClient().post(TRACURA_URL, json={\n        "environment": "production",\n        "method": request.method,\n        "endpoint": request.url.path,\n        "status_code": response.status_code,\n        "duration_ms": round(duration, 2),\n    }, headers={"X-API-Key": TRACURA_KEY}))\n    return response`
                      )
                    }
                    className="text-xs text-fd-muted-foreground hover:text-fd-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'code-py' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedId === 'code-py' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`from fastapi import FastAPI, Request
import time, httpx, asyncio

app = FastAPI()
TRACURA_URL = "https://api.yourdomain.com/tracura/v1/ingest"
TRACURA_KEY = "inno_log_live_prod_99f38e4a77b1029c"

@app.middleware("http")
async def tracura_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000.0

    # Fire-and-forget asynchronous background post
    asyncio.create_task(
        httpx.AsyncClient().post(
            TRACURA_URL,
            json={
                "environment": "production",
                "method": request.method,
                "endpoint": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "ip_address": request.client.host if request.client else "127.0.0.1",
            },
            headers={"X-API-Key": TRACURA_KEY},
            timeout=1.0,
        )
    )
    return response`}
                </pre>
              </div>

              {/* Node.js Express */}
              <div className="rounded-2xl border border-fd-border bg-fd-card overflow-hidden">
                <div className="border-b border-fd-border bg-fd-muted/40 px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-xs flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Node.js Express / Fastify
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        'code-node',
                        `app.use((req, res, next) => {\n  const start = performance.now();\n  res.on('finish', () => {\n    fetch('https://api.yourdomain.com/tracura/v1/ingest', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.TRACURA_KEY },\n      body: JSON.stringify({\n        environment: 'production',\n        method: req.method,\n        endpoint: req.originalUrl || req.url,\n        status_code: res.statusCode,\n        duration_ms: Math.round(performance.now() - start),\n        ip_address: req.ip,\n      })\n    }).catch(() => {});\n  });\n  next();\n});`
                      )
                    }
                    className="text-xs text-fd-muted-foreground hover:text-fd-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'code-node' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedId === 'code-node' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`app.use((req, res, next) => {
  const start = performance.now();

  res.on('finish', () => {
    const duration_ms = Math.round(performance.now() - start);

    fetch('https://api.yourdomain.com/tracura/v1/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TRACURA_KEY
      },
      body: JSON.stringify({
        environment: 'production',
        method: req.method,
        endpoint: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration_ms,
        ip_address: req.ip || req.socket.remoteAddress,
      })
    }).catch(() => {});
  });

  next();
});`}
                </pre>
              </div>
            </section>

            {/* 5. PII REDACTION & GDPR */}
            <section id="pii-redaction" className="scroll-mt-24 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <Shield className="size-4" />
                <span>Compliance</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                PII Redaction Engine & GDPR Masking
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tracura API Logger enforces in-memory sanitization before data is written to disk or ring buffers:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-fd-border bg-fd-card p-4 space-y-2">
                  <div className="font-semibold text-xs text-blue-600 dark:text-blue-400">Headers Masking</div>
                  <p className="text-xs text-fd-muted-foreground">
                    Automatically scrubs <code className="font-mono bg-fd-muted px-1 rounded">Authorization</code>, <code className="font-mono bg-fd-muted px-1 rounded">Cookie</code>, <code className="font-mono bg-fd-muted px-1 rounded">Set-Cookie</code>, and <code className="font-mono bg-fd-muted px-1 rounded">X-API-Key</code>.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4 space-y-2">
                  <div className="font-semibold text-xs text-purple-600 dark:text-purple-400">Deep JSON Body Scrubbing</div>
                  <p className="text-xs text-fd-muted-foreground">
                    Recursively traverses request and response JSON trees to mask keys containing <code className="font-mono bg-fd-muted px-1 rounded">password</code>, <code className="font-mono bg-fd-muted px-1 rounded">token</code>, <code className="font-mono bg-fd-muted px-1 rounded">secret</code>, <code className="font-mono bg-fd-muted px-1 rounded">ssn</code>, and <code className="font-mono bg-fd-muted px-1 rounded">credit_card</code>.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4 space-y-2">
                  <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">GDPR Client IP Zero-Masking</div>
                  <p className="text-xs text-fd-muted-foreground">
                    Zero-masks the final octet of IPv4 addresses (<code className="font-mono bg-fd-muted px-1 rounded">198.51.100.42</code> &rarr; <code className="font-mono bg-fd-muted px-1 rounded">198.51.100.0</code>) to meet strict GDPR and HIPAA requirements.
                  </p>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card p-4 space-y-2">
                  <div className="font-semibold text-xs text-amber-600 dark:text-amber-400">Automatic Storage Pruning</div>
                  <p className="text-xs text-fd-muted-foreground">
                    Automated background worker purges log records exceeding your configured retention window (7d, 30d, 90d, 180d) to keep storage clean and lightweight.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. COMPLETE API REFERENCE (ALL 20 ENDPOINTS) */}
            <section id="api-reference" className="scroll-mt-24 space-y-8 pt-6 border-t border-fd-border">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Code2 className="size-4" />
                  <span>REST API Reference</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Interactive API Endpoints Reference
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Complete documentation for all {ENDPOINTS.length} Tracura endpoints with request schemas, status codes, and copyable cURL commands.
                </p>
              </div>

              {/* Endpoints List */}
              <div className="space-y-10">
                {filteredEndpoints.map((ep) => (
                  <div
                    key={ep.id}
                    id={ep.id}
                    className="rounded-2xl border border-fd-border bg-fd-card overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                  >
                    {/* Endpoint Header Bar */}
                    <div className="border-b border-fd-border bg-fd-muted/30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-mono font-bold uppercase ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <code className="text-sm font-mono font-semibold text-fd-foreground">
                          {ep.path}
                        </code>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-fd-border bg-fd-background px-2.5 py-1 text-xs text-fd-muted-foreground font-medium flex items-center gap-1.5">
                          <Lock className="size-3" />
                          <span>{ep.auth}</span>
                        </span>
                        <button
                          onClick={() => handleCopy(ep.id, ep.curlExample)}
                          className="rounded-lg border border-fd-border bg-fd-background hover:bg-fd-accent px-2.5 py-1 text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === ep.id ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                          <span>{copiedId === ep.id ? 'Copied cURL' : 'Copy cURL'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Endpoint Content */}
                    <div className="p-5 sm:p-6 space-y-6 text-xs">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{ep.title}</h3>
                        <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                          {ep.description}
                        </p>
                      </div>

                      {/* Path Params */}
                      {ep.pathParams && ep.pathParams.length > 0 && (
                        <div>
                          <div className="font-bold text-[11px] uppercase tracking-wider text-fd-muted-foreground mb-2">
                            Path Parameters
                          </div>
                          <div className="rounded-lg border border-fd-border overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-fd-muted/40 text-[10px] uppercase text-fd-muted-foreground border-b border-fd-border">
                                <tr>
                                  <th className="px-3 py-2">Parameter</th>
                                  <th className="px-3 py-2">Type</th>
                                  <th className="px-3 py-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-fd-border">
                                {ep.pathParams.map((p) => (
                                  <tr key={p.name}>
                                    <td className="px-3 py-2 font-mono font-semibold text-blue-600 dark:text-blue-400">{p.name}</td>
                                    <td className="px-3 py-2 font-mono text-fd-muted-foreground">{p.type}</td>
                                    <td className="px-3 py-2 text-fd-muted-foreground">{p.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Query Params */}
                      {ep.queryParams && ep.queryParams.length > 0 && (
                        <div>
                          <div className="font-bold text-[11px] uppercase tracking-wider text-fd-muted-foreground mb-2">
                            Query Parameters
                          </div>
                          <div className="rounded-lg border border-fd-border overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-fd-muted/40 text-[10px] uppercase text-fd-muted-foreground border-b border-fd-border">
                                <tr>
                                  <th className="px-3 py-2">Parameter</th>
                                  <th className="px-3 py-2">Type</th>
                                  <th className="px-3 py-2">Required</th>
                                  <th className="px-3 py-2">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-fd-border">
                                {ep.queryParams.map((q) => (
                                  <tr key={q.name}>
                                    <td className="px-3 py-2 font-mono font-semibold text-blue-600 dark:text-blue-400">{q.name}</td>
                                    <td className="px-3 py-2 font-mono text-fd-muted-foreground">{q.type}</td>
                                    <td className="px-3 py-2 text-fd-muted-foreground">
                                      {q.required ? (
                                        <span className="text-rose-500 font-bold">Yes</span>
                                      ) : (
                                        'No'
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-fd-muted-foreground">{q.desc}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body & Response Body Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Request Body */}
                        {ep.requestBody && (
                          <div className="space-y-2">
                            <div className="font-bold text-[11px] uppercase tracking-wider text-fd-muted-foreground flex items-center justify-between">
                              <span>Request Body (JSON)</span>
                            </div>
                            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                              {ep.requestBody}
                            </pre>
                          </div>
                        )}

                        {/* Response Body */}
                        <div className={`space-y-2 ${!ep.requestBody ? 'md:col-span-2' : ''}`}>
                          <div className="font-bold text-[11px] uppercase tracking-wider text-fd-muted-foreground flex items-center justify-between">
                            <span>Response ({ep.responseStatus} OK)</span>
                            <span className="text-emerald-500 font-mono">application/json</span>
                          </div>
                          <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                            {ep.responseBody}
                          </pre>
                        </div>
                      </div>

                      {/* Copyable cURL Snippet */}
                      <div className="space-y-2">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-fd-muted-foreground">
                          Example cURL Request
                        </div>
                        <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                          {ep.curlExample}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
