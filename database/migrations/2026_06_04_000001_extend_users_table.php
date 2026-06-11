<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('pix_key')->nullable()->after('email');
            $table->decimal('balance', 15, 2)->default(0)->after('pix_key');
            $table->decimal('balance_blocked', 15, 2)->default(0)->after('balance');
            $table->string('tax_id')->nullable()->after('balance_blocked');
            $table->string('phone')->nullable()->after('tax_id');
            $table->enum('status', ['active', 'inactive', 'pending'])->default('active')->after('phone');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'pix_key', 'balance', 'balance_blocked',
                'tax_id', 'phone', 'status'
            ]);
        });
    }
};
