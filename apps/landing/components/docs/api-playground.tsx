'use client';

import { useState } from 'react';
import { Send, Loader2, Info } from 'lucide-react';

interface ApiPlaygroundProps {
  method: string;
  path: string;
  defaultBaseUrl?: string;
  authType?: 'BearerAuth' | 'SetupToken' | 'None' | string;
  initialBody?: string;
  hasBody?: boolean;
}

export function ApiPlayground({
  method,
  path,
  defaultBaseUrl = 'http://localhost:8001',
  authType = 'BearerAuth',
  initialBody = '',
  hasBody = false,
}: ApiPlaygroundProps) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [resolvedPath, setResolvedPath] = useState(path);
  const [token, setToken] = useState('');
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseTime(null);
    setResponseData(null);
    setError(null);

    const startTime = performance.now();
    try {
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const cleanPath = resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`;
      const url = `${cleanBase}${cleanPath}`;

      const headers: Record<string, string> = {};
      if (hasBody && body.trim()) {
        headers['Content-Type'] = 'application/json';
      }

      if (token.trim()) {
        if (authType === 'SetupToken') {
          headers['X-Setup-Token'] = token.trim();
        } else {
          headers['Authorization'] = `Bearer ${token.trim()}`;
        }
      }

      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body: hasBody && body.trim() ? body.trim() : undefined,
      });

      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponseData(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponseData(text || '(Empty response body)');
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        `${msg}. If this is a cross-origin error, check that the API server is running at ${baseUrl} and allows origin ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'} via CORS_ORIGINS.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-6 rounded-xl border border-fd-border bg-fd-card overflow-hidden shadow-xs not-prose">
      <div className="border-b border-fd-border bg-fd-secondary/50 px-4 py-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-fd-foreground flex items-center gap-2">
          <span>Try it with your server</span>
        </h4>
        <span className="text-xs text-fd-muted-foreground font-mono">Interactive playground</span>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Base URL and Endpoint */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1 space-y-1">
            <label className="font-medium text-fd-muted-foreground">Server Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded-md border border-fd-border bg-fd-background px-3 py-1.5 font-mono text-fd-foreground focus:outline-hidden focus:ring-1 focus:ring-fd-primary"
              placeholder="http://localhost:8001"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="font-medium text-fd-muted-foreground">Request Path</label>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-fd-secondary px-2.5 py-1.5 font-mono font-bold text-fd-foreground">
                {method.toUpperCase()}
              </span>
              <input
                type="text"
                value={resolvedPath}
                onChange={(e) => setResolvedPath(e.target.value)}
                className="w-full rounded-md border border-fd-border bg-fd-background px-3 py-1.5 font-mono text-fd-foreground focus:outline-hidden focus:ring-1 focus:ring-fd-primary"
              />
            </div>
          </div>
        </div>

        {/* Authentication input */}
        {authType !== 'None' && (
          <div className="space-y-1">
            <label className="font-medium text-fd-muted-foreground">
              {authType === 'SetupToken' ? 'Setup Token (X-Setup-Token)' : 'Access Token (Bearer)'}
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-md border border-fd-border bg-fd-background px-3 py-1.5 font-mono text-fd-foreground focus:outline-hidden focus:ring-1 focus:ring-fd-primary"
              placeholder={
                authType === 'SetupToken'
                  ? 'Paste setup token from api-server terminal...'
                  : 'Paste JWT access token...'
              }
            />
          </div>
        )}

        {/* Body Editor if applicable */}
        {hasBody && (
          <div className="space-y-1">
            <label className="font-medium text-fd-muted-foreground">Request Body (JSON)</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-fd-border bg-fd-background p-3 font-mono text-xs text-fd-foreground focus:outline-hidden focus:ring-1 focus:ring-fd-primary leading-relaxed"
            />
          </div>
        )}

        {/* Send Button & Note */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2 font-medium text-fd-primary-foreground hover:bg-fd-primary/90 transition-colors disabled:opacity-50 cursor-pointer text-xs"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            <span>Send Request</span>
          </button>

          <div className="flex items-center gap-1.5 text-fd-muted-foreground text-[11px]">
            <Info className="size-3.5 shrink-0" />
            <span>Sends requests directly from your browser to your local server.</span>
          </div>
        </div>

        {/* Response section */}
        {(responseStatus !== null || error !== null) && (
          <div className="mt-4 rounded-lg border border-fd-border bg-fd-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fd-foreground">Response</span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {responseStatus !== null && (
                  <span
                    className={`rounded px-1.5 py-0.5 font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTime !== null && (
                  <span className="text-fd-muted-foreground">{responseTime} ms</span>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400 font-mono text-[11px] leading-relaxed">
                {error}
              </div>
            )}

            {responseData && (
              <pre className="max-h-60 overflow-auto rounded-md bg-fd-background p-3 font-mono text-[11px] text-fd-foreground border border-fd-border">
                {responseData}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
