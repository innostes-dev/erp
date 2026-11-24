<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/** Correlation id, security headers and one structured JSON access-log line per request. */
class RequestContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $started = microtime(true);
        $incoming = $request->headers->get('X-Correlation-ID');
        $correlationId = $incoming !== null && preg_match('/^[A-Za-z0-9._\-]{1,128}$/', $incoming) === 1 ? $incoming : (string) Str::uuid();
        $request->attributes->set('correlation_id', $correlationId);
        $request->headers->set('X-Correlation-ID', $correlationId);

        $response = $next($request);

        $response->headers->set('X-Correlation-ID', $correlationId);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        if ($request->isSecure() || config('kernel.auth.cookie_secure')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        if (! $response->headers->has('Cache-Control') || $response->headers->get('Cache-Control') === 'no-cache, private') {
            $response->headers->set('Cache-Control', 'no-store');
        }

        Log::info('request', [
            'correlation_id' => $correlationId,
            'method' => $request->method(),
            'path' => '/'.ltrim($request->path(), '/'),
            'status' => $response->getStatusCode(),
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'ip' => $request->ip(),
            'user_id' => $request->attributes->get('kernel_user')?->id,
        ]);

        return $response;
    }
}
