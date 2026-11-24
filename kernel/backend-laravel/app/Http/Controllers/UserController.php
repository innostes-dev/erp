<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUserRequest;
use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\Presenter;
use App\Kernel\Services\RbacService;
use App\Kernel\Services\TenantContext;
use App\Kernel\Services\UserService;
use App\Kernel\Support\Uuid;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $users,
        private readonly Presenter $presenter,
        private readonly TenantContext $context,
        private readonly RbacService $rbac,
    ) {}

    public function store(CreateUserRequest $request): JsonResponse
    {
        $actor = $this->actor($request);
        // Super admins, or tenant administrators holding user.users.create in a tenant they belong to.
        if (! $actor->is_super_admin) {
            $tenantId = $this->tenantFor($actor, $request);
            if ($tenantId === null || ! $this->rbac->hasPermission($actor->id, 'user.users.create', $tenantId)) {
                throw ServiceException::forbidden("Permission 'user.users.create' required.", ErrorCode::PERMISSION_DENIED);
            }
        }
        $data = $request->validated();
        unset($data['is_super_admin']); // never honoured: this endpoint cannot mint super admins

        $user = DB::transaction(fn () => $this->users->create($data, false, $actor->id));

        $target = $user->fullName();
        $this->audit($request, $actor, 'CREATE', 'user', $user->id, [
            'entity_name' => $target !== '' ? $target : $data['email'],
            'changes' => [
                'first_name' => ['old' => null, 'new' => $user->first_name],
                'last_name' => ['old' => null, 'new' => $user->last_name],
                'email' => ['old' => null, 'new' => $data['email']],
            ],
            'reason' => "Registered user account '{$data['email']}'",
        ]);

        return $this->json($this->presenter->user($user->refresh()), 201);
    }

    /** Tenant used for an RBAC decision: a valid X-Tenant-ID membership, else the first membership; null when none. */
    private function tenantFor(User $actor, Request $request): ?string
    {
        $header = $request->headers->get('X-Tenant-ID');
        try {
            $header = $header !== null ? Uuid::require($header, 'header', 'x-tenant-id') : null;

            return $this->context->resolveForMember($actor, $header);
        } catch (ServiceException) {
            return null;
        }
    }

    public function show(Request $request, string $userId): JsonResponse
    {
        $actor = $this->actor($request);
        $userId = Uuid::require($userId, 'path', 'user_id');
        $user = $this->users->findById($userId)
            ?? throw ServiceException::notFound("User '{$userId}' not found.", ErrorCode::USER_NOT_FOUND);
        // Profiles carry decrypted PII: self, super admin, or a holder of user.users.read in a tenant where the
        // target is also an active member. Everyone else gets the same 404 as a missing user.
        if ($actor->id !== $user->id && ! $actor->is_super_admin) {
            $tenantId = $this->tenantFor($actor, $request);
            if ($tenantId === null
                || ! $this->rbac->hasPermission($actor->id, 'user.users.read', $tenantId)
                || ! $this->context->isMember($user->id, $tenantId)) {
                throw ServiceException::notFound("User '{$userId}' not found.", ErrorCode::USER_NOT_FOUND);
            }
        }

        return $this->json($this->presenter->user($user));
    }
}
