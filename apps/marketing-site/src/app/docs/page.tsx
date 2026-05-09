'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink, Lock, Globe, Copy, Check,
  ChevronLeft, ArrowLeft, Code2, BookOpen,
  Layers, Zap, AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchemaProperty {
  type?: string;
  example?: unknown;
  description?: string;
  $ref?: string;
  items?: { type?: string; $ref?: string };
  minLength?: number;
}

interface OpenAPISchema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

interface OpenAPIResponse {
  description: string;
  content?: {
    'application/json'?: { schema?: { $ref?: string; type?: string } };
  };
}

interface OpenAPIOperation {
  summary: string;
  description?: string;
  operationId: string;
  tags: string[];
  security?: Record<string, string[]>[];
  requestBody?: {
    content: { 'application/json': { schema: { $ref: string } } };
  };
  responses: Record<string, OpenAPIResponse>;
}

interface OpenAPISpec {
  info: { title: string; version: string; description: string };
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components: { schemas: Record<string, OpenAPISchema> };
}

interface FlatEndpoint {
  method: string;
  path: string;
  operation: OpenAPIOperation;
  tag: string;
  id: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  get:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  post:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',    border: 'border-blue-500/30'   },
  put:    { bg: 'bg-amber-500/10',  text: 'text-amber-400',   border: 'border-amber-500/30'  },
  patch:  { bg: 'bg-orange-500/10', text: 'text-orange-400',  border: 'border-orange-500/30' },
  delete: { bg: 'bg-red-500/10',    text: 'text-red-400',     border: 'border-red-500/30'    },
};

const METHOD_BADGE: Record<string, string> = {
  get:    'bg-emerald-500 text-white',
  post:   'bg-blue-500 text-white',
  put:    'bg-amber-500 text-white',
  patch:  'bg-orange-500 text-white',
  delete: 'bg-red-500 text-white',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveRef(ref: string, schemas: Record<string, OpenAPISchema>): OpenAPISchema | null {
  const name = ref.replace('#/components/schemas/', '');
  return schemas[name] ?? null;
}

function buildCurl(method: string, path: string, operation: OpenAPIOperation): string {
  const hasBody = !!operation.requestBody;
  const isAuth = (operation.security?.length ?? 0) > 0;
  const lines: string[] = [`curl -s -X ${method.toUpperCase()} \\`];
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  lines.push(`  '${baseUrl}${path}' \\`);
  lines.push(`  -H 'Content-Type: application/json' \\`);
  if (isAuth) lines.push(`  -H 'Authorization: Bearer <token>' \\`);
  if (hasBody) lines.push(`  -d '{"email":"admin@mono.dev","password":"admin123"}'`);
  else lines[lines.length - 1] = lines[lines.length - 1].replace(' \\', '');
  return lines.join('\n');
}

function buildFetch(method: string, path: string, operation: OpenAPIOperation): string {
  const hasBody = !!operation.requestBody;
  const isAuth = (operation.security?.length ?? 0) > 0;
  const bodyStr = hasBody ? `\n  body: JSON.stringify({\n    email: 'admin@mono.dev',\n    password: 'admin123',\n  }),` : '';
  const authStr = isAuth ? `\n    Authorization: \`Bearer \${token}\`,` : '';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `const res = await fetch('${baseUrl}${path}', {
  method: '${method.toUpperCase()}',
  headers: {
    'Content-Type': 'application/json',${authStr}
  },${bodyStr}
});

const { data } = await res.json();`;
}

function buildResponse(method: string, path: string): string {
  const examples: Record<string, unknown> = {
    '/api/auth/login': { success: true, data: { user: { id: 'usr_01', email: 'admin@mono.dev', name: 'Admin User', roles: ['admin', 'user'], permissions: ['read', 'write', 'admin'] }, token: 'sess_usr_01_1234567890_abc' }, message: 'OK' },
    '/api/auth/me': { success: true, data: { id: 'usr_01', email: 'admin@mono.dev', name: 'Admin User', roles: ['admin', 'user'], permissions: ['read', 'write', 'admin'] }, message: 'OK' },
    '/api/auth/refresh': { success: true, data: { user: { id: 'usr_01', email: 'admin@mono.dev', name: 'Admin User', roles: ['admin', 'user'], permissions: ['read', 'write', 'admin'] }, token: 'sess_usr_01_9876543210_xyz' }, message: 'OK' },
    '/api/auth/logout': { success: true, data: { ok: true }, message: 'OK' },
    '/api/health': { success: true, data: { status: 'ok', uptime: 1234.56, timestamp: '2026-05-06T12:00:00.000Z', version: '0.0.0' }, message: 'OK' },
  };
  return JSON.stringify(examples[path] ?? { success: true, data: {}, message: 'OK' }, null, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ label, code, lang = 'bash' }: { label: string; code: string; lang?: string }) {
  void lang;
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method, size = 'sm' }: { method: string; size?: 'sm' | 'lg' }) {
  const style = METHOD_BADGE[method.toLowerCase()] ?? 'bg-gray-500 text-white';
  return (
    <span className={cn('inline-block rounded font-mono font-bold uppercase tracking-wide', style,
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
    )}>
      {method}
    </span>
  );
}

