<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('default_acquirer_id')->nullable()->after('email')->constrained('acquirers')->nullOnDelete();
        });

        Schema::table('acquirers', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->after('base_url');
            $table->string('color')->nullable()->after('logo_url')->default('#22c55e');
            $table->decimal('fee_percent', 5, 2)->default(0)->after('color');
            $table->decimal('fee_fixed', 8, 2)->default(0)->after('fee_percent');
            $table->string('description')->nullable()->after('fee_fixed');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_acquirer_id']);
            $table->dropColumn('default_acquirer_id');
        });
        Schema::table('acquirers', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'color', 'fee_percent', 'fee_fixed', 'description']);
        });
    }
};
