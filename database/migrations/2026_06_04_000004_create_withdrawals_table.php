<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('acquirer_id')->constrained()->onDelete('cascade');
            $table->decimal('value', 15, 2); // valor do saque
            $table->decimal('fee_value', 15, 2)->default(0); // taxa do saque
            $table->decimal('net_value', 15, 2)->default(0); // valor líquido
            $table->string('pix_key'); // chave pix destino
            $table->enum('pix_key_type', ['cpf', 'cnpj', 'email', 'phone', 'random'])->default('random');
            $table->enum('status', [
                'pending',    // aguardando processamento
                'processing', // sendo processado
                'completed',  // saque concluído
                'failed',     // falhou
                'cancelled',  // cancelado
            ])->default('pending');
            $table->text('acquirer_response')->nullable();
            $table->string('transaction_id')->nullable(); // ID da transação na adquirente
            $table->timestamp('processed_at')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
