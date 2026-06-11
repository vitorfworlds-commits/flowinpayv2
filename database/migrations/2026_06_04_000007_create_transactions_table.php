<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'charge_received',  // pagamento recebido
                'charge_fee',       // taxa da cobrança
                'withdrawal',       // saque solicitado
                'withdrawal_fee',   // taxa do saque
                'refund',           // reembolso
                'adjustment',       // ajuste manual
            ]);
            $table->decimal('amount', 15, 2); // valor (positivo=entrada, negativo=saida)
            $table->decimal('balance_before', 15, 2); // saldo antes
            $table->decimal('balance_after', 15, 2); // saldo depois
            $table->string('reference_type')->nullable(); // charge, withdrawal, etc
            $table->unsignedBigInteger('reference_id')->nullable(); // ID da referência
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
