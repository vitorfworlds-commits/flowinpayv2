<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('acquirer_id')->constrained()->onDelete('cascade');
            $table->string('event_type'); // OPENPIX:CHARGE_COMPLETED, etc
            $table->string('correlation_id')->nullable();
            $table->json('payload'); // payload completo recebido
            $table->enum('status', ['received', 'processed', 'failed', 'ignored'])->default('received');
            $table->text('error_message')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('signature')->nullable(); // assinatura do webhook
            $table->timestamps();

            $table->index('event_type');
            $table->index('correlation_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
