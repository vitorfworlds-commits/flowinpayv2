<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_config', function (Blueprint $table) {
            $table->decimal('minimum_withdrawal', 10, 2)->default(5.00)->after('maximum_charge');
            $table->decimal('maximum_withdrawal', 10, 2)->default(1000.00)->after('minimum_withdrawal');
        });

        DB::table('fee_config')->where('id', 1)->update([
            'minimum_withdrawal' => 5.00,
            'maximum_withdrawal' => 1000.00,
        ]);
    }

    public function down(): void
    {
        Schema::table('fee_config', function (Blueprint $table) {
            $table->dropColumn(['minimum_withdrawal', 'maximum_withdrawal']);
        });
    }
};
