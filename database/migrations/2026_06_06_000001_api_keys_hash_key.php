<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->string('key_prefix', 16)->nullable()->after('name');
            $table->string('key_hash', 255)->nullable()->after('key_prefix');
        });

        // Invalidar todas as keys existentes (não podem ser migradas para hash porque
        // não temos o plaintext original armazenado de forma recuperável)
        \DB::table('api_keys')->update([
            'status' => 'revoked',
            'deleted_at' => now(),
        ]);

        Schema::table('api_keys', function (Blueprint $table) {
            $table->dropColumn('key');
            $table->index('key_prefix');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('api_keys', function (Blueprint $table) {
            $table->string('key', 255)->nullable();
        });

        Schema::table('api_keys', function (Blueprint $table) {
            $table->dropIndex(['key_prefix']);
            $table->dropColumn(['key_prefix', 'key_hash']);
        });
    }
};
