<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // dono da cobrança
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('tax_id')->nullable(); // CPF ou CNPJ
            $table->json('address')->nullable();
            $table->timestamps();

            $table->index('tax_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
