<?php

namespace App\Http\Controllers;

use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\AuditService;
use App\Kernel\Services\UserService;
use App\Kernel\Support\ClientIp;
use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * @param  array<string, mixed>|list<mixed>  $data
     * @param  array<string, string>  $headers
     */
    protected function json(array $data, int $status = 200, array $headers = []): JsonResponse
    {
        return response()->json($data, $status, $headers, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    }

    protected function actor(Request $request): User
    {
        $user = $request->attributes->get('kernel_user');

        return $user instanceof User ? $user : throw ServiceException::invalidToken('Authentication token or API key required.');
    }

    protected function apiKey(Request $request): ?ApiKey
    {
        $key = $request->attributes->get('kernel_api_key');

        return $key instanceof ApiKey ? $key : null;
    }

    /**
     * Record an audit event enriched with the request context (never throws).
     *
     * @param  array<string, mixed>  $context
     */
    protected function audit(Request $request, ?User $actor, string $action, string $entityType, string $entityId, array $context = []): void
    {
        if ($actor !== null) {
            $email = app(UserService::class)->decryptEmail($actor);
            $name = $actor->fullName();
            $context += [
                'actor_id' => $actor->id,
                'actor_email' => $email,
                'actor_name' => $name !== '' ? $name : $email,
            ];
        }
        $context += [
            'ip_address' => ClientIp::resolve($request),
            'user_agent' => $request->headers->get('User-Agent'),
            'correlation_id' => ClientIp::correlationId($request) ?? $request->attributes->get('correlation_id'),
            'status' => 'SUCCESS',
        ];
        app(AuditService::class)->record($action, $entityType, $entityId, $context);
    }
}
