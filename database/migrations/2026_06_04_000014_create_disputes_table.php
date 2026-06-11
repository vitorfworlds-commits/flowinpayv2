<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_id')->nullable()->constrained('charges')->nullOnDelete();
            $table->string('external_id')->nullable()->comment('ID da contestação na adquirente');
            $table->string('type')->default('chargeback')->comment('chargeback, fraud, complaint, other');
            $table->string('status')->default('open')->comment('open, under_review, accepted, rejected, cancelled, resolved');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('BRL');
            $table->string('reason')->nullable();
            $table->text('description')->nullable();
            $table->text('evidence')->nullable()->comment('JSON com evidências enviadas');
            $table->text('resolution')->nullable();
            $table->string('acquirer')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'type']);
            $table->index('external_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