function SchemaTable({ schema, schemas }: { schema: OpenAPISchema; schemas: Record<string, OpenAPISchema> }) {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Field</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Required</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description / Example</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Object.entries(props).map(([field, prop]) => {
            let type = prop.type ?? 'object';
            if (prop.$ref) type = prop.$ref.replace('#/components/schemas/', '');
            if (prop.type === 'array' && prop.items) {
              const itemType = prop.items.$ref?.replace('#/components/schemas/', '') ?? prop.items.type ?? 'any';
              type = `${itemType}[]`;
            }
            const nested = prop.$ref ? resolveRef(prop.$ref, schemas) : null;
            return (
              <>
                <tr key={field} className="bg-white hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{field}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-700">{type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {required.has(field)
                      ? <span className="text-xs font-medium text-red-600">required</span>
                      : <span className="text-xs text-gray-400">optional</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {prop.description && <p>{prop.description}</p>}
                    {prop.example !== undefined && (
                      <code className="text-gray-600">{JSON.stringify(prop.example)}</code>
                    )}
                  </td>
                </tr>
                {nested?.properties && Object.entries(nested.properties).map(([nf, np]) => (
                  <tr key={`${field}.${nf}`} className="bg-indigo-50/30">
                    <td className="py-2.5 pl-8 pr-4 font-mono text-xs text-gray-500">↳ {nf}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-600">{np.type ?? 'string'}</span>
                    </td>
                    <td className="px-4 py-2.5" />
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{np.example !== undefined ? JSON.stringify(np.example) : ''}</td>
                  </tr>
                ))}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function IntroPanel() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-10 py-12">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
          <BookOpen size={12} /> Introduction
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Mono API Reference</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-600">
          The Mono API Gateway is a RESTful API that powers all platform modules. It follows a
          backend-first design — the contract is defined and documented here before any frontend
          integration is built.
        </p>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-xs font-semibold text-gray-500">BASE URL</span>
          <code className="flex-1 font-mono text-sm text-gray-800">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api</code>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">dev</span>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Lock size={16} className="text-indigo-500" /> Authentication
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          All protected endpoints require a bearer token in the <code className="rounded bg-gray-100 px-1 font-mono text-xs">Authorization</code> header.
          Obtain a token from <code className="rounded bg-gray-100 px-1 font-mono text-xs">POST /api/auth/login</code>.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-950">
          <pre className="p-4 font-mono text-xs leading-relaxed text-gray-300">{`Authorization: Bearer sess_usr_01_1234567890_abc`}</pre>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Password</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Roles</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="px-4 py-3 font-mono text-xs">admin@mono.dev</td><td className="px-4 py-3 font-mono text-xs">admin123</td><td className="px-4 py-3 text-xs"><span className="rounded bg-violet-100 px-1.5 py-0.5 text-violet-700">admin</span> <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">user</span></td></tr>
              <tr><td className="px-4 py-3 font-mono text-xs">user@mono.dev</td><td className="px-4 py-3 font-mono text-xs">user123</td><td className="px-4 py-3 text-xs"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">user</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Layers size={16} className="text-indigo-500" /> Response Envelope
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          Every response — success or error — is wrapped in a consistent envelope. Always read <code className="rounded bg-gray-100 px-1 font-mono text-xs">data</code>, never the top-level object directly.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-lg border border-emerald-200 bg-gray-950">
            <div className="border-b border-white/10 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">Success 2xx</div>
            <pre className="p-4 text-xs leading-relaxed text-gray-300">{`{
  "success": true,
  "data": { ... },
  "message": "OK"
}`}</pre>
          </div>
          <div className="overflow-hidden rounded-lg border border-red-200 bg-gray-950">
            <div className="border-b border-white/10 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400">Error 4xx / 5xx</div>
            <pre className="p-4 text-xs leading-relaxed text-gray-300">{`{
  "success": false,
  "data": null,
  "message": "...",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}`}</pre>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <AlertCircle size={16} className="text-indigo-500" /> Error Codes
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Meaning</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[['400','BADREQUEST','Validation failure — check message for field details'],['401','UNAUTHORIZED','Missing token, invalid token, or bad credentials'],['403','FORBIDDEN','Token valid but insufficient role/permission'],['404','NOTFOUND','Resource does not exist'],['500','INTERNAL_ERROR','Unhandled server error — check gateway logs']].map(([s,c,m]) => (
                <tr key={s}>
                  <td className="px-4 py-3"><span className={cn('rounded px-1.5 py-0.5 font-mono text-xs font-medium', s.startsWith('4') ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{s}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{c}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EndpointPanel({ endpoint, schemas }: { endpoint: FlatEndpoint; schemas: Record<string, OpenAPISchema> }) {
  const { method, path, operation } = endpoint;
  const mStyle = METHOD_STYLE[method.toLowerCase()] ?? METHOD_STYLE.get;
  const isPublic = !operation.security?.length;

  const reqSchema = operation.requestBody
    ? resolveRef(operation.requestBody.content['application/json'].schema.$ref, schemas)
    : null;

  const successResp = operation.responses['200'];
  const respSchemaRef = successResp?.content?.['application/json']?.schema?.$ref;
  const respSchema = respSchemaRef ? resolveRef(respSchemaRef, schemas) : null;

  const errorResps = Object.entries(operation.responses).filter(([code]) => code !== '200');

  return (
    <div className="mx-auto max-w-3xl px-10 py-12">
      {/* Method + path */}
      <div className={cn('mb-8 flex items-start gap-4 rounded-xl border p-5', mStyle.border, mStyle.bg)}>
        <MethodBadge method={method} size="lg" />
        <div className="min-w-0 flex-1">
          <code className="font-mono text-lg font-semibold text-gray-900">{path}</code>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{operation.summary}</h1>
          {operation.description && (
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{operation.description}</p>
          )}
        </div>
      </div>

      {/* Auth badge */}
      <div className="mb-8">
        {isPublic ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <Globe size={12} /> Public — no authentication required
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
            <Lock size={12} /> Protected — requires <code className="font-mono">Authorization: Bearer &lt;token&gt;</code>
          </div>
        )}
      </div>

      {/* Request body */}
      {reqSchema && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Request Body</h2>
          <SchemaTable schema={reqSchema} schemas={schemas} />
        </div>
      )}

      {/* Success response */}
      {respSchema && (
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Response</h2>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">200</span>
            <span className="text-xs text-gray-400">{successResp?.description}</span>
          </div>
          <SchemaTable schema={respSchema} schemas={schemas} />
        </div>
      )}

      {/* Error responses */}
      {errorResps.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Error Responses</h2>
          <div className="space-y-2">
            {errorResps.map(([code, resp]) => (
              <div key={code} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <span className={cn('rounded px-2 py-0.5 font-mono text-xs font-bold', Number(code) >= 500 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>{code}</span>
                <span className="text-sm text-gray-600">{resp.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CodeSidePanel({ endpoint, codeTab, setCodeTab }: {
  endpoint: FlatEndpoint | null;
  codeTab: 'curl' | 'fetch';
  setCodeTab: (t: 'curl' | 'fetch') => void;
}) {
  if (!endpoint) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-600">Select an endpoint to see code examples.</p>
      </div>
    );
  }
  const { method, path, operation } = endpoint;
  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 space-y-4">
      <div>
        <div className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {(['curl', 'fetch'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCodeTab(tab)}
              className={cn('flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                codeTab === tab ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {tab === 'curl' ? 'cURL' : 'JavaScript'}
            </button>
          ))}
        </div>
        <CodeBlock
          label={codeTab === 'curl' ? 'cURL' : 'fetch()'}
          code={codeTab === 'curl' ? buildCurl(method, path, operation) : buildFetch(method, path, operation)}
        />
      </div>
      <CodeBlock label="Response 200" code={buildResponse(method, path)} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const router = useRouter();
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>('introduction');
  const [codeTab, setCodeTab] = useState<'curl' | 'fetch'>('curl');

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${baseUrl}/api/docs-json`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<OpenAPISpec>; })
      .then(setSpec)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const endpoints = useCallback((): FlatEndpoint[] => {
    if (!spec) return [];
    const result: FlatEndpoint[] = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        result.push({ method, path, operation: op, tag: op.tags?.[0] ?? 'other', id: op.operationId });
      }
    }
    return result;
  }, [spec])();

  const byTag = endpoints.reduce<Record<string, FlatEndpoint[]>>((acc, ep) => {
    (acc[ep.tag] ??= []).push(ep);
    return acc;
  }, {});

  const activeEndpoint = endpoints.find((e) => e.id === selected) ?? null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading API specification…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="text-sm font-medium text-white">Could not load API spec</p>
          <p className="mt-1 text-xs text-gray-400">Make sure the API Gateway is running on :3001</p>
          <button onClick={() => router.push('/')} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300">← Back to workspace</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 font-sans">

      {/* ── Left nav ── */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-gray-950">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={12} /> Back to workspace
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
              <Code2 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">API Reference</p>
              <p className="text-[10px] text-gray-500">v{spec?.info.version}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Introduction */}
          <div>
            <button
              onClick={() => setSelected('introduction')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left',
                selected === 'introduction' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
              )}
            >
              <BookOpen size={13} />
              Introduction
            </button>
          </div>

          {/* Endpoints by tag */}
          {Object.entries(byTag).map(([tag, eps]) => (
            <div key={tag}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">{tag}</p>
              <div className="space-y-0.5">
                {eps.map((ep) => {
                  const mStyle = METHOD_STYLE[ep.method.toLowerCase()] ?? METHOD_STYLE.get;
                  const isActive = selected === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => setSelected(ep.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                        isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-300',
                      )}
                    >
                      <span className={cn('shrink-0 rounded px-1 py-0.5 font-mono text-[9px] font-bold uppercase', mStyle.bg, mStyle.text)}>
                        {ep.method}
                      </span>
                      <span className="truncate font-mono">{ep.path.replace('/api/', '/')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          <a
            href="http://localhost:3001/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
          >
            <Zap size={12} />
            Try in Swagger UI
            <ExternalLink size={10} className="ml-auto" />
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-white">
        {selected === 'introduction'
          ? <IntroPanel />
          : activeEndpoint && <EndpointPanel endpoint={activeEndpoint} schemas={spec?.components.schemas ?? {}} />
        }
      </main>

      {/* ── Code panel ── */}
      <aside className="flex w-[400px] shrink-0 flex-col border-l border-white/10 bg-[#0d1117]">
        <div className="border-b border-white/10 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            {activeEndpoint ? `${activeEndpoint.method.toUpperCase()} ${activeEndpoint.path}` : 'Code Examples'}
          </p>
        </div>
        <CodeSidePanel endpoint={activeEndpoint} codeTab={codeTab} setCodeTab={setCodeTab} />
      </aside>
    </div>
  );
}
