<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * 0010 identities + credentials (expand step). Applies database/schema/0010_identities_credentials.sql,
 * which is a verbatim copy of the FastAPI reference file kernel/backend/migrations/sql/ (checked by
 * scripts/parity/check-shared-sql.mjs). The SQL is idempotent, so it is safe when FastAPI or NestJS
 * already applied it to the shared database.
 */
return new class extends Migration
{
    public function up(): void
    {
        $sql = file_get_contents(database_path('schema/0010_identities_credentials.sql'));
        if ($sql === false) {
            throw new RuntimeException('Missing database/schema/0010_identities_credentials.sql');
        }

        DB::unprepared($sql);
    }

    public function down(): void
    {
        // Intentionally empty: the tables are shared with the other kernel backends.
    }
};
