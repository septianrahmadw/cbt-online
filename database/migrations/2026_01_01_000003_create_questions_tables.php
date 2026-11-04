<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('question_number');
            $table->longText('question_text');
            $table->string('image_url')->nullable();
            $table->decimal('score_weight', 5, 2)->default(1);
            $table->timestamps();

            $table->unique(['exam_id', 'question_number']);
            $table->index('exam_id');
        });

        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->enum('label', ['A', 'B', 'C', 'D', 'E']);
            $table->longText('option_text')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->unique(['question_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
    }
};
