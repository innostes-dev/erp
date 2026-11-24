<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Models\Tenant;
use App\Models\TenantMember;
use App\Models\User;

/** Resolves the active tenant of a request: X-Tenant-ID, else first active membership, else oldest tenant. */
class TenantContext
{
    /**
     * @param  ?string  $pinnedTenantId  tenant bound to the credential (API keys are tied to one tenant)
     */
    public function resolve(User $user, ?string $headerTenantId, ?string $pinnedTenantId = null): string
    {
        if ($pinnedTenantId !== null) {
            return $pinnedTenantId;
        }
        if ($headerTenantId !== null) {
            return $headerTenantId;
        }
        $member = TenantMember::query()
            ->where('user_id', $user->id)->where('status', 'active')->whereNull('deleted_at')
            ->orderBy('created_at')->value('tenant_id');
        if ($member !== null) {
            return $member;
        }
        $oldest = Tenant::query()->orderBy('created_at')->value('id');

        return $oldest ?? throw TenantService::notFound('No active tenant found for user.');
    }

    /**
     * Tenant the caller may act in. Super admins: X-Tenant-ID, else first membership, else the oldest tenant.
     * Everyone else is confined to tenants they are an active member of: a header naming another tenant is 403
     * permission_denied, and without a header the first membership is used (404 tenant_not_found when there is none;
     * no "oldest tenant" fallback).
     */
    public function resolveForMember(User $user, ?string $headerTenantId, ?string $pinnedTenantId = null): string
    {
        if ($pinnedTenantId !== null) {
            // An API key stays bound to its tenant, but its owner must still belong to it (membership may have been revoked).
            if (! $user->is_super_admin && ! $this->isMember($user->id, $pinnedTenantId)) {
                throw ServiceException::forbidden('You are not a member of this tenant.', ErrorCode::PERMISSION_DENIED);
            }

            return $pinnedTenantId;
        }
        if ($user->is_super_admin) {
            return $this->resolve($user, $headerTenantId);
        }
        if ($headerTenantId !== null) {
            if (! $this->isMember($user->id, $headerTenantId)) {
                throw ServiceException::forbidden('You are not a member of this tenant.', ErrorCode::PERMISSION_DENIED);
            }

            return $headerTenantId;
        }
        $member = TenantMember::query()
            ->where('user_id', $user->id)->where('status', 'active')->whereNull('deleted_at')
            ->whereIn('tenant_id', Tenant::query()->select('id'))
            ->orderBy('created_at')->value('tenant_id');

        return $member ?? throw TenantService::notFound('No active tenant found for user.');
    }

    public function isMember(string $userId, string $tenantId): bool
    {
        return TenantMember::query()->where('tenant_id', $tenantId)->where('user_id', $userId)
            ->where('status', 'active')->whereNull('deleted_at')->exists();
    }
}
