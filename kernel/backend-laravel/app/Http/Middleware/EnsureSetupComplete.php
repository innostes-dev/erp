<?php

namespace App\Http\Middleware;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\SetupState;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** 503 setup_required for every route except /, /health, docs, /openapi.json and /setup* until installed. */
class EnsureSetupComplete
{
    private const ALWAYS_ALLOWED = ['/', '/health', '/docs', '/redoc', '/openapi.json'];

    public function __construct(private readonly SetupState $state) {}

    public function handle(Request $request, Closure $next): Response
    {
        $path = '/'.ltrim($request->path(), '/');
        if ($request->isMethod('OPTIONS') || $this->allowed($path)) {
            return $next($request);
        }
        if (! $this->state->isInstalled()) {
            throw ServiceException::unavailable('Setup has not been completed', ErrorCode::SETUP_REQUIRED);
        }

        return $next($request);
    }

    private function allowed(string $path): bool
    {
        return in_array($path, self::ALWAYS_ALLOWED, true)
            || $path === '/setup' || str_starts_with($path, '/setup/') || str_starts_with($path, '/docs/');
    }
}
