<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispute_evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispute_id')->constrained('disputes')->cascadeOnDelete();
            $table->string('document_url')->comment('URL do documento enviado');
            $table->string('woovi_url')->nullable()->comment('URL retornada pela Woovi');
            $table->string('description')->nullable();
            $table->string('correlation_id')->nullable();
            $table->string('status')->default('sent')->comment('sent, accepted, failed');
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('dispute_id');
        });

        Schema::table('disputes', function (Blueprint $table) {
            $table->boolean('auto_defense')->default(false)->after('resolved_at');
            $table->timestamp('evidence_sent_at')->nullable()->after('auto_defense');
            $table->text('dossier_html')->nullable()->after('evidence_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            $table->dropColumn(['auto_defense', 'evidence_sent_at', 'dossier_html']);
        });
        Schema::dropIfExists('dispute_evidences');
    }
};
