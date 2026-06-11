<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // nome da integração (ex: "Site Principal", "App Mobile")
            $table->string('key', 64)->unique(); // a API key
            $table->string('secret', 128)->nullable(); // secret pra assinar requests (HMAC)
            $table->enum('status', ['active', 'inactive', 'revoked'])->default('active');
            $table->json('permissions')->nullable(); // permissões: ["charge:create", "charge:read", etc]
            $table->json('allowed_ips')->nullable(); // IPs permitidos (null = qualquer)
            $table->timestamp('last_used_at')->nullable();
            $table->string('last_used_ip', 45)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_keys');
    }
};
