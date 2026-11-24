<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Applies the reference kernel schema (database/schema/kernel.sql, generated from the
 * FastAPI Alembic migrations) so one PostgreSQL database can be served by the FastAPI,
 * Laravel or NestJS kernel interchangeably.
 *
 * It is a no-op when the schema already exists (created by Alembic or another backend).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tenants')) {
            return;
        }

        $sql = file_get_contents(database_path('schema/kernel.sql'));
        if ($sql === false) {
            throw new RuntimeException('Missing database/schema/kernel.sql');
        }

        DB::unprepared($sql);
    }

    public function down(): void
    {
        // Intentionally empty: the schema is shared with the other kernel backends,
        // so rolling this migration back must never drop their tables.
    }
};
