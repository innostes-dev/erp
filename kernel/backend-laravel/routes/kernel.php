<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SystemController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
 * Kernel routes, served at the root (no /api prefix) exactly as in docs/backend-parity/endpoints.md.
 * ->name() is the OpenAPI operationId (see App\Kernel\OpenApi\SpecBuilder).
 */

Route::middleware('throttle:kernel-api')->group(function (): void {
    Route::get('/', [SystemController::class, 'root'])->name('system_root');
    Route::get('/config', [SystemController::class, 'config'])->name('system_config');
    Route::get('/health', [SystemController::class, 'health'])->name('system_health');
    Route::get('/openapi.json', [SystemController::class, 'openapi'])->name('system_openapi');
});

// ---- Setup ------------------------------------------------------------------
Route::prefix('setup')->group(function (): void {
    Route::get('/status', [SetupController::class, 'status'])->name('setup_get_status');
    Route::middleware(['throttle:kernel-api', 'setup.guard'])->group(function (): void {
        Route::get('/checks', [SetupController::class, 'checks'])->name('setup_run_checks');
        Route::post('', [SetupController::class, 'install'])->name('setup_execute_install');
    });
});

// ---- Authentication (public) ---------------------------------------------------
Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:kernel-login')
        ->name('auth_login');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('throttle:kernel-auth')
        ->name('auth_refresh');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:kernel-forgot')
        ->name('auth_forgot_password');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:kernel-auth')
        ->name('auth_reset_password');
});

// ---- Authenticated --------------------------------------------------------------
Route::middleware(['kernel.auth', 'throttle:kernel-api'])->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('/change-password', [AuthController::class, 'changePassword'])->name('auth_change_password');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth_logout');
        Route::get('/me', [AuthController::class, 'me'])->name('auth_get_me');
        Route::get('/api-keys', [AuthController::class, 'listApiKeys'])->name('auth_list_api_keys');
        Route::post('/api-keys', [AuthController::class, 'createApiKey'])->name('auth_create_api_key');
        Route::delete('/api-keys/{key_id}', [AuthController::class, 'revokeApiKey'])->name('auth_revoke_api_key');
    });

    Route::prefix('users')->group(function (): void {
        Route::post('', [UserController::class, 'store'])->name('users_create_user');
        Route::get('/{user_id}', [UserController::class, 'show'])->name('users_get_user');
    });

    Route::prefix('tenants')->group(function (): void {
        Route::get('', [TenantController::class, 'index'])->name('tenants_list');
        Route::post('', [TenantController::class, 'store'])->name('tenants_create');
        Route::get('/current', [TenantController::class, 'current'])->name('tenants_get_current');
        Route::get('/current/modules', [TenantController::class, 'listModules'])->name('tenants_list_modules');
        Route::post('/current/modules/{module_id}/activate', [TenantController::class, 'activateModule'])->name('tenants_activate_module');
        Route::post('/current/modules/{module_id}/deactivate', [TenantController::class, 'deactivateModule'])->name('tenants_deactivate_module');
        Route::get('/current/plugins', [TenantController::class, 'listPlugins'])->name('tenants_list_plugins');
        Route::post('/current/plugins/{plugin_id}/activate', [TenantController::class, 'activatePlugin'])->name('tenants_activate_plugin');
        Route::post('/current/plugins/{plugin_id}/deactivate', [TenantController::class, 'deactivatePlugin'])->name('tenants_deactivate_plugin');
        Route::get('/{tenant_id}', [TenantController::class, 'show'])->name('tenants_get');
        Route::patch('/{tenant_id}', [TenantController::class, 'update'])->name('tenants_update');
        Route::delete('/{tenant_id}', [TenantController::class, 'destroy'])->name('tenants_delete');
        Route::post('/{tenant_id}/restore', [TenantController::class, 'restore'])->name('tenants_restore');
    });
});
