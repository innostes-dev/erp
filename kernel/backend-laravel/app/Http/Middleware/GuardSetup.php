<?php

namespace App\Http\Middleware;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\SetupState;
use App\Kernel\Services\SetupToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** 404 once installed/disabled, then the constant-time X-Setup-Token check with per-client throttling. */
class GuardSetup
{
    public function __construct(private readonly SetupState $state, private readonly SetupToken $token) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('kernel.setup.enabled') || $this->state->isInstalled()) {
            throw ServiceException::notFound('Not Found', ErrorCode::SETUP_NOT_AVAILABLE);
        }

        $client = (string) ($request->ip() ?? 'unknown');
        $this->token->assertNotThrottled($client);
        if (! $this->token->verify($request->headers->get('X-Setup-Token'))) {
            $this->token->recordFailure($client);
            throw SetupToken::invalid();
        }
        $this->token->reset($client);

        return $next($request);
    }
}
