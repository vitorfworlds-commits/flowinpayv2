<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acquirers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // OpenPix, PagSeguro, etc
            $table->string('slug')->unique(); // openpix, pagseguro
            $table->text('api_key');
            $table->text('api_secret')->nullable();
            $table->enum('environment', ['sandbox', 'production'])->default('sandbox');
            $table->string('base_url');
            $table->boolean('is_active')->default(true);
            $table->json('config')->nullable(); // configurações extras
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acquirers');
    }
};
