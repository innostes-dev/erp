<?php

namespace App\Kernel\Services;

use App\Kernel\Exceptions\ErrorCode;
use App\Kernel\Exceptions\ServiceException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** Whether the first-run setup was completed (an `installation` row exists). */
class SetupState
{
    /** Installation is permanent, so a positive answer is cached for the life of the process. */
    private static bool $installed = false;

    public static function databaseUnavailable(): ServiceException
    {
        return ServiceException::unavailable('Cannot connect to the database', ErrorCode::DATABASE_UNAVAILABLE);
    }

    /**
     * @throws ServiceException 503 database_unavailable when the database cannot be queried; an unreachable
     *                          database must never be mistaken for "not installed".
     */
    public function isInstalled(): bool
    {
        if (self::$installed) {
            return true;
        }
        try {
            if (! Schema::hasTable('installation')) {
                return false;
            }
            self::$installed = DB::table('installation')->where('singleton', true)->exists();
        } catch (Throwable) {
            throw self::databaseUnavailable();
        }

        return self::$installed;
    }

    public function markInstalled(): void
    {
        self::$installed = true;
    }

    public static function reset(): void
    {
        self::$installed = false;
    }
}
