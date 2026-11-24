<?php

namespace App\Kernel\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Writes immutable audit rows. A failure here is logged and swallowed: it must never fail a request. */
class AuditService
{
    private const SENSITIVE_KEYS = ['password', 'hashed_password', 'secret', 'client_secret', 'token', 'access_token', 'refresh_token', 'api_key', 'key_hash'];

    /**
     * @param  array<string, mixed>  $context  keys: entity_name, changes, old_state, new_state, tenant_id, actor_id,
     *                                         actor_email, actor_name, ip_address, user_agent, correlation_id, reason, status
     */
    public function record(string $action, string $entityType, string $entityId, array $context = []): void
    {
        try {
            $changes = $context['changes'] ?? [];
            if ($changes === [] && (isset($context['old_state']) || isset($context['new_state']))) {
                $changes = $this->diff($context['old_state'] ?? [], $context['new_state'] ?? []);
            }

            // A savepoint keeps a failed audit insert from poisoning a surrounding PostgreSQL transaction.
            DB::transaction(fn () => AuditLog::query()->create([
                'tenant_id' => $context['tenant_id'] ?? null,
                'actor_id' => $context['actor_id'] ?? null,
                'actor_email' => self::cut($context['actor_email'] ?? null, 255),
                'actor_name' => self::cut($context['actor_name'] ?? null, 255),
                'action' => strtoupper($action),
                'entity_type' => strtolower($entityType),
                'entity_id' => (string) $entityId,
                'entity_name' => self::cut($context['entity_name'] ?? null, 255),
                'changes' => $changes === [] ? new \stdClass : $changes,
                'ip_address' => self::cut($context['ip_address'] ?? null, 45),
                'user_agent' => self::cut($context['user_agent'] ?? null, 512),
                'correlation_id' => self::cut($context['correlation_id'] ?? null, 128),
                'reason' => $context['reason'] ?? null,
                'status' => strtoupper((string) ($context['status'] ?? 'SUCCESS')),
            ]));
        } catch (Throwable $e) {
            Log::warning('audit write failed', ['action' => $action, 'entity_type' => $entityType, 'error' => $e->getMessage()]);
        }
    }

    /**
     * @param  array<string, mixed>  $old
     * @param  array<string, mixed>  $new
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function diff(array $old, array $new): array
    {
        $diff = [];
        $keys = array_unique([...array_keys($old), ...array_keys($new)]);
        sort($keys);
        foreach ($keys as $key) {
            if (in_array($key, self::SENSITIVE_KEYS, true)) {
                continue;
            }
            if (($old[$key] ?? null) !== ($new[$key] ?? null)) {
                $diff[$key] = ['old' => $old[$key] ?? null, 'new' => $new[$key] ?? null];
            }
        }

        return $diff;
    }

    private static function cut(?string $value, int $max): ?string
    {
        return $value === null ? null : mb_substr($value, 0, $max);
    }
}
