<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('acquirer_id')->constrained()->onDelete('cascade');
            $table->string('correlation_id')->unique();
            $table->string('acquirer_correlation_id')->nullable(); // correlation_id retornado pela adquirente
            $table->decimal('value', 15, 2); // valor em reais
            $table->decimal('fee_value', 15, 2)->default(0); // taxa cobrada
            $table->decimal('fee_percent', 5, 2)->default(0); // percentual da taxa
            $table->enum('status', [
                'pending',    // aguardando pagamento
                'active',     // cobrança ativa, aguardando
                'paid',       // pago
                'completed',  // liquidado
                'expired',    // expirado
                'cancelled',  // cancelado
                'refunded',   // estornado
            ])->default('pending');
            $table->string('pix_key')->nullable(); // chave pix da cobrança
            $table->text('br_code')->nullable(); // payload PIX
            $table->string('payment_link_url')->nullable();
            $table->string('qr_code_image')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('description')->nullable();
            $table->json('additional_info')->nullable();
            $table->text('acquirer_response')->nullable(); // resposta completo da adquirente
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
