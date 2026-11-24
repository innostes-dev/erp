<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The reference schema declares api_keys.key_prefix as VARCHAR(16), but the documented prefix format is the
 * first 14 characters of the key plus "..." (17 characters), so every key insert overflows the column
 * (one root cause of the FastAPI "POST /auth/api-keys returns 500" defect). Widening is safe, idempotent and
 * backwards compatible with rows written by any other backend.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE api_keys ALTER COLUMN key_prefix TYPE VARCHAR(32)');
    }

    public function down(): void
    {
        // Intentionally empty: shrinking would truncate existing prefixes.
    }
};
