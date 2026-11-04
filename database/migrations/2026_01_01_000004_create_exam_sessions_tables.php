<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained()->cascadeOnDelete();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->unsignedInteger('remaining_seconds')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->unsignedTinyInteger('violations_count')->default(0);
            $table->enum('status', ['active', 'submitted', 'forced_submit'])->default('active');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->tinyInteger('active_key')->nullable()->storedAs("CASE WHEN status = 'active' THEN 1 ELSE NULL END");
            $table->timestamps();

            $table->unique(['exam_id', 'participant_id', 'active_key'], 'uq_active_session');
            $table->index('status');
            $table->index('participant_id');
        });

        Schema::create('exam_session_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('display_order');
            $table->timestamps();

            $table->unique(['session_id', 'display_order']);
            $table->unique(['session_id', 'question_id']);
        });

        Schema::create('student_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('selected_option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->boolean('is_doubtful')->default(false);
            $table->dateTime('answered_at')->nullable();
            $table->timestamps();

            $table->unique(['session_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_answers');
        Schema::dropIfExists('exam_session_questions');
        Schema::dropIfExists('exam_sessions');
    }
};
