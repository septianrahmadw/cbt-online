<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->unsignedSmallInteger('total_correct')->default(0);
            $table->unsignedSmallInteger('total_wrong')->default(0);
            $table->unsignedSmallInteger('total_empty')->default(0);
            $table->decimal('final_score', 5, 2)->default(0);
            $table->enum('passing_status', ['lulus', 'belum_lulus'])->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->unique('session_id');
            $table->index('exam_id');
            $table->index('participant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
