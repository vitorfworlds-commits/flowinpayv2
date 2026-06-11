<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('subaccount_pix_key')->nullable()->after('pix_key');
            $table->string('subaccount_id')->nullable()->after('subaccount_pix_key');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subaccount_pix_key', 'subaccount_id']);
        });
    }
};
