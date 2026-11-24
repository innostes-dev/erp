<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Models\Tenant;
use App\Models\TenantMember;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;

class TenantService
{
    public static function notFound(string $message = 'Tenant not found'): ServiceException
    {
        return ServiceException::notFound($message, ErrorCode::TENANT_NOT_FOUND);
    }

    public static function slugTaken(string $slug): ServiceException
    {
        return ServiceException::conflict("Slug '{$slug}' is already in use", ErrorCode::SLUG_TAKEN);
    }

    public function find(string $id, bool $includeDeleted = false): ?Tenant
    {
        $q = Tenant::query();
        if ($includeDeleted) {
            $q->withTrashed();
        }

        return $q->whereKey($id)->first();
    }

    public function findOrFail(string $id, bool $includeDeleted = false): Tenant
    {
        return $this->find($id, $includeDeleted) ?? throw self::notFound();
    }

    /**
     * @return array{0: Collection<int, Tenant>, 1: int}
     */
    public function paginate(int $offset, int $limit, bool $includeDeleted, ?string $memberUserId = null): array
    {
        $q = Tenant::query();
        if ($includeDeleted) {
            $q->withTrashed();
        }
        if ($memberUserId !== null) {
            $q->whereIn('id', TenantMember::query()->select('tenant_id')
                ->where('user_id', $memberUserId)->where('status', 'active')->whereNull('deleted_at'));
        }
        $total = $q->count();
        $items = $q->orderByDesc('created_at')->orderBy('id')->offset($offset)->limit($limit)->get();

        return [$items, $total];
    }

    /**
     * Slugs stay reserved after a soft delete, so uniqueness is checked including deleted tenants.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?string $actorId): Tenant
    {
        if (Tenant::withTrashed()->where('slug', $data['slug'])->exists()) {
            throw self::slugTaken($data['slug']);
        }
        try {
            $tenant = new Tenant($data + ['created_by' => $actorId, 'updated_by' => $actorId]);
            $tenant->save();
        } catch (QueryException $e) {
            if (($e->errorInfo[0] ?? null) === '23505') {
                throw self::slugTaken((string) $data['slug']);
            }
            throw $e;
        }

        return $tenant->refresh();
    }

    /**
     * @param  array<string, mixed>  $data  only the fields the client sent
     */
    public function update(Tenant $tenant, array $data, ?string $actorId): Tenant
    {
        $slug = $data['slug'] ?? null;
        if ($slug !== null && $slug !== $tenant->slug
            && Tenant::withTrashed()->where('slug', $slug)->where('id', '!=', $tenant->id)->exists()) {
            throw self::slugTaken($slug);
        }
        $tenant->fill($data);
        $tenant->updated_by = $actorId;
        $tenant->save();

        return $tenant->refresh();
    }

    public function softDelete(Tenant $tenant, ?string $actorId): Tenant
    {
        $tenant->deleted_by = $actorId;
        $tenant->updated_by = $actorId;
        $tenant->save();
        $tenant->delete();

        return $tenant->refresh();
    }

    public function restore(Tenant $tenant, ?string $actorId): Tenant
    {
        $tenant->deleted_by = null;
        $tenant->updated_by = $actorId;
        $tenant->restore();

        return $tenant->refresh();
    }
}
