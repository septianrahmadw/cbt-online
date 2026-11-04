<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('color')->default('brand');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('module_id')
                ->nullable()
                ->after('exam_id')
                ->constrained('modules')
                ->nullOnDelete();
            $table->index('module_id');
        });

        DB::table('modules')->insert([
            'name' => 'Umum',
            'code' => 'umum',
            'color' => 'slate',
            'sort_order' => 0,
            'is_active' => true,
            'description' => 'Modul default untuk soal umum.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('module_id');
        });

        Schema::dropIfExists('modules');
    }
};
