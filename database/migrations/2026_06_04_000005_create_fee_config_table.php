<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_config', function (Blueprint $table) {
            $table->id();
            $table->decimal('percentual', 5, 2)->default(2.00); // 2%
            $table->decimal('fixed_value', 10, 2)->default(1.00); // R$1,00
            $table->decimal('withdrawal_fee', 10, 2)->default(3.49); // R$3,49
            $table->decimal('minimum_charge', 10, 2)->default(2.00); // valor mínimo da cobrança (lowticket)
            $table->decimal('maximum_charge', 15, 2)->default(150.00); // valor máximo (lowticket)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_config');
    }
};
