<?php

namespace App\Http\Controllers;

use App\Http\Requests\SetupRequest;
use App\Kernel\Services\SetupService;
use App\Kernel\Services\SetupState;
use App\Kernel\Services\SetupToken;
use Illuminate\Http\JsonResponse;

class SetupController extends Controller
{
    public function __construct(
        private readonly SetupService $setup,
        private readonly SetupState $state,
        private readonly SetupToken $token,
    ) {}

    public function status(): JsonResponse
    {
        if (! $this->setup->databaseConnected()) {
            throw SetupState::databaseUnavailable();
        }

        return $this->json(['installed' => $this->state->isInstalled()]);
    }

    public function checks(): JsonResponse
    {
        return $this->json($this->setup->checks());
    }

    public function install(SetupRequest $request): JsonResponse
    {
        $result = $this->setup->install($request->validated());
        $this->token->discard();

        return $this->json($result, 201);
    }
}
