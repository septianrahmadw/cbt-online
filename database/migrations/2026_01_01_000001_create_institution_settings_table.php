<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institution_settings', function (Blueprint $table) {
            $table->id();
            $table->string('school_name')->default('Sekolah Anda');
            $table->string('logo_url')->nullable();
            $table->string('academic_year', 20)->nullable();
            $table->string('exam_event_name')->nullable();
            $table->unsignedTinyInteger('passing_grade_default')->default(70);
            $table->string('timezone', 64)->default('Asia/Jakarta');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_settings');
    }
};
