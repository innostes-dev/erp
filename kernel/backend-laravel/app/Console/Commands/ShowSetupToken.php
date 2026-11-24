<?php

namespace App\Console\Commands;

use App\Kernel\Services\SetupState;
use App\Kernel\Services\SetupToken;
use Illuminate\Console\Command;

class ShowSetupToken extends Command
{
    protected $signature = 'kernel:setup-token';

    protected $description = 'Print the one-time X-Setup-Token (generated into SETUP_TOKEN_FILE when SETUP_TOKEN is not set)';

    public function handle(SetupToken $token, SetupState $state): int
    {
        if ($state->isInstalled()) {
            $this->warn('The platform is already installed; the setup endpoints are disabled.');

            return self::FAILURE;
        }
        $this->line($token->value());

        return self::SUCCESS;
    }
}
