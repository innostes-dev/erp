<?php

namespace App\Http\Controllers;

use App\Kernel\OpenApi\SpecBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class SystemController extends Controller
{
    public function root(): JsonResponse
    {
        return $this->json([
            'service' => config('kernel.name'),
            'environment' => config('kernel.environment'),
            'status' => 'online',
            'modules' => ['auth', 'setup', 'tenancy', 'user', 'audit'],
        ]);
    }

    public function config(): JsonResponse
    {
        return $this->json([
            'service' => config('kernel.name'),
            'version' => config('kernel.version'),
            'environment' => config('kernel.environment'),
        ]);
    }

    public function health(): JsonResponse
    {
        $started = microtime(true);
        try {
            DB::select('select 1');
            $database = ['status' => 'HEALTHY', 'latency_ms' => round((microtime(true) - $started) * 1000, 2), 'error' => null];
        } catch (Throwable $e) {
            $database = ['status' => 'UNHEALTHY', 'latency_ms' => null, 'error' => (new \ReflectionClass($e))->getShortName()];
        }
        $healthy = $database['status'] === 'HEALTHY';

        return $this->json([
            'status' => $healthy ? 'pass' : 'fail',
            'environment' => config('kernel.environment'),
            'database' => $database,
            'modules' => new \stdClass,
        ], $healthy ? 200 : 503);
    }

    public function openapi(): JsonResponse
    {
        return $this->json(app(SpecBuilder::class)->build());
    }
}
