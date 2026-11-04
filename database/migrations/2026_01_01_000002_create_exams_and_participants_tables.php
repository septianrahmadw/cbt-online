<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subject_name', 150);
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->dateTime('exam_date')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('randomize_questions')->default(true);
            $table->unsignedTinyInteger('passing_grade')->default(70);
            $table->unsignedSmallInteger('total_questions')->default(0);
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->string('exam_number', 50)->unique();
            $table->string('full_name', 150);
            $table->string('nisn', 30)->nullable();
            $table->string('class_name', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('full_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
        Schema::dropIfExists('exams');
    }
};
