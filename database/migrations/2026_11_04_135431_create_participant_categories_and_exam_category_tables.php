<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participant_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('participants', function (Blueprint $table) {
            $table->foreignId('category_id')
                ->nullable()
                ->after('class_name')
                ->constrained('participant_categories')
                ->nullOnDelete();
            $table->index('category_id');
        });

        Schema::create('exam_participant_category', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_category_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['exam_id', 'participant_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_participant_category');

        Schema::table('participants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::dropIfExists('participant_categories');
    }
};
