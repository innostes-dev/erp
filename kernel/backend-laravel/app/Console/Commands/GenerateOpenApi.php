<?php

namespace App\Console\Commands;

use App\Kernel\OpenApi\SpecBuilder;
use Illuminate\Console\Command;

class GenerateOpenApi extends Command
{
    protected $signature = 'kernel:openapi {--path= : Output file (default: openapi.json in the project root)}';

    protected $description = 'Generate openapi.json from the registered kernel routes';

    public function handle(SpecBuilder $builder): int
    {
        $path = (string) ($this->option('path') ?: base_path('openapi.json'));
        $json = json_encode($builder->build(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        file_put_contents($path, $json."\n");
        $this->info("Wrote {$path}");

        return self::SUCCESS;
    }
}
