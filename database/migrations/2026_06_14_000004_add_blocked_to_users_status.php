<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY status ENUM('active', 'inactive', 'pending', 'blocked') DEFAULT 'active'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY status ENUM('active', 'inactive', 'pending') DEFAULT 'active'");
    }
};
