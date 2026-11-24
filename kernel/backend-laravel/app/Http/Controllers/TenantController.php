<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateTenantRequest;
use App\Http\Requests\ListTenantsRequest;
use App\Http\Requests\UpdateTenantRequest;
use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use App\Kernel\Services\Presenter;
use App\Kernel\Services\RbacService;
use App\Kernel\Services\TenantContext;
use App\Kernel\Services\TenantService;
use App\Kernel\Support\Iso;
use App\Kernel\Support\Uuid;
use App\Models\Tenant;
use App\Models\TenantModule;
use App\Models\TenantPlugin;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TenantController extends Controller
{
    private const MODULE_METADATA = [
        'peopleops' => ['PeopleOps', 'People operations, attendance, leave, and payroll', ['Employees', 'Attendance', 'Leave', 'Payroll'], 'chart-3'],
        'salesflow' => ['SalesFlow', 'Sales pipeline, customer leads, deals, and quotes', ['Leads', 'Deals', 'Pipeline', 'Quotes'], 'chart-2'],
        'hireflow' => ['HireFlow', 'Frictionless hiring pipeline, candidate tracking, and interview scheduling', ['Recruiting', 'Jobs', 'Candidates', 'Interviews'], 'chart-4'],
        'ledgerflow' => ['LedgerFlow', 'General ledger, double-entry vouchers, AP/AR, cash flow, and tax compliance', ['Ledger', 'AP', 'AR', 'Tax', 'Banking'], 'chart-1'],
        'stockflow' => ['StockFlow', 'Multi-warehouse stock flow, item bins, procurement POs, and reorder alerts', ['Stock', 'Procurement', 'Warehouse', 'Valuation'], 'chart-5'],
        'sprintflow' => ['SprintFlow', 'Agile sprint execution, burndown velocity, epics, and issue tracking', ['Agile', 'Scrum', 'Kanban', 'Sprints', 'Bugs'], 'chart-2'],
        'docflow' => ['DocFlow', 'Living team documentation, company SOPs, blueprints, and architecture wiki', ['Knowledge', 'Wiki', 'SOPs', 'PRDs', 'Handbook'], 'chart-3'],
    ];

    private const PLUGIN_METADATA = [
        'tracura' => ['Tracura', 'Enterprise API observability, universal telemetry ingestion, and analytics', ['Logs', 'Telemetry', 'Analytics'], 'chart-5'],
        'api-logger' => ['Tracura', 'Enterprise API observability, universal telemetry ingestion, and analytics', ['Logs', 'Telemetry', 'Analytics'], 'chart-5'],
    ];

    public function __construct(
        private readonly TenantService $tenants,
        private readonly TenantContext $context,
        private readonly RbacService $rbac,
    ) {}

    public function index(ListTenantsRequest $request): JsonResponse
    {
        $actor = $this->actor($request);
        // Super admins see everything; everyone else only the tenants they are an active member of (never deleted ones).
        [$items, $total] = $this->tenants->paginate(
            $request->offsetValue(),
            $request->limitValue(),
            $actor->is_super_admin && $request->includeDeleted(),
            $actor->is_super_admin ? null : $actor->id
        );

        return $this->json([
            'items' => $items->map(fn ($t) => Presenter::tenant($t))->all(),
            'total' => $total,
            'offset' => $request->offsetValue(),
            'limit' => $request->limitValue(),
        ]);
    }

    public function store(CreateTenantRequest $request): JsonResponse
    {
        $actor = $this->requireSuperAdmin($request);
        $tenant = $this->tenants->create($request->validated(), $actor->id);
        $this->audit($request, $actor, 'CREATE', 'tenant', $tenant->id, [
            'entity_name' => $tenant->name,
            'changes' => ['name' => ['old' => null, 'new' => $tenant->name], 'slug' => ['old' => null, 'new' => $tenant->slug]],
            'tenant_id' => $tenant->id,
            'reason' => "Created tenant organisation '{$tenant->name}'",
        ]);

        return $this->json(Presenter::tenant($tenant), 201);
    }

    public function current(Request $request): JsonResponse
    {
        $tenantId = $this->currentTenantId($request);

        return $this->json(Presenter::tenant($this->tenants->findOrFail($tenantId)));
    }

    public function show(Request $request, string $tenantId): JsonResponse
    {
        $actor = $this->actor($request);
        $tenantId = Uuid::require($tenantId, 'path', 'tenant_id');
        $tenant = $this->tenants->findOrFail($tenantId);
        $this->authorizeTenant($actor, $tenantId);

        return $this->json(Presenter::tenant($tenant));
    }

    public function update(UpdateTenantRequest $request, string $tenantId): JsonResponse
    {
        $actor = $this->actor($request);
        $tenantId = Uuid::require($tenantId, 'path', 'tenant_id');
        $tenant = $this->tenants->findOrFail($tenantId);
        $this->authorizeTenant($actor, $tenantId, 'tenancy.tenant.update');
        $old = $this->state($tenant);
        $updated = $this->tenants->update($tenant, $request->validated(), $actor->id);
        $this->audit($request, $actor, 'UPDATE', 'tenant', $updated->id, [
            'entity_name' => $updated->name,
            'old_state' => $old,
            'new_state' => $this->state($updated),
            'tenant_id' => $updated->id,
            'reason' => "Updated tenant organisation '{$updated->name}'",
        ]);

        return $this->json(Presenter::tenant($updated));
    }

    public function destroy(Request $request, string $tenantId): JsonResponse
    {
        $actor = $this->actor($request);
        $tenantId = Uuid::require($tenantId, 'path', 'tenant_id');
        $tenant = $this->tenants->findOrFail($tenantId);
        $this->authorizeTenant($actor, $tenantId, 'tenancy.tenant.delete');
        $deleted = $this->tenants->softDelete($tenant, $actor->id);
        $this->audit($request, $actor, 'DELETE', 'tenant', $deleted->id, [
            'entity_name' => $deleted->name,
            'changes' => ['deleted' => ['old' => false, 'new' => true]],
            'tenant_id' => $deleted->id,
            'reason' => "Soft-deleted tenant organisation '{$deleted->name}'",
        ]);

        return $this->json(Presenter::tenant($deleted));
    }

    public function restore(Request $request, string $tenantId): JsonResponse
    {
        $actor = $this->actor($request);
        $tenantId = Uuid::require($tenantId, 'path', 'tenant_id');
        $tenant = $this->tenants->findOrFail($tenantId, true);
        $this->authorizeTenant($actor, $tenantId, 'tenancy.tenant.delete');
        $restored = $this->tenants->restore($tenant, $actor->id);
        $this->audit($request, $actor, 'RESTORE', 'tenant', $restored->id, [
            'entity_name' => $restored->name,
            'changes' => ['deleted' => ['old' => true, 'new' => false]],
            'tenant_id' => $restored->id,
            'reason' => "Restored tenant organisation '{$restored->name}'",
        ]);

        return $this->json(Presenter::tenant($restored));
    }

    // ---- modules & plugins ----------------------------------------------

    public function listModules(Request $request): JsonResponse
    {
        return $this->catalog($request, 'module');
    }

    public function listPlugins(Request $request): JsonResponse
    {
        return $this->catalog($request, 'plugin');
    }

    public function activateModule(Request $request, string $moduleId): JsonResponse
    {
        return $this->toggle($request, 'module', $moduleId, true);
    }

    public function deactivateModule(Request $request, string $moduleId): JsonResponse
    {
        return $this->toggle($request, 'module', $moduleId, false);
    }

    public function activatePlugin(Request $request, string $pluginId): JsonResponse
    {
        return $this->toggle($request, 'plugin', $pluginId, true);
    }

    public function deactivatePlugin(Request $request, string $pluginId): JsonResponse
    {
        return $this->toggle($request, 'plugin', $pluginId, false);
    }

    private function catalog(Request $request, string $type): JsonResponse
    {
        $tenantId = $this->currentTenantId($request);
        $isModule = $type === 'module';
        $meta = $isModule ? self::MODULE_METADATA : self::PLUGIN_METADATA;
        $query = $isModule ? TenantModule::query() : TenantPlugin::query();
        $idColumn = $isModule ? 'module_id' : 'plugin_id';

        $records = $query->where('tenant_id', $tenantId)->where('is_active', true)->get()->keyBy($idColumn);
        $ids = array_keys($meta);
        sort($ids);

        $installed = [];
        foreach ($ids as $id) {
            [$name, $description, $tags, $tone] = $meta[$id];
            $record = $records->get($id);
            $installed[] = [
                'id' => $id, 'name' => $name, 'version' => '0.1.0', 'type' => $type, 'description' => $description,
                'tags' => $tags, 'tone' => $tone, 'is_active' => $record !== null,
                'activated_at' => Iso::format($record?->activated_at),
            ];
        }

        return $this->json(['installed' => $installed, 'active_ids' => $records->keys()->values()->all()]);
    }

    private function toggle(Request $request, string $type, string $itemId, bool $activate): JsonResponse
    {
        $actor = $this->requireSuperAdmin($request);
        $tenantId = $this->currentTenantId($request);
        $isModule = $type === 'module';
        $label = ucfirst($type);
        $column = $isModule ? 'module_id' : 'plugin_id';
        $query = $isModule ? TenantModule::query() : TenantPlugin::query();

        $record = $query->where('tenant_id', $tenantId)->where($column, $itemId)->first();
        if ($activate) {
            $attrs = ['is_active' => true, 'activated_at' => Carbon::now(), 'activated_by' => $actor->id];
            if ($record !== null) {
                $record->fill($attrs)->save();
            } else {
                ($isModule ? TenantModule::query() : TenantPlugin::query())->create(
                    ['tenant_id' => $tenantId, $column => $itemId, 'created_by' => $actor->id, 'updated_by' => $actor->id] + $attrs
                );
            }
        } elseif ($record !== null) {
            $record->fill(['is_active' => false, 'activated_at' => null, 'activated_by' => null])->save();
        }

        $this->audit($request, $actor, 'RBAC_CHANGE', 'tenant_'.$type, $itemId, [
            'entity_name' => "{$label} {$itemId}",
            'changes' => ['is_active' => ['old' => ! $activate, 'new' => $activate]],
            'tenant_id' => $tenantId,
            'reason' => ($activate ? 'Activated' : 'Deactivated')." {$type} '{$itemId}'",
        ]);

        return $this->json([
            'item_id' => $itemId,
            'is_active' => $activate,
            'message' => "{$label} '{$itemId}' ".($activate ? 'activated successfully.' : 'deactivated.'),
        ]);
    }

    private function currentTenantId(Request $request): string
    {
        $user = $this->actor($request);
        $header = $request->headers->get('X-Tenant-ID');
        $header = $header !== null ? Uuid::require($header, 'header', 'x-tenant-id') : null;

        // Members (or super admins) only: X-Tenant-ID must never select a tenant the caller does not belong to.
        return $this->context->resolveForMember($user, $header, $this->apiKey($request)?->tenant_id);
    }

    private function requireSuperAdmin(Request $request): User
    {
        $actor = $this->actor($request);
        if (! $actor->is_super_admin) {
            throw ServiceException::forbidden('Super administrator privilege required.', ErrorCode::PERMISSION_DENIED);
        }

        return $actor;
    }

    /**
     * Access to a tenant by id: super admins always; others must be an active member (non-members get the same
     * 404 as a missing tenant, so ids cannot be probed) and, for mutations, hold the RBAC permission in that tenant
     * (seeded roles: owner has update+delete, admin has update).
     */
    private function authorizeTenant(User $actor, string $tenantId, ?string $permission = null): void
    {
        if ($actor->is_super_admin) {
            return;
        }
        if (! $this->context->isMember($actor->id, $tenantId)) {
            throw TenantService::notFound();
        }
        if ($permission !== null && ! $this->rbac->hasPermission($actor->id, $permission, $tenantId)) {
            throw ServiceException::forbidden("Permission '{$permission}' required.", ErrorCode::PERMISSION_DENIED);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function state(Tenant $tenant): array
    {
        return ['name' => $tenant->name, 'slug' => $tenant->slug, 'country' => $tenant->country, 'timezone' => $tenant->timezone];
    }
}
